# Form Filler sample

Ported from the [distri.dev](https://distri.dev) showcase. An AI assistant
fills out a security-incident report form from natural-language conversation
instead of the user filling each field by hand.

## How it works

- `src/IncidentForm.tsx` — a self-contained form with an imperative ref API
  (`setValue`, `getValues`, `reset`, `submit`, `getFieldOptions`).
- `src/tools.ts` — `DistriFnTool`s (`fill_field`, `fill_multiple_fields`,
  `get_form_values`, `clear_form`, `submit_form`, `get_field_options`) that
  read/write the form through that ref.
- `src/App.tsx` — wires `DistriProvider` + `<Chat>` with those tools, plus a
  `beforeSendMessage` hook that injects the form's HTML structure as context
  so the agent knows which fields and dropdown options exist.
- `agent.md` — the agent definition (`form_filler_agent_v2`) this sample
  expects to be registered on your Distri backend.

## Running it

1. Copy `.env.example` to `.env` and point `VITE_DISTRI_API_URL` at a running
   Distri backend (plus `VITE_DISTRI_CLIENT_ID`/`VITE_DISTRI_WORKSPACE_ID` if
   your backend requires them).
2. Register the agent in `agent.md` on that backend.
3. `pnpm --filter @distri/form-filler-sample dev`

Without a backend, the UI still renders and the form still works manually —
only the chat-driven auto-fill needs a live agent.

## Try it

> "I'm John Smith (john@example.com). Yesterday we had a phishing attack
> where several employees received fake emails. I'd classify it as medium
> impact. We should implement additional email filtering."

The agent should extract the fields, call `fill_multiple_fields`, and confirm
what it filled.
