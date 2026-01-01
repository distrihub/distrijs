import React, { useEffect, useRef, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useDistriAuth } from '../DistriAuthProvider';

interface AuthLoadingProps {
  children?: React.ReactNode;
  className?: string;
}

export const AuthLoading: React.FC<AuthLoadingProps> = ({
  children,
  className = ""
}) => {
  const {
    status,
    error,
    requestAuth,
    setToken,
    setStatus,
    setError,
    resolveAuth, // Use explicit resolver
    config
  } = useDistriAuth();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status !== 'loading') return;

    if (config.debug) console.log('[AuthWorker] Starting authentication phase');

    // Send the refresh message to the iframe
    iframeRef.current?.contentWindow?.postMessage({ type: 'distri:refresh_token' }, '*');

    // 10-second timeout for the entire process
    timeoutRef.current = setTimeout(() => {
      if (status === 'loading') {
        if (config.debug) console.warn('[AuthWorker] Authentication timed out');
        setStatus('error');
        setError('Authentication timed out');
        resolveAuth(null); // Resolve with null on timeout
      }
    }, 10000);

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'distri:token') {
        if (config.debug) console.log('[AuthWorker] Received token from provisioner');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setToken(data.token);
        setStatus('authenticated');
        resolveAuth(data.token); // Explicitly resolve the pending promises
      } else if (data.type === 'distri:error') {
        if (config.debug) console.error('[AuthWorker] Error from provisioner:', data.error);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setError(data.error);
        setStatus('error');
        resolveAuth(null); // Resolve with null on error
      } else if (data.type === 'distri:ready') {
        if (config.debug) console.log('[AuthWorker] Provisioner ready, triggering refresh');
        iframeRef.current?.contentWindow?.postMessage({ type: 'distri:refresh_token' }, '*');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [status, config, setStatus, setToken, setError, resolveAuth]);

  const provisionerUrl = useMemo(() => {
    const embedBase = 'https://embed.distri.dev';
    const params = new URLSearchParams({
      clientId: config.clientId,
      mode: 'token',
      theme: config.theme,
      baseUrl: config.baseUrl,
    });
    return `${embedBase}?${params.toString()}`;
  }, [config]);

  // Container style that fills the parent but stays within it
  const containerClass = `relative flex flex-col items-center justify-center p-8 text-center min-h-[400px] w-full bg-background animate-in fade-in duration-300 ${className}`;

  if (status === 'loading') {
    return (
      <div className={containerClass}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-sans text-sm animate-pulse font-medium">Initializing Security…</p>

        {/* Headless worker iframe */}
        <iframe
          ref={iframeRef}
          src={provisionerUrl}
          style={{
            display: 'none',
            width: 0,
            height: 0,
            border: 'none',
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: -1
          }}
          title="distri-auth-provisioner"
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={containerClass}>
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Authentication Failed</h2>
        <p className="text-muted-foreground font-sans text-sm mb-6 max-w-xs">{error || 'Could not establish a secure connection.'}</p>
        <button
          onClick={() => requestAuth()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // If status is idle or authenticated, we reveal the children
  return <>{children}</>;
};
