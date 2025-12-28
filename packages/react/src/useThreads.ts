import { useState, useEffect, useCallback } from 'react';
import { DistriThread } from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseThreadsResult {
  threads: DistriThread[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  fetchThread: (threadId: string) => Promise<DistriThread>;
  updateThread: (threadId: string, localId?: string) => Promise<void>;
}

export function useThreads(): UseThreadsResult {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = useState<DistriThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!client) {
      console.error('[useThreads] Client not available');
      setError(new Error('Client not available'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedThreads = await client.getThreads();
      setThreads(fetchedThreads);
    } catch (err) {
      console.error('[useThreads] Failed to fetch threads:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch threads'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchThread = useCallback(async (threadId: string) => {
    if (!client) {
      throw new Error('Client not available');
    }
    try {
      const response = await client.getThread(threadId);
      return response;
    } catch (err) {
      console.error('[useThreads] Failed to fetch thread:', err);
      throw err;
    }
  }, [client]);

  const deleteThread = useCallback(async (threadId: string) => {
    if (!client) {
      throw new Error('Client not available');
    }

    try {
      // Try to delete from server (may not exist yet for local threads)
      const response = await fetch(`${client.baseUrl}/threads/${threadId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete thread');
      }

      // Remove from local state regardless of server response
      setThreads(prev => prev.filter(thread => thread.id !== threadId));
    } catch (err) {
      // Still remove from local state even if server delete fails
      setThreads(prev => prev.filter(thread => thread.id !== threadId));
      console.warn('Failed to delete thread from server, but removed locally:', err);
    }
  }, [client]);

  const updateThread = useCallback(async (threadId: string, localId?: string) => {
    if (!client) {
      return;
    }

    try {
      const response = await fetch(`${client.baseUrl}/threads/${threadId}`);
      if (response.ok) {
        const updatedThread = await response.json();
        setThreads(prev => {
          // If a local thread with localId exists, replace it with the backend thread
          if (localId && prev.some(thread => thread.id === localId)) {
            return [
              updatedThread,
              ...prev.filter(thread => thread.id !== localId && thread.id !== threadId)
            ];
          }
          // Otherwise, just update by threadId
          return prev.map(thread =>
            thread.id === threadId ? updatedThread : thread
          );
        });
      }
    } catch (err) {
      console.warn('Failed to update thread:', err);
    }
  }, [client]);

  useEffect(() => {
    if (clientLoading) {
      setLoading(true);
      return;
    }

    if (clientError) {
      setError(clientError);
      setLoading(false);
      return;
    }

    if (client) {
      fetchThreads();
    } else {
      setLoading(false);
    }
  }, [clientLoading, clientError, client, fetchThreads]);

  return {
    threads,
    loading: loading || clientLoading,
    error: error || clientError,
    refetch: fetchThreads,
    deleteThread,
    fetchThread,
    updateThread
  };
}

export interface UseThreadMessagesOptions {
  threadId: string | null;
}