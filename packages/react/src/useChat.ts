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
import { decodeA2AStreamEvent } from '../../core/src/encoder';
import { isDistriMessage, isDistriArtifact } from '../../core/src/types';
import { registerTools } from './hooks/registerTools';
import { useChatStateStore } from './stores/chatStateStore';
import { DistriAnyTool } from './types';

export interface UseChatOptions {
  threadId: string;
  agent?: Agent;
  onMessage?: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
  onError?: (error: Error) => void;
  // Ability to override metadata for the stream
  getMetadata?: () => Promise<any>;
  onMessagesUpdate?: () => void;
  tools?: DistriAnyTool[];
}

export interface UseChatReturn {
  messages: (DistriEvent | DistriMessage | DistriArtifact)[];
  isStreaming: boolean;
  sendMessage: (content: string | DistriPart[]) => Promise<void>;
  sendMessageStream: (content: string | DistriPart[]) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  clearMessages: () => void;
  agent: Agent | undefined;
  hasPendingToolCalls: () => boolean;
  stopStreaming: () => void;
  // Chat state management
  chatState: ReturnType<typeof useChatStateStore.getState>;
}

export function useChat({
  threadId,
  onMessage,
  onError,
  getMetadata,
  onMessagesUpdate,
  agent,
  tools,
}: UseChatOptions): UseChatReturn {
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create InvokeContext for message construction
  const createInvokeContext = useCallback((): InvokeContext => ({
    thread_id: threadId,
    run_id: undefined,
    getMetadata
  }), [threadId, getMetadata]);

  // Register tools with agent
  registerTools({ agent, tools });

  // Chat state management with Zustand
  const chatState = useChatStateStore.getState();

  // Set up the agent and tools in the store
  useEffect(() => {
    if (agent) {
      chatState.setAgent(agent);
    }
    if (tools) {
      chatState.setTools(tools);
    }
  }, [agent, tools, chatState]);

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
      chatState.clearMessages();
      chatState.clearAllStates();
      chatState.setError(null);
      agentIdRef.current = agent?.id;
    }
  }, [agent?.id, chatState]);

  const fetchMessages = useCallback(async () => {
    if (!agent) return;

    try {
      chatState.setLoading(true);
      const a2aMessages = await agent.getThreadMessages(threadId);
      const distriMessages = a2aMessages.map(decodeA2AStreamEvent).filter(Boolean) as (DistriEvent | DistriMessage | DistriArtifact)[];

      // Clear existing messages and add fetched ones
      chatState.clearMessages();
      distriMessages.forEach(message => {
        chatState.addMessage(message);
        chatState.processMessage(message);
      });

      onMessagesUpdate?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch messages');
      chatState.setError(error);
      onError?.(error);
    } finally {
      chatState.setLoading(false);
    }
  }, [threadId, agent?.id, onError, onMessagesUpdate, chatState]);

  // Fetch messages on mount and when threadId changes
  useEffect(() => {
    if (threadId) {
      fetchMessages();
    }
  }, [threadId, agent?.id]);

  const handleStreamEvent = useCallback((event: DistriEvent | DistriMessage | DistriArtifact) => {
    // Add message to state
    chatState.addMessage(event);

    // Process message through chat state
    chatState.processMessage(event);

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

            chatState.initToolCall(toolCall, llmArtifact.timestamp, isExternal);
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

            chatState.updateToolCallStatus(
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

          chatState.initToolCall(toolCall, undefined, isExternal);
        });
      }

      // Process tool results
      const toolResultParts = distriMessage.parts.filter(part => part.type === 'tool_result');
      if (toolResultParts.length > 0) {
        const newToolResults = toolResultParts.map(part => (part as any).tool_result);
        newToolResults.forEach(toolResult => {
          chatState.updateToolCallStatus(
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

    onMessage?.(event);
  }, [onMessage, agent, chatState]);

  const sendMessage = useCallback(async (content: string | DistriPart[]) => {
    if (!agent) return;

    chatState.setLoading(true);
    chatState.setStreaming(true);
    chatState.setError(null);

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
      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);

      // Add user message to state immediately
      chatState.addMessage(distriMessage);

      const contextMetadata = await getMetadata?.() || {};
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
      chatState.setError(error);
      onError?.(error);
    } finally {
      chatState.setLoading(false);
      chatState.setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, onError]);

  const sendMessageStream = useCallback(async (content: string | DistriPart[], role: 'user' | 'tool' = 'user') => {
    if (!agent) return;

    chatState.setLoading(true);
    chatState.setStreaming(true);
    chatState.setError(null);

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
      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);

      // Add user message to state immediately
      chatState.addMessage(distriMessage);

      const contextMetadata = await getMetadata?.() || {};
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
      chatState.setError(error);
      onError?.(error);
    } finally {
      chatState.setLoading(false);
      chatState.setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, onError, threadId]);

  // Handle external tool responses
  const handleExternalToolResponses = useCallback(async () => {
    const externalResponses = chatState.getExternalToolResponses();
    // Only send responses if there are actual external tool calls that need responses
    // and we're not currently streaming
    if (externalResponses.length > 0 && !chatState.isStreaming && !chatState.isLoading) {
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
        chatState.setError(err instanceof Error ? err : new Error('Failed to send tool responses'));
      }
    }
  }, [chatState, sendMessageStream]);

  // Check for external tool responses periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const externalResponses = chatState.getExternalToolResponses();
      // Only process if there are responses and we're not currently streaming or loading
      // AND only for external tools that have actually completed their handling
      if (externalResponses.length > 0 && !chatState.isStreaming && !chatState.isLoading) {
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
  }, [chatState, handleExternalToolResponses]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages: chatState.messages,
    isStreaming: chatState.isStreaming,
    sendMessage,
    sendMessageStream,
    isLoading: chatState.isLoading,
    error: chatState.error,
    clearMessages: chatState.clearMessages,
    agent: agent || undefined,
    hasPendingToolCalls: chatState.hasPendingToolCalls,
    stopStreaming,
    // Chat state management
    chatState,
  };
} 