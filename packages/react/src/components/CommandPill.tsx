// packages/react/src/components/CommandPill.tsx
import React from 'react';
import { ChatCommandEvent } from '@/types';

interface CommandPillProps {
  event: ChatCommandEvent;
}

const PILL_CONFIG: Record<string, { label: (v?: boolean) => string; color: string }> = {
  verbose: {
    label: (v) => v ? 'Verbose on — showing rich tool details' : 'Verbose off',
    color: 'bg-accent text-accent-foreground border-accent',
  },
  audio: {
    label: (v) => v ? 'Audio on' : 'Audio off',
    color: 'bg-muted text-muted-foreground border-border',
  },
  reset: {
    label: () => 'Thread reset',
    /* reset uses purple — intentional semantic color, no shadcn token covers this */
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/30 dark:text-purple-400',
  },
};

export const CommandPill: React.FC<CommandPillProps> = ({ event }) => {
  const config = PILL_CONFIG[event.command];
  if (!config) return null;

  const dotColor = event.command === 'reset'
    ? 'bg-purple-500'
    : event.value
      ? 'bg-primary'
      : 'bg-muted-foreground';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
      {config.label(event.value)}
    </div>
  );
};
