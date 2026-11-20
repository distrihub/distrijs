// packages/react/src/components/renderers/tools/RemoteStatusTag.tsx
import React from 'react';
import { ToolCallState } from '@/stores/chatStateStore';

/**
 * Durable runs: why this window is not the one answering a client tool call —
 * `expired` (the deadline passed; a late result was refused) or `running in
 * another window` (another window holds the claim). Every tool row and card
 * shows it, so a call never looks stuck without saying why.
 */
export const RemoteStatusTag: React.FC<{ state?: ToolCallState }> = ({ state }) => {
  if (state?.remoteStatus === 'expired') {
    return (
      <span
        className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full flex-shrink-0"
        data-testid="tool-row-expired"
      >
        expired
      </span>
    );
  }
  if (state?.remoteStatus === 'running_elsewhere') {
    return (
      <span
        className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full flex-shrink-0"
        data-testid="tool-row-elsewhere"
      >
        running in another window
      </span>
    );
  }
  return null;
};
