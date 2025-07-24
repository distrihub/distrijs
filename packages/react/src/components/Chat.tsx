import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Loader2, Square, Eye, EyeOff, Bot } from 'lucide-react';
import { Agent } from '@distri/core';
import { useChatConfig, ChatProvider } from './ChatContext';
import { useChat } from '../useChat';
import { UserMessage, AssistantMessage, AssistantWithToolCalls, PlanMessage } from './MessageComponents';

export interface ChatProps {
  agentId: string;
  threadId: string;
  agent?: Agent;
  // Backwards compatibility: tools prop for legacy external tool handlers
  tools?: Record<string, any>;
  metadata?: any;
  height?: string;
  onThreadUpdate?: (threadId: string) => void;
  className?: string;
  // Customization props
  placeholder?: string;
  // Custom message components for full customization
  UserMessageComponent?: React.ComponentType<any>;
  AssistantMessageComponent?: React.ComponentType<any>;
  AssistantWithToolCallsComponent?: React.ComponentType<any>;
  PlanMessageComponent?: React.ComponentType<any>;
  // Custom external tool handler (for backwards compatibility)
  onExternalToolCall?: (toolCall: any) => void;
}

const ChatInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isStreaming: boolean;
  placeholder?: string;
}> = ({ value, onChange, onSend, disabled, isStreaming, placeholder = "Type a message..." }) => {

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  return (
    <div className="border-t border-gray-700 bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative flex gap-2 items-center">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-600 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
              style={{ minHeight: '52px', maxHeight: '200px' }}
              disabled={disabled}
            />
            <button
              onClick={onSend}
              disabled={!value.trim() || disabled}
              className="absolute right-3 h-12 w-12 bottom-3 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isStreaming ? (
                <Square className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DebugToggle: React.FC<{
  showDebug: boolean;
  onToggle: () => void;
}> = ({ showDebug, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors text-white"
    >
      {showDebug ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      Debug
    </button>
  );
};

const ChatContent: React.FC<ChatProps> = ({
  agentId,
  threadId,
  agent,
  tools,
  metadata,
  height = "600px",
  onThreadUpdate,
  placeholder = "Type a message...",
  UserMessageComponent = UserMessage,
  AssistantMessageComponent = AssistantMessage,
  AssistantWithToolCallsComponent = AssistantWithToolCalls,
  PlanMessageComponent = PlanMessage,
  onExternalToolCall,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { config, updateConfig } = useChatConfig();

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

  // Legacy tool handling for backwards compatibility
  useEffect(() => {
    if (tools && onExternalToolCall) {
      console.warn('Legacy tools prop detected. Consider migrating to the new useTools hook for better performance.');
    }
  }, [tools, onExternalToolCall]);

  // Helper function to extract text from message parts
  const extractTextFromMessage = useCallback((message: any): string => {
    if (!message?.parts || !Array.isArray(message.parts)) {
      return '';
    }

    return message.parts
      .filter((part: any) => part?.kind === 'text' && part?.text)
      .map((part: any) => part.text)
      .join('') || '';
  }, []);

  // Helper function to check if message should be displayed
  const shouldDisplayMessage = useCallback((message: any): boolean => {
    if (!message) return false;

    // Always show user messages with content
    if (message.role === 'user') {
      const textContent = extractTextFromMessage(message);
      return textContent.trim().length > 0;
    }

    // Check if message has text content
    const textContent = extractTextFromMessage(message);
    if (textContent.trim()) return true;

    // Always show tool calls (they should be visible regardless of debug mode)
    if (message.metadata?.type === 'assistant_response' && message.metadata.tool_calls) {
      return true;
    }

    // Show plan messages
    if (message.metadata?.type === 'plan' || message.metadata?.plan) {
      return true;
    }

    // Show other metadata messages only if debug is enabled (like "run started", etc.)
    if (message.metadata?.type && message.metadata.type !== 'assistant_response') {
      return config.showDebugMessages;
    }

    // Don't show empty messages
    return false;
  }, [extractTextFromMessage, config.showDebugMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (threadId && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, threadId, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || isStreaming) return;

    const messageText = input.trim();
    setInput('');

    try {
      await sendMessageStream(messageText);
      onThreadUpdate?.(threadId);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInput(messageText);
    }
  }, [input, loading, isStreaming, sendMessageStream, onThreadUpdate, threadId]);

  // Render messages using custom components
  const renderedMessages = useMemo(() => {
    return messages
      .filter(shouldDisplayMessage)
      .map((message: any, index: number) => {
        const timestamp = new Date(message.timestamp || Date.now());
        const messageText = extractTextFromMessage(message);
        const isUser = message.role === 'user';

        // Handle user messages
        if (isUser) {
          return (
            <UserMessageComponent
              key={message.messageId || `user-${index}`}
              content={messageText}
              timestamp={timestamp}
            />
          );
        }

        // Handle assistant messages with tool calls
        if (message.metadata?.type === 'assistant_response' && message.metadata.tool_calls) {
          const toolCallsProps = message.metadata.tool_calls.map((toolCall: any) => ({
            toolCall,
            status: 'completed', // Tools are executed immediately now
            result: 'Tool executed successfully',
            error: null,
          }));

          return (
            <AssistantWithToolCallsComponent
              key={message.messageId || `assistant-tools-${index}`}
              content={messageText}
              toolCalls={toolCallsProps}
              timestamp={timestamp}
              isStreaming={isStreaming && index === messages.length - 1}
              metadata={message.metadata}
            />
          );
        }

        // Handle plan messages
        if (message.metadata?.type === 'plan' || message.metadata?.plan) {
          return (
            <PlanMessageComponent
              key={message.messageId || `plan-${index}`}
              content={messageText || message.metadata?.plan || 'Planning...'}
              duration={message.metadata?.duration}
              timestamp={timestamp}
            />
          );
        }

        // Handle regular assistant messages
        return (
          <AssistantMessageComponent
            key={message.messageId || `assistant-${index}`}
            content={messageText || 'Empty message'}
            timestamp={timestamp}
            isStreaming={isStreaming && index === messages.length - 1}
            metadata={message.metadata}
          />
        );
      });
  }, [messages, shouldDisplayMessage, extractTextFromMessage, isStreaming, UserMessageComponent, AssistantMessageComponent, AssistantWithToolCallsComponent, PlanMessageComponent]);

  return (
    <div className="flex flex-col bg-gray-900 text-white" style={{ height }}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            {agent && (
              <>
                <h2 className="text-lg font-semibold text-white">{agent.name}</h2>
                <p className="text-sm text-gray-400">{agent.description}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <DebugToggle
              showDebug={config.showDebugMessages}
              onToggle={() => updateConfig({ showDebugMessages: !config.showDebugMessages })}
            />
            {(loading || isStreaming) && (
              <div className="flex items-center text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-900">
        {error && (
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="bg-red-900 border border-red-700 rounded-lg p-4">
              <p className="text-red-200">Error: {error.message}</p>
            </div>
          </div>
        )}

        <div className="min-h-full">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto px-4">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-semibold text-white mb-2">
                  {agent?.name || "Assistant"}
                </h1>
                <p className="text-gray-400 text-lg mb-8">
                  {agent?.description || "How can I help you today?"}
                </p>
                <div className="text-sm text-gray-500">
                  <p>Start a conversation by typing a message below.</p>
                </div>
              </div>
            </div>
          ) : (
            renderedMessages
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        disabled={loading}
        isStreaming={isStreaming}
        placeholder={placeholder}
      />
    </div>
  );
};

// Main Chat component with provider
export const Chat: React.FC<ChatProps> = (props) => {
  return (
    <ChatProvider>
      <ChatContent {...props} />
    </ChatProvider>
  );
};

export default Chat;