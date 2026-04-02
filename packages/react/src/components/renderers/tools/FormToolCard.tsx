// packages/react/src/components/renderers/tools/FormToolCard.tsx
import React, { useState } from 'react';
import { ToolCallState } from '@/stores/chatStateStore';
import { ToolCall, ToolResult } from '@distri/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FieldDef {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  label?: string;
  required?: boolean;
  description?: string;
  options?: string[];
  default?: unknown;
}

function parseFields(input: Record<string, unknown>): FieldDef[] {
  if (Array.isArray(input.fields)) {
    return input.fields as FieldDef[];
  }
  return Object.entries(input)
    .filter(([k]) => k !== 'question')
    .map(([k, v]) => ({
      name: k,
      type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string',
      label: k.replace(/_/g, ' '),
      required: false,
    })) as FieldDef[];
}

interface FormToolCardProps {
  toolCall: ToolCall;
  state: ToolCallState;
  onComplete: (result: ToolResult) => void;
}

export const FormToolCard: React.FC<FormToolCardProps> = ({ toolCall, state, onComplete }) => {
  const input = toolCall.input as Record<string, unknown>;
  const question = input.question as string | undefined;
  const fields = parseFields(input);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) {
      init[f.name] = f.default !== undefined ? String(f.default) : '';
    }
    return init;
  });

  const isAnswered = state.status === 'completed';

  const handleSubmit = () => {
    onComplete({
      tool_call_id: toolCall.tool_call_id,
      tool_name: toolCall.tool_name,
      parts: [{ part_type: 'data' as const, data: values }],
    });
  };

  const handleSkip = () => {
    onComplete({
      tool_call_id: toolCall.tool_call_id,
      tool_name: toolCall.tool_name,
      parts: [{ part_type: 'data' as const, data: {} }],
    });
  };

  if (isAnswered) {
    return (
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
        {question ?? toolCall.tool_name} — answered
      </div>
    );
  }

  return (
    <div className="rounded-md border border-primary overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-accent/30 border-b border-border">
        <span className="text-base">❓</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-primary flex-1">
          {toolCall.tool_name}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Waiting for input
        </span>
      </div>
      <div className="p-4 space-y-4 bg-background">
        {question && (
          <p className="text-sm font-medium text-foreground">{question}</p>
        )}
        {fields.map((field) => (
          <div key={field.name} className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              {field.label ?? field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {field.type === 'enum' && field.options && field.options.length <= 4 ? (
              <div className="space-y-1">
                {field.options.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-xs ${
                      values[field.name] === opt ? 'border-primary bg-accent/30' : 'border-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={opt}
                      checked={values[field.name] === opt}
                      onChange={() => setValues(v => ({ ...v, [field.name]: opt }))}
                      className="sr-only"
                    />
                    <span className={`w-3 h-3 rounded-full border flex-shrink-0 ${
                      values[field.name] === opt ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`} />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <Input
                type={field.type === 'number' ? 'number' : 'text'}
                value={values[field.name]}
                onChange={(e) => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                className="text-xs h-8"
                placeholder={field.description}
              />
            )}
            {field.description && (
              <p className="text-[11px] text-muted-foreground">{field.description}</p>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 px-3 py-2 bg-muted/20 border-t border-border">
        <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs h-7">Skip</Button>
        <Button size="sm" onClick={handleSubmit} className="text-xs h-7">Submit</Button>
      </div>
    </div>
  );
};
