import React, { useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  className?: string;
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
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isStreaming) {
        onSend();
      }
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled && !isStreaming) {
      onSend();
    }
  };

  const handleStop = () => {
    if (isStreaming && onStop) {
      onStop();
    }
  };

  const hasContent = value.trim().length > 0;
  const isDisabled = disabled || isStreaming;

  return (
    <div className={`relative flex min-h-14 w-full items-end ${className}`}>
      <div className="relative flex w-full flex-auto flex-col">
        <div className="relative mx-5 flex min-h-14 flex-auto rounded-lg border border-input bg-input items-start h-full">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            className="max-h-[25dvh] flex-1 resize-none border-none outline-none bg-transparent placeholder:text-muted-foreground focus:ring-0 overflow-auto text-sm p-4 pr-20 text-foreground min-h-[52px] max-h-[120px]"
          />
          <div className="absolute right-2 bottom-0 flex items-center h-full">
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
        <div className="h-8"></div>
      </div>
    </div>
  );
};