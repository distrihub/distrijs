import { useState, useCallback, useEffect, useRef } from 'react';
import { Agent, DistriClient } from '@distri/core';
import {
  DistriMessage,
  DistriPart,
  InvokeContext,
  DistriEvent,
  convertDistriMessageToA2A
} from '@distri/core';
import { decodeA2AStreamEvent } from '../../core/src/encoder';
import { DistriStreamEvent, isDistriMessage } from '../../core/src/types';

export interface UseChatOptions {
  threadId: string;
  agent?: Agent;
  onMessage?: (message: DistriStreamEvent) => void;
  onError?: (error: Error) => void;
  metadata?: any;
  onMessagesUpdate?: () => void;
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
}

export function useChat({
  threadId,
  onMessage,
  onError,
  metadata,
  onMessagesUpdate,
  agent,
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

    onMessage?.(event);

  }, [onMessage]);



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

  return {
    messages,
    isStreaming,
    sendMessage,
    sendMessageStream,
    isLoading,
    error,
    clearMessages,
    agent: agent || undefined
  };
} 