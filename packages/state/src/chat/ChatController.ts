import {
  Agent,
  DistriBaseTool,
  DistriClient,
  DistriMessage,
  DistriPart,
  InvokeContext,
  PartMetadata,
  CompactTaskResult,
  ExecutorContextMetadata,
  DistriChatMessage,
  DistriEvent,
  PendingCall,
  convertDistriMessageToA2A,
  isDistriEvent,
} from '@distri/core';
import { ChatStore } from './chatStore';
import { ReplayDeduper } from './durable';

/** Resubscribe attempts after a dropped stream before giving up (durable runs). */
const MAX_RESUBSCRIBES = 3;

/** What one pass over a stream saw. */
interface PumpResult {
  /** The root task's own run_finished / run_error arrived. */
  terminal: boolean;
  /** The transport failed (in-band STREAM_ERROR) rather than the server closing. */
  dropped: boolean;
  /** The dropped transport's message, for onError. */
  dropMessage?: string;
}

interface PumpOptions {
  /** Tool calls on this stream are live (may run). False for replays. */
  live: boolean;
  /** Durable: a dropped root stream is recovered by resubscribing, not processed as an error. */
  durable: boolean;
  /** Remember frames delivered (so a replay can skip them). */
  record?: ReplayDeduper;
  /** Skip frames a previous pass already delivered. */
  replay?: { isReplayed(message: DistriChatMessage): boolean };
  /** Skip frames until the run_parked naming one of these pending calls (reload follow). */
  skipUntilParked?: Set<string>;
}

/**
 * Optional knobs for sendMessage / sendMessageStream.
 *
 * `partsMetadata` mirrors the wire-format `Message.metadata.parts` map: keys
 * are part indices into the `content` array, values are PartMetadata. Used to
 * mark parts as `developer: true` (skipped by chat renderers) or `save: false`
 * (filtered out at DB persist) — see `distri/docs/design/parts-metadata.md`.
 */
export interface SendMessageOptions {
  partsMetadata?: Record<number, PartMetadata>;
  /**
   * Per-send execution metadata merged into the request's
   * `ExecutorContextMetadata` (on top of the chat-level `getMetadata`). Use
   * this to dictate behaviour for a single invocation — e.g. `load_skills` to
   * eagerly preload a skill for this task, or `fork` to dispatch it as an
   * isolated subtask — without making it global to the whole chat.
   */
  metadata?: Partial<ExecutorContextMetadata>;
}

export interface ChatControllerCallbacks {
  onError?: (error: Error) => void;
  getMetadata?: () => Promise<Record<string, unknown>>;
  beforeSendMessage?: (msg: DistriMessage) => Promise<DistriMessage>;
}

/**
 * Send/stream/stop/compact orchestration for a chat session, extracted from
 * `@distri/react`'s `useChat` hook. Framework-agnostic: owns an
 * `AbortController` and drives `agent.invokeStream`, feeding every event back
 * into the store's `processMessage`. Framework packages own only the
 * mutable-context wiring (agent/threadId/tools/callbacks can change across
 * renders) and lifecycle (construct per chat instance, dispose on unmount).
 */
export class ChatController {
  private agent: Agent | null = null;
  private externalTools: DistriBaseTool[] | undefined;
  private threadId: string;
  private callbacks: ChatControllerCallbacks = {};
  private abortController: AbortController | null = null;
  private compacting = false;
  /** Sleep used between resubscribe attempts (tests shorten it). */
  resubscribeDelay: (attempt: number) => Promise<void> = (attempt) =>
    new Promise((r) => setTimeout(r, 500 * attempt));

  constructor(private readonly store: ChatStore, threadId: string) {
    this.threadId = threadId;
  }

  setAgent(agent: Agent | null): void {
    this.agent = agent;
  }

  setExternalTools(tools: DistriBaseTool[] | undefined): void {
    this.externalTools = tools;
  }

  setThreadId(threadId: string): void {
    this.threadId = threadId;
  }

  setCallbacks(callbacks: ChatControllerCallbacks): void {
    this.callbacks = callbacks;
  }

  private createInvokeContext(): InvokeContext {
    const state = this.store.getState();
    return {
      thread_id: this.threadId,
      run_id: state.currentRunId,
      task_id: state.currentTaskId,
      getMetadata: this.callbacks.getMetadata,
    };
  }

  async sendMessage(content: string | DistriPart[], options?: SendMessageOptions): Promise<void> {
    const { agent } = this;
    if (!agent) return;

    const { setLoading, setStreaming, setError, setStreamingIndicator, processMessage, failAllPendingToolCalls } = this.store.getState();

    setLoading(true);
    setStreaming(true);
    setError(null);
    setStreamingIndicator('typing');

    // Cancel any existing stream. This send keeps its own controller: a dispose() or a later send while it awaits
    // replaces `this.abortController`, and must abort this stream rather than leave it reading a null.
    if (this.abortController) {
      this.abortController.abort();
    }
    const ac = new AbortController();
    this.abortController = ac;

    try {
      // Ensure token is fresh before opening the stream
      await agent.client.ensureAccessToken();

      const parts: DistriPart[] = typeof content === 'string'
        ? [{ part_type: 'text', data: content }]
        : content;
      const partsMetadata = options?.partsMetadata;

      let distriMessage = DistriClient.initDistriMessage('user', parts);
      if (partsMetadata && Object.keys(partsMetadata).length > 0) {
        distriMessage.metadata = { ...(distriMessage.metadata ?? {}), parts: partsMetadata };
      }

      // Add user message immediately - not from stream, user initiated
      processMessage(distriMessage, false);

      if (this.callbacks.beforeSendMessage) {
        distriMessage = await this.callbacks.beforeSendMessage(distriMessage);
      }

      const context = this.createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);

      const contextMetadata = await this.callbacks.getMetadata?.() || {};
      // Forward parts_metadata to the request so the backend persists / filters
      // by it (save: false) and downstream consumers see developer flags.
      const requestMetadata: Record<string, unknown> = {
        ...contextMetadata,
        // Per-send metadata (load_skills / fork / …) overrides the chat-level
        // getMetadata for this one invocation.
        ...(options?.metadata ?? {}),
        task_id: this.store.getState().currentTaskId,
      };
      if (partsMetadata && Object.keys(partsMetadata).length > 0) {
        requestMetadata.parts = { ...(contextMetadata.parts as object | undefined ?? {}), ...partsMetadata };
      }
      const durable = await this.refreshDurableRuns(agent);
      // Start streaming
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: requestMetadata,
      }, this.externalTools, undefined, { signal: ac.signal });

      await this.runStream(agent, stream, ac, durable);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stream was cancelled, don't show error
        setStreamingIndicator(undefined);
        setStreaming(false);
        setLoading(false);
        return;
      }
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      this.callbacks.onError?.(error);

      // Fail all pending tool calls so input isn't blocked
      failAllPendingToolCalls(error.message);

      // Clear streaming indicators immediately on error
      setStreamingIndicator(undefined);
      setStreaming(false);
      setLoading(false);
    } finally {
      setStreamingIndicator(undefined);
      setLoading(false);
      setStreaming(false);
      if (this.abortController === ac) this.abortController = null;
    }
  }

  async sendMessageStream(content: string | DistriPart[], role: 'user' | 'tool' = 'user'): Promise<void> {
    const { agent } = this;
    if (!agent) return;

    const { setLoading, setStreaming, setError, setStreamingIndicator, processMessage, failAllPendingToolCalls } = this.store.getState();

    setLoading(true);
    setStreaming(true);
    setError(null);
    setStreamingIndicator('typing');

    // Cancel any existing stream. This send keeps its own controller: a dispose() or a later send while it awaits
    // replaces `this.abortController`, and must abort this stream rather than leave it reading a null.
    if (this.abortController) {
      this.abortController.abort();
    }
    const ac = new AbortController();
    this.abortController = ac;

    try {
      // Ensure token is fresh before opening the stream
      await agent.client.ensureAccessToken();

      const parts: DistriPart[] = typeof content === 'string'
        ? [{ part_type: 'text', data: content }]
        : content;

      const distriMessage = DistriClient.initDistriMessage(role, parts);

      // Add user/tool message immediately - not from stream, user initiated
      processMessage(distriMessage, false);

      const context = this.createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);

      const contextMetadata = await this.callbacks.getMetadata?.() || {};
      const durable = await this.refreshDurableRuns(agent);
      // Start streaming
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: {
          ...contextMetadata,
          task_id: this.store.getState().currentTaskId,
        },
      }, undefined, undefined, { signal: ac.signal });

      await this.runStream(agent, stream, ac, durable);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stream was cancelled, don't show error
        setStreamingIndicator(undefined);
        setStreaming(false);
        setLoading(false);
        return;
      }
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      this.callbacks.onError?.(error);

      // Fail all pending tool calls so input isn't blocked
      failAllPendingToolCalls(error.message);

      // Clear streaming indicators immediately on error
      setStreamingIndicator(undefined);
      setStreaming(false);
      setLoading(false);
    } finally {
      setStreamingIndicator(undefined);
      setLoading(false);
      setStreaming(false);
      if (this.abortController === ac) this.abortController = null;
    }
  }

  /**
   * Durable runs: after a reload (or a reconnect), find this thread's pending
   * client-tool calls and run the ones this chat has a tool for — each claimed
   * first and run at most once. When nothing else is streaming, follow the
   * parked task (`tasks/resubscribe`) so its next segment shows up live.
   * A server without durable runs: does nothing and returns [].
   */
  async recoverPendingCalls(options: { follow?: boolean } = {}): Promise<PendingCall[]> {
    const { agent } = this;
    if (!agent || typeof agent.listPendingCalls !== 'function') return [];
    const durable = await this.refreshDurableRuns(agent);
    if (!durable) return [];

    const calls = (await agent.listPendingCalls({ threadId: this.threadId }))
      .filter((c) => c.status === 'pending');
    if (calls.length === 0) return [];

    const taskId = calls[0].task_id;
    const pending = calls.filter((c) => c.task_id === taskId).map((c) => c.id);
    const state = this.store.getState();
    if (!state.isStreaming) {
      this.store.setState({
        parkedRun: state.parkedRun ?? { taskId, pending },
        currentTaskId: state.currentTaskId ?? taskId,
      });
    }

    const running = this.store.getState().runPendingCalls(calls);

    if (options.follow !== false && !this.abortController && !this.store.getState().isStreaming) {
      void this.followParked(agent, taskId, new Set(pending));
    }
    await running;
    return calls;
  }

  stopStreaming(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    const { failAllPendingToolCalls, setStreamingIndicator, setStreaming, setLoading } = this.store.getState();
    // Fail all pending tool calls so they don't complete after cancel
    // and trigger the agent to restart via completeTool retry
    failAllPendingToolCalls('User cancelled the operation');
    setStreamingIndicator(undefined);
    setStreaming(false);
    setLoading(false);
  }

  async compact(): Promise<CompactTaskResult | undefined> {
    const taskId = this.store.getState().currentTaskId;
    if (!this.agent || !taskId) {
      console.warn('[ChatController] compact() called with no active task — nothing to compact');
      return undefined;
    }
    // Reentrancy guard: a second click (or double-bound handler) would
    // otherwise fire a duplicate POST while the first is still in flight.
    if (this.compacting) return undefined;
    this.compacting = true;
    this.store.setState({ isCompacting: true });
    try {
      const result = await this.agent.compact(taskId);
      // Mirror the compaction event into the store so observers that
      // depend on `compactionEvents` see the result even before the
      // streaming `context_compaction` event arrives (or in case it
      // races past this call after `compacting` has cleared).
      if (result?.compacted && result.tier) {
        this.store.setState(s => ({
          isCompacting: false,
          compactionEvents: [
            ...s.compactionEvents,
            {
              ts: Date.now(),
              before: result.tokens_before ?? 0,
              after: result.tokens_after ?? 0,
              tier: result.tier!,
              source: 'manual' as const,
            },
          ].slice(-50),
        }));
      } else {
        this.store.setState({ isCompacting: false });
      }
      return result;
    } catch (err) {
      // Surface the error so onError handlers can render it, and clear
      // the in-flight flag — the matching context_compaction event will
      // not arrive on failure.
      this.store.setState({ isCompacting: false });
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
      return undefined;
    } finally {
      this.compacting = false;
    }
  }

  /** Ask the agent's client whether the server parks runs; remember it in the store. */
  private async refreshDurableRuns(agent: Agent): Promise<boolean> {
    let durable = false;
    if (typeof agent.supportsDurableRuns === 'function') {
      try {
        durable = await agent.supportsDurableRuns();
      } catch {
        durable = false;
      }
    }
    if (durable !== this.store.getState().durableRuns) this.store.getState().setDurableRuns(durable);
    return durable || this.store.getState().isDurable();
  }

  /**
   * Drive the store from a turn's stream. On a durable server a stream that
   * drops (or closes) before the root task's own terminal event is not the
   * end of the run: resubscribe and continue, skipping what was delivered.
   */
  private async runStream(
    agent: Agent,
    stream: AsyncIterable<DistriChatMessage>,
    ac: AbortController,
    durable: boolean,
  ): Promise<void> {
    const deduper = durable ? new ReplayDeduper() : undefined;
    let result = await this.pump(stream, ac, { live: true, durable, record: deduper });
    if (!durable || result.terminal || ac.signal.aborted) return;

    for (let attempt = 1; attempt <= MAX_RESUBSCRIBES; attempt++) {
      const taskId = this.store.getState().currentTaskId;
      if (!taskId || ac.signal.aborted) return;
      if (attempt > 1 || result.dropped) await this.resubscribeDelay(attempt);
      if (ac.signal.aborted) return;
      result = await this.pump(agent.resubscribe(taskId, { signal: ac.signal }), ac, {
        live: false,
        durable,
        record: deduper,
        replay: deduper!.beginPass(),
      });
      if (result.terminal || ac.signal.aborted) return;
    }
    // Gave up following. The run lives on the server; keep its parked state
    // and pending calls (completeTool still reaches it) and say so.
    const error = new Error(result.dropMessage ?? 'Lost the connection to the run; it continues on the server');
    this.callbacks.onError?.(error);
  }

  /** Follow a parked task after a reload: skip its history, show what comes after the park. */
  private async followParked(agent: Agent, taskId: string, pending: Set<string>): Promise<void> {
    const { setStreaming, setLoading, setStreamingIndicator } = this.store.getState();
    const ac = new AbortController();
    this.abortController = ac;
    setStreaming(true);
    try {
      const deduper = new ReplayDeduper();
      let skipUntilParked: Set<string> | undefined = pending;
      for (let attempt = 0; attempt <= MAX_RESUBSCRIBES; attempt++) {
        if (attempt > 0) await this.resubscribeDelay(attempt);
        if (ac.signal.aborted) return;
        const result = await this.pump(agent.resubscribe(taskId, { signal: ac.signal }), ac, {
          live: false,
          durable: true,
          record: deduper,
          replay: deduper.beginPass(),
          skipUntilParked,
        });
        // After the first pass the park point was delivered (recorded): later
        // passes dedupe against it instead.
        skipUntilParked = undefined;
        if (result.terminal || ac.signal.aborted) return;
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (this.abortController === ac) {
        this.abortController = null;
        setStreamingIndicator(undefined);
        setStreaming(false);
        setLoading(false);
      }
    }
  }

  private async pump(
    stream: AsyncIterable<DistriChatMessage>,
    ac: AbortController,
    opts: PumpOptions,
  ): Promise<PumpResult> {
    const { processMessage } = this.store.getState();
    let terminal = false;
    let dropped = false;
    let dropMessage: string | undefined;
    let skipping = opts.skipUntilParked && opts.skipUntilParked.size > 0 ? opts.skipUntilParked : undefined;

    for await (const event of stream) {
      if (ac.signal.aborted) break;
      const evt = isDistriEvent(event) ? (event as DistriEvent) : undefined;
      const isRoot = !evt?.parentTaskId;

      // The transport failed: Agent turns it into an in-band run_error.
      if (evt?.type === 'run_error' && evt.data.code === 'STREAM_ERROR' && isRoot) {
        if (opts.durable && this.store.getState().currentTaskId) {
          dropped = true;
          dropMessage = evt.data.message;
          break;
        }
      }
      const isTerminal = !!evt && isRoot && (evt.type === 'run_finished' || evt.type === 'run_error');

      if (skipping) {
        const parkedHere = evt?.type === 'run_parked' && evt.data.pending.some((id) => skipping!.has(id));
        // History up to the park point is already on screen. A terminal frame
        // still ends the follow even if the park point never showed up.
        if (!parkedHere && !isTerminal) {
          opts.record?.record(event);
          continue;
        }
        skipping = undefined;
      }
      if (opts.replay?.isReplayed(event)) continue;

      opts.record?.record(event);
      processMessage(event, opts.live);
      if (isTerminal && !(evt?.type === 'run_error' && evt.data.code === 'STREAM_ERROR')) {
        terminal = true;
      }
    }
    return { terminal, dropped, dropMessage };
  }

  /** Abort any in-flight stream. Call on unmount/disposal. */
  dispose(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
