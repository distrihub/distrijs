# DistriJS Integration Tests

End-to-end tests that exercise `@distri/core` and `@distri/react`
against a **running** distri-server. For pure unit tests with no
server, see `packages/*/src/__tests__/`.

## Layout

```
integration/
├── client/           # @distri/core tests, mock-fetch SSE → real DistriClient
├── react/            # React component + hook tests with simulated streams
├── e2e/              # Real-server tests (point at localhost distri-server)
├── fixtures/         # Canned SSE streams + agent definitions reused across tests
├── scripts/          # start-server.sh, stop-server.sh, login helpers
├── .env.example      # Copy to .env locally — only needed for e2e/
├── vitest.config.ts  # Shared config; jsdom for react/, node for client/
└── package.json      # Workspace package, depends on @distri/core, @distri/react
```

## Three layers, three speeds

| Layer        | What                                          | Time | Needs server | Needs LLM |
|--------------|-----------------------------------------------|------|--------------|-----------|
| `client/`    | DistriClient request/response, SSE parsing    | <1s  | no           | no        |
| `react/`     | Hooks + components against simulated streams  | <2s  | no           | no        |
| `e2e/`       | Real flow: send → receive events → render     | 5–60s| yes          | optional  |

The first two never spend money. They use **client-side mocks** (override
`global.fetch`, replay a canned SSE stream). The third layer hits a real
server — by default the local one on `:1341` — and only runs when the
server is reachable. Real-LLM e2e is gated by `OPENAI_API_KEY` in `.env`
(or `ANTHROPIC_API_KEY`).

## What's covered

### `client/`
- DistriClient injects `distri_request` into outgoing messages
  (already covered by `packages/core/src/__tests__/distri-client-overrides.test.ts`;
  this folder owns the integration-shaped versions).
- Encoder handles `image_url`, `tool_call`, `tool_result` parts round-trip.
- Stream resilience: reconnect on transient SSE close, dedup on
  `run_started` replay.

### `react/`
- `useChat` task tracking across nested forks (root → fork1 → grandchild).
- Default tools render correctly: `todo_write` → `TodosCompact`,
  `ask_follow_up` → `AskFollowUp`, `confirm`/`input`/`notify`.
- `invoke_agent` / `new_task` produce a sub-task in `chatStateStore`
  with proper `parentTaskId` linkage.
- `chatStateStore` does NOT close the main stream on a sub-task's
  `run_finished` (regression for the fork-stuck bug).

### `e2e/`
- Login + send message + assert the UI gets `text_message_*` events.
- Real LLM (gated): an agent that calls a tool, FE shows the tool card
  with both call + result.
- Workspace-level model resolution: a workspace with a default
  `gpt-5.1` returns the right `[LLM]` span without explicit settings.

## Running

```bash
# Install once (workspace install)
cd /home/user/distrijs && pnpm install

# Fast layers — no server, no .env
pnpm -F @distri/integration test:unit       # client/ + react/

# All layers including e2e
cp integration/.env.example integration/.env
# edit .env: DISTRI_BASE_URL, DISTRI_API_KEY, etc.
pnpm -F @distri/integration test:e2e

# Single test file
pnpm -F @distri/integration vitest run integration/react/useChat-fork-tracking.test.tsx
```

## Mocking strategy

We mock **as little as possible**:

- `client/`: stub `global.fetch` with canned JSON for non-stream calls
  and a `ReadableStream` that emits SSE events for streaming calls.
  `DistriClient`, encoder, agent class — all real.
- `react/`: build a real `Agent` instance with a mock `DistriClient`
  whose `streamMessage` returns a canned `AsyncIterable<DistriEvent>`.
  Hooks, store, components — all real. Render via `@testing-library/react`.
- `e2e/`: nothing mocked. Point the test at a live server and the
  same code paths the UI uses in production.

> Why not mock at the SSE wire level for `react/` too? Because the
> bug we're chasing (fork tracking, default tool rendering) lives in
> the JS layer, not the parser. Pushing all the way to the wire just
> makes tests fragile without finding more bugs.

## Adding a test

1. Decide the layer:
   - "Does it need a network/server?" → `e2e/`.
   - "Does it touch React?" → `react/`.
   - Otherwise → `client/`.
2. Use a fixture from `fixtures/` if there's already a stream that
   matches your scenario; otherwise add one (canned SSE JSON arrays).
3. e2e tests must call `requireServer()` or `requireRealLLM()` from
   `scripts/lib.ts` so they skip cleanly when prereqs are absent.

## Cross-repo

- The agent definitions used by `e2e/` are pushed from
  `distri/integration/agents/` so the same `mock_smoke_agent`,
  `mock_fork_agent`, etc. work end-to-end.
- For the mock-LLM-on-server option (no real LLM in e2e), build the
  server with `cargo build -p distri-server --features mock-llm` —
  see `distri/integration/MOCK_LLM_WIRING.md`.
