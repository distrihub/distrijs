import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TtsSpeechRequest, TtsSpeechResponse, TtsSpeechStreamResponse, TtsConfig, VoiceSpeaker } from '@distri/core';
import { AudioElementPlayer, SpeechQueue } from '@distri/state';
import { useDistri } from '../DistriProvider';

export type TtsMode = 'distri' | 'browser';
export type { TtsConfig } from '@distri/core';

function abortError(): Error {
  const err = new Error('Speech aborted');
  err.name = 'AbortError';
  return err;
}

function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

/** What the streaming speaker's `synthesize` hands to `play`. */
type StreamSpeakerItem =
  | { kind: 'stream'; sentence: string; response: TtsSpeechStreamResponse }
  | { kind: 'buffer'; sentence: string; audio: TtsSpeechResponse };

/**
 * Text-to-speech through the Distri server (`POST /audio/speech`) or the
 * browser's `speechSynthesis`.
 *
 * Playback goes through ONE owned `<audio>` element (so `stop()` really stops
 * server-side audio) and `speak()`/`speakQueued()` are serialized through a
 * `SpeechQueue` that synthesizes the next sentence while the current one plays.
 */
export const useTts = (config: TtsConfig = {}) => {
  const { client } = useDistri();
  const mode = config.mode ?? 'distri';
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playerRef = useRef<AudioElementPlayer | null>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const clientRef = useRef(client);
  clientRef.current = client;

  const getPlayer = useCallback((): AudioElementPlayer => {
    if (!playerRef.current) playerRef.current = new AudioElementPlayer();
    return playerRef.current;
  }, []);

  // ── Distri server-side TTS ─────────────────────────────────────────────

  /**
   * Synthesize speech via the Distri TTS API.
   * Returns a Blob containing audio data.
   */
  const synthesizeDistri = useCallback(async (request: TtsSpeechRequest): Promise<TtsSpeechResponse> => {
    const c = clientRef.current;
    if (!c) {
      throw new Error('DistriClient not initialized. Wrap your app in <DistriProvider>.');
    }
    setIsSynthesizing(true);
    try {
      return await c.ttsSpeech(request);
    } finally {
      setIsSynthesizing(false);
    }
  }, []);

  // ── Browser SpeechSynthesis TTS ────────────────────────────────────────

  /**
   * Synthesize speech using the browser's built-in SpeechSynthesis API.
   * Returns a promise that resolves when speech finishes.
   */
  const synthesizeBrowser = useCallback((
    text: string,
    options?: { voice?: string; speed?: number; signal?: AbortSignal },
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        reject(new Error('Browser SpeechSynthesis not supported'));
        return;
      }
      if (options?.signal?.aborted) {
        reject(abortError());
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const cfg = configRef.current;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.speed ?? cfg.defaultSpeed ?? 1.0;

      // Find requested voice
      const voiceName = options?.voice ?? cfg.defaultVoice;
      if (voiceName) {
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find(v => v.name === voiceName || v.voiceURI === voiceName || v.lang === voiceName);
        if (match) utterance.voice = match;
      }

      utteranceRef.current = utterance;
      setIsSynthesizing(true);

      const onAbort = () => {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
        setIsSynthesizing(false);
        reject(abortError());
      };
      options?.signal?.addEventListener('abort', onAbort, { once: true });

      utterance.onend = () => {
        options?.signal?.removeEventListener('abort', onAbort);
        setIsSynthesizing(false);
        utteranceRef.current = null;
        resolve();
      };
      utterance.onerror = (event) => {
        options?.signal?.removeEventListener('abort', onAbort);
        setIsSynthesizing(false);
        utteranceRef.current = null;
        if (event.error === 'interrupted' || event.error === 'canceled') {
          reject(abortError());
          return;
        }
        reject(new Error(`SpeechSynthesis error: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // ── Unified synthesize ─────────────────────────────────────────────────

  const buildRequest = useCallback((input: string | TtsSpeechRequest): TtsSpeechRequest => {
    const cfg = configRef.current;
    return typeof input === 'string'
      ? {
        input,
        model: cfg.defaultModel,
        voice: cfg.defaultVoice,
        provider: cfg.defaultProvider,
        speed: cfg.defaultSpeed,
      }
      : {
        ...input,
        model: input.model ?? cfg.defaultModel,
        voice: input.voice ?? cfg.defaultVoice,
        provider: input.provider ?? cfg.defaultProvider,
        speed: input.speed ?? cfg.defaultSpeed,
      };
  }, []);

  /**
   * Synthesize speech. In 'distri' mode, calls the server API and returns a Blob.
   * In 'browser' mode, uses SpeechSynthesis directly (no audio Blob returned).
   */
  const synthesize = useCallback(async (
    input: string | TtsSpeechRequest,
  ): Promise<TtsSpeechResponse | void> => {
    if (mode === 'browser') {
      const text = typeof input === 'string' ? input : input.input;
      const opts = typeof input === 'string' ? undefined : { voice: input.voice, speed: input.speed };
      return synthesizeBrowser(text, opts);
    }
    return synthesizeDistri(buildRequest(input));
  }, [mode, synthesizeDistri, synthesizeBrowser, buildRequest]);

  // ── Audio playback utilities ───────────────────────────────────────────

  /**
   * Play audio from a TtsSpeechResponse (Distri mode) or raw Blob through the
   * owned `<audio>` element. A clip already playing is superseded.
   */
  const playAudio = useCallback((audio: TtsSpeechResponse | Blob, opts?: { signal?: AbortSignal }): Promise<void> => {
    return getPlayer().play(audio, opts);
  }, [getPlayer]);

  // ── Speaker + queue ────────────────────────────────────────────────────

  /**
   * A `VoiceSpeaker` for `VoiceSession`/`SpeechQueue`. Stable per mode. In
   * distri mode it exposes `synthesize` + `play` so the queue can pipeline.
   */
  const speaker = useMemo<VoiceSpeaker>(() => {
    if (mode === 'browser') {
      return {
        speak: (sentence, { signal }) => synthesizeBrowser(sentence, { signal }),
      };
    }
    return {
      speak: async (sentence, { signal }) => {
        const audio = await synthesizeDistri(buildRequest(sentence));
        if (signal.aborted) throw abortError();
        await getPlayer().play(audio, { signal });
      },
      synthesize: (sentence) => synthesizeDistri(buildRequest(sentence)),
      play: (item, { signal }) => getPlayer().play(item as TtsSpeechResponse, { signal }),
    };
  }, [mode, synthesizeBrowser, synthesizeDistri, buildRequest, getPlayer]);

  /**
   * Streaming synthesis (phase 4): `POST /audio/speech` with `stream: true`,
   * played through MediaSource as chunks arrive; buffered where MediaSource
   * cannot play the type. Rejects with an AbortError when `signal` aborts.
   */
  const speakStream = useCallback(async (sentence: string, opts?: { signal?: AbortSignal }): Promise<void> => {
    const c = clientRef.current;
    if (!c) throw new Error('DistriClient not initialized. Wrap your app in <DistriProvider>.');
    const response = await c.ttsSpeechStream(buildRequest(sentence));
    if (opts?.signal?.aborted) {
      response.body.cancel().catch(() => undefined);
      throw abortError();
    }
    await getPlayer().playStream(response.body, response.contentType, opts);
  }, [buildRequest, getPlayer]);

  /**
   * Like `speaker`, but streams. `synthesize` opens the streaming request
   * (so sentence N+1's bytes start flowing while N plays) and `play` pipes it
   * through MediaSource; either step falls back to the buffered endpoint on a
   * non-abort error. Browser mode has nothing to stream and reuses `speaker`.
   */
  const streamSpeaker = useMemo<VoiceSpeaker>(() => {
    if (mode === 'browser') return speaker;
    const synthesize = async (sentence: string): Promise<StreamSpeakerItem> => {
      const c = clientRef.current;
      if (!c) throw new Error('DistriClient not initialized. Wrap your app in <DistriProvider>.');
      try {
        return { kind: 'stream', sentence, response: await c.ttsSpeechStream(buildRequest(sentence)) };
      } catch {
        return { kind: 'buffer', sentence, audio: await synthesizeDistri(buildRequest(sentence)) };
      }
    };
    const play = async (item: unknown, { signal }: { signal: AbortSignal }): Promise<void> => {
      const it = item as StreamSpeakerItem;
      if (it.kind === 'buffer') {
        await getPlayer().play(it.audio, { signal });
        return;
      }
      try {
        await getPlayer().playStream(it.response.body, it.response.contentType, { signal });
      } catch (err) {
        if (signal.aborted || isAbort(err)) throw err;
        const audio = await synthesizeDistri(buildRequest(it.sentence));
        if (signal.aborted) throw abortError();
        await getPlayer().play(audio, { signal });
      }
    };
    return {
      speak: async (sentence, { signal }) => play(await synthesize(sentence), { signal }),
      synthesize,
      play,
    };
  }, [mode, speaker, buildRequest, synthesizeDistri, getPlayer]);

  const queueRef = useRef<SpeechQueue | null>(null);
  const getQueue = useCallback((): SpeechQueue => {
    if (!queueRef.current) {
      queueRef.current = new SpeechQueue(speaker, {
        onSentenceStart: () => setIsSpeaking(true),
        onDrained: () => setIsSpeaking(false),
      });
    }
    return queueRef.current;
  }, [speaker]);

  useEffect(() => {
    queueRef.current?.setSpeaker(speaker);
  }, [speaker]);

  /**
   * Queue one sentence. Resolves when it has been spoken (or was aborted).
   * Aborting `signal` interrupts the whole queue (the sentence's turn is over).
   */
  const speakQueued = useCallback((sentence: string, opts?: { signal?: AbortSignal }): Promise<void> => {
    const queue = getQueue();
    if (opts?.signal?.aborted) return Promise.reject(abortError());
    const done = queue.enqueue(sentence);
    if (opts?.signal) {
      const onAbort = () => queue.abortAll();
      opts.signal.addEventListener('abort', onAbort, { once: true });
      done.finally(() => opts.signal?.removeEventListener('abort', onAbort)).catch(() => undefined);
    }
    return done;
  }, [getQueue]);

  // ── Model/provider queries ─────────────────────────────────────────────

  /**
   * Fetch available TTS models from the Distri API.
   */
  const fetchModels = useCallback(async (): Promise<any[]> => {
    if (!client) throw new Error('DistriClient not initialized');
    return client.fetchTtsModels();
  }, [client]);

  /**
   * Fetch TTS provider definitions from the Distri API.
   */
  const fetchProviders = useCallback(async (): Promise<any[]> => {
    if (!client) throw new Error('DistriClient not initialized');
    return client.fetchTtsProviders();
  }, [client]);

  /**
   * Get browser SpeechSynthesis voices.
   */
  const getBrowserVoices = useCallback((): SpeechSynthesisVoice[] => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }, []);

  // ── Stop ────────────────────────────────────────────────────────────────

  /** Stop everything: the queue, the owned `<audio>` element and browser speech. */
  const stop = useCallback(() => {
    queueRef.current?.abortAll();
    playerRef.current?.stop();
    if (utteranceRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    setIsSpeaking(false);
    setIsSynthesizing(false);
  }, []);

  /**
   * Synthesize and play. Strings are queued (serialized, never overlapping);
   * a full `TtsSpeechRequest` with per-request options plays immediately and
   * supersedes whatever the element was playing.
   */
  const speak = useCallback(async (input: string | TtsSpeechRequest): Promise<void> => {
    if (typeof input === 'string') {
      return speakQueued(input);
    }
    if (mode === 'browser') {
      return synthesizeBrowser(input.input, { voice: input.voice, speed: input.speed });
    }
    const result = await synthesizeDistri(buildRequest(input));
    await playAudio(result);
  }, [mode, speakQueued, synthesizeBrowser, synthesizeDistri, buildRequest, playAudio]);

  useEffect(() => () => {
    queueRef.current?.abortAll();
    playerRef.current?.dispose();
  }, []);

  return {
    /** Current TTS mode ('distri' or 'browser'). */
    mode,
    /** Whether speech is currently being synthesized. */
    isSynthesizing,
    /** Whether the queue is playing. */
    isSpeaking,
    /** Synthesize speech. Returns TtsSpeechResponse in distri mode, void in browser mode. */
    synthesize,
    /** Synthesize and play. Strings go through the queue. */
    speak,
    /** Queue one sentence; resolves when spoken. */
    speakQueued,
    /** Stream one sentence through MediaSource (buffered fallback). Not queued. */
    speakStream,
    /** Play audio from a TtsSpeechResponse or Blob through the owned element. */
    playAudio,
    /** Stop the queue and any active playback (browser or server). */
    stop,
    /** Buffered `VoiceSpeaker` for `useVoiceSession` / `SpeechQueue`. */
    speaker,
    /** Streaming `VoiceSpeaker` (the default for `useVoiceSession` unless `tts.stream === false`). */
    streamSpeaker,
    /** Fetch available TTS models (distri mode only). */
    fetchModels,
    /** Fetch TTS provider definitions (distri mode only). */
    fetchProviders,
    /** Get browser SpeechSynthesis voices. */
    getBrowserVoices,
  };
};
