import React from 'react';
import { User, Bot, Settings, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useChatConfig, getThemeClasses } from './ChatContext';
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

// Base Message Container
export const MessageContainer: React.FC<{
  children: React.ReactNode;
  align: 'left' | 'right' | 'center';
  className?: string;
}> = ({ children, align, className = '' }) => {
  const justifyClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';
  
  return (
    <div className={`flex ${justifyClass} w-full ${className}`}>
      <div className="w-full max-w-4xl mx-auto px-4">
        {children}
      </div>
    </div>
  );
};

// User Message Component
export const UserMessage: React.FC<UserMessageProps> = ({ 
  content, 
  timestamp, 
  className = '',
  avatar
}) => {
  const { config } = useChatConfig();
  const theme = getThemeClasses(config.theme);

  return (
    <MessageContainer align="center" className={className}>
      <div className="flex items-start gap-4 py-6">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme.avatar.user}`}>
          {avatar || <User className="h-4 w-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 mb-1">You</div>
          <div className="prose prose-sm max-w-none">
            <MessageRenderer 
              content={content} 
              className="text-gray-900"
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
  const { config } = useChatConfig();
  const theme = getThemeClasses(config.theme);

  return (
    <MessageContainer align="center" className={`${theme.surface} ${className}`}>
      <div className="flex items-start gap-4 py-6">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme.avatar.assistant}`}>
          {avatar || <Bot className="h-4 w-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-2">
            Assistant
            {isStreaming && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150"></div>
              </div>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            <MessageRenderer 
              content={content} 
              className="text-gray-900"
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
  const { config } = useChatConfig();
  const theme = getThemeClasses(config.theme);

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
        return 'border-gray-200 bg-gray-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const toolName = 'tool_name' in toolCall ? toolCall.tool_name : (toolCall as any).tool_name;
  const toolId = 'tool_call_id' in toolCall ? toolCall.tool_call_id : (toolCall as any).tool_call_id;
  const input = 'input' in toolCall ? toolCall.input : (toolCall as any).args;

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center gap-2 mb-2">
        {getStatusIcon()}
        <span className="font-medium text-sm">{toolName}</span>
        <span className="text-xs text-gray-500 font-mono">{toolId}</span>
      </div>
      
      {input && (
        <div className="mb-2">
          <div className="text-xs font-medium text-gray-600 mb-1">Input:</div>
          <div className="text-sm bg-white rounded border p-2 font-mono text-gray-800">
            {typeof input === 'string' ? input : JSON.stringify(input, null, 2)}
          </div>
        </div>
      )}

      {result && (
        <div className="mb-2">
          <div className="text-xs font-medium text-gray-600 mb-1">Result:</div>
          <div className="text-sm bg-white rounded border p-2 font-mono text-gray-800">
            {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-2">
          <div className="text-xs font-medium text-red-600 mb-1">Error:</div>
          <div className="text-sm bg-red-50 rounded border border-red-200 p-2 text-red-800">
            {error}
          </div>
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
  const { config } = useChatConfig();
  const theme = getThemeClasses(config.theme);

  return (
    <MessageContainer align="center" className={`${theme.surface} ${className}`}>
      <div className="flex items-start gap-4 py-6">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme.avatar.assistant}`}>
          {avatar || <Bot className="h-4 w-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-2">
            Assistant
            {isStreaming && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150"></div>
              </div>
            )}
          </div>
          
          {content && (
            <div className="prose prose-sm max-w-none mb-4">
              <MessageRenderer 
                content={content} 
                className="text-gray-900"
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