import { useCallback, useEffect, useRef } from 'react';
import { Agent, DistriChatMessage, DistriClient } from '@distri/core';
import {
  DistriPart,
  InvokeContext,
  convertDistriMessageToA2A,
} from '@distri/core';
import { registerTools } from './hooks/registerTools';
import { useChatStateStore } from './stores/chatStateStore';
import { DistriAnyTool } from './types';

import { WrapToolOptions } from './utils/toolWrapper';

export interface UseChatOptions {
  threadId: string;
  agent?: Agent;
  onMessage?: (message: DistriChatMessage) => void;
  onError?: (error: Error) => void;
  // Ability to override metadata for the stream
  getMetadata?: () => Promise<any>;
  tools?: DistriAnyTool[];
  wrapOptions?: WrapToolOptions;
  initialMessages?: (DistriChatMessage)[];
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
  tools,
  wrapOptions,
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

  // Create InvokeContext for message construction
  const createInvokeContext = useCallback((): InvokeContext => ({
    thread_id: threadId,
    run_id: undefined,
    getMetadata: getMetadataRef.current
  }), [threadId]);

  // Register tools with agent
  registerTools({ agent, tools, wrapOptions });

  // Chat state management with Zustand - only for processing state
  const chatState = useChatStateStore();

  const isLoading = useChatStateStore(state => state.isLoading);
  const isStreaming = useChatStateStore(state => state.isStreaming);

  const {
    processMessage,
    clearAllStates,
    setError,
    setLoading,
    setStreaming,
    setAgent,
    setTools,
    getExternalToolResponses,
    hasPendingToolCalls,
  } = chatState;

  // Handle initial messages processing - static recalculation when initialMessages change
  useEffect(() => {
    if (initialMessages) {
      // Clear state and process initial messages
      chatState.clearAllStates();
      initialMessages.forEach(message => chatState.processMessage(message));
    }
  }, [initialMessages]); // Only depend on initialMessages for static behavior

  // Direct message processing
  const addMessage = useCallback((message: DistriChatMessage) => {
    processMessage(message);
  }, [processMessage]);



  // Set up the agent and tools in the store
  useEffect(() => {
    if (agent) {
      setAgent(agent);
    }
    if (tools) {
      setTools(tools);
    }
  }, [agent, tools, setAgent, setTools]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
      // Process event directly
      processMessage(event);
    }, [processMessage]);

  const sendMessage = useCallback(async (content: string | DistriPart[]) => {
    if (!agent) return;

    setLoading(true);
    setStreaming(true);
    setError(null);
    chatState.setStreamingIndicator(undefined);

    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const parts: DistriPart[] = typeof content === 'string'
        ? [{ type: 'text', data: content }]
        : content;

      const distriMessage = DistriClient.initDistriMessage('user', parts);

      // Add user message immediately
      processMessage(distriMessage);

      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);

      const contextMetadata = await getMetadataRef.current?.() || {};
      // Start streaming
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: contextMetadata
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
        return;
      }
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setLoading(false);
      setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, setLoading, setStreaming, setError]);

  const sendMessageStream = useCallback(async (content: string | DistriPart[], role: 'user' | 'tool' = 'user') => {
    if (!agent) return;

    setLoading(true);
    setStreaming(true);
    setError(null);
    chatState.setStreamingIndicator(undefined);

    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const parts: DistriPart[] = typeof content === 'string'
        ? [{ type: 'text', data: content }]
        : content;

      const distriMessage = DistriClient.initDistriMessage(role, parts);

      // Add user/tool message immediately
      processMessage(distriMessage);

      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);

      const contextMetadata = await getMetadataRef.current?.() || {};
      // Start streaming
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: { ...contextMetadata }
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
        return;
      }
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      // Only set loading to false if no pending tool calls
      if (!hasPendingToolCalls()) {
        setLoading(false);
      }
      setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, threadId, setLoading, setStreaming, setError, hasPendingToolCalls]);

  // Handle external tool responses
  const handleExternalToolResponses = useCallback(async () => {
    setStreaming(true);
    const externalResponses = getExternalToolResponses();
    // Only send responses if there are actual external tool calls that need responses
    // and we're not currently streaming
    if (externalResponses.length > 0 && !isStreaming && !isLoading) {
      console.log('Sending external tool responses:', externalResponses);

      try {
        // Construct tool result parts
        const toolResultParts: DistriPart[] = externalResponses.map(result => ({
          type: 'tool_result',
          data: {
            tool_call_id: result.tool_call_id,
            tool_name: result.tool_name,
            result: result.result,
            success: result.success,
            error: result.error
          }
        }));
        toolResultParts.push({
          type: 'text',
          data: 'Tool execution completed. Please continue.'
        });

        // Send tool results back to agent
        await sendMessageStream(toolResultParts, 'user');

        // Clear completed tool results
        chatState.clearToolResults();
      } catch (err) {
        console.error('Failed to send external tool responses:', err);
        setError(err instanceof Error ? err : new Error('Failed to send tool responses'));
      } finally {
        setStreaming(false);
      }
    }
  }, [chatState, sendMessageStream, getExternalToolResponses, setError, isStreaming, isLoading]);

  // Watch for completed external tool calls and automatically send responses
  useEffect(() => {
    const checkAndSendExternalResponses = async () => {
      // Check if we have completed external tool calls and no pending ones
      const externalResponses = getExternalToolResponses();
      const pendingToolCalls = hasPendingToolCalls();

      if (externalResponses.length > 0 && !pendingToolCalls && !isStreaming && !isLoading) {
        await handleExternalToolResponses();
      }
    };

    checkAndSendExternalResponses();
  }, [chatState.toolCalls, isStreaming, isLoading, getExternalToolResponses, hasPendingToolCalls, handleExternalToolResponses]);

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