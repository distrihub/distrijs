import React, { useState } from 'react';
import { User, Bot, Settings, Clock, CheckCircle, XCircle, Brain, Wrench, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { ToolCall, DistriMessage } from '@distri/core';
import MessageRenderer from './MessageRenderer';

export interface BaseMessageProps {
  content?: string;
  message?: DistriMessage;
  timestamp?: Date;
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
}

export interface UserMessageProps extends BaseMessageProps {
  content?: string;
}

export interface AssistantMessageProps extends BaseMessageProps {
  content?: string;
  message?: DistriMessage;
  isStreaming?: boolean;
  metadata?: any;
  name?: string;
}

export interface AssistantWithToolCallsProps extends BaseMessageProps {
  content?: string;
  message?: DistriMessage;
  toolCalls: Array<{
    toolCall: ToolCall;
    status: 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
    result?: any;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
  }>;
  timestamp?: Date;
  isStreaming?: boolean;
  onExecuteTool?: (toolCall: ToolCall) => void;
  onCompleteTool?: (toolCallId: string, result: any, success?: boolean, error?: string) => void;
}

export interface PlanMessageProps extends BaseMessageProps {
  message?: DistriMessage;
  plan: string;
  timestamp?: Date;
}

export interface SystemMessageProps extends BaseMessageProps {
  content: string;
  timestamp?: Date;
}

export interface ToolMessageProps {
  message: DistriMessage;
  className?: string;
}
export interface DebugMessageProps extends BaseMessageProps {
  className?: string;
}

// Message Container Component
export const MessageContainer: React.FC<{
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  backgroundColor?: string;
}> = ({ children, align = 'left', className = '', backgroundColor }) => {
  const justifyClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  const getBgClass = (color: string) => {
    switch (color) {
      case '#343541':
        return 'bg-background';
      case '#444654':
        return 'bg-muted';
      case '#40414f':
        return 'bg-background';
      default:
        return '';
    }
  };

  const bgClass = backgroundColor ? getBgClass(backgroundColor) : '';

  return (
    <div className={`flex ${justifyClass} w-full ${bgClass} ${className}`}>
      <div className="w-full max-w-4xl mx-auto">
        {children}
      </div>
    </div>
  );
};

// User Message Component - ChatGPT style
export const UserMessage: React.FC<UserMessageProps> = ({
  content,
  message,
  timestamp,
  className = '',
  avatar
}) => {
  return (
    <MessageContainer align="center" className={className} backgroundColor="#343541">
      <div className="flex items-start gap-4 py-3 px-2">
        <div className="distri-avatar distri-avatar-user">
          {avatar || <User className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground mb-2">You</div>
          <div className="prose prose-sm max-w-none text-foreground">
            <MessageRenderer
              content={content}
              message={message}
              className="text-foreground"
            />
          </div>
          {timestamp && (
            <div className="text-xs text-muted-foreground mt-2">
              {timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </MessageContainer>
  );
};

// Assistant Message Component - ChatGPT style
export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  message,
  timestamp,
  isStreaming = false,
  metadata: _metadata,
  className = '',
  avatar,
  name = "Assistant"
}) => {
  return (
    <MessageContainer align="center" className={className} backgroundColor="#444654">
      <div className="flex items-start gap-4 py-3 px-2">
        <div className="distri-avatar distri-avatar-assistant">
          {avatar || <Bot className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            {name}
            {isStreaming && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150"></div>
              </div>
            )}
          </div>
          <div className="prose prose-sm max-w-none text-foreground">
            <MessageRenderer
              content={content}
              message={message}
              className="text-foreground"
            />
          </div>
          {timestamp && (
            <div className="text-xs text-muted-foreground mt-2">
              {timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </MessageContainer>
  );
};

// Assistant with Tool Calls Component
export const AssistantWithToolCalls: React.FC<AssistantWithToolCallsProps> = ({
  content,
  message,
  toolCalls,
  timestamp,
  isStreaming = false,
  className = '',
  avatar,
  name = "Assistant"
}) => {
  // State for collapsible tool results
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const toggleToolExpansion = (toolCallId: string) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolCallId)) {
        newSet.delete(toolCallId);
      } else {
        newSet.add(toolCallId);
      }
      return newSet;
    });
  };

  // Auto-expand tools that are running or have errors
  React.useEffect(() => {
    const newExpanded = new Set(expandedTools);
    toolCalls.forEach(toolCall => {
      if (toolCall.status === 'running' || toolCall.status === 'error' || toolCall.status === 'user_action_required') {
        newExpanded.add(toolCall.toolCall.tool_call_id);
      }
    });
    setExpandedTools(newExpanded);
  }, [toolCalls]);

  return (
    <MessageContainer align="center" className={className} backgroundColor="#444654">
      <div className="flex items-start gap-4 py-3 px-2">
        <div className="distri-avatar distri-avatar-assistant">
          {avatar || <Bot className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            {name}
            {isStreaming && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150"></div>
              </div>
            )}
          </div>

          <div className="prose prose-sm max-w-none text-foreground">
            <MessageRenderer
              content={content}
              message={message}
              className="text-foreground"
            />
          </div>

          {/* Tool Calls Section */}
          {toolCalls.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="text-sm font-medium text-foreground">Tool Calls</div>
              {toolCalls.map((toolCall, index) => {
                const isExpanded = expandedTools.has(toolCall.toolCall.tool_call_id);
                const hasResult = toolCall.result !== undefined;
                const hasError = toolCall.error !== undefined;
                const canCollapse = hasResult || hasError || toolCall.status === 'completed' || toolCall.status === 'error';

                return (
                  <div key={index} className="border rounded-lg bg-background overflow-hidden">
                    {/* Tool Call Header */}
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleToolExpansion(toolCall.toolCall.tool_call_id)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            disabled={!canCollapse}
                          >
                            {canCollapse ? (
                              isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              )
                            ) : (
                              <div className="h-3 w-3" />
                            )}
                          </button>
                          <Wrench className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-foreground">
                            {toolCall.toolCall.tool_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {toolCall.status === 'pending' && (
                            <div className="flex items-center gap-1 text-xs text-yellow-600">
                              <Clock className="h-3 w-3" />
                              Pending
                            </div>
                          )}
                          {toolCall.status === 'running' && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Running
                            </div>
                          )}
                          {toolCall.status === 'completed' && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Completed
                            </div>
                          )}
                          {toolCall.status === 'error' && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <XCircle className="h-3 w-3" />
                              Failed
                            </div>
                          )}
                          {toolCall.status === 'user_action_required' && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <Wrench className="h-3 w-3" />
                              User Action Required
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Always show input */}
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">Input:</div>
                        <div className="text-xs font-mono bg-muted p-2 rounded border">
                          {JSON.stringify(toolCall.toolCall.input, null, 2)}
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Result Section */}
                    {canCollapse && isExpanded && (
                      <div className="p-3 bg-muted/30">
                        {hasError && (
                          <div className="mb-3">
                            <div className="text-xs text-red-600 font-medium mb-1">Error:</div>
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                              {toolCall.error}
                            </div>
                          </div>
                        )}

                        {hasResult && (
                          <div>
                            <div className="text-xs text-muted-foreground font-medium mb-1">Result:</div>
                            <div className="text-xs font-mono bg-background p-2 rounded border">
                              {JSON.stringify(toolCall.result, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {timestamp && (
            <div className="text-xs text-muted-foreground mt-2">
              {timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </MessageContainer>
  );
};

// Plan Message Component
export const PlanMessage: React.FC<PlanMessageProps> = ({
  message,
  plan,
  timestamp,
  className = '',
  avatar
}) => {
  return (
    <MessageContainer align="center" className={className} backgroundColor="#40414f">
      <div className="flex items-start gap-4 py-3 px-2">
        <div className="distri-avatar distri-avatar-plan">
          {avatar || <Brain className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground mb-2">Plan</div>
          <div className="prose prose-sm max-w-none text-foreground">
            <MessageRenderer
              content={plan}
              message={message}
              className="text-foreground"
            />
          </div>
          {timestamp && (
            <div className="text-xs text-muted-foreground mt-2">
              {timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </MessageContainer>
  );
};

export const DebugMessage: React.FC<DebugMessageProps> = ({
  message,
  className = '',
  timestamp
}) => {
  return (
    <MessageContainer align="center" className={className} backgroundColor="#343541">
      <div className="flex items-start gap-4 py-3 px-2">
        <div className="prose prose-sm max-w-none text-foreground">
          <MessageRenderer
            content={JSON.stringify(message)}
            className="text-foreground"
          />
        </div>
        {timestamp && (
          <div className="text-xs text-muted-foreground mt-2">
            {timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
    </MessageContainer>
  );
};
// System Message Component
export const SystemMessage: React.FC<SystemMessageProps> = ({
  content,
  timestamp,
  className = '',
  avatar
}) => {
  return (
    <MessageContainer align="center" className={className} backgroundColor="#343541">
      <div className="flex items-start gap-4 py-3 px-2">
        <div className="distri-avatar distri-avatar-system">
          {avatar || <Settings className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground mb-2">System</div>
          <div className="prose prose-sm max-w-none text-foreground">
            <MessageRenderer
              content={content}
              className="text-foreground"
            />
          </div>
          {timestamp && (
            <div className="text-xs text-muted-foreground mt-2">
              {timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </MessageContainer>
  );
};

export const ToolMessage: React.FC<ToolMessageProps> = ({ message, className = '' }) => {
  return (
    <div className={`flex items-start space-x-3 p-4 ${className}`}>
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
          <Wrench className="w-4 h-4 text-orange-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-medium text-orange-700">Tool Response</span>
        </div>
        <MessageRenderer message={message} />
      </div>
    </div>
  );
};