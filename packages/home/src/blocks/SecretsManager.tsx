import React, { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Button, Input } from '@distri/components';
import { useDistriHomeClient } from '../DistriHomeProvider';
import type { Secret } from '../DistriHomeClient';

// ---------------------------------------------------------------------------
// SecretsManager — displays workspace secrets with create/delete/reveal.
// Uses DistriHomeClient.listSecrets / createSecret / deleteSecret.
// ---------------------------------------------------------------------------

export interface SecretsManagerProps {
  className?: string;
}

export function SecretsManager({ className }: SecretsManagerProps = {}) {
  const homeClient = useDistriHomeClient();

  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!homeClient) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await homeClient.listSecrets();
      setSecrets(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load secrets');
    } finally {
      setLoading(false);
    }
  }, [homeClient]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleReveal = (id: string, maskedValue: string) => {
    if (revealed[id]) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      // OSS server doesn't have a reveal endpoint — show masked value as-is
      setRevealed((prev) => ({ ...prev, [id]: maskedValue }));
    }
  };

  const handleDelete = async (key: string) => {
    if (!homeClient) return;
    if (!window.confirm(`Delete secret "${key}"?`)) return;
    try {
      await homeClient.deleteSecret(key);
      setSecrets((prev) => prev.filter((s) => s.key !== key));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete secret');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeClient) return;
    if (!newKey.trim() || !newValue.trim()) {
      setError('Key and value are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await homeClient.createSecret(newKey.trim(), newValue.trim());
      setSecrets((prev) => {
        const filtered = prev.filter((s) => s.key !== saved.key);
        return [...filtered, saved];
      });
      setCreating(false);
      setNewKey('');
      setNewValue('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save secret');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Secrets are injected as environment variables when agents run.
        </p>
        <Button size="sm" onClick={() => setCreating(true)} disabled={creating}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New secret
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* New secret form */}
      {creating && (
        <form
          onSubmit={handleCreate}
          className="rounded-md border border-border bg-card p-4"
        >
          <div className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Key</label>
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="MY_API_KEY"
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Value</label>
              <Input
                type="password"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="••••••••"
                className="mt-1 font-mono text-sm"
              />
            </div>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setCreating(false);
                setNewKey('');
                setNewValue('');
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : secrets.length === 0 ? (
        <div className="rounded-md border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          No secrets yet.
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card divide-y divide-border">
          {secrets.map((secret) => {
            const revealedValue = revealed[secret.id];
            return (
              <div
                key={secret.id}
                className="flex items-center gap-3 px-4 py-2.5 text-sm"
              >
                <code className="flex-1 font-mono text-xs text-foreground truncate">
                  {secret.key}
                </code>
                <code className="w-52 truncate font-mono text-xs text-muted-foreground">
                  {revealedValue ?? secret.masked_value ?? '••••••••'}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleReveal(secret.id, secret.masked_value)}
                  className="h-7 w-7 p-0"
                >
                  {revealedValue ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(secret.key)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
