// packages/react/src/components/renderers/tools/MinimalToolRow.tsx
import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { ToolCallState } from '@/stores/chatStateStore';
import { ToolSummary } from '@/types';
import { DistriPart, ToolResult } from '@distri/core';

interface MinimalToolRowProps {
  summary: ToolSummary;
  state: ToolCallState;
  debug?: boolean;
}

function hasInputContent(input: unknown): boolean {
  return !!input && typeof input === 'object' && Object.keys(input as object).length > 0;
}

function StatusIcon({ status }: { status: ToolCallState['status'] }) {
  if (status === 'completed') {
    return <span className="text-primary text-[11px] w-3.5 text-center flex-shrink-0">✓</span>;
  }
  if (status === 'error') {
    return <span className="text-destructive text-[11px] w-3.5 text-center flex-shrink-0">✗</span>;
  }
  if (status === 'running') {
    return (
      <span className="w-3.5 flex-shrink-0 flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      </span>
    );
  }
  return <span className="text-muted-foreground text-[11px] w-3.5 text-center flex-shrink-0">·</span>;
}

function Timing({ state }: { state: ToolCallState }) {
  if (state.status === 'running' && state.startTime) {
    const elapsed = ((Date.now() - state.startTime) / 1000).toFixed(1);
    return <span className="text-muted-foreground text-[10px] flex-shrink-0">{elapsed}s…</span>;
  }
  if (state.endTime && state.startTime) {
    const elapsed = ((state.endTime - state.startTime) / 1000).toFixed(1);
    return <span className="text-muted-foreground text-[10px] flex-shrink-0">{elapsed}s</span>;
  }
  return null;
}

function hasResultContent(result?: ToolResult): boolean {
  if (!result?.parts?.length) return false;
  return result.parts.some((part) => {
    const p = part as DistriPart;
    if (p.part_type === 'text' && typeof p.data === 'string' && p.data.trim()) return true;
    if (p.part_type === 'data' && p.data != null) return true;
    if (p.part_type === 'image') return true;
    return false;
  });
}

function renderResultContent(result: ToolResult): React.ReactNode {
  return (
    <div className="space-y-1">
      {result.parts.map((part, index) => {
        const p = part as DistriPart;
        switch (p.part_type) {
          case 'text':
            return (
              <pre key={index} className="whitespace-pre-wrap break-words text-[11px] text-muted-foreground m-0">
                {typeof p.data === 'string' ? p.data : JSON.stringify(p.data)}
              </pre>
            );
          case 'image': {
            const imageData = p.data as { type: string; mime_type: string; bytes?: string; url?: string };
            const src = imageData.type === 'bytes' && imageData.bytes
              ? `data:${imageData.mime_type};base64,${imageData.bytes}`
              : imageData.url;
            if (!src) return null;
            return (
              <img key={index} src={src} alt="Tool result"
                className="max-w-full max-h-[200px] rounded border border-border object-contain" />
            );
          }
          case 'data': {
            const data = p.data;
            if (typeof data === 'object' && data !== null && 'success' in data) {
              const r = data as { success: boolean; error?: string; result?: unknown };
              if (r.error) return <div key={index} className="text-destructive text-[11px]">Error: {r.error}</div>;
              if (r.result !== undefined) {
                return (
                  <pre key={index} className="whitespace-pre-wrap break-words text-[11px] text-muted-foreground m-0">
                    {typeof r.result === 'string' ? r.result : JSON.stringify(r.result, null, 2)}
                  </pre>
                );
              }
              return <div key={index} className="text-green-600 text-[11px]">Success</div>;
            }
            return (
              <pre key={index} className="whitespace-pre-wrap break-words text-[11px] text-muted-foreground m-0">
                {JSON.stringify(data, null, 2)}
              </pre>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}

export const MinimalToolRow: React.FC<MinimalToolRowProps> = ({ summary, state, debug = false }) => {
  const [expanded, setExpanded] = useState(debug);
  const isError = state.status === 'error';
  const errorMsg = state.error;
  const inputExpandable = hasInputContent(state.input);
  const resultExpandable = hasResultContent(state.result);
  const expandable = inputExpandable || resultExpandable;

  // Diff shorthand from result
  let diffAdded: number | undefined;
  let diffRemoved: number | undefined;
  if (state.result?.parts) {
    for (const part of state.result.parts) {
      const p = part as any;
      if (p.part_type === 'text' && typeof p.data === 'string') {
        const lines = (p.data as string).split('\n');
        const a = lines.filter((l: string) => l.startsWith('+') && !l.startsWith('+++')).length;
        const r = lines.filter((l: string) => l.startsWith('-') && !l.startsWith('---')).length;
        if (a > 0 || r > 0) { diffAdded = a; diffRemoved = r; }
      }
    }
  }

  return (
    <div className={`flex flex-col text-sm ${isError ? 'bg-destructive/10 rounded-md px-1 py-0.5' : ''}`}>
      <div
        className={`flex items-center gap-2 py-1 ${expandable ? 'cursor-pointer hover:text-foreground transition-colors' : ''}`}
        onClick={expandable ? () => setExpanded(!expanded) : undefined}
      >
        <StatusIcon status={state.status} />
        <span className="flex-1 flex items-center gap-1.5 min-w-0">
          <span className="font-medium text-foreground text-xs">{summary.verb}</span>
          {summary.subject && (
            <code className="text-[11px] bg-muted px-1 py-0.5 rounded text-muted-foreground truncate max-w-[200px]">
              {summary.subject}
            </code>
          )}
        </span>
        {diffAdded !== undefined && (
          <>
            {/* Diff colors are semantic standards, no shadcn token covers this */}
            <span className="text-[10px] text-green-600 dark:text-green-400 flex-shrink-0">+{diffAdded}</span>
            <span className="text-[10px] text-red-500 dark:text-red-400 flex-shrink-0">-{diffRemoved}</span>
          </>
        )}
        {summary.detail && !diffAdded && (
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full flex-shrink-0">
            {summary.detail}
          </span>
        )}
        <Timing state={state} />
        {expandable && (
          expanded
            ? <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
      </div>
      {isError && errorMsg && (
        <div className="pl-5 pb-1 text-[11px] text-destructive">{errorMsg}</div>
      )}
      {expanded && (inputExpandable || resultExpandable) && (
        <div className="pl-5 pb-1.5 mt-0.5 space-y-1">
          {inputExpandable && (
            <div className="overflow-auto max-h-[200px] bg-muted/50 rounded p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Input</div>
              <pre className="whitespace-pre-wrap break-words text-[11px] text-muted-foreground m-0">
                {JSON.stringify(state.input, null, 2)}
              </pre>
            </div>
          )}
          {resultExpandable && state.result && (
            <div className="overflow-auto max-h-[300px] bg-muted/50 rounded p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Result</div>
              {renderResultContent(state.result)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
