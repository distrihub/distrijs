import { useState, useEffect, useCallback } from 'react';
import { Message } from '@distri/core';
import { useDistriClient } from './DistriProvider';

export interface UseMessagesOptions {
  threadId: string;
  limit?: number;
  autoSubscribe?: boolean;
}

export interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  sendMessage: (data: {
    content: string;
    contentType?: 'text' | 'markdown' | 'json' | 'file';
    replyTo?: string;
    attachments?: any[];
    metadata?: Record<string, any>;
  }) => Promise<Message>;
  editMessage: (messageId: string, content: string) => Promise<Message>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useMessages({ 
  threadId, 
  limit = 50, 
  autoSubscribe = true 
}: UseMessagesOptions): UseMessagesResult {
  const client = useDistriClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchMessages = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentOffset = reset ? 0 : offset;
      const fetchedMessages = await client.getMessages(threadId, {
        limit,
        offset: currentOffset
      });
      
      if (reset) {
        setMessages(fetchedMessages);
        setOffset(fetchedMessages.length);
      } else {
        setMessages(prev => [...prev, ...fetchedMessages]);
        setOffset(prev => prev + fetchedMessages.length);
      }
      
      setHasMore(fetchedMessages.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setLoading(false);
    }
  }, [client, threadId, limit, offset]);

  const refetch = useCallback(() => {
    setOffset(0);
    return fetchMessages(true);
  }, [fetchMessages]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchMessages(false);
  }, [fetchMessages, hasMore, loading]);

  const sendMessage = useCallback(async (data: {
    content: string;
    contentType?: 'text' | 'markdown' | 'json' | 'file';
    replyTo?: string;
    attachments?: any[];
    metadata?: Record<string, any>;
  }) => {
    try {
      const newMessage = await client.sendMessage({
        threadId,
        ...data
      });
      
      // Add to beginning of messages list
      setMessages(prev => [newMessage, ...prev]);
      return newMessage;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      throw error;
    }
  }, [client, threadId]);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const updatedMessage = await client.editMessage(messageId, content);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ));
      return updatedMessage;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to edit message');
      setError(error);
      throw error;
    }
  }, [client]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await client.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete message');
      setError(error);
      throw error;
    }
  }, [client]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await client.addReaction(messageId, emoji);
      // The message update will come through the event handler
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add reaction');
      setError(error);
      throw error;
    }
  }, [client]);

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await client.removeReaction(messageId, emoji);
      // The message update will come through the event handler
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove reaction');
      setError(error);
      throw error;
    }
  }, [client]);

  // Initial fetch
  useEffect(() => {
    if (threadId) {
      refetch();
    }
  }, [threadId, refetch]);

  // Auto-subscribe to thread events
  useEffect(() => {
    if (!autoSubscribe || !threadId) return;

    const subscribe = async () => {
      try {
        await client.subscribeToThread(threadId);
      } catch (err) {
        console.warn('Failed to subscribe to thread:', err);
      }
    };

    subscribe();

    return () => {
      // Unsubscribe when component unmounts or threadId changes
      client.unsubscribeFromThread(threadId).catch(err => {
        console.warn('Failed to unsubscribe from thread:', err);
      });
    };
  }, [client, threadId, autoSubscribe]);

  // Handle real-time message events
  useEffect(() => {
    const handleMessageReceived = (message: Message) => {
      if (message.threadId === threadId) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          if (prev.some(m => m.id === message.id)) {
            return prev.map(m => m.id === message.id ? message : m);
          }
          return [message, ...prev];
        });
      }
    };

    client.on('message_received', handleMessageReceived);

    return () => {
      client.off('message_received', handleMessageReceived);
    };
  }, [client, threadId]);

  return {
    messages,
    loading,
    error,
    refetch,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    loadMore,
    hasMore
  };
}