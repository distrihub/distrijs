import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { DistriClient, DistriClientConfig } from '@distri/core';
import { ThemeProvider } from './components/ThemeProvider';
import { DistriAuthProvider, useDistriAuth } from './DistriAuthProvider';

interface DistriContextValue {
  client: DistriClient | null;
  error: Error | null;
  isLoading: boolean;
  token?: string | null;
  workspaceId?: string | null;
  setWorkspaceId?: (workspaceId: string | null) => void;
}

export const DistriContext = createContext<DistriContextValue>({
  client: null,
  error: null,
  isLoading: true,
});

interface DistriProviderProps {
  /**
   * Distri client config. Include `authReady: false` while waiting for auth token.
   * When authReady is false, isLoading will be true and hooks will wait.
   * Defaults to true (auth is ready).
   *
   * @example
   * const [token, setToken] = useState<string | null>(null);
   * useEffect(() => { fetchToken().then(setToken); }, []);
   *
   * <DistriProvider config={{
   *   baseUrl: '...',
   *   accessToken: token,
   *   authReady: token !== null
   * }} />
   */
  config: DistriClientConfig & { authReady?: boolean };
  children: ReactNode;
  defaultTheme?: 'dark' | 'light' | 'system';
}

/**
 * Inner component to synchronize client with auth state
 */
function DistriProviderInner({ config, children }: Omit<DistriProviderProps, 'authReady'>) {
  const authReady = config.authReady ?? true;
  const { token, status, error: authError, requestAuth } = useDistriAuth();
  const [client, setClient] = useState<DistriClient | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(config.workspaceId || null);

  // Initialize client only when authReady is true
  useEffect(() => {
    try {
      if (!client && authReady) {
        const currentClient = new DistriClient({
          ...config,
          accessToken: token || config.accessToken,
          workspaceId: workspaceId || config.workspaceId,
          // If clientId is provided, we use the requestAuth logic from our provider
          onTokenRefresh: config.clientId ? requestAuth : config.onTokenRefresh
        });
        setClient(currentClient);
      }
    } catch (err) {
      console.error('[DistriProvider] Failed to initialize client:', err);
      setInitError(err instanceof Error ? err : new Error('Failed to initialize client'));
    }
  }, [config, client, requestAuth, token, authReady, workspaceId]);

  // Sync workspaceId from config when it changes externally
  useEffect(() => {
    const configWorkspaceId = config.workspaceId || null;
    if (configWorkspaceId !== workspaceId) {
      setWorkspaceIdState(configWorkspaceId);
      if (client) {
        client.workspaceId = configWorkspaceId || undefined;
      }
    }
  }, [config.workspaceId, client, workspaceId]);

  // Update client's workspaceId when it changes
  const setWorkspaceId = useCallback((newWorkspaceId: string | null) => {
    setWorkspaceIdState(newWorkspaceId);
    if (client) {
      client.workspaceId = newWorkspaceId || undefined;
    }
  }, [client]);

  // Determine if we're still loading:
  // - Client not created yet
  // - Auth is in progress (status is 'loading')
  // - External authReady flag is false (waiting for backend token)
  const isAuthInProgress = status === 'loading';
  const isLoading = !client || isAuthInProgress || !authReady;

  const contextValue: DistriContextValue = useMemo(() => ({
    client,
    error: initError || (authError ? new Error(authError) : null),
    isLoading,
    token,
    workspaceId,
    setWorkspaceId,
  }), [client, initError, authError, isLoading, token, workspaceId, setWorkspaceId]);

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

export function useWorkspace() {
  const { workspaceId, setWorkspaceId, isLoading } = useDistri();
  return { workspaceId, setWorkspaceId, isLoading };
}
