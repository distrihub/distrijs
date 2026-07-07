# Read-only task streaming

Render an agent task's activity **without owning the turn**. Where `useChat` /
`<Chat>` *send* a message and stream the response, `useTaskStreaming` / `<TaskView>`
**attach** to a task that is already running (or already finished), replay its history,
and follow the live tail — using the exact same renderers `<Chat>` uses, with no
composer and no tool interaction.

Under the hood this is A2A `tasks/resubscribe`: the server replays the task's event log,
streams the live tail, then (for a finished task) sends a synthesized terminal frame.

- **Core primitive:** `agent.resubscribe(taskId)` — an async generator of
  `DistriChatMessage`s (decoded events + messages). Framework-agnostic; lives in
  `@distri/core`.
- **React hook:** `useTaskStreaming({ agent, taskId })` — owns a chat store, drives it
  from `agent.resubscribe`, exposes `{ store, messages, isStreaming, isTerminal, … }`.
- **React component:** `<TaskView agent taskId />` — turnkey read-only transcript.

## The send-then-follow pattern

You are always following a task you have an `Agent` for — either you just started it, or
you resolved the agent with `useAgent`. A task id alone is not enough (A2A streams are
per-agent).

```tsx
// 1. Fire a message (foreground or background) and capture the task id.
const result = await agent.invoke({ message /* … */ });   // returns a Task
const taskId = (result as { id?: string }).id;

// 2. Follow it read-only — streams identically to <Chat>, but sends nothing.
<TaskView agent={agent} taskId={taskId} threadId={threadId} />
```

You can also follow a **pre-existing** task (e.g. a background task started elsewhere):
just pass its id.

---

## Three ways to consume it

Pick the level that matches how much of the UI you want to own.

### 1. `<TaskView>` — turnkey, with renderer customization

`<TaskView>` exposes the **same renderer surface as `<Chat>`**. Pass `toolRenderers` to
customize how specific tools render, switch density with `rendering`, and so on.

```tsx
import { TaskView } from '@distri/react';

<TaskView
  agent={agent}
  taskId={taskId}
  threadId={threadId}
  initialMessages={history}          // seed persisted history (tasks older than the 24h replay window)
  rendering="rich"                   // 'minimal' (default) | 'rich'
  verbose
  toolRenderers={{
    // Same ToolRendererMap shape as <Chat>. Keyed by tool name.
    my_custom_tool: ({ toolCall }) => <MyToolCard call={toolCall} />,
  }}
  onShowTrace={(threadId) => openTrace(threadId)}
  showContextRow                     // read-only todos + context dial footer (no composer). default true
  emptyState={<p>Waiting for activity…</p>}
/>
```

`<TaskView>` props (renderer-related): `toolRenderers`, `rendering`, `verbose`, `debug`,
`enableFeedback`, `onShowTrace` — identical semantics to `<Chat>`.

### 2. `useTaskStreaming` + `<ChatMessageList>` — your shell, our renderers

Own the layout (header, side panels, custom footer) but reuse Distri's message/tool/
fork rendering. Wrap the returned `store` in `ChatStoreContext` and drop in
`<ChatMessageList>`.

```tsx
import { useTaskStreaming, ChatMessageList } from '@distri/react';
import { ChatStoreContext } from '@distri/react';

function MyFollowPanel({ agent, taskId }) {
  const { store, messages, isStreaming, isTerminal, reconnect } = useTaskStreaming({
    agent,
    taskId,
  });

  return (
    <ChatStoreContext.Provider value={store}>
      <header>
        {isStreaming ? 'Running…' : isTerminal ? 'Done' : 'Idle'}
        {isTerminal && <button onClick={reconnect}>Replay</button>}
      </header>
      <ChatMessageList
        messages={messages}
        rendering="rich"
        toolRenderers={{ my_custom_tool: ({ toolCall }) => <MyToolCard call={toolCall} /> }}
      />
    </ChatStoreContext.Provider>
  );
}
```

`<ChatMessageList>` is the same message-rendering engine `<Chat>` uses — including
per-turn fork (sub-agent) trees. It must render inside a `ChatStoreContext`.

### 3. `useTaskStreaming` alone — fully custom view

Ignore Distri's renderers entirely. Render `messages` however you like, and read reactive
slices straight off the store.

```tsx
import { useTaskStreaming } from '@distri/react';
import { useStore } from 'zustand';

function RawFollow({ agent, taskId }) {
  const { store, messages, isTerminal } = useTaskStreaming({ agent, taskId });
  const todos = useStore(store, (s) => s.todos);          // any store slice you want

  return (
    <div>
      <ul>{messages.map((m, i) => <li key={i}>{JSON.stringify(m)}</li>)}</ul>
      <TodoList todos={todos} />
      {isTerminal && <span>finished</span>}
    </div>
  );
}
```

This is also the shape other frameworks mirror: the reducer and subscription loop are the
reusable core; only the view layer is framework-specific.

---

## `useTaskStreaming` reference

```ts
const {
  store,        // ChatStore backing the view (publish via ChatStoreContext, or read slices)
  messages,     // [...initialMessages, ...live] — the display transcript
  isStreaming,  // task is running
  isTerminal,   // task reached its own terminal state (or the stream closed cleanly)
  error,        // last stream error (transient errors trigger a bounded reconnect)
  reconnect,    // force a fresh replay from the server log
  stop,         // abort the subscription (call reconnect() to reopen)
} = useTaskStreaming({
  agent,            // Agent that owns the task (required to open the stream)
  taskId,           // task to follow; null disables
  initialMessages,  // optional pre-fetched history to seed the transcript
  enabled,          // default true; false holds the subscription closed
  store,            // optional externally-owned ChatStore
  onError,          // optional error callback
});
```

### Semantics

- **Idempotent (re)connect.** `tasks/resubscribe` always replays the full log from the
  start, so every connect first clears the store and replays. State is always consistent;
  text deltas are never doubled on reconnect.
- **Terminal detection.** The server closes the stream on the task's own
  `run_finished` / `run_error`. `isTerminal` flips true and reconnection stops.
- **Transient errors.** A dropped connection on a still-running task reconnects with a
  short bounded backoff. After the cap, `isTerminal` is set to avoid hot-looping.
- **Read-only invariant.** Never sends, never completes tools or inline hooks. Inline-hook
  / external-tool events render as read-only status.
- **Stale task (> 24h).** The replay log has expired; the transcript comes from
  `initialMessages` and the tail is empty / immediately terminal. Not an error.

## See also

- Design specs: [`docs/superpowers/specs/2026-07-07-read-only-task-streaming-phase1-design.md`](./superpowers/specs/2026-07-07-read-only-task-streaming-phase1-design.md)
- Angular + core-extraction roadmap: [`…-phase2-3-core-angular-design.md`](./superpowers/specs/2026-07-07-read-only-task-streaming-phase2-3-core-angular-design.md)
- Demo app: `apps/task-stream-demo`
