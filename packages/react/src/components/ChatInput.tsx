import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { Send, Square, X, Mic, Globe, Plus, Braces, Headphones } from 'lucide-react';

import { DistriPart } from '@distri/core';
import { VoiceInput } from './VoiceInput';
import { cn } from '../lib/utils';

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
  useSpeechRecognition?: boolean;
  onSpeechTranscript?: (text: string) => void;
  handsfree?: boolean;
  onToggleHandsfree?: () => void;
  verbose?: boolean;
  onToggleVerbose?: () => void;
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
  useSpeechRecognition = false,
  onSpeechTranscript,
  handsfree = false,
  onToggleHandsfree,
  verbose = false,
  onToggleVerbose,
  variant = 'default',
  theme = 'auto',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const imageAttachments = useMemo(() => attachedImages ?? [], [attachedImages]);
  const onChangeRef = useRef(onChange);
  const handleSendRef = useRef<() => void>(() => {});

  const isDarkMode = theme === 'dark';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      onChangeRef.current(text);
    },
    editorProps: {
      attributes: {
        class: 'distri-editor-content outline-none h-full',
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          handleSendRef.current();
          return true;
        }
        return false;
      },
    },
  });

  // Sync editable state when disabled prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  // Sync value changes from parent
  useEffect(() => {
    if (editor && editor.getText() !== value) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  // Update refs
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
      setRecordedBlob(null);
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
        stream.getTracks().forEach(track => track.stop());

        if (handsfree && onVoiceRecord) {
          // In handsfree mode, send immediately
          onVoiceRecord(audioBlob);
        } else {
          // Normal mode: hold the blob for user review
          setRecordedBlob(audioBlob);
        }
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
  }, [onVoiceRecord, handsfree]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if ((mediaRecorderRef.current as any)._timer) {
        clearInterval((mediaRecorderRef.current as any)._timer);
      }
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording]);

  const discardRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingTime(0);
  }, []);

  const sendRecording = useCallback(() => {
    if (recordedBlob && onVoiceRecord) {
      setIsTranscribing(true);
      onVoiceRecord(recordedBlob);
      setRecordedBlob(null);
      setRecordingTime(0);
      // isTranscribing will be reset when the parent finishes transcription
      // and either fills input or sends — we use a timeout as fallback
      setTimeout(() => setIsTranscribing(false), 15000);
    }
  }, [recordedBlob, onVoiceRecord]);

  // Reset transcribing state when input changes (parent filled it after transcription)
  useEffect(() => {
    if (isTranscribing && value) {
      setIsTranscribing(false);
    }
  }, [value, isTranscribing]);


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
              bytes: base64Data,
              name: image.name,
            },
          });
        }
        onSend(parts);
      } else {
        onSend(value);
      }
      onChange('');
      editor?.commands.clearContent();
    } catch (error) {
      console.error('Error processing images:', error);
    }
  }, [value, imageAttachments, disabled, isStreaming, onSend, onChange, convertFileToBase64, editor]);

  const handleStop = () => {
    if (isStreaming && onStop) {
      onStop();
    }
  };

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const hasContent = value.trim().length > 0 || imageAttachments.length > 0;
  const isDisabled = disabled;

  const isHero = variant === 'hero';
  const editorHeight = isHero ? 'min-h-[180px]' : 'min-h-[100px]';

  const toolbarButton = cn(
    'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
    isDarkMode
      ? 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
      : 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black'
  );
  const toolbarButtonActive = isDarkMode
    ? 'bg-[var(--distri-accent,#3b82f6)]/30 text-[var(--distri-accent,#3b82f6)]'
    : 'bg-[var(--distri-accent,#3b82f6)]/20 text-[var(--distri-accent,#3b82f6)]';

  return (
    <div className={cn('relative w-full', className)}>
      <div className="flex flex-col w-full">
        {/* Image previews */}
        {imageAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 mx-1">
            {imageAttachments.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.preview}
                  alt={image.name}
                  className={cn(
                    'w-16 h-16 object-cover rounded-lg border',
                    isDarkMode ? 'border-white/20' : 'border-black/10'
                  )}
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage?.(image.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main input container with gradient border */}
        <div
          className={cn(
            'distri-chat-input-wrapper rounded-2xl',
            isDarkMode
              ? 'p-[1px] bg-gradient-to-r from-[var(--distri-accent,#3b82f6)]/60 via-[var(--distri-accent,#3b82f6)]/30 to-[var(--distri-accent,#3b82f6)]/60'
              : 'border border-gray-200 shadow-sm'
          )}
        >
          <div
            className={cn(
              'distri-chat-input rounded-2xl flex flex-col',
              isDarkMode ? 'bg-[#0d0d0d]' : 'bg-white'
            )}
          >
            {/* Editor area */}
            <div className={cn('px-4 pt-4 pb-2 flex flex-col', editorHeight)}>
              <EditorContent
                editor={editor}
                className={cn(
                  'distri-editor w-full flex-1 flex flex-col [&>div]:flex-1',
                  isDarkMode ? 'text-white/90' : 'text-gray-900',
                  '[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
                  '[&_.is-editor-empty:first-child::before]:float-left',
                  '[&_.is-editor-empty:first-child::before]:h-0',
                  '[&_.is-editor-empty:first-child::before]:pointer-events-none',
                  isDarkMode
                    ? '[&_.is-editor-empty:first-child::before]:text-white/40'
                    : '[&_.is-editor-empty:first-child::before]:text-gray-400',
                  '[&_.ProseMirror]:outline-none',
                  '[&_.ProseMirror]:h-full',
                  isHero ? 'text-base' : 'text-sm'
                )}
              />
            </div>

            {/* Recording bar — shown when recording or when a recorded clip is ready */}
            {(isRecording || recordedBlob || isTranscribing) && (
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 mx-3 mb-2 rounded-lg',
                isDarkMode ? 'bg-white/5' : 'bg-black/5'
              )}>
                {isRecording && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-mono text-muted-foreground flex-1">
                      Recording… {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                      title="Stop recording"
                    >
                      <Square className="h-3 w-3 fill-current" />
                    </button>
                  </>
                )}
                {!isRecording && recordedBlob && !isTranscribing && (
                  <>
                    <Mic className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1">
                      Voice clip ({recordingTime}s) — review and send
                    </span>
                    <button
                      type="button"
                      onClick={discardRecording}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                      title="Discard recording"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={sendRecording}
                      className="flex h-7 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition"
                      title="Transcribe and send"
                    >
                      <Send className="h-3 w-3" />
                      Send
                    </button>
                  </>
                )}
                {isTranscribing && (
                  <>
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1">Transcribing…</span>
                  </>
                )}
              </div>
            )}

            {/* Toolbar */}
            <div className={cn(
              'flex items-center justify-between px-3 pb-3',
              isDarkMode ? 'border-white/5' : 'border-black/5'
            )}>
              <div className="flex items-center gap-1">
                {/* Add/Plus button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={toolbarButton}
                  disabled={disabled}
                  title="Attach image"
                >
                  <Plus className="h-5 w-5" />
                </button>

                {onToggleBrowser && (
                  <button
                    type="button"
                    onClick={handleBrowserToggle}
                    className={cn(toolbarButton, browserEnabled && browserHasSession && toolbarButtonActive)}
                    disabled={disabled}
                    title={browserEnabled ? (browserHasSession ? 'Browser session active' : 'Browser enabled') : 'Enable browser'}
                  >
                    <Globe className="h-4 w-4" />
                  </button>
                )}

                {voiceEnabled && !useSpeechRecognition && !isRecording && !recordedBlob && !isTranscribing && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className={toolbarButton}
                    title="Record voice message"
                    disabled={isStreaming || disabled}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                )}

                {voiceEnabled && onToggleHandsfree && (
                  <button
                    type="button"
                    onClick={onToggleHandsfree}
                    className={cn(toolbarButton, handsfree && toolbarButtonActive)}
                    title={handsfree ? 'Handsfree mode on (auto-send & auto-play)' : 'Enable handsfree mode'}
                    disabled={disabled}
                  >
                    <Headphones className="h-4 w-4" />
                  </button>
                )}

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

                {onToggleVerbose && (
                  <button
                    type="button"
                    onClick={onToggleVerbose}
                    className={cn(toolbarButton, verbose && toolbarButtonActive)}
                    disabled={disabled}
                    title={verbose ? 'Hide tool details' : 'Show tool details'}
                  >
                    <Braces className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Send button */}
              <button
                type="button"
                onClick={() => (isStreaming ? handleStop() : void handleSend())}
                disabled={isStreaming ? false : (!hasContent || isDisabled)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                  isStreaming
                    ? 'bg-amber-500 text-white hover:bg-amber-400'
                    : hasContent
                      ? isDarkMode
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'bg-[var(--distri-accent,#3b82f6)] text-white hover:bg-[var(--distri-accent,#3b82f6)]/90'
                      : isDarkMode
                        ? 'bg-white/10 text-white/30'
                        : 'bg-black/5 text-black/30'
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
