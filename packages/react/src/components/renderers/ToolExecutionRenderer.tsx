import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ToolCallState } from '@/stores/chatStateStore';
import { LoadingShimmer } from './ThinkingRenderer';
import { extractToolResultData, ToolCall } from '@distri/core';
import { ToolRendererMap } from '@/types';

interface ToolExecutionRendererProps {
  event: any; // Can be ToolCallsEvent or ToolResultsEvent
  toolCallStates: Map<string, ToolCallState>;
  toolRenderers?: ToolRendererMap;
}

interface ToolCallData {
  tool_call_id: string;
  tool_name: string;
  input: any;
}

interface ToolCallCardProps {
  toolCall: ToolCallData;
  state?: ToolCallState;
  renderResultData: (toolCallState?: ToolCallState) => React.ReactNode;
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
    default:
      return `Executing ${toolName}`;
  }
};

const ToolCallCard: React.FC<ToolCallCardProps> = ({ toolCall, state, renderResultData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('output');

  const friendlyMessage = getFriendlyToolMessage(toolCall.tool_name, toolCall.input);
  const executionTime = state?.endTime && state?.startTime
    ? state.endTime - state.startTime
    : undefined;

  const renderTabs = () => (
    <div className="mt-2">
      <div className="mb-2 flex items-center gap-2">
        {(['output', 'input'] as const).map((tab) => (
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
          : renderResultData(state)}
      </pre>
      {state?.error && activeTab === 'output' && (
        <div className="mt-2 text-xs text-destructive">
          Error: {state.error}
        </div>
      )}
    </div>
  );

  if (state?.status === 'pending' || state?.status === 'running') {
    return (
      <div className="mb-2">
        <LoadingShimmer text={friendlyMessage} />
      </div>
    );
  }

  if (state?.status === 'completed') {
    const time = executionTime || 0;
    return (
      <div className="mb-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>
              {friendlyMessage} completed
              {time > 100 && (
                <span className="ml-1 text-xs">
                  ({(time / 1000).toFixed(1)}s)
                </span>
              )}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs transition-colors hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            View details
          </button>
        </div>

        {isExpanded && renderTabs()}
      </div>
    );
  }

  if (state?.status === 'error') {
    return (
      <div className="mb-3">
        <div className="mb-2 flex items-center gap-2 text-sm text-destructive">
          <XCircle className="h-4 w-4" />
          <span>
            {friendlyMessage} failed
            {state.error && (
              <span className="ml-1 text-xs text-muted-foreground">
                - {state.error}
              </span>
            )}
          </span>
        </div>

        {renderTabs()}
      </div>
    );
  }

  if (state) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>{friendlyMessage} ({state.status})</span>
      </div>
    );
  }

  return null;
};

export const ToolExecutionRenderer: React.FC<ToolExecutionRendererProps> = ({
  event,
  toolCallStates,
  toolRenderers,
}) => {
  const toolCalls = event.data?.tool_calls || [];
  if (toolCalls.length === 0) {
    return null;
  }

  const renderResultData = (toolCallState?: ToolCallState) => {
    if (!toolCallState?.result) {
      return 'No result available';
    }

    const resultData = extractToolResultData(toolCallState.result);
    if (resultData) {
      if (typeof resultData.result === 'object') {
        return JSON.stringify(resultData.result, null, 2);
      }
      return String(resultData.result);
    }
    return JSON.stringify(toolCallState.result, null, 2);
  };

  return (
    <>
      {toolCalls
        .filter((toolCall: ToolCallData) => toolCall.tool_name !== 'final')
        .map((toolCall: ToolCallData) => {
          const state = toolCallStates.get(toolCall.tool_call_id);
          const renderer = toolRenderers?.[toolCall.tool_name];
          if (renderer) {
            // Cast event tool call into ToolCall shape best-effort
            const toolCallPayload: ToolCall = {
              tool_call_id: toolCall.tool_call_id,
              tool_name: toolCall.tool_name,
              input: toolCall.input,
            };
            return (
              <div key={toolCall.tool_call_id}>
                {renderer({ toolCall: toolCallPayload, state })}
              </div>
            );
          }
          return (
            <ToolCallCard
              key={toolCall.tool_call_id}
              toolCall={toolCall}
              state={state}
              renderResultData={renderResultData}
            />
          );
        })}
    </>
  );
};
