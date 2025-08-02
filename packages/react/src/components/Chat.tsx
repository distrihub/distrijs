import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DistriMessage, DistriEvent, DistriArtifact, isDistriMessage, isDistriArtifact } from '@distri/core';
import { ChatInput } from './ChatInput';
import { useChat } from '../useChat';
import { TaskRenderer, ArtifactRenderer, PlanRenderer, MessageRenderer } from './renderers';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

export interface ChatProps {
  threadId: string;
  agent?: any;
  onMessage?: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
  onError?: (error: Error) => void;
  getMetadata?: () => Promise<any>;
  onMessagesUpdate?: () => void;
  tools?: any[];

  // Custom renderers
  TaskRenderer?: React.ComponentType<any>;
  ArtifactRenderer?: React.ComponentType<any>;
  PlanRenderer?: React.ComponentType<any>;
  MessageRenderer?: React.ComponentType<any>;

  // Custom tool call renderers
  ToolCallRenderer?: React.ComponentType<any>;

  // Callbacks
  onToolResult?: (toolCallId: string, result: any) => void;

  // Theme
  theme?: 'light' | 'dark' | 'auto';
}

// Planning component for "Planning..."
function Planning() {
  return (
    <div className="flex items-start space-x-2 mb-4">
      <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-1">
        <Loader2 className="w-3 h-3 text-yellow-600 animate-spin" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600">Planning...</p>
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
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (toolCall.status) {
      case 'running':
        return 'Running';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{toolCall.tool_name}</span>
          <Badge variant="secondary" className="text-xs">
            {getStatusText()}
          </Badge>
        </div>
        {(toolCall.result || toolCall.error) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1 h-6 w-6"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {isExpanded && (toolCall.result || toolCall.error) && (
        <Card className="mt-2">
          <CardContent className="p-3">
            {toolCall.error ? (
              <div className="text-sm text-red-600">
                <strong>Error:</strong> {toolCall.error}
              </div>
            ) : (
              <div className="text-sm">
                <strong>Result:</strong>
                <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto">
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
    <div className="flex items-start space-x-2 mb-4">
      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
        <div className="w-3 h-3 text-green-600">A</div>
      </div>
      <div className="flex-1">
        <div className="prose prose-sm max-w-none">
          <p>{content}</p>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-green-500 animate-pulse ml-1"></span>
          )}
        </div>
      </div>
    </div>
  );
}

export function Chat({
  threadId,
  agent,
  onMessage,
  onError,
  getMetadata,
  onMessagesUpdate,
  tools,
  TaskRenderer: CustomTaskRenderer,
  ArtifactRenderer: CustomArtifactRenderer,
  PlanRenderer: CustomPlanRenderer,
  MessageRenderer: CustomMessageRenderer,
  ToolCallRenderer: CustomToolCallRenderer,
  onToolResult,
  theme = 'auto',
}: ChatProps) {
  const [input, setInput] = useState('');
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    sendMessage,
    isLoading,
    error,
    hasPendingToolCalls,
    stopStreaming,
    chatState,
  } = useChat({
    threadId,
    agent,
    onMessage,
    onError,
    getMetadata,
    onMessagesUpdate,
    tools,
  });

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

  // Get current state from Zustand store
  const currentTask = chatState.getCurrentTask();
  const currentPlan = chatState.getCurrentPlan();
  const currentTasks = chatState.getCurrentTasks();
  const pendingToolCalls = chatState.getPendingToolCalls();
  const completedToolCalls = chatState.getCompletedToolCalls();

  // Use custom renderers or fall back to defaults
  const TaskRendererComponent = CustomTaskRenderer || TaskRenderer;
  const ArtifactRendererComponent = CustomArtifactRenderer || ArtifactRenderer;
  const PlanRendererComponent = CustomPlanRenderer || PlanRenderer;
  const MessageRendererComponent = CustomMessageRenderer || MessageRenderer;
  const ToolCallRendererComponent = CustomToolCallRenderer || ToolExecution;

  // Render all messages and state
  const renderMessages = () => {
    const elements: React.ReactNode[] = [];

    // Render all messages first
    messages.forEach((message, index) => {
      if (isDistriMessage(message)) {
        const distriMessage = message as DistriMessage;

        // User message
        if (distriMessage.role === 'user') {
          elements.push(
            <div key={`user-${index}`} className="flex items-start space-x-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-3 h-3 text-blue-600">U</div>
              </div>
              <div className="flex-1">
                <p className="text-sm">{distriMessage.parts.find(p => p.type === 'text')?.text || 'User message'}</p>
              </div>
            </div>
          );
        }

        // Assistant message
        if (distriMessage.role === 'assistant') {
          elements.push(
            <MessageRendererComponent
              key={`message-${index}`}
              message={distriMessage}
            />
          );
        }
      }

      // Render artifacts
      if (isDistriArtifact(message)) {
        elements.push(
          <ArtifactRendererComponent
            key={`artifact-${index}`}
            artifact={message as DistriArtifact}
            toolCallStates={chatState.toolCalls}
          />
        );
      }
    });

    // Render planning state if plan is running
    if (currentPlan?.status === 'running') {
      elements.push(<Planning key="planning" />);
    }

    // Render plan if completed
    if (currentPlan?.status === 'completed' && currentPlan.steps.length > 0) {
      elements.push(
        <div key="plan" className="mb-4">
          <PlanRendererComponent
            plan={{
              type: 'plan',
              timestamp: Date.now(),
              steps: currentPlan.steps,
              id: currentPlan.id,
            }}
          />
        </div>
      );
    }

    // Render pending tool calls
    pendingToolCalls.forEach((toolCall) => {
      elements.push(
        <ToolCallRendererComponent
          key={`tool-${toolCall.tool_call_id}`}
          toolCall={toolCall}
          isExpanded={expandedTools.has(toolCall.tool_call_id)}
          onToggle={() => toggleToolExpansion(toolCall.tool_call_id)}
        />
      );
    });

    // Render completed tool calls
    completedToolCalls.forEach((toolCall) => {
      elements.push(
        <ToolCallRendererComponent
          key={`tool-${toolCall.tool_call_id}`}
          toolCall={toolCall}
          isExpanded={expandedTools.has(toolCall.tool_call_id)}
          onToggle={() => toggleToolExpansion(toolCall.tool_call_id)}
        />
      );
    });

    // Render current tasks
    currentTasks.forEach((task) => {
      if (TaskRendererComponent) {
        elements.push(
          <TaskRendererComponent
            key={`task-${task.id}`}
            task={task}
            toolCallStates={chatState.toolCalls}
            onToolResult={onToolResult}
          />
        );
      }
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
            <StreamingMessage
              key="streaming"
              content={textContent}
              isStreaming={true}
            />
          );
        }
      }
    }

    return elements;
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* All messages and state */}
        {renderMessages()}

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <h4 className="font-bold mb-2">Debug Info:</h4>
            <div>Current Run: {currentTask?.id || 'None'}</div>
            <div>Current Plan: {currentPlan?.id || 'None'}</div>
            <div>Tasks: {currentTasks.length}</div>
            <div>Pending Tool Calls: {pendingToolCalls.length}</div>
            <div>Completed Tool Calls: {completedToolCalls.length}</div>
            <div>Total Tool Calls: {chatState.toolCalls.size}</div>
            <div>Messages: {messages.length}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
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
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="text-red-700">
            <strong>Error:</strong> {error.message}
          </div>
        </div>
      )}
    </div>
  );
}