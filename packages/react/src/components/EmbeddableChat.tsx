import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { Agent, DistriMessage, DistriPart, isDistriMessage, MessageRole, DistriTool } from '@distri/core';
import { useChat } from '../useChat';
import { UserMessage, AssistantMessage, AssistantWithToolCalls, PlanMessage, DebugMessage } from './MessageComponents';
import { shouldDisplayMessage, extractTextFromMessage } from '../utils/messageUtils';
import { AgentSelect } from './AgentSelect';

import { ChatInput } from './ChatInput';
import { uuidv4 } from '../../../core/src/distri-client';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';

export interface EmbeddableChatProps {
  agent: Agent;
  threadId?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
  metadata?: any;
  tools?: DistriTool[];
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
    executeTool,
    completeTool,
    getToolCallStatus,
    toolResults
  } = useChat({
    threadId,
    agent: agent || undefined,
    tools,
    metadata,
    onMessagesUpdate
  });

  console.log('tools', tools);

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
                  avatar={agent?.iconUrl ? <Avatar>
                    <AvatarImage src={agent.iconUrl} />
                    <AvatarFallback>
                      {agent.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar> : undefined}
                  message={message}
                  timestamp={timestamp}
                  isStreaming={isStreaming && index === messages.length - 1}
                />
              );

            case 'assistant_with_tools':
              // Extract tool calls from message parts and get their status from the tool manager
              const toolCalls = (message.parts || [])
                .filter((part: any) => part.tool_call)
                .map((part: any) => {
                  const toolCall = part.tool_call;
                  const status = getToolCallStatus?.(toolCall.tool_call_id);

                  // Find corresponding tool result if available
                  const toolResult = toolResults.find(tr => tr.tool_call_id === toolCall.tool_call_id);

                  return {
                    toolCall,
                    status: status?.status || 'pending',
                    result: toolResult?.result || status?.result,
                    error: toolResult?.error || status?.error,
                    startedAt: status?.startedAt,
                    completedAt: status?.completedAt,
                  };
                });

              return (
                <AssistantWithToolCallsComponent
                  key={key}
                  message={message}
                  toolCalls={toolCalls}
                  timestamp={timestamp}
                  isStreaming={isStreaming && index === messages.length - 1}
                  onExecuteTool={executeTool}
                  onCompleteTool={completeTool}
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
    toolResults,
    getToolCallStatus,
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
            />
          </div>
        )}
      </div>

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
                onStop={() => {
                  // Stop streaming - this would need to be implemented in the useChat hook
                  console.log('Stop streaming');
                }}
                placeholder={placeholder}
                disabled={isLoading}
                isStreaming={isStreaming}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};