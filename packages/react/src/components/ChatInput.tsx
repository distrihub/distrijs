import React, { useRef, useEffect, useCallback } from 'react';
import { Send, Square, ImageIcon, X } from 'lucide-react';
import { DistriPart } from '@distri/core';

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
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || attachedImages.length > 0) && !disabled && !isStreaming) {
        handleSend();
      }
    }
  };

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
    if (isStreaming && onStop) {
      onStop();
    }
  };

  const hasContent = value.trim().length > 0 || attachedImages.length > 0;
  const isDisabled = disabled || isStreaming;

  return (
    <div className={`relative flex min-h-14 w-full items-end ${className}`}>
      <div className="relative flex w-full flex-auto flex-col">
        {/* Image previews */}
        {attachedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 mx-5">
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

        <div className="relative mx-5 flex min-h-14 flex-auto rounded-lg border border-input bg-input items-start h-full">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={attachedImages.length > 0 ? "Add a message..." : placeholder}
            disabled={isDisabled}
            rows={1}
            className="max-h-[25dvh] flex-1 resize-none border-none outline-none bg-transparent placeholder:text-muted-foreground focus:ring-0 overflow-auto text-sm p-4 pr-24 text-foreground min-h-[52px] max-h-[120px]"
          />

          <div className="absolute right-2 bottom-0 flex items-center gap-1 h-full">
            {/* Image upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled}
              className="h-10 w-10 rounded-md transition-colors flex items-center justify-center hover:bg-muted text-muted-foreground"
              title="Attach image"
            >
              <ImageIcon className="h-5 w-5" />
            </button>

            {/* Send/Stop button */}
            <button
              onClick={isStreaming ? handleStop : handleSend}
              disabled={!hasContent && !isStreaming}
              className={`h-10 w-10 rounded-md transition-colors flex items-center justify-center ${isStreaming
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                : hasContent && !disabled
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted'
                }`}
            >
              {isStreaming ? (
                <Square className="h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
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