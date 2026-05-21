/**
 * Image generation playground. Two-column layout — prompt + result
 * canvas on the left, parameter panel on the right. Drives
 * `homeClient.generateImage` and renders the resulting images inline.
 *
 * Hooks the gpt-image-1/2, fal flux/*, and Imagen-style models.
 */

import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, Image as ImageIcon, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import type {
  DistriHomeClient,
  ImageGenerateResponseImage,
  ImageQuality,
  ImageSize,
  ModelProviderDefinition,
} from '../../DistriHomeClient';
import { CapPill } from './primitives';

interface ImagePlaygroundProps {
  homeClient: DistriHomeClient;
  providers: ModelProviderDefinition[];
  configured: Set<string>;
  initialProviderId?: string;
  initialModelId?: string;
  onBack: () => void;
}

const QUALITY_OPTIONS: { id: ImageQuality; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];
const SIZE_OPTIONS: ImageSize[] = ['1024x1024', '1024x1536', '1536x1024'];

export function ImagePlayground({
  homeClient,
  providers,
  configured,
  initialProviderId,
  initialModelId,
  onBack,
}: ImagePlaygroundProps) {
  // Flatten every image-capable model into a {providerId, modelId} list.
  const imageModels = useMemo(() => {
    const out: { providerId: string; providerLabel: string; modelId: string; modelName: string }[] = [];
    for (const p of providers) {
      for (const m of p.models) {
        if (m.capability === 'image') {
          out.push({
            providerId: p.id,
            providerLabel: p.label,
            modelId: m.id,
            modelName: m.name,
          });
        }
      }
    }
    return out;
  }, [providers]);

  const defaultPick = imageModels.find(
    (m) => m.providerId === initialProviderId && m.modelId === initialModelId,
  ) ?? imageModels[0];
  const [selected, setSelected] = useState(
    defaultPick ? `${defaultPick.providerId}/${defaultPick.modelId}` : '',
  );

  const [prompt, setPrompt] = useState(
    'A wide-angle architectural photo of a brutalist building at golden hour, low-angle, dramatic shadows.',
  );
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [quality, setQuality] = useState<ImageQuality>('low');
  const [n, setN] = useState<number>(1);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<ImageGenerateResponseImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!selected || !prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      // Note: don't send `response_format`. gpt-image-* rejects it (the
      // model always returns base64). For dall-e-* the server default is
      // fine; if a caller wants `url` instead they can set it explicitly.
      const result = await homeClient.generateImage({
        model: selected,
        prompt,
        n,
        size,
        quality,
      });
      setImages(result.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setGenerating(false);
    }
  }, [homeClient, selected, prompt, n, size, quality]);

  if (imageModels.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={13} /> Catalog
        </button>
        <div style={{ marginTop: 24, color: 'var(--m-text-muted)' }}>
          No image-capable models in the catalog. Configure a provider first.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={13} /> Catalog
        </button>
        <span style={{ color: 'var(--m-text-faint)' }}>/</span>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Image playground</h2>
        <span style={{ flex: 1 }} />
        <select
          className="select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{
            background: 'rgba(255,255,255,.02)',
            border: '1px solid var(--m-border)',
            color: 'var(--m-text)',
            borderRadius: 'var(--m-radius-md)',
            padding: '7px 10px',
            fontSize: 13,
            minWidth: 280,
            fontFamily: 'var(--m-font-mono)',
          }}
        >
          {imageModels.map((m) => {
            const id = `${m.providerId}/${m.modelId}`;
            const isConfigured = configured.has(m.providerId);
            return (
              <option key={id} value={id} disabled={!isConfigured}>
                {id}
                {isConfigured ? '' : '  (not configured)'}
              </option>
            );
          })}
        </select>
      </div>

      <div className="pg">
        <div className="surface">
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--m-border-soft)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12.5,
              color: 'var(--m-text-muted)',
            }}
          >
            <CapPill type="image" />
            <span className="mono-text">{selected}</span>
            <span style={{ flex: 1 }} />
            <span>{n}× {size} · {quality}</span>
          </div>

          <div className="image-canvas">
            {Array.from({ length: n }).map((_, i) => {
              const img = images[i];
              return (
                <div key={i} className={`image-tile ${generating ? 'shimmer' : ''}`}>
                  {!generating && img && (img.b64_json || img.url) && (
                    <img
                      src={img.b64_json ? `data:image/png;base64,${img.b64_json}` : img.url}
                      alt={`Generated ${i}`}
                    />
                  )}
                  {!generating && !img && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--m-text-faint)',
                      }}
                    >
                      <ImageIcon size={28} />
                    </div>
                  )}
                  {!generating && img && (
                    <div className="meta">
                      {img.width && img.height ? `${img.width}×${img.height}` : size}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderTop: '1px solid var(--m-border-soft)',
                color: '#FDA4AF',
                fontSize: 12.5,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              padding: 14,
              borderTop: '1px solid var(--m-border-soft)',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 10,
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image…"
              rows={2}
              style={{
                background: 'rgba(255,255,255,.02)',
                border: '1px solid var(--m-border)',
                borderRadius: 'var(--m-radius-md)',
                padding: '10px 12px',
                resize: 'vertical',
                color: 'var(--m-text)',
                fontSize: 13.5,
                outline: 0,
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={generating || !selected || !prompt.trim()}
              >
                {generating ? (
                  <>
                    <Loader2 size={13} className="shimmer" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={13} /> Generate
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleGenerate}
                disabled={generating || !selected}
              >
                <RefreshCw size={12} /> Variations
              </button>
            </div>
          </div>
        </div>

        <div className="surface params">
          <ParamSection title="Number of images">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[1, 2, 4, 8].map((v) => (
                <button
                  key={v}
                  className={`btn ${n === v ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setN(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </ParamSection>
          <ParamSection title="Size">
            <select
              className="select"
              value={size}
              onChange={(e) => setSize(e.target.value as ImageSize)}
            >
              {SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </ParamSection>
          <ParamSection title="Quality">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {QUALITY_OPTIONS.map((q) => (
                <button
                  key={q.id}
                  className={`btn ${quality === q.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setQuality(q.id)}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </ParamSection>
        </div>
      </div>
    </div>
  );
}

function ParamSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="param">
      <div className="lbl">
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}
