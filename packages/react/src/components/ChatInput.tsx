import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Send, Square, ImageIcon, X, Mic, MicOff, Radio, Plus, Globe } from 'lucide-react';
import { DistriPart } from '@distri/core';
import { VoiceInput } from './VoiceInput';
import { cn } from '../lib/utils';

declare global {
  interface Window {
    CodeMirror?: any;
    __distriCodeMirrorLoader?: Promise<void>;
  }
}

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
  browserEnabled?: boolean;
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
}

const CM_CSS = 'https://cdn.jsdelivr.net/npm/codemirror@5/lib/codemirror.min.css';
const CM_THEME = 'https://cdn.jsdelivr.net/npm/codemirror@5/theme/material-darker.min.css';
const CM_JS = 'https://cdn.jsdelivr.net/npm/codemirror@5/lib/codemirror.min.js';
const CM_PLACEHOLDER = 'https://cdn.jsdelivr.net/npm/codemirror@5/addon/display/placeholder.min.js';

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  placeholder = 'Type your message…',
  disabled = false,
  isStreaming = false,
  browserEnabled = false,
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
  const [isCodeMirrorReady, setIsCodeMirrorReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const imageAttachments = useMemo(() => attachedImages ?? [], [attachedImages]);

  const heroStyles = useMemo(() => {
    if (isDarkMode) {
      return {
        shell: 'rounded-[32px] p-[3px] bg-[radial-gradient(circle_at_top,_rgba(255,105,255,0.7),_rgba(96,76,255,0.9))] shadow-[0_20px_80px_rgba(96,76,255,0.35)]',
        inner: 'rounded-[28px] border border-white/10 bg-[#050508] px-5 py-4 flex flex-col gap-4 text-white',
        attachButton: 'border-white/10 bg-white/5 text-white hover:border-white/40',
        voiceIdle: 'border-white/10 bg-white/5 text-white hover:border-white/40',
        sendActive: 'bg-white text-black shadow-primary/30',
        sendIdle: 'bg-white/10 text-white/50 shadow-none',
        overlay: 'border border-white/5',
        text: 'text-white',
      }
    }
    return {
      shell: 'rounded-2xl border border-border bg-muted shadow-sm',
      inner: 'rounded-xl border border-border/80 bg-background px-4 py-3 flex flex-col gap-3 text-foreground',
      attachButton: 'border border-border/80 bg-background text-muted-foreground hover:text-foreground',
      voiceIdle: 'border border-border/80 bg-muted text-foreground hover:text-foreground',
      sendActive: 'bg-primary text-primary-foreground shadow-sm',
      sendIdle: 'bg-muted text-muted-foreground shadow-none',
      overlay: 'border border-border/80',
      text: 'text-foreground',
    }
  }, [isDarkMode])

  const ensureCodeMirrorAssets = useCallback(async () => {
    if (typeof window === 'undefined' || window.CodeMirror) {
      setIsCodeMirrorReady(!!window.CodeMirror);
      return;
    }

    if (!window.__distriCodeMirrorLoader) {
      window.__distriCodeMirrorLoader = (async () => {
        const loadCss = (href: string) => new Promise<void>((resolve, reject) => {
          if (document.querySelector(`link[href="${href}"]`)) {
            resolve();
            return;
          }
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = href;
          link.onload = () => resolve();
          link.onerror = reject;
          document.head.appendChild(link);
        });

        const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = reject;
          document.body.appendChild(script);
        });

        await loadCss(CM_CSS);
        await loadCss(CM_THEME);
        await loadScript(CM_JS);
        await loadScript(CM_PLACEHOLDER);
      })();
    }

    try {
      await window.__distriCodeMirrorLoader;
    } catch (error) {
      console.error('Failed to load CodeMirror assets', error);
    }

    setIsCodeMirrorReady(!!window.CodeMirror);
  }, []);

  useEffect(() => {
    void ensureCodeMirrorAssets();
  }, [ensureCodeMirrorAssets]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const update = () => {
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
  }, []);

  useEffect(() => {
    if (!isCodeMirrorReady || !textareaRef.current || codeMirrorRef.current) {
      return;
    }

    const CodeMirror = window.CodeMirror;
    if (!CodeMirror) {
      return;
    }

    const cm = CodeMirror.fromTextArea(textareaRef.current, {
      lineWrapping: true,
      theme: variant === 'hero' || isDarkMode ? 'material-darker' : 'default',
      placeholder,
      viewportMargin: Infinity,
    });

    const wrapper = cm.getWrapperElement();
    const scroller = cm.getScrollerElement();
    const heroWrapperClasses = [
      'rounded-[22px]', 'border', 'border-white/5', 'bg-transparent', 'text-white', 'text-base', 'leading-7'
    ];
    const defaultWrapperClasses = [
      'rounded-2xl', 'border', 'border-border', 'bg-background', 'text-foreground', 'text-sm', 'leading-6'
    ];
    wrapper.classList.add('distri-chat-editor', 'px-1', 'py-1');
    scroller.style.background = 'transparent';
    scroller.style.padding = variant === 'hero' ? '0.25rem 0.5rem 0.5rem' : '0.25rem 0.35rem 0.5rem';
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
  }, [isDarkMode, isCodeMirrorReady, placeholder, variant]);

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

  const shellClass = variant === 'hero'
    ? heroStyles.shell
    : 'rounded-2xl border border-input bg-input p-2 shadow-sm';

  const innerShell = variant === 'hero'
    ? heroStyles.inner
    : 'rounded-2xl bg-background flex flex-col gap-2';

  const wrapperClass = variant === 'hero' ? 'mx-0' : 'mx-3 sm:mx-5';
  const previewClass = variant === 'hero' ? 'gap-3 mb-3' : 'gap-2 mb-2';

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
                  className="w-16 h-16 object-cover rounded-lg border border-border"
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
                className="absolute inset-0 h-full w-full resize-none bg-transparent text-transparent caret-transparent opacity-0"
              />

              {!isCodeMirrorReady && (
                <textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  rows={variant === 'hero' ? 4 : 2}
                  disabled={disabled}
                  className={cn(
                    'w-full resize-none bg-transparent outline-none border-none placeholder:text-muted-foreground/60',
                    variant === 'hero' ? heroStyles.text : 'text-foreground',
                    variant === 'hero' ? 'text-base leading-7' : 'text-sm leading-6'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                />
              )}
              {variant === 'hero' && (
                <div className={cn('pointer-events-none absolute inset-0 rounded-[22px]', heroStyles.overlay)} />
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBrowserToggle}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-2xl border transition',
                    browserEnabled
                      ? (variant === 'hero'
                          ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-100'
                          : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-200')
                      : (variant === 'hero'
                          ? heroStyles.voiceIdle
                          : 'border-border bg-background text-muted-foreground hover:text-foreground')
                  )}
                  disabled={disabled || !onToggleBrowser}
                  title={browserEnabled ? 'Browser streaming enabled' : 'Enable browser streaming'}
                >
                  <Globe className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-2xl border transition',
                    variant === 'hero'
                      ? heroStyles.attachButton
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  )}
                  disabled={disabled}
                  title="Attach image"
                >
                  {variant === 'hero' ? <Plus className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                </button>

                {voiceEnabled && !useSpeechRecognition ? (
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-2xl border transition',
                      isRecording
                        ? 'border-red-400/60 bg-red-400/20 text-red-200'
                        : variant === 'hero'
                          ? heroStyles.voiceIdle
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    )}
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
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-2xl border transition',
                      isStreamingVoice
                        ? 'border-blue-400/70 bg-blue-400/20 text-blue-100'
                        : variant === 'hero'
                          ? heroStyles.voiceIdle
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    )}
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

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => (isStreaming ? handleStop() : void handleSend())}
                  disabled={isStreaming ? false : (!hasContent || isDisabled)}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full transition shadow-lg',
                    isStreaming
                      ? 'bg-amber-400/20 text-amber-200 shadow-amber-300/30'
                      : hasContent
                        ? (variant === 'hero' ? heroStyles.sendActive : 'bg-primary text-primary-foreground')
                        : (variant === 'hero' ? heroStyles.sendIdle : 'bg-muted text-muted-foreground')
                  )}
                  title={isStreaming ? 'Stop' : 'Send'}
                >
                  {isStreaming ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
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
