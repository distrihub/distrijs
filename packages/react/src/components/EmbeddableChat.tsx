import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { Agent, DistriMessage, DistriPart, isDistriMessage, MessageRole } from '@distri/core';
import { useChat } from '../useChat';
import { UserMessage, AssistantMessage, AssistantWithToolCalls, PlanMessage, DebugMessage } from './Components';
import { shouldDisplayMessage, extractTextFromMessage } from '../utils/messageUtils';
import { AgentSelect } from './AgentSelect';
import { Toaster } from './ui/sonner';

import { ChatInput } from './ChatInput';
import { uuidv4 } from '../../../core/src/distri-client';
import { DistriAnyTool, ToolCallState } from '@/types';

export interface EmbeddableChatProps {
  agent: Agent;
  threadId?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
  metadata?: any;
  tools?: DistriAnyTool[];
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
  disableAgentSelection?: boolean;
  // Callbacks
  onAgentSelect?: (agentId: string) => void;
  onResponse?: (message: any) => void;
  onMessagesUpdate?: () => void;
}

export type MessageComponentType = MessageRole | 'assistant_with_tools' | 'plan' | 'debug' | 'tool';

export const EmbeddableChat: React.FC<EmbeddableChatProps> = ({
  threadId = uuidv4(),
  agent,
  className = '',
  style = {},
  metadata,
  tools,
  availableAgents = [],
  UserMessageComponent = UserMessage,
  AssistantMessageComponent = AssistantMessage,
  AssistantWithToolCallsComponent = AssistantWithToolCalls,
  PlanMessageComponent = PlanMessage,
  theme = 'dark',
  showDebug = false,
  showAgentSelector = true,
  placeholder = "Type your message...",
  disableAgentSelection = false,
  onAgentSelect,
  onResponse: _onResponse,
  onMessagesUpdate,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage: sendChatMessage,
    toolCallStates,
    stopStreaming,
  } = useChat({
    threadId,
    agent: agent || undefined,
    tools,
    metadata,
    onMessagesUpdate
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const messageText = input.trim();
    setInput('');

    try {
      await sendChatMessage(messageText);
    } catch (err) {
      console.error('Failed to send message:', err);
      setInput(messageText); // Restore input on error
    }
  };

  const getMessageType = (message: DistriMessage): MessageComponentType => {
    if (message.parts.some((part: DistriPart) => part.type === 'tool_call')) {
      return 'assistant_with_tools';
    }
    if (message.parts.some((part: DistriPart) => part.type === 'plan')) {
      return 'plan';
    }
    return message.role;
  };

  const renderedMessages = useMemo(() => {
    return messages
      .filter(msg => shouldDisplayMessage(msg, showDebug))
      .map((message, index) => {
        const messageContent = extractTextFromMessage(message);
        const key = `message-${index}`;

        // Get timestamp from message metadata or parts
        const timestamp = (message as any).created_at ? new Date((message as any).created_at) : undefined;

        if (isDistriMessage(message)) {
          switch (getMessageType(message)) {
            case 'user':
              return (
                <UserMessageComponent
                  key={key}
                  message={message}
                  timestamp={timestamp}
                />
              );

            case 'assistant':
              return (
                <AssistantMessageComponent
                  key={key}
                  name={agent?.name}
                  avatar={agent?.iconUrl ? (
                    <img src={agent.iconUrl} alt={agent.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                      {agent?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                  message={message}
                  timestamp={timestamp}
                  isStreaming={isStreaming && index === messages.length - 1}
                />
              );

            case 'assistant_with_tools':
              // Extract tool calls from message parts and get their status from the tool call state
              const states = (message.parts || [])
                .filter((part: any) => part.tool_call)
                .map((part: any) => {
                  const toolCallState = toolCallStates.get(part.tool_call.tool_call_id);
                  return toolCallState;
                }).filter(Boolean) as ToolCallState[];

              return (
                <AssistantWithToolCallsComponent
                  key={key}
                  message={message}
                  toolCallStates={states}
                  timestamp={timestamp}
                  isStreaming={isStreaming && index === messages.length - 1}
                />
              );

            case 'plan':
              return (
                <PlanMessageComponent
                  key={key}
                  message={message}
                  plan={messageContent}
                  timestamp={timestamp}
                />
              );

            case 'debug':
              return (
                <DebugMessage
                  key={key}
                  message={message}
                  timestamp={timestamp}
                />
              );

            default:
              return null;
          }
        } else {
          return null;
        }
      })
      .filter(Boolean);
  }, [
    messages,
    showDebug,
    UserMessageComponent,
    AssistantMessageComponent,
    AssistantWithToolCallsComponent,
    PlanMessageComponent,
    toolCallStates,
    isStreaming
  ]);

  return (
    <div
      className={`distri-chat ${className} ${theme === 'dark' ? 'dark' : 'light'} w-full bg-background text-foreground flex flex-col relative`}
      style={{
        ...style
      }}
    >
      {/* Top padding and Agent Selector */}
      <div className="pt-6 px-6 bg-background flex-shrink-0 z-10">
        {showAgentSelector && availableAgents && availableAgents.length > 0 && (
          <div className="mb-6">
            <AgentSelect
              agents={availableAgents}
              selectedAgentId={agent?.id}
              onAgentSelect={(agentId: string) => onAgentSelect?.(agentId)}
              className="w-full"
              disabled={disableAgentSelection || messages.length > 0}
            />
            {(disableAgentSelection || messages.length > 0) && (
              <div className="text-xs text-muted-foreground mt-1">
                Agent locked for this conversation
              </div>
            )}
          </div>
        )}
      </div>
      <Toaster />

      {/* Main Chat Area - Full height scrollable container */}
      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0 flex flex-col">
          {/* Messages Area - Full height scrollable */}
          <div className="flex-1 overflow-y-auto distri-scroll bg-background">
            <div className="mx-auto" style={{ maxWidth: 'var(--thread-content-max-width)' }}>
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-muted-foreground max-w-sm">
                      {placeholder || "Type your message below to begin chatting."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0 pt-4">
                  {renderedMessages}
                </div>
              )}

              {/* Loading state */}
              {isLoading && (
                <div className="px-6 py-4 flex items-center space-x-2 bg-muted rounded-lg mt-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"></div>
                  <span className="text-muted-foreground text-sm">Thinking...</span>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="px-6 py-4 bg-destructive/20 border border-destructive/20 rounded-lg mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-destructive"></div>
                    <span className="text-destructive text-sm">{error.message || String(error)}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area - Absolutely positioned at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-background py-4">
            <div className="mx-auto" style={{ maxWidth: 'var(--thread-content-max-width)' }}>
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={sendMessage}
                onStop={stopStreaming}
                placeholder={placeholder}
                disabled={isLoading}
                isStreaming={isStreaming}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
};