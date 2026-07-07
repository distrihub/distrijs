# Read-only task streaming — Phase 1 (React-first)

**Date:** 2026-07-07
**Status:** Approved — implement now
**Scope:** distrijs `@distri/core` + `@distri/react`. **No server changes.**
**Companion spec:** [`2026-07-07-read-only-task-streaming-phase2-3-core-angular-design.md`](./2026-07-07-read-only-task-streaming-phase2-3-core-angular-design.md) (core extraction + Angular — *specified, not built*)

## 1. Problem

Today, the only way to render an agent's activity in distrijs is `useChat` →
`Agent.invokeStream` → `message/stream`. That couples *rendering* to *sending*: you
must own the turn to see it. We want a **read-only** way to attach to a task that is
already running (or already finished) and stream its updates into the exact same
renderers `<Chat>` uses — no composer, no `sendMessage`, but the live subscription
still works.

Two triggers:
- **Send-then-follow:** fire a message (background/foreground), then render its
  progress in a separate read-only surface.
- **Follow-existing:** attach to a task id (e.g. a background task) and watch it
  replay + tail.

## 2. Key enabling fact

Rendering in `@distri/react` is **store-driven, not `useChat`-driven**.
`MessageRenderer` / `SubTaskTree` / `ContextRow` render over a `ChatStore`
(`createChatStore()`), fed by the `processMessage(event, isFromStream)` reducer
(`stores/chatStateStore.ts`). Nothing in the render path knows whether events came
from a live `message/stream` turn or a `tasks/resubscribe` follow. So read-only is:

> same store, same reducer, same renderers — different event source, no composer.

The server already implements A2A `tasks/resubscribe` (SSE): it replays the task's
24h event log, then streams the live tail, then synthesizes a terminal frame for an
already-finished task. `@a2a-js/sdk`'s `A2AClient` already exposes
`resubscribeTask(params: TaskIdParams): AsyncGenerator<A2AStreamEventData>`. It is
simply **not wrapped** in `@distri/core` yet. Phase 1 wraps it and builds the React
surface on top.

## 3. Decisions (locked)

- **Scope:** task-level only. Sub-agent forks already stream under the root task, so
  the full tree still renders. Thread-level following is a documented non-goal for v1.
- **Transport:** wrap A2A `tasks/resubscribe` (the standard method), decoding frames
  through the existing `decodeA2AStreamEvent`. The follower is always initialized from
  a call site that already holds the `Agent` (you just sent with it, or resolved it via
  `useAgent`), so the per-agent A2A URL requirement is satisfied — the hook takes an
  `Agent`, not a bare task id.

## 4. Architecture

```
@distri/core
  DistriClient.resubscribeTask(agentId, taskId, opts) : AsyncGenerator<A2AStreamEventData>
      └─ wraps A2AClient.resubscribeTask({ id: taskId })   (tasks/resubscribe, SSE)
  Agent.resubscribe(taskId, opts) : AsyncGenerator<DistriChatMessage>
      └─ decodeA2AStreamEvent per frame; NO hook/tool side-effects (read-only)

@distri/react
  useTaskStreaming({ agent, taskId, threadId?, enabled?, store? }) : UseTaskStreamingReturn
      └─ owns createChatStore(); seed persisted history → tail via agent.resubscribe;
         pumps processMessage(evt, true); clear-and-replay on (re)connect.
  <ChatMessageList>            // extracted from Chat.renderMessages() — shared by both
  <TaskView>                   // read-only surface: useTaskStreaming + ChatStoreContext
                               //   + <ChatMessageList> + read-only <ContextRow>. No composer.
```

### 4.1 Core primitive

```ts
// DistriClient
async *resubscribeTask(
  agentId: string,
  taskId: string,
  opts?: { signal?: AbortSignal },
): AsyncGenerator<A2AStreamEventData> {
  const client = this.getA2AClient(agentId);
  yield* await client.resubscribeTask({ id: taskId });
}

// Agent — read-only twin of invokeStream (decode only, no inline-hook completion)
async *resubscribe(
  taskId: string,
  opts?: { signal?: AbortSignal },
): AsyncGenerator<DistriChatMessage> {
  for await (const event of this.client.resubscribeTask(this.agentDefinition.name, taskId, opts)) {
    const converted = decodeA2AStreamEvent(event);
    if (converted) yield converted;
  }
  // stream errors → synthesized run_error (mirror invokeStream), so read-only UIs render them in-chat
}
```

Abort is cooperative (as in `sendMessageStream`/`useChat`): the consumer breaks out
of the `for await` loop on `signal.aborted`, which returns the generator and closes
the underlying fetch.

### 4.2 `useTaskStreaming` hook

```ts
interface UseTaskStreamingOptions {
  agent: Agent | null;
  taskId: string | null;
  threadId?: string;                 // seed persisted history (tasks older than the 24h replay window)
  initialMessages?: DistriChatMessage[];  // pre-fetched history, like useChat
  enabled?: boolean;                 // default true; false = do not connect
  store?: ChatStore;                 // optional externally-owned store
  onError?: (e: Error) => void;
}
interface UseTaskStreamingReturn {
  store: ChatStore;
  messages: DistriChatMessage[];
  isStreaming: boolean;
  isTerminal: boolean;
  error: Error | null;
  reconnect: () => void;
  stop: () => void;
}
```

Behavior:
1. Owns a `createChatStore()` (or the passed store) — **identical store to live chat**.
2. **Seed then tail:** if `initialMessages` provided, render them + `hydrateTaskTree`
   (mirrors `useChat.ts:159-168`) so old/terminal tasks aren't blank. Then attach the tail.
3. Open `agent.resubscribe(taskId, { signal })`; pump each event through
   `store.getState().processMessage(evt, true)`.
4. **Idempotent (re)connect:** `tasks/resubscribe` always replays the full log from
   position 0. So each (re)connect first `clearAllStates()` on the store, then replays.
   This guarantees consistent state and avoids double-appended text deltas. On an
   unexpected close where the task is not terminal, reconnect once with a short backoff.
5. `isTerminal` is set when a `run_finished`/`run_error` for the **subscribed** taskId
   arrives (root terminal) — stop reconnecting.
6. Abort on unmount / `enabled=false` / `taskId` change.

### 4.3 `<ChatMessageList>` (the one intentional refactor)

Extract the message-rendering loop from `Chat.tsx` — `renderMessages()`
(`Chat.tsx:924-1007`) **plus** the trailing catch-all `<SubTaskTree excludeRootIds>`
(`Chat.tsx:1278-1287`) and the auto-expand-running-tools effect
(`Chat.tsx:~900-915`) — into a shared presentational component:

```ts
interface ChatMessageListProps {
  messages: DistriChatMessage[];                 // caller supplies (Chat concatenates history)
  toolRenderers?: ToolRendererMap;
  rendering?: RenderingMode;
  verbose?: boolean;
  debug?: boolean;
  threadId?: string;
  enableFeedback?: boolean;
  onShowTrace?: (threadId: string) => void;
}
```

- Reads `tasks` / `toolCalls` from the store via `useChatStateStore` (must be inside a
  `ChatStoreContext`). Owns `expandedTools` state + the auto-expand effect internally.
- Renders per-turn fork anchoring (inline `SubTaskTree`) + the trailing catch-all tree,
  exactly as Chat does today.
- `Chat` replaces `renderMessages()` + the trailing tree with `<ChatMessageList .../>`;
  its shell (error banner, browser preview, external tool calls, pending message,
  footer composer) is unchanged. This dedupes the complex fork-anchoring logic instead
  of forking a second copy for read-only.

### 4.4 `<TaskView>` (read-only surface)

```ts
interface TaskViewProps {
  agent: Agent | null;
  taskId: string | null;
  threadId?: string;
  initialMessages?: DistriChatMessage[];
  enabled?: boolean;
  // ---- renderer customization: same surface as <Chat> ----
  toolRenderers?: ToolRendererMap;
  rendering?: RenderingMode;         // 'minimal' | 'rich'
  verbose?: boolean;
  debug?: boolean;
  enableFeedback?: boolean;
  onShowTrace?: (threadId: string) => void;
  // ---- presentation ----
  className?: string;
  maxWidth?: string;
  showContextRow?: boolean;          // default true; read-only ContextRow footer (todos/context, no composer)
  emptyState?: React.ReactNode;
  onError?: (e: Error) => void;
  store?: ChatStore;
}
```

`<TaskView>` = `useTaskStreaming(...)` → `<ChatStoreContext.Provider>` →
`<ChatMessageList>` + optional read-only `<ContextRow>`. No `<ChatInput>`, no
`sendMessage`.

## 5. Renderer customization & custom views (must be documented)

Three documented consumption levels — from turnkey to fully custom:

1. **`<TaskView>` with renderer props** — pass `toolRenderers` (per-tool custom
   renderers, same `ToolRendererMap` as `<Chat>`), `rendering="rich" | "minimal"`,
   `verbose`, `enableFeedback`. Turnkey read-only transcript.
2. **`useTaskStreaming` + `<ChatMessageList>`** — own the shell, reuse Distri's
   renderers. Wrap `{ store }` in `<ChatStoreContext.Provider>` and drop in
   `<ChatMessageList messages={messages} toolRenderers={...} />`. Add your own header,
   layout, or side panels.
3. **`useTaskStreaming` fully custom** — ignore Distri renderers entirely. Use the
   returned `{ messages, isStreaming, isTerminal, store }` and render your own UI
   (map `messages`, read reactive slices via `useStore(store, selector)`). This is the
   path Angular/other frameworks conceptually mirror in Phase 3.

All three are documented in `docs/task-streaming.md` with runnable snippets.

## 6. Contracts & invariants

- **Read-only invariant:** `useTaskStreaming` / `<TaskView>` never call `sendMessage`,
  `completeTool`, or `completeInlineHook`. Inline-hook / external-tool events render as
  read-only status; they never prompt for input.
- **Event routing unchanged:** events route by `taskId`/`parentTaskId` envelope
  (sub-agent forks land in the right `SubTaskCard`) — inherited from the shared reducer.
- **Terminal detection:** the server closes the stream on the subscribed task's own
  `run_finished`/`run_error` (`until_own_terminal`); hook sets `isTerminal` and stops.
- **Stale task (>24h):** replay log expired → transcript comes from seeded history;
  the tail is empty / immediately terminal. Graceful, not an error.
- **`<Chat>` behavior unchanged** after the `<ChatMessageList>` extraction.

## 7. Testing (red first)

`@distri/core` (vitest, mocked fetch — mirror `tasks-api.test.ts`):
- `Agent.resubscribe` decodes A2A frames into `DistriChatMessage`s (status-update →
  event, message → message), yields in order, stops on stream close.
- `resubscribeTask` issues `tasks/resubscribe` for `{ id: taskId }` on the agent URL.
- stream error → synthesized `run_error`.

`@distri/react` (vitest + @testing-library/react + jsdom — mirror `useBackgroundTasks.test.ts`):
- **seed→tail:** `initialMessages` render first, then streamed events append.
- **clear-and-replay on reconnect:** replaying the same log twice yields identical
  `messages` (no doubled text deltas).
- **terminal:** `run_finished` for the subscribed task sets `isTerminal`, stops reconnect.
- **abort on unmount:** unmount aborts the generator; no post-unmount state writes.
- `<TaskView>` renders streamed messages via `MessageRenderer` and shows no composer.
- `<Chat>` regression: existing Chat tests still pass after `<ChatMessageList>` extraction.

## 8. Manual verification vehicle

`apps/task-stream-demo` — minimal Vite React app: a `<Chat>` on the left to send a
message (captures the resulting `task.id`), a `<TaskView agent taskId>` on the right
following the same task read-only, plus a "paste a task id" box to follow a
pre-existing task (replay + tail). Proves the end-to-end story against a running server.

## 9. Out of scope (Phase 1)

- Thread-level subscription / fan-in.
- Extracting the reducer into `@distri/core` (Phase 2).
- Angular binding (Phase 3).
- Adding `agent_id` to `TaskSummary` so you can follow a task discovered from a list
  without already holding its `Agent` (noted Phase-2 nicety).
</content>
