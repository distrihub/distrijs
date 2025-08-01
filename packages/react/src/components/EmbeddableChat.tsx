import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Agent } from '@distri/core';
import {
  DistriMessage,
  DistriPart,
  isDistriMessage,
  MessageRole,
  } from '@distri/core';
import { useChat } from '../useChat';
import { DistriAnyTool, ToolCallState } from '../types';
import { ChatInput } from './ChatInput';
import { shouldDisplayMessage, extractTextFromMessage } from '../utils/messageUtils';
import {
  UserMessage,
  AssistantMessage,
  AssistantWithToolCalls,
  PlanMessage,
  DebugMessage,
} from './Components';
import { ExecutionTracker } from './ExecutionSteps';

export interface EmbeddableChatProps {
  agent: Agent;
  threadId?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
  getMetadata?: () => Promise<any>;
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

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const EmbeddableChat: React.FC<EmbeddableChatProps> = ({
  threadId = generateUUID(),
  agent,
  className = '',
  style = {},
  getMetadata,
  tools,
  // availableAgents = [],
  UserMessageComponent = UserMessage,
  AssistantMessageComponent = AssistantMessage,
  AssistantWithToolCallsComponent = AssistantWithToolCalls,
  PlanMessageComponent = PlanMessage,
  theme = 'dark',
  showDebug = false,
  // showAgentSelector = true,
  placeholder = "Type your message...",
  // disableAgentSelection = false,
  // onAgentSelect,
  onResponse: _onResponse,
  onMessagesUpdate,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    executionEvents,
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
    getMetadata,
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
      className={`distri-chat ${className} flex flex-col h-full border rounded-lg overflow-hidden ${
        theme === 'dark' ? 'dark' : ''
      }`}
      style={style}
    >
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderedMessages}
        
        {/* Execution Tracker */}
        {executionEvents.length > 0 && (
          <ExecutionTracker
            events={executionEvents}
            className="mt-4"
          />
        )}
        
        {error && (
          <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800">
            Error: {error.message}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="border-t p-4">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          onStop={stopStreaming}
          placeholder={placeholder}
          disabled={isLoading}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};