import React from 'react';
import { DistriMessage, DistriEvent, DistriArtifact, isDistriMessage, isDistriEvent, isDistriArtifact } from '@distri/core';
import { ChatStateStore } from '../../stores/chatStateStore';
import { UserMessageRenderer } from './UserMessageRenderer';
import { AssistantMessageRenderer } from './AssistantMessageRenderer';
import { ToolMessageRenderer } from './ToolMessageRenderer';
import { ThinkingRenderer } from './ThinkingRenderer';
import { PlanRenderer } from './PlanRenderer';
import { ToolCallRenderer } from './ToolCallRenderer';
import { ToolResultRenderer } from './ToolResultRenderer';
import { DebugRenderer } from './DebugRenderer';
import { ArtifactRenderer } from './ArtifactRenderer';

export interface MessageRendererProps {
  message: DistriEvent | DistriMessage | DistriArtifact;
  index: number;
  chatState: ChatStateStore;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function MessageRenderer({
  message,
  index,
  chatState,
  isExpanded = false,
  onToggle = () => { }
}: MessageRendererProps): React.ReactNode {
  // Handle DistriMessage types
  if (isDistriMessage(message)) {
    const distriMessage = message as DistriMessage;

    switch (distriMessage.role) {
      case 'user':
        return (
          <UserMessageRenderer
            key={`user-${index}`}
            message={distriMessage}
            chatState={chatState}
          />
        );

      case 'assistant':
        return (
          <AssistantMessageRenderer
            key={`assistant-${index}`}
            message={distriMessage}
            chatState={chatState}
          />
        );

      case 'tool':
        return (
          <ToolMessageRenderer
            key={`tool-${index}`}
            message={distriMessage}
            chatState={chatState}
          />
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
        return (
          <ThinkingRenderer
            key={`run-started-${index}`}
            type="thinking"
          />
        );

      case 'plan_started':
        return (
          <ThinkingRenderer
            key={`plan-started-${index}`}
            type="planning"
          />
        );

      case 'plan_finished':
        return (
          <div key={`plan-finished-${index}`} className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-800">
              <strong>Plan ready:</strong> {event.data?.total_steps || 0} steps
            </div>
          </div>
        );

      case 'text_message_start':
        return (
          <ThinkingRenderer
            key={`text-start-${index}`}
            type="generating"
          />
        );

      case 'text_message_content':
        // This is handled by the assistant message renderer
        return null;

      case 'text_message_end':
        // This is handled by the assistant message renderer
        return null;

      case 'tool_call_start':
        return (
          <div key={`tool-call-start-${index}`} className="flex items-center space-x-2 p-2 bg-muted rounded">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">
              Calling tool: {event.data?.tool_call_name || 'unknown'} ⏳
            </span>
          </div>
        );

      case 'tool_call_end':
        return (
          <div key={`tool-call-end-${index}`} className="flex items-center space-x-2 p-2 bg-muted rounded">
            <span className="text-green-500">✅</span>
            <span className="text-sm">Tool complete</span>
          </div>
        );

      case 'tool_call_result':
        return (
          <div key={`tool-call-result-${index}`} className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="text-sm text-green-800">
              <strong>Tool result:</strong>
              <pre className="mt-1 text-xs overflow-x-auto">
                {event.data?.result || 'No result'}
              </pre>
            </div>
          </div>
        );

      case 'agent_handover':
        return (
          <div key={`handover-${index}`} className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-800">
              <strong>Handover to:</strong> {event.data?.to_agent || 'unknown agent'}
            </div>
          </div>
        );

      case 'run_finished':
        return (
          <div key={`run-finished-${index}`} className="flex items-center space-x-2 p-2 bg-green-50 rounded">
            <span className="text-green-500">✅</span>
            <span className="text-sm font-medium">Done</span>
          </div>
        );

      case 'run_error':
        return (
          <div key={`run-error-${index}`} className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-sm text-red-800">
              <strong>Error:</strong> {event.data?.message || 'Unknown error occurred'}
            </div>
            <button className="mt-2 text-xs text-red-600 underline">Retry</button>
          </div>
        );

      default:
        // Debug events in development
        if (process.env.NODE_ENV === 'development') {
          return (
            <DebugRenderer
              key={`event-${index}`}
              message={event}
              chatState={chatState}
            />
          );
        }
        return null;
    }
  }

  // Handle DistriArtifact types
  if (isDistriArtifact(message)) {
    const artifact = message as DistriArtifact;

    switch (artifact.type) {
      case 'plan':
        return (
          <PlanRenderer
            key={`plan-${index}`}
            message={artifact}
            chatState={chatState}
          />
        );

      case 'llm_response':
        // Handle tool calls from LLM response
        if (artifact.tool_calls && Array.isArray(artifact.tool_calls)) {
          return artifact.tool_calls.map((toolCall, toolIndex) => {
            // Get tool call state from chat state
            const toolCallState = chatState.getToolCallById(toolCall.tool_call_id);
            if (!toolCallState) return null;

            return (
              <ToolCallRenderer
                key={`tool-call-${index}-${toolIndex}`}
                toolCall={toolCallState}
                chatState={chatState}
                isExpanded={isExpanded}
                onToggle={onToggle}
              />
            );
          }).filter(Boolean);
        }
        return null;

      case 'tool_results':
        // Handle tool results
        if (artifact.results && Array.isArray(artifact.results)) {
          return artifact.results.map((result, resultIndex) => (
            <ToolResultRenderer
              key={`tool-result-${index}-${resultIndex}`}
              toolCallId={result.tool_call_id}
              toolName={result.tool_name || 'Unknown Tool'}
              result={result.result}
              success={result.success}
              error={result.error}
            />
          ));
        }
        return null;

      default:
        // Debug artifacts in development
        if (process.env.NODE_ENV === 'development') {
          return (
            <DebugRenderer
              key={`artifact-${index}`}
              message={artifact}
              chatState={chatState}
            />
          );
        }
        return null;
    }
  }

  // Fallback - should never reach here
  return null;
}