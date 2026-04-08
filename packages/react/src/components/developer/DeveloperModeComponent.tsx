import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ChevronDown, ChevronRight, Gauge, Play, Stethoscope, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatStateStore } from '@/stores/chatStateStore';
import { DeveloperMode, DistriAnyTool } from '@/types';
import { cn } from '@/lib/utils';
import { useDistri } from '@/DistriProvider';
import { AgentDefinition } from '@distri/core';

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

type SimState = {
  comment: string;
  payload: string;
  response: string;
  error: string | null;
  generating: boolean;
  running: boolean;
};

type StoredRun = {
  id: string;
  threadId: string;
  toolName: string;
  timestamp: number;
  comment: string;
  payload: string;
  response: string;
};

const TOOL_RUNS_STORAGE_KEY = 'developer-mode-tool-runs:v1';
const EMPTY_SIM_STATE: SimState = {
  comment: '',
  payload: '',
  response: '',
  error: null,
  generating: false,
  running: false,
};

function extractJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  const jsonText = firstBrace >= 0 && lastBrace > firstBrace
    ? candidate.slice(firstBrace, lastBrace + 1)
    : candidate;
  const parsed = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Generated payload is not a JSON object');
  }
  return parsed as Record<string, unknown>;
}

async function generatePayloadWithLlm(
  client: NonNullable<ReturnType<typeof useDistri>['client']>,
  tool: DistriAnyTool,
  comment: string,
  agentDefinition?: AgentDefinition | null
): Promise<Record<string, unknown>> {
  const instruction = [
    'Generate a reliable JSON payload for invoking this external tool.',
    'Return only a JSON object.',
    'Do not include markdown fences.',
    'The payload must satisfy the provided schema exactly.',
    'Use realistic values.',
    'Use the comment to shape the payload if provided.',
  ].join(' ');

  const toolContext = [
    agentDefinition?.name ? `Current agent: ${agentDefinition.name}` : null,
    agentDefinition?.description ? `Current agent description: ${agentDefinition.description}` : null,
    `Tool name: ${tool.name}`,
    tool.description ? `Tool description: ${tool.description}` : null,
    `Tool schema: ${JSON.stringify(tool.parameters ?? {}, null, 2)}`,
    tool.examples ? `Tool examples: ${tool.examples}` : null,
    comment.trim() ? `User comment: ${comment.trim()}` : 'User comment: none',
  ].filter(Boolean).join('\n\n');

  const response = await client.llm([
    {
      id: `simulate-system-${Date.now()}`,
      role: 'system',
      created_at: Date.now(),
      parts: [{
        part_type: 'text',
        data: [
          instruction,
          agentDefinition?.system_prompt ? `Current agent system prompt:\n${agentDefinition.system_prompt}` : null,
        ].filter(Boolean).join('\n\n'),
      }],
    },
    {
      id: `simulate-user-${Date.now()}`,
      role: 'user',
      created_at: Date.now(),
      parts: [{ part_type: 'text', data: toolContext }],
    },
  ], [], {
    agent_id: agentDefinition?.id,
    model_settings: agentDefinition?.model_settings,
  });

  return extractJsonObject(response.content);
}

function hasFunctionHandler(tool: DistriAnyTool): tool is DistriAnyTool & { type: 'function'; handler: (input: any) => Promise<unknown> } {
  return tool.type === 'function' && typeof (tool as { handler?: unknown }).handler === 'function';
}

function stringifyResult(result: unknown): string {
  if (typeof result === 'string') return result;
  return JSON.stringify(result, null, 2);
}

function loadStoredRuns(): StoredRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TOOL_RUNS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as StoredRun[] : [];
  } catch {
    return [];
  }
}

function saveStoredRuns(runs: StoredRun[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOOL_RUNS_STORAGE_KEY, JSON.stringify(runs.slice(0, 50)));
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
  const { client } = useDistri();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [toolsDialogOpen, setToolsDialogOpen] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [simStates, setSimStates] = useState<Record<string, SimState>>({});
  const [storedRuns, setStoredRuns] = useState<StoredRun[]>([]);
  const externalTools = useChatStateStore(state => state.externalTools);
  const safeExternalTools: DistriAnyTool[] = externalTools ?? [];

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

  useEffect(() => {
    setStoredRuns(loadStoredRuns());
  }, []);

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

  const getSimState = (toolName: string): SimState => simStates[toolName] ?? EMPTY_SIM_STATE;

  const updateSimState = (toolName: string, updates: Partial<SimState>) => {
    setSimStates((prev) => ({
      ...prev,
      [toolName]: {
        ...(prev[toolName] ?? EMPTY_SIM_STATE),
        ...updates,
      },
    }));
  };

  const previousRunsByTool = useMemo(() => {
    const grouped = new Map<string, StoredRun[]>();
    for (const run of storedRuns) {
      const existing = grouped.get(run.toolName) ?? [];
      existing.push(run);
      grouped.set(run.toolName, existing);
    }
    return grouped;
  }, [storedRuns]);

  const persistRun = (run: StoredRun) => {
    setStoredRuns((prev) => {
      const next = [run, ...prev].slice(0, 50);
      saveStoredRuns(next);
      return next;
    });
  };

  const generatePayload = async (tool: DistriAnyTool) => {
    if (!client) {
      updateSimState(tool.name, { error: 'Distri client not available for payload generation' });
      return;
    }

    const state = getSimState(tool.name);
      updateSimState(tool.name, { generating: true, error: null });
    try {
      const payload = await generatePayloadWithLlm(client, tool, state.comment, agentDefinition);
      updateSimState(tool.name, {
        payload: JSON.stringify(payload, null, 2),
        generating: false,
      });
    } catch (error) {
      updateSimState(tool.name, {
        generating: false,
        error: error instanceof Error ? error.message : 'Failed to generate payload',
      });
    }
  };

  const runSimulation = async (tool: DistriAnyTool, payloadText?: string, commentText?: string) => {
    if (!hasFunctionHandler(tool)) {
      updateSimState(tool.name, { error: 'Tool does not have a runnable function handler' });
      return;
    }

    const state = getSimState(tool.name);
    const payloadSource = payloadText ?? state.payload;
    const commentSource = commentText ?? state.comment;

    if (!payloadSource.trim()) {
      updateSimState(tool.name, { error: 'Generate a payload before running the tool' });
      return;
    }

    updateSimState(tool.name, { running: true, error: null });
    try {
      const parsed = JSON.parse(payloadSource);
      const result = await tool.handler(parsed);
      const response = stringifyResult(result);
      updateSimState(tool.name, { running: false, response });
      persistRun({
        id: `${tool.name}-${Date.now()}`,
        threadId,
        toolName: tool.name,
        timestamp: Date.now(),
        comment: commentSource,
        payload: JSON.stringify(parsed, null, 2),
        response,
      });
    } catch (error) {
      updateSimState(tool.name, {
        running: false,
        error: error instanceof Error ? error.message : 'Tool run failed',
      });
    }
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
                  const simState = getSimState(tool.name);
                  const previousRuns = (previousRunsByTool.get(tool.name) ?? []).slice(0, 5);
                  const canRun = hasFunctionHandler(tool);

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
                            if (!isExpanded) toggleExpand(tool.name);
                          }}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Simulate
                        </Button>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border bg-muted/20 px-4 py-3">
                          {tool.description && (
                            <p className="mb-3 text-sm text-muted-foreground">{tool.description}</p>
                          )}

                          <div className="space-y-3">
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">Comment</p>
                              <Textarea
                                value={simState.comment}
                                onChange={(event) => updateSimState(tool.name, { comment: event.target.value })}
                                className="min-h-[72px] resize-y border border-border bg-background text-sm"
                                placeholder="Describe the payload you want to generate."
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!client || simState.generating || simState.running}
                                onClick={() => void generatePayload(tool)}
                              >
                                {simState.generating ? 'Generating…' : 'Generate'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                disabled={!canRun || simState.generating || simState.running}
                                onClick={() => void runSimulation(tool)}
                              >
                                {simState.running ? 'Running…' : 'Run'}
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">Payload</p>
                              <Textarea
                                value={simState.payload}
                                onChange={(event) => updateSimState(tool.name, { payload: event.target.value })}
                                className="min-h-[140px] resize-y border border-border bg-background font-mono text-xs"
                                placeholder="Generate a payload to populate this."
                              />
                            </div>

                            {simState.response ? (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Response</p>
                                <pre className="max-h-60 overflow-auto rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
                                  {simState.response}
                                </pre>
                              </div>
                            ) : null}

                            {simState.error ? (
                              <p className="text-xs text-destructive">{simState.error}</p>
                            ) : null}

                            {previousRuns.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Previous runs</p>
                                <div className="space-y-2">
                                  {previousRuns.map((run) => (
                                    <div
                                      key={run.id}
                                      className="rounded-md border border-border bg-background px-3 py-2"
                                    >
                                      <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className="truncate text-[11px] text-muted-foreground">
                                          {new Date(run.timestamp).toLocaleString()}
                                        </span>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="h-7 px-2 text-[11px]"
                                          disabled={!canRun || simState.generating || simState.running}
                                          onClick={() => {
                                            updateSimState(tool.name, {
                                              comment: run.comment,
                                              payload: run.payload,
                                              response: run.response,
                                              error: null,
                                            });
                                            void runSimulation(tool, run.payload, run.comment);
                                          }}
                                        >
                                          Rerun
                                        </Button>
                                      </div>
                                      {run.comment ? (
                                        <p className="mb-2 text-xs text-muted-foreground">{run.comment}</p>
                                      ) : null}
                                      <pre className="max-h-28 overflow-auto rounded border border-border bg-muted/20 p-2 text-[10px] text-muted-foreground">
                                        {run.payload}
                                      </pre>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
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
