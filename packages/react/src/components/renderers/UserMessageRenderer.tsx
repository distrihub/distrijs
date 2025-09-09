import React from 'react';
import { DistriMessage } from '@distri/core';
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
}) => {
  const content = extractContent(message);

  return (
    <div className={`py-3 ${className}`}>
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-muted/60 text-foreground rounded-2xl px-4 py-3 border">
          {/* Text content */}
          {content.text && (
            <div className="prose prose-sm max-w-none">
              {renderTextContent(content)}
            </div>
          )}

          {/* Image content */}
          {content.imageParts && content.imageParts.length > 0 && (
            <ImageRenderer imageParts={content.imageParts} />
          )}
        </div>
      </div>
    </div>
  );
}; 