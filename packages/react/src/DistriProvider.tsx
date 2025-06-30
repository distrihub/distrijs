import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DistriClient, DistriClientConfig } from '@distri/core';

interface DistriContextValue {
  client: DistriClient | null;
  error: Error | null;
}

const DistriContext = createContext<DistriContextValue>({
  client: null,
  error: null
});

interface DistriProviderProps {
  config: DistriClientConfig;
  children: ReactNode;
}

export function DistriProvider({ config, children }: DistriProviderProps) {
  const [client, setClient] = useState<DistriClient | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const newClient = new DistriClient(config);
      setClient(newClient);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize client'));
      setClient(null);
    }

    // Cleanup
    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, [config]);

  const contextValue: DistriContextValue = {
    client,
    error
  };

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
  const { client } = useDistri();
  if (!client) {
    throw new Error('Distri client is not initialized');
  }
  return client;
}