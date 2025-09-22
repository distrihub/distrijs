import React, { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useSpeechToText } from '../hooks/useSpeechToText';

export interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  // Configuration
  language?: string;
  interimResults?: boolean;
  // Fallback to backend API
  useBrowserSpeechRecognition?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onError,
  className = "",
  disabled = false,
  language = 'en-US',
  interimResults = true,
  useBrowserSpeechRecognition = true,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // React Speech Recognition hook
  const {
    transcript,
    interimTranscript: browserInterimTranscript,
    finalTranscript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Backend fallback hook
  const speechToText = useSpeechToText();

  // Check if we should use browser speech recognition or backend fallback
  const useBrowser = useBrowserSpeechRecognition && browserSupportsSpeechRecognition;
  const canUseBackend = !useBrowser && speechToText;

  // Handle final transcript from browser speech recognition
  useEffect(() => {
    if (finalTranscript && finalTranscript.trim()) {
      onTranscript(finalTranscript.trim());
      resetTranscript();
      setShowModal(false);
      setIsListening(false);
    }
  }, [finalTranscript, onTranscript, resetTranscript]);

  // Update interim transcript for display
  useEffect(() => {
    if (useBrowser) {
      setInterimTranscript(browserInterimTranscript || transcript);
    }
  }, [browserInterimTranscript, transcript, useBrowser]);

  const startListening = useCallback(async () => {
    if (disabled) return;

    setShowModal(true);
    setIsListening(true);
    setInterimTranscript('');

    if (useBrowser) {
      try {
        await SpeechRecognition.startListening({
          continuous: true,
          language,
          interimResults,
        });
      } catch (error) {
        console.error('Speech recognition error:', error);
        onError?.('Failed to start speech recognition');
        setShowModal(false);
        setIsListening(false);
      }
    } else if (canUseBackend) {
      // Use backend API as fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        setMediaRecorder(recorder);

        const chunks: BlobPart[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });

          try {
            if (!speechToText) {
              throw new Error('No DistriClient available for transcription');
            }

            setInterimTranscript('Processing...');
            const transcript = await speechToText.transcribe(audioBlob, { model: 'whisper-1' });

            if (transcript.trim()) {
              onTranscript(transcript.trim());
            }

            setShowModal(false);
            setIsListening(false);
            setInterimTranscript('');
          } catch (error) {
            console.error('Backend transcription error:', error);
            onError?.(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setShowModal(false);
            setIsListening(false);
            setInterimTranscript('');
          } finally {
            // Stop all tracks to release the microphone
            stream.getTracks().forEach(track => track.stop());
            setMediaRecorder(null);
          }
        };

        recorder.start();

        // Auto-stop after 30 seconds to prevent indefinite recording
        const timeoutId = setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, 30000);

        // Store timeout for cleanup
        (recorder as any)._timeout = timeoutId;

      } catch (error) {
        console.error('Microphone access error:', error);
        onError?.('Failed to access microphone');
        setShowModal(false);
        setIsListening(false);
      }
    } else {
      // Neither browser speech recognition nor backend is available
      onError?.('Speech recognition is not available. Please provide a DistriClient for backend transcription.');
      setShowModal(false);
      setIsListening(false);
    }
  }, [disabled, useBrowser, canUseBackend, language, interimResults, onError]);

  const stopListening = useCallback(() => {
    if (useBrowser) {
      SpeechRecognition.stopListening();
    } else if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Stop backend recording
      mediaRecorder.stop();
      // Clear any timeout
      if ((mediaRecorder as any)._timeout) {
        clearTimeout((mediaRecorder as any)._timeout);
      }
    }

    // If we have a final transcript from the current session, send it
    if (interimTranscript.trim() && interimTranscript !== 'Processing...') {
      onTranscript(interimTranscript.trim());
    }

    setShowModal(false);
    setIsListening(false);
    setInterimTranscript('');
    resetTranscript();
  }, [useBrowser, mediaRecorder, interimTranscript, onTranscript, resetTranscript]);

  const handleCancel = useCallback(() => {
    if (useBrowser) {
      SpeechRecognition.stopListening();
    } else if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Stop backend recording without processing
      mediaRecorder.stop();
      // Clear any timeout
      if ((mediaRecorder as any)._timeout) {
        clearTimeout((mediaRecorder as any)._timeout);
      }
    }
    setShowModal(false);
    setIsListening(false);
    setInterimTranscript('');
    resetTranscript();
  }, [useBrowser, mediaRecorder, resetTranscript]);

  // Auto-stop after silence (browser handles this, but we can add a timeout)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isListening && !listening && interimTranscript.trim()) {
      // If browser stopped listening but we have text, send it after a short delay
      timeoutId = setTimeout(() => {
        stopListening();
      }, 1000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isListening, listening, interimTranscript, stopListening]);

  const isActive = isListening || listening;

  return (
    <>
      {/* Voice button */}
      <button
        onClick={isActive ? stopListening : startListening}
        disabled={disabled || (speechToText?.isTranscribing ?? false)}
        className={`h-10 w-10 rounded-md transition-colors flex items-center justify-center ${isActive
          ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
          : 'hover:bg-muted text-muted-foreground'
          } ${className}`}
        title={isActive ? "Click to stop recording" : (useBrowser ? "Click to speak" : canUseBackend ? "Click to record for transcription" : "Speech recognition not available")}
      >
        {(speechToText?.isTranscribing ?? false) ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isActive ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>

      {/* Voice input modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              {/* Large pulsing microphone icon */}
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${listening
                ? 'bg-blue-600 animate-pulse shadow-lg shadow-blue-600/30'
                : 'bg-muted'
                }`}>
                <Mic className="h-10 w-10 text-white" />
              </div>

              {/* Status text */}
              <h3 className="text-lg font-semibold mb-2">
                {listening ? 'Listening...' : useBrowser ? 'Click to start speaking' : 'Recording for transcription...'}
              </h3>

              {/* Transcript display */}
              <div className="min-h-[60px] p-3 bg-muted rounded-lg text-left">
                {interimTranscript ? (
                  <p className="text-sm">
                    <span className={listening ? 'text-muted-foreground' : 'text-foreground'}>
                      {interimTranscript}
                    </span>
                    {listening && <span className="animate-pulse">|</span>}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Start speaking...
                  </p>
                )}
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>

              {!listening && interimTranscript.trim() && (
                <button
                  onClick={stopListening}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Send
                </button>
              )}

              {!listening && !interimTranscript.trim() && (
                <button
                  onClick={startListening}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Listening
                </button>
              )}

              {/* Stop button for backend recording */}
              {!useBrowser && isListening && mediaRecorder && mediaRecorder.state === 'recording' && (
                <button
                  onClick={stopListening}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Stop Recording
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              {useBrowser
                ? "Speak naturally. The system will automatically detect when you're finished."
                : "Speak clearly. Click 'Send' when finished or wait for automatic processing."
              }
            </p>
          </div>
        </div>
      )}
    </>
  );
};