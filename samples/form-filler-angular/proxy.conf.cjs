/**
 * Angular dev-server proxy — the Angular equivalent of the Vite samples'
 * `distri-token-proxy` plugin.
 *
 * Two rules:
 *   /api/distri/token  -> {DISTRI_BASE_URL}/token, with the long-lived
 *                         DISTRI_API_KEY injected server-side as `x-api-key`.
 *                         Returns a short-lived access token.
 *   /v1/*              -> {DISTRI_BASE_URL}/*, so the app can use a same-origin
 *                         baseUrl (no CORS) and just forward its Bearer token.
 *
 * DISTRI_API_KEY is read from this sample's `.env` in the Node dev-server
 * process. It is never sent to the browser — only the short-lived token is.
 *
 * NOTE: Angular 17+ runs its dev server on Vite, so this uses Vite's proxy
 * options (`rewrite` / `configure`), NOT http-proxy-middleware's
 * (`pathRewrite` / `onProxyReq`) — those are silently ignored here.
 */
const fs = require('node:fs');
const path = require('node:path');

/** Minimal .env reader — avoids adding a dotenv dependency to the sample. */
function loadEnv() {
  const file = path.resolve(__dirname, '.env');
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, '');
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };
const API_KEY = env.DISTRI_API_KEY || '';
const WORKSPACE_ID = env.DISTRI_WORKSPACE_ID || '';
// e.g. https://api-dev.distri.dev/v1 -> origin https://api-dev.distri.dev, prefix /v1
const BASE_URL = (env.DISTRI_BASE_URL || 'https://api.distri.dev/v1').replace(/\/$/, '');
const { origin: TARGET, pathname: BASE_PATH } = new URL(BASE_URL);

if (!API_KEY) {
  console.warn(
    '\n[distri] DISTRI_API_KEY is not set. Copy .env.example to .env and set it, ' +
      'otherwise the token exchange will fail.\n',
  );
}

// Disable HTTP keep-alive/socket pooling. With the default pooled agent, the
// first request to an HTTPS (Cloudflare-fronted) target succeeds and every
// later one hangs forever on a stale pooled socket. `agent: false` makes each
// proxied request open a fresh connection.
const NO_POOL = { agent: false };

module.exports = {
  /**
   * Token exchange. Mirrors the shape a real backend hands the frontend (see
   * zippy-platform's `/distri/token`): the app gets everything it needs to
   * build a DistriClient — token + workspace — and the API key stays here.
   *
   *   -> { access_token, refresh_token, workspace_id }
   *
   * `workspace_id` matters: agents/threads/sessions are workspace-scoped, and
   * the short-lived JWT carries no workspace claim. The SDK must send
   * `X-Workspace-Id` itself (via `workspaceId` in its config) — smuggling the
   * header in from the proxy gets HTTP calls through but still fails inside
   * the agent session with "Workspace context required".
   */
  '/api/distri/token': {
    ...NO_POOL,
    target: TARGET,
    changeOrigin: true,
    secure: true,
    rewrite: () => `${BASE_PATH}/token`,
    selfHandleResponse: true, // we rewrite the JSON body below
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        // API keys authenticate via `x-api-key`, NOT `Authorization: Bearer`
        // (Bearer is reserved for user JWTs) — see cloud handlers/tokens.rs.
        proxyReq.setHeader('x-api-key', API_KEY);
        if (WORKSPACE_ID) proxyReq.setHeader('x-workspace-id', WORKSPACE_ID);
        proxyReq.removeHeader('authorization');
      });

      proxy.on('proxyRes', (proxyRes, req, res) => {
        const chunks = [];
        proxyRes.on('data', (c) => chunks.push(c));
        proxyRes.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          res.statusCode = proxyRes.statusCode ?? 502;
          res.setHeader('content-type', 'application/json');

          if (res.statusCode >= 400) {
            res.end(raw); // pass the upstream error through verbatim
            return;
          }
          try {
            const body = JSON.parse(raw);
            res.end(JSON.stringify({ ...body, workspace_id: WORKSPACE_ID || undefined }));
          } catch {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'token endpoint returned non-JSON', body: raw.slice(0, 200) }));
          }
        });
      });
    },
  },

  // Everything else the SDK calls. Same-origin from the browser's point of
  // view, so no CORS. The client sends its own Bearer token and
  // X-Workspace-Id — nothing is injected here.
  '/v1': {
    ...NO_POOL,
    target: TARGET,
    changeOrigin: true,
    secure: true,
    rewrite: (p) => p.replace(/^\/v1/, BASE_PATH),
  },
};
