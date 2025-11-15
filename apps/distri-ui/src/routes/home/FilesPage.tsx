import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FileSaveHandler, FileWorkspaceStore } from '@distri/fs'
import { FileWorkspace, IndexedDbFilesystem, createFileWorkspaceStore } from '@distri/fs'
import { useAgent, Chat, type DistriAnyTool } from '@distri/react'
import { BACKEND_URL } from '@/constants'
import { useInitialization } from '@/components/TokenProvider'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uuidv4 } from '@distri/core'
import { createFilesystemTools, ScriptRunnerTool } from '@distri/fs'
import { Files, MessageSquare } from 'lucide-react'

interface WorkspaceMetadataEntry {
  path: string
  is_dir: boolean
  size: number
  modified: string
}

interface WorkspaceMetadataResponse {
  files: WorkspaceMetadataEntry[]
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

const encodeWorkspacePath = (path: string) =>
  path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')

const FilesPage = () => {
  const { token } = useInitialization()
  const { agent, loading: agentLoading, error: agentError } = useAgent({ agentIdOrDef: 'coder' })

  const filesystem = useMemo(() => IndexedDbFilesystem.forProject(PROJECT_ID), [])
  const storeRef = useRef<FileWorkspaceStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = createFileWorkspaceStore(PROJECT_ID, { filesystem })
  }
  const store = storeRef.current

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workspaceReady, setWorkspaceReady] = useState(false)

  const threadId = useMemo(() => currentThreadId(PROJECT_ID), [])

  const authHeaders = useMemo(() => {
    if (!token) return undefined
    return { Authorization: `Bearer ${token}` }
  }, [token])

  const applyMetadata = useCallback(
    async (entries: WorkspaceMetadataEntry[]) => {
      const sorted = [...entries].sort((a, b) => a.path.split('/').length - b.path.split('/').length)
      for (const entry of sorted) {
        const timestamp = entry.modified ? Date.parse(entry.modified) : Date.now()
        if (entry.is_dir) {
          await filesystem.upsertMetadata(entry.path, 'directory', timestamp).catch(() => { })
        } else {
          await filesystem.upsertMetadata(entry.path, 'file', timestamp)
        }
      }
      await store.getState().refresh()
      setWorkspaceReady(true)
    },
    [filesystem, store],
  )

  const fetchMetadata = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/files/metadata`, { headers: authHeaders })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to load workspace files')
      }
      const snapshot: WorkspaceMetadataResponse = await response.json()
      await applyMetadata(snapshot.files)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load workspace files')
      toast.error(err instanceof Error ? err.message : 'Failed to load workspace files')
    } finally {
      setLoading(false)
    }
  }, [applyMetadata, authHeaders])

  useEffect(() => {
    const hydrateFromCache = async () => {
      try {
        await store.getState().refresh()
        setWorkspaceReady(true)
      } catch (err) {
        console.error('Failed to hydrate local workspace cache', err)
      }
    }
    void hydrateFromCache()
  }, [store])

  useEffect(() => {
    if (!workspaceReady) {
      return
    }
    void fetchMetadata()
  }, [workspaceReady, fetchMetadata])

  useEffect(() => {
    filesystem.setRemoteFetcher(async (path, currentVersion) => {
      const encoded = encodeWorkspacePath(path)
      const headers: Record<string, string> = { ...(authHeaders ?? {}) }
      if (currentVersion) {
        headers['If-Modified-Since'] = new Date(currentVersion).toUTCString()
      }
      const resp = await fetch(`${API_BASE_URL}/files/${encoded}`, { headers })
      if (resp.status === 304) {
        return null
      }
      if (resp.status === 404) {
        return { content: '', updatedAt: Date.now() }
      }
      if (!resp.ok) {
        const message = await resp.text()
        throw new Error(message || `Failed to load workspace file ${path}`)
      }
      const data = await resp.json()
      return {
        content: data.content ?? '',
        updatedAt: data.updated_at ? Date.parse(data.updated_at) : Date.now(),
      }
    })
  }, [authHeaders, filesystem])

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

    toast.success('Saved', { description: tab.path, duration: 1500 })
  }, [authHeaders])

  const isReady = workspaceReady && !!agent && !agentLoading

  // Build filesystem tools for chat (so the coder agent can operate on the workspace)
  const filesystemTools = useMemo(() => (
    createFilesystemTools(PROJECT_ID, {
      filesystem,
      onChange: (event) => {
        void store.getState().handleExternalChange(event)
      },
    })
  ), [filesystem, store])

  const uiTools = useMemo<DistriAnyTool[]>(() => [ScriptRunnerTool], [])
  const externalTools = useMemo(() => [...filesystemTools, ...uiTools], [filesystemTools, uiTools])

  const [activeSidebarTab, setActiveSidebarTab] = useState<'files' | 'chat'>('files')

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      {error ? (
        <div className="border-b border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {agentError ? (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-200">
          Unable to load the Coder agent. Ensure it is registered before using the workspace chat.
        </div>
      ) : null}

      <div className="flex-1 min-h-0 bg-card">
        {isReady ? (
          <div className="relative flex h-full w-full gap-3 bg-card text-foreground">
            {/* Sidebar toggle rail */}
            <div className="flex w-12 flex-col items-center gap-2 border border-border/60 bg-muted/20 py-3">
              {[
                { id: 'files' as const, icon: Files, label: 'Project files' },
                { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSidebarTab(item.id)}
                  className={[
                    'flex h-10 w-10 items-center justify-center text-muted-foreground transition hover:text-foreground rounded',
                    activeSidebarTab === item.id ? 'bg-primary/10 text-primary' : '',
                  ].join(' ')}
                  aria-label={item.label}
                >
                  <item.icon className="h-5 w-5" />
                </button>
              ))}
            </div>

            {/* Workspace with switchable sidebar (explorer or chat) */}
            <div className="flex min-w-0 flex-1 overflow-hidden">
              <FileWorkspace
                projectId={PROJECT_ID}
                filesystem={filesystem}
                store={store}
                onSaveFile={handleSaveFile}
                onSyncWorkspace={() => void fetchMetadata()}
                isSyncingWorkspace={loading}
                className="h-full"
                sidebarView={activeSidebarTab === 'chat' ? 'custom' : 'explorer'}
                sidebarCustom={activeSidebarTab === 'chat' ? (
                  <div className="flex h-full flex-col border border-border bg-background p-2 text-foreground">
                    <Chat
                      agent={agent!}
                      threadId={threadId}
                      externalTools={externalTools}
                      theme="auto"
                    />
                  </div>
                ) : undefined}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Preparing workspace…
          </div>
        )}
      </div>
    </div>
  )
}

export default FilesPage
