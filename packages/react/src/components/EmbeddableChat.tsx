import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Agent } from '@distri/core';
import { useChat } from '../useChat';
import { UserMessage, AssistantMessage, AssistantWithToolCalls, PlanMessage } from './MessageComponents';
import { shouldDisplayMessage, extractTextFromMessage, getMessageType } from '../utils/messageUtils';
import '../styles/themes.css';

export interface EmbeddableChatProps {
  agentId: string;
  threadId?: string;
  agent?: Agent;
  metadata?: any;
  height?: string | number;
  placeholder?: string;
  className?: string;
  // Customization props
  UserMessageComponent?: React.ComponentType<any>;
  AssistantMessageComponent?: React.ComponentType<any>;
  AssistantWithToolCallsComponent?: React.ComponentType<any>;
  PlanMessageComponent?: React.ComponentType<any>;
  // Theme
  theme?: 'light' | 'dark' | 'auto';
  // Show debug info
  showDebug?: boolean;
  // Callbacks
  onMessageSent?: (message: string) => void;
  onResponse?: (response: any) => void;
}

export const EmbeddableChat: React.FC<EmbeddableChatProps> = ({
  agentId,
  threadId = 'default',
  agent,
  metadata,
  height = 500,
  placeholder = "Type your message...",
  className = '',
  UserMessageComponent = UserMessage,
  AssistantMessageComponent = AssistantMessage,
  AssistantWithToolCallsComponent = AssistantWithToolCalls,
  PlanMessageComponent = PlanMessage,
  theme = 'auto',
  showDebug = false,
  onMessageSent,
  onResponse: _onResponse, // Currently unused but reserved for future response handling
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    loading,
    error,
    isStreaming,
    sendMessageStream,
  } = useChat({
    agentId,
    threadId,
    agent,
    metadata,
  });

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || isStreaming) return;

    const messageText = input.trim();
    setInput('');
    
    onMessageSent?.(messageText);

    try {
      await sendMessageStream(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInput(messageText); // Restore input on error
    }
  }, [input, loading, isStreaming, sendMessageStream, onMessageSent]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Filter and render messages
  const renderedMessages = useMemo(() => {
    return messages
      .filter(message => shouldDisplayMessage(message, showDebug))
      .map((message: any, index: number) => {
        const timestamp = new Date(message.timestamp || Date.now());
        const messageText = extractTextFromMessage(message);
        const messageType = getMessageType(message);
        const key = message.messageId || `${messageType}-${index}`;

        switch (messageType) {
          case 'user':
            return (
              <UserMessageComponent
                key={key}
                content={messageText}
                timestamp={timestamp}
              />
            );

          case 'assistant_with_tools':
            const toolCallsProps = message.metadata.tool_calls?.map((toolCall: any) => ({
              toolCall,
              status: 'completed',
              result: 'Tool executed successfully',
              error: null,
            })) || [];

            return (
              <AssistantWithToolCallsComponent
                key={key}
                content={messageText}
                toolCalls={toolCallsProps}
                timestamp={timestamp}
                isStreaming={isStreaming && index === messages.length - 1}
                metadata={message.metadata}
              />
            );

          case 'plan':
            return (
              <PlanMessageComponent
                key={key}
                content={messageText || message.metadata?.plan || 'Planning...'}
                duration={message.metadata?.duration}
                timestamp={timestamp}
              />
            );

          case 'assistant':
          default:
            return (
              <AssistantMessageComponent
                key={key}
                content={messageText || 'Empty message'}
                timestamp={timestamp}
                isStreaming={isStreaming && index === messages.length - 1}
                metadata={message.metadata}
              />
            );
        }
      });
  }, [
    messages,
    showDebug,
    isStreaming,
    UserMessageComponent,
    AssistantMessageComponent,
    AssistantWithToolCallsComponent,
    PlanMessageComponent,
  ]);

  // Apply theme class
  const themeClass = theme === 'auto' ? '' : theme;
  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`distri-chat ${themeClass} ${className}`}
      style={{ height: containerHeight }}
    >
      <div className="distri-chat-container">
        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto distri-scroll p-4 space-y-4"
        >
          {error && (
            <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">
                Error: {error.message}
              </p>
            </div>
          )}

          {messages.length === 0 && !loading && (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center max-w-sm">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Send a message to begin chatting with the AI assistant.
                </p>
              </div>
            </div>
          )}

          {renderedMessages}

          {/* Loading indicator */}
          {(loading || isStreaming) && (
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                rows={1}
                className="distri-input w-full resize-none px-4 py-3 pr-12 text-sm min-h-[52px] max-h-32"
                disabled={loading || isStreaming}
                style={{ 
                  minHeight: '52px',
                  maxHeight: '128px',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading || isStreaming}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 distri-button-primary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddableChat;