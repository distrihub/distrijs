import { useCallback, useRef, useState } from 'react';
import { TtsSpeechRequest, TtsSpeechResponse, TtsModelInfo, TtsProviderDefinition } from '@distri/core';
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

export interface StreamingTtsOptions {
  onAudioChunk?: (audioData: Uint8Array) => void;
  onTextChunk?: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
  voice?: string;
  speed?: number;
}

export const useTts = (config: TtsConfig = {}) => {
  const { client } = useDistri();
  const mode = config.mode ?? 'distri';
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
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

  /**
   * Play accumulated audio chunks using Web Audio API.
   */
  const streamingPlayAudio = useCallback((audioChunks: Uint8Array[]): Promise<void> => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const audioContext = audioContextRef.current;

    return new Promise<void>((resolve, reject) => {
      (async () => {
        try {
          const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const combinedArray = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of audioChunks) {
            combinedArray.set(chunk, offset);
            offset += chunk.length;
          }

          const audioBuffer = await audioContext.decodeAudioData(combinedArray.buffer);
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.onended = () => resolve();
          source.start();
        } catch (error) {
          reject(new Error(`Audio playback failed: ${error}`));
        }
      })();
    });
  }, []);

  // ── Model/provider queries ─────────────────────────────────────────────

  /**
   * Fetch available TTS models from the Distri API.
   */
  const fetchModels = useCallback(async (): Promise<TtsModelInfo[]> => {
    if (!client) throw new Error('DistriClient not initialized');
    return client.fetchTtsModels();
  }, [client]);

  /**
   * Fetch TTS provider definitions from the Distri API.
   */
  const fetchProviders = useCallback(async (): Promise<TtsProviderDefinition[]> => {
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

  // ── Streaming TTS (WebSocket) ──────────────────────────────────────────

  const startStreamingTts = useCallback((options: StreamingTtsOptions = {}) => {
    if (!client) throw new Error('DistriClient not initialized');
    if (isSynthesizing) throw new Error('Streaming TTS already in progress');

    const baseUrl = (client as any).config?.baseUrl || '';
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/voice/stream';

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setIsSynthesizing(true);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'start_session' }));
      if (options.voice || options.speed) {
        ws.send(JSON.stringify({ type: 'config', voice: options.voice, speed: options.speed }));
      }
      options.onStart?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'audio_chunk':
            if (data.data) options.onAudioChunk?.(new Uint8Array(data.data));
            break;
          case 'text_chunk':
            options.onTextChunk?.(data.text || '', data.is_final || false);
            break;
          case 'error':
            options.onError?.(new Error(data.message || 'WebSocket error'));
            break;
        }
      } catch {
        options.onError?.(new Error('Failed to parse WebSocket message'));
      }
    };

    ws.onerror = () => options.onError?.(new Error('WebSocket connection error'));

    ws.onclose = () => {
      setIsSynthesizing(false);
      options.onEnd?.();
    };

    return {
      sendText: (text: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'text_chunk', text }));
        }
      },
      stop: () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'end_session' }));
        }
        ws.close();
      },
    };
  }, [client, isSynthesizing]);

  const stopStreamingTts = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    // Also cancel browser speech if active
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
    /** Play streaming audio chunks via Web Audio API. */
    streamingPlayAudio,
    /** Start WebSocket-based streaming TTS (distri mode only). */
    startStreamingTts,
    /** Stop any active TTS (streaming, browser, or server). */
    stopStreamingTts,
    /** Fetch available TTS models (distri mode only). */
    fetchModels,
    /** Fetch TTS provider definitions (distri mode only). */
    fetchProviders,
    /** Get browser SpeechSynthesis voices. */
    getBrowserVoices,
  };
};
