---
name: integration
description: Run distrijs integration tests (client + react + e2e against a real distri server). Use when the user asks to test @distri/core, @distri/react, the chat UI flow, or to verify fork/invoke_agent and default-tool behavior end-to-end.
---

# DistriJS integration testing

Operator runbook for `distrijs/integration/`. Folder structure and
contract live in `integration/README.md` — read it once first.

```
integration/
  client/   — DistriClient + encoder, fetch stubbed in-memory
  react/    — useChat + chatStateStore + components, no server
  e2e/      — real distri-server on :1341, optional real LLM
  fixtures/ — canned SSE event sequences
  scripts/  — shared lib.ts, server start/stop helpers
```

## Running

```bash
cd /home/user/distrijs
pnpm install                                         # once

# Layer 3 — pure JS, no server, no costs
pnpm -F @distri/integration test:unit                # client/ + react/

# Layer 4 — needs a running server
[ -f integration/.env ] || cp integration/.env.example integration/.env
# edit .env: DISTRI_BASE_URL=http://localhost:1341/v1, optionally OPENAI_API_KEY
bash integration/scripts/start-server.sh             # boots ../distri's server in mock mode
pnpm -F @distri/integration test:e2e

# Single test file
pnpm -F @distri/integration vitest run integration/react/useChat-fork-tracking.test.tsx
```

The colocated unit tests (`packages/*/src/__tests__/`) run with
`pnpm test` from the package or from the workspace root — they have
no environment requirements at all.

## What's tested where

| File                                                    | What it locks in                                  |
|---------------------------------------------------------|---------------------------------------------------|
| `react/useChat-fork-tracking.test.tsx`                  | parent → child task linkage; streaming stays open while child runs |
| `react/default-tools-render.test.tsx`                   | todo_write / ask_follow_up store semantics        |
| `client/distri-client.smoke.test.ts`                    | DistriClient init + agent.json fetch              |
| `e2e/server-up.test.ts`                                 | sentinel: server reachable                        |
| `e2e/agent-run.test.ts`                                 | full message flow against real server             |
| `packages/react/__tests__/chatStateStore-invoke-agent`  | invoke_agent stays pending until tool_results     |
| `packages/react/__tests__/default-tools.test.ts`        | todo_write / confirm / notify / ask_follow_up store round-trip |
| `packages/react/__tests__/chatStateStore-task-tree`     | (existing) sub-agent finish does NOT close stream |

## How e2e gating works

`scripts/lib.ts` exposes:
- `isServerUp()` — true iff `${DISTRI_BASE_URL}/healthz` is 200
- `hasRealLLMKey()` — true iff OPENAI_API_KEY or ANTHROPIC_API_KEY is set

Tests check these in `beforeAll` and emit a console warn + return if
the precondition is missing. That keeps the suite green on machines
without a server, while still actually running when conditions are met.

## Common problems

| Symptom                                          | Likely cause                                       |
|--------------------------------------------------|----------------------------------------------------|
| `client/` tests fail with "fetch is not defined" | Wrong vitest environment — check `environmentMatchGlobs` in `vitest.config.ts` |
| `e2e/` runs but every test reports "skipped"     | Server not up at `DISTRI_BASE_URL`. Run `start-server.sh`, or set the var to your remote test deployment. |
| `react/` test sees stale store state             | Missing `useChatStateStore.getState().clearAllStates()` in `beforeEach`. |
| invoke_agent test fails with "expected pending" but got "completed" | A change introduced premature completion of the parent's tool call when the child finished. Cross-check with `chatStateStore-task-tree.test.ts`. |

## Cross-repo

`e2e/agent-run.test.ts` runs against the `mock_smoke_agent` defined in
`../distri/integration/agents/`. If the server hasn't been seeded with
that agent, run `distri push integration/agents` from the distri repo
first (the `start-server.sh` helper does this for you).
