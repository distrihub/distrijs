import { useCallback, useEffect, useRef } from 'react';
import { Agent, DistriClient } from '@distri/core';
import {
  DistriMessage,
  DistriPart,
  InvokeContext,
  DistriEvent,
  DistriArtifact,
  AssistantWithToolCalls,
  ToolResults,
  convertDistriMessageToA2A,
} from '@distri/core';
import { isDistriMessage, isDistriArtifact } from '../../core/src/types';
import { registerTools } from './hooks/registerTools';
import { useChatStateStore } from './stores/chatStateStore';
import { DistriAnyTool } from './types';
import { useChatMessages } from './hooks/useChatMessages';

export interface UseChatOptions {
  threadId: string;
  agent?: Agent;
  onMessage?: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
  onError?: (error: Error) => void;
  // Ability to override metadata for the stream
  getMetadata?: () => Promise<any>;
  tools?: DistriAnyTool[];
  initialMessages?: (DistriEvent | DistriMessage | DistriArtifact)[];
}

export interface UseChatReturn {
  messages: (DistriEvent | DistriMessage | DistriArtifact)[];
  isStreaming: boolean;
  sendMessage: (content: string | DistriPart[]) => Promise<void>;
  sendMessageStream: (content: string | DistriPart[]) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  hasPendingToolCalls: () => boolean;
  stopStreaming: () => void;
  addMessage: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
}

export function useChat({
  threadId,
  onError,
  getMetadata,
  agent,
  tools,
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
  registerTools({ agent, tools });

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
    initToolCall,
    updateToolCallStatus,
    getExternalToolResponses,
    hasPendingToolCalls,
  } = chatState;

  // Use the new useChatMessages hook for message management
  const {
    addMessage: addMessageToHook,
    messages,
  } = useChatMessages({
    initialMessages,
    agent,
    threadId,
    onError,
    onMessageProcess: processMessage,
    clearStoreState: clearAllStates,
  });

  // Store addMessageToHook in a ref to avoid circular dependencies
  const addMessageToHookRef = useRef(addMessageToHook);
  useEffect(() => {
    addMessageToHookRef.current = addMessageToHook;
  }, [addMessageToHook]);

  // Wrap addMessage to also process the message
  const addMessage = useCallback((message: DistriEvent | DistriMessage | DistriArtifact) => {
    addMessageToHookRef.current(message);
  }, []);

  // Store addMessage in a ref to avoid circular dependencies in handleStreamEvent
  const addMessageRef = useRef(addMessage);
  useEffect(() => {
    addMessageRef.current = addMessage;
  }, [addMessage]);

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
    (event: DistriEvent | DistriMessage | DistriArtifact) => {
      // Add event to messages (this will trigger onMessageAdded callback)
      addMessageRef.current(event);

      // Handle tool calls and results automatically from artifacts
      if (isDistriArtifact(event)) {
        const artifact = event as DistriArtifact;

        if (artifact.type === 'llm_response') {
          const llmArtifact = artifact as AssistantWithToolCalls;

          // Process tool calls from LLM response
          if (llmArtifact.tool_calls && Array.isArray(llmArtifact.tool_calls)) {
            llmArtifact.tool_calls.forEach(toolCall => {
              // Check if tool is external (only if explicitly registered in tools array)
              const distriTool = chatState.tools?.find(t => t.name === toolCall.tool_name);
              const isExternal = !!distriTool; // Only true if found in tools array

              // Use step_id as step title if available
              const stepTitle = llmArtifact.step_id || toolCall.tool_name;

              initToolCall(toolCall, llmArtifact.timestamp, isExternal, stepTitle);
            });
          }
        } else if (artifact.type === 'tool_results') {
          const toolResultsArtifact = artifact as ToolResults;

          // Process tool results
          if (toolResultsArtifact.results && Array.isArray(toolResultsArtifact.results)) {
            toolResultsArtifact.results.forEach(result => {
              let parsedResult = result.result;
              if (typeof parsedResult === 'string') {
                try {
                  parsedResult = JSON.parse(parsedResult);
                } catch {
                  // Keep as string if not valid JSON
                }
              }

              updateToolCallStatus(
                result.tool_call_id,
                {
                  status: toolResultsArtifact.success ? 'completed' : 'error',
                  result: parsedResult,
                  error: toolResultsArtifact.reason || undefined,
                  completedAt: new Date(toolResultsArtifact.timestamp)
                }
              );
            });
          }
        }
      }

      // Handle tool calls and results from regular messages (for backward compatibility)
      if (isDistriMessage(event)) {
        const distriMessage = event as DistriMessage;

        // Process tool calls
        const toolCallParts = distriMessage.parts.filter(part => part.type === 'tool_call');
        if (toolCallParts.length > 0) {
          const newToolCalls = toolCallParts.map(part => (part as any).tool_call);
          newToolCalls.forEach(toolCall => {
            // Check if tool is external (only if explicitly registered in tools array)
            const distriTool = chatState.tools?.find(t => t.name === toolCall.tool_name);
            const isExternal = !!distriTool; // Only true if found in tools array

            // Use tool name as step title for regular messages
            const stepTitle = toolCall.tool_name;

            initToolCall(toolCall, undefined, isExternal, stepTitle);
          });
        }

        // Process tool results
        const toolResultParts = distriMessage.parts.filter(part => part.type === 'tool_result');
        if (toolResultParts.length > 0) {
          const newToolResults = toolResultParts.map(part => (part as any).tool_result);
          newToolResults.forEach(toolResult => {
            updateToolCallStatus(
              toolResult.tool_call_id,
              {
                status: toolResult.success ? 'completed' : 'error',
                result: toolResult.result,
                error: toolResult.error,
                completedAt: new Date()
              }
            );
          });
        }
      }

    }, [chatState.tools, initToolCall, updateToolCallStatus]);

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
        ? [{ type: 'text', text: content }]
        : content;

      const distriMessage = DistriClient.initDistriMessage('user', parts);

      // Add user message immediately
      addMessageRef.current(distriMessage);

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
        ? [{ type: 'text', text: content }]
        : content;

      const distriMessage = DistriClient.initDistriMessage(role, parts);

      // Add user/tool message immediately
      addMessageRef.current(distriMessage);

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
    const externalResponses = getExternalToolResponses();
    // Only send responses if there are actual external tool calls that need responses
    // and we're not currently streaming
    if (externalResponses.length > 0 && !isStreaming && !isLoading) {
      console.log('Sending external tool responses:', externalResponses);

      try {
        // Construct tool result parts
        const toolResultParts: DistriPart[] = externalResponses.map(result => ({
          type: 'tool_result',
          tool_result: {
            tool_call_id: result.tool_call_id,
            result: result.result,
            success: result.success,
            error: result.error
          }
        }));

        // Send tool results back to agent
        await sendMessageStream(toolResultParts, 'tool');

        // Clear completed tool results
        chatState.clearToolResults();
      } catch (err) {
        console.error('Failed to send external tool responses:', err);
        setError(err instanceof Error ? err : new Error('Failed to send tool responses'));
      }
    }
  }, [chatState, sendMessageStream, getExternalToolResponses, setError]);

  // Check for external tool responses periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const externalResponses = getExternalToolResponses();
      // Only process if there are responses and we're not currently streaming or loading
      // AND only for external tools that have actually completed their handling
      if (externalResponses.length > 0 && !isStreaming && !isLoading) {
        // Additional check: only send if these are truly external tool responses
        const hasExternalToolResponses = externalResponses.some(response => {
          const toolCall = chatState.getToolCallById(response.tool_call_id);
          return toolCall && toolCall.isExternal && toolCall.status === 'completed';
        });

        if (hasExternalToolResponses) {
          handleExternalToolResponses();
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [chatState, handleExternalToolResponses, getExternalToolResponses]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

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