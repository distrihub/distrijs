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

export interface UseThreadsOptions {
  enabled?: boolean;
}

export function useThreads(options: UseThreadsOptions = {}): UseThreadsResult {
  const { enabled = true } = options;
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
    // Note: deleteThread is not implemented in DistriClient yet
    // For now, just remove from local state
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
  }, [client]);

  const updateThread = useCallback(async (threadId: string, localId?: string) => {
    if (!client) {
      console.warn('Client not available for thread update');
      return;
    }
    try {
      const updatedThread = await client.getThread(threadId);
      if (updatedThread) {
        setThreads((prev) => {
          // Check if thread already exists
          const exists = prev.some((t) => t.id === threadId);
          if (exists) {
            return prev.map((thread) =>
              thread.id === threadId ? updatedThread : thread
            );
          }
          // If localId is provided, replace the local thread
          if (localId) {
            const localIndex = prev.findIndex((t) => t.id === localId);
            if (localIndex !== -1) {
              const newThreads = [...prev];
              newThreads[localIndex] = updatedThread;
              return newThreads;
            }
          }
          // Otherwise add as new
          return [updatedThread, ...prev];
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

    if (client && enabled) {
      fetchThreads();
    } else {
      setLoading(false);
    }
  }, [clientLoading, clientError, client, fetchThreads, enabled]);

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