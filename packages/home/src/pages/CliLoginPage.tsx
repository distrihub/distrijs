import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Terminal, Check, AlertTriangle } from 'lucide-react';
import { Button, Card } from '@distri/components';
import { useDistriHomeClient } from '../DistriHomeProvider';

type CliLoginState = 'loading' | 'ready' | 'authorizing' | 'success' | 'error';

/**
 * CliLoginPage — device / CLI authorization flow.
 *
 * The CLI starts a local HTTP server on a callback URL, then opens
 * this page in the browser with:
 *
 *   /cli-login?callback=http://127.0.0.1:PORT&state=RANDOM
 *
 * On "Authorize", this page creates an API key via the homeClient and
 * redirects to `callback/callback?api_key=...&state=...` so the CLI
 * can pick up credentials automatically.
 *
 * Cloud variant (ui/src/routes/CliLoginPage.tsx) adds workspace selection
 * and requires the user to be logged in via OTP/OAuth first. The OSS
 * version is simpler: no workspace picker, uses the current session's
 * homeClient directly.
 */
export function CliLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const homeClient = useDistriHomeClient();

  const callbackUrl = searchParams.get('callback');
  const stateParam = searchParams.get('state');

  const [state, setState] = useState<CliLoginState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!callbackUrl || !stateParam) {
      setState('error');
      setError('Missing callback URL or state parameter. Run `distri login` to get a valid link.');
      return;
    }
    setState('ready');
  }, [callbackUrl, stateParam]);

  const handleAuthorize = async () => {
    if (!callbackUrl || !stateParam || !homeClient) return;

    setState('authorizing');
    setError(null);

    try {
      // Create an API key for CLI usage
      const apiKey = await homeClient.createApiKey(
        `CLI Login - ${new Date().toISOString().split('T')[0]}`,
      );

      const key = apiKey.key ?? '';
      const workspaceId = homeClient.distriClient.workspaceId ?? '';

      // Redirect back to the CLI's local HTTP server
      const redirectUrl =
        `${callbackUrl}/callback` +
        `?api_key=${encodeURIComponent(key)}` +
        `&workspace_id=${encodeURIComponent(workspaceId)}` +
        `&state=${encodeURIComponent(stateParam)}`;

      setState('success');
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 800);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    }
  };

  const handleCancel = () => {
    navigate('/agents');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <div className="mb-6 flex items-center justify-center gap-3">
            <Terminal className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-semibold">CLI Login</h1>
          </div>

          {state === 'loading' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          )}

          {state === 'ready' && (
            <div className="space-y-6">
              <p className="text-center text-sm text-muted-foreground">
                Authorize the Distri CLI to access your local server.
              </p>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  This will create an API key that grants CLI access. Keep it secure.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAuthorize} className="flex-1">
                  Authorize CLI
                </Button>
              </div>
            </div>
          )}

          {state === 'authorizing' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Creating API key…</p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Authorized!</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Redirecting back to CLI…
                </p>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Error</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error ?? 'Something went wrong'}
                </p>
              </div>
              <Button onClick={handleCancel} className="w-full">
                Go to Agents
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
