import { useCallback, useEffect, useRef } from 'react';
import { Agent, DistriBaseTool, DistriChatMessage, DistriClient, DistriMessage, ToolExecutionOptions } from '@distri/core';
import {
  DistriPart,
  InvokeContext,
  convertDistriMessageToA2A,
} from '@distri/core';
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
  sendMessage: (content: string | DistriPart[]) => Promise<void>;
  sendMessageStream: (content: string | DistriPart[]) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  hasPendingToolCalls: () => boolean;
  stopStreaming: () => void;
  addMessage: (message: DistriChatMessage) => void;
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

  // Handle initial messages processing - static recalculation when initialMessages change
  useEffect(() => {
    if (initialMessages) {
      // Clear state and process initial messages
      clearAllStates();
      // Process initial messages as historical (not from stream)
      initialMessages.forEach(message => processMessage(message, false));


    }
  }, [clearAllStates, initialMessages, processMessage]);

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
    if (agent?.name !== agentNameRef.current) {
      // Agent changed, reset all state
      clearAllStates();
      setError(null);
      agentNameRef.current = agent?.name;
    }
  }, [agent?.name, clearAllStates, setError]);


  const handleStreamEvent = useCallback(
    (event: DistriChatMessage) => {
      // Process event directly - mark as from stream
      processMessage(event, true);
    }, [processMessage]);

  /**
   * Consume an async stream of chat events, honoring the abort
   * signal and forwarding events through `handleStreamEvent`.
   * Shared between `sendMessage`, `sendMessageStream`, and the
   * thread-reattach effect so all three paths get identical
   * event-handling, abort, and cleanup behavior. Returns the number
   * of events processed — callers use this to detect the
   * terminal-race fallback case.
   */
  const consumeStream = useCallback(
    async (stream: AsyncGenerator<DistriChatMessage>) => {
      let count = 0;
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        handleStreamEvent(event);
        count++;
      }
      return count;
    },
    [handleStreamEvent],
  );

  const sendMessage = useCallback(async (content: string | DistriPart[]) => {
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

      let distriMessage = DistriClient.initDistriMessage('user', parts);

      // Add user message immediately - not from stream, user initiated
      processMessage(distriMessage, false);

      if (beforeSendMessage) {
        distriMessage = await beforeSendMessage(distriMessage);
      }

      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);

      const contextMetadata = await getMetadataRef.current?.() || {};
      // Start streaming
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: {
          ...contextMetadata,
          task_id: currentTaskId
        },
      }, externalTools);

      await consumeStream(stream);
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
  }, [agent, beforeSendMessage, consumeStream, createInvokeContext, currentTaskId, externalTools, processMessage, setError, setLoading, setStreaming, setStreamingIndicator, failAllPendingToolCalls]);

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

      await consumeStream(stream);
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
  }, [agent, consumeStream, createInvokeContext, currentTaskId, processMessage, setError, setLoading, setStreaming, setStreamingIndicator, failAllPendingToolCalls]);


  const stopStreaming = useCallback(() => {
    // Abort the local stream first so the UI stops immediately even
    // if the network cancel is slow.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Explicit stop = user wants the task stopped. Fire the backend
    // `tasks/cancel` so the background execution actually halts
    // instead of continuing to run on the server. Closing the tab or
    // losing network does NOT hit this path — those cases rely on the
    // backend's background-task model keeping execution alive for
    // later resubscribe.
    if (agent && currentTaskId) {
      agent.client
        .cancelTask(agent.name, currentTaskId)
        .catch((err: unknown) => {
          // Idempotent cancel: server returns success for
          // already-terminal tasks. Log anything else.
          console.warn('cancelTask failed:', err);
        });
    }
    // Fail all pending tool calls so they don't complete after cancel
    // and trigger the agent to restart via completeTool retry
    failAllPendingToolCalls('User cancelled the operation');
    setStreamingIndicator(undefined);
    setStreaming(false);
    setLoading(false);
  }, [agent, currentTaskId, failAllPendingToolCalls, setStreamingIndicator, setStreaming, setLoading]);

  // Reattach to a background task when reopening a thread. If the
  // server reports `thread.active_task_id`, call `resubscribeStream`
  // and feed events through the shared consumeStream helper so the
  // UI picks up exactly where the previous client left off. If
  // resubscribe yields no events (the task finished between getThread
  // and subscribe), fall back to `getTask` to render the final state.
  useEffect(() => {
    if (!agent || !threadId) return;
    const abort = new AbortController();

    (async () => {
      try {
        const thread = await agent.client.getThread(threadId);
        if (abort.signal.aborted) return;
        const activeTaskId = thread?.active_task_id;
        if (!activeTaskId) return;

        // Stake ownership of the stream state so `stopStreaming` and
        // the existing abort logic behave identically for resumed
        // tasks.
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        setStreaming(true);
        setLoading(true);
        setStreamingIndicator('typing');

        const stream = await agent.resubscribeStream(activeTaskId);
        const eventCount = await consumeStream(stream);

        if (eventCount === 0) {
          // Terminal race: task finished between getThread and
          // resubscribe. Fetch final task state and synthesize a
          // run_finished-style update through processMessage so the
          // UI reflects the outcome.
          try {
            const task = await agent.client.getTask(agent.name, activeTaskId);
            handleStreamEvent({
              type: 'run_finished',
              data: { task_id: activeTaskId, status: task?.status },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
          } catch (err) {
            console.warn('getTask fallback failed:', err);
          }
        }
      } catch (err) {
        if (!abort.signal.aborted) {
          console.warn('Resubscribe on thread open failed:', err);
        }
      } finally {
        if (!abort.signal.aborted) {
          setStreamingIndicator(undefined);
          setStreaming(false);
          setLoading(false);
          abortControllerRef.current = null;
        }
      }
    })();

    return () => {
      abort.abort();
    };
    // threadId + agent identity drive reattach; consumeStream and
    // handleStreamEvent are stable across renders once their inputs
    // settle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, threadId]);

  return {
    isStreaming,
    messages,
    sendMessage,
    sendMessageStream,
    isLoading,
    error: errorState,
    hasPendingToolCalls,
    stopStreaming,
    addMessage,
  };
}
