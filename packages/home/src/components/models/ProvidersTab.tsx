/**
 * Providers tab — split-pane: provider rail (left) + selected provider's
 * config panel (right). Configured providers sort to the top of the rail.
 *
 * Real wiring: `upsertSecret`, `deleteSecret`, `testProvider` come from
 * the existing `DistriHomeClient` — pass them in as callbacks so this
 * component stays UI-only.
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
  /** Save (upsert) a single key. */
  onSaveKey: (providerId: string, key: string, value: string) => Promise<void>;
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
  onSaveKey,
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
        onSaveKey={onSaveKey}
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
          {providers.length} providers
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
      {providers.map((p) => {
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
                {defaultCaps && defaultCaps.length > 0 && (
                  <span
                    title={`Default for ${defaultCaps.map((c) => CAPABILITY_META[c].short).join(', ')}`}
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
                    Default
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
  onSaveKey,
  onDeleteKey,
  onTestProvider,
  onAddModel,
}: {
  provider: ModelProviderDefinition;
  secrets: Secret[];
  configured: boolean;
  defaults: ProvidersTabProps['defaults'];
  defaultCapabilities: ModelCapability[];
  onSaveKey: (providerId: string, key: string, value: string) => Promise<void>;
  onDeleteKey: (key: string) => Promise<void>;
  onTestProvider: (providerId: string) => Promise<{ ok: boolean; detail: string }>;
  onAddModel: () => void;
}) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; detail: string } | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFieldValues({});
    setTestResult(null);
    setTesting(false);
    setRevealed(new Set());
  }, [provider.id]);

  const caps = useMemo(() => {
    const out = new Set<string>();
    for (const m of provider.models) out.add(m.capability);
    return Array.from(out);
  }, [provider]);

  const docs = providerDocs(provider.id);

  const handleSaveOne = async (key: string) => {
    const value = fieldValues[key]?.trim();
    if (!value) return;
    setSavingKey(key);
    try {
      await onSaveKey(provider.id, key, value);
      setFieldValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } finally {
      setSavingKey(null);
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
                  setFieldValues((prev) => ({ ...prev, [k.key]: v }))
                }
                onSave={() => handleSaveOne(k.key)}
                onDelete={async () => onDeleteKey(k.key)}
                saving={savingKey === k.key}
                revealed={revealed.has(k.key)}
                onToggleReveal={() =>
                  setRevealed((prev) => {
                    const next = new Set(prev);
                    if (next.has(k.key)) next.delete(k.key);
                    else next.add(k.key);
                    return next;
                  })
                }
              />
            ))}
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
  onSave,
  onDelete,
  saving,
  revealed,
  onToggleReveal,
}: {
  k: ProviderKeyDefinition;
  saved?: Secret;
  draftValue?: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onDelete: () => Promise<void>;
  saving: boolean;
  revealed: boolean;
  onToggleReveal: () => void;
}) {
  const hasDraft = !!draftValue?.trim() && !saved;
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
        <div className={`input ${saved ? 'saved' : ''}`}>
          <input
            type="text"
            value={
              saved
                ? revealed && saved.masked_value
                  ? saved.masked_value
                  : '••••••••••••'
                : (draftValue ?? '')
            }
            placeholder={k.placeholder}
            onChange={(e) => onDraftChange(e.target.value)}
            readOnly={!!saved}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && hasDraft) onSave();
            }}
          />
          <div className="actions">
            {saved && k.sensitive && saved.masked_value && (
              <button title={revealed ? 'Hide' : 'Reveal mask'} onClick={onToggleReveal}>
                <Eye size={13} />
              </button>
            )}
            {saved && (
              <button title="Remove" onClick={() => void onDelete()}>
                <Trash2 size={13} />
              </button>
            )}
            {hasDraft && (
              <button
                title="Save"
                onClick={onSave}
                disabled={saving}
                style={{ color: 'var(--m-brand-soft)' }}
              >
                {saving ? <Loader2 size={13} className="shimmer" /> : <Check size={13} />}
              </button>
            )}
            {hasDraft && (
              <button title="Clear" onClick={() => onDraftChange('')}>
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
