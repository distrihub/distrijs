// packages/react/src/components/renderers/tools/RichToolCard.tsx
import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { ToolCallState } from '@/stores/chatStateStore';
import { ToolSummary } from '@/types';
import { ToolCardBody } from './ToolCardBody';

interface RichToolCardProps {
  summary: ToolSummary;
  state: ToolCallState;
}

const TOOL_ICONS: Record<string, string> = {
  GET: '🌐', POST: '🌐', PUT: '🌐', PATCH: '🌐', DELETE: '🌐',
  Read: '📄', Write: '📝', Edit: '✏️', Delete: '🗑️', Find: '🔍',
  Search: '🔍', Run: '⚡',
};

function StatusBadge({ state }: { state: ToolCallState }) {
  if (state.status === 'running') {
    return (
      <span className="flex items-center gap-1 text-[10px] text-primary">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        running
      </span>
    );
  }
  if (state.status === 'error') {
    return <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">error</span>;
  }
  return null;
}

export const RichToolCard: React.FC<RichToolCardProps> = ({ summary, state }) => {
  const isError = state.status === 'error';
  const [expanded, setExpanded] = useState(isError);

  const timing = state.endTime && state.startTime
    ? `${((state.endTime - state.startTime) / 1000).toFixed(1)}s`
    : state.startTime
      ? `${((Date.now() - state.startTime) / 1000).toFixed(1)}s…`
      : undefined;

  const borderCls = isError ? 'border-destructive/50' : 'border-border';
  const headerBg = isError ? 'bg-destructive/5' : 'bg-card';
  const icon = TOOL_ICONS[summary.verb] ?? '🔧';

  return (
    <div className={`rounded-md border ${borderCls} overflow-hidden text-sm`}>
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${headerBg}`}
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-base flex-shrink-0">{icon}</span>
        <span className="flex-1 flex items-center gap-1.5 min-w-0">
          <span className="font-medium text-foreground text-xs">{summary.verb}</span>
          {summary.subject && (
            <code className="text-[11px] bg-muted px-1 py-0.5 rounded text-muted-foreground truncate max-w-[200px]">
              {summary.subject}
            </code>
          )}
        </span>
        {summary.detail && (
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full flex-shrink-0">
            {summary.detail}
          </span>
        )}
        <StatusBadge state={state} />
        {timing && <span className="text-[10px] text-muted-foreground flex-shrink-0">{timing}</span>}
        {expanded
          ? <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        }
      </div>
      {expanded && (
        <div className="border-t border-border bg-background">
          <ToolCardBody summary={summary} state={state} />
        </div>
      )}
    </div>
  );
};
