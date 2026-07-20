import type { ChangeEvent, CSSProperties } from 'react';
import type { UseReplayResult } from './useReplay';

export interface ReplayScrubberProps {
  replay: UseReplayResult;
  /** Total run length, from `cassette.durationMs`, the range input's max. */
  durationMs: number;
  className?: string;
}

const SPEEDS = [1, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

const buttonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 28,
  height: 28,
  padding: '0 6px',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 6,
  color: '#22d3ee',
  fontSize: 12,
  cursor: 'pointer',
};

const toggleStyle = (active: boolean): CSSProperties => ({
  ...buttonStyle,
  color: active ? '#0a0c0f' : '#22d3ee',
  background: active ? '#22d3ee' : 'transparent',
  gap: 6,
  padding: '0 8px',
  fontWeight: 600,
});

/** Transport controls for a replayed run: play/pause, restart, scrub, speed, auto-accept. */
export function ReplayScrubber({ replay, durationMs, className }: ReplayScrubberProps) {
  const {
    isPlaying, play, pause, restart, seek, t, speed, setSpeed,
    autoAccept, setAutoAccept, awaitingInput, pendingCheckpoint, resolveCheckpoint,
  } = replay;

  const onScrub = (e: ChangeEvent<HTMLInputElement>) => {
    pause();
    seek(Number(e.target.value));
  };

  const cycleSpeed = () => {
    const i = SPEEDS.indexOf(speed as Speed);
    setSpeed(SPEEDS[(i + 1) % SPEEDS.length]);
  };

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column' }}>
      {awaitingInput && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '6px 12px',
            fontSize: 12,
            color: '#0a0c0f',
            background: '#facc15',
          }}
        >
          <span>Waiting for you to respond above — this pauses here so it feels like you're driving.</span>
          {pendingCheckpoint && (
            <button
              type="button"
              onClick={() => resolveCheckpoint(pendingCheckpoint)}
              style={{ ...buttonStyle, color: '#0a0c0f', border: '1px solid rgba(10,12,15,0.3)' }}
            >
              Skip ahead
            </button>
          )}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: 'rgba(24, 24, 37, 0.95)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <button
          type="button"
          onClick={isPlaying ? pause : play}
          aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
          style={buttonStyle}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 4 20 12 6 20" />
            </svg>
          )}
        </button>

        <button type="button" onClick={restart} aria-label="Restart replay" style={buttonStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4V1L8 5l4 4V6a6 6 0 116 6h2a8 8 0 10-8-8z" />
          </svg>
        </button>

        <input
          type="range"
          min={0}
          max={durationMs}
          step={50}
          aria-label="Replay position"
          value={t}
          onChange={onScrub}
          style={{ flex: 1, accentColor: '#22d3ee' }}
        />

        <button type="button" onClick={cycleSpeed} aria-label="Change replay speed" style={buttonStyle}>
          {speed}×
        </button>

        <button
          type="button"
          onClick={() => setAutoAccept(!autoAccept)}
          aria-label="Toggle auto-accept"
          aria-pressed={autoAccept}
          title="When on, HITL steps resolve automatically instead of pausing for a click"
          style={toggleStyle(autoAccept)}
        >
          Auto-accept
        </button>
      </div>
    </div>
  );
}
