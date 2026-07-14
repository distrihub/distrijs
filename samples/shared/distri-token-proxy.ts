import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Dev-server middleware that exchanges a long-lived `DISTRI_API_KEY` for a
 * short-lived end-user access token via the backend's `POST {baseUrl}/token`.
 *
 * The API key is read from the Vite *server* process env (no `VITE_` prefix),
 * so it is never inlined into the browser bundle. Only the short-lived
 * access token it returns is ever sent to the frontend.
 */
export interface DistriTokenProxyOptions {
  /** Long-lived API key. Server-side only — never expose to the browser. */
  apiKey: string;
  /** Distri backend base URL, e.g. https://api.distri.dev/v1 */
  baseUrl: string;
  workspaceId?: string;
  /** Path the frontend fetches. Default: /api/distri/token */
  endpoint?: string;
}

interface TokenResponse {
  access_token: string;
  base_url: string;
  workspace_id?: string;
}

function send(res: ServerResponse, status: number, body: object): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/**
 * Exchange the long-lived API key for a scoped, short-lived access token via
 * `POST {baseUrl}/token`.
 *
 * Deliberately has NO "just hand the raw key to the browser" fallback: if the
 * exchange fails we surface the error instead, so the API key can never end up
 * in the frontend.
 */
async function exchangeToken(opts: DistriTokenProxyOptions): Promise<TokenResponse> {
  const url = `${opts.baseUrl.replace(/\/$/, '')}/token`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      // API keys authenticate via `x-api-key`, NOT `Authorization: Bearer`
      // (Bearer is reserved for user JWTs) — see cloud handlers/tokens.rs.
      'x-api-key': opts.apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ ttl: 3600 }),
  });

  if (!resp.ok) {
    throw new Error(`token exchange failed: ${url} returned ${resp.status} ${resp.statusText}`);
  }

  const data = (await resp.json()) as { access_token?: string };
  if (!data?.access_token) {
    throw new Error(`token exchange failed: ${url} returned no access_token`);
  }

  return { access_token: data.access_token, base_url: opts.baseUrl, workspace_id: opts.workspaceId };
}

export function distriTokenProxy(opts: DistriTokenProxyOptions): Plugin {
  const endpoint = opts.endpoint ?? '/api/distri/token';

  return {
    name: 'distri-token-proxy',
    enforce: 'pre',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(endpoint, async (req, res) => {
        if (req.method !== 'GET' && req.method !== 'POST') {
          send(res, 405, { error: 'method-not-allowed' });
          return;
        }
        if (!opts.apiKey) {
          send(res, 500, {
            error:
              'DISTRI_API_KEY is not set on the dev server. Add it to the sample\'s .env (no VITE_ prefix, so it stays server-side).',
          });
          return;
        }
        if (req.method === 'POST') await readBody(req).catch(() => '');

        try {
          send(res, 200, await exchangeToken(opts));
        } catch (err) {
          // Never fall back to shipping the API key itself to the browser.
          send(res, 502, { error: err instanceof Error ? err.message : String(err) });
        }
      });
    },
  };
}
