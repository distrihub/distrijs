// packages/react/src/components/renderers/tools/InteractiveToolCard.tsx
import React from 'react';
import { ToolCall, ToolResult } from '@distri/core';
import { ToolCallState } from '@/stores/chatStateStore';
import { RenderingMode } from '@/types';
import { FormToolCard } from './FormToolCard';
import { InlineQuestion } from './InlineQuestion';
import { Button } from '@/components/ui/button';

interface InteractiveToolCardProps {
  toolCall: ToolCall;
  state: ToolCallState;
  rendering: RenderingMode;
  onComplete: (result: ToolResult) => void;
}

function ConfirmCard({
  toolCall, state, onComplete,
}: { toolCall: ToolCall; state: ToolCallState; onComplete: (r: ToolResult) => void }) {
  const input = toolCall.input as Record<string, unknown>;
  const question = (input.question ?? input.message ?? 'Please confirm') as string;
  const isAnswered = state.status === 'completed';

  const answer = (val: boolean) => onComplete({
    tool_call_id: toolCall.tool_call_id,
    tool_name: toolCall.tool_name,
    parts: [{ part_type: 'data' as const, data: { confirmed: val } }],
  });

  if (isAnswered) {
    return (
      <div className="text-xs text-muted-foreground py-1">
        <span className="text-primary">✓</span> {question}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-primary overflow-hidden">
      <div className="px-3 py-2 bg-accent/30 border-b border-border flex items-center gap-2">
        <span className="text-base">✋</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-primary flex-1">
          {toolCall.tool_name}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Waiting
        </span>
      </div>
      <div className="p-4 bg-background text-sm text-foreground">{question}</div>
      <div className="flex justify-end gap-2 px-3 py-2 bg-muted/20 border-t border-border">
        <Button variant="ghost" size="sm" onClick={() => answer(false)} className="text-xs h-7">No</Button>
        <Button size="sm" onClick={() => answer(true)} className="text-xs h-7">Yes</Button>
      </div>
    </div>
  );
}

export const InteractiveToolCard: React.FC<InteractiveToolCardProps> = ({
  toolCall, state, rendering, onComplete,
}) => {
  const name = toolCall.tool_name.toLowerCase();

  if (name === 'confirm' || name.startsWith('approval_')) {
    return <ConfirmCard toolCall={toolCall} state={state} onComplete={onComplete} />;
  }

  const input = toolCall.input as Record<string, unknown>;
  const fields = Array.isArray(input.fields) ? input.fields : [];
  const requiredCount = (fields as { required?: boolean }[]).filter(f => f.required).length;

  if (rendering === 'minimal' && requiredCount < 2) {
    return <InlineQuestion toolCall={toolCall} state={state} onComplete={onComplete} />;
  }

  return <FormToolCard toolCall={toolCall} state={state} onComplete={onComplete} />;
};
