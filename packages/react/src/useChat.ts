import { useState, useCallback, useEffect, useRef } from 'react';
import { Agent, DistriClient } from '@distri/core';
import {
  DistriMessage,
  DistriPart,
  InvokeContext,
  DistriEvent,
  convertDistriMessageToA2A,
  ToolResult
} from '@distri/core';
import { decodeA2AStreamEvent } from '../../core/src/encoder';
import { DistriStreamEvent, isDistriMessage, ToolResultPart } from '../../core/src/types';
import { registerTools } from './hooks/registerTools';
import { useToolCallState } from './hooks/useToolCallState';
import { DistriAnyTool, ToolCallState } from './types';
import {
  DistriClient,
  DistriMessage,
  DistriPart,
  DistriEvent,
  DistriStreamEvent,
  isDistriMessage,
  isDistriEvent,
  convertDistriMessageToA2A,
  decodeA2AStreamEvent,
  createInvokeContext,
} from '@distrijs/core';

export interface UseChatOptions {
  threadId: string;
  agent?: Agent;
  onMessage?: (message: DistriStreamEvent) => void;
  onError?: (error: Error) => void;
  // Ability to override metadata for the stream
  getMetadata?: () => Promise<any>;
  onMessagesUpdate?: () => void;
  tools?: DistriAnyTool[];
}

export interface UseChatReturn {
  messages: (DistriMessage | DistriEvent)[];
  executionEvents: DistriEvent[];
  isLoading: boolean;
  isStreaming: boolean;
  error: Error | null;
  sendMessage: (content: string | DistriPart[]) => Promise<void>;
  sendMessageStream: (content: string | DistriPart[], role?: MessageRole) => Promise<void>;
  toolCallStates: Map<string, ToolCallState>;
  clearMessages: () => void;
  stopStreaming: () => void;
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
  const [messages, setMessages] = useState<(DistriMessage | DistriEvent)[]>([]);
  const [executionEvents, setExecutionEvents] = useState<DistriEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create InvokeContext for message construction
  const createInvokeContext = useCallback((): InvokeContext => ({
    thread_id: threadId,
    run_id: undefined,
    getMetadata
  }), [threadId, getMetadata]);

  // Register tools with agent
  registerTools({ agent, tools });

  // Tool state management with auto-send when all completed  
  const toolStateHandler = useToolCallState({
    agent,
    onAllToolsCompleted: (toolResults: ToolResult[]) => {
      sendToolResultsToAgent(toolResults);
    }
  });



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
      setMessages([]);
      toolStateHandler.clearAll();
      setError(null);
      agentIdRef.current = agent?.id;
    }
  }, [agent?.id, toolStateHandler]);

  // Clear messages helper
  const clearMessages = useCallback(() => {
    setMessages([]);
    toolStateHandler.clearAll();
  }, [toolStateHandler]);

  const fetchMessages = useCallback(async () => {
    if (!agent) return;

    try {
      const a2aMessages = await agent.getThreadMessages(threadId);
      const distriMessages = a2aMessages.map(decodeA2AStreamEvent) as (DistriMessage | DistriEvent)[];
      
      setMessages(distriMessages);
      
      // Extract execution events
      const execEvents = distriMessages.filter(isDistriEvent).filter(isExecutionEvent) as DistriEvent[];
      setExecutionEvents(execEvents);
      
      onMessagesUpdate?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch messages');
      setError(error);
      onError?.(error);
    }
  }, [threadId, agent?.id, onError, onMessagesUpdate]);

  // Fetch messages on mount and when threadId changes
  useEffect(() => {
    if (threadId) {
      fetchMessages();
    }
  }, [threadId, agent?.id]);

  const handleStreamEvent = useCallback((event: DistriStreamEvent) => {
    // Handle DistriMessage (converted from A2A Message)
    setMessages(prev => {
      if (isDistriMessage(event)) {
        const distriMessage = event as DistriMessage;
        const existingMessageIndex = prev
          .findIndex(msg => isDistriMessage(msg) && msg.id && msg.id === distriMessage.id);

        if (existingMessageIndex >= 0) {
          // Update existing message by merging parts
          const updatedMessages = [...prev];
          const existingMessage = updatedMessages[existingMessageIndex] as DistriMessage;
          // Merge parts from the new message into the existing one
          const mergedParts = [...existingMessage.parts, ...distriMessage.parts];

          updatedMessages[existingMessageIndex] = {
            ...existingMessage,
            parts: mergedParts,
          };

          return updatedMessages;
        } else {
          // Add new message
          return [...prev, distriMessage];
        }
      } else if (isDistriEvent(event)) {
        // Handle execution events separately for tracking
        const distriEvent = event as DistriEvent;
        if (isExecutionEvent(distriEvent)) {
          setExecutionEvents(prevEvents => [...prevEvents, distriEvent]);
        }
        return [...prev, event];
      } else {
        return [...prev, event];
      }
    });

    // Handle tool calls and results automatically
    if (isDistriMessage(event)) {
      const distriMessage = event as DistriMessage;

      // Process tool calls
      const toolCallParts = distriMessage.parts.filter(part => part.type === 'tool_call');
      if (toolCallParts.length > 0) {
        const newToolCalls = toolCallParts.map(part => (part as any).tool_call);
        newToolCalls.forEach(toolCall => {
          toolStateHandler.initToolCall(toolCall);
        });
      }

      // Process tool results
      const toolResultParts = distriMessage.parts.filter(part => part.type === 'tool_result');
      if (toolResultParts.length > 0) {
        const newToolResults = toolResultParts.map(part => (part as any).tool_result);
        newToolResults.forEach(toolResult => {
          toolStateHandler.updateToolCallStatus(
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
  }, [toolStateHandler, onMessage]);

  // Helper function to determine if an event is execution-related
  const isExecutionEvent = (event: DistriEvent): boolean => {
    return [
      'run_started',
      'run_finished', 
      'plan_started',
      'plan_finished',
      'step_started',
      'step_completed',
      'tool_execution_start',
      'tool_execution_end',
      'tool_rejected'
    ].includes(event.type);
  };

  const sendMessage = useCallback(async (content: string | DistriPart[]) => {
    if (!agent) return;

    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

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
      setMessages(prev => [...prev, distriMessage]);

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
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, onError]);

  const sendMessageStream = useCallback(async (content: string | DistriPart[], role: 'user' | 'tool' = 'user') => {
    if (!agent) return;

    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

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
      setMessages(prev => [...prev, distriMessage]);

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
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, onError, threadId]);

  // Auto-send tool results when all tools are completed (streaming)
  // This reuses the existing sendMessageStream logic for consistency
  const sendToolResultsToAgent = useCallback(async (toolResults: ToolResult[]) => {
    if (agent && toolResults.length > 0) {
      console.log('Sending tool results via streaming:', toolResults);

      try {
        // Construct tool result parts
        const toolResultParts: DistriPart[] = toolResults.map(result => ({
          type: 'tool_result',
          tool_result: result
        } as ToolResultPart));

        // Reuse existing streaming logic for consistency with regular messages
        await sendMessageStream(toolResultParts, 'tool');

        // Clear tool results after successful streaming
        toolStateHandler.clearToolResults();
      } catch (err) {
        console.error('Failed to send tool results:', err);
        setError(err instanceof Error ? err : new Error('Failed to send tool results'));
      }
    }
  }, [sendMessageStream, toolStateHandler]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    executionEvents,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    sendMessageStream,
    toolCallStates: toolStateHandler.toolCallStates,
    clearMessages,
    stopStreaming,
  };
} 