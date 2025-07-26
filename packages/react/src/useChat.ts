import { useState, useCallback, useEffect, useRef } from 'react';
import { Agent, DistriClient, DistriTool } from '@distri/core';
import {
  DistriMessage,
  DistriPart,
  InvokeContext,
  DistriEvent,
  convertDistriMessageToA2A,
  ToolCall,
  ToolResult
} from '@distri/core';
import { decodeA2AStreamEvent } from '../../core/src/encoder';
import { DistriStreamEvent, isDistriMessage } from '../../core/src/types';
import { useTools } from './hooks/useTools';

export interface UseChatOptions {
  threadId: string;
  agent?: Agent;
  onMessage?: (message: DistriStreamEvent) => void;
  onError?: (error: Error) => void;
  metadata?: any;
  onMessagesUpdate?: () => void;
  tools?: DistriTool[];
}

export interface UseChatReturn {
  messages: DistriStreamEvent[];
  isStreaming: boolean;
  sendMessage: (content: string | DistriPart[]) => Promise<void>;
  sendMessageStream: (content: string | DistriPart[]) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  clearMessages: () => void;
  agent: Agent | undefined;
  pendingToolCalls: ToolCall[];
  toolResults: ToolResult[];
  sendToolResults: () => Promise<void>;
  executeTool: (toolCall: ToolCall) => Promise<void>;
  completeTool: (toolCallId: string, result: any, success?: boolean, error?: string) => void;
  getToolCallStatus: (toolCallId: string) => ToolCallStatus | undefined;
  stopStreaming: () => void;
}

interface ToolCallStatus {
  tool_call_id: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export function useChat({
  threadId,
  onMessage,
  onError,
  metadata,
  onMessagesUpdate,
  agent,
  tools,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<(DistriMessage | DistriEvent)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Tool handling - register tools with agent
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [toolCallStatuses, setToolCallStatuses] = useState<Map<string, ToolCallStatus>>(new Map());

  // Register tools with agent
  useTools({ agent, tools });

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
      setToolCalls([]);
      setToolResults([]);
      setToolCallStatuses(new Map());
      setError(null);
      agentIdRef.current = agent?.id;
    }
  }, [agent?.id]);

  // Create InvokeContext for message construction
  const createInvokeContext = useCallback((): InvokeContext => ({
    thread_id: threadId,
    run_id: undefined,
    metadata
  }), [threadId, metadata]);

  const fetchMessages = useCallback(async () => {
    if (!agent) return;

    try {
      const a2aMessages = await agent.getThreadMessages(threadId);
      const distriMessages = a2aMessages.map(decodeA2AStreamEvent) as (DistriMessage | DistriEvent)[];
      setMessages(distriMessages);
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
        setToolCalls(prev => [...prev, ...newToolCalls]);

        // Initialize status for new tool calls
        setToolCallStatuses(prev => {
          const newStatuses = new Map(prev);
          newToolCalls.forEach(toolCall => {
            if (!newStatuses.has(toolCall.tool_call_id)) {
              newStatuses.set(toolCall.tool_call_id, {
                tool_call_id: toolCall.tool_call_id,
                status: 'pending'
              });
            }
          });
          return newStatuses;
        });
      }

      // Process tool results
      const toolResultParts = distriMessage.parts.filter(part => part.type === 'tool_result');
      if (toolResultParts.length > 0) {
        const newToolResults = toolResultParts.map(part => (part as any).tool_result);
        setToolResults(prev => [...prev, ...newToolResults]);

        // Update status for completed tool calls
        setToolCallStatuses(prev => {
          const newStatuses = new Map(prev);
          newToolResults.forEach(toolResult => {
            newStatuses.set(toolResult.tool_call_id, {
              tool_call_id: toolResult.tool_call_id,
              status: toolResult.success ? 'completed' : 'error',
              result: toolResult.result,
              error: toolResult.error,
              completedAt: new Date()
            });
          });
          return newStatuses;
        });
      }
    }

    onMessage?.(event);
  }, [onMessage, agent]);

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

      // Start streaming
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: context.metadata
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

  const sendMessageStream = useCallback(async (content: string | DistriPart[]) => {
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

      // Start streaming
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: context.metadata
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

  const clearMessages = useCallback(() => {
    setMessages([]);
    setToolCalls([]);
    setToolResults([]);
    setToolCallStatuses(new Map());
  }, []);

  // Execute a tool call
  const executeTool = useCallback(async (toolCall: ToolCall) => {
    if (!agent) return;

    // Update status to running
    setToolCallStatuses(prev => {
      const newStatuses = new Map(prev);
      newStatuses.set(toolCall.tool_call_id, {
        tool_call_id: toolCall.tool_call_id,
        status: 'running',
        startedAt: new Date()
      });
      return newStatuses;
    });

    try {
      const result = await agent.executeTool(toolCall);
      setToolResults(prev => [...prev, result]);

      // Update status based on result
      setToolCallStatuses(prev => {
        const newStatuses = new Map(prev);
        newStatuses.set(toolCall.tool_call_id, {
          tool_call_id: toolCall.tool_call_id,
          status: result.success ? 'completed' : 'error',
          result: result.result,
          error: result.error,
          completedAt: new Date()
        });
        return newStatuses;
      });
    } catch (error) {
      console.error('Failed to execute tool:', error);

      // Update status to error
      setToolCallStatuses(prev => {
        const newStatuses = new Map(prev);
        newStatuses.set(toolCall.tool_call_id, {
          tool_call_id: toolCall.tool_call_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        });
        return newStatuses;
      });
    }
  }, [agent]);

  // Complete a tool call manually
  const completeTool = useCallback((toolCallId: string, result: any, success: boolean = true, error?: string) => {
    const toolResult: ToolResult = {
      tool_call_id: toolCallId,
      result,
      success,
      error
    };
    setToolResults(prev => [...prev, toolResult]);

    // Update status
    setToolCallStatuses(prev => {
      const newStatuses = new Map(prev);
      newStatuses.set(toolCallId, {
        tool_call_id: toolCallId,
        status: success ? 'completed' : 'error',
        result,
        error,
        completedAt: new Date()
      });
      return newStatuses;
    });
  }, []);

  // Get tool call status
  const getToolCallStatus = useCallback((toolCallId: string) => {
    return toolCallStatuses.get(toolCallId);
  }, [toolCallStatuses]);

  // Send all collected tool results
  const sendToolResults = useCallback(async () => {
    if (agent && toolResults.length > 0) {
      const toolResultParts: DistriPart[] = toolResults.map(result => ({
        type: 'tool_result',
        tool_result: result
      }));

      const toolResultMessage = DistriClient.initDistriMessage('tool', toolResultParts);
      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(toolResultMessage, context);

      try {
        await agent.invoke({
          message: a2aMessage,
          metadata: context.metadata
        });
        // Clear tool results after sending
        setToolResults([]);
      } catch (err) {
        console.error('Failed to send tool results:', err);
      }
    }
  }, [agent, toolResults, createInvokeContext]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    sendMessageStream,
    isLoading,
    error,
    clearMessages,
    agent: agent || undefined,
    pendingToolCalls: toolCalls,
    toolResults,
    sendToolResults,
    executeTool,
    completeTool,
    getToolCallStatus,
    stopStreaming
  };
} 