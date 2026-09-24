import { useCallback, useEffect, useState } from 'react';
import type { DistriThread, ThreadListParams } from '@distri/core';
import { useDistriNative } from './DistriNativeProvider';

export interface UseThreadsOptions extends ThreadListParams {
  enabled?: boolean;
}

export interface UseThreadsResult {
  threads: DistriThread[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/** The signed-in user's threads, newest first, from `DistriClient.getThreads`. */
export function useThreads({ enabled = true, ...params }: UseThreadsOptions = {}): UseThreadsResult {
  const { client } = useDistriNative();
  const [threads, setThreads] = useState<DistriThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const key = JSON.stringify(params);

  const refresh = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const response = await client.getThreads(JSON.parse(key) as ThreadListParams);
      setThreads([...response.threads].sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load conversations'));
    } finally {
      setLoading(false);
    }
  }, [client, key]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  return { threads, loading, error, refresh };
}
