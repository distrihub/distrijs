# A2A Client Migration — Option B

Adopt upstream `@a2a-js/sdk@^0.3.x` idiomatically by switching `DistriClient` from the
deprecated `A2AClient` to `ClientFactory` + `AuthenticationHandler`, and delete the
bespoke auth/retry plumbing currently sitting in `fetchAbsolute`.

This spec assumes Option A (drop the v3g42 fork, keep the legacy `A2AClient` class,
patch the constructor) is already merged. It's a clean follow-up, not a rewrite.

## Why

`packages/core/src/distri-client.ts` re-implements four things the SDK now handles
natively:

| Concern | Current location | Upstream replacement |
|---|---|---|
| Auth header injection (`Authorization`, `x-workspace-id`) | `applyAuthHeader`, `buildAuthHeaders`, header-merge in `fetchAbsolute` | `AuthenticationHandler.headers()` |
| 401 → refresh token → retry | `fetchAbsolute` retry-on-401 branch (`distri-client.ts:1505`) | `AuthenticationHandler.shouldRetryWithHeaders()` + `onSuccessfulRetry()` |
| `'error' in response` / `'result' in response` envelope unwrap | every `sendMessage` / `getTask` / `cancelTask` callsite | `Client.sendMessage()` etc. throw on error and return the unwrapped result |
| AbortController + timeout for A2A calls | `fetchAbsolute` | `RequestOptions.signal` |

Doing this means: less code in distri-client, the auth logic lives where everyone
who reads SDK code expects to find it, and we're aligned with the multi-transport
direction (REST / gRPC become free).

What stays in `fetchAbsolute`: it still fronts the *non-A2A* endpoints
(`/agents`, `/threads`, `/secrets/resolve`, `/tools/call`, `/configuration`,
`/llm/execute`, `/audio/*`, etc.). Those don't go through the A2A client and need
their own retry-on-401 path. Don't try to unify them.

## Scope

In-scope (single PR):
- `packages/core/src/distri-client.ts`
- `packages/core/src/__tests__/distri-client-overrides.test.ts` (and any other
  A2A-touching tests)
- `packages/core/package.json` — pin `@a2a-js/sdk` to a stable `^0.3.x` if not
  already pinned by Option A.

Out-of-scope:
- Server-side A2A routes (no protocol changes).
- Replacing `fetchAbsolute` for non-A2A REST calls.
- Adopting the REST or gRPC transports — defer.

## Design

### 1. New `DistriAuthenticationHandler`

A class living next to `distri-client.ts`. Owns the bearer token and refresh
state currently tracked on `DistriClient`. Implements upstream's
`AuthenticationHandler` interface from `@a2a-js/sdk/client`:

```ts
class DistriAuthenticationHandler implements AuthenticationHandler {
  constructor(private readonly client: DistriClient) {}

  async headers(): Promise<HttpHeaders> {
    await this.client.ensureAccessToken();   // existing private method, expose to package
    const headers: HttpHeaders = {};
    const token = this.client.accessToken;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (this.client.workspaceId) headers['x-workspace-id'] = this.client.workspaceId;
    return headers;
  }

  async shouldRetryWithHeaders(_req: RequestInit, res: Response) {
    if (res.status !== 401) return undefined;
    const refreshed = await this.client.refreshTokens().then(() => true).catch(() => false);
    if (!refreshed) return undefined;
    return this.headers();   // reuse, includes the refreshed bearer
  }
}
```

`ensureAccessToken`, `refreshTokens`, `accessToken`, `workspaceId` are already
private on `DistriClient` — promote `accessToken` and `workspaceId` to package
visibility (or pass an opaque accessor) and keep refresh logic where it is.

### 2. Replace `A2AClient` with `Client` from `ClientFactory`

```ts
import {
  ClientFactory,
  ClientFactoryOptions,
  JsonRpcTransportFactory,
  DefaultAgentCardResolver,
  createAuthenticatingFetchWithRetry,
  type Client,
} from '@a2a-js/sdk/client';

private clientFactory: ClientFactory;

private buildClientFactory(): ClientFactory {
  const authHandler = new DistriAuthenticationHandler(this);
  const fetchImpl = createAuthenticatingFetchWithRetry(globalThis.fetch, authHandler);

  return new ClientFactory(ClientFactoryOptions.createFrom(ClientFactoryOptions.default, {
    transports: [new JsonRpcTransportFactory({ fetchImpl })],
    cardResolver: new DefaultAgentCardResolver({
      path: '/.well-known/agent.json',   // distri server still serves the legacy path
      fetchImpl,
    }),
  }));
}

private agentClients = new Map<string, { url: string; client: Promise<Client> }>();

private getA2AClient(agentId: string): Promise<Client> {
  const agentUrl = `${this.config.baseUrl}/agents/${agentId}`;
  const existing = this.agentClients.get(agentId);
  if (existing && existing.url === agentUrl) return existing.client;
  const client = this.clientFactory.createFromUrl(agentUrl);
  this.agentClients.set(agentId, { url: agentUrl, client });
  return client;
}
```

Two callsite consequences:

- `getA2AClient` becomes async (the factory fetches the agent card during
  `createFromUrl`). Every caller (`sendMessage`, `sendMessageStream`, `getTask`,
  `cancelTask`, anything else hitting `getA2AClient`) needs `await`.
- The cache stores the `Promise<Client>`, not the resolved `Client`. Concurrent
  `sendMessage` calls in flight while the card is still loading should share
  the same in-flight promise. Don't cache only the resolved value — that
  re-enters the constructor while the first card fetch is pending and creates a
  request herd.

### 3. Unwrap envelope-handling at the callsites

`Client.sendMessage(params)` returns `Promise<Message | Task>` directly and
throws on error. The current code:

```ts
const response: SendMessageResponse = await client.sendMessage(params);
if ('error' in response && response.error) throw new A2AProtocolError(...);
if ('result' in response) return response.result;
```

becomes:

```ts
return await client.sendMessage(params);
```

Wrap in try/catch and translate SDK errors (`TaskNotFoundError`,
`PushNotificationNotSupportedError`, etc., all exported from
`@a2a-js/sdk/client`) into the existing `A2AProtocolError`/`DistriError` shapes
so callers don't see new error types. Same treatment for `getTask`, `cancelTask`.

### 4. Streaming + AbortSignal

`sendMessageStream` already yields the same union (`A2AStreamEventData`).
Passing an `AbortSignal` is now first-class:

```ts
async *sendMessageStream(agentId, params, opts?: { signal?: AbortSignal }) {
  const client = await this.getA2AClient(agentId);
  yield* client.sendMessageStream(params, { signal: opts?.signal });
}
```

Add the `signal` option to `Agent.invokeStream` so React callers can cancel a
stream when the component unmounts.

### 5. Remove dead code

After the swap, delete from `fetchAbsolute`:

- the 401/refresh branch (`distri-client.ts:1505-1510`)
- `applyAuthHeader` (`distri-client.ts:1440`)

Keep `buildAuthHeaders` — it's still used by `registerHttpTool('distri_request', ...)`.

## Risks and verification

- **Agent-card path mismatch.** Upstream defaults to `/.well-known/agent-card.json`;
  we serve `/.well-known/agent.json` (`distri/server/distri-server/src/routes.rs:55`).
  The `DefaultAgentCardResolver({ path: ... })` override above handles it.
  Verify with `distri-client-overrides.test.ts:19-23`.

- **Async `getA2AClient` leaks into the agent layer.** `Agent.invoke` and
  friends already return promises; the only meaningful change is one extra
  `await` per call. Concurrent first-time calls per agent ID need to share the
  in-flight card-fetch (see §2).

- **Error message regex.** `extractErrorMessage` (`distri-client.ts:914-919`)
  greps `"SSE event contained an error: ..."` and `"RPC Error: ..."`. Upstream
  `JsonRpcTransport._processSseEventData` still emits those exact prefixes —
  keep the regexes, but add a unit test that pins on the exact upstream message
  to catch regressions on future SDK bumps.

- **JSON-RPC vs typed errors.** Upstream throws typed errors for known JSON-RPC
  codes (`TaskNotFoundError`, `TaskNotCancelableError`, ...). Decide once, in
  one helper, whether to (a) re-wrap them in `A2AProtocolError` to preserve the
  current public API, or (b) re-export them from `@distri/core` and let
  consumers branch on `instanceof`. (a) is the safer first step.

- **No more retry on transient network errors for A2A calls.**
  `fetchAbsolute` currently retries up to `config.retryAttempts` on any caught
  error. The `createAuthenticatingFetchWithRetry` wrapper does *not* do this —
  it only retries on auth signals. If we want the network-retry behavior, wrap
  again: `withNetworkRetry(createAuthenticatingFetchWithRetry(fetch, auth))`.
  Most callers don't depend on this for A2A — confirm by grepping the codebase
  for assumptions about retry counts before deleting.

- **Timeout.** The current per-request timeout (`config.timeout`, default 30s)
  is enforced via `AbortController` in `fetchAbsolute`. For A2A calls it
  becomes the caller's responsibility via `RequestOptions.signal`. Add a
  default-timeout helper on `DistriClient` that produces a timed-out
  `AbortSignal` for callers who don't pass one.

## Test plan

- `pnpm --filter @distri/core type-check`
- `pnpm --filter @distri/core test` — covers `distri-client-overrides.test.ts`
  and `encoder-file-part.test.ts`. Add:
  - a unit test stubbing `globalThis.fetch` that asserts the auth handler
    injects `Authorization` + `x-workspace-id` on the agent-card fetch and on
    the `message/send` POST.
  - a unit test that returns 401 on the first POST, asserts `refreshTokens`
    was called once, and verifies the second POST carries the new bearer.
- `pnpm --filter @distri/react test` — sanity check that `useChat` /
  `useAgent` still work.
- Manual smoke against `./bin/server`: send a message, cancel a task, resubscribe.

## Rollout

1. Land this PR behind no flag — it's a pure-refactor-of-internals change with
   no public API surface delta in `@distri/core`.
2. Watch `distri-server.log` for any `Failed to fetch Agent Card` errors after
   deploy — that's the canary for the agent-card-path override misfiring.
3. Once stable for a week, delete `applyAuthHeader` + the 401-branch in
   `fetchAbsolute` (kept around in step 1 for easy rollback).
