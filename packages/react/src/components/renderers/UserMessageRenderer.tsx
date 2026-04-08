import React from 'react';
import { DistriMessage } from '@distri/core';
import { extractContent } from './utils';
import { ImageRenderer } from './ImageRenderer';
import TextRenderer from './TextRenderer';

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
  const developerMode = message.metadata?.developer_mode as { kind?: string; label?: string } | undefined;
  const isDiagnose = developerMode?.kind === 'diagnose';

  return (
    <div className={`py-3 ${className}`}>
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-muted/60 text-foreground rounded-2xl px-4 py-3 border">
          {isDiagnose && (
            <div className="mb-2">
              <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {developerMode?.label || 'Diagnose'}
              </span>
            </div>
          )}
          {/* Text content */}
          {content.text && (
            <TextRenderer content={content} />
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
