import { useState } from 'react';
import { Activity, Gauge, Wrench, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DeveloperMode } from '@/types';
import { ToolsPanel } from './ToolsPanel';

interface DeveloperToolbarProps {
  developerMode: DeveloperMode;
  threadId: string;
  verbose: boolean;
  onToggleVerbose: () => void;
  triggerTool: (toolName: string, input: any) => Promise<void>;
  onOpenTrace?: (threadId: string) => void;
  onDiagnose?: () => Promise<void>;
  disabled?: boolean;
}

export function DeveloperToolbar({
  developerMode,
  threadId,
  verbose,
  onToggleVerbose,
  triggerTool,
  onOpenTrace,
  onDiagnose,
  disabled = false,
}: DeveloperToolbarProps) {
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const traceEnabled = Boolean(developerMode.traces) && Boolean(onOpenTrace);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 px-1 py-0.5">
        <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider mr-1">dev</span>

        {traceEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                disabled={disabled}
                onClick={() => onOpenTrace?.(threadId)}
              >
                <Activity className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>View traces</p></TooltipContent>
          </Tooltip>
        )}

        {developerMode.verbosity && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${verbose ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                disabled={disabled}
                onClick={onToggleVerbose}
              >
                <Gauge className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Toggle verbosity {verbose ? '(on)' : '(off)'}</p></TooltipContent>
          </Tooltip>
        )}

        {developerMode.tools && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${toolsPanelOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  disabled={disabled}
                  onClick={() => setToolsPanelOpen(true)}
                >
                  <Wrench className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>View tools</p></TooltipContent>
            </Tooltip>
            <ToolsPanel
              open={toolsPanelOpen}
              onClose={() => setToolsPanelOpen(false)}
              triggerTool={triggerTool}
            />
          </>
        )}

        {developerMode.diagnose && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${diagnosing ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                disabled={disabled || diagnosing}
                onClick={async () => {
                  if (!onDiagnose) return;
                  try {
                    setDiagnosing(true);
                    await onDiagnose();
                  } finally {
                    setDiagnosing(false);
                  }
                }}
              >
                <Stethoscope className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>{diagnosing ? 'Diagnosing…' : 'Diagnose'}</p></TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
