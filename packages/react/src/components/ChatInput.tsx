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
        <div className="relative mx-5 flex min-h-14 flex-auto rounded-lg border  items-start bg-input">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            className="max-h-[25dvh] max-h-52 flex-1 resize-none border-none outline-none bg-transparent placeholder:text-muted-foreground focus:ring-0 overflow-auto text-sm p-4 pr-20 text-foreground"
            style={{
              minHeight: '52px',
              maxHeight: '120px',
              border: 'none',
              outline: 'none',
              resize: 'none',
            }}
          />
          <div className="absolute right-2 bottom-2 flex items-center h-full">
            <button
              onClick={isStreaming ? handleStop : handleSend}
              disabled={!hasContent && !isStreaming}
              className={`h-10 w-10 rounded-md transition-colors flex items-center justify-center ${isStreaming
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : hasContent && !disabled
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-600 text-gray-400 hover:bg-gray-600'
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
        <div className="justify-content-end relative ms-2 flex w-full flex-auto flex-col">
          <div className="flex-auto"></div>
        </div>
        <div style={{ height: '48px' }}></div>
      </div>
    </div>
  );
};