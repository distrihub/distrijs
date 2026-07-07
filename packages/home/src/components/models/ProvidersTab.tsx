/**
 * Providers tab — split-pane: provider rail (left) + selected provider's
 * config panel (right). Configured providers sort to the top of the rail.
 *
 * Real wiring: `upsertProvider` (one transactional save for all of a
 * provider's credentials), `deleteSecret`, and `testProvider` come from the
 * existing `DistriHomeClient` — passed in as callbacks so this component
 * stays UI-only.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  Eye,
  ExternalLink,
  Loader2,
  Plus,
  Power,
  Search,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import type {
  ModelCapability,
  ModelProviderDefinition,
  ProviderKeyDefinition,
  Secret,
} from '../../DistriHomeClient';
import { CAPABILITY_META, providerDocs, providerMonogram } from './data';
import { CapPill, MonoChip } from './primitives';

interface ProvidersTabProps {
  providers: ModelProviderDefinition[];
  secrets: Secret[];
  /** Workspace defaults keyed by capability. The default provider for
   *  each capability is derived from the `"provider/model"` value. */
  defaults: {
    completion: string;
    tts: string;
    stt: string;
    image: string;
  };
  focusProviderId?: string;
  onFocusProvider: (providerId: string) => void;
  /** Save (upsert) every entered credential for a provider in one call. */
  onSaveKeys: (providerId: string, secrets: Record<string, string>) => Promise<void>;
  /** Delete a stored secret. */
  onDeleteKey: (key: string) => Promise<void>;
  /** Test a provider's connection via `POST /v1/providers/test`. */
  onTestProvider: (providerId: string) => Promise<{ ok: boolean; detail: string }>;
  /** Add an OpenAI-compatible custom provider. Resolves once the catalog
   *  has been refreshed and the new entry shows up in `providers`. */
  onAddCustomProvider: (input: AddCustomProviderInput) => Promise<void>;
  /** Open the Add Custom Model modal scoped to the given provider. */
  onAddModel: (providerId: string) => void;
}

export interface AddCustomProviderInput {
  /** Display name shown in the provider rail. */
  name: string;
  /** OpenAI-compatible `/v1` base URL. */
  baseUrl: string;
  /** API key — stored as the provider's `OPENAI_API_KEY`-style secret. */
  apiKey: string;
  /** Optional project / org id passed through on the provider config. */
  projectId?: string;
}

export function ProvidersTab({
  providers,
  secrets,
  defaults,
  focusProviderId,
  onFocusProvider,
  onSaveKeys,
  onDeleteKey,
  onTestProvider,
  onAddCustomProvider,
  onAddModel,
}: ProvidersTabProps) {
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Capability → provider id, derived from the workspace defaults. The
  // default model is `"provider/model"`, so the provider is the prefix.
  // Guard against an undefined `defaults` prop in case a consumer hasn't
  // upgraded yet — fall back to the empty record.
  const defaultsByProvider = useMemo(() => {
    const map = new Map<string, ModelCapability[]>();
    const caps: ModelCapability[] = ['completion', 'tts', 'stt', 'image'];
    const d = defaults ?? { completion: '', tts: '', stt: '', image: '' };
    for (const cap of caps) {
      const full = d[cap];
      if (!full) continue;
      const slash = full.indexOf('/');
      if (slash <= 0) continue;
      const providerId = full.slice(0, slash);
      const list = map.get(providerId) ?? [];
      list.push(cap);
      map.set(providerId, list);
    }
    return map;
  }, [defaults]);
  const configured = useMemo(() => {
    const set = new Set<string>();
    for (const p of providers) {
      const required = p.keys.filter((k) => k.required !== false);
      const allPresent = required.every((k) => secrets.some((s) => s.key === k.key));
      if (required.length > 0 && allPresent) set.add(p.id);
    }
    return set;
  }, [providers, secrets]);

  const focusId = focusProviderId
    ?? providers.find((p) => configured.has(p.id))?.id
    ?? providers[0]?.id
    ?? '';
  const current = providers.find((p) => p.id === focusId) ?? providers[0];

  // Sort configured first, then catalog order.
  const sorted = useMemo(() => {
    const list = [...providers];
    list.sort((a, b) => {
      const ac = configured.has(a.id) ? 0 : 1;
      const bc = configured.has(b.id) ? 0 : 1;
      if (ac !== bc) return ac - bc;
      return providers.indexOf(a) - providers.indexOf(b);
    });
    return list;
  }, [providers, configured]);

  if (!current) {
    return (
      <div className="provider-panel" style={{ padding: 24 }}>
        No providers available.
      </div>
    );
  }

  return (
    <div className="providers-grid">
      <ProviderRail
        providers={sorted}
        configured={configured}
        defaultsByProvider={defaultsByProvider}
        focusId={focusId}
        onFocus={onFocusProvider}
        onAddCustom={() => setShowAddCustom(true)}
      />
      <ProviderPanel
        key={current.id}
        provider={current}
        secrets={secrets}
        configured={configured.has(current.id)}
        defaults={defaults}
        defaultCapabilities={defaultsByProvider.get(current.id) ?? []}
        onSaveKeys={onSaveKeys}
        onDeleteKey={onDeleteKey}
        onTestProvider={onTestProvider}
        onAddModel={() => onAddModel(current.id)}
      />
      {showAddCustom && (
        <AddCustomProviderModal
          onClose={() => setShowAddCustom(false)}
          onSubmit={async (input) => {
            await onAddCustomProvider(input);
            setShowAddCustom(false);
          }}
        />
      )}
    </div>
  );
}

function ProviderRail({
  providers,
  configured,
  defaultsByProvider,
  focusId,
  onFocus,
  onAddCustom,
}: {
  providers: ModelProviderDefinition[];
  configured: Set<string>;
  defaultsByProvider: Map<string, ModelCapability[]>;
  focusId: string;
  onFocus: (id: string) => void;
  onAddCustom: () => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visible = q
    ? providers.filter(
        (p) =>
          p.label.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q),
      )
    : providers;
  return (
    <div className="provider-list">
      <div
        style={{
          padding: '6px 10px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--m-border-soft)',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--m-text-faint)',
            fontWeight: 600,
          }}
        >
          {q ? `${visible.length}/${providers.length}` : providers.length} providers
        </span>
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: 26, padding: 0 }}
          onClick={onAddCustom}
          title="Add custom provider"
          aria-label="Add custom provider"
        >
          <Plus size={14} />
        </button>
      </div>
      <div style={{ padding: '0 8px 8px' }}>
        <div
          className="input"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px' }}
        >
          <Search size={13} style={{ color: 'var(--m-text-faint)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Filter providers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--m-text)',
              fontSize: 12.5,
              padding: '6px 0',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              title="Clear filter"
              aria-label="Clear filter"
              style={{ display: 'inline-flex', color: 'var(--m-text-faint)' }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
      {visible.length === 0 && (
        <div
          style={{
            padding: '18px 12px',
            textAlign: 'center',
            fontSize: 12.5,
            color: 'var(--m-text-faint)',
          }}
        >
          No providers match “{query}”.
        </div>
      )}
      {visible.map((p) => {
        const conf = configured.has(p.id);
        const active = p.id === focusId;
        const defaultCaps = defaultsByProvider.get(p.id);
        return (
          <div
            key={p.id}
            className={`prov-row ${active ? 'active' : ''}`}
            onClick={() => onFocus(p.id)}
          >
            <span className="mono lg" style={{ background: 'rgba(255,255,255,.04)' }}>
              {providerMonogram(p.id)}
            </span>
            <div>
              <div
                className="label"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>{p.label}</span>
                {p.category === 'coding_plan' && (
                  <span
                    title="Coding plan — reuse a Claude Code / z.ai subscription (Anthropic-compatible API)"
                    style={{ display: 'inline-flex', color: '#a855f7', flexShrink: 0 }}
                  >
                    <Terminal size={13} />
                  </span>
                )}
                {defaultCaps && defaultCaps.length > 0 && (
                  <span
                    title={`Workspace default for ${defaultCaps.map((c) => CAPABILITY_META[c].short).join(', ')}`}
                    style={{
                      fontSize: 9.5,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: 'var(--m-brand-soft)',
                      background: 'rgba(34,174,195,.14)',
                      border: '1px solid rgba(34,174,195,.32)',
                      borderRadius: 4,
                      padding: '1px 5px',
                    }}
                  >
                    Default · {defaultCaps.map((c) => CAPABILITY_META[c].short).join(' · ')}
                  </span>
                )}
              </div>
              <div className="sub">
                <span className={`status-dot ${conf ? 'ok' : ''}`} />
                <span>{conf ? 'Configured' : 'Not configured'}</span>
                <span style={{ color: 'var(--m-text-faint)' }}>· {p.models.length} models</span>
              </div>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--m-text-faint)' }} />
          </div>
        );
      })}
    </div>
  );
}

function ProviderPanel({
  provider,
  secrets,
  configured,
  defaults,
  defaultCapabilities,
  onSaveKeys,
  onDeleteKey,
  onTestProvider,
  onAddModel,
}: {
  provider: ModelProviderDefinition;
  secrets: Secret[];
  configured: boolean;
  defaults: ProvidersTabProps['defaults'];
  defaultCapabilities: ModelCapability[];
  onSaveKeys: (providerId: string, secrets: Record<string, string>) => Promise<void>;
  onDeleteKey: (key: string) => Promise<void>;
  onTestProvider: (providerId: string) => Promise<{ ok: boolean; detail: string }>;
  onAddModel: () => void;
}) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; detail: string } | null>(null);

  useEffect(() => {
    setFieldValues({});
    setTestResult(null);
    setTesting(false);
  }, [provider.id]);

  const caps = useMemo(() => {
    const out = new Set<string>();
    for (const m of provider.models) out.add(m.capability);
    return Array.from(out);
  }, [provider]);

  const docs = providerDocs(provider.id);

  // Collect every field the user has entered/changed and persist them in a
  // single upsert — no per-field round-trips.
  const pendingSecrets = useMemo(() => {
    const out: Record<string, string> = {};
    for (const k of provider.keys) {
      const draft = fieldValues[k.key];
      if (draft === undefined) continue;
      const trimmed = draft.trim();
      if (!trimmed) continue;
      const saved = secrets.find((s) => s.key === k.key);
      // A non-sensitive (env-var) field prefills its saved value, so skip it
      // when unchanged; sensitive fields always re-save what was typed.
      if (saved && !k.sensitive && saved.masked_value === trimmed) continue;
      out[k.key] = trimmed;
    }
    return out;
  }, [provider.keys, fieldValues, secrets]);

  const hasPending = Object.keys(pendingSecrets).length > 0;

  const handleSave = async () => {
    if (!hasPending) return;
    setSaving(true);
    try {
      await onSaveKeys(provider.id, pendingSecrets);
      setFieldValues({});
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTestProvider(provider.id);
      setTestResult(result);
    } catch (err) {
      setTestResult({ ok: false, detail: err instanceof Error ? err.message : 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="provider-panel">
      <div className="head">
        <span className="mono lg" style={{ width: 44, height: 44, fontSize: 14 }}>
          {providerMonogram(provider.id)}
        </span>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{provider.label}</span>
            {provider.category === 'coding_plan' && (
              <span
                title="Coding plan — reuse a Claude Code / z.ai subscription (Anthropic-compatible API)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#c084fc',
                }}
              >
                <Terminal size={14} /> Coding Plan
              </span>
            )}
            {defaultCapabilities.length > 0 && (
              <span
                title={`Workspace default for ${defaultCapabilities.map((c) => CAPABILITY_META[c].short).join(', ')}`}
                style={{
                  fontSize: 10,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: 'var(--m-brand-soft)',
                  background: 'rgba(34,174,195,.14)',
                  border: '1px solid rgba(34,174,195,.32)',
                  borderRadius: 4,
                  padding: '2px 6px',
                }}
              >
                Default · {defaultCapabilities.map((c) => CAPABILITY_META[c].short).join(' · ')}
              </span>
            )}
          </h2>
          <div className="sub">
            <span style={{ color: configured ? '#6EE7B7' : 'var(--m-text-faint)' }}>
              {configured ? '● Configured' : '○ Not configured'}
            </span>
            <span style={{ margin: '0 8px', color: 'var(--m-text-faint)' }}>·</span>
            {provider.models.length} models · {caps.map((c) => CAPABILITY_META[c as 'completion']?.short).join(', ')}
            {docs && (
              <>
                <span style={{ margin: '0 8px', color: 'var(--m-text-faint)' }}>·</span>
                <a
                  href={docs}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--m-brand-soft)', textDecoration: 'none' }}
                >
                  Docs <ExternalLink size={11} style={{ display: 'inline', marginLeft: 2 }} />
                </a>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleTest} disabled={testing}>
            {testing ? (
              <>
                <Loader2 size={12} className="shimmer" /> Testing…
              </>
            ) : (
              <>
                <Power size={12} /> Test connection
              </>
            )}
          </button>
        </div>
      </div>

      <div className="body">
        <div>
          <p className="section-title">Capabilities</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {caps.map((c) => (
              <CapPill key={c} type={c as 'completion'} />
            ))}
          </div>
        </div>

        {testResult && (
          <div
            className="testbar"
            style={{
              borderColor: testResult.ok ? 'rgba(16,185,129,.32)' : 'rgba(244,63,94,.32)',
              background: testResult.ok ? 'rgba(16,185,129,.06)' : 'rgba(244,63,94,.06)',
            }}
          >
            <span className={`status ${testResult.ok ? 'ok' : 'bad'}`}>
              {testResult.ok ? <Check size={14} /> : <X size={14} />}
              {testResult.detail}
            </span>
            <span style={{ flex: 1 }} />
            <button className="btn btn-ghost btn-sm" onClick={() => setTestResult(null)}>
              Dismiss
            </button>
          </div>
        )}

        <div>
          <p className="section-title">Credentials</p>
          <div>
            {provider.keys.map((k) => (
              <KeyRow
                key={k.key}
                k={k}
                saved={secrets.find((s) => s.key === k.key)}
                draftValue={fieldValues[k.key]}
                onDraftChange={(v) =>
                  setFieldValues((prev) => {
                    const next = { ...prev };
                    if (v === undefined) delete next[k.key];
                    else next[k.key] = v;
                    return next;
                  })
                }
                onDelete={async () => onDeleteKey(k.key)}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={!hasPending || saving}
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="shimmer" /> Saving…
                </>
              ) : (
                'Save credentials'
              )}
            </button>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <p className="section-title" style={{ margin: 0 }}>
              Models
            </p>
            <span style={{ fontSize: 11.5, color: 'var(--m-text-faint)' }}>
              {provider.models.length} available
            </span>
            <span style={{ flex: 1 }} />
            <button className="btn btn-secondary btn-sm" onClick={onAddModel}>
              <Plus size={12} /> Add model
            </button>
          </div>
          <div
            style={{
              border: '1px solid var(--m-border)',
              borderRadius: 'var(--m-radius-md)',
              overflow: 'hidden',
            }}
          >
            {provider.models.map((m, idx) => {
              const isDefault = defaults?.[m.capability] === `${provider.id}/${m.id}`;
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: 14,
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderTop: idx === 0 ? '0' : '1px solid var(--m-border-soft)',
                    background: isDefault ? 'rgba(34,174,195,.04)' : undefined,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                    <div
                      className="mono-text"
                      style={{ fontSize: 11, color: 'var(--m-text-faint)', marginTop: 1 }}
                    >
                      {provider.id}/{m.id}
                    </div>
                  </div>
                  {isDefault ? (
                    <span
                      title={`Workspace default for ${CAPABILITY_META[m.capability].short}`}
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.10em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: 'var(--m-brand-soft)',
                        background: 'rgba(34,174,195,.14)',
                        border: '1px solid rgba(34,174,195,.32)',
                        borderRadius: 4,
                        padding: '2px 6px',
                      }}
                    >
                      Default
                    </span>
                  ) : (
                    <span />
                  )}
                  <CapPill type={m.capability} />
                  <MonoChip providerId={provider.id} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyRow({
  k,
  saved,
  draftValue,
  onDraftChange,
  onDelete,
}: {
  k: ProviderKeyDefinition;
  saved?: Secret;
  draftValue?: string;
  /** Pass `undefined` to discard the draft and revert to the saved value. */
  onDraftChange: (value: string | undefined) => void;
  onDelete: () => Promise<void>;
}) {
  // A non-sensitive field (e.g. an Azure resource name) is a plain
  // environment variable, not a secret: show its stored value in the clear
  // and let it be edited inline. Sensitive fields stay masked and are
  // overwritten only after an explicit "Replace".
  const isEnvVar = !k.sensitive;
  const editing = draftValue !== undefined;

  let displayValue: string;
  if (editing) {
    displayValue = draftValue ?? '';
  } else if (saved) {
    displayValue = isEnvVar ? saved.masked_value : '••••••••••••';
  } else {
    displayValue = '';
  }

  // Env-var fields are always editable; a saved sensitive field stays
  // read-only until the user clicks Replace (which starts a draft).
  const readOnly = !isEnvVar && !!saved && !editing;

  return (
    <div className="field-row">
      <div>
        <div className="lbl">
          {k.label}
          {!k.required && (
            <span style={{ color: 'var(--m-text-faint)', fontWeight: 400, marginLeft: 6 }}>
              (optional)
            </span>
          )}
        </div>
        <div className="desc">
          <code className="mono-text" style={{ fontSize: 11, color: 'var(--m-text-faint)' }}>
            {k.key}
          </code>
        </div>
      </div>
      <div>
        <div className={`input ${saved && !editing ? 'saved' : ''}`}>
          <input
            type="text"
            value={displayValue}
            placeholder={k.placeholder}
            onChange={(e) => onDraftChange(e.target.value)}
            readOnly={readOnly}
          />
          <div className="actions">
            {saved && k.sensitive && !editing && (
              <button title="Replace" onClick={() => onDraftChange('')}>
                <Eye size={13} />
              </button>
            )}
            {saved && (
              <button title="Remove" onClick={() => void onDelete()}>
                <Trash2 size={13} />
              </button>
            )}
            {editing && (
              <button title="Cancel" onClick={() => onDraftChange(undefined)}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Custom Provider ──────────────────────────────────────────────

function AddCustomProviderModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: AddCustomProviderInput) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0 && baseUrl.trim().length > 0 && apiKey.trim().length > 0;

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        projectId: projectId.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add provider');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="drawer-backdrop"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480,
          background: 'var(--m-bg-elev)',
          border: '1px solid var(--m-border)',
          borderRadius: 'var(--m-radius-lg)',
          padding: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--m-text)' }}>Add custom provider</h3>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 28, height: 28, padding: 0 }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--m-text-muted)', margin: '0 0 16px' }}>
          Any OpenAI-compatible endpoint — vLLM, LiteLLM, LangDB, Ollama. The server probes{' '}
          <code className="mono-text" style={{ fontSize: 11 }}>
            GET /models
          </code>{' '}
          when you save.
        </p>

        <ModalField
          label="Display name"
          placeholder="My local cluster"
          value={name}
          onChange={setName}
        />
        <ModalField
          label="Base URL"
          placeholder="https://llm.acme.io/v1"
          value={baseUrl}
          onChange={setBaseUrl}
          mono
        />
        <ModalField
          label="API key"
          placeholder="sk-…"
          value={apiKey}
          onChange={setApiKey}
          mono
          sensitive
        />
        <ModalField
          label="Project ID"
          placeholder="proj-…"
          value={projectId}
          onChange={setProjectId}
          mono
          optional
        />

        {error && (
          <div style={{ color: '#FDA4AF', fontSize: 12.5, marginTop: 10 }}>{error}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!valid || submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={13} className="shimmer" /> Adding…
              </>
            ) : (
              'Add provider'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalField({
  label,
  placeholder,
  value,
  onChange,
  mono,
  sensitive,
  optional,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  sensitive?: boolean;
  optional?: boolean;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          color: 'var(--m-text-muted)',
          marginBottom: 5,
        }}
      >
        {label}
        {optional && (
          <span style={{ color: 'var(--m-text-faint)', marginLeft: 6 }}>(optional)</span>
        )}
      </label>
      <div className="input">
        <input
          type={sensitive ? 'password' : 'text'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ fontFamily: mono ? 'var(--m-font-mono)' : 'inherit' }}
        />
      </div>
    </div>
  );
}
