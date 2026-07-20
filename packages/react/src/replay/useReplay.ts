import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { replayStateAt } from './reducer';
import type { Cassette, ReplayState } from './types';

/** Clock granularity. Interval (not rAF) so the hook is testable with fake timers. */
const TICK_MS = 50;

const EMPTY_STATE: ReplayState = {
  messages: [],
  toolCalls: new Map(),
  uiMutations: [],
  taskSummaries: [],
  workflow: null,
  isStreaming: false,
};

export interface UseReplayOptions {
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
  /**
   * When `false` (the default), playback pauses the instant an interactive
   * checkpoint (a `tool_call` whose resolution is a `user_tool_input`, i.e.
   * a HITL card) appears, and waits for a real click — so a visitor
   * experiences the demo as something *they* are doing, not something
   * playing at them. Set `true` to sail straight through every checkpoint
   * unattended, exactly like plain playback.
   */
  autoAccept?: boolean;
}

export interface Checkpoint {
  toolCallId: string;
  /** The `t` of the `tool_call` event itself — where playback pauses. */
  appearsAt: number;
  /** The `t` of the scripted `user_tool_input` resolution. */
  resolveAt: number;
}

export interface UseReplayResult extends ReplayState {
  /** Current playhead, ms. */
  t: number;
  /** 0..1 */
  progress: number;
  isPlaying: boolean;
  speed: number;
  autoAccept: boolean;
  /** The checkpoint currently blocking autoplay, if any. */
  pendingCheckpoint: Checkpoint | undefined;
  /** True while `pendingCheckpoint` is set and `autoAccept` is off. */
  awaitingInput: boolean;
  play: () => void;
  pause: () => void;
  restart: () => void;
  seek: (ms: number) => void;
  setSpeed: (s: number) => void;
  setAutoAccept: (v: boolean) => void;
  /** Resolves `checkpoint` (seeks to its scripted resolution and resumes play). */
  resolveCheckpoint: (checkpoint: Checkpoint) => void;
}

function findCheckpoints(cassette: Cassette | null): Checkpoint[] {
  if (!cassette) return [];
  const appearsAt = new Map<string, number>();
  const resolveAt = new Map<string, number>();
  for (const event of cassette.events) {
    if (event.kind === 'tool_call') appearsAt.set(event.id, event.t);
    if (event.kind === 'user_tool_input') resolveAt.set(event.id, event.t);
  }
  const checkpoints: Checkpoint[] = [];
  for (const [toolCallId, resolveAtT] of resolveAt) {
    const appearsAtT = appearsAt.get(toolCallId);
    if (appearsAtT !== undefined) checkpoints.push({ toolCallId, appearsAt: appearsAtT, resolveAt: resolveAtT });
  }
  return checkpoints.sort((a, b) => a.appearsAt - b.appearsAt);
}

/**
 * Drives a cassette's playhead. `cassette` may be `null` while a `dataUrl`
 * source (see `useCassetteFromUrl`) is still loading — callers can invoke
 * this hook unconditionally and get an empty, paused state back until data
 * arrives, rather than having to call hooks conditionally.
 */
export function useReplay(cassette: Cassette | null, options: UseReplayOptions = {}): UseReplayResult {
  const { autoplay = false, loop = false, speed: initialSpeed = 1, autoAccept: initialAutoAccept = false } = options;

  const [t, setT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [speed, setSpeedState] = useState(initialSpeed);
  const [autoAccept, setAutoAccept] = useState(initialAutoAccept);

  const duration = cassette?.durationMs ?? 0;
  const loopRef = useRef(loop);
  loopRef.current = loop;
  const autoAcceptRef = useRef(autoAccept);
  autoAcceptRef.current = autoAccept;

  const checkpoints = useMemo(() => findCheckpoints(cassette), [cassette]);
  const checkpointsRef = useRef(checkpoints);
  checkpointsRef.current = checkpoints;

  useEffect(() => {
    if (!isPlaying || !cassette) return undefined;

    const id = setInterval(() => {
      setT((prev) => {
        const next = prev + TICK_MS * speed;

        if (!autoAcceptRef.current) {
          const blocking = checkpointsRef.current.find((c) => prev < c.appearsAt && c.appearsAt <= next);
          if (blocking) {
            setIsPlaying(false);
            return blocking.appearsAt;
          }
        }

        if (next >= duration) {
          if (loopRef.current) return 0;
          setIsPlaying(false);
          return duration;
        }
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [isPlaying, speed, duration, cassette]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  const seek = useCallback(
    (ms: number) => setT(Math.min(duration, Math.max(0, ms))),
    [duration],
  );

  const restart = useCallback(() => {
    setT(0);
    setIsPlaying(true);
  }, []);

  const setSpeed = useCallback((s: number) => setSpeedState(s), []);

  const resolveCheckpoint = useCallback((checkpoint: Checkpoint) => {
    setT(Math.min(duration, checkpoint.resolveAt));
    setIsPlaying(true);
  }, [duration]);

  const state = useMemo(() => (cassette ? replayStateAt(cassette, t) : EMPTY_STATE), [cassette, t]);

  const pendingCheckpoint = useMemo(
    () => (autoAccept ? undefined : checkpoints.find((c) => t >= c.appearsAt && t < c.resolveAt)),
    [checkpoints, t, autoAccept],
  );

  return {
    ...state,
    t,
    progress: duration > 0 ? Math.min(1, t / duration) : 1,
    isPlaying,
    speed,
    autoAccept,
    pendingCheckpoint,
    awaitingInput: pendingCheckpoint !== undefined,
    play,
    pause,
    restart,
    seek,
    setSpeed,
    setAutoAccept,
    resolveCheckpoint,
  };
}
