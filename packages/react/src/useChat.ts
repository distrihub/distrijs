import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Message,
  MessageSendParams,
  DistriClient
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
  sendMessage: (text: string, configuration?: MessageSendParams['configuration']) => Promise<void>;
  sendMessageStream: (text: string, configuration?: MessageSendParams['configuration']) => Promise<void>;
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

  useEffect(() => {
    if (!clientLoading && !clientError && contextId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [clientLoading, clientError, contextId, fetchMessages]);

  const sendMessage = useCallback(async (
    input: string,
    configuration?: MessageSendParams['configuration']
  ) => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userMessage = DistriClient.initMessage(input, 'user', contextId);
      // Add user message to local state immediately
      setMessages(prev => [...prev, userMessage]);

      const params = DistriClient.initMessageParams(userMessage, configuration);

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
    input: string,
    configuration?: MessageSendParams['configuration']
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
      abortControllerRef.current = new AbortController();

      const userMessage = DistriClient.initMessage(input, 'user', contextId);
      // Add user message to local state immediately
      setMessages(prev => [...prev, userMessage]);

      const params = DistriClient.initMessageParams(userMessage, {
        blocking: false,
        acceptedOutputModes: ['text/plain'],
        ...configuration
      });
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