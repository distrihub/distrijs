import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DistriMessage, DistriEvent, DistriArtifact, isDistriEvent } from '@distri/core';
import { ChatInput } from './ChatInput';
import { useChat } from '../useChat';
import { MessageRenderer } from './renderers/MessageRenderer';
import { useChatStateStore } from '../stores/chatStateStore';

export interface ChatProps {
  threadId: string;
  agent?: any;
  onMessage?: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
  onError?: (error: Error) => void;
  getMetadata?: () => Promise<any>;
  onMessagesUpdate?: () => void;
  tools?: any[];

  // Message filter to control what messages are displayed
  messageFilter?: (message: DistriEvent | DistriMessage | DistriArtifact, idx: number) => boolean;

  // Override chat state (for testing/debugging)
  overrideChatState?: any;

  // Theme
  theme?: 'light' | 'dark' | 'auto';
}

export function Chat({
  threadId,
  agent,
  onMessage,
  onError,
  getMetadata,
  onMessagesUpdate,
  tools,
  messageFilter,
  overrideChatState,
  theme = 'auto',
}: ChatProps) {
  const [input, setInput] = useState('');
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sendMessage,
    stopStreaming,
  } = useChat({
    threadId,
    agent,
    onMessage,
    onError,
    getMetadata,
    onMessagesUpdate,
    messageFilter,
    tools,
    overrideChatState,
  });

  // Get chat state - use override if provided, otherwise get from store
  const chatState = overrideChatState || useChatStateStore.getState();

  // Get reactive state from store
  const messages = useChatStateStore(state => state.messages);
  const isStreaming = useChatStateStore(state => state.isStreaming);
  const isLoading = useChatStateStore(state => state.isLoading);
  const error = useChatStateStore(state => state.error);
  const toolCalls = useChatStateStore(state => state.toolCalls);
  const currentPlanId = useChatStateStore(state => state.currentPlanId);
  const plans = useChatStateStore(state => state.plans);
  const hasPendingToolCalls = useChatStateStore(state => state.hasPendingToolCalls);
  const currentTaskId = useChatStateStore(state => state.currentTaskId);
  const tasks = useChatStateStore(state => state.tasks);

  // Compute derived state
  const currentPlan = currentPlanId ? plans.get(currentPlanId) || null : null;
  const currentTask = currentTaskId ? tasks.get(currentTaskId) || null : null;
  const pendingToolCalls = Array.from(toolCalls.values()).filter(toolCall =>
    toolCall.status === 'pending' || toolCall.status === 'running'
  );

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    setInput('');
    await sendMessage(content);
  }, [sendMessage]);

  const handleStopStreaming = useCallback(() => {
    stopStreaming();
  }, [stopStreaming]);

  const toggleToolExpansion = useCallback((toolId: string) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
      } else {
        newSet.add(toolId);
      }
      return newSet;
    });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-expand tools that are running or have errors
  useEffect(() => {
    const newExpanded = new Set(expandedTools);
    let hasChanges = false;

    toolCalls.forEach(toolCall => {
      if (toolCall.status === 'running' || toolCall.status === 'error' || toolCall.status === 'user_action_required') {
        if (!newExpanded.has(toolCall.tool_call_id)) {
          newExpanded.add(toolCall.tool_call_id);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setExpandedTools(newExpanded);
    }
  }, [toolCalls]); // Remove expandedTools from dependencies

  // Determine theme classes
  const getThemeClasses = () => {
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return '';
    // For 'auto', we'll let the system handle it
    return '';
  };

  // Render messages using the new MessageRenderer
  const renderMessages = () => {
    const elements: React.ReactNode[] = [];

    // Render all messages using MessageRenderer
    messages.forEach((message: any, index: number) => {
      const renderedMessage = (
        <MessageRenderer
          key={`message-${index}`}
          message={message}
          index={index}
          chatState={chatState}
          isExpanded={expandedTools.has(message.id || `message-${index}`)}
          onToggle={() => {
            const messageId = message.id || `message-${index}`;
            toggleToolExpansion(messageId);
          }}
        />
      );

      // Only add non-null rendered messages
      if (renderedMessage !== null) {
        elements.push(renderedMessage);
      }
    });

    const hasPlanStarted = messages.some(m => isDistriEvent(m) && m.type === 'plan_started');
    if (currentPlan?.status === 'running' && !hasPlanStarted) {
      elements.push(
        <MessageRenderer
          key="planning"
          message={{ type: 'plan_started', data: {} } as any}
          index={messages.length}
          chatState={chatState}
        />
      );
    }

    const hasRunStarted = messages.some(m => isDistriEvent(m) && m.type === 'run_started');
    if (currentTask?.status === 'running' && !hasRunStarted) {
      elements.push(
        <MessageRenderer
          key="thinking-after-run"
          message={{ type: 'run_started', data: {} } as any}
          index={messages.length + 1}
          chatState={chatState}
        />
      );
    }

    const hasTextStart = messages.some(m => isDistriEvent(m) && m.type === 'text_message_start');
    const shouldShowStreamingIndicator = (isStreaming || isLoading) &&
      (!currentPlan || currentPlan.status !== 'running') &&
      pendingToolCalls.length === 0 &&
      !hasTextStart;

    if (shouldShowStreamingIndicator) {
      elements.push(
        <MessageRenderer
          key="generating"
          message={{ type: 'text_message_start', data: { message_id: 'streaming', role: 'assistant' } } as any}
          index={messages.length + 2}
          chatState={chatState}
        />
      );
    }

    return elements;
  };

  return (
    <div className={`flex flex-col h-full ${getThemeClasses()}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background text-foreground">
        {/* Render all messages and state */}
        {renderMessages()}

        {/* Debug info - hidden by default */}
        {process.env.NODE_ENV === 'development' && false && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-xs">
            <h4 className="font-bold mb-2">Debug Info:</h4>
            <div>Messages: {messages.length}</div>
            <div>Tool Calls: {toolCalls.size}</div>
            <div>Is Streaming: {isStreaming ? 'Yes' : 'No'}</div>
            <div>Is Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Has Pending Tool Calls: {hasPendingToolCalls() ? 'Yes' : 'No'}</div>
            <div>Current Plan: {currentPlan?.status || 'None'}</div>
            <div>Pending Tool Calls: {pendingToolCalls.length}</div>

            {/* Example of how to access chat state for debugging */}
            <div className="mt-4 p-2 bg-background rounded border">
              <h5 className="font-bold mb-1">Chat State Access Example:</h5>
              <pre className="text-xs">
                {`// Access state directly from store (reactive):
const messages = useChatStateStore(state => state.messages);
const toolCalls = useChatStateStore(state => state.toolCalls);
const currentPlan = useChatStateStore(state => {
  const planId = state.currentPlanId;
  return planId ? state.plans.get(planId) || null : null;
});

// For debugging, you can log the full state:
console.log('Full chat state:', useChatStateStore.getState());`}
              </pre>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4 bg-background">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => handleSendMessage(input)}
          onStop={handleStopStreaming}
          placeholder="Type your message..."
          disabled={isLoading || hasPendingToolCalls()}
          isStreaming={isStreaming}
        />
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border-l-4 border-destructive">
          <div className="text-destructive text-xs">
            <strong>Error:</strong> {error.message}
          </div>
        </div>
      )}
    </div>
  );
}