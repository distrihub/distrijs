import React, { useState } from 'react';
import { ToolCallsEvent } from '@distri/core';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ToolCallState } from '@/stores/chatStateStore';
import { LoadingShimmer } from './ThinkingRenderer';

interface ToolExecutionRendererProps {
  event: any; // Can be ToolCallsEvent or ToolResultsEvent
  toolCallStates: Map<string, ToolCallState>;
}

interface ToolCallData {
  tool_call_id: string;
  tool_name: string;
  input: any;
}

// Friendly tool name mappings
const getFriendlyToolMessage = (toolName: string, input: any): string => {
  switch (toolName) {
    case 'search':
      return `Searching "${input?.query || 'unknown query'}"`;
    case 'scrape':
      return `Scraping website "${input?.url || 'unknown URL'}"`;
    case 'web_search':
      return `Searching the web for "${input?.query || 'unknown query'}"`;
    case 'read_file':
      return `Reading file "${input?.file_path || 'unknown file'}"`;
    case 'write_file':
      return `Writing to file "${input?.file_path || 'unknown file'}"`;
    case 'list_files':
      return `Listing files in "${input?.directory || 'current directory'}"`;
    case 'run_command':
      return `Running command "${input?.command || 'unknown command'}"`;
    default:
      return `Executing ${toolName}`;
  }
};

export const ToolExecutionRenderer: React.FC<ToolExecutionRendererProps> = ({
  event,
  toolCallStates,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Tool calls should be in data.tool_calls after encoder conversion
  const toolCalls = event.data?.tool_calls || [];

  // Debug logging to see what's happening
  console.log('🔧 ToolExecutionRenderer received:', {
    eventType: event.type,
    eventData: event.data,
    eventMetadata: event.metadata,
    toolCalls,
    toolCallStates: Array.from(toolCallStates.entries())
  });

  if (toolCalls.length === 0) {
    console.log('🔧 No tool calls found in event data or metadata');
    return null;
  }

  return (
    <>
      {toolCalls.map((toolCall: ToolCallData) => {
        // Hide 'final' tool calls as they're internal responses
        if (toolCall.tool_name === 'final') {
          return null;
        }

        const toolCallState = toolCallStates.get(toolCall.tool_call_id);
        const friendlyMessage = getFriendlyToolMessage(toolCall.tool_name, toolCall.input);

        const executionTime = toolCallState?.endTime && toolCallState?.startTime ? toolCallState?.endTime - toolCallState?.startTime : undefined;

        if (toolCallState?.status === 'pending' || toolCallState?.status === 'running') {
          return (
            <div key={`${toolCall.tool_call_id}-executing mb-2`}>
              <LoadingShimmer text={friendlyMessage} />
            </div>
          );
        }

        if (toolCallState?.status === 'completed') {
          const time = executionTime || 0;
          return (
            <div key={`${toolCall.tool_call_id}-completed`} className="mb-2">
              {/* Completed status with View Results on same row */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>
                    {friendlyMessage} completed
                    {time > 100 && (
                      <span className="text-xs ml-1">
                        ({(time / 1000).toFixed(1)}s)
                      </span>
                    )}
                  </span>
                </div>

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs hover:text-foreground transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Collapsible Results */}
              {isExpanded && (
                <div className="border border-muted rounded-lg p-3 bg-muted/25">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                    {toolCallState.result ?
                      JSON.stringify(toolCallState.result, null, 2) :
                      'No result available'
                    }
                  </pre>
                </div>
              )}
            </div>
          );
        }

        if (toolCallState?.status === 'error') {
          return (
            <div key={`${toolCall.tool_call_id}-error`} className="mb-3">
              <div className="flex items-center gap-2 text-sm text-destructive mb-2">
                <XCircle className="w-4 h-4" />
                <span>
                  {friendlyMessage} failed
                  {toolCallState.error && (
                    <span className="text-xs ml-1 text-muted-foreground">
                      - {toolCallState.error}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        }

        // Fallback: show basic info if toolCallState exists but status is unknown
        if (toolCallState) {
          return (
            <div key={`${toolCall.tool_call_id}-unknown`} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{friendlyMessage} ({toolCallState.status})</span>
            </div>
          );
        }

        return null;
      })}
    </>
  );
};