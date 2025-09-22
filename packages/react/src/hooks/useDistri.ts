import { useEffect, useState, useMemo } from 'react';
import { DistriClient } from '@distri/core';

export interface DistriConfig {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  debug?: boolean;
  headers?: Record<string, string>;
}

export interface UseDistriResult {
  client: DistriClient | null;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Hook to initialize and manage DistriClient
 * Automatically creates a client with default or provided configuration
 */
export function useDistri(config?: DistriConfig): UseDistriResult {
  const [client, setClient] = useState<DistriClient | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create default configuration
  const clientConfig = useMemo(() => ({
    baseUrl: config?.baseUrl || process.env.REACT_APP_DISTRI_BASE_URL || 'http://localhost:8080/api/v1',
    apiVersion: config?.apiVersion || 'v1',
    timeout: config?.timeout || 30000,
    debug: config?.debug ?? (process.env.NODE_ENV === 'development'),
    headers: config?.headers || {},
    ...config
  }), [config]);

  useEffect(() => {
    const initializeClient = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create DistriClient with configuration
        const distriClient = new DistriClient(clientConfig);

        setClient(distriClient);
        console.log('[useDistri] DistriClient initialized successfully:', {
          baseUrl: clientConfig.baseUrl,
          apiVersion: clientConfig.apiVersion,
          debug: clientConfig.debug
        });

      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize DistriClient');
        setError(error);
        console.error('[useDistri] Failed to initialize DistriClient:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeClient();
  }, [clientConfig]);

  return {
    client,
    error,
    isLoading
  };
}