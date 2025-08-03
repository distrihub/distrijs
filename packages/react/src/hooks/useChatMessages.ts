import { useCallback, useEffect, useState, useRef } from 'react';
import { Agent, DistriChatMessage } from '@distri/core';
import { decodeA2AStreamEvent } from '../../../core/src/encoder';

export interface UseChatMessagesOptions {
  initialMessages?: DistriChatMessage[];
  agent?: Agent;
  threadId?: string;
  onError?: (error: Error) => void;
}

export interface UseChatMessagesReturn {
  messages: DistriChatMessage[];
  addMessage: (message: DistriChatMessage) => void;
  clearMessages: () => void;
  fetchMessages: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useChatMessages({
  initialMessages = [],
  agent,
  threadId,
  onError,
}: UseChatMessagesOptions = {}): UseChatMessagesReturn {
  // Store callbacks in refs to avoid dependency issues
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const [messages, setMessages] = useState<DistriChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Handle initialMessages updates
  useEffect(() => {
    if (initialMessages.length > 0) {
      // Set initial messages directly
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const addMessage = useCallback((message: DistriChatMessage) => {
    setMessages(prev => {
      return [...prev, message];
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!agent || !threadId) return;

    try {
      setIsLoading(true);
      setError(null);
      const a2aMessages = await agent.getThreadMessages(threadId);
      const distriMessages = a2aMessages.map(decodeA2AStreamEvent).filter(Boolean) as (DistriChatMessage)[];

      // Replace all messages with fetched ones
      setMessages(distriMessages);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch messages');
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [agent, threadId]);

  // Fetch messages on mount and when threadId/agent changes (only if no initialMessages)
  useEffect(() => {
    if (threadId && agent && !initialMessages?.length) {
      fetchMessages();
    }
  }, [threadId, agent?.id, initialMessages?.length, fetchMessages]);

  return {
    messages,
    addMessage,
    clearMessages,
    fetchMessages,
    isLoading,
    error,
  };
} 