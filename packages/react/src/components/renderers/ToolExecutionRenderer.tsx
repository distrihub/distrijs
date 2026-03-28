import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ToolCallState } from '@/stores/chatStateStore';
import { LoadingShimmer } from './ThinkingRenderer';
import { ToolCall, DistriPart, ToolResult } from '@distri/core';
import { ToolRendererMap } from '@/types';

interface ToolExecutionRendererProps {
  event: any; // Can be ToolCallsEvent or ToolResultsEvent
  toolCallStates: Map<string, ToolCallState>;
  toolRenderers?: ToolRendererMap;
  debug?: boolean;
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
  debug?: boolean;
}

/**
 * Helper to render a single DistriPart properly
 */
const renderPart = (part: DistriPart, index: number): React.ReactNode => {
  switch (part.part_type) {
    case 'text':
      return (
        <div key={index} className="whitespace-pre-wrap break-words">
          {part.data}
        </div>
      );
    case 'image': {
      const imageData = part.data as { type: string; mime_type: string; bytes?: string; url?: string };
      let src: string;
      if (imageData.type === 'bytes' && imageData.bytes) {
        // Base64 bytes - construct data URL
        src = `data:${imageData.mime_type};base64,${imageData.bytes}`;
      } else if (imageData.type === 'url' && imageData.url) {
        src = imageData.url;
      } else {
        return <div key={index} className="text-muted-foreground italic">Invalid image data</div>;
      }
      return (
        <div key={index} className="my-2">
          <img
            src={src}
            alt="Tool result"
            className="max-w-full max-h-[300px] rounded border border-border object-contain"
          />
        </div>
      );
    }
    case 'data': {
      const data = part.data;
      // If data is a simple success/error object, render compactly
      if (typeof data === 'object' && data !== null && 'success' in data) {
        const result = data as { success: boolean; error?: string; result?: unknown };
        if (result.error) {
          return <div key={index} className="text-destructive">Error: {result.error}</div>;
        }
        if (result.result !== undefined) {
          return (
            <pre key={index} className="whitespace-pre-wrap break-words">
              {typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}
            </pre>
          );
        }
        return <div key={index} className="text-green-600">Success</div>;
      }
      // Otherwise stringify the data
      return (
        <pre key={index} className="whitespace-pre-wrap break-words">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    }
    default:
      return (
        <pre key={index} className="whitespace-pre-wrap break-words">
          {JSON.stringify(part, null, 2)}
        </pre>
      );
  }
};

/**
 * Render all parts from a ToolResult
 */
const renderToolResultParts = (result: ToolResult): React.ReactNode => {
  if (!result.parts || result.parts.length === 0) {
    return 'No result available';
  }

  return (
    <div className="space-y-2">
      {result.parts.map((part, index) => renderPart(part as DistriPart, index))}
    </div>
  );
};

/** Format tool call like CLI: `tool_name("key_param")` */
const formatToolCall = (toolName: string, input: any): string => {
  const str = (key: string) => input?.[key] || '?';
  const truncate = (s: string, max: number) => s.length > max ? `${s.slice(0, max)}…` : s;

  switch (toolName) {
    case 'load_skill':
      return `load_skill("${str('skill_name')}")`;
    case 'run_skill_script': {
      const step = input?.step_index;
      return step != null
        ? `run_skill_script("${str('skill_name')}", step=${step})`
        : `run_skill_script("${str('skill_name')}")`;
    }
    case 'create_skill':
    case 'delete_skill':
      return `${toolName}("${input?.name || input?.skill_name || '?'}")`;
    case 'search':
      return `search("${truncate(str('query'), 60)}")`;
    case 'tool_search':
      return `tool_search("${truncate(str('query'), 60)}")`;
    case 'execute_shell':
      return `execute_shell("${truncate(str('command'), 60)}")`;
    case 'start_shell':
    case 'stop_shell':
      return `${toolName}()`;
    case 'browsr_scrape':
    case 'browsr_crawl':
      return `${toolName}("${truncate(str('url'), 60)}")`;
    case 'transfer_to_agent':
      return `transfer_to_agent("${str('agent_name')}")`;
    case 'api_request': {
      const method = input?.method || 'GET';
      const path = input?.path;
      const url = input?.url;
      if (url) return `api_request(${method} ${truncate(url, 50)})`;
      if (path) return `api_request(${method} ${path})`;
      return `api_request(${method})`;
    }
    case 'final':
    case 'reflect':
      return `${toolName}()`;
    default: {
      const compact = JSON.stringify(input || {});
      return `${toolName}(${truncate(compact, 80)})`;
    }
  }
};

/** Summarize tool result into a short one-liner */
const summarizeResult = (state: ToolCallState): string | null => {
  if (!state.result?.parts?.length) return null;
  for (const part of state.result.parts) {
    const p = part as DistriPart;
    if (p.part_type === 'text' && typeof p.data === 'string') {
      const text = p.data.trim();
      return text.length > 120 ? `${text.slice(0, 120)}…` : text;
    }
    if (p.part_type === 'data' && typeof p.data === 'object' && p.data !== null) {
      const obj = p.data as Record<string, unknown>;
      if (obj.error) return `Error: ${obj.error}`;
      if (obj.data && typeof obj.data === 'object') {
        const inner = obj.data as Record<string, unknown>;
        // Show count for arrays
        if (Array.isArray(inner)) return `${inner.length} items`;
        // Show a key field if available
        const label = inner.name || inner.id || inner.title || inner.status;
        if (label) return String(label);
      }
      if (obj.status && obj.data !== undefined) {
        const compact = JSON.stringify(obj.data);
        return compact.length > 100 ? `${compact.slice(0, 100)}…` : compact;
      }
    }
  }
  return null;
};

const ToolCallCard: React.FC<ToolCallCardProps> = ({ toolCall, state, renderResultData, debug = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('output');

  const formatted = formatToolCall(toolCall.tool_name, toolCall.input);
  const executionTime = state?.endTime && state?.startTime
    ? state.endTime - state.startTime
    : undefined;

  const renderDebugTabs = () => (
    <div className="mt-1.5 ml-5">
      <div className="mb-1.5 flex items-center gap-1.5">
        {(['output', 'input'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[11px] px-1.5 py-0.5 rounded transition-colors ${activeTab === tab ? 'bg-muted-foreground/20 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab === 'output' ? 'Output' : 'Input'}
          </button>
        ))}
      </div>
      {activeTab === 'input' ? (
        <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap overflow-auto break-words bg-muted/50 rounded p-2 max-h-[200px]">
          {JSON.stringify(toolCall.input, null, 2)}
        </pre>
      ) : (
        <div className="text-[11px] text-muted-foreground overflow-auto bg-muted/50 rounded p-2 max-h-[200px]">
          {renderResultData(state)}
        </div>
      )}
    </div>
  );

  // Running/pending: shimmer with formatted tool call
  if (state?.status === 'pending' || state?.status === 'running') {
    return (
      <div className="mb-1">
        <LoadingShimmer text={formatted} className="text-xs" showIcon={true} />
      </div>
    );
  }

  // Completed
  if (state?.status === 'completed') {
    const time = executionTime || 0;
    const summary = summarizeResult(state);

    return (
      <div className="mb-1 group">
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span
              className={debug ? 'cursor-pointer hover:text-foreground transition-colors' : ''}
              onClick={debug ? () => setIsExpanded(!isExpanded) : undefined}
            >
              {formatted}
              {time > 100 && (
                <span className="ml-1 text-muted-foreground/60">
                  {(time / 1000).toFixed(1)}s
                </span>
              )}
              {debug && (
                isExpanded
                  ? <ChevronDown className="inline h-3 w-3 ml-0.5" />
                  : <ChevronRight className="inline h-3 w-3 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </span>
            {summary && !isExpanded && (
              <div className="text-muted-foreground/60 truncate">{`⎿ ${summary}`}</div>
            )}
          </div>
        </div>
        {debug && isExpanded && renderDebugTabs()}
      </div>
    );
  }

  // Errors: always visible
  if (state?.status === 'error') {
    return (
      <div className="mb-1">
        <div className="flex items-start gap-1.5 text-xs">
          <XCircle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span
              className={`text-destructive ${debug ? 'cursor-pointer hover:text-destructive/80' : ''}`}
              onClick={debug ? () => setIsExpanded(!isExpanded) : undefined}
            >
              {formatted} failed
            </span>
            {state.error && (
              <div className="text-muted-foreground/60 text-[11px] truncate">{`⎿ ${state.error}`}</div>
            )}
          </div>
        </div>
        {debug && isExpanded && renderDebugTabs()}
      </div>
    );
  }

  if (state) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Clock className="h-3 w-3" />
        <span>{formatted} ({state.status})</span>
      </div>
    );
  }

  return null;
};

export const ToolExecutionRenderer: React.FC<ToolExecutionRendererProps> = ({
  event,
  toolCallStates,
  toolRenderers,
  debug = false,
}) => {
  const toolCalls = event.data?.tool_calls || [];
  if (toolCalls.length === 0) {
    return null;
  }

  const renderResultData = (toolCallState?: ToolCallState): React.ReactNode => {
    if (!toolCallState?.result) {
      return 'No result available';
    }

    // Use the new parts-aware renderer
    return renderToolResultParts(toolCallState.result);
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
              debug={debug}
            />
          );
        })}
    </>
  );
};
