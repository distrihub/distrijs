import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAgent } from './useAgent';
import {
  type Message,
  type MessageMetadata,
  type ToolResult,
  type ToolCall,
  InvokeConfig,
  DistriClient,
  Agent,
} from '@distri/core';
import type { Part } from '@a2a-js/sdk/client';

export interface UseChatOptions {
  agentId: string;
  threadId: string;
  // Optional: pre-configured agent from useAgent
  agent?: Agent;
  // Optional: Metadata to pass to the agent
  metadata?: any;
}

export interface UseChatResult {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  isStreaming: boolean;
  sendMessage: (input: string | Part[], metadata?: MessageMetadata) => Promise<void>;
  sendMessageStream: (input: string | Part[], metadata?: MessageMetadata) => Promise<void>;
  refreshMessages: () => Promise<void>;
  clearMessages: () => void;
  agent: Agent | null;
}

/**
 * useChat is the main hook for chat UIs with simplified tool handling.
 * Tools are now registered directly on the agent using agent.addTool() or useTools hook.
 */
export function useChat({
  agentId,
  threadId,
  agent: providedAgent,
  metadata,
}: UseChatOptions): UseChatResult {
  // Use provided agent or create one internally
  const { agent: internalAgent } = useAgent({
    agentId,
  });

  // Use provided agent if it's a proper Agent instance, otherwise use internal agent
  const agent = (providedAgent && typeof providedAgent.getThreadMessages === 'function') ? providedAgent : internalAgent;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const invokeConfig = useMemo(() => {
    return {
      contextId: threadId,
      configuration: {
        acceptedOutputModes: ['text/plain'],
        blocking: false
      },
      metadata: metadata
    } as InvokeConfig;
  }, [threadId, metadata]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch messages for the thread
  const fetchMessages = useCallback(async () => {
    if (!agent || !threadId) {
      setMessages([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedMessages = await agent.getThreadMessages(threadId);
      setMessages(fetchedMessages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [agent, threadId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Handle tool calls from assistant messages
  const handleToolCalls = useCallback(async (toolCalls: ToolCall[]): Promise<void> => {
    if (!agent) return;

    const results: ToolResult[] = [];

    // Execute all tool calls
    for (const toolCall of toolCalls) {
      const result = await agent.executeTool(toolCall);
      results.push(result);
    }

    // Send tool responses back to the agent
    if (results.length > 0) {
      const responseMessage = DistriClient.initMessage([], 'user', { 
        contextId: threadId, 
        metadata: {
          type: 'tool_responses',
          results: results
        } as MessageMetadata
      });

      const params = DistriClient.initMessageParams(
        responseMessage, 
        invokeConfig.configuration, 
        responseMessage.metadata as MessageMetadata
      );

      // Continue the conversation with tool results
      try {
        const stream = await agent.invokeStream(params);
        
        for await (const event of stream) {
          if (abortControllerRef.current?.signal.aborted) break;
          await handleStreamEvent(event);
        }
      } catch (err) {
        console.error('Error continuing conversation with tool results:', err);
      }
    }
  }, [agent, threadId, invokeConfig.configuration]);

  // Handle individual stream events
  const handleStreamEvent = useCallback(async (event: any) => {
    if (event.kind === 'message') {
      const message = event as Message;
      
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.messageId === message.messageId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], parts: [...updated[idx].parts, ...message.parts] };
          return updated;
        } else {
          return [...prev, message];
        }
      });

      // Handle tool calls if present
      if (message.metadata?.type === 'assistant_response' && message.metadata.tool_calls) {
        const toolCalls = message.metadata.tool_calls as ToolCall[];
        await handleToolCalls(toolCalls);
      }
    } else if (event.kind === 'status-update') {
      // Handle task status updates if needed
      // These events can be used for progress indicators, etc.
      console.debug('Task status update:', event);
    }
  }, [handleToolCalls]);

  // Send a message (non-streaming)
  const sendMessage = useCallback(async (
    input: string | Part[],
    metadata?: MessageMetadata
  ) => {
    if (!agent) return;

    // Add user message immediately
    const userMessage: Message = DistriClient.initMessage(input, 'user', { contextId: threadId, metadata });
    setMessages((prev) => [...prev, userMessage]);

    const params = DistriClient.initMessageParams(userMessage, invokeConfig.configuration, metadata);
    try {
      setLoading(true);
      setError(null);
      const result = await agent.invoke(params);
      if (result && 'message' in result && result.message) {
        setMessages((prev) => [...prev, result.message as Message]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
    } finally {
      setLoading(false);
    }
  }, [agent, threadId, invokeConfig.configuration]);

  // Send a message (streaming)
  const sendMessageStream = useCallback(async (
    input: string | Part[],
    metadata?: MessageMetadata
  ) => {
    if (!agent) return;

    const userMessage: Message = DistriClient.initMessage(input, 'user', { contextId: threadId, metadata });
    setMessages((prev) => [...prev, userMessage]);

    const params = DistriClient.initMessageParams(userMessage, invokeConfig.configuration, metadata);

    try {
      setLoading(true);
      setIsStreaming(true);
      setError(null);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const stream = await agent.invokeStream(params);

      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        await handleStreamEvent(event);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err : new Error('Failed to stream message'));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [agent, threadId, invokeConfig.configuration, handleStreamEvent]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const refreshMessages = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    isStreaming,
    sendMessage,
    sendMessageStream,
    refreshMessages,
    clearMessages,
    agent: agent ? (agent as any) : null,
  };
} 