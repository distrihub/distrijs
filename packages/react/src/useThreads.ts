import { useState, useEffect, useCallback } from 'react';
import { Thread } from '@distri/core';
import { useDistriClient } from './DistriProvider';

export interface UseThreadsResult {
  threads: Thread[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createThread: (data: {
    title: string;
    description?: string;
    participants?: string[];
    tags?: string[];
    metadata?: Record<string, any>;
  }) => Promise<Thread>;
  updateThread: (threadId: string, updates: Partial<Thread>) => Promise<Thread>;
  deleteThread: (threadId: string) => Promise<void>;
  joinThread: (threadId: string) => Promise<void>;
  leaveThread: (threadId: string) => Promise<void>;
}

export function useThreads(): UseThreadsResult {
  const client = useDistriClient();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedThreads = await client.getThreads();
      setThreads(fetchedThreads);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch threads'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createThread = useCallback(async (data: {
    title: string;
    description?: string;
    participants?: string[];
    tags?: string[];
    metadata?: Record<string, any>;
  }) => {
    try {
      const newThread = await client.createThread(data);
      setThreads(prev => [...prev, newThread]);
      return newThread;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create thread');
      setError(error);
      throw error;
    }
  }, [client]);

  const updateThread = useCallback(async (threadId: string, updates: Partial<Thread>) => {
    try {
      const updatedThread = await client.updateThread(threadId, updates);
      setThreads(prev => prev.map(thread => 
        thread.id === threadId ? updatedThread : thread
      ));
      return updatedThread;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update thread');
      setError(error);
      throw error;
    }
  }, [client]);

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      await client.deleteThread(threadId);
      setThreads(prev => prev.filter(thread => thread.id !== threadId));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete thread');
      setError(error);
      throw error;
    }
  }, [client]);

  const joinThread = useCallback(async (threadId: string) => {
    try {
      await client.joinThread(threadId);
      // Refetch threads to get updated participant list
      await fetchThreads();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to join thread');
      setError(error);
      throw error;
    }
  }, [client, fetchThreads]);

  const leaveThread = useCallback(async (threadId: string) => {
    try {
      await client.leaveThread(threadId);
      // Refetch threads to get updated participant list
      await fetchThreads();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to leave thread');
      setError(error);
      throw error;
    }
  }, [client, fetchThreads]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    const handleThreadCreated = (thread: Thread) => {
      setThreads(prev => {
        // Check if thread already exists to avoid duplicates
        if (prev.some(t => t.id === thread.id)) {
          return prev;
        }
        return [...prev, thread];
      });
    };

    const handleThreadUpdated = (thread: Thread) => {
      setThreads(prev => prev.map(t => t.id === thread.id ? thread : t));
    };

    client.on('thread_created', handleThreadCreated);
    client.on('thread_updated', handleThreadUpdated);

    return () => {
      client.off('thread_created', handleThreadCreated);
      client.off('thread_updated', handleThreadUpdated);
    };
  }, [client]);

  return {
    threads,
    loading,
    error,
    refetch: fetchThreads,
    createThread,
    updateThread,
    deleteThread,
    joinThread,
    leaveThread
  };
}