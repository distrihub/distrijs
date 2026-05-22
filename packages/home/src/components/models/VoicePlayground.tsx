/**
 * Voice (TTS) playground. Two-column layout: text/voices on the left,
 * params on the right. Calls `homeClient.generateSpeech`, decodes the
 * returned audio bytes into a Blob URL, and feeds them to an `<audio>`
 * element that the play/pause button controls.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Loader2,
  Pause,
  Play,
  PlayCircle,
  Speaker,
} from 'lucide-react';
import type {
  DistriHomeClient,
  ModelProviderDefinition,
  TtsVoiceInfo,
} from '../../DistriHomeClient';
import { CapPill } from './primitives';

interface VoicePlaygroundProps {
  homeClient: DistriHomeClient;
  providers: ModelProviderDefinition[];
  configured: Set<string>;
  initialProviderId?: string;
  initialModelId?: string;
  onBack: () => void;
}

interface TtsRow {
  providerId: string;
  providerLabel: string;
  modelId: string;
  modelName: string;
  voices: TtsVoiceInfo[];
  formats: string[];
}

export function VoicePlayground({
  homeClient,
  providers,
  configured,
  initialProviderId,
  initialModelId,
  onBack,
}: VoicePlaygroundProps) {
  const ttsModels = useMemo<TtsRow[]>(() => {
    const out: TtsRow[] = [];
    for (const p of providers) {
      for (const m of p.models) {
        if (m.capability === 'tts') {
          out.push({
            providerId: p.id,
            providerLabel: p.label,
            modelId: m.id,
            modelName: m.name,
            voices: m.voices ?? [],
            formats: m.formats ?? ['mp3'],
          });
        }
      }
    }
    return out;
  }, [providers]);

  const initial = ttsModels.find(
    (m) => m.providerId === initialProviderId && m.modelId === initialModelId,
  ) ?? ttsModels[0];
  const [selectedId, setSelectedId] = useState(
    initial ? `${initial.providerId}/${initial.modelId}` : '',
  );

  const selected = useMemo(() => {
    const [pid, mid] = selectedId.split('/');
    return ttsModels.find((m) => m.providerId === pid && m.modelId === mid) ?? ttsModels[0];
  }, [selectedId, ttsModels]);

  const [text, setText] = useState(
    'Welcome to Distri Cloud. Your agents are running smoothly today — six active threads, no errors in the last hour.',
  );
  const [voice, setVoice] = useState<string>(selected?.voices[0]?.id ?? 'alloy');
  const [format, setFormat] = useState<string>(selected?.formats[0] ?? 'mp3');
  const [speed, setSpeed] = useState<number>(1.0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>('audio/mpeg');
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset voice + format when the selected model changes.
  useEffect(() => {
    if (!selected) return;
    if (!selected.voices.find((v) => v.id === voice)) {
      setVoice(selected.voices[0]?.id ?? 'alloy');
    }
    if (!selected.formats.includes(format)) {
      setFormat(selected.formats[0] ?? 'mp3');
    }
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Free the old blob URL when we replace it.
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleGenerate = useCallback(async () => {
    if (!selected || !text.trim()) return;
    setGenerating(true);
    setError(null);
    setPlaying(false);
    try {
      const response = await homeClient.generateSpeech({
        input: text,
        model: selected.modelId,
        voice,
        provider: selected.providerId,
        response_format: format,
        speed,
      });
      const blob = new Blob([response.audio], { type: response.contentType });
      const url = URL.createObjectURL(blob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
      setContentType(response.contentType);
      // Autoplay
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play().catch(() => {});
          setPlaying(true);
        }
      }, 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TTS generation failed');
    } finally {
      setGenerating(false);
    }
  }, [homeClient, selected, text, voice, format, speed, audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `tts.${format}`;
    a.click();
  };

  if (ttsModels.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={13} /> Catalog
        </button>
        <div style={{ marginTop: 24, color: 'var(--m-text-muted)' }}>
          No TTS-capable models in the catalog. Configure a provider first.
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
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Text-to-speech playground</h2>
        <span style={{ flex: 1 }} />
        <select
          className="select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
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
          {ttsModels.map((m) => {
            const id = `${m.providerId}/${m.modelId}`;
            const ok = configured.has(m.providerId);
            return (
              <option key={id} value={id} disabled={!ok}>
                {id}
                {ok ? '' : '  (not configured)'}
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
            <CapPill type="tts" />
            <span className="mono-text">{selectedId}</span>
            <span style={{ flex: 1 }} />
            <span>
              {text.length} chars · {format.toUpperCase()}
            </span>
          </div>

          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--m-text-faint)',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Text to synthesise
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 120,
                  padding: 14,
                  background: 'rgba(255,255,255,.02)',
                  border: '1px solid var(--m-border)',
                  borderRadius: 'var(--m-radius-md)',
                  color: 'var(--m-text)',
                  fontSize: 14.5,
                  lineHeight: 1.55,
                  resize: 'vertical',
                  outline: 0,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div
              style={{
                padding: 16,
                border: '1px solid var(--m-border)',
                borderRadius: 'var(--m-radius-md)',
                display: 'grid',
                gridTemplateColumns: '46px 1fr auto auto',
                gap: 14,
                alignItems: 'center',
                background: 'var(--m-bg-sunk)',
              }}
            >
              <button
                className="btn btn-primary"
                style={{ width: 46, height: 46, borderRadius: '50%', padding: 0 }}
                onClick={togglePlay}
                disabled={!audioUrl || generating}
              >
                {playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <div>
                <audio
                  ref={audioRef}
                  onEnded={() => setPlaying(false)}
                  onPause={() => setPlaying(false)}
                  style={{ width: '100%' }}
                  controls={false}
                />
                <div
                  style={{
                    fontFamily: 'var(--m-font-mono)',
                    fontSize: 11,
                    color: 'var(--m-text-faint)',
                  }}
                >
                  {audioUrl
                    ? `${contentType} · ${voice}`
                    : generating
                    ? 'Generating…'
                    : 'Press Generate to synthesise'}
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={generating || !text.trim()}
              >
                {generating ? (
                  <>
                    <Loader2 size={13} className="shimmer" /> Generating…
                  </>
                ) : (
                  <>
                    <Speaker size={13} /> Generate
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={downloadAudio}
                disabled={!audioUrl}
              >
                <Download size={12} /> Download
              </button>
            </div>

            {error && (
              <div style={{ color: '#FDA4AF', fontSize: 12.5 }}>{error}</div>
            )}

            {selected && selected.voices.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--m-text-faint)',
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Voices · {selected.voices.length}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {selected.voices.map((v) => (
                    <div
                      key={v.id}
                      className={`voice-card ${voice === v.id ? 'active' : ''}`}
                      onClick={() => setVoice(v.id)}
                    >
                      <div>
                        <div className="name">{v.name}</div>
                        {v.description && <div className="desc">{v.description}</div>}
                      </div>
                      <PlayCircle size={16} style={{ color: 'var(--m-text-faint)' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="surface params">
          <ParamSection title="Voice">
            <div className="mono-text" style={{ fontSize: 12, color: 'var(--m-text)' }}>
              {voice}
            </div>
          </ParamSection>
          <ParamSlider
            label="Speed"
            value={speed}
            setValue={setSpeed}
            min={0.25}
            max={4.0}
            step={0.05}
          />
          <ParamSection title="Format">
            <select
              className="select"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {selected?.formats.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </select>
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

function ParamSlider({
  label,
  value,
  setValue,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="param">
      <div className="lbl">
        <span>{label}</span>
        <span className="v">{value.toFixed(2)}</span>
      </div>
      <input
        className="slider"
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setValue(Number(e.target.value))}
      />
    </div>
  );
}
