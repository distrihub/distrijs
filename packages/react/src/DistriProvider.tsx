import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { DistriClient, DistriClientConfig } from '@distri/core';
import { ThemeProvider } from './components/ThemeProvider';
import { DistriAuthProvider, useDistriAuth } from './DistriAuthProvider';

interface DistriContextValue {
  client: DistriClient | null;
  error: Error | null;
  isLoading: boolean;
  token?: string | null;
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
 * Inner component to synchronize client with auth state
 */
function DistriProviderInner({ config, children }: DistriProviderProps) {
  const { token, status, error: authError, requestAuth } = useDistriAuth();
  const [client, setClient] = useState<DistriClient | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);

  // Initialize client once
  useEffect(() => {
    try {
      if (!client) {
        if (config.debug) console.log('[DistriProvider] Initializing client');

        const currentClient = new DistriClient({
          ...config,
          accessToken: token || config.accessToken,
          // If clientId is provided, we use the requestAuth logic from our provider
          onTokenRefresh: config.clientId ? requestAuth : config.onTokenRefresh
        });
        setClient(currentClient);
      }
    } catch (err) {
      console.error('[DistriProvider] Failed to initialize client:', err);
      setInitError(err instanceof Error ? err : new Error('Failed to initialize client'));
    }
  }, [config, client, requestAuth, token]);

  const contextValue: DistriContextValue = useMemo(() => ({
    client,
    error: initError || (authError ? new Error(authError) : null),
    // We are loading only if the client isn't ready. 
    // Auth status is handled by AuthLoading guardian in UI.
    isLoading: !client,
    token,
  }), [client, initError, authError, status, token]);

  return (
    <DistriContext.Provider value={contextValue}>
      {children}
    </DistriContext.Provider>
  );
}

/**
 * Core provider for Distri SDK. Initializes the DistriClient and handles authentication.
 * 
 * If `config.clientId` is provided, it will automatically handle cloud authentication
 * using a dedicated headless provisioner.
 */
export function DistriProvider(props: DistriProviderProps) {
  const { config, defaultTheme = 'dark' } = props;

  const content = (
    <ThemeProvider defaultTheme={defaultTheme}>
      <DistriProviderInner {...props} />
    </ThemeProvider>
  );

  // Wrap with AuthProvider if clientId is present to handle automatic token provisioning
  if (config.clientId) {
    return (
      <DistriAuthProvider
        clientId={config.clientId}
        theme={defaultTheme === 'system' ? 'dark' : defaultTheme}
        debug={config.debug}
        baseUrl={config.baseUrl}
      >
        {content}
      </DistriAuthProvider>
    );
  }

  return content;
}

export function useDistri(): DistriContextValue {
  const context = useContext(DistriContext);
  if (!context) {
    throw new Error('useDistri must be used within a DistriProvider');
  }
  return context;
}

export function useDistriToken() {
  const { token, isLoading } = useDistri();
  return { token, isLoading };
}
