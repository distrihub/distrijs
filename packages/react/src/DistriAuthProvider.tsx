import { createContext, useContext, useState, ReactNode, useMemo, useCallback, useRef } from 'react';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

interface DistriAuthContextValue {
  token: string | null;
  status: AuthStatus;
  error: string | null;
  requestAuth: () => Promise<string | null>;
  // Setters for AuthWorker (AuthLoading)
  setToken: (token: string | null) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  resolveAuth: (token: string | null) => void; // New explicit resolver
  // Config for AuthWorker
  config: {
    clientId: string;
    theme: 'dark' | 'light';
    baseUrl: string;
    debug: boolean;
  };
}

const DistriAuthContext = createContext<DistriAuthContextValue | undefined>(undefined);

interface DistriAuthProviderProps {
  clientId: string;
  theme?: 'dark' | 'light';
  children: ReactNode;
  debug?: boolean;
  baseUrl?: string;
}

export function DistriAuthProvider({
  clientId,
  theme = 'dark',
  children,
  debug = false,
  baseUrl = 'https://api.distri.dev/v1'
}: DistriAuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('idle');

  // Multi-resolver support to handle concurrent requests
  const resolversRef = useRef<((token: string | null) => void)[]>([]);

  const resolveAuth = useCallback((t: string | null) => {
    if (debug) console.log(`[DistriAuth] Resolving ${resolversRef.current.length} pending auth requests`);
    resolversRef.current.forEach(resolve => resolve(t));
    resolversRef.current = [];
  }, [debug]);

  const requestAuth = useCallback(() => {
    if (debug) console.log('[DistriAuth] requestAuth triggered, current status:', status);

    // If we are already authenticated, return immediate promise
    if (status === 'authenticated' && token) {
      return Promise.resolve(token);
    }

    // Set loading state if we are idle or previously errored
    if (status !== 'loading') {
      setStatus('loading');
    }
    setError(null);

    return new Promise<string | null>((resolve) => {
      resolversRef.current.push(resolve);
    });
  }, [debug, status, token]);

  const config = useMemo(() => ({
    clientId,
    theme,
    baseUrl,
    debug
  }), [clientId, theme, baseUrl, debug]);

  const contextValue = useMemo(() => ({
    token,
    status,
    error,
    requestAuth,
    setToken,
    setStatus,
    setError,
    resolveAuth,
    config
  }), [token, status, error, requestAuth, resolveAuth, config]);

  return (
    <DistriAuthContext.Provider value={contextValue}>
      {children}
    </DistriAuthContext.Provider>
  );
}

export function useDistriAuth() {
  const context = useContext(DistriAuthContext);
  if (!context) {
    return {
      token: null,
      status: 'idle' as AuthStatus,
      error: null,
      requestAuth: async () => null,
      setToken: () => { },
      setStatus: () => { },
      setError: () => { },
      resolveAuth: () => { },
      config: { clientId: '', theme: 'dark' as const, baseUrl: '', debug: false }
    };
  }
  return context;
}
