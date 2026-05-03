import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button, Input } from '@distri/components';
import { useDistriHomeClient } from '../DistriHomeProvider';
import type { ModelProviderDefinition, UpsertProviderRequest } from '../DistriHomeClient';

// ---------------------------------------------------------------------------
// ProvidersManager — configure AI model providers.
// Uses DistriHomeClient.listProviders / upsertProvider / deleteProvider.
// ---------------------------------------------------------------------------

export interface ProvidersManagerProps {
  className?: string;
}

export function ProvidersManager({ className }: ProvidersManagerProps = {}) {
  const homeClient = useDistriHomeClient();

  const [providers, setProviders] = useState<ModelProviderDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!homeClient) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await homeClient.listProviders();
      setProviders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, [homeClient]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (provider: ModelProviderDefinition) => {
    if (!homeClient) return;
    const keysForProvider = provider.keys.map((k) => k.key);
    const secrets: Record<string, string> = {};
    for (const key of keysForProvider) {
      const val = secretValues[`${provider.id}.${key}`];
      if (val?.trim()) secrets[key] = val.trim();
    }
    if (Object.keys(secrets).length === 0) {
      setError('Enter at least one secret value to save.');
      return;
    }
    setSaving(provider.id);
    setError(null);
    try {
      const req: UpsertProviderRequest = {
        provider_id: provider.id,
        secrets,
      };
      await homeClient.upsertProvider(req);
      setSaved(provider.id);
      setTimeout(() => setSaved(null), 2000);
      // Clear secret fields after save
      setSecretValues((prev) => {
        const next = { ...prev };
        for (const key of keysForProvider) delete next[`${provider.id}.${key}`];
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save provider');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (providerId: string) => {
    if (!homeClient) return;
    if (!window.confirm(`Remove all configuration for this provider?`)) return;
    setDeleting(providerId);
    setError(null);
    try {
      await homeClient.deleteProvider(providerId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove provider');
    } finally {
      setDeleting(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div className={`flex flex-col gap-3 ${className ?? ''}`}>
      <p className="text-xs text-muted-foreground">
        Configure API keys for AI model providers. Keys are stored as workspace secrets.
      </p>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading providers…</div>
      ) : providers.length === 0 ? (
        <div className="rounded-md border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          No providers available.
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card divide-y divide-border">
          {providers.map((provider) => {
            const isExpanded = expanded === provider.id;
            const isSaving = saving === provider.id;
            const isSaved = saved === provider.id;
            const isDeleting = deleting === provider.id;

            return (
              <div key={provider.id}>
                {/* Provider row header */}
                <button
                  type="button"
                  onClick={() => toggleExpand(provider.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {provider.label}
                  </span>
                  {provider.is_custom && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      custom
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {provider.models.length} model{provider.models.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {/* Expanded form */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-muted/20 border-t border-border/50">
                    <div className="space-y-3">
                      {provider.keys.map((keyDef) => (
                        <div key={keyDef.key}>
                          <label className="text-xs font-medium text-muted-foreground">
                            {keyDef.label}
                            {keyDef.required && (
                              <span className="text-red-500 ml-0.5">*</span>
                            )}
                          </label>
                          <Input
                            type={keyDef.sensitive ? 'password' : 'text'}
                            placeholder={keyDef.placeholder}
                            value={secretValues[`${provider.id}.${keyDef.key}`] ?? ''}
                            onChange={(e) =>
                              setSecretValues((prev) => ({
                                ...prev,
                                [`${provider.id}.${keyDef.key}`]: e.target.value,
                              }))
                            }
                            className="mt-1 font-mono text-sm"
                          />
                        </div>
                      ))}

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleSave(provider)}
                          disabled={isSaving || isDeleting}
                        >
                          {isSaving ? 'Saving…' : isSaved ? 'Saved!' : 'Save keys'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(provider.id)}
                          disabled={isSaving || isDeleting}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          {isDeleting ? 'Removing…' : 'Remove'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
