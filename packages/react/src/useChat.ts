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
import { useToolCallState, type ToolCallState, type ToolCallStatus } from './hooks/useToolCallState';

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
  
  // Tool call management with new cleaner interface
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  toolCallStates: Map<string, ToolCallState>;
  
  // Tool operations
  executeTool: (toolCall: ToolCall) => Promise<void>;
  completeTool: (toolCallId: string, result: any, success?: boolean, error?: string) => void;
  getToolCallStatus: (toolCallId: string) => ToolCallStatus | undefined;
  getToolCallState: (toolCallId: string) => ToolCallState | undefined;
  hasPendingToolCalls: () => boolean;
  sendToolResults: () => Promise<void>;
  
  stopStreaming: () => void;
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

  // Create InvokeContext for message construction
  const createInvokeContext = useCallback((): InvokeContext => ({
    thread_id: threadId,
    run_id: undefined,
    metadata
  }), [threadId, metadata]);

  // Auto-send tool results when all tools are completed
  const sendToolResultsToAgent = useCallback(async (toolResults: ToolResult[]) => {
    if (agent && toolResults.length > 0) {
      console.log('Auto-sending tool results:', toolResults);
      
      const toolResultParts: DistriPart[] = toolResults.map(result => ({
        type: 'tool_result',
        tool_result: result
      }));

      const toolResultMessage = DistriClient.initDistriMessage('tool', toolResultParts);
      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(toolResultMessage, context);

      try {
        setIsLoading(true);
        await agent.invoke({
          message: a2aMessage,
          metadata: context.metadata
        });
        
        // Clear tool results after sending
        toolCallState.clearToolResults();
      } catch (err) {
        console.error('Failed to send tool results:', err);
        setError(err instanceof Error ? err : new Error('Failed to send tool results'));
      } finally {
        setIsLoading(false);
      }
    }
  }, [agent, createInvokeContext]);

  // Tool state management with auto-send when all completed
  const toolCallState = useToolCallState({
    onAllToolsCompleted: sendToolResultsToAgent
  });

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
      toolCallState.clearAll();
      setError(null);
      agentIdRef.current = agent?.id;
    }
  }, [agent?.id, toolCallState]);

  // Clear messages helper
  const clearMessages = useCallback(() => {
    setMessages([]);
    toolCallState.clearAll();
  }, [toolCallState]);

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
        newToolCalls.forEach(toolCall => {
          toolCallState.addToolCall(toolCall);
        });
      }

      // Process tool results
      const toolResultParts = distriMessage.parts.filter(part => part.type === 'tool_result');
      if (toolResultParts.length > 0) {
        const newToolResults = toolResultParts.map(part => (part as any).tool_result);
        newToolResults.forEach(toolResult => {
          toolCallState.updateToolCallStatus(
            toolResult.tool_call_id,
            toolResult.success ? 'completed' : 'error',
            toolResult.result,
            toolResult.error
          );
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

  // Execute a tool call
  const executeTool = useCallback(async (toolCall: ToolCall) => {
    if (!agent) return;

    // Update status to running
    toolCallState.setToolCallRunning(toolCall.tool_call_id);

    try {
      const result = await agent.executeTool(toolCall);
      // Complete the tool call with the result
      toolCallState.completeToolCall(toolCall.tool_call_id, result.result, result.success, result.error);
    } catch (error) {
      console.error('Failed to execute tool:', error);
      // Set error status
      toolCallState.setToolCallError(
        toolCall.tool_call_id, 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }, [agent, toolCallState]);

  // Complete a tool call manually
  const completeTool = useCallback((toolCallId: string, result: any, success: boolean = true, error?: string) => {
    toolCallState.completeToolCall(toolCallId, result, success, error);
  }, [toolCallState]);

  // Manual send tool results (for backwards compatibility)
  const sendToolResults = useCallback(async () => {
    await sendToolResultsToAgent(toolCallState.toolResults);
  }, [sendToolResultsToAgent, toolCallState.toolResults]);

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
    
    // Tool call management with new cleaner interface
    toolCalls: toolCallState.toolCalls,
    toolResults: toolCallState.toolResults,
    toolCallStates: toolCallState.toolCallStates,
    
    // Tool operations
    executeTool,
    completeTool,
    getToolCallStatus: toolCallState.getToolCallStatus,
    getToolCallState: toolCallState.getToolCallState,
    hasPendingToolCalls: toolCallState.hasPendingToolCalls,
    sendToolResults,
    
    stopStreaming
  };
} 