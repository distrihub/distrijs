import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Message,
  MessageSendParams,
} from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseChatOptions {
  agentId: string;
  contextId?: string;
}

export interface UseChatResult {
  loading: boolean;
  error: Error | null;
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (params: MessageSendParams) => Promise<void>;
  sendMessageStream: (params: MessageSendParams) => Promise<void>;
  clearMessages: () => void;
  refreshMessages: () => Promise<void>;
  abort: () => void;
}

export function useChat({ agentId, contextId }: UseChatOptions): UseChatResult {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!client || !contextId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedMessages = await client.getThreadMessages(contextId);
      setMessages(fetchedMessages);
    } catch (err) {
      console.error('[useThreadMessages] Failed to fetch messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
      setMessages([]); // Clear messages on error
    } finally {
      setLoading(false);
    }
  }, [client, contextId]);

  // Load messages when conditions change, but don't include fetchMessages in dependencies
  useEffect(() => {
    if (!clientLoading && !clientError && contextId && client) {
      fetchMessages();
    } else {
      setMessages([]);
    }
    // Don't include fetchMessages in dependencies to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientLoading, clientError, contextId, client]);

  const sendMessage = useCallback(async (
    params: MessageSendParams,
  ) => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // const userMessage = DistriClient.initMessage(input, 'user', contextId);
      // Add user message to local state immediately
      setMessages(prev => [...prev, params.message]);

      const result = await client.sendMessage(agentId, params);

      let message = undefined;
      if (result.kind === 'message') {
        message = (result as Message);
      } else if (result.kind === 'task') {
        message = result.status.message as Message;
      }

      if (!message) {
        throw new Error('Invalid response format');
      }

      setMessages((prev: Message[]) => {
        if (prev.find(msg => msg.messageId === message.messageId)) {
          return prev.map(msg => {
            if (msg.messageId === message.messageId) {
              return {
                ...msg,
                parts: [...msg.parts, ...message.parts],
              };
            }
            return msg;
          });
        } else {
          return [...prev, message];
        }
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('Failed to send message'));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);

  const sendMessageStream = useCallback(async (
    params: MessageSendParams,
  ) => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsStreaming(true);

      // Cancel any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();      // const userMessage = DistriClient.initMessage(input, 'user', contextId);
      // Add user message to local state immediately
      setMessages(prev => [...prev, params.message]);


      setIsStreaming(true);

      const stream = await client.sendMessageStream(agentId, params);

      for await (const event of stream) {

        if (abortControllerRef.current?.signal.aborted) {
          console.log('abort signal received');
          break;
        }

        let message = undefined;
        if (event.kind === 'message') {
          message = (event as Message);
        }

        if (!message) continue;
        setMessages((prev: Message[]) => {
          if (prev.find(msg => msg.messageId === message.messageId)) {
            return prev.map(msg => {
              if (msg.messageId === message.messageId) {
                return {
                  ...msg,
                  parts: [...msg.parts, ...message.parts],
                };
              }
              return msg;
            });
          } else {
            return [...prev, message];
          }
        });
      }
      setIsStreaming(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stream was cancelled, not an error
        return;
      }
      console.log('error', err);

      setError(err instanceof Error ? err : new Error('Failed to stream message'));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [client, agentId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    loading: loading || clientLoading,
    error: error || clientError,
    messages,
    isStreaming,
    sendMessage,
    sendMessageStream,
    clearMessages,
    refreshMessages: fetchMessages,
    abort,
  };
}