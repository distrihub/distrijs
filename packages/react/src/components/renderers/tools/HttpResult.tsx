// packages/react/src/components/renderers/tools/HttpResult.tsx
import React from 'react';
import { ToolCallState } from '@/stores/chatStateStore';

interface HttpResultProps { state: ToolCallState }

export const HttpResult: React.FC<HttpResultProps> = ({ state }) => {
  const text = state.result?.parts
    ?.filter((p: any) => p.part_type === 'text')
    .map((p: any) => p.data as string)
    .join('\n') ?? '';

  const truncated = text.length > 300 ? text.slice(0, 300) + '…' : text;

  return (
    <div className="p-3 font-mono text-[11px] text-muted-foreground max-h-[200px] overflow-auto whitespace-pre-wrap">
      {truncated || <span className="italic">No response body</span>}
    </div>
  );
};
