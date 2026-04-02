// packages/react/src/components/renderers/tools/FilePreview.tsx
import React from 'react';
import { ToolCallState } from '@/stores/chatStateStore';

interface FilePreviewProps { state: ToolCallState }

export const FilePreview: React.FC<FilePreviewProps> = ({ state }) => {
  const text = state.result?.parts
    ?.filter((p: any) => p.part_type === 'text')
    .map((p: any) => p.data as string)
    .join('\n') ?? '';

  const lines = text.split('\n').slice(0, 20);
  const truncated = lines.join('\n');
  const hasMore = text.split('\n').length > 20;

  return (
    <div className="max-h-[200px] overflow-auto">
      <pre className="p-3 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">
        {truncated}
        {hasMore && <span className="text-muted-foreground/50">{'\n'}… (truncated)</span>}
      </pre>
    </div>
  );
};
