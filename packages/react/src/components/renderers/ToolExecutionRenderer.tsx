import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ToolCallState } from '@/stores/chatStateStore';
import { LoadingShimmer } from './ThinkingRenderer';
import { extractToolResultData } from '@distri/core';

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
    case 'call_search_agent':
      return `Searching`;
    case 'read_values':
      return `Reading values`;
    case 'get_sheet_info':
      return `Getting sheet info`;
    case 'get_context_pack':
      return `Understanding the spreadsheet`;
    case 'write_values':
      return `Updating values`;
    case 'clear_values':
      return `Clearing values`;
    case 'merge_cells':
      return `Merging cells`;
    case 'call_blink_ops_agent':
      return `Planning sheet updates`;
    case 'apply_blink_ops':
      return `Applying sheet updates`;
    case 'final':
      return `Finalizing`;
    default:
      return `Executing ${toolName}`;
  }
};

export const ToolExecutionRenderer: React.FC<ToolExecutionRendererProps> = ({
  event,
  toolCallStates,
}) => {
  // Tool calls should be in data.tool_calls after encoder conversion
  const toolCalls = event.data?.tool_calls || [];
  if (toolCalls.length === 0) {
    console.log('🔧 No tool calls found in event data or metadata');
    return null;
  }

  const renderResultData = (toolCallState?: ToolCallState) => {
    if (!toolCallState?.result) {
      return 'No result available';
    }
    console.log('🔧 Tool call result:', toolCallState.result);
    // Prefer simplified data view when parts array exists
    const resultData = extractToolResultData(toolCallState.result);
    if (resultData) {
      return resultData.result;
    }
    return JSON.stringify(toolCallState.result, null, 2);
  };

  return (
    <>
      {toolCalls.map((toolCall: ToolCallData) => {
        const ToolCallCard: React.FC = () => {
          const [isExpanded, setIsExpanded] = useState(false);
          const [activeTab, setActiveTab] = useState<'input' | 'output'>('output');

          const toolCallState = toolCallStates.get(toolCall.tool_call_id);
          const friendlyMessage = getFriendlyToolMessage(toolCall.tool_name, toolCall.input);
          const executionTime = toolCallState?.endTime && toolCallState?.startTime ? toolCallState?.endTime - toolCallState?.startTime : undefined;

          const renderTabs = () => (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-2">
                {(['output', 'input'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${activeTab === tab ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    {tab === 'output' ? 'Output' : 'Input'}
                  </button>
                ))}
              </div>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto break-words border border-muted rounded-md p-3">
                {activeTab === 'input'
                  ? JSON.stringify(toolCall.input, null, 2)
                  : renderResultData(toolCallState)}
              </pre>
              {toolCallState?.error && activeTab === 'output' && (
                <div className="mt-2 text-xs text-destructive">
                  Error: {toolCallState.error}
                </div>
              )}
            </div>
          );

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
                    View details
                  </button>
                </div>

                {isExpanded && renderTabs()}
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

                {renderTabs()}
              </div>
            );
          }

          if (toolCallState) {
            return (
              <div key={`${toolCall.tool_call_id}-unknown`} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{friendlyMessage} ({toolCallState.status})</span>
              </div>
            );
          }

          return null;
        };

        // Hide 'final' tool calls as they're internal responses
        if (toolCall.tool_name === 'final') {
          return null;
        }

        return <ToolCallCard key={toolCall.tool_call_id} />;
      })}
    </>
  );
};
