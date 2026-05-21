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
  ModelProviderDefinition,
  ProviderKeyDefinition,
  Secret,
} from '../../DistriHomeClient';
import { CAPABILITY_META, providerDocs, providerMonogram } from './data';
import { CapPill, MonoChip } from './primitives';

interface ProvidersTabProps {
  providers: ModelProviderDefinition[];
  secrets: Secret[];
  focusProviderId?: string;
  onFocusProvider: (providerId: string) => void;
  /** Save (upsert) a single key. */
  onSaveKey: (providerId: string, key: string, value: string) => Promise<void>;
  /** Delete a stored secret. */
  onDeleteKey: (key: string) => Promise<void>;
  /** Test a provider's connection via `POST /v1/providers/test`. */
  onTestProvider: (providerId: string) => Promise<{ ok: boolean; detail: string }>;
}

export function ProvidersTab({
  providers,
  secrets,
  focusProviderId,
  onFocusProvider,
  onSaveKey,
  onDeleteKey,
  onTestProvider,
}: ProvidersTabProps) {
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
        focusId={focusId}
        onFocus={onFocusProvider}
      />
      <ProviderPanel
        key={current.id}
        provider={current}
        secrets={secrets}
        configured={configured.has(current.id)}
        onSaveKey={onSaveKey}
        onDeleteKey={onDeleteKey}
        onTestProvider={onTestProvider}
      />
    </div>
  );
}

function ProviderRail({
  providers,
  configured,
  focusId,
  onFocus,
}: {
  providers: ModelProviderDefinition[];
  configured: Set<string>;
  focusId: string;
  onFocus: (id: string) => void;
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
        <button className="btn btn-ghost btn-sm" style={{ paddingLeft: 6, paddingRight: 6 }}>
          <Plus size={12} /> Custom
        </button>
      </div>
      {providers.map((p) => {
        const conf = configured.has(p.id);
        const active = p.id === focusId;
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
              <div className="label">{p.label}</div>
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
  onSaveKey,
  onDeleteKey,
  onTestProvider,
}: {
  provider: ModelProviderDefinition;
  secrets: Secret[];
  configured: boolean;
  onSaveKey: (providerId: string, key: string, value: string) => Promise<void>;
  onDeleteKey: (key: string) => Promise<void>;
  onTestProvider: (providerId: string) => Promise<{ ok: boolean; detail: string }>;
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
          <h2>{provider.label}</h2>
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
          </div>
          <div
            style={{
              border: '1px solid var(--m-border)',
              borderRadius: 'var(--m-radius-md)',
              overflow: 'hidden',
            }}
          >
            {provider.models.map((m, idx) => (
              <div
                key={m.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 14,
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderTop: idx === 0 ? '0' : '1px solid var(--m-border-soft)',
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
                <CapPill type={m.capability} />
                <MonoChip providerId={provider.id} />
              </div>
            ))}
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
