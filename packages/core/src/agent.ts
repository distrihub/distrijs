import { DistriClient } from './distri-client';
import {
  DistriBaseTool,
  DistriChatMessage,
  DistriError,
  ToolResult,
  HookHandler,
  AgentConfigWithTools,
  DynamicMetadata,
  ExecutorContextMetadata,
  TraceContext,
} from './types';
import { Message, MessageSendParams } from '@a2a-js/sdk';
import { A2AStreamDecoder } from './encoder';
import { AgentCard, AgentDescriptor, AgentVersion, agentDescriptorFromCard, agentRef, hasExtension, parseAgentRef } from './a2a';
import { RunErrorEvent } from './events';
import { clientToolRegistry } from './tool-registry';
import { ClaimPendingCallResult, CompleteToolOutcome, PendingCall } from './durable-runs';

/**
 * Configuration for Agent invoke method
 */
export interface InvokeConfig {
  /** Configuration for the message */
  configuration?: MessageSendParams['configuration'];
  /** Context/thread ID */
  contextId?: string;
  /** Metadata for the requests */
  metadata?: any;
  /** Dynamic prompt sections injected into the template per-call */
  dynamic_sections?: DynamicMetadata['dynamic_sections'];
  /** Dynamic key-value pairs available in templates per-call */
  dynamic_values?: DynamicMetadata['dynamic_values'];
  /** Per-part metadata indexed by part position (0-based).
   *  Use to control which parts are saved to the database.
   *  Parts with `save: false` will be filtered out before saving. */
  parts?: DynamicMetadata['parts'];
  /** Arbitrary search tags forwarded as `metadata.tags`. */
  tags?: Record<string, string>;
  /** Inbound distributed trace context forwarded as `metadata.trace_context`. */
  trace_context?: TraceContext;
}

/**
 * Result from agent invoke
 */
export interface InvokeResult {
  /** Final response message */
  message?: Message;
  /** Task if created */
  task?: any;
  /** Whether the response was streamed */
  streamed: boolean;
}

export interface ExternalToolValidationResult {
  isValid: boolean;
  requiredTools: string[];
  providedTools: string[];
  missingTools: string[];
  message?: string;
}

export class ExternalToolValidationError extends DistriError {
  missingTools: string[];
  requiredTools: string[];
  providedTools: string[];
  agentName: string;

  constructor(agentName: string, result: ExternalToolValidationResult) {
    super(
      result.message || 'Missing required external tools for agent invocation.',
      'EXTERNAL_TOOL_VALIDATION_ERROR',
      {
        agentName,
        missingTools: result.missingTools,
        requiredTools: result.requiredTools,
        providedTools: result.providedTools,
      }
    );
    this.name = 'ExternalToolValidationError';
    this.agentName = agentName;
    this.missingTools = result.missingTools;
    this.requiredTools = result.requiredTools;
    this.providedTools = result.providedTools;
  }
}

/**
 * What an Agent is built from: an A2A card (runtime clients — the public
 * descriptor), or a definition a developer surface already holds.
 */
export type AgentSource = AgentConfigWithTools | { card: AgentCard; id?: string; version?: AgentVersion };

/** Options for {@link Agent.create}. */
export interface AgentCreateOptions {
  /**
   * Run a saved version: its number, or `'latest'` (the current definition).
   * Omitted means the latest. Overrides a version written in the id (`name@N`).
   */
  version?: AgentVersion;
}

function isCardSource(source: AgentSource): source is { card: AgentCard; id?: string; version?: AgentVersion } {
  return !!source && typeof source === 'object' && 'card' in source && !!(source as { card?: unknown }).card;
}

/** The descriptor a definition implies (same rules as the server's `AgentDescriptor::of`). */
function descriptorFromDefinition(def: AgentConfigWithTools): AgentDescriptor {
  const root = def as any;
  const toolConfig = [root, root?.agent, root?.definition]
    .map((c) => c?.tools)
    .find((t) => t && !Array.isArray(t) && typeof t === 'object');
  const external: unknown[] = Array.isArray(toolConfig?.external) ? toolConfig.external : [];
  return {
    agent_type: typeof root?.agent_type === 'string' ? root.agent_type : 'standard_agent',
    external_tools: external.filter((t): t is string => typeof t === 'string' && t.trim().length > 0 && t !== '*'),
    any_tool: external.includes('*'),
    ...(typeof root?.runtime === 'string' ? { runtime: root.runtime } : {}),
    browser_streaming: Boolean(root?.browser_config?.enabled),
  };
}

/**
 * Enhanced Agent class with simple tool system following AG-UI pattern.
 *
 * Agents are *used*, not read: {@link Agent.create} builds one from the A2A
 * card (`GET /agents/{id}/.well-known/agent-card.json`) and its `agent`
 * extension (type, the client tools it expects, browser streaming), which an
 * end-user token can read. The definition (instructions, tools, model) is a
 * developer API: {@link getDefinition}.
 */
export class Agent {
  readonly client: DistriClient;
  /** The agent's id: its bare name (never `name@N`). */
  readonly id: string;
  /**
   * The reference every per-agent call addresses: `name`, or `name@N` /
   * `name@latest` when a version was asked for (see `agentRef`).
   */
  readonly ref: string;
  /** The A2A card, when the agent was built from one. */
  readonly card?: AgentCard;
  /** How to use the agent: from the card's `agent` extension (or the definition). */
  readonly descriptor: AgentDescriptor;
  private definition?: AgentConfigWithTools;
  private definitionRequest?: Promise<AgentConfigWithTools>;
  private hookHandlers: Map<string, HookHandler> = new Map();
  private defaultHookHandler: HookHandler | null = null;

  constructor(source: AgentSource, client: DistriClient) {
    this.client = client;
    if (isCardSource(source)) {
      this.card = source.card;
      const given = source.id ?? source.card.name;
      let parsed: { name: string; version?: AgentVersion };
      try {
        parsed = parseAgentRef(given);
      } catch {
        parsed = { name: given }; // not a reference (e.g. an unnamed card): address it as given
      }
      this.id = parsed.name;
      const version = source.version ?? parsed.version;
      this.ref = version === undefined ? parsed.name : agentRef(parsed.name, version);
      this.descriptor = agentDescriptorFromCard(source.card) ?? {
        agent_type: 'standard_agent',
        external_tools: [],
        any_tool: false,
        browser_streaming: false,
      };
    } else {
      this.definition = source;
      this.id = source.name;
      this.ref = source.name;
      this.descriptor = descriptorFromDefinition(source);
    }
  }

  get name(): string {
    return this.id;
  }

  /**
   * The saved version this agent runs: the card's `agent` extension
   * `version_no` (the pinned one for `name@N`, the latest otherwise).
   * Undefined when the server does not version agents.
   */
  get version(): number | undefined {
    return this.descriptor.version_no;
  }

  get description(): string | undefined {
    return this.card ? this.card.description : this.definition?.description;
  }

  get agentType(): string | undefined {
    return this.descriptor.agent_type;
  }

  get iconUrl(): string | undefined {
    return this.card ? this.card.iconUrl : this.definition?.icon_url;
  }

  /** The agent streams a browser session (descriptor `browser_streaming`). */
  get browserStreaming(): boolean {
    return this.descriptor.browser_streaming;
  }

  /**
   * The agent's definition — a developer call (`GET /agents/{id}`, needs the
   * developer permission; end-user tokens get 403). Returns the definition
   * the agent was built from, if any. Runtime paths never call this.
   */
  async getDefinition(): Promise<AgentConfigWithTools> {
    if (this.definition) return this.definition;
    if (!this.definitionRequest) {
      this.definitionRequest = this.client.getAgent(this.id).then((def) => {
        this.definition = def;
        return def;
      });
      this.definitionRequest.catch(() => { this.definitionRequest = undefined; });
    }
    return this.definitionRequest;
  }

  /**
   * Fetch messages for a thread (public method for useChat)
   */
  async getThreadMessages(threadId: string): Promise<Message[]> {
    return this.client.getThreadMessages(threadId);
  }

  /**
   * Direct (non-streaming) invoke
   */
  public async invoke(params: MessageSendParams, tools?: DistriBaseTool[], hooks?: Record<string, HookHandler>): Promise<Message> {
    if (hooks) {
      this.registerHooks(hooks);
    }
    // Inject tool definitions into metadata
    const enhancedParams = this.enhanceParamsWithTools(params, tools);
    return await this.client.sendMessage(this.ref, enhancedParams) as Message;
  }

  /**
   * Streaming invoke
   */
  public async invokeStream(
    params: MessageSendParams,
    tools?: DistriBaseTool[],
    hooks?: Record<string, HookHandler>,
    options?: { signal?: AbortSignal },
  ): Promise<AsyncGenerator<DistriChatMessage>> {
    if (hooks) {
      this.registerHooks(hooks);
    }
    // Inject tool definitions into metadata
    const enhancedParams = this.enhanceParamsWithTools(params, tools);
    // The stream mode follows what the server activated: with `event-stream`
    // the envelopes drive the events, without it the standard frames do.
    let decoder: A2AStreamDecoder | undefined;
    const a2aStream = this.client.sendMessageStream(this.ref, enhancedParams, {
      ...options,
      onActivated: (uris) => { decoder = new A2AStreamDecoder({ eventStream: hasExtension(uris, 'event-stream') }); },
    });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return (async function* () {
      try {
        for await (const event of a2aStream) {
          decoder ??= new A2AStreamDecoder({ eventStream: true });
          for (const converted of decoder.decode(event)) {
            if ((converted as any).type === 'inline_hook_requested') {
              const hookReq: any = (converted as any).data;
              const handler =
                self.hookHandlers.get(hookReq.hook) ||
                self.defaultHookHandler;
              if (handler) {
                try {
                  const mutation = await handler(hookReq);
                  await self.client.completeInlineHook(hookReq.hook_id, mutation);
                } catch (err) {
                  await self.client.completeInlineHook(hookReq.hook_id, { dynamic_values: {} });
                }
              } else {
                await self.client.completeInlineHook(hookReq.hook_id, { dynamic_values: {} });
              }
              yield converted;
            } else {
              yield converted;
            }
          }
        }
      } catch (error) {
        // Convert stream errors to RunErrorEvent so the UI displays them in-chat
        const message = error instanceof Error ? error.message : String(error);
        const runError: RunErrorEvent = {
          type: 'run_error',
          data: {
            message,
            code: 'STREAM_ERROR',
          },
        };
        yield runError;
      }
    })();
  }

  /**
   * Read-only follow of an existing task via A2A `tasks/resubscribe`.
   *
   * The read-only twin of {@link invokeStream}: it opens no new turn and sends
   * nothing. It re-attaches to `taskId`, replays the server-side event log,
   * follows the live tail, and (for an already-finished task) receives a
   * synthesized terminal status. Each raw A2A frame is decoded via
   * `decodeA2AStreamEvent` and yielded as a `DistriChatMessage`.
   *
   * Unlike `invokeStream`, this performs NO side effects — it never completes
   * inline hooks or external tools. Following is strictly observational; the
   * task's own owner (the live turn, elsewhere) drives it.
   *
   * Abort is cooperative: break out of the `for await` loop (e.g. on an
   * `AbortSignal`) to return the generator and close the underlying stream.
   */
  public async *resubscribe(taskId: string, opts?: { signal?: AbortSignal }): AsyncGenerator<DistriChatMessage> {
    let decoder: A2AStreamDecoder | undefined;
    const a2aStream = this.client.resubscribeTask(this.ref, taskId, {
      ...opts,
      onActivated: (uris) => { decoder = new A2AStreamDecoder({ eventStream: hasExtension(uris, 'event-stream') }); },
    });
    try {
      for await (const event of a2aStream) {
        decoder ??= new A2AStreamDecoder({ eventStream: true });
        for (const converted of decoder.decode(event)) yield converted;
      }
    } catch (error) {
      // Mirror invokeStream: surface stream errors in-band so read-only UIs
      // render them as a run_error instead of throwing out of the loop.
      const message = error instanceof Error ? error.message : String(error);
      const runError: RunErrorEvent = {
        type: 'run_error',
        data: { message, code: 'STREAM_ERROR' },
      };
      yield runError;
    }
  }

  /**
   * Validate that required external tools are registered before invoking.
   */
  public validateExternalTools(tools: DistriBaseTool[] = []): ExternalToolValidationResult {
    const requiredTools = this.getRequiredExternalTools();
    const providedTools = tools.map((tool) => tool.name);

    if (requiredTools.length === 0) {
      return {
        isValid: true,
        requiredTools: [],
        providedTools,
        missingTools: [],
      };
    }

    const providedSet = new Set(providedTools);
    const missingTools = requiredTools.filter((tool) => !providedSet.has(tool));
    const isValid = missingTools.length === 0;

    return {
      isValid,
      requiredTools,
      providedTools,
      missingTools,
      message: isValid
        ? undefined
        : this.formatExternalToolValidationMessage(requiredTools, missingTools),
    };
  }

  /**
   * Enhance message params with tool definitions and dynamic metadata.
   *
   * When `dynamic_sections` or `dynamic_values` are present in `params.metadata`,
   * they are forwarded so the server injects them into the prompt template.
   */
  private enhanceParamsWithTools(params: MessageSendParams, tools?: DistriBaseTool[]): MessageSendParams {
    const mergedTools = this.mergeWithRegisteredTools(tools);
    this.assertExternalTools(mergedTools);
    const existingMeta = (params.metadata ?? {}) as Partial<ExecutorContextMetadata>;
    const metadata: ExecutorContextMetadata = {
      ...existingMeta,
      runtime_mode: 'browser',
      external_tools: mergedTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        is_final: tool.is_final,
      })),
    };

    return {
      ...params,
      metadata: metadata as Record<string, unknown>,
    };
  }

  /**
   * Merge caller-supplied tools with whatever's been registered process-wide
   * in `clientToolRegistry` (e.g. browser IndexedDB tools registered once at
   * app bootstrap). Explicit tools win on a name collision — a caller that
   * passes its own `db_get` overrides the registered one.
   */
  private mergeWithRegisteredTools(tools?: DistriBaseTool[]): DistriBaseTool[] {
    const registered = clientToolRegistry.getTools();
    if (registered.length === 0) {
      return tools ?? [];
    }
    const explicit = tools ?? [];
    const explicitNames = new Set(explicit.map(tool => tool.name));
    const merged = [...explicit];
    for (const tool of registered) {
      if (!explicitNames.has(tool.name)) {
        merged.push(tool);
      }
    }
    return merged;
  }

  private assertExternalTools(tools?: DistriBaseTool[]) {
    const result = this.validateExternalTools(tools ?? []);
    if (!result.isValid) {
      throw new ExternalToolValidationError(this.id, result);
    }
  }

  /** Client tools the agent expects (descriptor); none when it accepts any. */
  private getRequiredExternalTools(): string[] {
    if (this.descriptor.any_tool) return [];
    return this.descriptor.external_tools;
  }

  private formatExternalToolValidationMessage(_requiredTools: string[], missingTools: string[]): string {
    const missingList = missingTools.join(', ');
    return `Agent has external tools that are not registered: ${missingList}.`;
  }

  /**
   * Register multiple hooks at once.
   */
  registerHooks(hooks: Record<string, HookHandler>, defaultHandler?: HookHandler) {
    Object.entries(hooks).forEach(([hook, handler]) => {
      this.hookHandlers.set(hook, handler);
    });
    if (defaultHandler) {
      this.defaultHookHandler = defaultHandler;
    }
  }


  /**
   * Create an agent from its id — built from the A2A card
   * (`GET /agents/{id}/.well-known/agent-card.json`), which an end-user token
   * can read; `GET /agents/{id}` is never called. A definition passed in
   * (developer surfaces) is used as is.
   *
   * A saved version is run with `{ version: N }` (or `'latest'`), or an id
   * written as `name@N`: the pinned card and endpoint (`/agents/name@N`) are
   * used for every call, and `agent.version` is the card's `version_no`.
   */
  static async create(
    agentIdOrDef: string | AgentConfigWithTools,
    client: DistriClient,
    options: AgentCreateOptions = {},
  ): Promise<Agent> {
    if (typeof agentIdOrDef !== 'string') return new Agent(agentIdOrDef, client);
    const parsed = parseAgentRef(agentIdOrDef);
    const ref = agentRef(parsed.name, options.version ?? parsed.version);
    const card = await client.getCachedAgentCard(ref);
    return Agent.fromCard(card, client, ref);
  }

  /** An agent from its A2A card (`id` defaults to the card's name; it may be a `name@N` reference). */
  static fromCard(card: AgentCard, client: DistriClient, id?: string): Agent {
    return new Agent({ card, id }, client);
  }

  /**
   * Complete an external tool call by sending the result back to the server
   */
  async completeTool(result: ToolResult): Promise<CompleteToolOutcome> {
    return this.client.completeTool(this.ref, result);
  }

  /** Whether the server runs this agent durably (`durable_runs`, see DistriClient). */
  async supportsDurableRuns(): Promise<boolean> {
    return this.client.supportsDurableRuns(this.ref);
  }

  /** Pending calls (waits) of a thread's or a task's parked runs. */
  async listPendingCalls(target: { threadId: string } | { taskId: string }): Promise<PendingCall[]> {
    return this.client.listPendingCalls(target);
  }

  /** Claim a pending call before running it; `claimed: false` means another window has it. */
  async claimPendingCall(id: string, instanceId: string): Promise<ClaimPendingCallResult> {
    return this.client.claimPendingCall(id, instanceId);
  }

  /**
   * Manually compact the conversation history for `taskId`. Thin wrapper
   * over `DistriClient.compactTask()` — see that method for behavior.
   */
  async compact(taskId: string) {
    return this.client.compactTask(taskId);
  }

  /**
   * List the agents the caller can use, from their cards (`GET /agents/cards`).
   */
  static async list(client: DistriClient): Promise<Agent[]> {
    const cards = await client.getAgentCards();
    return cards.map((card) => Agent.fromCard(card, client));
  }
}
