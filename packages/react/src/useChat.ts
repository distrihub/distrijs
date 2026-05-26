import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Agent, DistriBaseTool, DistriChatMessage, DistriClient, DistriMessage, ToolExecutionOptions, PartMetadata } from '@distri/core';
import {
  DistriPart,
  InvokeContext,
  convertDistriMessageToA2A,
} from '@distri/core';

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
}
import { useChatStateStore } from './stores/chatStateStore';
import { DistriAnyTool } from './types';

export interface UseChatOptions {
  threadId: string;
  agent: Agent | null;
  onMessage?: (message: DistriChatMessage) => void;
  onError?: (error: Error) => void;
  // Ability to override metadata for the stream
  getMetadata?: () => Promise<Record<string, unknown>>;
  externalTools?: DistriBaseTool[];
  executionOptions?: ToolExecutionOptions;
  initialMessages?: (DistriChatMessage)[];
  beforeSendMessage?: (msg: DistriMessage) => Promise<DistriMessage>;
}

export interface UseChatReturn {
  messages: (DistriChatMessage)[];
  isStreaming: boolean;
  sendMessage: (content: string | DistriPart[], options?: SendMessageOptions) => Promise<void>;
  sendMessageStream: (content: string | DistriPart[], role?: 'user' | 'tool') => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  hasPendingToolCalls: () => boolean;
  stopStreaming: () => void;
  addMessage: (message: DistriChatMessage) => void;
  /**
   * Manually run compaction on the current task. Resolves when the server
   * has applied the compactor; the resulting `context_compaction` event
   * arrives over the stream and updates `useChatStateStore.compactionEvents`.
   * No-op (with a warning) when there is no active task to compact.
   */
  compact: () => Promise<void>;
}

export function useChat({
  threadId,
  onError,
  getMetadata,
  agent,
  externalTools,
  beforeSendMessage,
  initialMessages,
}: UseChatOptions): UseChatReturn {
  const abortControllerRef = useRef<AbortController | null>(null);

  // Store onError in a ref to avoid dependency issues
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  // Store getMetadata in a ref to avoid dependency issues
  const getMetadataRef = useRef(getMetadata);
  useEffect(() => {
    getMetadataRef.current = getMetadata;
  }, [getMetadata]);

  const currentRunId = useChatStateStore(state => state.currentRunId);
  const currentTaskId = useChatStateStore(state => state.currentTaskId);
  const processMessage = useChatStateStore(state => state.processMessage);
  const clearAllStates = useChatStateStore(state => state.clearAllStates);
  const setError = useChatStateStore(state => state.setError);
  const setLoading = useChatStateStore(state => state.setLoading);
  const setStreaming = useChatStateStore(state => state.setStreaming);
  const setAgent = useChatStateStore(state => state.setAgent);
  const hasPendingToolCalls = useChatStateStore(state => state.hasPendingToolCalls);
  const failAllPendingToolCalls = useChatStateStore(state => state.failAllPendingToolCalls);
  const setStreamingIndicator = useChatStateStore(state => state.setStreamingIndicator);
  const setExternalTools = useChatStateStore(state => state.setExternalTools);
  const errorState = useChatStateStore(state => state.error);
  const messages = useChatStateStore(state => state.messages);

  useEffect(() => {
    if (externalTools && externalTools.length > 0) {
      setExternalTools(externalTools as DistriAnyTool[]);
    }
  }, [externalTools, setExternalTools]);


  // Create InvokeContext for message construction
  const createInvokeContext = useCallback((): InvokeContext => ({
    thread_id: threadId,
    run_id: currentRunId,
    task_id: currentTaskId,
    getMetadata: getMetadataRef.current
  }), [currentRunId, currentTaskId, threadId]);

  const isLoading = useChatStateStore(state => state.isLoading);
  const isStreaming = useChatStateStore(state => state.isStreaming);

  // `initialMessages` is the thread's persisted history (fetched by the
  // parent via `useChatMessages`). It is **render-only** — we never pump
  // it into the live zustand store, because:
  //   * the server already loads thread history from its own DB when
  //     building the planner's context (so we don't need to ship it
  //     anywhere), and
  //   * a returning history fetch arriving mid-turn must not be allowed
  //     to clobber an in-flight optimistic user message or streaming
  //     response.
  // The display array is composed at return time as
  // `[...initialMessages, ...store.messages]`.

  // Direct message processing
  const addMessage = useCallback((message: DistriChatMessage) => {
    // When manually adding messages, treat as non-stream by default
    processMessage(message, false);
  }, [processMessage]);



  // Set up the agent and tools in the store
  useEffect(() => {
    if (agent) {
      setAgent(agent);
    }

  }, [agent, setAgent]);

  // Store cleanup functions in refs to avoid dependency changes
  const cleanupRef = useRef<(() => void) | undefined>(undefined);
  cleanupRef.current = () => {
    setStreamingIndicator(undefined);
    setStreaming(false);
    setLoading(false);
  };

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear any lingering streaming states on unmount
      if (cleanupRef.current) {
        setTimeout(cleanupRef.current, 0);
      }
    };
  }, []); // Empty dependencies to avoid re-creating cleanup function

  // Reset state when agent changes
  const agentNameRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const prev = agentNameRef.current;
    const curr = agent?.name;
    if (prev === curr) return;

    // Only wipe on a true agent-to-agent transition. The first non-null
    // assignment (undefined → "agent_a") and any null reset are NOT
    // user-initiated agent switches; they're just async resolution from
    // `useAgent` arriving after the store has already been populated.
    // Wiping there clobbers in-flight optimistic / streaming state.
    if (prev !== undefined && curr !== undefined) {
      clearAllStates();
      setError(null);
    }
    agentNameRef.current = curr;
  }, [agent?.name, clearAllStates, setError]);

  // Reset state when threadId changes (e.g. user clicks "new conversation").
  // Skipped on first mount so we don't clobber initialMessages — that effect
  // already calls clearAllStates() before processing.
  const threadIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (threadIdRef.current !== undefined && threadIdRef.current !== threadId) {
      clearAllStates();
      setError(null);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
    threadIdRef.current = threadId;
  }, [threadId, clearAllStates, setError]);


  const handleStreamEvent = useCallback(
    (event: DistriChatMessage) => {
      processMessage(event, true);
    }, [processMessage]);

  const sendMessage = useCallback(async (content: string | DistriPart[], options?: SendMessageOptions) => {
    if (!agent) return;

    setLoading(true);
    setStreaming(true);
    setError(null);
    setStreamingIndicator('typing');

    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

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

      if (beforeSendMessage) {
        distriMessage = await beforeSendMessage(distriMessage);
      }

      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);

      const contextMetadata = await getMetadataRef.current?.() || {};
      // Forward parts_metadata to the request so the backend persists / filters
      // by it (save: false) and downstream consumers see developer flags.
      const requestMetadata: Record<string, unknown> = {
        ...contextMetadata,
        task_id: currentTaskId,
      };
      if (partsMetadata && Object.keys(partsMetadata).length > 0) {
        requestMetadata.parts = { ...(contextMetadata.parts as object | undefined ?? {}), ...partsMetadata };
      }
      // Start streaming
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: requestMetadata,
      }, externalTools);

      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        handleStreamEvent(event);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stream was cancelled, don't show error
        // **FIX**: Clean up streaming state even on abort
        setStreamingIndicator(undefined);
        setStreaming(false);
        setLoading(false);
        return;
      }
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      onErrorRef.current?.(error);

      // **FIX**: Fail all pending tool calls so input isn't blocked
      failAllPendingToolCalls(error.message);

      // **FIX**: Clear streaming indicators immediately on error
      setStreamingIndicator(undefined);
      setStreaming(false);
      setLoading(false);
    } finally {
      setStreamingIndicator(undefined);
      setLoading(false);
      setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, beforeSendMessage, createInvokeContext, currentTaskId, externalTools, handleStreamEvent, processMessage, setError, setLoading, setStreaming, setStreamingIndicator, failAllPendingToolCalls]);

  const sendMessageStream = useCallback(async (content: string | DistriPart[], role: 'user' | 'tool' = 'user') => {
    if (!agent) return;

    setLoading(true);
    setStreaming(true);
    setError(null);
    setStreamingIndicator('typing');

    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      // Ensure token is fresh before opening the stream
      await agent.client.ensureAccessToken();

      const parts: DistriPart[] = typeof content === 'string'
        ? [{ part_type: 'text', data: content }]
        : content;

      const distriMessage = DistriClient.initDistriMessage(role, parts);

      // Add user/tool message immediately - not from stream, user initiated
      processMessage(distriMessage, false);

      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);

      const contextMetadata = await getMetadataRef.current?.() || {};
      // Start streaming
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: {
          ...contextMetadata,
          task_id: currentTaskId
        }
      });

      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        handleStreamEvent(event);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stream was cancelled, don't show error
        // **FIX**: Clean up streaming state even on abort
        setStreamingIndicator(undefined);
        setStreaming(false);
        setLoading(false);
        return;
      }
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      onErrorRef.current?.(error);

      // **FIX**: Fail all pending tool calls so input isn't blocked
      failAllPendingToolCalls(error.message);

      // **FIX**: Clear streaming indicators immediately on error
      setStreamingIndicator(undefined);
      setStreaming(false);
      setLoading(false);
    } finally {
      setStreamingIndicator(undefined);
      setLoading(false);
      setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, currentTaskId, handleStreamEvent, processMessage, setError, setLoading, setStreaming, setStreamingIndicator, failAllPendingToolCalls]);


  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Fail all pending tool calls so they don't complete after cancel
    // and trigger the agent to restart via completeTool retry
    failAllPendingToolCalls('User cancelled the operation');
    setStreamingIndicator(undefined);
    setStreaming(false);
    setLoading(false);
  }, [failAllPendingToolCalls, setStreamingIndicator, setStreaming, setLoading]);

  const compact = useCallback(async () => {
    const taskId = currentTaskId;
    if (!agent || !taskId) {
      console.warn('[useChat] compact() called with no active task — nothing to compact');
      return;
    }
    try {
      await agent.compact(taskId);
    } catch (err) {
      onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [agent, currentTaskId]);

  // Combined display array: persisted history (from parent) first, live
  // optimistic + streamed messages from the store after. Memoised so
  // downstream effects keyed on `messages` don't fire on every render.
  const displayedMessages = useMemo(
    () => (initialMessages && initialMessages.length > 0
      ? [...initialMessages, ...messages]
      : messages),
    [initialMessages, messages],
  );

  return {
    isStreaming,
    messages: displayedMessages,
    sendMessage,
    sendMessageStream,
    isLoading,
    error: errorState,
    hasPendingToolCalls,
    stopStreaming,
    addMessage,
    compact,
  };
}
