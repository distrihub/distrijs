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
  convertDistriMessageToA2A,
} from '@distri/core';
import { ChatStore } from './chatStore';

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

    // Cancel any existing stream
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

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
      // Start streaming
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: requestMetadata,
      }, this.externalTools);

      for await (const event of stream) {
        if (this.abortController?.signal.aborted) {
          break;
        }
        processMessage(event, true);
      }
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
      this.abortController = null;
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

    // Cancel any existing stream
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

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
      // Start streaming
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: {
          ...contextMetadata,
          task_id: this.store.getState().currentTaskId,
        },
      });

      for await (const event of stream) {
        if (this.abortController?.signal.aborted) {
          break;
        }
        processMessage(event, true);
      }
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
      this.abortController = null;
    }
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

  /** Abort any in-flight stream. Call on unmount/disposal. */
  dispose(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
