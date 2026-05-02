import React, { useEffect, useState, type ReactNode } from 'react';
import { Plus, Trash2, ArrowLeft, Users, Lock, AlertCircle } from 'lucide-react';
import { Button, Input } from '@distri/components';
import { useDistriHome } from '../provider/context';
import { useDistriHomeClient } from '../DistriHomeProvider';
import type { AuthScope, AuthType, Connection } from './ConnectionList';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OAuthProviderInfo {
  name: string;
  available: boolean;
  default_scopes?: string[];
  scopes_supported?: string[];
}

export type ConnectionEditorMode = 'create' | 'edit';

export interface ConnectionEditorProps {
  mode: ConnectionEditorMode;
  connection?: Connection;
  defaultAuthScope?: AuthScope;
  existingConnections?: Connection[];
  onSaved: (c?: Connection) => void;
  onCancel: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const CUSTOM_PROVIDER = '__custom__';

function blankField() {
  return { key: '', label: null as string | null, is_secret: true, required: true };
}

const defaultSkillsValue =
  '# Include instructions on how to use your connection.\n\n- How to use APIs\n- How to Authorize';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScopeToggle({
  value,
  onChange,
  disabled,
}: {
  value: 'workspace' | 'user';
  onChange: (v: 'workspace' | 'user') => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden">
      {(['workspace', 'user'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(opt)}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition',
            value === opt
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            disabled ? 'cursor-not-allowed opacity-60' : '',
          ].join(' ')}
        >
          {opt === 'workspace' ? (
            <Users className="h-3.5 w-3.5" />
          ) : (
            <Lock className="h-3.5 w-3.5" />
          )}
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main block
// ---------------------------------------------------------------------------

/**
 * ConnectionEditor — create or edit a connection.
 * Strips workspace-scoping / multi-tenant logic; works for OSS single-user installs.
 * Cloud can inject extra provider tiles by pre-populating providers via a prop
 * (TODO: add `providers` prop when cloud override is wired in Task 16).
 */
export function ConnectionEditor({
  mode,
  connection,
  defaultAuthScope = 'workspace',
  existingConnections = [],
  onSaved,
  onCancel,
  className,
}: ConnectionEditorProps) {
  const homeClient = useDistriHomeClient();

  const [providers, setProviders] = useState<OAuthProviderInfo[]>([]);
  const [step, setStep] = useState<'pick' | 'configure'>(mode === 'edit' ? 'configure' : 'pick');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [providerKey, setProviderKey] = useState<string>(
    mode === 'edit' && connection?.auth_type.type === 'oauth'
      ? connection.auth_type.provider
      : CUSTOM_PROVIDER,
  );
  const [name, setName] = useState(mode === 'edit' ? (connection?.name ?? '') : '');
  const [scope, setScope] = useState<'workspace' | 'user'>(
    defaultAuthScope === 'user' ? 'user' : 'workspace',
  );
  const [fields, setFields] = useState<Array<ReturnType<typeof blankField>>>(
    mode === 'edit' && connection?.auth_type.type === 'custom' && connection.auth_type.fields.length
      ? connection.auth_type.fields.map((f) => ({
          key: f.key,
          label: f.label ?? null,
          is_secret: f.is_secret,
          required: f.required,
        }))
      : [blankField()],
  );
  const [skillContent, setSkillContent] = useState(defaultSkillsValue);
  const [oauthScopes, setOAuthScopes] = useState<string[]>(
    mode === 'edit' && connection?.auth_type.type === 'oauth'
      ? connection.auth_type.scopes
      : [],
  );
  const [workspaceValues, setWorkspaceValues] = useState<Record<string, string>>({});

  const isCustom = providerKey === CUSTOM_PROVIDER;

  // Load OAuth providers
  useEffect(() => {
    if (!homeClient) return;
    let cancelled = false;
    (homeClient as any).client
      ?.fetch('/oauth/providers')
      .then((r: Response) => r.json())
      .then((data: OAuthProviderInfo[]) => {
        if (!cancelled) setProviders(data ?? []);
      })
      .catch(() => {
        /* non-fatal */
      });
    return () => {
      cancelled = true;
    };
  }, [homeClient]);

  // When picking an OAuth provider, auto-fill scopes + name
  useEffect(() => {
    if (mode !== 'create' || providerKey === CUSTOM_PROVIDER) return;
    const info = providers.find((p) => p.name === providerKey);
    if (info && oauthScopes.length === 0) {
      setOAuthScopes(info.default_scopes ?? []);
    }
    setName(providerKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerKey, providers, mode]);

  const takenOAuthForScope = new Set(
    existingConnections
      .filter((c) => c.id !== connection?.id)
      .filter((c) => c.auth_type.type === 'oauth' && c.auth_scope === scope)
      .map((c) => (c.auth_type.type === 'oauth' ? c.auth_type.provider : '')),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!name.trim() && isCustom) {
      setSubmitError('Name is required');
      return;
    }
    const filteredFields = fields.filter((f) => f.key.trim());
    if (isCustom && filteredFields.length === 0) {
      setSubmitError('Add at least one field');
      return;
    }

    setSaving(true);
    try {
      let authType: AuthType;
      const resolvedName = name.trim() || providerKey;

      if (isCustom) {
        authType = {
          type: 'custom',
          fields: filteredFields.map((f) => ({
            key: f.key.trim(),
            label: f.label ?? null,
            is_secret: f.is_secret,
            required: f.required,
          })),
        };
      } else {
        authType = { type: 'oauth', provider: providerKey, scopes: oauthScopes };
      }

      const payload = {
        name: resolvedName,
        auth_scope: scope,
        auth_type: authType,
        ...(isCustom ? { skill_content: skillContent.trim(), secrets: workspaceValues } : {}),
      };

      if (mode === 'edit' && connection) {
        const updated = await (homeClient as any).client
          ?.fetch(`/connections/${connection.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          .then((r: Response) => r.json());
        onSaved(updated);
      } else {
        const created = await (homeClient as any).client
          ?.fetch('/connections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          .then((r: Response) => r.json());
        onSaved(created);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const title =
    step === 'pick'
      ? 'New connection'
      : mode === 'edit'
      ? `Edit ${connection?.name ?? 'connection'}`
      : isCustom
      ? 'New custom connection'
      : `New ${providerKey} connection`;

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col overflow-hidden ${className ?? ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-4">
        {step === 'configure' && mode === 'create' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep('pick')}
            className="-ml-2 h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h2 className="text-lg font-semibold capitalize flex-1">{title}</h2>
      </div>

      <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
        {/* Error banner */}
        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{submitError}</div>
          </div>
        )}

        {/* Step 1: provider picker */}
        {step === 'pick' && (
          <>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Scope
              </label>
              <ScopeToggle value={scope} onChange={setScope} />
            </div>
            <p className="text-xs text-muted-foreground">
              Pick the provider. Disabled tiles already exist at this scope.
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {/* Custom tile */}
              <button
                type="button"
                onClick={() => { setProviderKey(CUSTOM_PROVIDER); setStep('configure'); }}
                className="flex flex-col items-center gap-1 rounded-md border border-border bg-card hover:border-primary/60 hover:bg-accent px-2 py-3 text-xs transition cursor-pointer"
              >
                <Lock className="h-6 w-6 text-muted-foreground" />
                <span className="mt-1 font-medium">Custom</span>
              </button>

              {/* OAuth provider tiles */}
              {providers.map((p) => {
                const taken = takenOAuthForScope.has(p.name);
                const disabled = !p.available || taken;
                return (
                  <button
                    key={p.name}
                    type="button"
                    disabled={disabled}
                    onClick={() => { setProviderKey(p.name); setStep('configure'); }}
                    className={[
                      'flex flex-col items-center gap-1 rounded-md border px-2 py-3 text-xs transition',
                      'border-border bg-card hover:border-primary/60 hover:bg-accent',
                      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                    ].join(' ')}
                    title={taken ? `Already connected at ${scope} scope` : p.name}
                  >
                    <Users className="h-6 w-6 text-muted-foreground" />
                    <span className="mt-1 font-medium capitalize">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step 2: configure */}
        {step === 'configure' && (
          <>
            {/* Scope toggle */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Scope
              </label>
              <ScopeToggle value={scope} onChange={setScope} disabled={mode === 'edit'} />
            </div>

            {/* Custom: name + fields + skill content */}
            {isCustom && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Name *
                  </label>
                  <Input
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    placeholder="e.g. my-api"
                    maxLength={64}
                    autoFocus={mode === 'create'}
                    required
                  />
                </div>

                {/* Fields */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Fields *
                  </label>
                  <div className="space-y-2">
                    {fields.map((f, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-2">
                        <Input
                          value={f.key}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFields((prev) => prev.map((x, i) => i === idx ? { ...x, key: e.target.value } : x))
                          }
                          placeholder="api_key"
                        />
                        <Input
                          value={f.label ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFields((prev) => prev.map((x, i) => i === idx ? { ...x, label: e.target.value || null } : x))
                          }
                          placeholder="Label (optional)"
                        />
                        <label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={f.is_secret}
                            onChange={(e) =>
                              setFields((prev) => prev.map((x, i) => i === idx ? { ...x, is_secret: e.target.checked } : x))
                            }
                          />
                          secret
                        </label>
                        <label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={f.required}
                            onChange={(e) =>
                              setFields((prev) => prev.map((x, i) => i === idx ? { ...x, required: e.target.checked } : x))
                            }
                          />
                          req.
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFields((prev) => [...prev, blankField()])}
                    className="mt-2"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add field
                  </Button>
                </div>

                {/* Workspace values */}
                {scope === 'workspace' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Values (stored as workspace secrets)
                    </label>
                    <div className="space-y-3">
                      {fields.filter((f) => f.key.trim()).map((f) => (
                        <div key={f.key}>
                          <label className="text-xs font-medium text-muted-foreground">
                            {f.label ?? f.key}
                            {f.required && <span className="ml-1 text-red-500">*</span>}
                          </label>
                          <Input
                            type={f.is_secret ? 'password' : 'text'}
                            value={workspaceValues[f.key] ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setWorkspaceValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                            }
                            className="mt-1 font-mono"
                            placeholder={f.is_secret ? 'Paste value' : undefined}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill content */}
                {mode === 'create' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Skill content (Markdown) *
                    </label>
                    <textarea
                      value={skillContent}
                      onChange={(e) => setSkillContent(e.target.value)}
                      placeholder={defaultSkillsValue}
                      className="min-h-[8rem] w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </>
            )}

            {/* OAuth: scopes */}
            {!isCustom && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Scopes
                </label>
                <Input
                  value={oauthScopes.join(', ')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOAuthScopes(
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="scope1, scope2"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Comma-separated OAuth scopes.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-6 py-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        {step === 'configure' ? (
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create connection'}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Pick a provider to continue</span>
        )}
      </div>
    </form>
  );
}
