// packages/react/src/components/renderers/tools/DiffView.tsx
import React from 'react';

interface DiffViewProps {
  diff: string;
}

export function looksLikeDiff(text: string): boolean {
  const lines = text.split('\n').slice(0, 15);
  let count = 0;
  for (const line of lines) {
    if (line.startsWith('+') || line.startsWith('-') || line.startsWith('@@') || line.startsWith('diff ')) {
      count++;
    }
  }
  return count >= 3;
}

export const DiffView: React.FC<DiffViewProps> = ({ diff }) => {
  const lines = diff.split('\n');
  let added = 0;
  let removed = 0;
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) added++;
    if (line.startsWith('-') && !line.startsWith('---')) removed++;
  }

  const fileMatch = diff.match(/^(?:diff --git a\/(.+?) b\/|--- a\/(.+?)$|\+\+\+ b\/(.+?)$)/m);
  const filename = fileMatch?.[1] ?? fileMatch?.[2] ?? fileMatch?.[3];

  return (
    <div className="rounded-md border border-border overflow-hidden">
      {(filename || added > 0 || removed > 0) && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border text-xs text-muted-foreground">
          {filename && <span className="font-mono truncate">{filename}</span>}
          <div className="flex items-center gap-2 ml-auto">
            {added > 0 && <span className="text-green-600 dark:text-green-400">+{added}</span>}
            {removed > 0 && <span className="text-red-500 dark:text-red-400">-{removed}</span>}
          </div>
        </div>
      )}
      {/* Diff line colors (green/red/blue) are intentional semantic diff standards;
          no shadcn token covers this use case — the spec explicitly prescribes these colors. */}
      <div className="overflow-auto max-h-[300px]">
        <pre className="text-[11px] leading-5 p-2 m-0">
          {lines.map((line, i) => {
            let cls = 'px-2 block';
            if (line.startsWith('+') && !line.startsWith('+++')) {
              cls += ' bg-green-500/10 text-green-700 dark:text-green-400';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              cls += ' bg-red-500/10 text-red-700 dark:text-red-400';
            } else if (line.startsWith('@@')) {
              cls += ' text-blue-600 dark:text-blue-400 bg-blue-500/5';
            } else {
              cls += ' text-muted-foreground';
            }
            return <span key={i} className={cls}>{line}</span>;
          })}
        </pre>
      </div>
    </div>
  );
};
