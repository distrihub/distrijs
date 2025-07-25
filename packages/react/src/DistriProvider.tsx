import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DistriClient, DistriClientConfig } from '@distri/core';
import { ThemeProvider } from './components/ThemeProvider';

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
  defaultTheme?: 'dark' | 'light' | 'system';
}

const debug = (config: DistriClientConfig, ...args: any[]): void => {
  if (config.debug) {
    console.log('[DistriProvider]', ...args);
  }
}


export function DistriProvider({ config, children, defaultTheme = 'dark' }: DistriProviderProps) {
  const [client, setClient] = useState<DistriClient | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let currentClient: DistriClient | null = null;

    try {
      debug(config, '[DistriProvider] Initializing client with config:', config);
      currentClient = new DistriClient(config);
      setClient(currentClient);
      setError(null);
      setIsLoading(false);
      debug(config, '[DistriProvider] Client initialized successfully');
    } catch (err) {
      debug(config, '[DistriProvider] Failed to initialize client:', err);
      const error = err instanceof Error ? err : new Error('Failed to initialize client');
      setError(error);
      setClient(null);
      setIsLoading(false);
    }

  }, [config]); // Depend on the entire config object since we memoize it now

  const contextValue: DistriContextValue = {
    client,
    error,
    isLoading
  };

  if (error) {
    console.error(config, '[DistriProvider] Rendering error state:', error.message);
  }

  if (isLoading) {
    debug(config, '[DistriProvider] Rendering loading state');
  }

  if (client) {
    debug(config, '[DistriProvider] Rendering with client available');
  }

  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      <DistriContext.Provider value={contextValue}>
        {children}
      </DistriContext.Provider>
    </ThemeProvider>
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