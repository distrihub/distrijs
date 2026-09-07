import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type {
  VoiceSessionOptions,
  VoiceSnapshot,
  VoiceSpeaker,
  VoiceTurnOptions,
} from '@distri/core';
import {
  MicCapture,
  VoiceSession,
  type VoiceChatLike,
  type VoiceSessionDeps,
  type VoiceSttClient,
} from '@distri/state';
import { useDistri } from '../DistriProvider';
import { useTts } from './useTts';

export interface UseVoiceSessionOptions extends VoiceSessionOptions {
  /** `ChatInstance` from `<Chat onChatInstanceReady>`; identity may change, the hook re-binds. */
  chat: VoiceChatLike | null;
  /**
   * Dependency overrides — a fake mic / client / adapter factory for tests and
   * stories. Read once, when the session is created.
   */
  deps?: Partial<Pick<VoiceSessionDeps, 'mic' | 'client' | 'speaker' | 'adapterFactory' | 'timing' | 'vad' | 'vadFactory'>>;
}

export interface UseVoiceSessionReturn extends VoiceSnapshot {
  /** getUserMedia + mint + connect, without listening (pre-warm on mount, optional). */
  prepare: () => Promise<void>;
  /** hold mode: start a turn */
  press: () => void;
  /** hold mode: end the turn and send */
  release: () => void;
  /** drop the current turn without sending (slide-off-to-cancel) */
  cancel: () => void;
  /** auto/manual: open mic and listen continuously */
  start: () => Promise<void>;
  /** manual: send what has been heard */
  commitTurn: () => void;
  /** stop playback and the run */
  interrupt: () => void;
  /** tear down mic, socket, playback; report usage */
  stop: () => void;
  setTurn: (turn: Partial<VoiceTurnOptions>) => void;
  /** The underlying session, for hosts that need more than the hook exposes. */
  session: VoiceSession;
}

/**
 * React binding for `VoiceSession` (spec §2.2). Wires the browser deps —
 * `DistriClient` from `useDistri()`, `MicCapture`, Silero VAD (auto mode /
 * full duplex, lazy), and a speaker from `useTts` (streaming unless
 * `tts.stream === false`) unless `tts.speak` is supplied or `tts === false` —
 * and mirrors the session snapshot into React state.
 */
export function useVoiceSession(options: UseVoiceSessionOptions): UseVoiceSessionReturn {
  const { chat, deps, tts: ttsOption, ...sessionOptions } = options;
  const { client } = useDistri();
  const ttsHook = useTts(ttsOption ? ttsOption.config : undefined);

  const optionsRef = useRef(options);
  optionsRef.current = options;
  const clientRef = useRef(client);
  clientRef.current = client;

  const streamTts = ttsOption !== false && ttsOption?.stream !== false;
  const speaker = useMemo<VoiceSpeaker | null>(() => {
    if (ttsOption === false) return null;
    if (ttsOption?.speak) return { speak: ttsOption.speak };
    if (deps?.speaker !== undefined) return deps.speaker;
    return streamTts ? ttsHook.streamSpeaker : ttsHook.speaker;
  }, [ttsOption, deps?.speaker, streamTts, ttsHook.streamSpeaker, ttsHook.speaker]);

  const [session] = useState(() => {
    const sttClient: VoiceSttClient = deps?.client ?? {
      sttToken: (req) => {
        const c = clientRef.current;
        if (!c) return Promise.reject(new Error('DistriClient not initialized. Wrap your app in <DistriProvider>.'));
        return c.sttToken(req);
      },
      sttUsage: (report) => {
        const c = clientRef.current;
        if (!c) return Promise.resolve();
        return c.sttUsage(report);
      },
    };
    const mic = deps?.mic ?? new MicCapture();
    return new VoiceSession(
      {
        client: sttClient,
        chat,
        mic,
        speaker,
        adapterFactory: deps?.adapterFactory,
        timing: deps?.timing,
        vad: deps?.vad,
        vadFactory: deps?.vadFactory,
      },
      {
        ...sessionOptions,
        onReview: (text) => optionsRef.current.onReview?.(text),
        onError: (error) => optionsRef.current.onError?.(error),
      },
    );
  });

  // Re-bind when the chat identity changes.
  useEffect(() => {
    session.setChat(chat);
  }, [session, chat]);

  useEffect(() => {
    session.setSpeaker(speaker);
  }, [session, speaker]);

  // Push option changes (primitives only; callbacks go through the ref above).
  const turn = sessionOptions.turn;
  const optionsKey = JSON.stringify({
    stt: { model: sessionOptions.stt?.model, language: sessionOptions.stt?.language },
    turn,
    duplex: sessionOptions.duplex,
    review: sessionOptions.review,
  });
  useEffect(() => {
    const current = optionsRef.current;
    session.setOptions({
      stt: current.stt,
      tts: current.tts,
      turn: current.turn,
      duplex: current.duplex,
      review: current.review,
      vad: current.vad,
      onReview: (text) => optionsRef.current.onReview?.(text),
      onError: (error) => optionsRef.current.onError?.(error),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, optionsKey, sessionOptions.stt?.adapter]);

  useEffect(() => () => session.dispose(), [session]);

  const subscribe = useCallback((listener: () => void) => session.subscribe(listener), [session]);
  const getSnapshot = useCallback(() => session.snapshot, [session]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const prepare = useCallback(() => session.prepare(), [session]);
  const press = useCallback(() => session.press(), [session]);
  const release = useCallback(() => session.release(), [session]);
  const cancel = useCallback(() => session.cancel(), [session]);
  const start = useCallback(() => session.start(), [session]);
  const commitTurn = useCallback(() => session.commitTurn(), [session]);
  const interrupt = useCallback(() => session.interrupt(), [session]);
  const stop = useCallback(() => session.stop(), [session]);
  const setTurn = useCallback((t: Partial<VoiceTurnOptions>) => session.setTurn(t), [session]);

  return useMemo<UseVoiceSessionReturn>(() => ({
    ...snapshot,
    prepare,
    press,
    release,
    cancel,
    start,
    commitTurn,
    interrupt,
    stop,
    setTurn,
    session,
  }), [snapshot, prepare, press, release, cancel, start, commitTurn, interrupt, stop, setTurn, session]);
}
