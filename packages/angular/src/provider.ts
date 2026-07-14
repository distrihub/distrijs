import {
  InjectionToken,
  Signal,
  makeEnvironmentProviders,
  signal,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import { DistriClient, DistriClientConfig } from '@distri/core';

/**
 * Angular counterpart of `@distri/react`'s `<DistriProvider config={...}>`.
 *
 * Same config surface (`DistriClientConfig`: baseUrl, accessToken,
 * workspaceId, headers, onTokenRefresh, …) — only the delivery differs:
 * React puts it in a context provider, Angular puts it in DI.
 *
 * Because the access token usually has to be fetched first, the config may be
 * given as an async factory. Until it resolves, `DistriService.client()` is
 * `null` and `isLoading()` is true — the same "auth isn't ready yet" state
 * `DistriProvider` models with its `authReady` flag.
 */
export type DistriConfig = DistriClientConfig;

/**
 * Config sourced from a token endpoint — the common case for a browser app,
 * which must never hold a long-lived API key. Your server (or dev-server
 * middleware) exchanges the key for a short-lived token and returns:
 *
 *   { access_token, refresh_token?, workspace_id?, base_url? }
 *
 * This is the Angular equivalent of what `DistriAuthProvider` does for React:
 * fetch the token, feed it to the client, and re-mint it when it expires.
 */
export interface DistriTokenEndpointConfig extends Omit<DistriClientConfig, 'baseUrl' | 'accessToken'> {
  /** URL that returns the token payload. POSTed to. */
  tokenEndpoint: string;
  /**
   * Where the API lives. Defaults to the endpoint's `base_url`, else
   * same-origin `/v1` (the usual dev-proxy setup).
   */
  baseUrl?: string;
  /** Abort the token request after this many ms. Default 15s. A hung endpoint
   *  must surface as an error, not an infinite "connecting" spinner. */
  timeoutMs?: number;
}

export interface DistriTokenResponse {
  access_token: string;
  refresh_token?: string;
  workspace_id?: string;
  base_url?: string;
}

export type DistriConfigInput =
  | DistriConfig
  | DistriTokenEndpointConfig
  | (() => DistriConfig | Promise<DistriConfig>);

function isTokenEndpointConfig(input: DistriConfigInput): input is DistriTokenEndpointConfig {
  return typeof input === 'object' && input !== null && 'tokenEndpoint' in input;
}

async function fetchToken(endpoint: string, timeoutMs: number): Promise<DistriTokenResponse> {
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ttl: 3600 }),
    signal: AbortSignal.timeout(timeoutMs),
  }).catch((err: unknown) => {
    throw new Error(
      `could not reach the Distri token endpoint (${endpoint}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  });

  if (!resp.ok) {
    throw new Error(`Distri token exchange failed (${resp.status}): ${(await resp.text()).slice(0, 200)}`);
  }

  const body = (await resp.json()) as DistriTokenResponse;
  if (!body?.access_token) throw new Error('Distri token endpoint returned no access_token');
  return body;
}

/** Turn a token-endpoint config into a plain client config (fetching the token). */
async function resolveTokenEndpoint(cfg: DistriTokenEndpointConfig): Promise<DistriConfig> {
  const { tokenEndpoint, baseUrl, timeoutMs = 15_000, ...rest } = cfg;
  const token = await fetchToken(tokenEndpoint, timeoutMs);

  return {
    ...rest,
    baseUrl: baseUrl ?? token.base_url ?? `${window.location.origin}/v1`,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    // Agents/threads/sessions are workspace-scoped, and the short-lived JWT
    // carries no workspace claim — the client must send X-Workspace-Id itself.
    workspaceId: rest.workspaceId ?? token.workspace_id,
    // Re-mint from the same endpoint when the token expires, instead of
    // dying mid-session.
    onTokenRefresh:
      rest.onTokenRefresh ??
      (async () => {
        try {
          return (await fetchToken(tokenEndpoint, timeoutMs)).access_token;
        } catch (err) {
          console.warn('[distri] token refresh failed:', err);
          return null;
        }
      }),
  };
}

/**
 * Injectable handle on the Distri client — the Angular equivalent of React's
 * `useDistri()` / `useWorkspace()`.
 */
export class DistriService {
  private readonly _client = signal<DistriClient | null>(null);
  private readonly _error = signal<Error | null>(null);
  private readonly _workspaceId = signal<string | null>(null);
  private readonly _isLoading = signal(true);

  /** The client, or null while the config/token is still resolving. */
  readonly client: Signal<DistriClient | null> = this._client.asReadonly();
  readonly error: Signal<Error | null> = this._error.asReadonly();
  readonly workspaceId: Signal<string | null> = this._workspaceId.asReadonly();
  /** True until the client is created (or creation failed). */
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();

  constructor(input: DistriConfigInput) {
    void this.init(input);
  }

  private async init(input: DistriConfigInput): Promise<void> {
    try {
      const config = isTokenEndpointConfig(input)
        ? await resolveTokenEndpoint(input)
        : typeof input === 'function'
          ? await input()
          : input;
      this._client.set(new DistriClient(config));
      this._workspaceId.set(config.workspaceId ?? null);
      this._error.set(null);
    } catch (err) {
      console.error('[distri] failed to initialize client:', err);
      this._error.set(err instanceof Error ? err : new Error(String(err)));
    } finally {
      this._isLoading.set(false);
    }
  }

  /** Switch workspace at runtime — mirrors React's `useWorkspace().setWorkspaceId`. */
  setWorkspaceId(workspaceId: string | null): void {
    this._workspaceId.set(workspaceId);
    const client = this._client();
    if (client) client.workspaceId = workspaceId ?? undefined;
  }
}

export const DISTRI_SERVICE = new InjectionToken<DistriService>('DistriService');

/**
 * Register Distri for the app. Put this in `bootstrapApplication`'s providers,
 * then inject `DISTRI_SERVICE` — or just drop in `<distri-chat>`, which picks
 * the client up from DI automatically.
 *
 * Usual case — let a token endpoint supply the credentials, so no API key ever
 * reaches the browser:
 * @example
 * providers: [provideDistri({ tokenEndpoint: '/api/distri/token' })]
 *
 * Or pass a client config directly (static, or an async factory):
 * @example
 * providers: [provideDistri({ baseUrl: '…', accessToken: '…', workspaceId: '…' })]
 */
export function provideDistri(config: DistriConfigInput): EnvironmentProviders {
  const providers: Provider[] = [
    { provide: DISTRI_SERVICE, useFactory: () => new DistriService(config) },
  ];
  return makeEnvironmentProviders(providers);
}
