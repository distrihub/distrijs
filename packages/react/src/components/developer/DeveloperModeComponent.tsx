import { useEffect, useRef, useState } from 'react';
import { Activity, ChevronDown, ChevronRight, Gauge, Play, Stethoscope, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatStateStore } from '@/stores/chatStateStore';
import { DeveloperMode, DistriAnyTool } from '@/types';
import { cn } from '@/lib/utils';
import { AgentDefinition } from '@distri/core';
import { ChatSimulation } from './ChatSimulation';

interface DeveloperModeComponentProps {
  developerMode: DeveloperMode;
  threadId: string;
  verbose: boolean;
  onToggleVerbose: () => void;
  diagnoseEnabled: boolean;
  onToggleDiagnose: () => void;
  onOpenTrace?: (threadId: string) => void;
  agentDefinition?: AgentDefinition | null;
  disabled?: boolean;
  triggerClassName?: string;
  triggerIconClassName?: string;
}

export function DeveloperModeComponent({
  developerMode,
  threadId,
  verbose,
  onToggleVerbose,
  diagnoseEnabled,
  onToggleDiagnose,
  onOpenTrace,
  agentDefinition,
  disabled = false,
  triggerClassName,
  triggerIconClassName,
}: DeveloperModeComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [toolsDialogOpen, setToolsDialogOpen] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const externalTools = useChatStateStore(state => state.externalTools);
  const safeExternalTools: DistriAnyTool[] = (externalTools ?? []) as DistriAnyTool[];

  const traceEnabled = Boolean(developerMode.traces) && Boolean(onOpenTrace);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (toolsDialogOpen) {
      setOpen(false);
    }
  }, [toolsDialogOpen]);

  const toggleExpand = (name: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <>
      <TooltipProvider delayDuration={250}>
        <div ref={containerRef} className="relative flex items-center gap-1">
          {open && developerMode.verbosity && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-10 w-10 rounded-full text-muted-foreground hover:text-foreground',
                    verbose && 'bg-[var(--distri-accent,#3b82f6)]/20 text-[var(--distri-accent,#3b82f6)]'
                  )}
                  aria-label="Toggle verbosity"
                  disabled={disabled}
                  onClick={onToggleVerbose}
                >
                  <Gauge className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Verbosity: {verbose ? 'On' : 'Off'}</TooltipContent>
            </Tooltip>
          )}

          {open && developerMode.diagnose && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-10 w-10 rounded-full text-muted-foreground hover:text-foreground',
                    diagnoseEnabled && 'bg-[var(--distri-accent,#3b82f6)]/20 text-[var(--distri-accent,#3b82f6)]'
                  )}
                  aria-label="Toggle diagnose mode"
                  aria-pressed={diagnoseEnabled}
                  disabled={disabled}
                  onClick={onToggleDiagnose}
                >
                  <Stethoscope className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Diagnose: {diagnoseEnabled ? 'On' : 'Off'}</TooltipContent>
            </Tooltip>
          )}

          {open && traceEnabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="View traces"
                  disabled={disabled}
                  onClick={() => onOpenTrace?.(threadId)}
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">View traces</TooltipContent>
            </Tooltip>
          )}

          {open && developerMode.tools && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="View tools"
                  disabled={disabled}
                  onClick={() => setToolsDialogOpen(true)}
                >
                  <Wrench className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">View tools</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 rounded-full text-muted-foreground hover:text-foreground',
                  open && 'bg-accent text-foreground',
                  (verbose || diagnoseEnabled) && 'text-[var(--distri-accent,#3b82f6)]',
                  triggerClassName
                )}
                aria-expanded={open}
                aria-label="Developer mode"
                disabled={disabled}
                onClick={() => setOpen(prev => !prev)}
              >
                <Wrench className={cn('h-3.5 w-3.5', triggerIconClassName)} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Developer mode</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <Dialog open={toolsDialogOpen} onOpenChange={setToolsDialogOpen}>
        <DialogContent className="flex h-[min(80vh,48rem)] w-[min(64rem,calc(100vw-2rem))] max-w-none flex-col overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>External Tools</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {safeExternalTools.length} external tool{safeExternalTools.length === 1 ? '' : 's'} available for this chat.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {safeExternalTools.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No external tools registered.
              </div>
            ) : (
              <div className="space-y-2">
                {safeExternalTools.map((tool) => {
                  const isExpanded = expandedTools.has(tool.name);

                  return (
                    <div
                      key={tool.name}
                      className="overflow-hidden rounded-lg border border-border bg-background"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30"
                        onClick={() => toggleExpand(tool.name)}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate font-mono text-sm font-medium">{tool.name}</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleExpand(tool.name);
                          }}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Simulate
                        </Button>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border bg-muted/20 px-4 py-3">
                          <ChatSimulation
                            tool={tool}
                            threadId={threadId}
                            agentDefinition={agentDefinition}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
