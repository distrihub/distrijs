import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, Wrench } from 'lucide-react';
import { ToolCallState } from '@/stores/chatStateStore';
import { LoadingShimmer } from './ThinkingRenderer';
import { ToolCall, DistriPart, ToolResult } from '@distri/core';
import { ToolRendererMap } from '@/types';

interface ToolExecutionRendererProps {
  event: any; // Can be ToolCallsEvent or ToolResultsEvent
  toolCallStates: Map<string, ToolCallState>;
  toolRenderers?: ToolRendererMap;
  debug?: boolean;
  verbose?: boolean;
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
      // Check if this looks like a diff
      if (typeof data === 'string' && looksLikeDiff(data)) {
        return <DiffBlock key={index} diff={data} />;
      }
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
 * Render all parts from a ToolResult, with diff detection
 */
const renderToolResultParts = (result: ToolResult): React.ReactNode => {
  if (!result.parts || result.parts.length === 0) {
    return 'No result available';
  }

  return (
    <div className="space-y-2">
      {result.parts.map((part, index) => {
        const p = part as DistriPart;
        // Check text parts for diff content
        if (p.part_type === 'text' && typeof p.data === 'string' && looksLikeDiff(p.data)) {
          return <DiffBlock key={index} diff={p.data} />;
        }
        return renderPart(p, index);
      })}
    </div>
  );
};

/** Check if text looks like a unified diff */
function looksLikeDiff(text: string): boolean {
  const lines = text.split('\n').slice(0, 15);
  let indicators = 0;
  for (const line of lines) {
    if (line.startsWith('+') || line.startsWith('-') || line.startsWith('@@') || line.startsWith('diff ')) {
      indicators++;
    }
  }
  return indicators >= 3;
}

/**
 * Renders a unified diff with color-coded lines.
 */
const DiffBlock: React.FC<{ diff: string }> = ({ diff }) => {
  const lines = diff.split('\n');

  // Count additions and removals
  let added = 0;
  let removed = 0;
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) added++;
    if (line.startsWith('-') && !line.startsWith('---')) removed++;
  }

  // Extract filename from diff header if present
  const fileMatch = diff.match(/^(?:diff --git a\/(.+?) b\/|--- a\/(.+?)$|\+\+\+ b\/(.+?)$)/m);
  const filename = fileMatch?.[1] || fileMatch?.[2] || fileMatch?.[3];

  return (
    <div className="my-2 rounded-md border border-border overflow-hidden">
      {/* Header */}
      {(filename || added > 0 || removed > 0) && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border text-xs text-muted-foreground">
          {filename && (
            <span className="font-mono truncate">{filename}</span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {added > 0 && <span className="text-green-600">+{added}</span>}
            {removed > 0 && <span className="text-red-500">-{removed}</span>}
          </div>
        </div>
      )}
      {/* Diff content */}
      <div className="overflow-auto max-h-[300px]">
        <pre className="text-[11px] leading-5 p-2 m-0">
          {lines.map((line, i) => {
            let className = 'px-2';
            if (line.startsWith('+') && !line.startsWith('+++')) {
              className += ' bg-green-500/10 text-green-700 dark:text-green-400';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              className += ' bg-red-500/10 text-red-700 dark:text-red-400';
            } else if (line.startsWith('@@')) {
              className += ' text-blue-600 dark:text-blue-400 bg-blue-500/5';
            } else {
              className += ' text-muted-foreground';
            }
            return (
              <div key={i} className={className}>
                {line}
              </div>
            );
          })}
        </pre>
      </div>
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

/** Generate human-readable status text for a tool call */
export const formatStatusText = (toolName: string, input: any): string => {
  const str = (key: string) => input?.[key] || '';
  const truncate = (s: string, max: number) => s.length > max ? `${s.slice(0, max)}…` : s;

  switch (toolName) {
    case 'distri_request': {
      const method = str('method');
      const path = str('path');
      const connId = input?.headers?.['x-connection-id'];
      if (method === 'GET' && path.includes('/connections')) return 'Checking available connections...';
      if (connId) {
        if (path.includes('/calendar')) return `Checking calendar via ${connId}`;
        if (path.includes('/email')) return `Checking email via ${connId}`;
        return `Making request via ${connId}`;
      }
      return `${method} ${truncate(path, 40)}...`;
    }
    case 'execute_shell': return `Running command: ${truncate(str('command'), 50)}`;
    case 'search': return `Searching: ${truncate(str('query'), 50)}`;
    case 'browsr_scrape': {
      const url = str('url');
      const host = url.replace(/^https?:\/\//, '').split('/')[0];
      return `Browsing ${host}`;
    }
    case 'load_skill': return `Loading skill: ${str('skill_name')}`;
    case 'transfer_to_agent': return `Handing off to ${str('agent_name')}`;
    case 'read_file': return `Reading ${truncate(str('path') || str('file_path'), 50)}`;
    case 'write_file': return `Writing ${truncate(str('path') || str('file_path'), 50)}`;
    case 'tool_search': return 'Searching tools...';
    default: return `${toolName.replace(/_/g, ' ')}...`;
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

/**
 * Collapsed tool summary — shown in Normal mode when all tools are completed.
 * "Used N tools (Xs)" with click to expand.
 */
const ToolSummary: React.FC<{
  toolCalls: ToolCallData[];
  toolCallStates: Map<string, ToolCallState>;
  toolRenderers?: ToolRendererMap;
  debug?: boolean;
  renderResultData: (toolCallState?: ToolCallState) => React.ReactNode;
}> = ({ toolCalls, toolCallStates, toolRenderers, debug, renderResultData }) => {
  const [expanded, setExpanded] = useState(false);

  const completedCount = toolCalls.filter(tc => {
    const state = toolCallStates.get(tc.tool_call_id);
    return state?.status === 'completed';
  }).length;

  const totalTime = toolCalls.reduce((acc, tc) => {
    const state = toolCallStates.get(tc.tool_call_id);
    if (state?.startTime && state?.endTime) {
      return acc + (state.endTime - state.startTime);
    }
    return acc;
  }, 0);

  const timeStr = totalTime > 0 ? ` · ${(totalTime / 1000).toFixed(1)}s` : '';

  if (!expanded) {
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors py-0.5"
        onClick={() => setExpanded(true)}
      >
        <Wrench className="h-3 w-3 text-green-600 shrink-0" />
        <span>
          Used {completedCount} tool{completedCount !== 1 ? 's' : ''}{timeStr}
        </span>
        <ChevronRight className="h-3 w-3" />
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors py-0.5 mb-1"
        onClick={() => setExpanded(false)}
      >
        <Wrench className="h-3 w-3 text-green-600 shrink-0" />
        <span>
          Used {completedCount} tool{completedCount !== 1 ? 's' : ''}{timeStr}
        </span>
        <ChevronDown className="h-3 w-3" />
      </div>
      {toolCalls
        .filter((tc: ToolCallData) => tc.tool_name !== 'final')
        .map((toolCall: ToolCallData) => {
          const state = toolCallStates.get(toolCall.tool_call_id);
          const renderer = toolRenderers?.[toolCall.tool_name];
          if (renderer) {
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
    </div>
  );
};

export const ToolExecutionRenderer: React.FC<ToolExecutionRendererProps> = ({
  event,
  toolCallStates,
  toolRenderers,
  debug = false,
  verbose = false,
}) => {
  const toolCalls = event.data?.tool_calls || [];
  if (toolCalls.length === 0) {
    return null;
  }

  const filteredToolCalls = toolCalls.filter((tc: ToolCallData) => tc.tool_name !== 'final');

  const renderResultData = (toolCallState?: ToolCallState): React.ReactNode => {
    if (!toolCallState?.result) {
      return 'No result available';
    }

    // Use the new parts-aware renderer
    return renderToolResultParts(toolCallState.result);
  };

  // Check if any tool is still running/pending
  const hasActiveTools = filteredToolCalls.some((tc: ToolCallData) => {
    const state = toolCallStates.get(tc.tool_call_id);
    return !state || state.status === 'pending' || state.status === 'running';
  });

  // Normal mode (not verbose): collapse completed tools into summary
  if (!verbose && !hasActiveTools && filteredToolCalls.length > 0) {
    return (
      <ToolSummary
        toolCalls={filteredToolCalls}
        toolCallStates={toolCallStates}
        toolRenderers={toolRenderers}
        debug={debug}
        renderResultData={renderResultData}
      />
    );
  }

  // Verbose mode or active tools: show all tool calls
  return (
    <>
      {filteredToolCalls.map((toolCall: ToolCallData) => {
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
