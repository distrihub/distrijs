import { useState, useEffect, useCallback } from 'react';
import { ProviderModelsStatus } from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseModelsResult {
  providers: ProviderModelsStatus[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch available models grouped by provider with configuration status.
 */
export function useModels(): UseModelsResult {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [providers, setProviders] = useState<ProviderModelsStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchModels = useCallback(async () => {
    if (!client) return;

    try {
      setLoading(true);
      setError(null);
      const result = await client.fetchAvailableModels();
      setProviders(result);
    } catch (err) {
      console.error('[useModels] Failed to fetch models:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch models'));
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
      fetchModels();
    } else {
      setLoading(false);
    }
  }, [clientLoading, clientError, client, fetchModels]);

  return {
    providers,
    loading: loading || clientLoading,
    error: error || clientError,
    refetch: fetchModels,
  };
}
