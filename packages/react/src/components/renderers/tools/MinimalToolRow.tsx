// packages/react/src/components/renderers/tools/MinimalToolRow.tsx
import React from 'react';
import { ToolCallState } from '@/stores/chatStateStore';
import { ToolSummary } from '@/types';

interface MinimalToolRowProps {
  summary: ToolSummary;
  state: ToolCallState;
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

export const MinimalToolRow: React.FC<MinimalToolRowProps> = ({ summary, state }) => {
  const isError = state.status === 'error';
  const errorMsg = state.error;

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
      <div className="flex items-center gap-2 py-1">
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
      </div>
      {isError && errorMsg && (
        <div className="pl-5 pb-1 text-[11px] text-destructive">{errorMsg}</div>
      )}
    </div>
  );
};
