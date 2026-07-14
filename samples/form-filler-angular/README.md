# Form Filler sample (Angular)

The Angular twin of `samples/form-filler` — same demo (an AI assistant fills
a security-incident report form from conversation), same agent
(`form_filler_agent_v2`), built on `@distri/angular` instead of
`@distri/react`.

## How it works

- `src/app/incident-form.component.ts` — Angular port of the React sample's
  `IncidentForm`. Angular has no `useImperativeHandle`; the parent reaches
  its `setValue`/`getValues`/`reset`/`submit`/`getFieldOptions` API via
  `@ViewChild(IncidentFormComponent)` instead of a ref.
- `src/app/tools.ts` — the same `DistriFnTool`s as the React sample
  (`fill_field`, `fill_multiple_fields`, `get_form_values`, `clear_form`,
  `submit_form`, `get_field_options`), reading/writing through that
  ViewChild.
- `src/app/app.component.ts` — composes `IncidentFormComponent` with
  `@distri/angular`'s `<distri-chat>`, passing `externalTools` and a
  `beforeSendMessage` that injects the form's HTML as context (same as the
  React version).
- `agent.md` — the agent definition this sample expects on your Distri
  backend (identical to the React sample's).

## Running it

This app resolves the Distri backend URL from `window.DISTRI_API_URL` (set it
in `src/index.html` before the app script, or just edit the default in
`app.component.ts`) rather than a build-time env var, since Angular's config
story differs from Vite's `import.meta.env`.

1. Register the agent in `agent.md` on a running Distri backend.
2. `pnpm --filter @distri/form-filler-angular-sample dev`

Without a backend, the form still renders and works manually — only the
chat-driven auto-fill needs a live agent.
