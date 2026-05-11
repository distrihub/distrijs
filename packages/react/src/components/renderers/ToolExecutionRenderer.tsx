import React from 'react';
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
    case 'artifact': {
      const meta = part.data as {
        file_id?: string;
        relative_path?: string;
        content_type?: string;
        original_filename?: string;
        size?: number;
      };
      const relPath = meta.relative_path || '';
      const url = relPath ? `/api/v1/artifacts/${relPath}` : '';
      const mime = meta.content_type || 'application/octet-stream';
      const name = meta.original_filename || meta.file_id || 'artifact';

      if (mime.startsWith('image/') && url) {
        return (
          <div key={index} className="my-2">
            <img
              src={url}
              alt={name}
              className="max-w-full max-h-[400px] rounded border border-border object-contain"
            />
            <div className="text-xs text-muted-foreground mt-1">{name}</div>
          </div>
        );
      }

      return (
        <div key={index} className="my-2 flex items-center gap-2 p-2 rounded border border-border">
          <span className="text-sm">📎 {name}</span>
          <span className="text-xs text-muted-foreground">({mime})</span>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline ml-auto">
              Download
            </a>
          )}
        </div>
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
export const renderToolResultParts = (result: ToolResult): React.ReactNode => {
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
    case 'search': return `Searching: ${truncate(str('query'), 50)}`;
    case 'browsr_scrape': {
      const url = str('url');
      const host = url.replace(/^https?:\/\//, '').split('/')[0];
      return `Browsing ${host}`;
    }
    case 'load_skill': return `Loading skill: ${str('skill_id') || str('skill_name')}`;
    case 'run_skill': {
      const skill = str('skill_id') || str('skill_name');
      const mode = str('mode');
      return mode ? `Running ${skill} (${mode})` : `Running ${skill}`;
    }
    case 'transfer_to_agent': return `Handing off to ${str('agent_name')}`;
    case 'call_agent': {
      const agent = str('agent') || 'sub-agent';
      const mode = str('mode');
      return mode ? `Calling ${agent} (${mode})` : `Calling ${agent}`;
    }
    case 'Read':
      return `Reading ${truncate(str('path') || str('file_path'), 50)}`;
    case 'Write':
      return `Writing ${truncate(str('path') || str('file_path'), 50)}`;
    case 'Edit': {
      const p = str('file_path') || str('path');
      const old = str('old_string');
      return `Editing ${truncate(p, 40)}${old ? ` — replace "${truncate(old, 30)}"` : ''}`;
    }
    case 'Glob': return `Globbing ${truncate(str('pattern'), 50)}`;
    case 'Grep': return `Searching for ${truncate(str('pattern'), 50)}`;
    case 'Bash': return `Running ${truncate(str('command'), 50)}`;

    // Browser-tools / IndexedDB collection toolset.
    // The agent passes `{collection, id?, query?, data?}` to these.
    case 'db_get': {
      const c = str('collection');
      const id = str('id');
      return id ? `Reading ${c}/${truncate(id, 12)}` : `Reading from ${c}`;
    }
    case 'db_put': {
      const c = str('collection');
      const id = str('id');
      return id ? `Writing ${c}/${truncate(id, 12)}` : `Adding to ${c}`;
    }
    case 'db_list': return `Listing ${str('collection')}`;
    case 'db_search': {
      const c = str('collection');
      const q = str('query');
      return `Searching ${c}: ${truncate(q, 40)}`;
    }
    case 'db_delete': {
      const c = str('collection');
      const id = str('id');
      return id ? `Deleting ${c}/${truncate(id, 12)}` : `Deleting from ${c}`;
    }
    case 'db_clear': return `Clearing ${str('collection')}`;

    // Agent control / housekeeping
    case 'tool_search': return 'Searching tools...';
    case 'write_todos': {
      const todos = (input?.todos as Array<{ status?: string; content?: string }> | undefined) ?? [];
      const total = todos.length;
      const done = todos.filter(t => t?.status === 'completed').length;
      return total > 0 ? `Updating todos (${done}/${total})` : 'Updating todos';
    }
    case 'final': return 'Returning final result';
    case 'reflect': return 'Reflecting on progress';
    case 'ask_follow_up': return `Asking: ${truncate(str('question'), 50)}`;

    default: return `${toolName.replace(/_/g, ' ')}...`;
  }
};

export const ToolExecutionRenderer: React.FC<ToolExecutionRendererProps> = ({
  event,
  toolCallStates,
  toolRenderers,
  debug = false,
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

  // Render all tools directly — no "Used N tools" collapsible wrapper
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

        // If `executeTool` already attached a component (e.g. a
        // registered DistriUiTool like `ask_follow_up`), defer to it
        // — Chat.tsx's `renderExternalToolCalls` will render that
        // copy. Without this, we'd ALSO render the interactive
        // fallback below and the user would see two UIs for the same
        // tool call (one inline "Type your answer" box plus the
        // proper structured form).
        if (state.component) {
          return null;
        }

        // Interactive tools (confirm, input, approval_*) — these have
        // no registered UI component, so the renderer falls back to
        // the generic InteractiveToolCard. `ask_follow_up` is NOT in
        // this list anymore: it always ships with its own
        // AskFollowUpComponent, surfaced via `state.component` above.
        const toolNameLower = toolCall.tool_name.toLowerCase();
        const isInteractive = toolNameLower === 'confirm' ||
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
        return <MinimalToolRow key={toolCall.tool_call_id} summary={summary} state={state} debug={debug} />;
      })}
    </>
  );
};
