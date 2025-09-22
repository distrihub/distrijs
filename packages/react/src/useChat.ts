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
  agent?: Agent;
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

  useEffect(() => {
    if (externalTools && externalTools.length > 0) {
      chatState.setExternalTools(externalTools as DistriAnyTool[]);
    }
  }, [externalTools]);
  // Chat state management with Zustand - only for processing state
  const chatState = useChatStateStore();


  // Create InvokeContext for message construction
  const createInvokeContext = useCallback((): InvokeContext => ({
    thread_id: threadId,
    run_id: chatState.currentRunId,
    task_id: chatState.currentTaskId,
    getMetadata: getMetadataRef.current
  }), [threadId, chatState.currentRunId, chatState.currentTaskId]);

  const isLoading = useChatStateStore(state => state.isLoading);
  const isStreaming = useChatStateStore(state => state.isStreaming);

  const {
    processMessage,
    clearAllStates,
    setError,
    setLoading,
    setStreaming,
    setAgent,
    hasPendingToolCalls,
  } = chatState;

  // Handle initial messages processing - static recalculation when initialMessages change
  useEffect(() => {
    if (initialMessages) {
      // Clear state and process initial messages
      chatState.clearAllStates();
      // Process initial messages as historical (not from stream)
      initialMessages.forEach(message => chatState.processMessage(message, false));


    }
  }, [initialMessages]); // Only depend on initialMessages for static behavior

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
  const cleanupRef = useRef<() => void>();
  cleanupRef.current = () => {
    chatState.setStreamingIndicator(undefined);
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
  const agentIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (agent?.id !== agentIdRef.current) {
      // Agent changed, reset all state
      clearAllStates();
      setError(null);
      agentIdRef.current = agent?.id;
    }
  }, [agent?.id, clearAllStates, setError]);


  const handleStreamEvent = useCallback(
    (event: DistriChatMessage) => {
      // Process event directly - mark as from stream
      processMessage(event, true);
    }, [processMessage]);

  const sendMessage = useCallback(async (content: string | DistriPart[]) => {
    if (!agent) return;

    setLoading(true);
    setStreaming(true);
    setError(null);
    chatState.setStreamingIndicator('typing');

    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
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
          task_id: chatState.currentTaskId
        },
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
        chatState.setStreamingIndicator(undefined);
        setStreaming(false);
        setLoading(false);
        return;
      }
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      onErrorRef.current?.(error);

      // **FIX**: Clear streaming indicators immediately on error
      chatState.setStreamingIndicator(undefined);
      setStreaming(false);
      setLoading(false);
    } finally {
      console.log('🧹 [useChat sendMessage] Finally block - cleaning up streaming state');
      setLoading(false);
      setStreaming(false);
      abortControllerRef.current = null;
      console.log('✅ [useChat sendMessage] Streaming cleanup completed');
    }
  }, [agent, createInvokeContext, handleStreamEvent, setLoading, setStreaming, setError]);

  const sendMessageStream = useCallback(async (content: string | DistriPart[], role: 'user' | 'tool' = 'user') => {
    if (!agent) return;

    setLoading(true);
    setStreaming(true);
    setError(null);
    chatState.setStreamingIndicator('typing');

    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
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
          task_id: chatState.currentTaskId
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
        chatState.setStreamingIndicator(undefined);
        setStreaming(false);
        setLoading(false);
        return;
      }
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      onErrorRef.current?.(error);

      // **FIX**: Clear streaming indicators immediately on error
      chatState.setStreamingIndicator(undefined);
      setStreaming(false);
      setLoading(false);
    } finally {
      console.log('🧹 [useChat sendMessageStream] Finally block - cleaning up streaming state');
      // **FIX**: When stream ends naturally, force stop all streaming indicators
      // regardless of pending tool calls, because backend has closed the stream
      console.log('🛑 [useChat sendMessageStream] Backend stream ended - force stopping all streaming indicators');
      chatState.setStreamingIndicator(undefined); // Clear typing indicator
      setLoading(false);
      setStreaming(false);
      abortControllerRef.current = null;
      console.log('✅ [useChat sendMessageStream] Streaming cleanup completed');
    }
  }, [agent, createInvokeContext, handleStreamEvent, threadId, setLoading, setStreaming, setError, hasPendingToolCalls]);


  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const messages = useChatStateStore(state => state.messages);

  return {
    isStreaming,
    messages,
    sendMessage,
    sendMessageStream,
    isLoading,
    error: chatState.error,
    hasPendingToolCalls,
    stopStreaming,
    addMessage,
  };
}