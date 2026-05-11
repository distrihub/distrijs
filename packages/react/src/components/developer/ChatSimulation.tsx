import { useEffect, useMemo, useRef, useState } from 'react';
import { Agent, AgentDefinition, DistriClient, DistriPart, convertDistriMessageToA2A, isDistriEvent } from '@distri/core';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDistri } from '@/DistriProvider';
import { DistriAnyTool } from '@/types';
import { cn } from '@/lib/utils';

type SimulationRun = {
  id: string;
  toolName: string;
  threadId: string;
  timestamp: number;
  comment: string;
  payload: string;
  response: string;
};

type ChatSimulationProps = {
  tool: DistriAnyTool;
  threadId: string;
  agentDefinition?: AgentDefinition | null;
};

type TabKey = 'details' | 'simulate';

const DB_NAME = 'distri-developer-mode';
const DB_VERSION = 1;
const STORE_NAME = 'tool-simulations';
const TOOL_THREAD_INDEX = 'by_tool_thread';
const DEFAULT_SIMULATION_AGENT_ID = 'distri';
const SIMULATE_OUTPUT_TOOL_NAME = 'simulate_output';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex(TOOL_THREAD_INDEX, 'toolThreadKey', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
  return dbPromise;
}

async function getRuns(toolName: string, threadId: string): Promise<SimulationRun[]> {
  if (typeof window === 'undefined' || !window.indexedDB) return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index(TOOL_THREAD_INDEX);
    const request = index.getAll(`${threadId}:${toolName}`);
    request.onsuccess = () => {
      const rows = (request.result as Array<SimulationRun & { toolThreadKey: string }>)
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(({ toolThreadKey: _ignored, ...run }) => run);
      resolve(rows);
    };
    request.onerror = () => reject(request.error ?? new Error('Failed to read simulations'));
  });
}

async function saveRun(run: SimulationRun): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ ...run, toolThreadKey: `${run.threadId}:${run.toolName}` });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save simulation'));
  });
}

async function deleteRun(id: string): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to delete simulation'));
  });
}

function buildAgentContextSnapshot(agentDefinition?: AgentDefinition | null): Record<string, unknown> | null {
  if (!agentDefinition) return null;

  return {
    name: agentDefinition.name,
    description: agentDefinition.description,
    instructions: 'instructions' in agentDefinition ? agentDefinition.instructions : undefined,
    model: 'model' in agentDefinition ? agentDefinition.model : undefined,
    model_settings: 'model_settings' in agentDefinition ? agentDefinition.model_settings : undefined,
    tools: 'tools' in agentDefinition ? agentDefinition.tools : undefined,
    skills_description: 'skills_description' in agentDefinition ? agentDefinition.skills_description : undefined,
    available_skills: 'available_skills' in agentDefinition ? agentDefinition.available_skills : undefined,
  };
}

async function generatePayloadWithAgent(
  client: DistriClient,
  tool: DistriAnyTool,
  threadId: string,
  comment: string,
  agentDefinition?: AgentDefinition | null,
  onStreamReady?: (stream: AsyncGenerator<any>) => void,
  isCancelled?: () => boolean
): Promise<Record<string, unknown>> {
  const agent = await Agent.create(agentDefinition ?? DEFAULT_SIMULATION_AGENT_ID, client);
  const effectiveAgentDefinition = buildAgentContextSnapshot(agentDefinition ?? agent.getDefinition());
  const simulationThreadId = `${threadId}:tool-simulation:${tool.name}`;
  const simulateOutputTool = {
    type: 'function' as const,
    name: SIMULATE_OUTPUT_TOOL_NAME,
    description: 'Return the final simulated payload for a tool invocation. Call this exactly once with the payload object to use.',
    parameters: {
      type: 'object',
      properties: {
        payload: {
          type: 'object',
          description: 'The final payload to run for the target tool.'
        },
        notes: {
          type: 'string',
          description: 'Optional short note about why this payload was chosen.'
        }
      },
      required: ['payload']
    },
    is_final: true,
    handler: async () => ({ ok: true }),
  };
  const prompt = [
    'Use the `distri-simulation` skill.',
    'Use the `distri-developer-debug` skill if you need recent context, traces, or thread-level debugging context.',
    'You may inspect context, read files, and run tools before deciding on the final payload.',
    'Do not execute the target tool while generating the payload.',
    'Generate a reliable JSON payload for invoking this external tool.',
    `Call \`${SIMULATE_OUTPUT_TOOL_NAME}\` exactly once with the final payload.`,
    'Do not return the payload as assistant text.',
    'The payload passed to the tool must satisfy the provided schema exactly.',
    '',
    `Source threadId: ${threadId}`,
    `Simulation threadId: ${simulationThreadId}`,
    `Tool name: ${tool.name}`,
    tool.description ? `Tool description: ${tool.description}` : '',
    `Tool schema: ${JSON.stringify(tool.parameters ?? {}, null, 2)}`,
    tool.examples ? `Tool examples: ${tool.examples}` : '',
    effectiveAgentDefinition ? `Current agent definition context: ${JSON.stringify(effectiveAgentDefinition, null, 2)}` : '',
    comment.trim() ? `User comment: ${comment.trim()}` : 'User comment: none',
  ].filter(Boolean).join('\n\n');

  const distriMessage = {
    id: `simulate-user-${Date.now()}`,
    role: 'user' as const,
    created_at: Date.now(),
    parts: [{ part_type: 'text', data: prompt } as DistriPart],
  };

  const a2aMessage = convertDistriMessageToA2A(distriMessage, {
    thread_id: simulationThreadId,
  });

  const stream = await agent.invokeStream({
    message: a2aMessage,
    metadata: {
      simulation: true,
      tool_name: tool.name,
      source_thread_id: threadId,
      simulation_thread_id: simulationThreadId,
      agent_id: agentDefinition?.name ?? agent.name,
      current_agent_definition: effectiveAgentDefinition,
      model_settings: agentDefinition?.model_settings,
      developer_mode: {
        kind: 'simulate',
        tool_name: tool.name,
        source_thread_id: threadId,
        target_thread_id: simulationThreadId,
        agent_id: agentDefinition?.name ?? agent.name,
      },
    },
  }, [simulateOutputTool]);

  onStreamReady?.(stream);

  for await (const event of stream) {
    if (isCancelled?.()) {
      break;
    }
    if (!isDistriEvent(event)) {
      continue;
    }
    if (event.type === 'run_error') {
      throw new Error(event.data.message);
    }
    if (event.type === 'tool_calls' && Array.isArray(event.data.tool_calls)) {
      const simulateCall = event.data.tool_calls.find((toolCall) => toolCall.tool_name === SIMULATE_OUTPUT_TOOL_NAME);
      if (!simulateCall) {
        continue;
      }
      const payloadCandidate = simulateCall.input?.payload;
      if (!payloadCandidate || typeof payloadCandidate !== 'object' || Array.isArray(payloadCandidate)) {
        throw new Error('Simulation agent called simulate_output without a valid payload object');
      }
      return payloadCandidate as Record<string, unknown>;
    }
  }

  if (isCancelled?.()) {
    throw new Error('Simulation cancelled');
  }

  throw new Error(`Simulation agent did not call ${SIMULATE_OUTPUT_TOOL_NAME}`);
}

function stringifyResult(result: unknown): string {
  if (typeof result === 'string') return result;
  return JSON.stringify(result, null, 2);
}

function hasFunctionHandler(tool: DistriAnyTool): tool is DistriAnyTool & { type: 'function'; handler: (input: any) => Promise<unknown> } {
  return tool.type === 'function' && typeof (tool as { handler?: unknown }).handler === 'function';
}

export function ChatSimulation({ tool, threadId, agentDefinition }: ChatSimulationProps) {
  const { client } = useDistri();
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [comment, setComment] = useState('');
  const [payload, setPayload] = useState('');
  const [response, setResponse] = useState('');
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const generationStreamRef = useRef<AsyncGenerator<any> | null>(null);
  const generationCancelledRef = useRef(false);

  useEffect(() => {
    void getRuns(tool.name, threadId).then(setRuns).catch(() => setRuns([]));
  }, [threadId, tool.name]);

  const canRun = hasFunctionHandler(tool);
  const schemaPreview = useMemo(() => JSON.stringify(tool.parameters ?? {}, null, 2), [tool.parameters]);

  const refreshRuns = async (preferredRunId?: string) => {
    const next = await getRuns(tool.name, threadId);
    if (preferredRunId) {
      next.sort((a, b) => {
        if (a.id === preferredRunId) return -1;
        if (b.id === preferredRunId) return 1;
        return b.timestamp - a.timestamp;
      });
    }
    setRuns(next);
  };

  const handleGenerate = async () => {
    if (!client) {
      setError('Distri client not available for payload generation');
      return;
    }
    generationCancelledRef.current = false;
    setGenerating(true);
    setError(null);
    try {
      const nextPayload = await generatePayloadWithAgent(
        client,
        tool,
        threadId,
        comment,
        agentDefinition,
        (stream) => {
          generationStreamRef.current = stream;
        },
        () => generationCancelledRef.current
      );
      setPayload(JSON.stringify(nextPayload, null, 2));
      setActiveTab('simulate');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate payload';
      if (message !== 'Simulation cancelled') {
        setError(message);
      }
    } finally {
      generationStreamRef.current = null;
      setGenerating(false);
    }
  };

  const handleStopGenerate = async () => {
    generationCancelledRef.current = true;
    const stream = generationStreamRef.current;
    generationStreamRef.current = null;
    try {
      await stream?.return?.(undefined);
    } catch {
      // Ignore close failures from the underlying transport.
    } finally {
      setGenerating(false);
    }
  };

  const handleRun = async (payloadOverride?: string, commentOverride?: string, existingRunId?: string) => {
    if (!canRun) {
      setError('Tool does not have a runnable function handler');
      return;
    }
    const payloadSource = payloadOverride ?? payload;
    const commentSource = commentOverride ?? comment;
    if (!payloadSource.trim()) {
      setError('Generate a payload before running the tool');
      return;
    }

    setRunning(true);
    setError(null);
    try {
      const parsed = JSON.parse(payloadSource);
      const result = await tool.handler(parsed);
      const nextResponse = stringifyResult(result);
      setPayload(JSON.stringify(parsed, null, 2));
      setComment(commentSource);
      setResponse(nextResponse);

      const runId = existingRunId ?? `${tool.name}-${Date.now()}`;
      await saveRun({
        id: runId,
        toolName: tool.name,
        threadId,
        timestamp: Date.now(),
        comment: commentSource,
        payload: JSON.stringify(parsed, null, 2),
        response: nextResponse,
      });
      await refreshRuns(runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tool run failed');
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRun(id);
    await refreshRuns();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          className={cn(
            'px-2 py-1.5 text-xs',
            activeTab === 'details' ? 'border-b border-foreground text-foreground' : 'text-muted-foreground'
          )}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          type="button"
          className={cn(
            'px-2 py-1.5 text-xs',
            activeTab === 'simulate' ? 'border-b border-foreground text-foreground' : 'text-muted-foreground'
          )}
          onClick={() => setActiveTab('simulate')}
        >
          Simulate
        </button>
      </div>

      {activeTab === 'details' ? (
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="font-mono text-sm">{tool.name}</div>
          </div>
          {tool.description ? (
            <div>
              <div className="text-xs text-muted-foreground">Description</div>
              <div className="text-sm text-muted-foreground">{tool.description}</div>
            </div>
          ) : null}
          <div>
            <div className="text-xs text-muted-foreground">Schema</div>
            <pre className="max-h-72 overflow-auto rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
              {schemaPreview}
            </pre>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Comment</div>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="min-h-[72px] resize-y border border-border bg-background text-sm"
              placeholder="Describe the payload you want to generate."
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!client || generating || running}
              onClick={() => void handleGenerate()}
            >
              {generating ? 'Generating…' : 'Generate'}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canRun || generating || running}
              onClick={() => void handleRun()}
            >
              {running ? 'Running…' : 'Run'}
            </Button>
            {generating ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void handleStopGenerate()}
              >
                Stop
              </Button>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Payload</div>
            <Textarea
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
              className="min-h-[140px] resize-y border border-border bg-background font-mono text-xs"
              placeholder="Generate a payload to populate this."
            />
          </div>

          {response ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Response</div>
              <pre className="max-h-72 overflow-auto rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
                {response}
              </pre>
            </div>
          ) : null}

          {error ? <div className="text-xs text-destructive">{error}</div> : null}

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Latest simulations</div>
            {runs.length === 0 ? (
              <div className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                No saved simulations yet.
              </div>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => (
                  <div key={run.id} className="rounded-md border border-border bg-background px-3 py-2">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(run.timestamp).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          disabled={!canRun || running || generating}
                          onClick={() => {
                            setComment(run.comment);
                            setPayload(run.payload);
                            setResponse(run.response);
                            void handleRun(run.payload, run.comment, run.id);
                          }}
                        >
                          Rerun
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => void handleDelete(run.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {run.comment ? (
                      <div className="mb-2 text-xs text-muted-foreground">{run.comment}</div>
                    ) : null}
                    <div className="grid gap-2 md:grid-cols-2">
                      <pre className="max-h-28 overflow-auto rounded border border-border bg-muted/20 p-2 text-[10px] text-muted-foreground">
                        {run.payload}
                      </pre>
                      <pre className="max-h-28 overflow-auto rounded border border-border bg-muted/20 p-2 text-[10px] text-muted-foreground">
                        {run.response}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
