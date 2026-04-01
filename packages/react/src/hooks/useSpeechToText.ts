import { useDistri } from '@/DistriProvider';
import { SpeechToTextConfig } from '@distri/core';
import { useCallback, useState } from 'react';

export const useSpeechToText = () => {
  const { client } = useDistri();
  const [isTranscribing, setIsTranscribing] = useState(false);

  /**
   * Transcribe a single audio blob via the backend TTS API.
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

  return {
    transcribe,
    isTranscribing,
  };
};
