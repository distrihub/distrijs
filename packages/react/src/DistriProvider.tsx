import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { DistriClient, DistriClientConfig } from '@distri/core';
import { ThemeProvider } from './components/ThemeProvider';

interface DistriContextValue {
  client: DistriClient | null;
  error: Error | null;
  isLoading: boolean;
}

export const DistriContext = createContext<DistriContextValue>({
  client: null,
  error: null,
  isLoading: true,
});

interface DistriProviderProps {
  config: DistriClientConfig;
  children: ReactNode;
  defaultTheme?: 'dark' | 'light' | 'system';
}

/**
 * Core provider for Distri SDK. Initializes the DistriClient.
 * 
 * For cloud authentication (embed tokens via Turnstile), wrap your app with
 * DistriCloudAuthProvider inside this provider.
 * 
 * @example
 * ```tsx
 * // Basic usage (self-hosted or API key auth)
 * <DistriProvider config={{ baseUrl }}>
 *   <App />
 * </DistriProvider>
 * 
 * // Cloud usage with embed auth
 * <DistriProvider config={{ baseUrl, clientId }}>
 *   <DistriCloudAuthProvider>
 *     <App />
 *   </DistriCloudAuthProvider>
 * </DistriProvider>
 * ```
 */
export function DistriProvider({ config, children, defaultTheme = 'dark' }: DistriProviderProps) {
  const [client, setClient] = useState<DistriClient | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize client
  useEffect(() => {
    try {
      if (config.debug) {
        console.log('[DistriProvider] Initializing client');
      }
      const currentClient = new DistriClient(config);
      setClient(currentClient);
      setIsLoading(false);
    } catch (err) {
      const initError = err instanceof Error ? err : new Error('Failed to initialize client');
      setError(initError);
      setIsLoading(false);
    }
  }, [config]);

  const contextValue: DistriContextValue = useMemo(() => ({
    client,
    error,
    isLoading,
  }), [client, error, isLoading]);

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
