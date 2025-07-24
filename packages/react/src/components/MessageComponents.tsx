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
  backgroundColor?: string;
}> = ({ children, align, className = '', backgroundColor }) => {
  const justifyClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';
  
  const bgStyle = backgroundColor ? { backgroundColor } : {};

  return (
    <div className={`flex ${justifyClass} w-full ${className}`} style={bgStyle}>
      <div className="w-full max-w-4xl mx-auto px-6">
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
    <MessageContainer align="center" className={className} backgroundColor="#444654">
      <div className="flex items-start gap-4 py-6 px-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-600">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            Thought{duration ? ` for ${duration}s` : ''}
          </div>
          <div className="prose prose-sm max-w-none text-white">
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

// User Message Component - ChatGPT style
export const UserMessage: React.FC<UserMessageProps> = ({
  content,
  timestamp,
  className = '',
  avatar
}) => {
  return (
    <MessageContainer align="center" className={className} backgroundColor="#343541">
      <div className="flex items-start gap-4 py-6 px-4">
        <div className="distri-avatar distri-avatar-user">
          {avatar || <User className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white mb-2">You</div>
          <div className="prose prose-sm max-w-none text-white">
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

// Assistant Message Component - ChatGPT style
export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  timestamp,
  isStreaming = false,
  metadata: _metadata,
  className = '',
  avatar
}) => {
  return (
    <MessageContainer align="center" className={className} backgroundColor="#444654">
      <div className="flex items-start gap-4 py-6 px-4">
        <div className="distri-avatar distri-avatar-assistant">
          {avatar || <Bot className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            ChatGPT
            {isStreaming && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150"></div>
              </div>
            )}
          </div>
          <div className="prose prose-sm max-w-none text-white">
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

// Tool Call Component - ChatGPT style
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
        return <Settings className="h-4 w-4 text-blue-400 distri-animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'border-gray-600 bg-gray-800/50';
      case 'running':
        return 'border-blue-500 bg-blue-900/20';
      case 'completed':
        return 'border-green-500/50 bg-green-900/20';
      case 'error':
        return 'border-red-500/50 bg-red-900/20';
      default:
        return 'border-gray-600 bg-gray-800/50';
    }
  };

  const toolName = 'tool_name' in toolCall ? toolCall.tool_name : (toolCall as any).tool_name;
  const toolId = 'tool_call_id' in toolCall ? toolCall.tool_call_id : (toolCall as any).tool_call_id;
  const input = 'input' in toolCall ? toolCall.input : (toolCall as any).args;

  // Always show the expand/collapse button if there's any content
  const shouldShowExpand = input || result || error;

  return (
    <div className={`distri-tool ${getStatusColor()}`}>
      <div
        className="distri-tool-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 w-full">
          {getStatusIcon()}
          <span className="font-medium text-sm text-white flex-1">{toolName}</span>
          <span className="text-xs text-gray-400 font-mono">{toolId}</span>
          {shouldShowExpand && (
            <button className="text-gray-400 hover:text-white transition-colors ml-2">
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
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 border-t border-gray-600/50">
          {input && (
            <div>
              <div className="text-xs font-medium text-gray-300 mb-2">Input:</div>
              <div className="distri-tool-content">
                {typeof input === 'string' ? input : JSON.stringify(input, null, 2)}
              </div>
            </div>
          )}

          {result && (
            <div>
              <div className="text-xs font-medium text-gray-300 mb-2">Output:</div>
              <div className="distri-tool-content">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </div>
            </div>
          )}

          {error && (
            <div>
              <div className="text-xs font-medium text-red-300 mb-2">Error:</div>
              <div className="text-sm bg-red-900/20 border border-red-500/50 rounded p-3 text-red-200">
                {error}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Assistant Message With Tool Calls - ChatGPT style
export const AssistantWithToolCalls: React.FC<AssistantWithToolCallsProps> = ({
  content,
  toolCalls,
  timestamp,
  isStreaming = false,
  metadata: _metadata,
  className = '',
  avatar
}) => {
  return (
    <MessageContainer align="center" className={className} backgroundColor="#444654">
      <div className="flex items-start gap-4 py-6 px-4">
        <div className="distri-avatar distri-avatar-assistant">
          {avatar || <Bot className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            ChatGPT
            {isStreaming && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150"></div>
              </div>
            )}
          </div>

          {content && (
            <div className="prose prose-sm max-w-none mb-4 text-white">
              <MessageRenderer
                content={content}
                className="text-white"
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