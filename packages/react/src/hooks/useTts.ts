import { useCallback, useRef, useState } from 'react';

export interface TtsRequest {
  text: string;
  model: 'openai' | 'gemini';
  voice?: string;
  speed?: number;
}

export interface TtsConfig {
  baseUrl?: string;
  apiKey?: string;
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
  const baseUrl = config.baseUrl || 'http://localhost:8080/api/v1';
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const synthesize = useCallback(async (request: TtsRequest): Promise<Blob> => {
    const response = await fetch(`${baseUrl}/tts/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `TTS request failed: ${response.status}`);
    }

    return response.blob();
  }, [baseUrl, config.apiKey]);

  const getAvailableVoices = useCallback(async () => {
    const response = await fetch(`${baseUrl}/tts/voices`, {
      headers: {
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get voices: ${response.status}`);
    }

    return response.json();
  }, [baseUrl, config.apiKey]);

  const playAudio = useCallback((audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Audio playback failed'));
      };
      audio.play().catch(reject);
    });
  }, []);

  const streamingPlayAudio = useCallback((audioChunks: Uint8Array[]) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;

    return new Promise<void>(async (resolve, reject) => {
      try {
        // Combine all audio chunks
        const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedArray = new Uint8Array(totalLength);
        let offset = 0;

        for (const chunk of audioChunks) {
          combinedArray.set(chunk, offset);
          offset += chunk.length;
        }

        // Decode and play
        const audioBuffer = await audioContext.decodeAudioData(combinedArray.buffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        source.onended = () => resolve();
        source.start();
      } catch (error) {
        reject(new Error(`Audio playback failed: ${error}`));
      }
    });
  }, []);

  const startStreamingTts = useCallback((options: StreamingTtsOptions = {}) => {
    if (isSynthesizing) {
      throw new Error('Streaming TTS already in progress');
    }

    // Connect to backend voice streaming endpoint
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/voice/stream';
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setIsSynthesizing(true);

    ws.onopen = () => {
      // Start session with optional config
      const configMessage = {
        type: 'start_session'
      };
      ws.send(JSON.stringify(configMessage));
      
      // Send config if voice/speed are specified
      if (options.voice || options.speed) {
        const configUpdate = {
          type: 'config',
          voice: options.voice,
        };
        ws.send(JSON.stringify(configUpdate));
      }
      
      options.onStart?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'audio_chunk':
            if (data.data) {
              const audioData = new Uint8Array(data.data);
              options.onAudioChunk?.(audioData);
            }
            break;
          case 'text_chunk':
            options.onTextChunk?.(data.text || '', data.is_final || false);
            break;
          case 'session_started':
            // Session successfully started
            break;
          case 'session_ended':
            // Session ended
            break;
          case 'error':
            options.onError?.(new Error(data.message || 'WebSocket error'));
            break;
        }
      } catch (error) {
        options.onError?.(new Error('Failed to parse WebSocket message'));
      }
    };

    ws.onerror = () => {
      options.onError?.(new Error('WebSocket connection error'));
    };

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
      }
    };
  }, [isSynthesizing, baseUrl]);

  const stopStreamingTts = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsSynthesizing(false);
    }
  }, []);

  return {
    synthesize,
    getAvailableVoices,
    playAudio,
    streamingPlayAudio,
    startStreamingTts,
    stopStreamingTts,
    isSynthesizing,
  };
};