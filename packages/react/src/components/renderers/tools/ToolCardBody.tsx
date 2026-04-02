// packages/react/src/components/renderers/tools/ToolCardBody.tsx
import React from 'react';
import { ToolCallState } from '@/stores/chatStateStore';
import { ToolSummary } from '@/types';
import { DiffView, looksLikeDiff } from './DiffView';
import { HttpResult } from './HttpResult';
import { FilePreview } from './FilePreview';

interface ToolCardBodyProps {
  summary: ToolSummary;
  state: ToolCallState;
}

function isHttpVerb(verb: string) {
  return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].includes(verb.toUpperCase());
}

function isFileVerb(verb: string) {
  return ['Read', 'Write', 'Find'].includes(verb);
}

function isEditVerb(verb: string) {
  return verb === 'Edit' || verb === 'Delete';
}

export const ToolCardBody: React.FC<ToolCardBodyProps> = ({ summary, state }) => {
  const errorMsg = state.error;
  if (errorMsg) {
    return (
      <div className="p-3 text-[12px] text-destructive">
        {errorMsg}
      </div>
    );
  }

  // Diff in result parts
  for (const part of state.result?.parts ?? []) {
    const p = part as any;
    if (p.part_type === 'text' && typeof p.data === 'string' && looksLikeDiff(p.data)) {
      return <DiffView diff={p.data} />;
    }
    if (p.part_type === 'data' && typeof p.data === 'string' && looksLikeDiff(p.data)) {
      return <DiffView diff={p.data} />;
    }
  }

  if (isHttpVerb(summary.verb)) return <HttpResult state={state} />;
  if (isFileVerb(summary.verb) || isEditVerb(summary.verb)) return <FilePreview state={state} />;

  // Generic: text result
  const text = state.result?.parts
    ?.filter((p: any) => p.part_type === 'text')
    .map((p: any) => p.data as string)
    .join('\n') ?? '';

  if (!text) return null;

  return (
    <div className="p-3 text-[12px] text-muted-foreground whitespace-pre-wrap max-h-[200px] overflow-auto font-mono">
      {text.length > 500 ? text.slice(0, 500) + '…' : text}
    </div>
  );
};
