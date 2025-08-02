import React from 'react';
import { Bot } from 'lucide-react';
import { DistriMessage } from '@distri/core';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { extractContent, renderTextContent } from './utils';

export interface AssistantMessageRendererProps {
  message: DistriMessage;
  chatState: any;
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
}

export const AssistantMessageRenderer: React.FC<AssistantMessageRendererProps> = ({
  message,
  chatState,
  className = '',
  avatar,
  name = "Assistant"
}) => {
  const content = extractContent(message);
  const isStreaming = chatState?.isStreaming || false;

  return (
    <div className={`flex items-start gap-4 py-3 px-2 ${className}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-blue-100 text-blue-600">
          {avatar || <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
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
          {renderTextContent(content)}
        </div>
      </div>
    </div>
  );
}; 