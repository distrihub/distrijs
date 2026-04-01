import { useCallback, useRef, useState } from 'react';
import { TtsSpeechRequest, TtsSpeechResponse } from '@distri/core';
import { useDistri } from '../DistriProvider';

export type TtsMode = 'distri' | 'browser';

export interface TtsConfig {
  /** Use Distri server-side TTS ('distri') or browser SpeechSynthesis ('browser'). Defaults to 'distri'. */
  mode?: TtsMode;
  /** Default voice to use when not specified per-request. */
  defaultVoice?: string;
  /** Default speed multiplier (0.25–4.0 for Distri, 0.1–10 for browser). */
  defaultSpeed?: number;
  /** Default provider (only used in 'distri' mode). */
  defaultProvider?: string;
  /** Default model (only used in 'distri' mode). */
  defaultModel?: string;
}

export const useTts = (config: TtsConfig = {}) => {
  const { client } = useDistri();
  const mode = config.mode ?? 'distri';
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ── Distri server-side TTS ─────────────────────────────────────────────

  /**
   * Synthesize speech via the Distri TTS API.
   * Returns a Blob containing audio data.
   */
  const synthesizeDistri = useCallback(async (request: TtsSpeechRequest): Promise<TtsSpeechResponse> => {
    if (!client) {
      throw new Error('DistriClient not initialized. Wrap your app in <DistriProvider>.');
    }
    setIsSynthesizing(true);
    try {
      return await client.ttsSpeech(request);
    } finally {
      setIsSynthesizing(false);
    }
  }, [client]);

  // ── Browser SpeechSynthesis TTS ────────────────────────────────────────

  /**
   * Synthesize speech using the browser's built-in SpeechSynthesis API.
   * Returns a promise that resolves when speech finishes.
   */
  const synthesizeBrowser = useCallback((text: string, options?: { voice?: string; speed?: number }): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Browser SpeechSynthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.speed ?? config.defaultSpeed ?? 1.0;

      // Find requested voice
      const voiceName = options?.voice ?? config.defaultVoice;
      if (voiceName) {
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find(v => v.name === voiceName || v.voiceURI === voiceName || v.lang === voiceName);
        if (match) utterance.voice = match;
      }

      utteranceRef.current = utterance;
      setIsSynthesizing(true);

      utterance.onend = () => {
        setIsSynthesizing(false);
        utteranceRef.current = null;
        resolve();
      };
      utterance.onerror = (event) => {
        setIsSynthesizing(false);
        utteranceRef.current = null;
        reject(new Error(`SpeechSynthesis error: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [config.defaultVoice, config.defaultSpeed]);

  // ── Unified synthesize ─────────────────────────────────────────────────

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

    // Distri mode
    const request: TtsSpeechRequest = typeof input === 'string'
      ? {
        input,
        model: config.defaultModel,
        voice: config.defaultVoice,
        provider: config.defaultProvider,
        speed: config.defaultSpeed,
      }
      : {
        ...input,
        model: input.model ?? config.defaultModel,
        voice: input.voice ?? config.defaultVoice,
        provider: input.provider ?? config.defaultProvider,
        speed: input.speed ?? config.defaultSpeed,
      };

    return synthesizeDistri(request);
  }, [mode, config.defaultModel, config.defaultVoice, config.defaultProvider, config.defaultSpeed, synthesizeDistri, synthesizeBrowser]);

  // ── Audio playback utilities ───────────────────────────────────────────

  /**
   * Play audio from a TtsSpeechResponse (Distri mode) or raw Blob.
   */
  const playAudio = useCallback((audio: TtsSpeechResponse | Blob): Promise<void> => {
    const blob = audio instanceof Blob
      ? audio
      : new Blob([audio.audio], { type: audio.contentType });
    const audioUrl = URL.createObjectURL(blob);
    const audioEl = new Audio(audioUrl);

    return new Promise<void>((resolve, reject) => {
      audioEl.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audioEl.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Audio playback failed'));
      };
      audioEl.play().catch(reject);
    });
  }, []);

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
    if (!('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }, []);

  // ── Stop ────────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    setIsSynthesizing(false);
  }, []);

  /**
   * Synthesize and immediately play audio. Convenience method.
   */
  const speak = useCallback(async (input: string | TtsSpeechRequest): Promise<void> => {
    if (mode === 'browser') {
      const text = typeof input === 'string' ? input : input.input;
      const opts = typeof input === 'string' ? undefined : { voice: input.voice, speed: input.speed };
      return synthesizeBrowser(text, opts);
    }

    const result = await synthesize(input);
    if (result && 'audio' in result) {
      await playAudio(result);
    }
  }, [mode, synthesize, playAudio, synthesizeBrowser]);

  return {
    /** Current TTS mode ('distri' or 'browser'). */
    mode,
    /** Whether speech is currently being synthesized or played. */
    isSynthesizing,
    /** Synthesize speech. Returns TtsSpeechResponse in distri mode, void in browser mode. */
    synthesize,
    /** Synthesize and immediately play. Works in both modes. */
    speak,
    /** Play audio from a TtsSpeechResponse or Blob. */
    playAudio,
    /** Stop any active TTS (browser or server). */
    stop,
    /** Fetch available TTS models (distri mode only). */
    fetchModels,
    /** Fetch TTS provider definitions (distri mode only). */
    fetchProviders,
    /** Get browser SpeechSynthesis voices. */
    getBrowserVoices,
  };
};
