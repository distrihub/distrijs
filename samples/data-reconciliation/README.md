# Data Reconciliation sample

Ported from the [distri.dev](https://distri.dev) showcase. An AI assistant
matches internal records against an external data source (e.g. a bank
statement), flags discrepancies, and explains findings in plain language.

## How it works

- `src/DataReconciliationGrid.tsx` — a self-contained, hand-rolled table
  (no grid library) seeded with sample internal/external transaction records,
  exposing an imperative ref API (`runReconciliation`, `getDiscrepancies`,
  `getUnmatchedRecords`, `explainRecord`, `addNote`, `highlightDiscrepancies`,
  `highlightMatches`, `resetData`, …).
- `src/tools.ts` — `DistriFnTool`s the agent calls through that ref
  (`run_reconciliation`, `get_status`, `get_unmatched`, `get_discrepancies`,
  `explain_record`, `highlight_discrepancies`, `highlight_matches`,
  `add_note`, `get_all_data`, `reset_data`).
- `src/App.tsx` — wires `DistriProvider` + `<Chat>` with those tools.
- `agent.md` — the agent definition (`reconciliation_agent`) this sample
  expects to be registered on your Distri backend.

## Auth: the API key never reaches the browser

`vite.config.ts` installs the `distri-token-proxy` dev-server middleware
(`../shared/distri-token-proxy.ts`). It reads `DISTRI_API_KEY` from the Vite
**server** process (no `VITE_` prefix, so Vite will not inline it into the
bundle) and exchanges it for a short-lived access token via
`POST {DISTRI_BASE_URL}/token`.

The frontend (`src/DistriTokenProvider.tsx`) fetches that short-lived token
from `/api/distri/token` and hands it to `<DistriProvider>`. So the long-lived
API key stays server-side; only the scoped, expiring token is ever sent to the
browser. If the exchange fails, the middleware returns an error rather than
falling back to shipping the key.

## Running it

1. Copy `.env.example` to `.env` and set `DISTRI_API_KEY`. `DISTRI_BASE_URL`
   defaults to `https://api.distri.dev/v1`.
2. Register the agent in `agent.md` on that backend.
3. `pnpm --filter @distri/data-reconciliation-sample dev`

Without a valid key the app shows a token error; the grid itself still renders
with sample data — only the chat-driven reconciliation/analysis needs a live
agent.

## Try it

> "Run the reconciliation and tell me what's wrong with the data."

The agent should call `run_reconciliation`, then `get_discrepancies` /
`get_unmatched`, and explain each issue (e.g. an amount mismatch on the
consulting invoice) in business terms with a suggested next step.
