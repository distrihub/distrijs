# Data Reconciliation sample (Angular)

The Angular twin of `samples/data-reconciliation` — same demo (an AI
assistant matches internal records against an external data source and
explains discrepancies), same agent (`reconciliation_agent`), built on
`@distri/angular` instead of `@distri/react`.

## How it works

- `src/app/data-reconciliation-grid.component.ts` — Angular port of the
  React sample's `DataReconciliationGrid`: same hand-rolled table, same
  sample data, same reconciliation logic (implemented with signals instead
  of `useState`). Exposes its API (`runReconciliation`, `getDiscrepancies`,
  `explainRecord`, `addNote`, …) as public methods for the parent to call via
  `@ViewChild`, in place of the React version's `useImperativeHandle`.
- `src/app/tools.ts` — the same `DistriFnTool`s as the React sample
  (`run_reconciliation`, `get_status`, `get_unmatched`, `get_discrepancies`,
  `explain_record`, `highlight_discrepancies`, `highlight_matches`,
  `add_note`, `get_all_data`, `reset_data`).
- `src/app/app.component.ts` — composes `DataReconciliationGridComponent`
  with `@distri/angular`'s `<distri-chat>`, passing `externalTools`.
- `agent.md` — the agent definition this sample expects on your Distri
  backend (identical to the React sample's).

## Running it

This app resolves the Distri backend URL from `window.DISTRI_API_URL` rather
than a build-time env var — edit the default in `app.component.ts`, or set
`window.DISTRI_API_URL` in `src/index.html` before the app script.

1. Register the agent in `agent.md` on a running Distri backend.
2. `pnpm --filter @distri/data-reconciliation-angular-sample dev`

Without a backend, the grid still renders with sample data — only the
chat-driven reconciliation/analysis needs a live agent.
