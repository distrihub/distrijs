import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Copy, KeyRound, Plus, Trash2 } from 'lucide-react';
import { Button, Input } from '@distri/components';
import { useApiKeys } from '../hooks/useApiKeys';
import type { ApiKey } from '../DistriHomeClient';

export interface ApiKeysManagerProps {
  className?: string;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * ApiKeysManager — list/create/revoke API keys.
 * Uses the shared useApiKeys hook (which calls DistriHomeClient).
 */
export function ApiKeysManager({ className }: ApiKeysManagerProps = {}) {
  const { keys, loading, error, createKey, revokeKey, refetch } = useApiKeys();

  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<{ id: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
  }, [creating]);

  const sortedKeys = useMemo(
    () => [...keys].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '')).reverse(),
    [keys],
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setLocalError('Label is required');
      return;
    }
    setSaving(true);
    setLocalError(null);
    try {
      const created = await createKey(label.trim());
      // OSS server returns the raw key on `key` (visible only once)
      const raw = (created as ApiKey & { value?: string }).key
        ?? (created as ApiKey & { value?: string }).value
        ?? '';
      setCreatedSecret({ id: created.id, key: raw });
      setLabel('');
      setCreating(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (key: ApiKey) => {
    if (!window.confirm(`Revoke API key "${key.label ?? key.id}"?`)) return;
    try {
      await revokeKey(key.id);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to revoke API key');
    }
  };

  const copyKey = async () => {
    if (!createdSecret?.key) return;
    try {
      await navigator.clipboard.writeText(createdSecret.key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className ?? ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Use API keys to authenticate programmatic access to your Distri server.
        </p>
        <Button size="sm" onClick={() => setCreating(true)} disabled={creating}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New API key
        </Button>
      </div>

      {(error || localError) && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <span>{localError ?? error}</span>
        </div>
      )}

      {createdSecret && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-foreground mb-2">
            Copy your API key now — it won't be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background border border-border px-2 py-1 font-mono text-xs">
              {createdSecret.key || '(server did not return key)'}
            </code>
            <Button size="sm" variant="outline" onClick={copyKey}>
              <Copy className="h-3.5 w-3.5 mr-1" />
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCreatedSecret(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {creating && (
        <form
          onSubmit={handleCreate}
          className="rounded-md border border-border bg-card p-4"
        >
          <div className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Label</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="ci-pipeline"
                className="mt-1 text-sm"
                autoFocus
              />
            </div>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving…' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setCreating(false);
                setLabel('');
                setLocalError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : sortedKeys.length === 0 ? (
        <div className="rounded-md border border-border bg-card px-4 py-8 text-center">
          <KeyRound className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No API keys yet.</p>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card divide-y divide-border">
          {sortedKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center gap-3 px-4 py-2.5 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{key.label ?? key.name ?? key.id}</p>
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(key.created_at)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRevoke(key)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                title="Revoke"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <button onClick={() => refetch()} className="underline-offset-2 hover:underline">
          Refresh
        </button>
      </div>
    </div>
  );
}
