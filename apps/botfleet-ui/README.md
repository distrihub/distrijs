# Bot Fleet UI

Experimental React/Vite frontend for the Bot Fleet program. The app mirrors the UX from the latest design mocks (filtered bot overview + multi-step wizard) and talks to the new `botfleet` Actix backend.

## Getting started

```bash
cd distrijs/apps/botfleet-ui
pnpm install
pnpm dev
```

Set `VITE_BOTFLEET_API_BASE` if the backend lives on a custom host; otherwise it proxies `/api` calls to `localhost:8081` in development.
