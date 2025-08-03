import React from 'react';
import { DistriArtifact, DistriMessage } from '@distri/core';
import { extractContent, renderTextContent } from './utils';


export interface AssistantMessageRendererProps {
  message: DistriMessage | DistriArtifact;
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
}

export const AssistantMessageRenderer: React.FC<AssistantMessageRendererProps> = ({
  message,
  className = '',
}) => {
  const content = extractContent(message);
  return (
    <div className={`flex items-start gap-4 py-6 ${className}`}>
      <div className="w-full">

        <div className="prose prose-sm max-w-none text-foreground">
          {renderTextContent(content)}
        </div>
      </div>
    </div>
  );
}; 