import { useCallback, useEffect, useState, useRef } from 'react';
import { DistriEvent, DistriMessage, DistriArtifact, Agent, isDistriMessage, isDistriEvent } from '@distri/core';
import { decodeA2AStreamEvent } from '../../../core/src/encoder';

export interface UseChatMessagesOptions {
  initialMessages?: (DistriEvent | DistriMessage | DistriArtifact)[];
  agent?: Agent;
  threadId?: string;
  onError?: (error: Error) => void;
  onMessageProcess?: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
  clearStoreState?: () => void;
}

export interface UseChatMessagesReturn {
  messages: (DistriEvent | DistriMessage | DistriArtifact)[];
  addMessage: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
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
  onMessageProcess,
  clearStoreState,
}: UseChatMessagesOptions = {}): UseChatMessagesReturn {
  // Store callbacks in refs to avoid dependency issues
  const onErrorRef = useRef(onError);
  const onMessageProcessRef = useRef(onMessageProcess);

  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onMessageProcessRef.current = onMessageProcess;
  }, [onMessageProcess]);

  const [messages, setMessages] = useState<(DistriEvent | DistriMessage | DistriArtifact)[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Handle initialMessages updates
  useEffect(() => {
    if (initialMessages.length > 0) {
      // Clear store state first to ensure clean slate
      clearStoreState?.();
      setMessages(initialMessages);
      // Process each message through the callback
      initialMessages.forEach(message => onMessageProcessRef.current?.(message));
    }
  }, [initialMessages, clearStoreState]);

  const addMessage = useCallback((message: DistriEvent | DistriMessage | DistriArtifact) => {
    setMessages(prev => {

      if (isDistriEvent(message)) {
        const event = message as DistriEvent;

        if (event.type === 'text_message_start') {
          // Create a new message with the specified ID and role
          const messageId = event.data.message_id;
          const role = event.data.role;

          const newDistriMessage: DistriMessage = {
            id: messageId,
            role,
            parts: [{ type: 'text', text: '' }]
          };

          return [...prev, newDistriMessage];
        } else if (event.type === 'text_message_content') {
          // Find existing message and append delta to text part
          const messageId = event.data.message_id;
          const delta = event.data.delta;

          const existingIndex = prev.findIndex(
            m => isDistriMessage(m) && (m as DistriMessage).id === messageId
          );

          if (existingIndex >= 0) {
            const existing = prev[existingIndex] as DistriMessage;
            let textPart = existing.parts.find(p => p.type === 'text') as any;
            if (!textPart) {
              textPart = { type: 'text', text: '' };
              existing.parts.push(textPart);
            }
            textPart.text += delta;
          }
        } else if (event.type === 'text_message_end') {
          // Message is complete, no additional action needed
          // The message already exists and has been updated with content
        } else {
          // For other event types, just append
          return [...prev, message];
        }
      }
      return [...prev, message];
    });
    onMessageProcessRef.current?.(message);
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
      const distriMessages = a2aMessages.map(decodeA2AStreamEvent).filter(Boolean) as (DistriEvent | DistriMessage | DistriArtifact)[];

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