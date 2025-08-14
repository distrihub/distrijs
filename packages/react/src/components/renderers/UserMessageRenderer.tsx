import React from 'react';
import { User } from 'lucide-react';
import { DistriMessage } from '@distri/core';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { extractContent, renderTextContent } from './utils';
import { ImageRenderer } from './ImageRenderer';

export interface UserMessageRendererProps {
  message: DistriMessage;
  className?: string;
  avatar?: React.ReactNode;
}

export const UserMessageRenderer: React.FC<UserMessageRendererProps> = ({
  message,
  className = '',
  avatar
}) => {
  const content = extractContent(message);

  return (
    <div className={`flex items-start gap-4 py-6 ${className}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-secondary text-secondary-foreground">
          {avatar || <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="w-full">
        {/* Text content */}
        {content.text && (
          <div className="prose prose-sm max-w-none text-foreground">
            {renderTextContent(content)}
          </div>
        )}
        
        {/* Image content */}
        {content.imageParts && content.imageParts.length > 0 && (
          <ImageRenderer imageParts={content.imageParts} />
        )}
      </div>
    </div>
  );
}; 