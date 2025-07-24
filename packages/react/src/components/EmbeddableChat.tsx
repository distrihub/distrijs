import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { Agent } from '@distri/core';
import { useChat } from '../useChat';
import { UserMessage, AssistantMessage, AssistantWithToolCalls, PlanMessage } from './MessageComponents';
import { shouldDisplayMessage, extractTextFromMessage, getMessageType } from '../utils/messageUtils';
import { AgentDropdown } from './AgentDropdown';
import '../styles/themes.css';
import { ChatInput } from './ChatInput';

export interface EmbeddableChatProps {
  agentId: string;
  threadId?: string;
  agent?: Agent;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
  metadata?: any;
  // Available agents for selection
  availableAgents?: Array<{ id: string; name: string; description?: string }>;
  // Customization props
  UserMessageComponent?: React.ComponentType<any>;
  AssistantMessageComponent?: React.ComponentType<any>;
  AssistantWithToolCallsComponent?: React.ComponentType<any>;
  PlanMessageComponent?: React.ComponentType<any>;
  // Theme
  theme?: 'light' | 'dark' | 'auto';
  // Config overrides
  showDebug?: boolean;
  showAgentSelector?: boolean;
  placeholder?: string;
  // Callbacks
  onAgentSelect?: (agentId: string) => void;
  onResponse?: (message: any) => void;
}

export const EmbeddableChat: React.FC<EmbeddableChatProps> = ({
  agentId,
  threadId = 'default',
  agent,
  height = '600px',
  className = '',
  style = {},
  metadata,
  availableAgents = [],
  UserMessageComponent = UserMessage,
  AssistantMessageComponent = AssistantMessage,
  AssistantWithToolCallsComponent = AssistantWithToolCalls,
  PlanMessageComponent = PlanMessage,
  theme = 'dark',
  showDebug = false,
  showAgentSelector = true,
  placeholder = "Type your message...",
  onAgentSelect,
  onResponse: _onResponse,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    loading,
    error,
    sendMessage: chatSendMessage,
    isStreaming,
  } = useChat({
    agentId,
    threadId,
    agent,
    metadata,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Determine theme class
  const themeClass = theme === 'auto' ? '' : theme;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const messageText = input.trim();
    setInput('');
    
    try {
      await chatSendMessage(messageText);
    } catch (err) {
      console.error('Failed to send message:', err);
      setInput(messageText); // Restore input on error
    }
  };

  const renderedMessages = useMemo(() => {
    return messages
      .filter(msg => shouldDisplayMessage(msg, showDebug))
      .map((message, index) => {
        const messageType = getMessageType(message);
        const messageContent = extractTextFromMessage(message);
        const key = `message-${index}`;

        // Get timestamp from message metadata or parts
        const timestamp = (message as any).created_at ? new Date((message as any).created_at) : undefined;

        switch (messageType) {
          case 'user':
            return (
              <UserMessageComponent
                key={key}
                content={messageContent}
                timestamp={timestamp}
              />
            );

          case 'assistant':
            return (
              <AssistantMessageComponent
                key={key}
                content={messageContent}
                timestamp={timestamp}
                isStreaming={isStreaming && index === messages.length - 1}
              />
            );

          case 'assistant_with_tools':
            // Extract tool calls from message parts or metadata
            const toolCalls = (message.parts || [])
              .filter((part: any) => part.tool_call)
              .map((part: any) => ({
                toolCall: part.tool_call,
                status: 'completed' as const,
                result: part.tool_result || 'Completed successfully',
              }));

            return (
              <AssistantWithToolCallsComponent
                key={key}
                content={messageContent}
                toolCalls={toolCalls}
                timestamp={timestamp}
                isStreaming={isStreaming && index === messages.length - 1}
              />
            );

          case 'plan':
            return (
              <PlanMessageComponent
                key={key}
                content={messageContent}
                timestamp={timestamp}
              />
            );

          default:
            return null;
        }
      })
      .filter(Boolean);
  }, [
    messages,
    showDebug,
    isStreaming,
    UserMessageComponent,
    AssistantMessageComponent,
    AssistantWithToolCallsComponent,
    PlanMessageComponent,
  ]);

  return (
    <div 
      className={`distri-chat ${themeClass} ${className} w-full`}
      style={{ 
        height,
        backgroundColor: '#343541',
        ...style 
      }}
    >
      <div className="h-full flex flex-col">
        {/* Agent Selector Header (if enabled) */}
        {showAgentSelector && availableAgents && availableAgents.length > 0 && (
          <div className="border-b border-gray-600 p-4" style={{ backgroundColor: '#343541' }}>
            <AgentDropdown
              agents={availableAgents}
              selectedAgentId={agentId}
              onAgentSelect={(agentId) => onAgentSelect?.(agentId)}
              className="w-full"
            />
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto distri-scroll">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-400 max-w-sm">
                  {placeholder || "Type your message below to begin chatting."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {renderedMessages}
            </div>
          )}
          
          {/* Loading state */}
          {loading && (
            <div className="px-6 py-4 flex items-center space-x-2" style={{ backgroundColor: '#2f2f2f' }}>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
              <span className="text-gray-400 text-sm">Thinking...</span>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="px-6 py-4 bg-red-900/20 border border-red-500/20 mx-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-red-500"></div>
                <span className="text-red-400 text-sm">{error.message || String(error)}</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-600 p-6" style={{ backgroundColor: '#343541' }}>
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            placeholder={placeholder}
            disabled={loading}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};