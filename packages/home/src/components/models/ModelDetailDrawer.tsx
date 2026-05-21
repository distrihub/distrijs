/**
 * Slide-over drawer triggered by clicking a model row. Shows the spec
 * grid, pricing, voices (TTS), and a "Open playground" action.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Info,
  Play,
  PlayCircle,
  Wrench,
  X,
} from 'lucide-react';
import type {
  Model,
  ModelCapability,
  ModelProviderDefinition,
} from '../../DistriHomeClient';
import { formatContext, providerMonogram } from './data';
import { CapPill } from './primitives';

interface ModelDetailDrawerProps {
  provider: ModelProviderDefinition;
  model: Model;
  configured: boolean;
  isDefault: boolean;
  onClose: () => void;
  /** Toggle the model as the workspace default for its capability. */
  onSetDefault: () => void;
  onOpenPlayground: () => void;
  onConfigureProvider: () => void;
}

export function ModelDetailDrawer({
  provider,
  model,
  configured,
  isDefault,
  onClose,
  onSetDefault,
  onOpenPlayground,
  onConfigureProvider,
}: ModelDetailDrawerProps) {
  const fullId = `${provider.id}/${model.id}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (navigator.clipboard) navigator.clipboard.writeText(fullId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [fullId]);

  const codeSample = useMemo(
    () => `from distri import Agent

agent = Agent(
  name="my-agent",
  model="${fullId}",
)`,
    [fullId],
  );

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer">
        <div className="top">
          <span className="mono lg">{providerMonogram(provider.id)}</span>
          <div className="title">
            <h2>{model.name}</h2>
            <div className="id">
              <span>{fullId}</span>
              <button onClick={handleCopy} title="Copy">
                {copied ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ width: 30, height: 30, padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 22px',
            borderBottom: '1px solid var(--m-border-soft)',
            flexWrap: 'wrap',
          }}
        >
          <button className="btn btn-primary" onClick={onOpenPlayground}>
            <Play size={13} /> Open playground
          </button>
          <button
            className={`btn ${isDefault ? 'btn-primary' : 'btn-secondary'}`}
            onClick={onSetDefault}
            aria-pressed={isDefault}
          >
            {isDefault ? <CheckCircle2 size={13} /> : <Check size={13} />}
            {isDefault ? 'Default — click to clear' : 'Set as default'}
          </button>
          <span style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" onClick={onConfigureProvider}>
            <Wrench size={12} /> Provider
          </button>
        </div>

        <div className="body">
          {!configured && (
            <div
              style={{
                padding: 12,
                marginBottom: 18,
                background: 'rgba(245,158,11,.06)',
                border: '1px solid rgba(245,158,11,.22)',
                borderRadius: 'var(--m-radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 12.5,
                color: '#FCD34D',
              }}
            >
              <Info size={14} />
              <span style={{ flex: 1 }}>
                <strong>{provider.label}</strong> isn't configured — add credentials to enable this model.
              </span>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(245,158,11,.18)', color: '#FCD34D' }}
                onClick={onConfigureProvider}
              >
                Configure
              </button>
            </div>
          )}

          <div className="spec-grid">
            <Spec k="Capability" v={<CapPill type={model.capability} />} />
            {model.context_window && (
              <Spec k="Context window" v={`${formatContext(model.context_window)} tokens`} />
            )}
            {model.voices?.length && <Spec k="Voices" v={`${model.voices.length}`} />}
            {model.formats?.length && (
              <Spec
                k={
                  model.capability === 'image'
                    ? 'Output formats'
                    : model.capability === 'tts' || model.capability === 'stt'
                    ? 'Audio formats'
                    : 'Formats'
                }
                v={
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {model.formats.map((f) => (
                      <span key={f} className="tag">
                        {f}
                      </span>
                    ))}
                  </div>
                }
              />
            )}
          </div>

          {model.pricing && (
            <div className="section">
              <h3>Pricing</h3>
              <div className="spec-grid">
                {model.pricing.type === 'completion' && (
                  <>
                    <Spec
                      k="Input · per 1M tokens"
                      v={<span style={{ fontWeight: 600 }}>${model.pricing.input.toFixed(2)}</span>}
                    />
                    <Spec
                      k="Output · per 1M tokens"
                      v={<span style={{ fontWeight: 600 }}>${model.pricing.output.toFixed(2)}</span>}
                    />
                    {model.pricing.cached_input != null && (
                      <Spec
                        k="Cached input · per 1M"
                        v={
                          <span style={{ fontWeight: 600, color: '#6EE7B7' }}>
                            ${model.pricing.cached_input.toFixed(2)}
                          </span>
                        }
                      />
                    )}
                  </>
                )}
                {model.pricing.type === 'tts' && (
                  <Spec
                    k="Per 1M characters"
                    v={
                      <span style={{ fontWeight: 600 }}>
                        ${model.pricing.per_1m_chars.toFixed(2)}
                      </span>
                    }
                  />
                )}
                {model.pricing.type === 'stt' && (
                  <Spec
                    k="Per minute audio"
                    v={
                      <span style={{ fontWeight: 600 }}>
                        ${model.pricing.per_minute.toFixed(3)}
                      </span>
                    }
                  />
                )}
                {model.pricing.type === 'image' && (
                  <Spec
                    k="Per image"
                    v={
                      <span style={{ fontWeight: 600 }}>
                        ${model.pricing.per_image.toFixed(3)}
                      </span>
                    }
                  />
                )}
              </div>
            </div>
          )}

          {(model.capability as ModelCapability) === 'tts' &&
            (model.voices?.length ?? 0) > 0 && (
              <div className="section">
                <h3>Voices · {model.voices!.length}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {model.voices!.map((v) => (
                    <div key={v.id} className="voice-card">
                      <div>
                        <div className="name">{v.name}</div>
                        {v.description && <div className="desc">{v.description}</div>}
                      </div>
                      <button className="btn btn-ghost btn-sm">
                        <PlayCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div className="section">
            <h3>Quick start</h3>
            <pre
              style={{
                margin: 0,
                padding: 14,
                background: 'var(--m-bg-sunk)',
                border: '1px solid var(--m-border)',
                borderRadius: 'var(--m-radius-md)',
                fontSize: 12,
                lineHeight: 1.55,
                fontFamily: 'var(--m-font-mono)',
                color: 'var(--m-text-muted)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {codeSample}
            </pre>
          </div>
        </div>
      </aside>
    </>
  );
}

function Spec({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="spec-cell">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
