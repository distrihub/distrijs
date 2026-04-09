import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench, Activity } from 'lucide-react';
import { ToolCallState } from '@/stores/chatStateStore';
import { ToolCall, DistriPart, ToolResult } from '@distri/core';
import { ToolRendererMap, RenderingMode } from '@/types';
import { useRendererContext } from './RendererContext';
import { getToolSummary } from './tools/getToolSummary';
import { MinimalToolRow } from './tools/MinimalToolRow';
import { RichToolCard } from './tools/RichToolCard';
import { InteractiveToolCard } from './tools/InteractiveToolCard';

interface ToolExecutionRendererProps {
  event: any; // Can be ToolCallsEvent or ToolResultsEvent
  toolCallStates: Map<string, ToolCallState>;
  toolRenderers?: ToolRendererMap;
  debug?: boolean;
  verbose?: boolean;
  rendering?: RenderingMode;  // falls back to RendererContext if not provided
  onToolComplete?: (result: ToolResult) => void;  // for interactive tool completions
}

interface ToolCallData {
  tool_call_id: string;
  tool_name: string;
  input: any;
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
}> = ({ toolCalls, toolCallStates, toolRenderers }) => {
  const [expanded, setExpanded] = useState(false);
  const { onShowTrace, threadId, toolSummaryOverrides } = useRendererContext();

  const filteredCalls = toolCalls.filter((tc: ToolCallData) => tc.tool_name !== 'final');

  // Render each tool using its best available presentation:
  // 1. Custom renderer (e.g. HttpToolCard) — self-contained card
  // 2. MinimalToolRow with getToolSummary — clean one-liner for known tools
  const renderToolItem = (toolCall: ToolCallData) => {
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
    // Use MinimalToolRow with formatted summary instead of raw ToolCallCard
    if (state) {
      const summary = getToolSummary(
        toolCall.tool_name,
        (toolCall.input as Record<string, unknown>) ?? {},
        state.result,
        toolSummaryOverrides
      );
      return <MinimalToolRow key={toolCall.tool_call_id} summary={summary} state={state} />;
    }
    return null;
  };

  // When every tool in this group has a custom renderer (e.g. HttpToolCard),
  // render the formatted cards directly — they already provide their own
  // expand/collapse, timing, and detail display. No outer wrapper needed.
  const allHaveRenderers = filteredCalls.length > 0
    && filteredCalls.every((tc) => !!toolRenderers?.[tc.tool_name]);

  if (allHaveRenderers) {
    return (
      <div className="space-y-1.5">
        {filteredCalls.map(renderToolItem)}
      </div>
    );
  }

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
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors py-0.5">
        <div className="flex items-center gap-1.5 flex-1" onClick={() => setExpanded(true)}>
          <Wrench className="h-3 w-3 text-green-600 shrink-0" />
          <span>Used {completedCount} tool{completedCount !== 1 ? 's' : ''}{timeStr}</span>
          <ChevronRight className="h-3 w-3" />
        </div>
        {onShowTrace && threadId && (
          <button
            onClick={(e) => { e.stopPropagation(); onShowTrace(threadId); }}
            className="ml-auto p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            title="View traces"
          >
            <Activity className="h-3 w-3" />
          </button>
        )}
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
      {filteredCalls.map(renderToolItem)}
    </div>
  );
};

export const ToolExecutionRenderer: React.FC<ToolExecutionRendererProps> = ({
  event,
  toolCallStates,
  toolRenderers,
  debug = false,
  verbose = false,
  rendering: renderingProp,
  onToolComplete,
}) => {
  const { rendering: renderingCtx, toolSummaryOverrides } = useRendererContext();
  const rendering = renderingProp ?? renderingCtx;
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
        if (!state) return null;

        // Custom renderer takes priority
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

        // Interactive tools (ask_follow_up, confirm, input, approval_*)
        const toolNameLower = toolCall.tool_name.toLowerCase();
        const isInteractive = toolNameLower === 'ask_follow_up' || toolNameLower === 'confirm' ||
          toolNameLower === 'input' || toolNameLower.startsWith('approval_');

        if (isInteractive) {
          const toolCallPayload: ToolCall = {
            tool_call_id: toolCall.tool_call_id,
            tool_name: toolCall.tool_name,
            input: toolCall.input,
          };
          return (
            <InteractiveToolCard
              key={toolCall.tool_call_id}
              toolCall={toolCallPayload}
              state={state}
              rendering={rendering}
              onComplete={onToolComplete ?? (() => {})}
            />
          );
        }

        // Mode-aware tool display
        const summary = getToolSummary(
          toolCall.tool_name,
          (toolCall.input as Record<string, unknown>) ?? {},
          state.result,
          toolSummaryOverrides
        );

        if (rendering === 'rich') {
          return <RichToolCard key={toolCall.tool_call_id} summary={summary} state={state} />;
        }
        return <MinimalToolRow key={toolCall.tool_call_id} summary={summary} state={state} />;
      })}
    </>
  );
};
