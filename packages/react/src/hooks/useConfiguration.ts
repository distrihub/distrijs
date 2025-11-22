import { useCallback, useEffect, useState } from 'react';
import { ConfigurationMeta, ConfigurationResponse, DistriConfiguration } from '@distri/core';
import { useDistriClient } from '../DistriProvider';

export type UseConfigurationResult = {
  configuration: DistriConfiguration | null;
  meta: ConfigurationMeta | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveConfiguration: (config: DistriConfiguration) => Promise<ConfigurationResponse>;
  setConfiguration: (config: DistriConfiguration | null) => void;
};

export function useConfiguration(): UseConfigurationResult {
  const client = useDistriClient();
  const [configuration, setConfiguration] = useState<DistriConfiguration | null>(null);
  const [meta, setMeta] = useState<ConfigurationMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await client.getConfiguration();
      setConfiguration(response.configuration);
      setMeta(response.meta);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const saveConfiguration = useCallback(
    async (config: DistriConfiguration) => {
      setLoading(true);
      try {
        const response = await client.updateConfiguration(config);
        setConfiguration(response.configuration);
        setMeta(response.meta);
        setError(null);
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update configuration';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    configuration,
    meta,
    loading,
    error,
    refresh,
    saveConfiguration,
    setConfiguration,
  };
}
