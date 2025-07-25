import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Agent, DistriClient, ToolCall, ToolResult, MessageMetadata } from '@distri/core';
import { Message, Part } from '@a2a-js/sdk/client';
import { useAgent } from './useAgent';
import { extractExternalToolCalls } from './utils/toolCallUtils';

export interface UseChatOptions {
  agentId: string;
  threadId: string;
  agent?: Agent;
  onToolCalls?: (toolCalls: ToolCall[]) => void;
}

export interface UseChatResult {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  agent: Agent | null;
  sendMessage: (input: string | Part[], metadata?: MessageMetadata) => Promise<void>;
  sendMessageStream: (input: string | Part[], metadata?: MessageMetadata) => Promise<void>;
  fetchMessages: () => Promise<void>;
  externalToolCalls: ToolCall[];
  handleExternalToolComplete: (results: ToolResult[]) => Promise<void>;
  handleExternalToolCancel: () => void;
}

/**
 * Enhanced useChat hook with integrated tool system
 */
export function useChat({
  agentId,
  threadId,
  agent: providedAgent,
  onToolCalls,
}: UseChatOptions): UseChatResult {
  // Use provided agent or create one internally
  const { agent: internalAgent } = useAgent({ 
    agentId: providedAgent ? undefined : (agentId || undefined) 
  });
  const agent = providedAgent || internalAgent;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [externalToolCalls, setExternalToolCalls] = useState<ToolCall[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const invokeConfig = useMemo(() => ({
    configuration: {
      acceptedOutputModes: ['text/plain', 'text/markdown'],
      blocking: true,
    },
  }), []);

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    if (!agent) return;

    try {
      setError(null);
      const msgs = await agent.getThreadMessages(threadId);
      setMessages(msgs);
      
      // Extract any unhandled external tool calls
      const toolCalls = extractExternalToolCalls(msgs);
      if (toolCalls.length > 0) {
        setExternalToolCalls(toolCalls);
        onToolCalls?.(toolCalls);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    }
  }, [agent, threadId, onToolCalls]);

  // Fetch messages when agent or threadId changes
  useEffect(() => {
    if (agent && threadId) {
      fetchMessages();
    }
  }, [fetchMessages]);

  // Handle tool calls from assistant messages
  const handleToolCalls = useCallback(async (toolCalls: ToolCall[]): Promise<void> => {
    if (!agent || toolCalls.length === 0) return;

    // Check if any tool calls need UI interaction (external tools)
    const externalToolNames = [
      'approval_request',
      'toast', 
      'input_request',
      // Add other UI-requiring tools here
    ];

    const externalCalls = toolCalls.filter(tc => 
      externalToolNames.includes(tc.tool_name) || !agent.hasTool(tc.tool_name)
    );
    
    const internalCalls = toolCalls.filter(tc => 
      !externalToolNames.includes(tc.tool_name) && agent.hasTool(tc.tool_name)
    );

    let allResults: ToolResult[] = [];

    // Execute internal tools immediately
    if (internalCalls.length > 0) {
      try {
        const internalResults = await agent.executeToolCalls(internalCalls);
        allResults = [...allResults, ...internalResults];
      } catch (error) {
        console.error('Error executing internal tools:', error);
        const errorResults: ToolResult[] = internalCalls.map(tc => ({
          tool_call_id: tc.tool_call_id,
          result: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
        allResults = [...allResults, ...errorResults];
      }
    }

    // Set external tool calls for UI handling
    if (externalCalls.length > 0) {
      setExternalToolCalls(externalCalls);
      onToolCalls?.(externalCalls);
    }

    // If we have internal results, send them back immediately
    if (allResults.length > 0) {
      await continueWithToolResults(allResults);
    }
  }, [agent, threadId, invokeConfig.configuration, onToolCalls]);

  // Continue conversation with tool results
  const continueWithToolResults = useCallback(async (results: ToolResult[]) => {
    if (!agent || results.length === 0) return;

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

    try {
      const stream = await agent.invokeStream(params);
      
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        await handleStreamEvent(event);
      }
    } catch (err) {
      console.error('Error continuing conversation with tool results:', err);
      setError(err instanceof Error ? err : new Error('Failed to continue conversation'));
    }
  }, [agent, threadId, invokeConfig.configuration]);

  // Handle external tool completion
  const handleExternalToolComplete = useCallback(async (results: ToolResult[]) => {
    // Clear external tool calls
    setExternalToolCalls([]);
    
    // Continue conversation with results
    await continueWithToolResults(results);
  }, [continueWithToolResults]);

  // Handle external tool cancellation
  const handleExternalToolCancel = useCallback(() => {
    setExternalToolCalls([]);
    setLoading(false);
  }, []);

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
      const msgMetadata = message.metadata as any;
      if (msgMetadata?.type === 'assistant_response' && msgMetadata.tool_calls) {
        const toolCalls = msgMetadata.tool_calls as ToolCall[];
        await handleToolCalls(toolCalls);
      }
    } else if (event.kind === 'status-update') {
      // Handle task status updates if needed
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
        
        // Handle tool calls if present in the response
        const resultMetadata = (result.message as any).metadata;
        if (resultMetadata?.type === 'assistant_response' && resultMetadata.tool_calls) {
          const toolCalls = resultMetadata.tool_calls as ToolCall[];
          await handleToolCalls(toolCalls);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
    } finally {
      setLoading(false);
    }
  }, [agent, threadId, invokeConfig.configuration, handleToolCalls]);

  // Send a message (streaming)
  const sendMessageStream = useCallback(async (
    input: string | Part[],
    metadata?: MessageMetadata
  ) => {
    if (!agent) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Add user message immediately
    const userMessage: Message = DistriClient.initMessage(input, 'user', { contextId: threadId, metadata });
    setMessages((prev) => [...prev, userMessage]);

    const params = DistriClient.initMessageParams(userMessage, invokeConfig.configuration, metadata);

    try {
      setLoading(true);
      setError(null);
      const stream = await agent.invokeStream(params);

      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        await handleStreamEvent(event);
      }
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        setError(err instanceof Error ? err : new Error('Failed to send message'));
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [agent, threadId, invokeConfig.configuration, handleStreamEvent]);

  return {
    messages,
    loading,
    error,
    agent,
    sendMessage,
    sendMessageStream,
    fetchMessages,
    externalToolCalls,
    handleExternalToolComplete,
    handleExternalToolCancel,
  };
} 