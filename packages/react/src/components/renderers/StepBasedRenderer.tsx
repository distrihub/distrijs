import React from 'react';
import { DistriMessage, isDistriMessage } from '@distri/core';
import { useChatStateStore, StepState } from '../../stores/chatStateStore';
import { AssistantMessageRenderer } from './AssistantMessageRenderer';
import { UserMessageRenderer } from './UserMessageRenderer';
import { LoadingShimmer } from './ThinkingRenderer';
import { MessageFeedback } from './MessageFeedback';
import { useRendererContext } from './RendererContext';
import { extractContent } from './utils';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export interface StepBasedRendererProps {
  message: DistriMessage;
  /** Thread ID for feedback functionality */
  threadId?: string;
  /** Enable message feedback (voting) UI */
  enableFeedback?: boolean;
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
  message,
  threadId,
  enableFeedback = true,
}) => {
  const steps = useChatStateStore(state => state.steps);
  const { onShowTrace } = useRendererContext();

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
    const isComplete = step?.status !== 'running';
    const showControls = threadId && distriMessage.id && isComplete && (enableFeedback || !!onShowTrace);

    // Skip silent assistant messages — workers (sub-agents) often
    // emit `text_message_start → text_message_end` with no content
    // when they go straight to a tool call. Rendering the agent
    // badge with an empty body produced a stray-space line in the
    // CLI; in the web UI the row showed up as ~100px of blank
    // space between consecutive tool calls (agent badge + empty
    // body + step loader, all empty, but the wrapper still took
    // vertical space).
    //
    // Drop the `isComplete` precondition: even while a step is
    // still 'running', if the assistant message has no text and
    // no image content, there's nothing to render for the user —
    // tool calls and step indicators surface through their own
    // events. Hiding the row is strictly better than showing an
    // empty agent-name chip with a shimmer.
    const content = extractContent(distriMessage);
    const isEmpty = !content.text && content.imageParts.length === 0;
    if (isEmpty) {
      return null;
    }

    return (
      <div className="flex items-start gap-4 group">
        <div className="w-full">
          {/* Agent badge - shown when agent_id or agent_name is present */}
          {(distriMessage.agent_id || distriMessage.agent_name) && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {distriMessage.agent_name || distriMessage.agent_id}
              </span>
            </div>
          )}

          {/* Step indicator */}
          {step && <StepIndicator step={step} />}

          {/* Message content with smooth streaming */}
          <div className="transition-all duration-200 ease-in-out">
            <AssistantMessageRenderer message={distriMessage} />
          </div>

          {/* Message controls: feedback + traces, each independently gated */}
          {showControls && (
            <div className="mt-3 pt-2 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <MessageFeedback
                threadId={threadId!}
                messageId={distriMessage.id}
                compact
                enableFeedback={enableFeedback}
                onShowTrace={onShowTrace}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};