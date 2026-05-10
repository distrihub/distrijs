---
description: Run the distrijs integration test suite (client + react + e2e). Optional args select a slice.
---

Run the distrijs integration suite per the user's argument.

**Argument parsing:**

- `$ARGUMENTS` empty       → `pnpm -F @distri/integration test`
- `unit`                   → `pnpm -F @distri/integration test:unit` (no server)
- `e2e`                    → `pnpm -F @distri/integration test:e2e`
- `client`                 → `pnpm -F @distri/integration vitest run client`
- `react`                  → `pnpm -F @distri/integration vitest run react`
- `colocated` / `pkg`      → `pnpm test` from the workspace root (runs the
  `packages/*/src/__tests__/` suites)
- A path matching `*.test.{ts,tsx}` → `pnpm -F @distri/integration vitest run <path>`

**Pre-flight (in order):**

1. Confirm `pnpm install` has been run — `node_modules/` exists in the
   workspace root.
2. For `e2e`, confirm `integration/.env` exists. If not, ask the user
   whether to copy `.env.example` and supply values.
3. For `e2e`, check the server is up at `${DISTRI_BASE_URL%/v1}/healthz`.
   If not, offer to run `integration/scripts/start-server.sh` (which
   delegates to the distri repo's start script).
4. For `e2e` with real-LLM expectations, confirm a provider key is set
   in `integration/.env`. If not, warn that those tests will console-warn
   and skip.

**Run, then report:**

- Stream the runner's stdout to the user.
- After it exits, summarize: pass/fail counts per file, list any FAIL
  test names with their file paths, and quote the first failing
  assertion message verbatim.
- If a test reports "[skip]" via console.warn, surface that in the
  summary so the user knows coverage was reduced.

**Reference docs:**
- `integration/README.md` — what each layer covers
- `../distri/TESTING.md` — the four-layer cross-repo map
- `.claude/skills/integration/SKILL.md` — operator runbook
