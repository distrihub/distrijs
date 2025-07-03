import { useState, useEffect, useCallback } from 'react';
import { DistriThread, Message } from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseThreadsResult {
  threads: DistriThread[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createThread: (agentId: string, title: string) => DistriThread;
  deleteThread: (threadId: string) => Promise<void>;
  updateThread: (threadId: string) => Promise<void>;
}

export function useThreads(): UseThreadsResult {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = useState<DistriThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!client) {
      console.log('[useThreads] Client not available, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[useThreads] Fetching threads...');
      const fetchedThreads = await client.getThreads();
      console.log('[useThreads] Fetched threads:', fetchedThreads);
      setThreads(fetchedThreads);
    } catch (err) {
      console.error('[useThreads] Failed to fetch threads:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch threads'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createThread = useCallback((agentId: string, title: string): DistriThread => {
    const newThread: DistriThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      agent_id: agentId,
      agent_name: agentId, // Will be updated when we have agent info
      updated_at: new Date().toISOString(),
      message_count: 0,
      last_message: undefined,
    };

    setThreads(prev => [newThread, ...prev]);
    return newThread;
  }, []);

  const deleteThread = useCallback(async (threadId: string) => {
    if (!client) {
      throw new Error('Client not available');
    }

    try {
             // Try to delete from server (may not exist yet for local threads)
       const response = await fetch(`${client.baseUrl}/api/v1/threads/${threadId}`, {
         method: 'DELETE',
       });

      // Remove from local state regardless of server response
      setThreads(prev => prev.filter(thread => thread.id !== threadId));
    } catch (err) {
      // Still remove from local state even if server delete fails
      setThreads(prev => prev.filter(thread => thread.id !== threadId));
      console.warn('Failed to delete thread from server, but removed locally:', err);
    }
  }, [client]);

  const updateThread = useCallback(async (threadId: string) => {
    if (!client) {
      return;
    }

         try {
       const response = await fetch(`${client.baseUrl}/api/v1/threads/${threadId}`);
       if (response.ok) {
        const updatedThread = await response.json();
        setThreads(prev =>
          prev.map(thread =>
            thread.id === threadId ? updatedThread : thread
          )
        );
      }
    } catch (err) {
      console.warn('Failed to update thread:', err);
    }
  }, [client]);

  useEffect(() => {
    if (clientLoading) {
      console.log('[useThreads] Client is loading, waiting...');
      setLoading(true);
      return;
    }

    if (clientError) {
      console.error('[useThreads] Client error:', clientError);
      setError(clientError);
      setLoading(false);
      return;
    }

    if (client) {
      console.log('[useThreads] Client ready, fetching threads');
      fetchThreads();
    } else {
      console.log('[useThreads] No client available');
      setLoading(false);
    }
  }, [clientLoading, clientError, client, fetchThreads]);

  return {
    threads,
    loading: loading || clientLoading,
    error: error || clientError,
    refetch: fetchThreads,
    createThread,
    deleteThread,
    updateThread
  };
}

export interface UseThreadMessagesOptions {
  threadId: string | null;
}

export interface UseThreadMessagesResult {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useThreadMessages({ threadId }: UseThreadMessagesOptions): UseThreadMessagesResult {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!client || !threadId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedMessages = await client.getThreadMessages(threadId);
      setMessages(fetchedMessages);
    } catch (err) {
      console.error('[useThreadMessages] Failed to fetch messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
      setMessages([]); // Clear messages on error
    } finally {
      setLoading(false);
    }
  }, [client, threadId]);

  useEffect(() => {
    if (!clientLoading && !clientError && threadId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [clientLoading, clientError, threadId, fetchMessages]);

  return {
    messages,
    loading: loading || clientLoading,
    error: error || clientError,
    refetch: fetchMessages
  };
}