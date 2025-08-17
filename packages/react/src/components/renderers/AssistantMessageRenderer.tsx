import React from 'react';
import { DistriArtifact, DistriMessage } from '@distri/core';
import { extractContent } from './utils';
import { StreamingTextRenderer } from './StreamingTextRenderer';
import { ImageRenderer } from './ImageRenderer';
import { useChatStateStore } from '../../stores/chatStateStore';


export interface AssistantMessageRendererProps {
  message: DistriMessage | DistriArtifact;
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
}

const AssistantMessageRendererBase: React.FC<AssistantMessageRendererProps> = ({
  message,
  className = '',
}) => {
  const steps = useChatStateStore(state => state.steps);
  const content = extractContent(message);
  
  // Check if this message is currently streaming
  const stepId = (message as DistriMessage).step_id;
  const step = stepId ? steps.get(stepId) : null;
  const isStreaming = step?.status === 'running';

  return (
    <div className={`flex items-start gap-4 ${className}`}>
      <div className="w-full">
        {/* Text content */}
        {content.text && (
          <StreamingTextRenderer
            text={content.text}
            isStreaming={isStreaming}
          />
        )}
        
        {/* Image content */}
        {content.imageParts && content.imageParts.length > 0 && (
          <ImageRenderer imageParts={content.imageParts} />
        )}
      </div>
    </div>
  );
};

export const AssistantMessageRenderer = React.memo(AssistantMessageRendererBase, (prev, next) => {
  const prevMsg = prev.message as any;
  const nextMsg = next.message as any;
  const prevText = (prevMsg?.parts || [])
    .filter((p: any) => p?.type === 'text')
    .map((p: any) => p.data || '')
    .join('');
  const nextText = (nextMsg?.parts || [])
    .filter((p: any) => p?.type === 'text')
    .map((p: any) => p.data || '')
    .join('');

  if (prevText !== nextText) return false;
  if (prev.className !== next.className) return false;
  return true;
}); 