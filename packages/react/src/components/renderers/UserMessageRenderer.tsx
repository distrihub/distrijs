import React from 'react';
import { User } from 'lucide-react';
import { DistriMessage } from '@distri/core';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { extractContent, renderTextContent } from './utils';

export interface UserMessageRendererProps {
  message: DistriMessage;
  chatState: any;
  className?: string;
  avatar?: React.ReactNode;
}

export const UserMessageRenderer: React.FC<UserMessageRendererProps> = ({
  message,
  chatState: _chatState,
  className = '',
  avatar
}) => {
  const content = extractContent(message);

  return (
    <div className={`flex items-start gap-4 py-3 px-2 ${className}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-secondary text-secondary-foreground">
          {avatar || <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground mb-2">You</div>
        <div className="prose prose-sm max-w-none text-foreground">
          {renderTextContent(content)}
        </div>
      </div>
    </div>
  );
}; 