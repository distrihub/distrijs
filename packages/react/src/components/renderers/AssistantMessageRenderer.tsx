import React from 'react';
import { DistriArtifact, DistriMessage } from '@distri/core';
import { extractContent } from './utils';
import { StreamingTextRenderer } from './StreamingTextRenderer';
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
    <div className={`flex items-start gap-4 ${className}`}>
      <div className="w-full">
        <StreamingTextRenderer
          text={content.text}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}; 