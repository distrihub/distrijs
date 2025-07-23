import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAgent } from './useAgent';
import {
  type Message,
  type DistriAgent,
  type ToolHandler,
  type MessageMetadata,
  type ToolResult,
  type ToolCall,
  InvokeConfig,
  DistriClient,
  DistriEvent,
  ToolCallResultEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
} from '@distri/core';
import type { Part, TaskStatusUpdateEvent } from '@a2a-js/sdk/client';
import { extractExternalToolCalls, ToolCallState, ToolHandlerResult } from './utils/toolCallUtils';

export interface UseChatOptions {
  agentId: string;
  threadId: string;
  // Optional: pre-configured agent from useAgent
  agent?: any;
  // Optional: agent configuration
  tools?: Record<string, ToolHandler>;
  // Optional: Metadata to pass to the agent
  metadata?: any
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
  agent: DistriAgent | null;
  // Tool call state - updated during streaming
  toolCallStatus: Record<string, ToolCallState>;
  toolHandlerResults: Record<string, ToolHandlerResult>;
  cancelToolExecution: () => void;
}

/**
 * useChat is the main hook for chat UIs.
 * It handles all chat logic internally and can optionally accept a pre-configured agent.
 * For advanced agent configuration, use useAgent and pass the agent to useChat.
 * 
 * sendParams: MessageSendParams configuration (auth, output modes, etc.)
 * {
 *   configuration: {
 *     acceptedOutputModes: ['text/plain'],
 *     blocking: false
 *   },
 *   // Executor Metadata (https://github.com/distrihub/distri/blob/main/distri/src/agent/types.rs#L97)
 *   metadata: {
 *     tools: {
 *       tool1: { .. },
 *       tool2: { ... }
 *     }
 *   }
 * }
 * 
 * contextMetadata: MessageMetadata for tool responses and content
 * {
 *   type: 'tool_response',
 *   tool_call_id: '...',
 *   result: '...'
 * }
 */

export function useChat({
  agentId,
  threadId,
  agent: providedAgent,
  tools,
  metadata,
}: UseChatOptions): UseChatResult {
  // Use provided agent or create one internally
  const { agent: internalAgent } = useAgent({
    agentId,
  });

  const agent = providedAgent || internalAgent;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const invokeConfig = useMemo(() => {
    return {
      tools: tools,
      contextId: threadId,
      configuration: {
        acceptedOutputModes: ['text/plain'],
        blocking: false
      },
      metadata: metadata
    } as InvokeConfig;
  }, [tools]);

  // Tool call status - updated during streaming
  const [toolCallStatus, setToolCallStatus] = useState<Record<string, ToolCallState>>({});

  // External tool calls - handled separately after streaming
  const [toolHandlerResults, setToolHandlerResults] = useState<Record<string, ToolHandlerResult>>({});

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, threadId]);

  // Update tool call status during streaming
  const updateToolCallStatus = useCallback((toolCallId: string, updates: Partial<ToolCallState>) => {
    setToolCallStatus(prev => ({
      ...prev,
      [toolCallId]: {
        ...prev[toolCallId],
        ...updates
      }
    }));
  }, []);

  // Initialize tool call status from streaming events
  const initializeToolCallStatus = useCallback((event: ToolCallStartEvent) => {
    const toolCall = event.data;
    setToolCallStatus(prev => ({
      ...prev,
      [toolCall.tool_call_id]: {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_call_name,
        status: 'running',
        input: '',
        result: null,
        error: null,
      }
    }));
  }, []);

  // Cancel tool execution
  const cancelToolExecution = useCallback(() => {
    setToolHandlerResults({});
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const onToolComplete = async (toolCallId: string, result: ToolResult) => {

    setToolHandlerResults((prev) => ({
      ...prev,
      [toolCallId]: {
        tool_call_id: toolCallId,
        result: result.result,
        success: result.success,
        error: result.error || null
      }
    }));

    let completed = true;
    for (const toolCallId in toolHandlerResults) {
      if (!toolHandlerResults[toolCallId]) {
        completed = false;
        break;
      }
    }
    if (completed) {
      sendToolResponses(invokeConfig);
    }
  };

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
        setMessages((prev) => [...prev, result.message!]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
    } finally {
      setLoading(false);
    }
  }, [agent, threadId]);



  const handleToolCalls = async (toolcalls: ToolCall[], config: InvokeConfig): Promise<void> => {
    // Handle external tool calls from assistant_response metadata
    for (const toolCall of toolcalls) {
      await handleToolCall(toolCall, config);
    }
  }

  /**
* Handle a single external tool call
*/
  const handleToolCall = async (toolCall: ToolCall, invokeConfig: InvokeConfig): Promise<any> => {
    if (!invokeConfig.tools || !invokeConfig.tools[toolCall.tool_name]) {
      throw new Error(`No handler found for external tool: ${toolCall.tool_name}`);
    }


    const result = await invokeConfig.tools[toolCall.tool_name](toolCall, onToolComplete);
    return result;
  }

  const sendToolResponses = async (invokeConfig: InvokeConfig): Promise<void> => {
    const responseMessage = DistriClient.initMessage([], 'user', { contextId: invokeConfig.contextId });
    let results: ToolResult[] = [];
    for (const toolCallId in toolHandlerResults) {
      results.push({
        tool_call_id: toolCallId,
        result: toolHandlerResults[toolCallId].result,
        success: toolHandlerResults[toolCallId].success,
        error: toolHandlerResults[toolCallId].error || undefined
      });
    }
    const metadata = {
      type: 'tool_responses',
      results: results
    } as MessageMetadata;

    await sendMessage(responseMessage.parts, metadata);
  }

  const handleMessageEvent = async (event: Message) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.messageId === event.messageId);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], parts: [...updated[idx].parts, ...event.parts] };
        return updated;
      } else {
        return [...prev, event as Message];
      }
    });

    if (event.metadata?.type === 'assistant_response' && event.metadata.tool_calls) {

      console.log('tool calls', event.metadata.tool_calls);
      let toolCalls = event.metadata.tool_calls as ToolCall[];
      await handleToolCalls(toolCalls, invokeConfig);
    }
  }

  const handleTaskStatusUpdateEvent = async (task_event: TaskStatusUpdateEvent) => {
    let event = task_event.metadata as unknown as DistriEvent;
    if (event.type === 'tool_call_start') {
      let tool_call_start = event as ToolCallStartEvent;
      initializeToolCallStatus(tool_call_start);
    } else if (event.type === 'tool_call_args') {
      let tool_call_args = event as ToolCallArgsEvent;
      updateToolCallStatus(tool_call_args.data.tool_call_id, {
        input: tool_call_args.data.delta,
      });
    } else if (event.type === 'tool_call_end') {
      let tool_call_end = event as ToolCallEndEvent;
      updateToolCallStatus(tool_call_end.data.tool_call_id, {
        status: 'completed',
      });
    } else if (event.type === 'tool_call_result') {
      let tool_call_result = event as ToolCallResultEvent;
      updateToolCallStatus(tool_call_result.data.tool_call_id, {
        status: 'completed',
        result: tool_call_result.data.result,
        error: null,
      });
    }
  }
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
        if (event.kind === 'message') {
          await handleMessageEvent(event);
        } else if (event.kind === 'task-status-update') {
          await handleTaskStatusUpdateEvent(event);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err : new Error('Failed to stream message'));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [agent, threadId, initializeToolCallStatus, updateToolCallStatus]);



  const clearMessages = useCallback(() => {
    setMessages([]);
    setToolCallStatus({});
    setToolHandlerResults({});
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
    // Tool call state - updated during streaming
    toolCallStatus,
    toolHandlerResults,
    cancelToolExecution,
  };
} 