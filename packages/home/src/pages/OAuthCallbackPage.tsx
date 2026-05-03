import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDistriHome } from '../provider/context';
import { useDistriHomeClient } from '../provider/context';

/**
 * OAuthCallbackPage — handles OAuth provider redirects.
 *
 * Behaviour mirrors cloud OAuthCallbackPage:
 * 1. If opened in a popup (window.opener exists), post the code+state
 *    to the parent window and close — the ConnectionsPage listener
 *    handles the exchange.
 * 2. Otherwise, exchange code+state directly via
 *    POST /connections/oauth/callback, then redirect to /connections.
 *
 * The GoogleCallbackPage in cloud is a separate flow (auth login via
 * Google, not a connection OAuth flow) and is not ported here — the
 * OSS server uses token-based auth only.
 */
export function OAuthCallbackPage() {
  const [search] = useSearchParams();
  const nav = useNavigate();
  const home = useDistriHome();
  const homeClient = useDistriHomeClient();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = search.get('code');
    const state = search.get('state');
    const errorParam = search.get('error');

    if (errorParam) {
      setStatus('error');
      setError(search.get('error_description') || errorParam);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setError('Missing code or state parameter');
      return;
    }

    // Popup path — parent window (ConnectionsPage) has the message listener
    if (window.opener) {
      window.opener.postMessage({ type: 'oauth-callback', code, state }, '*');
      window.close();
      return;
    }

    // Main-window path — exchange directly
    if (!homeClient) {
      setStatus('error');
      setError('No API client available');
      return;
    }

    (homeClient as any).client
      ?.fetch('/connections/oauth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state }),
      })
      .then((r: Response) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(() => {
        setStatus('success');
        const prefix = home.routes?.prefix ?? '';
        setTimeout(() => nav(`${prefix}/connections`), 1200);
      })
      .catch((err: unknown) => {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'OAuth callback failed');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prefix = home.routes?.prefix ?? '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        {status === 'processing' && (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Completing connection…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <svg
                className="h-6 w-6 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">Connected!</p>
            <p className="mt-1 text-xs text-muted-foreground">Redirecting to connections…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <svg
                className="h-6 w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">Connection failed</p>
            <p className="mt-1 text-xs text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => nav(`${prefix}/connections`)}
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Back to connections
            </button>
          </>
        )}
      </div>
    </div>
  );
}
