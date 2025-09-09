import React from 'react';
import { DistriArtifact, DistriMessage } from '@distri/core';
import { extractContent } from './utils';
import { StreamingTextRenderer } from './StreamingTextRenderer';
import TextRenderer from './TextRenderer';
import { ImageRenderer } from './ImageRenderer';
import { useChatStateStore } from '../../stores/chatStateStore';


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
  const steps = useChatStateStore(state => state.steps);
  const content = extractContent(message);

  // Check if this message is currently streaming
  const stepId = (message as DistriMessage).step_id;
  const step = stepId ? steps.get(stepId) : null;
  const isStreaming = step?.status === 'running';

  return (
    <div className={`${className} w-full`}>
      {/* Text content */}
      {content.text && (
        isStreaming ? (
          <StreamingTextRenderer
            text={content.text}
            isStreaming={isStreaming}
          />
        ) : (
          <TextRenderer content={content} />
        )
      )}

      {/* Image content */}
      {content.imageParts && content.imageParts.length > 0 && (
        <ImageRenderer imageParts={content.imageParts} />
      )}
    </div>

  );
}; 