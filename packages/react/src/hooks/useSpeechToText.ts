import { useCallback, useRef, useState } from 'react';

export interface SpeechToTextConfig {
  baseUrl?: string;
  model?: 'whisper-1';
  language?: string;
  temperature?: number;
}

export interface StreamingTranscriptionOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export const useSpeechToText = (config: SpeechToTextConfig = {}) => {
  const baseUrl = config.baseUrl || 'http://localhost:8080/api/v1';
  const [isTranscribing, setIsTranscribing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const transcribe = useCallback(async (audioBlob: Blob): Promise<string> => {
    // Convert blob to base64 for the new API
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64String = btoa(String.fromCharCode(...uint8Array));

    const requestBody = {
      audio: base64String,
      model: config.model || 'whisper-1',
      ...(config.language && { language: config.language }),
      ...(config.temperature !== undefined && { temperature: config.temperature }),
    };

    const response = await fetch(`${baseUrl}/tts/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Transcription failed: ${response.status}`);
    }

    const result = await response.json();
    return result.text || '';
  }, [baseUrl, config]);

  const startStreamingTranscription = useCallback((options: StreamingTranscriptionOptions = {}) => {
    if (isTranscribing) {
      throw new Error('Streaming transcription already in progress');
    }

    // Connect to backend voice streaming endpoint
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/voice/stream';
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setIsTranscribing(true);

    ws.onopen = () => {
      // Start session
      ws.send(JSON.stringify({ type: 'start_session' }));
      options.onStart?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'text_chunk':
            options.onTranscript?.(data.text || '', data.is_final || false);
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
      setIsTranscribing(false);
      options.onEnd?.();
    };

    return {
      sendAudio: (audioData: ArrayBuffer) => {
        if (ws.readyState === WebSocket.OPEN) {
          // Send binary audio data
          ws.send(audioData);
        }
      },
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
  }, [isTranscribing, baseUrl]);

  const stopStreamingTranscription = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsTranscribing(false);
    }
  }, []);

  return {
    transcribe,
    startStreamingTranscription,
    stopStreamingTranscription,
    isTranscribing,
  };
};