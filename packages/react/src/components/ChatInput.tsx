import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Send, Square, ImageIcon, X, Mic, MicOff, Radio } from 'lucide-react';
import { DistriPart } from '@distri/core';
import { VoiceInput } from './VoiceInput';

export interface AttachedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string | DistriPart[]) => void;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  className?: string;
  // Image upload props
  attachedImages?: AttachedImage[];
  onRemoveImage?: (id: string) => void;
  onAddImages?: (files: FileList | File[]) => void;
  // Voice recording props
  voiceEnabled?: boolean;
  onVoiceRecord?: (audioBlob: Blob) => void;
  // Streaming voice props
  onStartStreamingVoice?: () => void;
  isStreamingVoice?: boolean;
  // Speech recognition props
  useSpeechRecognition?: boolean;
  onSpeechTranscript?: (text: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  placeholder = "Type your message...",
  disabled = false,
  isStreaming = false,
  className = "",
  attachedImages = [],
  onRemoveImage,
  onAddImages,
  voiceEnabled = false,
  onVoiceRecord,
  onStartStreamingVoice,
  isStreamingVoice = false,
  useSpeechRecognition = false,
  onSpeechTranscript,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix to get just the base64 data
          const base64Data = reader.result.split(',')[1];
          resolve(base64Data);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onAddImages) {
      onAddImages(files);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  }, [onAddImages]);

  // Voice recording functionality
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        if (onVoiceRecord) {
          onVoiceRecord(audioBlob);
        }
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Store timer ID for cleanup
      (mediaRecorder as any)._timer = timer;

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [onVoiceRecord]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      // Clear timer
      if ((mediaRecorderRef.current as any)._timer) {
        clearInterval((mediaRecorderRef.current as any)._timer);
      }

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  }, [isRecording]);

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleSpeechTranscript = useCallback((transcript: string) => {
    // Set the transcript as the input value
    onChange(transcript);
    // Also call the optional callback
    onSpeechTranscript?.(transcript);
  }, [onChange, onSpeechTranscript]);

  const handleSend = useCallback(async () => {
    if ((!value.trim() && attachedImages.length === 0) || disabled || isStreaming) {
      return;
    }

    try {
      if (attachedImages.length > 0) {
        // Create DistriPart array with text and images
        const parts: DistriPart[] = [];

        // Add text part if there's text content
        if (value.trim()) {
          parts.push({ type: 'text', data: value.trim() });
        }

        // Add image parts
        for (const image of attachedImages) {
          const base64Data = await convertFileToBase64(image.file);
          parts.push({
            type: 'image',
            data: {
              mime_type: image.file.type,
              data: base64Data,
              name: image.name
            }
          });
        }

        onSend(parts);
      } else {
        // Just text
        onSend(value);
      }

      // Clear input (images will be cleared by parent)
      onChange('');

    } catch (error) {
      console.error('Error processing images:', error);
    }
  }, [value, attachedImages, disabled, isStreaming, onSend, onChange, convertFileToBase64]);

  const handleStop = () => {
    console.log('handleStop called:', { isStreaming, onStop: !!onStop });
    if (isStreaming && onStop) {
      onStop();
    }
  };

  const hasContent = value.trim().length > 0 || attachedImages.length > 0;
  const isDisabled = disabled; // Remove isStreaming from disabled condition

  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex flex-col w-full">
        {/* Image previews (unchanged) */}
        {attachedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 mx-3 sm:mx-5">
            {attachedImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.preview}
                  alt={image.name}
                  className="w-16 h-16 object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => onRemoveImage?.(image.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="mx-3 sm:mx-5 rounded-2xl border border-input bg-input p-2">
          <div className="flex items-end gap-2">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if ((value.trim() || attachedImages.length > 0) && !disabled && !isStreaming) {
                    handleSend();
                  }
                }
              }}
              placeholder={attachedImages.length > 0 ? 'Add a message...' : placeholder}
              disabled={isDisabled}
              rows={1}
              className="flex-1 resize-none bg-transparent outline-none border-none leading-6 text-sm text-foreground placeholder:text-muted-foreground max-h-[40dvh] overflow-auto px-2 py-2"
            />

            {/* Controls (never overlap the text) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isDisabled}
                className="h-10 w-10 rounded-md hover:bg-muted text-muted-foreground flex items-center justify-center"
                title="Attach image"
              >
                <ImageIcon className="h-5 w-5" />
              </button>

              {useSpeechRecognition && (
                <VoiceInput
                  onTranscript={handleSpeechTranscript}
                  disabled={isDisabled || isStreaming}
                  onError={(error) => console.error('Voice input error:', error)}
                  useBrowserSpeechRecognition={true}
                  language="en-US"
                  interimResults={true}
                />
              )}

              {voiceEnabled && !useSpeechRecognition && (
                <>
                  <button
                    onClick={handleVoiceToggle}
                    disabled={isDisabled || isStreaming || isStreamingVoice}
                    className={`h-10 w-10 rounded-md flex items-center justify-center ${isRecording
                        ? 'bg-destructive text-destructive-foreground animate-pulse'
                        : 'hover:bg-muted text-muted-foreground'
                      }`}
                    title={isRecording ? `Recording... ${recordingTime}s` : 'Record voice message'}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>

                  {onStartStreamingVoice && (
                    <button
                      onClick={onStartStreamingVoice}
                      disabled={isDisabled || isStreaming || isRecording}
                      className={`h-10 w-10 rounded-md flex items-center justify-center ${isStreamingVoice
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'hover:bg-muted text-muted-foreground'
                        }`}
                      title={isStreamingVoice ? 'Streaming voice conversation active' : 'Start streaming voice conversation'}
                    >
                      <Radio className="h-5 w-5" />
                    </button>
                  )}
                </>
              )}

              <button
                onClick={isStreaming ? handleStop : handleSend}
                disabled={isStreaming ? false : (!hasContent || isDisabled)}
                className={`h-10 w-10 rounded-full flex items-center justify-center ${isStreaming
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : hasContent && !disabled
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground'
                  }`}
                title={isStreaming ? 'Stop' : 'Send'}
              >
                {isStreaming ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );

};