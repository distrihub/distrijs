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

## Running it

1. Copy `.env.example` to `.env` and point `VITE_DISTRI_API_URL` at a running
   Distri backend (plus `VITE_DISTRI_CLIENT_ID`/`VITE_DISTRI_WORKSPACE_ID` if
   your backend requires them).
2. Register the agent in `agent.md` on that backend.
3. `pnpm --filter @distri/data-reconciliation-sample dev`

Without a backend, the grid still renders with sample data — only the
chat-driven reconciliation/analysis needs a live agent.

## Try it

> "Run the reconciliation and tell me what's wrong with the data."

The agent should call `run_reconciliation`, then `get_discrepancies` /
`get_unmatched`, and explain each issue (e.g. an amount mismatch on the
consulting invoice) in business terms with a suggested next step.
