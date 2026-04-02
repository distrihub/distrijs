// packages/react/src/components/CommandPalette.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { ChatCommand, ChatCommandEvent } from '@/types';

interface CommandPaletteProps {
  commands: ChatCommand[];
  filter: string;
  onSelect: (event: ChatCommandEvent) => void;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands, filter, onSelect, onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = commands.filter(
    (c) => c.id.startsWith(filter.replace(/^\//, '').toLowerCase())
  );

  useEffect(() => setActiveIndex(0), [filter]);

  const execute = useCallback((cmd: ChatCommand) => {
    const newValue = cmd.type === 'toggle' ? !cmd.currentValue : undefined;
    onSelect({
      command: cmd.id,
      value: newValue,
      timestamp: Date.now(),
    });
    onClose();
  }, [onSelect, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); if (filtered[activeIndex]) execute(filtered[activeIndex]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, activeIndex, execute]);

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1.5 rounded-md border border-border bg-popover shadow-lg overflow-hidden z-50">
      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/30">
        Commands
      </div>
      {filtered.map((cmd, i) => (
        <div
          key={cmd.id}
          className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
            i === activeIndex ? 'bg-accent' : 'hover:bg-muted/50'
          }`}
          onClick={() => execute(cmd)}
        >
          <span className="text-base flex-shrink-0">{cmd.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground">
              <span className="text-primary">/</span>{cmd.id}
            </div>
            <div className="text-[11px] text-muted-foreground">{cmd.description}</div>
          </div>
          {cmd.type === 'toggle' && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              cmd.currentValue
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {cmd.currentValue ? 'on' : 'off'}
            </span>
          )}
          {cmd.type === 'action' && (
            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full flex-shrink-0">
              action
            </span>
          )}
          {i === activeIndex && (
            <kbd className="text-[10px] bg-muted text-muted-foreground border border-border rounded px-1 flex-shrink-0">↵</kbd>
          )}
        </div>
      ))}
    </div>
  );
};
