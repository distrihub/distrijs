import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FileSaveHandler, FileWorkspaceStore } from '@distri/fs'
import { FileWorkspaceWithChat, IndexedDbFilesystem, createFileWorkspaceStore } from '@distri/fs'
import { useAgent } from '@distri/react'
import { Header } from '@/components/ui/header'
import { Button } from '@/components/ui/button'
import { BACKEND_URL } from '@/constants'
import { useInitialization } from '@/components/TokenProvider'
import { Loader2, RefreshCcw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { uuidv4 } from '@distri/core'

interface WorkspaceFile {
  path: string
  content: string
}

interface WorkspaceSnapshot {
  files: WorkspaceFile[]
  directories: string[]
  updated_at?: string
}

interface WorkspaceWriteResponse {
  saved: number
  deleted: number
  updated_at: string
}

const API_BASE_URL = `${BACKEND_URL}/api/v1`
const PROJECT_ID = 'distri-workspace'

const currentThreadId = (scope: string) => {
  if (typeof window === 'undefined') {
    return uuidv4()
  }
  const storageKey = `${scope}:threadId`
  const cached = window.localStorage.getItem(storageKey)
  if (cached) return cached
  const generated = uuidv4()
  window.localStorage.setItem(storageKey, generated)
  return generated
}

const FilesPage = () => {
  const { token } = useInitialization()
  const { agent, loading: agentLoading, error: agentError } = useAgent({ agentIdOrDef: 'scripter' })

  const filesystem = useMemo(() => IndexedDbFilesystem.forProject(PROJECT_ID), [])
  const storeRef = useRef<FileWorkspaceStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = createFileWorkspaceStore(PROJECT_ID, { filesystem })
  }
  const store = storeRef.current

  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [initialPaths, setInitialPaths] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  const threadId = useMemo(() => currentThreadId(PROJECT_ID), [])

  const authHeaders = useMemo(() => {
    if (!token) return undefined
    return { Authorization: `Bearer ${token}` }
  }, [token])

  const clearWorkspace = useCallback(async () => {
    const entries = await filesystem.listDirectory('', true)
    const sorted = entries
      .filter((entry) => entry && entry !== '.')
      .sort((a, b) => b.length - a.length)
    for (const entry of sorted) {
      await filesystem.deleteEntry(entry, true).catch(() => { })
    }
  }, [filesystem])

  const collectWorkspaceFiles = useCallback(async (): Promise<WorkspaceFile[]> => {
    const entries = await filesystem.listDirectory('', true)
    const files: WorkspaceFile[] = []
    for (const entry of entries) {
      if (!entry) continue
      try {
        const info = await filesystem.getFileInfo(entry)
        if (!info.is_file) {
          continue
        }
        const { content } = await filesystem.readFile(entry)
        files.push({ path: entry, content })
      } catch {
        // Ignore missing entries (they may have been deleted concurrently)
      }
    }
    return files
  }, [filesystem])

  const hydrateWorkspace = useCallback(
    async (snapshot: WorkspaceSnapshot) => {
      await clearWorkspace()
      for (const directory of snapshot.directories ?? []) {
        await filesystem.createDirectory(directory).catch(() => { })
      }
      for (const file of snapshot.files ?? []) {
        await filesystem.writeFile(file.path, file.content)
      }
      setInitialPaths(new Set(snapshot.files?.map((file) => file.path) ?? []))
      setLastSyncedAt(snapshot.updated_at ?? new Date().toISOString())
      await store.getState().refresh()
    },
    [clearWorkspace, filesystem, store],
  )

  const fetchSnapshot = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/files`, { headers: authHeaders })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to load workspace files')
      }
      const snapshot: WorkspaceSnapshot = await response.json()
      await hydrateWorkspace(snapshot)
      toast.success('Workspace refreshed from server')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load workspace files')
      toast.error(err instanceof Error ? err.message : 'Failed to load workspace files')
    } finally {
      setLoading(false)
    }
  }, [authHeaders, hydrateWorkspace, token])

  useEffect(() => {
    void fetchSnapshot()
  }, [fetchSnapshot])

  const handleSaveFile: FileSaveHandler = useCallback(async (tab) => {
    const response = await fetch(`${API_BASE_URL}/files`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeaders ?? {}),
      },
      body: JSON.stringify({ files: [{ path: tab.path, content: tab.content }] }),
    })
    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `Failed to save ${tab.path}`)
    }
    setInitialPaths((previous) => {
      const next = new Set(previous)
      next.add(tab.path)
      return next
    })
  }, [authHeaders, token])

  const handleSyncWorkspace = useCallback(async () => {
    setSyncing(true)
    try {
      const files = await collectWorkspaceFiles()
      const currentPaths = new Set(files.map((file) => file.path))
      const deletedPaths = Array.from(initialPaths).filter((path) => !currentPaths.has(path))

      const response = await fetch(`${API_BASE_URL}/files`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify({ files, deleted_paths: deletedPaths }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to sync workspace')
      }

      const payload: WorkspaceWriteResponse = await response.json()
      setInitialPaths(currentPaths)
      setLastSyncedAt(payload.updated_at)
      toast.success(`Workspace synced (${payload.saved} saved, ${payload.deleted} deleted)`) 
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to sync workspace')
    } finally {
      setSyncing(false)
    }
  }, [authHeaders, collectWorkspaceFiles, initialPaths, token])

  const refreshedAtLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString()
    : 'never'

  const isReady = !!agent && !agentLoading && !error && !loading

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Workspace Files"
        description="Edit agents, plugins, and runtime files directly from the active workspace."
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void fetchSnapshot()}
              disabled={loading || !token}
              className="gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => void handleSyncWorkspace()}
              disabled={syncing || loading || !token}
              className="gap-2"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Sync workspace
            </Button>
          </div>
        }
      />

      <div className="px-6 text-xs text-muted-foreground">
        Last synced: {refreshedAtLabel}
      </div>

      <div className="flex-1 px-6 pb-6">
        {error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {agentError ? (
          <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Unable to load the Scripter agent. Ensure it is registered before using the workspace chat.
          </div>
        ) : null}

        {isReady ? (
          <FileWorkspaceWithChat
            projectId={PROJECT_ID}
            filesystem={filesystem}
            store={store}
            onSaveFile={handleSaveFile}
            chat={{
              agent: agent!,
              threadId,
              title: 'Workspace assistant',
              initialMessage: 'Review the current workspace files and suggest improvements.',
            }}
            className="mt-4 h-[calc(100vh-220px)]"
          />
        ) : (
          <div className="mt-10 flex h-64 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Preparing workspace…
          </div>
        )}
      </div>
    </div>
  )
}

export default FilesPage
