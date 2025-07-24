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
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={`
          resize-none pr-12 min-h-[52px] 
          bg-gray-700 border border-gray-600 text-white placeholder-gray-400 
          rounded-xl px-4 py-3 
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
          transition-all duration-200
          ${className}
        `}
        style={{
          minHeight: '52px',
          maxHeight: '120px',
        }}
      />
      <button
        onClick={handleSend}
        disabled={!hasContent || disabled}
        className={`
          absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200
          ${hasContent && !disabled
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }
          ${hasContent && !disabled ? 'scale-100' : 'scale-95 opacity-50'}
        `}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
};