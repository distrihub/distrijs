import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DistriMessage, DistriEvent, DistriArtifact, isDistriMessage } from '@distri/core';
import { ChatInput } from './ChatInput';
import { useChat } from '../useChat';
import { MessageRenderer } from './renderers';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
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

  // Custom renderers
  MessageRenderer?: React.ComponentType<any>;

  // Theme
  theme?: 'light' | 'dark' | 'auto';
}

// Planning component for "Planning..."
function Planning() {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md text-xs text-muted-foreground mb-4">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Loader2 className="w-2 h-2 text-blue-500 animate-spin" />
        </div>
        <span>Planning...</span>
      </div>
    </div>
  );
}

// Tool execution component
function ToolExecution({
  toolCall,
  isExpanded,
  onToggle
}: {
  toolCall: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'running':
        return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (toolCall.status) {
      case 'running':
        return 'Running';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-xs">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="font-medium">{toolCall.step_title || toolCall.tool_name}</span>
          <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
            {getStatusText()}
          </Badge>
        </div>
        {(toolCall.result || toolCall.error || toolCall.input) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle();
            }}
            className="p-1 h-5 w-5 text-xs"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>

      {isExpanded && (toolCall.result || toolCall.error || toolCall.input) && (
        <Card className="mt-2">
          <CardContent className="p-2 space-y-2">
            {/* Show input/arguments */}
            {toolCall.input && (
              <div className="text-xs">
                <strong className="text-muted-foreground">Arguments:</strong>
                <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-y-auto">
                  {typeof toolCall.input === 'string' ? toolCall.input : JSON.stringify(toolCall.input, null, 2)}
                </pre>
              </div>
            )}

            {/* Show error or result */}
            {toolCall.error ? (
              <div className="text-xs text-destructive">
                <strong>Error:</strong> {toolCall.error}
              </div>
            ) : toolCall.result && (
              <div className="text-xs">
                <strong className="text-muted-foreground">Result:</strong>
                <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-y-auto">
                  {typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Streaming message component
function StreamingMessage({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
        <div className="w-2.5 h-2.5 text-green-500 font-bold text-xs">A</div>
      </div>
      <div className="flex-1">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="text-sm leading-relaxed">{content}</p>
          {isStreaming && (
            <span className="inline-block w-1 h-3 bg-green-500 animate-pulse ml-1"></span>
          )}
        </div>
      </div>
    </div>
  );
}

// Generating status component (like Cursor)
function GeneratingStatus({ onStop }: { onStop: () => void }) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md text-xs text-muted-foreground mb-4">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Loader2 className="w-2 h-2 text-blue-500 animate-spin" />
        </div>
        <span>Generating</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onStop}
        className="p-1 h-5 text-xs text-muted-foreground hover:text-foreground"
      >
        Stop
      </Button>
    </div>
  );
}

// Custom hook to get store state without infinite loops
function useChatState() {
  const messages = useChatStateStore(state => state.messages);
  const isStreaming = useChatStateStore(state => state.isStreaming);
  const isLoading = useChatStateStore(state => state.isLoading);
  const error = useChatStateStore(state => state.error);
  const toolCalls = useChatStateStore(state => state.toolCalls);
  const currentTaskId = useChatStateStore(state => state.currentTaskId);
  const currentPlanId = useChatStateStore(state => state.currentPlanId);
  const tasks = useChatStateStore(state => state.tasks);
  const plans = useChatStateStore(state => state.plans);

  // Compute values from basic state
  const currentTask = currentTaskId ? tasks.get(currentTaskId) || null : null;
  const currentPlan = currentPlanId ? plans.get(currentPlanId) || null : null;
  const pendingToolCalls = Array.from(toolCalls.values()).filter(toolCall =>
    toolCall.status === 'pending' || toolCall.status === 'running'
  );
  const completedToolCalls = Array.from(toolCalls.values()).filter(toolCall =>
    toolCall.status === 'completed' || toolCall.status === 'error'
  );
  const hasPendingToolCalls = pendingToolCalls.length > 0;

  return {
    messages,
    isStreaming,
    isLoading,
    error,
    currentTask,
    currentPlan,
    pendingToolCalls,
    completedToolCalls,
    hasPendingToolCalls,
  };
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
  MessageRenderer: CustomMessageRenderer,
  theme = 'auto',
}: ChatProps) {
  const [input, setInput] = useState('');
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sendMessage,
    stopStreaming,
    chatState,
  } = useChat({
    threadId,
    agent,
    onMessage,
    onError,
    getMetadata,
    onMessagesUpdate,
    messageFilter,
    tools,
  });

  // Use custom hook to get store state
  const {
    messages,
    isStreaming,
    isLoading,
    error,
    currentTask,
    currentPlan,
    pendingToolCalls,
    completedToolCalls,
    hasPendingToolCalls
  } = useChatState();


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

  // Use custom renderers or fall back to defaults
  const MessageRendererComponent = CustomMessageRenderer || MessageRenderer;

  // Determine theme classes
  const getThemeClasses = () => {
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return '';
    // For 'auto', we'll let the system handle it
    return '';
  };

  // Render all messages and state
  const renderMessages = () => {
    const elements: React.ReactNode[] = [];

    // Render all messages first
    messages.forEach((message: any, index: number) => {
      if (isDistriMessage(message)) {
        const distriMessage = message as DistriMessage;

        // User message
        if (distriMessage.role === 'user') {
          elements.push(
            <div key={`user-${index}`} className="flex items-center space-x-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <div className="w-2.5 h-2.5 text-blue-500 font-bold text-xs">U</div>
              </div>
              <div className="flex-1">
                <p className="text-sm leading-relaxed">{distriMessage.parts.find(p => p.type === 'text')?.text || 'User message'}</p>
              </div>
            </div>
          );
        }

        // Assistant message - centered like ChatGPT
        if (distriMessage.role === 'assistant') {
          elements.push(
            <div key={`message-${index}`} className="flex justify-center mb-4">
              <div className="max-w-3xl w-full">
                <MessageRendererComponent
                  message={distriMessage}
                />
              </div>
            </div>
          );
        }
      }
    });

    // Render planning state if plan is running
    if (currentPlan?.status === 'running') {
      elements.push(<Planning key="planning" />);
    }

    // Render tool calls (both pending and completed)
    const allToolCalls = [...pendingToolCalls, ...completedToolCalls];
    allToolCalls.forEach((toolCall) => {
      elements.push(
        <div key={`tool-${toolCall.tool_call_id}`} className="flex justify-center mb-3">
          <div className="max-w-3xl w-full">
            <ToolExecution
              toolCall={toolCall}
              isExpanded={expandedTools.has(toolCall.tool_call_id)}
              onToggle={() => toggleToolExpansion(toolCall.tool_call_id)}
            />
          </div>
        </div>
      );
    });

    // Render streaming message if currently streaming
    if (isStreaming) {
      const lastMessage = messages[messages.length - 1];
      if (isDistriMessage(lastMessage)) {
        const textContent = (lastMessage as DistriMessage).parts
          .filter(p => p.type === 'text')
          .map(p => p.text)
          .join('');

        if (textContent) {
          elements.push(
            <div key="streaming" className="flex justify-center mb-4">
              <div className="max-w-3xl w-full">
                <StreamingMessage
                  content={textContent}
                  isStreaming={true}
                />
              </div>
            </div>
          );
        }
      }
    }

    return elements;
  };

  return (
    <div className={`flex flex-col h-full ${getThemeClasses()}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background text-foreground">
        {/* All messages and state */}
        {renderMessages()}

        {/* Generating status when streaming */}
        {isStreaming && (
          <GeneratingStatus onStop={handleStopStreaming} />
        )}

        {/* Debug info - hidden by default */}
        {process.env.NODE_ENV === 'development' && false && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-xs">
            <h4 className="font-bold mb-2">Debug Info:</h4>
            <div>Current Task: {currentTask?.id || 'None'}</div>
            <div>Current Plan: {currentPlan?.id || 'None'}</div>
            <div>Pending Tool Calls: {pendingToolCalls.length}</div>
            <div>Completed Tool Calls: {completedToolCalls.length}</div>
            <div>Total Tool Calls: {chatState.toolCalls.size}</div>
            <div>Messages: {messages.length}</div>
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
          disabled={isLoading || hasPendingToolCalls}
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