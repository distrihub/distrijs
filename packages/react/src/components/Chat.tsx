import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Loader2, Square, Settings, Eye, EyeOff } from 'lucide-react';
import { useChat, DistriAgent, MessageMetadata, ToolResult } from '@distri/core';
import { useChatConfig, getThemeClasses, ChatProvider } from './ChatContext';
import { UserMessage, AssistantMessage, AssistantWithToolCalls, Tool } from './MessageComponents';
import ExternalToolManager from './ExternalToolManager';

export interface ChatProps {
  agentId: string;
  threadId: string;
  agent?: DistriAgent;
  tools?: Record<string, any>;
  metadata?: any;
  height?: string;
  onThreadUpdate?: (threadId: string) => void;
  className?: string;
}

const ChatInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isStreaming: boolean;
  placeholder?: string;
}> = ({ value, onChange, onSend, disabled, isStreaming, placeholder = "Type a message..." }) => {
  const { config } = useChatConfig();
  const theme = getThemeClasses(config.theme);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  return (
    <div className={`border-t ${theme.border} ${theme.background} p-4`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              rows={1}
              className={`w-full resize-none rounded-xl border ${theme.border} px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme.background} ${theme.text} placeholder:${theme.textSecondary}`}
              style={{ minHeight: '52px', maxHeight: '200px' }}
              disabled={disabled}
            />
            <button
              onClick={onSend}
              disabled={!value.trim() || disabled}
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
      className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
  className = ""
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { config, updateConfig } = useChatConfig();
  const theme = getThemeClasses(config.theme);

  const {
    messages,
    loading,
    error,
    isStreaming,
    sendMessageStream,
    cancelToolExecution,
    toolCallStatus,
    toolHandlerResults,
  } = useChat({
    agentId,
    threadId,
    agent,
    tools,
    metadata,
  });

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

    // Always show user messages
    if (message.role === 'user') return true;

    // Check if message has text content
    const textContent = extractTextFromMessage(message);
    if (textContent.trim()) return true;

    // Show tool calls if debug is enabled or if they have results
    if (message.metadata?.type === 'assistant_response' && message.metadata.tool_calls) {
      return config.showDebugMessages || message.metadata.tool_calls.some((tc: any) => 
        toolCallStatus[tc.tool_call_id]?.status === 'completed'
      );
    }

    // Show other metadata messages only if debug is enabled
    if (message.metadata?.type) {
      return config.showDebugMessages;
    }

    return false;
  }, [extractTextFromMessage, config.showDebugMessages, toolCallStatus]);

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

  // Render messages using new components
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
            <UserMessage
              key={message.messageId || `user-${index}`}
              content={messageText}
              timestamp={timestamp}
            />
          );
        }

        // Handle assistant messages with tool calls
        if (message.metadata?.type === 'assistant_response' && message.metadata.tool_calls) {
          const toolCallsProps = message.metadata.tool_calls.map((toolCall: any) => {
            const status = toolCallStatus[toolCall.tool_call_id];
            return {
              toolCall,
              status: status?.status || 'pending',
              result: status?.result,
              error: status?.error,
            };
          });

          return (
            <AssistantWithToolCalls
              key={message.messageId || `assistant-tools-${index}`}
              content={messageText}
              toolCalls={toolCallsProps}
              timestamp={timestamp}
              isStreaming={isStreaming && index === messages.length - 1}
              metadata={message.metadata}
            />
          );
        }

        // Handle regular assistant messages
        return (
          <AssistantMessage
            key={message.messageId || `assistant-${index}`}
            content={messageText || 'Empty message'}
            timestamp={timestamp}
            isStreaming={isStreaming && index === messages.length - 1}
            metadata={message.metadata}
          />
        );
      });
  }, [messages, shouldDisplayMessage, extractTextFromMessage, toolCallStatus, isStreaming]);

  return (
    <div className={`flex flex-col ${theme.background} ${className}`} style={{ height }}>
      {/* Header */}
      <div className={`flex-shrink-0 border-b ${theme.border} ${theme.background} p-4`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            {agent && (
              <>
                <h2 className={`text-lg font-semibold ${theme.text}`}>{agent.name}</h2>
                <p className={`text-sm ${theme.textSecondary}`}>{agent.description}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <DebugToggle 
              showDebug={config.showDebugMessages}
              onToggle={() => updateConfig({ showDebugMessages: !config.showDebugMessages })}
            />
            {(loading || isStreaming) && (
              <div className="flex items-center text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto ${theme.background}`}>
        {error && (
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">Error: {error.message}</p>
            </div>
          </div>
        )}

        <div className="min-h-full">
          {renderedMessages}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* External Tool Manager */}
      {Object.keys(toolHandlerResults).length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            <ExternalToolManager
              toolCalls={Object.values(toolHandlerResults)}
              onToolComplete={async (results: ToolResult[]) => {
                onThreadUpdate?.(threadId);
              }}
              onCancel={cancelToolExecution}
            />
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        disabled={loading}
        isStreaming={isStreaming}
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