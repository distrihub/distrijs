# Read-only task streaming demo

Manual verification vehicle for `useTaskStreaming` / `<TaskView>` (see
[`../../docs/task-streaming.md`](../../docs/task-streaming.md)).

- **Left** — a `<Chat>` that sends a message. The demo captures the resulting task id.
- **Right** — a `<TaskView>` following that same task **read-only**: it replays and
  streams the identical transcript with no composer. You can also paste any task id to
  follow a pre-existing task (replay + tail).

## Run

Point it at a running Distri server (see the repo `bin/server`), then:

```bash
# from distrijs/
pnpm --filter @distri/react build          # TaskView lives in the built @distri/react
pnpm --filter @distri/task-stream-demo dev  # http://localhost:5273
```

Configure via `apps/task-stream-demo/.env.local`:

```
VITE_DISTRI_BASE_URL=http://localhost:5184/v1/
VITE_DISTRI_TOKEN=<your DISTRI_API_KEY>
VITE_DISTRI_AGENT_ID=coder
```

Defaults target a local OSS server (`http://localhost:5184/v1/`, anonymous token,
agent `coder`).
