import React from 'react';
import { DistriMessage, DistriEvent, DistriArtifact, isDistriMessage, isDistriEvent, isDistriArtifact, ToolResults, DistriChatMessage, ToolResult } from '@distri/core';
import { UserMessageRenderer } from './UserMessageRenderer';
import { AssistantMessageRenderer } from './AssistantMessageRenderer';
import { ToolMessageRenderer } from './ToolMessageRenderer';
import { PlanRenderer } from './PlanRenderer';
import { StepRenderer } from './StepRenderer';
import { ToolCallRenderer } from './ToolCallRenderer';
import { ToolResultRenderer } from './ToolResultRenderer';
import { DebugRenderer } from './DebugRenderer';
import { StepBasedRenderer } from './StepBasedRenderer';
import { useChatStateStore } from '../../stores/chatStateStore';

export interface MessageRendererProps {
  message: DistriChatMessage;
  index: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

// Wrapper component to ensure consistent width and centering
const RendererWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`max-w-3xl mx-auto w-full ${className}`}>
    {children}
  </div>
);

export function MessageRenderer({
  message,
  index,
  isExpanded = false,
  onToggle = () => { }
}: MessageRendererProps): React.ReactNode {
  const steps = useChatStateStore(state => state.steps);
  const toolCalls = useChatStateStore(state => state.toolCalls);

  // Don't render messages with empty content
  if (isDistriMessage(message)) {
    const distriMessage = message as DistriMessage;
    const textContent = distriMessage.parts
      .filter(part => part.type === 'text')
      .map(part => (part as { type: 'text'; data: string }).data)
      .join('')
      .trim();

    const imageParts = distriMessage.parts.filter(part => part.type === 'image');

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
          <RendererWrapper key={`user-${index}`}>
            <UserMessageRenderer
              message={distriMessage}
            />
          </RendererWrapper>
        );

      case 'assistant':
        return (
          <RendererWrapper key={`assistant-${index}`}>
            <StepBasedRenderer
              message={distriMessage}
            />
          </RendererWrapper>
        );

      case 'tool':
        return (
          <RendererWrapper key={`tool-${index}`}>
            <ToolMessageRenderer
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

      case 'plan_pruned':
        return (
          <RendererWrapper key={`plan-pruned-${index}`} className="py-6">
            <div className="p-3 bg-muted rounded border">
              <div className="text-sm text-muted-foreground">
                Removed steps: {event.data?.removed_steps || '0'}
              </div>
            </div>
          </RendererWrapper>
        );

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
        // Get step from chat state
        const stepId = event.data.step_id;
        const step = steps.get(stepId);
        if (step) {
          return (
            <RendererWrapper key={`step-${stepId}`}>
              <StepRenderer
                step={step}
              />
            </RendererWrapper>
          );
        }
        return null;
      }

      case 'step_completed':
        // Get step from chat state

        return null;

      case 'tool_call_start': {
        const toolCallStartId = event.data.tool_call_id;
        const toolCallStartState = toolCalls.get(toolCallStartId);
        if (toolCallStartState?.status === 'running') {
          return (
            <RendererWrapper key={`tool-call-start-${index}`} className="py-6">
              <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">
                  Calling tool: {event.data?.tool_call_name || 'unknown'} ⏳
                </span>
              </div>
            </RendererWrapper>
          );
        }
        return null;
      }

      case 'tool_call_end':
        return null;

      case 'tool_call_result':
        return (
          <RendererWrapper key={`tool-call-result-${index}`} className="py-6">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded">
              <div className="text-sm text-primary">
                <strong>Tool result:</strong>
                <pre className="mt-1 text-xs overflow-x-auto">
                  {event.data?.result || 'No result'}
                </pre>
              </div>
            </div>
          </RendererWrapper>
        );

      case 'tool_rejected':
        return (
          <RendererWrapper key={`tool-rejected-${index}`} className="py-6">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
              <div className="text-sm text-destructive">
                <strong>Tool rejected:</strong> {event.data?.reason || 'Unknown reason'}
              </div>
            </div>
          </RendererWrapper>
        );

      case 'agent_handover':
        return (
          <RendererWrapper key={`handover-${index}`} className="py-6">
            <div className="p-3 bg-muted rounded border">
              <div className="text-sm text-muted-foreground">
                <strong>Handover to:</strong> {event.data?.to_agent || 'unknown agent'}
              </div>
            </div>
          </RendererWrapper>
        );

      case 'feedback_received':
        return (
          <RendererWrapper key={`feedback-${index}`} className="py-6">
            <div className="p-3 bg-muted rounded border">
              <div className="text-sm text-muted-foreground">
                You said: {event.data?.feedback || ''}
              </div>
            </div>
          </RendererWrapper>
        );

      case 'run_finished':
        return null;

      case 'run_error':
        return (
          <RendererWrapper key={`run-error-${index}`} className="py-6">
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

  // Handle DistriArtifact types
  if (isDistriArtifact(message)) {
    const artifact = message as DistriArtifact;

    switch (artifact.type) {
      case 'plan':
        return (
          <RendererWrapper key={`plan-${index}`}>
            <PlanRenderer
              message={artifact}
            />
          </RendererWrapper>
        );

      case 'llm_response':
        // Handle tool calls from LLM response
        if (artifact.content && artifact.content.length > 0) {
          return (
            <RendererWrapper key={`assistant-${index}`}>
              <AssistantMessageRenderer
                message={artifact}
              />
            </RendererWrapper>
          );
        }
        if (artifact.tool_calls && Array.isArray(artifact.tool_calls)) {
          return artifact.tool_calls.map((toolCall, toolIndex) => {
            // Get tool call state from chat state
            const toolCallState = toolCalls.get(toolCall.tool_call_id);
            if (!toolCallState) return null;

            const toolCallStartState = toolCalls.get(toolCall.tool_call_id);
            if (toolCallStartState?.component) {
              return toolCallStartState.component;
            }
            else if (toolCallStartState?.status === 'pending') {

              return (
                <RendererWrapper key={`tool-call-${index}-${toolIndex}`}>
                  <ToolCallRenderer
                    toolCall={toolCallState}
                    isExpanded={isExpanded}
                    onToggle={onToggle}
                  />
                </RendererWrapper>
              );
            }
            return null;
          }).filter(Boolean);
        }
        return null;

      case 'tool_results':
        // Handle tool results
        if (artifact.results && Array.isArray(artifact.results)) {
          const toolResultsArtifact = artifact as ToolResults;
          return artifact.results.map((result, resultIndex) => {
            const success =
              (result as ToolResult).success !== undefined
                ? (result as ToolResult).success
                : toolResultsArtifact.success ?? ((result as { status?: string }).status ? (result as { status?: string }).status === 'completed' : true);
            const error =
              (result as ToolResult).error !== undefined
                ? (result as ToolResult).error
                : toolResultsArtifact.success ? undefined : toolResultsArtifact.reason;
            return (
              <RendererWrapper key={`tool-result-${index}-${resultIndex}`}>
                <ToolResultRenderer
                  toolCallId={result.tool_call_id}
                  toolName={result.tool_name || 'Unknown Tool'}
                  result={result.result}
                  success={success}
                  error={error || undefined}
                />
              </RendererWrapper>
            );
          });
        }
        return null;

      default:
        // Debug artifacts in development

        return (
          <RendererWrapper key={`artifact-${index}`}>
            <DebugRenderer
              message={artifact}
            />
          </RendererWrapper>
        );

        return null;
    }
  }

  // Fallback - should never reach here
  return null;
}