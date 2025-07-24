import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = "Type your message...",
  disabled = false,
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
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend();
    }
  };

  const hasContent = value.trim().length > 0;

  return (
    <div className="relative flex items-end bg-gray-700 rounded-xl border border-gray-600 focus-within:border-gray-500 transition-colors">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-transparent text-white placeholder-gray-400 border-none outline-none px-4 py-3 max-h-[120px] min-h-[52px]"
        style={{
          minHeight: '52px',
          maxHeight: '120px',
        }}
      />
      <div className="flex items-end p-2">
        <button
          onClick={handleSend}
          disabled={!hasContent || disabled}
          className={`
            p-2 rounded-lg transition-all duration-200 flex items-center justify-center
            ${hasContent && !disabled
              ? 'bg-white text-gray-900 hover:bg-gray-100' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};