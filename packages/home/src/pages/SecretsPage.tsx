import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Eye, EyeOff, Trash2, Lock, Users } from 'lucide-react'

import { useDistriHomeClient } from '../provider/context'
import type { AccessType, SecretRow } from '../DistriHomeClient'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@distri/components'

/**
 * Single settings page for all secrets visible to the current user:
 * every workspace-scope row and the caller's own user-scope rows, under
 * two category headers. Rows whose key starts with `connection.` are
 * marked "managed by connection" and are read-only here — they're edited
 * through the connection's own EditConnection form (or via the user-configure
 * URL after a bot-gate miss).
 */
export default function SecretsPage() {
  const homeClient = useDistriHomeClient()
  const [rows, setRows] = useState<SecretRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newAccessType, setNewAccessType] = useState<AccessType>('workspace')

  const load = useCallback(async () => {
    if (!homeClient) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await homeClient.listScopedSecrets()
      setRows(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load secrets')
    } finally {
      setLoading(false)
    }
  }, [homeClient])

  useEffect(() => {
    load()
  }, [load])

  const { workspaceRows, userRows } = useMemo(() => {
    const ws: SecretRow[] = []
    const us: SecretRow[] = []
    for (const r of rows) {
      if (r.access_type === 'workspace') ws.push(r)
      else us.push(r)
    }
    return { workspaceRows: ws, userRows: us }
  }, [rows])

  const handleReveal = async (id: string) => {
    if (!homeClient) return
    if (revealed[id]) {
      // Toggle off
      setRevealed((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      return
    }
    try {
      const res = await homeClient.revealSecretValue(id)
      setRevealed((prev) => ({ ...prev, [id]: res.value }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reveal secret')
    }
  }

  const handleDelete = async (id: string) => {
    if (!homeClient) return
    if (!window.confirm('Delete this secret?')) return
    try {
      await homeClient.deleteScopedSecret(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete secret')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!homeClient) return
    if (!newKey.trim() || !newValue.trim()) {
      setError('Key and value are required')
      return
    }
    try {
      const row = await homeClient.upsertScopedSecret({
        access_type: newAccessType,
        key: newKey.trim(),
        value: newValue.trim(),
      })
      // Replace or append based on id.
      setRows((prev) => {
        const filtered = prev.filter((r) => r.id !== row.id)
        return [...filtered, row]
      })
      setCreating(false)
      setNewKey('')
      setNewValue('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save secret')
    }
  }

  const renderRow = (row: SecretRow) => {
    const isManagedByConnection = row.key.startsWith('connection.')
    const revealedValue = revealed[row.id]
    return (
      <div
        key={row.id}
        className="flex items-center gap-3 border-b border-border px-4 py-2 text-sm last:border-b-0"
      >
        <code className="flex-1 font-mono text-xs text-foreground">{row.key}</code>
        <code className="w-64 truncate font-mono text-xs text-muted-foreground">
          {revealedValue ?? '••••••••'}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={() => handleReveal(row.id)}>
          {revealedValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        {!isManagedByConnection && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        {isManagedByConnection && (
          <span className="text-xs text-muted-foreground">managed by connection</span>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Secrets</h1>
          <p className="text-xs text-muted-foreground">
            Workspace secrets are visible to every member; user-scoped secrets are only visible to you.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> New secret
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      {creating && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-md border border-border bg-card p-4"
        >
          <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto] items-end gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Scope</label>
              <Select
                value={newAccessType}
                onValueChange={(v) => setNewAccessType(v as AccessType)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workspace">Workspace</SelectItem>
                  <SelectItem value="user">User scoped (mine)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Key</label>
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="MY_API_KEY"
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Value</label>
              <Input
                type="password"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="••••••••"
                className="mt-1 font-mono"
              />
            </div>
            <Button type="submit" size="sm">
              Save
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-md border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Lock className="h-3 w-3" /> Workspace
              <span className="ml-auto text-[10px] font-normal normal-case">
                {workspaceRows.length} row{workspaceRows.length === 1 ? '' : 's'}
              </span>
            </div>
            {workspaceRows.length === 0 ? (
              <div className="px-4 py-4 text-xs text-muted-foreground">
                No workspace secrets yet.
              </div>
            ) : (
              workspaceRows.map(renderRow)
            )}
          </section>

          <section className="rounded-md border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Users className="h-3 w-3" /> User Scoped
              <span className="ml-auto text-[10px] font-normal normal-case">
                {userRows.length} row{userRows.length === 1 ? '' : 's'}
              </span>
            </div>
            {userRows.length === 0 ? (
              <div className="px-4 py-4 text-xs text-muted-foreground">
                No user-scoped secrets yet. Values you configure through a bot's /start link will appear here.
              </div>
            ) : (
              userRows.map(renderRow)
            )}
          </section>
        </div>
      )}
    </div>
  )
}
