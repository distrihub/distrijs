import React from 'react';
import { User, Bot, Settings, Clock, CheckCircle, XCircle, Brain } from 'lucide-react';
import { ToolCallState, ToolCall } from '@distri/core';
import MessageRenderer from './MessageRenderer';

export interface BaseMessageProps {
  content?: string;
  timestamp?: Date;
  className?: string;
  avatar?: React.ReactNode;
}

export interface UserMessageProps extends BaseMessageProps {
  content: string;
}

export interface AssistantMessageProps extends BaseMessageProps {
  content: string;
  isStreaming?: boolean;
  metadata?: any;
}

export interface ToolCallProps {
  toolCall: ToolCall | ToolCallState;
  status?: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  error?: string;
}

export interface AssistantWithToolCallsProps extends AssistantMessageProps {
  toolCalls: ToolCallProps[];
}

export interface PlanMessageProps extends BaseMessageProps {
  content: string;
  duration?: number;
  timestamp?: Date;
}

// Base Message Container
export const MessageContainer: React.FC<{
  children: React.ReactNode;
  align: 'left' | 'right' | 'center';
  className?: string;
}> = ({ children, align, className = '' }) => {
  const justifyClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <div className={`flex ${justifyClass} w-full ${className} mb-4`}>
      <div className="w-full max-w-4xl mx-auto px-4">
        {children}
      </div>
    </div>
  );
};

// Plan Message Component
export const PlanMessage: React.FC<PlanMessageProps> = ({
  content,
  duration,
  timestamp,
  className = ''
}) => {
  return (
    <MessageContainer align="center" className={`bg-gray-800 ${className}`}>
      <div className="flex items-start gap-4 py-6">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-600">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white mb-1 flex items-center gap-2">
            Thought{duration ? ` for ${duration}s` : ''}
          </div>
          <div className="prose prose-sm max-w-none prose-invert">
            <MessageRenderer
              content={content}
              className="text-white"
            />
          </div>
          {timestamp && (
            <div className="text-xs text-gray-400 mt-2">
              {timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </MessageContainer>
  );
};

// User Message Component
export const UserMessage: React.FC<UserMessageProps> = ({
  content,
  timestamp,
  className = '',
  avatar
}) => {
  return (
    <MessageContainer align="center" className={className}>
      <div className="flex items-start gap-4 py-6">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-600">
          {avatar || <User className="h-4 w-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white mb-1">You</div>
          <div className="prose prose-sm max-w-none prose-invert">
            <MessageRenderer
              content={content}
              className="text-white"
            />
          </div>
          {timestamp && (
            <div className="text-xs text-gray-400 mt-2">
              {timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </MessageContainer>
  );
};

// Assistant Message Component
export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  timestamp,
  isStreaming = false,
  metadata,
  className = '',
  avatar
}) => {
  return (
    <MessageContainer align="center" className={`bg-gray-800 ${className}`}>
      <div className="flex items-start gap-4 py-6">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-600">
          {avatar || <Bot className="h-4 w-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white mb-1 flex items-center gap-2">
            Assistant
            {isStreaming && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150"></div>
              </div>
            )}
          </div>
          <div className="prose prose-sm max-w-none prose-invert">
            <MessageRenderer
              content={content}
              className="text-white"
              metadata={metadata}
            />
          </div>
          {timestamp && (
            <div className="text-xs text-gray-400 mt-2">
              {timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </MessageContainer>
  );
};

// Tool Call Component
export const Tool: React.FC<ToolCallProps> = ({
  toolCall,
  status = 'pending',
  result,
  error
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'running':
        return <Settings className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'border-gray-600 bg-gray-800';
      case 'running':
        return 'border-blue-600 bg-blue-900';
      case 'completed':
        return 'border-green-600 bg-green-900';
      case 'error':
        return 'border-red-600 bg-red-900';
      default:
        return 'border-gray-600 bg-gray-800';
    }
  };

  const toolName = 'tool_name' in toolCall ? toolCall.tool_name : (toolCall as any).tool_name;
  const toolId = 'tool_call_id' in toolCall ? toolCall.tool_call_id : (toolCall as any).tool_call_id;
  const input = 'input' in toolCall ? toolCall.input : (toolCall as any).args;

  // Always show the expand/collapse button if there's any content
  const shouldShowExpand = input || result || error;

  return (
    <div className={`border rounded-lg ${getStatusColor()}`}>
      <div
        className="flex items-center gap-2 p-4 cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {getStatusIcon()}
        <span className="font-medium text-sm text-white flex-1">{toolName}</span>
        <span className="text-xs text-gray-400 font-mono">{toolId}</span>
        {shouldShowExpand && (
          <button className="text-gray-400 hover:text-white transition-colors">
            {isExpanded ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {input && (
            <div>
              <div className="text-xs font-medium text-gray-300 mb-1">Input:</div>
              <div className="text-sm bg-gray-700 rounded border border-gray-600 p-2 font-mono text-white">
                {typeof input === 'string' ? input : JSON.stringify(input, null, 2)}
              </div>
            </div>
          )}

          {result && (
            <div>
              <div className="text-xs font-medium text-gray-300 mb-1">Result:</div>
              <div className="text-sm bg-gray-700 rounded border border-gray-600 p-2 font-mono text-white">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </div>
            </div>
          )}

          {error && (
            <div>
              <div className="text-xs font-medium text-red-400 mb-1">Error:</div>
              <div className="text-sm bg-red-900 rounded border border-red-700 p-2 text-red-200">
                {error}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Assistant with Tool Calls Component
export const AssistantWithToolCalls: React.FC<AssistantWithToolCallsProps> = ({
  content,
  toolCalls,
  timestamp,
  isStreaming = false,
  metadata,
  className = '',
  avatar
}) => {
  return (
    <MessageContainer align="center" className={`bg-gray-800 ${className}`}>
      <div className="flex items-start gap-4 py-6">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-600">
          {avatar || <Bot className="h-4 w-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white mb-1 flex items-center gap-2">
            Assistant
            {isStreaming && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150"></div>
              </div>
            )}
          </div>

          {content && (
            <div className="prose prose-sm max-w-none mb-4 prose-invert">
              <MessageRenderer
                content={content}
                className="text-white"
                metadata={metadata}
              />
            </div>
          )}

          {toolCalls.length > 0 && (
            <div className="space-y-3">
              {toolCalls.map((toolCallProps, index) => (
                <Tool key={index} {...toolCallProps} />
              ))}
            </div>
          )}

          {timestamp && (
            <div className="text-xs text-gray-400 mt-2">
              {timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </MessageContainer>
  );
};