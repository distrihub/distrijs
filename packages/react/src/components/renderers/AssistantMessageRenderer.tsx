import React from 'react';
import { DistriMessage } from '@distri/core';
import { extractContent, renderTextContent } from './utils';
import { useChatStateStore } from '../../stores/chatStateStore';

export interface AssistantMessageRendererProps {
  message: DistriMessage;
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
}

export const AssistantMessageRenderer: React.FC<AssistantMessageRendererProps> = ({
  message,
  className = '',
}) => {
  const content = extractContent(message);
  const isStreaming = useChatStateStore(state => state.isStreaming);

  return (
    <div className={`flex items-start gap-4 py-6 ${className}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
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