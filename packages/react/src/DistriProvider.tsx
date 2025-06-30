import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DistriClient, DistriClientConfig } from '@distri/core';

interface DistriContextValue {
  client: DistriClient | null;
  error: Error | null;
  isLoading: boolean;
}

const DistriContext = createContext<DistriContextValue>({
  client: null,
  error: null,
  isLoading: true
});

interface DistriProviderProps {
  config: DistriClientConfig;
  children: ReactNode;
}

export function DistriProvider({ config, children }: DistriProviderProps) {
  const [client, setClient] = useState<DistriClient | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let currentClient: DistriClient | null = null;

    try {
      console.log('[DistriProvider] Initializing client with config:', config);
      currentClient = new DistriClient(config);
      setClient(currentClient);
      setError(null);
      setIsLoading(false);
      console.log('[DistriProvider] Client initialized successfully');
    } catch (err) {
      console.error('[DistriProvider] Failed to initialize client:', err);
      const error = err instanceof Error ? err : new Error('Failed to initialize client');
      setError(error);
      setClient(null);
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      console.log('[DistriProvider] Cleaning up client');
      if (currentClient) {
        currentClient.disconnect();
      }
    };
  }, [config.baseUrl, config.apiVersion, config.debug]); // Only depend on key config values

  const contextValue: DistriContextValue = {
    client,
    error,
    isLoading
  };

  if (error) {
    console.error('[DistriProvider] Rendering error state:', error.message);
  }

  if (isLoading) {
    console.log('[DistriProvider] Rendering loading state');
  }

  if (client) {
    console.log('[DistriProvider] Rendering with client available');
  }

  return (
    <DistriContext.Provider value={contextValue}>
      {children}
    </DistriContext.Provider>
  );
}

export function useDistri(): DistriContextValue {
  const context = useContext(DistriContext);
  if (!context) {
    throw new Error('useDistri must be used within a DistriProvider');
  }
  return context;
}

export function useDistriClient(): DistriClient {
  const { client, error, isLoading } = useDistri();
  
  if (isLoading) {
    throw new Error('Distri client is still loading');
  }
  
  if (error) {
    throw new Error(`Distri client initialization failed: ${error.message}`);
  }
  
  if (!client) {
    throw new Error('Distri client is not initialized');
  }
  
  return client;
}