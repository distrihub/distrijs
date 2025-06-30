import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DistriClient, DistriClientConfig, ConnectionStatus } from '@distri/core';

interface DistriContextValue {
  client: DistriClient | null;
  connectionStatus: ConnectionStatus;
  error: Error | null;
}

const DistriContext = createContext<DistriContextValue>({
  client: null,
  connectionStatus: 'disconnected',
  error: null
});

interface DistriProviderProps {
  config: DistriClientConfig;
  children: ReactNode;
}

export function DistriProvider({ config, children }: DistriProviderProps) {
  const [client, setClient] = useState<DistriClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const newClient = new DistriClient(config);
    setClient(newClient);

    // Set up event listeners
    const handleConnectionStatusChange = (status: ConnectionStatus) => {
      setConnectionStatus(status);
    };

    const handleError = (err: Error) => {
      setError(err);
    };

    newClient.on('connection_status_changed', handleConnectionStatusChange);
    newClient.on('error', handleError);

    // Initialize connection status
    setConnectionStatus(newClient.getConnectionStatus());

    // Cleanup
    return () => {
      newClient.off('connection_status_changed', handleConnectionStatusChange);
      newClient.off('error', handleError);
      newClient.disconnect();
    };
  }, [config]);

  const contextValue: DistriContextValue = {
    client,
    connectionStatus,
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