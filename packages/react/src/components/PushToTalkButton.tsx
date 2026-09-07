import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, Square } from 'lucide-react';
import type { VoiceState, VoiceTranscript } from '@distri/core';
import { cn } from '../lib/utils';

/** The slice of `useVoiceSession()` the button drives. */
export interface PushToTalkVoice {
  state: VoiceState;
  transcript?: VoiceTranscript;
  press: () => void;
  release: () => void;
  cancel: () => void;
}

export interface PushToTalkButtonProps {
  voice: PushToTalkVoice;
  /** `KeyboardEvent.code` (e.g. `'Space'`) that presses the button while focus is not in an editable element. */
  pushToTalkKey?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  /** Pointer leaving the button by more than this many px cancels the turn. Default 48. */
  cancelDistancePx?: number;
  title?: string;
}

const SIZE_CLASSES: Record<NonNullable<PushToTalkButtonProps['size']>, { button: string; icon: string }> = {
  sm: { button: 'h-8 w-8 sm:h-9 sm:w-9', icon: 'h-3 w-3 sm:h-4 sm:w-4' },
  md: { button: 'h-10 w-10 sm:h-11 sm:w-11', icon: 'h-4 w-4 sm:h-5 sm:w-5' },
  lg: { button: 'h-14 w-14 sm:h-16 sm:w-16', icon: 'h-6 w-6 sm:h-8 sm:w-8' },
};

const STATE_TITLES: Record<VoiceState, string> = {
  idle: 'Hold to talk',
  ready: 'Hold to talk',
  listening: 'Listening — release to send',
  finalizing: 'Finishing…',
  thinking: 'Thinking — press to interrupt',
  speaking: 'Speaking — press to interrupt',
  error: 'Voice unavailable — press to retry',
};

/** A long press must not select text or open the touch callout. */
const PRESS_STYLE: React.CSSProperties = {
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

/**
 * Hold-to-talk button (spec §2.3 pointer contract): pointer capture on press,
 * release sends, leaving the button by more than `cancelDistancePx` cancels,
 * `touch-action: none` / `user-select: none`, the context menu is suppressed
 * so a long press never opens the callout, and an optional keyboard key acts
 * as the button when focus is outside editable elements.
 */
export const PushToTalkButton: React.FC<PushToTalkButtonProps> = ({
  voice,
  pushToTalkKey,
  size = 'md',
  className,
  disabled = false,
  cancelDistancePx = 48,
  title,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pressing, setPressing] = useState(false);
  const pressingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  const beginPress = useCallback(() => {
    if (pressingRef.current || disabled) return;
    pressingRef.current = true;
    setPressing(true);
    voiceRef.current.press();
  }, [disabled]);

  const endPress = useCallback((how: 'release' | 'cancel') => {
    if (!pressingRef.current) return;
    pressingRef.current = false;
    setPressing(false);
    const el = buttonRef.current;
    if (el && pointerIdRef.current !== null) {
      try {
        if (el.hasPointerCapture(pointerIdRef.current)) el.releasePointerCapture(pointerIdRef.current);
      } catch {
        // ignore
      }
    }
    pointerIdRef.current = null;
    if (how === 'release') voiceRef.current.release();
    else voiceRef.current.cancel();
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    pointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore (jsdom / unsupported)
    }
    beginPress();
  }, [beginPress, disabled]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pressingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
    const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
    if (Math.hypot(dx, dy) > cancelDistancePx) endPress('cancel');
  }, [cancelDistancePx, endPress]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    endPress('release');
  }, [endPress]);

  const onPointerCancel = useCallback(() => endPress('cancel'), [endPress]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (!e.repeat) beginPress();
    }
  }, [beginPress]);

  const onKeyUp = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      endPress('release');
    }
  }, [endPress]);

  // Global push-to-talk key.
  useEffect(() => {
    if (!pushToTalkKey || typeof document === 'undefined') return;
    const down = (e: KeyboardEvent) => {
      if (e.code !== pushToTalkKey || e.repeat || isEditableTarget(e.target)) return;
      if (e.target === buttonRef.current) return; // handled by the button's own handlers
      e.preventDefault();
      beginPress();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== pushToTalkKey) return;
      if (e.target === buttonRef.current) return;
      if (!pressingRef.current) return;
      e.preventDefault();
      endPress('release');
    };
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('keyup', up);
    };
  }, [pushToTalkKey, beginPress, endPress]);

  // If the component unmounts mid-press, drop the turn.
  useEffect(() => () => {
    if (pressingRef.current) voiceRef.current.cancel();
  }, []);

  const { state } = voice;
  const sizes = SIZE_CLASSES[size];
  const listening = state === 'listening' || pressing;
  const busy = state === 'finalizing' || state === 'thinking';

  let icon: React.ReactNode;
  if (busy) icon = <Loader2 className={cn(sizes.icon, 'animate-spin')} />;
  else if (state === 'speaking') icon = <Square className={cn(sizes.icon, 'fill-current')} />;
  else if (state === 'error') icon = <MicOff className={sizes.icon} />;
  else icon = <Mic className={sizes.icon} />;

  return (
    <button
      ref={buttonRef}
      type="button"
      data-voice-state={state}
      data-testid="push-to-talk"
      aria-pressed={listening}
      aria-label={title ?? STATE_TITLES[state]}
      title={title ?? STATE_TITLES[state]}
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={() => { if (pressingRef.current) endPress('cancel'); }}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      style={PRESS_STYLE}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        sizes.button,
        listening && 'bg-primary text-primary-foreground shadow-md',
        !listening && busy && 'bg-muted text-muted-foreground',
        !listening && state === 'speaking' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        !listening && state === 'error' && 'bg-destructive/10 text-destructive hover:bg-destructive/20',
        !listening && !busy && state !== 'speaking' && state !== 'error' && 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        className,
      )}
    >
      {listening && (
        <span aria-hidden className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
      )}
      <span className="relative">{icon}</span>
    </button>
  );
};
