// packages/react/src/components/renderers/tools/InlineQuestion.tsx
import React, { useState } from 'react';
import { ToolCall, ToolResult } from '@distri/core';
import { ToolCallState } from '@/stores/chatStateStore';

interface InlineQuestionProps {
  toolCall: ToolCall;
  state: ToolCallState;
  onComplete: (result: ToolResult) => void;
}

export const InlineQuestion: React.FC<InlineQuestionProps> = ({ toolCall, state, onComplete }) => {
  const input = toolCall.input as Record<string, unknown>;
  const question = (input.question as string) ?? toolCall.tool_name;
  const [answer, setAnswer] = useState('');
  const isAnswered = state.status === 'completed';

  const submit = () => {
    if (!answer.trim()) return;
    onComplete({
      tool_call_id: toolCall.tool_call_id,
      tool_name: toolCall.tool_name,
      parts: [{ part_type: 'text' as const, data: answer }],
    });
  };

  if (isAnswered) {
    return (
      <div className="text-xs text-muted-foreground py-1">
        <span className="text-primary">✓</span> {question}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-primary/50 bg-accent/20 p-3 space-y-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
        {toolCall.tool_name}
      </div>
      <div className="text-xs text-foreground">{question}</div>
      <div className="flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="Type your answer…"
          className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary"
          autoFocus
        />
        <button
          onClick={submit}
          className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 hover:opacity-90"
        >
          →
        </button>
      </div>
    </div>
  );
};
