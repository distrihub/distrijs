import React from 'react';
import { DistriMessage, isDistriMessage } from '@distri/core';
import { useChatStateStore, StepState } from '../../stores/chatStateStore';
import { AssistantMessageRenderer } from './AssistantMessageRenderer';
import { UserMessageRenderer } from './UserMessageRenderer';
import { LoadingShimmer } from './ThinkingRenderer';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export interface StepBasedRendererProps {
  message: DistriMessage;
}

const StepIndicator: React.FC<{ step: StepState }> = ({ step }) => {
  const getStatusIcon = () => {
    switch (step.status) {
      case 'running':
        return (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
        );
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (step.status) {
      case 'running':
        return step.title || 'AI is writing...';
      case 'completed':
        return null; // Don't show completed text, just the checkmark
      case 'failed':
        return 'Error occurred';
      default:
        return 'Pending';
    }
  };

  const renderShimmerForRunning = () => {
    if (step.status !== 'running') return null;
    const text = step.title || 'AI is writing...';
    return <LoadingShimmer text={text} className="text-sm" />;
  };

  const getDuration = () => {
    if (step.startTime) {
      const endTime = step.endTime || Date.now();
      const duration = (endTime - step.startTime) / 1000;
      return duration < 1 ? '< 1s' : `${duration.toFixed(1)}s`;
    }
    return '';
  };

  // For completed steps, show minimal indicator
  if (step.status === 'completed') {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 opacity-60">
        {getStatusIcon()}
        <span className="font-medium">{step.title}</span>
        <span>({getDuration()})</span>
      </div>
    );
  }

  // For running/failed steps, show full indicator
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
      {getStatusIcon()}
      {step.status === 'running' ? (
        renderShimmerForRunning()
      ) : (
        <span className="font-medium">{getStatusText()}</span>
      )}
    </div>
  );
};

export const StepBasedRenderer: React.FC<StepBasedRendererProps> = ({
  message
}) => {
  const steps = useChatStateStore(state => state.steps);

  if (!isDistriMessage(message)) {
    return null;
  }

  const distriMessage = message as DistriMessage;
  const stepId = distriMessage.step_id;
  const step = stepId ? steps.get(stepId) : null;

  // For user messages, render normally without step indicators
  if (distriMessage.role === 'user') {
    return <UserMessageRenderer message={distriMessage} />;
  }

  // For assistant messages, show step-based rendering
  if (distriMessage.role === 'assistant') {
    return (
      <div className="flex items-start gap-4">
        <div className="w-full">
          {/* Step indicator */}
          {step && <StepIndicator step={step} />}

          {/* Message content with smooth streaming */}
          <div className="transition-all duration-200 ease-in-out">
            <AssistantMessageRenderer message={distriMessage} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};