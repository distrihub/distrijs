import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material-darker.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/addon/display/placeholder';
import { Send, Square, X, Mic, MicOff, Radio, Globe, ImagePlus } from 'lucide-react';

import { DistriPart } from '@distri/core';
import { VoiceInput } from './VoiceInput';
import { cn } from '../lib/utils';

export interface AttachedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
}

const DARK_THEME = 'material-darker';
const LIGHT_THEME = 'eclipse';
export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string | DistriPart[]) => void;
  onStop?: () => void;
  browserEnabled?: boolean;
  /** Whether browser has an active session (used for highlighting) */
  browserHasSession?: boolean;
  onToggleBrowser?: (enabled: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  className?: string;
  attachedImages?: AttachedImage[];
  onRemoveImage?: (id: string) => void;
  onAddImages?: (files: FileList | File[]) => void;
  voiceEnabled?: boolean;
  onVoiceRecord?: (audioBlob: Blob) => void;
  onStartStreamingVoice?: () => void;
  isStreamingVoice?: boolean;
  useSpeechRecognition?: boolean;
  onSpeechTranscript?: (text: string) => void;
  variant?: 'default' | 'hero';
  theme?: 'light' | 'dark' | 'auto';
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  placeholder = 'Type your message…',
  disabled = false,
  isStreaming = false,
  browserEnabled = false,
  browserHasSession = false,
  onToggleBrowser,
  className = '',
  attachedImages,
  onRemoveImage,
  onAddImages,
  voiceEnabled = false,
  onVoiceRecord,
  onStartStreamingVoice,
  isStreamingVoice = false,
  useSpeechRecognition = false,
  onSpeechTranscript,
  variant = 'default',
  theme = 'auto',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeMirrorRef = useRef<any>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const handleSendRef = useRef<() => void>(() => { });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const imageAttachments = useMemo(() => attachedImages ?? [], [attachedImages]);

  useEffect(() => {
    // If theme is explicitly set, use it directly
    if (theme === 'light') {
      setIsDarkMode(false);
      return;
    }
    if (theme === 'dark') {
      setIsDarkMode(true);
      return;
    }

    // Auto mode: detect from DOM
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const update = () => {
      const dataTheme = root.getAttribute('data-theme');
      // Check data-theme attribute first (explicit theme setting)
      if (dataTheme) {
        const isDark = dataTheme.toLowerCase().includes('dark') || dataTheme === 'midnight';
        setIsDarkMode(isDark);
        return;
      }
      // Fallback to class or system preference
      const dark = root.classList.contains('dark') || media.matches;
      setIsDarkMode(dark);
    };

    update();

    media.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    return () => {
      media.removeEventListener('change', update);
      observer.disconnect();
    };
  }, [theme]);

  useEffect(() => {
    if (!textareaRef.current || codeMirrorRef.current) {
      return;
    }

    const cm = CodeMirror.fromTextArea(textareaRef.current, {
      lineWrapping: true,
      theme: variant === 'hero' || isDarkMode ? 'material-darker' : 'eclipse',
      placeholder,
      viewportMargin: Infinity,
    });

    const wrapper = cm.getWrapperElement();
    const scroller = cm.getScrollerElement();
    const darkBg = '#1c1f23';
    const lightBg = '#f8f9fa';
    const darkText = '#e0e0e0';
    const lightText = '#1a1a1a';
    const bgColor = isDarkMode ? darkBg : lightBg;
    const textColor = isDarkMode ? darkText : lightText;
    const shadowStyle = isDarkMode ? 'shadow-[0_14px_40px_rgba(0,0,0,0.35)]' : 'shadow-[0_4px_16px_rgba(0,0,0,0.1)]';
    const borderStyle = isDarkMode ? 'border-transparent' : 'border-gray-200';
    const baseWrapperClasses = ['rounded-2xl', 'border', borderStyle];
    const heroWrapperClasses = [...baseWrapperClasses, 'text-base', 'leading-7'];
    const defaultWrapperClasses = [...baseWrapperClasses, 'text-sm', 'leading-6'];
    wrapper.classList.add('distri-chat-editor', 'px-1', 'py-1', shadowStyle);
    wrapper.style.backgroundColor = bgColor;
    wrapper.style.color = textColor;
    scroller.style.background = bgColor;
    scroller.style.color = textColor;
    scroller.style.padding = variant === 'hero' ? '1rem 1.25rem 1.25rem' : '0.35rem 0.5rem 0.75rem';
    // Set cursor and placeholder colors
    const customStyles = document.createElement('style');
    const placeholderColor = isDarkMode ? '#888' : '#999';
    customStyles.textContent = `
      .distri-chat-editor .CodeMirror-cursor { border-left-color: ${textColor} !important; }
      .distri-chat-editor .CodeMirror-placeholder { color: ${placeholderColor} !important; }
      .distri-chat-editor .CodeMirror-line span { color: ${textColor}; }
    `;
    wrapper.appendChild(customStyles);
    if (variant === 'hero') {
      wrapper.classList.add(...heroWrapperClasses);
    } else {
      wrapper.classList.add(...defaultWrapperClasses);
    }

    const initialValue = textareaRef.current?.value ?? '';
    cm.setValue(initialValue);

    cm.on('change', (instance: any) => {
      const nextValue = instance.getValue();
      if (nextValue !== valueRef.current) {
        onChangeRef.current(nextValue);
      }
    });

    cm.on('keydown', (_instance: any, event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        void handleSendRef.current();
      }
    });

    const fixedHeight = variant === 'hero' ? '220px' : '140px';
    cm.setSize('100%', fixedHeight);

    codeMirrorRef.current = cm;
    return () => {
      cm.toTextArea();
      codeMirrorRef.current = null;
    };
  }, [isDarkMode, placeholder, variant]);

  useEffect(() => {
    if (!codeMirrorRef.current) return;
    codeMirrorRef.current.setOption('theme', variant === 'hero' || isDarkMode ? DARK_THEME : LIGHT_THEME);
    codeMirrorRef.current.setOption('placeholder', placeholder);
  }, [isDarkMode, placeholder, variant]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (codeMirrorRef.current && codeMirrorRef.current.getValue() !== value) {
      const cursor = codeMirrorRef.current.getCursor();
      codeMirrorRef.current.setValue(value);
      codeMirrorRef.current.setCursor(cursor);
    }
  }, [value]);

  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
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
    e.target.value = '';
  }, [onAddImages]);

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
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      (mediaRecorder as any)._timer = timer;
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [onVoiceRecord]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
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

  const handleBrowserToggle = useCallback(() => {
    if (onToggleBrowser) {
      onToggleBrowser(!browserEnabled);
    }
  }, [onToggleBrowser, browserEnabled]);

  const handleSpeechTranscript = useCallback((transcript: string) => {
    onChangeRef.current(transcript);
    onSpeechTranscript?.(transcript);
  }, [onSpeechTranscript]);

  const handleSend = useCallback(async () => {
    if ((!value.trim() && imageAttachments.length === 0) || disabled || isStreaming) {
      return;
    }

    try {
      if (imageAttachments.length > 0) {
        const parts: DistriPart[] = [];
        if (value.trim()) {
          parts.push({ part_type: 'text', data: value.trim() });
        }

        for (const image of imageAttachments) {
          const base64Data = await convertFileToBase64(image.file);
          parts.push({
            part_type: 'image',
            data: {
              type: 'bytes',
              mime_type: image.file.type,
              data: base64Data,
              name: image.name,
            },
          });
        }
        onSend(parts);
      } else {
        onSend(value);
      }
      onChange('');
    } catch (error) {
      console.error('Error processing images:', error);
    }
  }, [value, imageAttachments, disabled, isStreaming, onSend, onChange, convertFileToBase64]);

  const handleStop = () => {
    if (isStreaming && onStop) {
      onStop();
    }
  };

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const hasContent = value.trim().length > 0 || imageAttachments.length > 0;
  const isDisabled = disabled;

  const shellClass = 'rounded-3xl p-[1px] bg-gradient-to-r from-border/60 via-border/30 to-border/60 dark:from-primary/40 dark:via-primary/20 dark:to-primary/40';
  const innerShell = cn(
    'rounded-3xl bg-background border border-border/50 px-5 py-4 flex flex-col shadow-sm dark:shadow-lg dark:shadow-primary/5 dark:border-0',
    variant === 'hero' && 'sm:px-6 sm:py-5'
  );
  const wrapperClass = 'mx-0 sm:mx-1';
  const previewClass = 'gap-2 mb-2';
  const toolbarButton = 'flex h-9 w-9 items-center justify-center rounded-full bg-muted/30 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:bg-muted/50';
  const toolbarButtonActive = 'bg-primary/20 text-primary';

  return (
    <div className={cn('relative w-full', className)}>
      <div className="flex flex-col w-full">
        {imageAttachments.length > 0 && (
          <div className={cn('flex flex-wrap', previewClass, wrapperClass)}>
            {imageAttachments.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.preview}
                  alt={image.name}
                  className="w-16 h-16 object-cover rounded-lg border border-primary/20 bg-background/60"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage?.(image.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
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

        <div className={cn(wrapperClass, shellClass)}>
          <div className={innerShell}>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={variant === 'hero' ? 4 : 2}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                {onToggleBrowser && (
                  <button
                    type="button"
                    onClick={handleBrowserToggle}
                    className={cn(toolbarButton, browserEnabled && browserHasSession && toolbarButtonActive)}
                    disabled={disabled}
                    title={browserEnabled ? (browserHasSession ? 'Browser session active' : 'Browser enabled (click to disable)') : 'Enable browser'}
                  >
                    <Globe className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={toolbarButton}
                  disabled={disabled}
                  title="Attach image"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>

                {voiceEnabled && !useSpeechRecognition ? (
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    className={cn(toolbarButton, isRecording && 'border-red-400/60 bg-red-400/15 text-red-200')}
                    title={isRecording ? `Recording… ${recordingTime}s` : 'Record voice message'}
                    disabled={isStreaming || disabled}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                ) : null}

                {onStartStreamingVoice && !useSpeechRecognition ? (
                  <button
                    type="button"
                    onClick={onStartStreamingVoice}
                    className={cn(toolbarButton, isStreamingVoice && toolbarButtonActive)}
                    disabled={isStreaming || disabled || isRecording}
                    title="Start streaming voice conversation"
                  >
                    <Radio className="h-4 w-4" />
                  </button>
                ) : null}

                {useSpeechRecognition ? (
                  <VoiceInput
                    onTranscript={handleSpeechTranscript}
                    disabled={isDisabled || isStreaming}
                    onError={(error) => console.error('Voice input error:', error)}
                    useBrowserSpeechRecognition={true}
                    language="en-US"
                    interimResults={true}
                  />
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => (isStreaming ? handleStop() : void handleSend())}
                disabled={isStreaming ? false : (!hasContent || isDisabled)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                  isStreaming
                    ? 'bg-amber-500 text-white hover:bg-amber-400'
                    : hasContent
                      ? 'bg-muted/50 text-foreground hover:bg-muted'
                      : 'text-muted-foreground/50'
                )}
                title={isStreaming ? 'Stop' : 'Send'}
              >
                {isStreaming ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

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