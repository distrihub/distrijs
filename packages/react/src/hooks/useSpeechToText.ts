import { useDistri } from '@/DistriProvider';
import { StreamingTranscriptionOptions, SpeechToTextConfig } from '@distri/core';
import { useCallback, useRef, useState } from 'react';

interface StreamingConnection {
  sendAudio: (audioData: ArrayBuffer) => void;
  sendText: (text: string) => void;
  stop: () => void;
  close: () => void;
}

export const useSpeechToText = () => {
  // Initialize DistriClient automatically
  const { client } = useDistri();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingConnectionRef = useRef<StreamingConnection | null>(null);

  /**
   * Transcribe a single audio blob
   */
  const transcribe = useCallback(async (audioBlob: Blob, config: SpeechToTextConfig = {}) => {
    if (!client) {
      throw new Error('DistriClient not initialized');
    }
    if (isTranscribing) {
      throw new Error('Transcription already in progress');
    }

    setIsTranscribing(true);
    try {
      const result = await client.transcribe(audioBlob, config);
      return result;
    } finally {
      setIsTranscribing(false);
    }
  }, [client, isTranscribing]);

  /**
   * Start streaming transcription
   */
  const startStreamingTranscription = useCallback(async (options: StreamingTranscriptionOptions = {}) => {
    if (!client) {
      throw new Error('DistriClient not initialized');
    }
    if (isStreaming) {
      throw new Error('Streaming transcription already in progress');
    }

    setIsStreaming(true);

    const enhancedOptions = {
      ...options,
      onStart: () => {
        console.log('🎤 Streaming transcription started');
        options.onStart?.();
      },
      onEnd: () => {
        console.log('🎤 Streaming transcription ended');
        setIsStreaming(false);
        streamingConnectionRef.current = null;
        options.onEnd?.();
      },
      onError: (error: Error) => {
        console.error('🎤 Streaming transcription error:', error);
        setIsStreaming(false);
        streamingConnectionRef.current = null;
        options.onError?.(error);
      },
      onTranscript: (text: string, isFinal: boolean) => {
        console.log('🎤 Transcript:', { text, isFinal });
        options.onTranscript?.(text, isFinal);
      }
    };

    try {
      const connection = await client.streamingTranscription(enhancedOptions);
      streamingConnectionRef.current = connection;
      return connection;
    } catch (error) {
      setIsStreaming(false);
      streamingConnectionRef.current = null;
      throw error;
    }
  }, [client, isStreaming]);

  /**
   * Stop streaming transcription
   */
  const stopStreamingTranscription = useCallback(() => {
    if (streamingConnectionRef.current) {
      console.log('🎤 Stopping streaming transcription');
      streamingConnectionRef.current.stop();
      streamingConnectionRef.current.close();
      streamingConnectionRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  /**
   * Send audio data to the streaming connection
   */
  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (streamingConnectionRef.current) {
      streamingConnectionRef.current.sendAudio(audioData);
    } else {
      console.warn('🎤 No active streaming connection to send audio to');
    }
  }, []);

  /**
   * Send text data to the streaming connection
   */
  const sendText = useCallback((text: string) => {
    if (streamingConnectionRef.current) {
      streamingConnectionRef.current.sendText(text);
    } else {
      console.warn('🎤 No active streaming connection to send text to');
    }
  }, []);

  return {
    // Single transcription
    transcribe,
    isTranscribing,

    // Streaming transcription
    startStreamingTranscription,
    stopStreamingTranscription,
    sendAudio,
    sendText,
    isStreaming,
  };
};