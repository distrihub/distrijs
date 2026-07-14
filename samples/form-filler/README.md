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
3. `pnpm --filter @distri/form-filler-sample dev`

Without a valid key the app shows a token error; the form itself still renders
and works manually — only the chat-driven auto-fill needs a live agent.

## Try it

> "I'm John Smith (john@example.com). Yesterday we had a phishing attack
> where several employees received fake emails. I'd classify it as medium
> impact. We should implement additional email filtering."

The agent should extract the fields, call `fill_multiple_fields`, and confirm
what it filled.
