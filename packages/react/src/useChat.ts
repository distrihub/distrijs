import { useState, useCallback, useEffect, useRef } from 'react';
import { Agent, DistriClient } from '@distri/core';
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
import { useToolManager } from './hooks/useToolManager';

interface ToolHandler {
  (input: any): Promise<any> | any;
}

export interface UseChatOptions {
  threadId: string;
  agent?: Agent;
  onMessage?: (message: DistriStreamEvent) => void;
  onError?: (error: Error) => void;
  metadata?: any;
  onMessagesUpdate?: () => void;
  tools?: Record<string, ToolHandler>;
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
  getToolCallStatus: (toolCallId: string) => any;
}

export function useChat({
  threadId,
  onMessage,
  onError,
  metadata,
  onMessagesUpdate,
  agent,
  tools = {},
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<(DistriMessage | DistriEvent)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Tool handling with the new manager
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);

  const {
    toolCalls,
    addToolCalls,
    executeTool,
    completeTool,
    getToolCallStatus
  } = useToolManager({
    tools,
    autoExecute: false, // Don't auto-execute, let user control
    onToolComplete: (_toolCallId, result) => {
      setToolResults(prev => [...prev, result]);
    }
  });


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
      console.log('distriMessages', distriMessages);
      setMessages(distriMessages);
      onMessagesUpdate?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch messages');
      setError(error);
      onError?.(error);
    }
  }, [threadId, agent, onError, onMessagesUpdate]);

  // Fetch messages on mount and when threadId changes
  useEffect(() => {
    if (threadId) {
      fetchMessages();
    }
  }, [fetchMessages, threadId]);

  const handleStreamEvent = useCallback((event: DistriStreamEvent) => {
    // Handle DistriMessage (converted from A2A Message)
    setMessages(prev => {
      if (isDistriMessage(event)) {
        const distriMessage = event as DistriMessage;
        const existingMessageIndex = prev
          .filter(msg => isDistriMessage(msg))
          .findIndex(msg => msg.id === distriMessage.id);

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

    // Handle tool calls automatically
    if (isDistriMessage(event)) {
      const distriMessage = event as DistriMessage;
      const toolCallParts = distriMessage.parts.filter(part => part.type === 'tool_call');

      if (toolCallParts.length > 0) {
        const toolCalls = toolCallParts.map(part => (part as any).tool_call);
        addToolCalls(toolCalls);
      }
    }

    onMessage?.(event);
  }, [onMessage, tools]);



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
  }, []);

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

  return {
    messages,
    isStreaming,
    sendMessage,
    sendMessageStream,
    isLoading,
    error,
    clearMessages,
    agent: agent || undefined,
    pendingToolCalls: toolCalls.map(tc => tc.toolCall),
    toolResults,
    sendToolResults,
    executeTool,
    completeTool,
    getToolCallStatus
  };
} 