import React from 'react';
import { Wrench } from 'lucide-react';
import { DistriMessage } from '@distri/core';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { extractContent, renderTextContent } from './utils';

export interface ToolMessageRendererProps {
  message: DistriMessage;
  className?: string;
  avatar?: React.ReactNode;
}

export const ToolMessageRenderer: React.FC<ToolMessageRendererProps> = ({
  message,
  className = '',
  avatar
}) => {
  const content = extractContent(message);

  return (
    <div className={`flex items-start gap-4 py-6 ${className}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-accent text-accent-foreground">
          {avatar || <Wrench className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 max-w-3xl">
        <div className="text-sm font-medium text-foreground mb-3">Tool Response</div>
        <div className="prose prose-sm max-w-none text-foreground">
          {renderTextContent(content)}
        </div>
      </div>
    </div>
  );
}; 