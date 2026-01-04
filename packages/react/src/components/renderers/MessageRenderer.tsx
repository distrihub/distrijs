import React from 'react';
import { DistriMessage, DistriEvent, isDistriMessage, isDistriEvent, DistriChatMessage } from '@distri/core';
import { UserMessageRenderer } from './UserMessageRenderer';
import { StepBasedRenderer } from './StepBasedRenderer';
import { ToolExecutionRenderer } from './ToolExecutionRenderer';
import { useChatStateStore } from '@/stores/chatStateStore';
import { ToolRendererMap } from '@/types';
export interface MessageRendererProps {
  message: DistriChatMessage;
  index: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  toolRenderers?: ToolRendererMap;
}

// Wrapper component to ensure full width with max constraint for readability
const RendererWrapper: React.FC<{ children: React.ReactNode; className?: string; isUserMessage?: boolean }> = ({
  children,
  className = '',
  isUserMessage = false
}) => (
  <div className={`w-full px-4 overflow-hidden ${className}`} style={{ maxWidth: '100%', wordBreak: 'break-word' }}>
    <div
      className={`w-full overflow-hidden ${isUserMessage ? 'ml-auto' : 'max-w-4xl mx-auto'}`}
      style={{ maxWidth: isUserMessage ? '100%' : 'min(100%, 56rem)', wordBreak: 'break-word' }}
    >
      {children}
    </div>
  </div>
);

export function MessageRenderer({
  message,
  index,
  toolRenderers,
}: MessageRendererProps): React.ReactNode {
  const toolCallsState = useChatStateStore(state => state.toolCalls);
  // Don't render messages with empty content
  if (isDistriMessage(message)) {
    const distriMessage = message as DistriMessage;
    const textContent = distriMessage.parts
      .filter(part => part.part_type === 'text')
      .map(part => (part as { part_type: 'text'; data: string }).data)
      .join('')
      .trim();

    const imageParts = distriMessage.parts.filter(part => part.part_type === 'image');

    // Only filter out messages that have neither text nor images
    if (!textContent && imageParts.length === 0) {
      return null;
    }
  }

  // Handle DistriMessage types
  if (isDistriMessage(message)) {
    const distriMessage = message as DistriMessage;

    switch (distriMessage.role) {
      case 'user':
        return (
          <RendererWrapper key={`user-${index}`} className="distri-user-message" isUserMessage>
            <UserMessageRenderer
              message={distriMessage}
            />
          </RendererWrapper>
        );

      case 'assistant':
        return (
          <RendererWrapper key={`assistant-${index}`} className="distri-assistant-message">
            <StepBasedRenderer
              message={distriMessage}
            />
          </RendererWrapper>
        );

      default:
        return null;
    }
  }

  // Handle DistriEvent types based on interaction design
  if (isDistriEvent(message)) {
    const event = message as DistriEvent;

    switch (event.type) {
      case 'run_started':
        // Don't render thinking state here - it will be handled at the end of messages
        return null;

      case 'plan_started':
        // Don't render thinking state here - it will be handled at the end of messages
        return null;

      case 'plan_finished':
        return null;

      case 'text_message_start':
        // Don't render thinking state here - it will be handled at the end of messages
        return null;

      case 'text_message_content':
        // This is handled by the assistant message renderer
        return null;

      case 'text_message_end':
        // This is handled by the assistant message renderer
        return null;

      case 'step_started': {
        return null;
      }

      case 'step_completed':
        // Get step from chat state

        return null;

      case 'tool_calls':
        if (toolCallsState.size === 0) {
          return null;
        }
        return (
          <RendererWrapper key={`tool-execution-start-${index}`} className="distri-tool-execution-start">
            <ToolExecutionRenderer
              event={event}
              toolCallStates={toolCallsState}
              toolRenderers={toolRenderers}
            />
          </RendererWrapper>
        );

      case 'tool_results':
        return null;

      case 'agent_handover':
        return (
          <RendererWrapper key={`handover-${index}`} className="distri-handover">
            <div className="p-3 bg-muted rounded border">
              <div className="text-sm text-muted-foreground">
                <strong>Handover to:</strong> {event.data?.to_agent || 'unknown agent'}
              </div>
            </div>
          </RendererWrapper>
        );

      case 'run_finished':
        return null;

      case 'run_error':
        return (
          <RendererWrapper key={`run-error-${index}`} className="distri-run-error">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
              <div className="text-sm text-destructive">
                <strong>Error:</strong> {event.data?.message || 'Unknown error occurred'}
              </div>
              <button className="mt-2 text-xs text-destructive underline">Retry</button>
            </div>
          </RendererWrapper>
        );

      default:
        return null;
    }
  }

  // Fallback - should never reach here
  return null;
}
