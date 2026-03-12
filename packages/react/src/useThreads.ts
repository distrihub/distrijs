import { useState, useEffect, useCallback } from 'react';
import { DistriThread, ThreadListParams, AgentUsageInfo } from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseThreadsResult {
  threads: DistriThread[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: Error | null;
  params: ThreadListParams;
  setParams: (params: ThreadListParams) => void;
  refetch: () => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  fetchThread: (threadId: string) => Promise<DistriThread>;
  updateThread: (threadId: string, localId?: string) => Promise<void>;
  // Pagination helpers
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export interface UseThreadsOptions {
  enabled?: boolean;
  initialParams?: ThreadListParams;
}

export function useThreads(options: UseThreadsOptions = {}): UseThreadsResult {
  const { enabled = true, initialParams = {} } = options;
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = useState<DistriThread[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialParams.limit || 30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<ThreadListParams>({
    limit: 30,
    offset: 0,
    ...initialParams,
  });

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
      const response = await client.getThreads(params);
      setThreads(response.threads);
      setTotal(response.total);
      setPage(response.page);
      setPageSizeState(response.page_size);
    } catch (err) {
      console.error('[useThreads] Failed to fetch threads:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch threads'));
    } finally {
      setLoading(false);
    }
  }, [client, params]);

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

  // Pagination helpers
  const nextPage = useCallback(() => {
    const currentOffset = params.offset || 0;
    const currentLimit = params.limit || 30;
    const newOffset = currentOffset + currentLimit;
    if (newOffset < total) {
      setParams(p => ({ ...p, offset: newOffset }));
    }
  }, [params, total]);

  const prevPage = useCallback(() => {
    const currentOffset = params.offset || 0;
    const currentLimit = params.limit || 30;
    const newOffset = Math.max(0, currentOffset - currentLimit);
    setParams(p => ({ ...p, offset: newOffset }));
  }, [params]);

  const goToPage = useCallback((pageNum: number) => {
    const currentLimit = params.limit || 30;
    setParams(p => ({ ...p, offset: (pageNum - 1) * currentLimit }));
  }, [params.limit]);

  const setPageSize = useCallback((size: number) => {
    setParams(p => ({ ...p, limit: size, offset: 0 }));
  }, []);

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
    total,
    page,
    pageSize,
    loading: loading || clientLoading,
    error: error || clientError,
    params,
    setParams,
    refetch: fetchThreads,
    deleteThread,
    fetchThread,
    updateThread,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
  };
}

/**
 * Hook to get agents sorted by usage (thread count).
 * Includes all registered agents, even those with 0 threads.
 */
export interface UseAgentsByUsageResult {
  agents: AgentUsageInfo[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  search: string;
  setSearch: (search: string) => void;
}

export interface UseAgentsByUsageOptions {
  /** Initial search query */
  search?: string;
}

export function useAgentsByUsage(options?: UseAgentsByUsageOptions): UseAgentsByUsageResult {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = useState<AgentUsageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState(options?.search || '');

  // Fetch all agents initially (no search filter).
  // Components handle local filtering for immediate UX.
  // The search API param is available via refetch for server-side filtering.
  const fetchAgents = useCallback(async () => {
    if (!client) {
      setError(new Error('Client not available'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await client.getAgentsByUsage();
      setAgents(result);
    } catch (err) {
      console.error('[useAgentsByUsage] Failed to fetch agents:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch agents'));
    } finally {
      setLoading(false);
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
      fetchAgents();
    } else {
      setLoading(false);
    }
  }, [clientLoading, clientError, client, fetchAgents]);

  return {
    agents,
    loading: loading || clientLoading,
    error: error || clientError,
    refetch: fetchAgents,
    search,
    setSearch,
  };
}

export interface UseThreadMessagesOptions {
  threadId: string | null;
}