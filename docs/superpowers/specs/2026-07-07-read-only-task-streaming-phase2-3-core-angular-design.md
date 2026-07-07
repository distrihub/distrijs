# Read-only task streaming — Phase 2 (core extraction) + Phase 3 (Angular)

**Date:** 2026-07-07
**Status:** Specified — **do not build yet.** Build after Phase 1 ships and settles.
**Depends on:** [`2026-07-07-read-only-task-streaming-phase1-design.md`](./2026-07-07-read-only-task-streaming-phase1-design.md)

This spec covers making read-only task streaming **framework-agnostic** so it can be
exported to Angular (and Vue/Svelte later) with zero logic duplication. It is fully
specified here so a separate session can execute it self-contained.

---

## Phase 2 — Extract the reducer into `@distri/core`

### Problem

After Phase 1, the event→state reducer (`processMessage` + `ChatState` + the task-tree
bookkeeping) still lives inside the React/zustand store `stores/chatStateStore.ts`. Any
non-React framework would have to re-implement ~1600 lines of reducer logic. That is a
correctness landmine (two divergent reducers) and violates "never reimplement existing
functionality."

### Goal

Move the **pure, framework-agnostic state machine** into `@distri/core` as a
`ChatSession` class. React's store becomes a thin adapter over it. No behavior change to
`<Chat>` or `<TaskView>`.

### Design

```ts
// @distri/core — framework-agnostic, zero React/zustand imports
interface ChatSessionState {
  messages: DistriChatMessage[];
  tasks: Map<string, TaskState>;
  toolCalls: Map<string, ToolCallState>;
  plans: Map<string, PlanState>;
  steps: Map<string, StepState>;
  currentRunId?: string;
  currentTaskId?: string;
  todos: TodoItem[];
  contextBudget?: ContextBudget;
  contextBudgets: Map<string, ContextBudget>;
  compactionEvents: CompactionLogEntry[];
  isStreaming: boolean;
  isLoading: boolean;
  error: Error | null;
  // …the full ChatState shape, minus React.ReactNode fields (see below)
}

class ChatSession {
  getState(): ChatSessionState;
  applyEvent(message: DistriChatMessage, isFromStream?: boolean): void;  // == today's processMessage
  hydrateTaskTree(links: Array<{ taskId: string; parentTaskId?: string }>): void;
  clear(): void;
  subscribe(listener: () => void): () => void;  // observable; fires on every state change
  // read-only helpers: getTaskTree, getToolCallsByTaskId, hasPendingToolCalls …
}
```

**Boundary rule — no UI in core.** Two fields on the React store are UI-coupled and
must NOT move into `@distri/core`:
- `ToolCallState.component?: React.ReactNode` — the rendered interactive tool element.
- the `resumeWithToolResult` / `executeTool` machinery that *builds* React components.

Resolution: `ChatSession` holds only serializable tool-call state
(`{ tool_call_id, taskId, tool_name, input, status, result, isExternal, … }`). The React
adapter keeps a **parallel side-map** `Map<toolCallId, React.ReactNode>` for rendered
components and the interactive-execution logic — it layers UI concerns on top of the pure
session, subscribing to `ChatSession` for data and augmenting with React nodes. This keeps
core free of any framework type.

### React adapter (`stores/chatStateStore.ts` becomes thin)

- `createChatStore()` internally instantiates a `ChatSession`, exposes a zustand store
  whose state mirrors `session.getState()` (updated via `session.subscribe`), and adds
  the React-only actions (`executeTool`, `setResumeWithToolResult`, component side-map).
- `processMessage(msg, fromStream)` delegates to `session.applyEvent(msg, fromStream)`.
- `hydrateTaskTree`, `clearAllStates` delegate to `session.hydrateTaskTree` / `session.clear`.
- Public React API (`useChatStateStore`, `useChatStoreApi`, `ChatStore`) is **unchanged**
  — this is a pure internal refactor.

### Migration & safety

- Move the reducer logic verbatim into `ChatSession`; keep the React store's existing
  tests (`chatStateStore-task-tree.test.ts`, `taskGrouping.test.ts`, etc.) green against
  the adapter — they are the regression net.
- Add core-level unit tests for `ChatSession` directly (no React): event sequences →
  expected `getState()`, task-tree assembly, idempotent replay.
- `useTaskStreaming` (Phase 1) needs no change — it already goes through the store; after
  extraction it transparently rides the adapter. Optionally add a core-only
  `TaskStreamController` (below) so non-React consumers get the subscription loop too.

### Optional: `TaskStreamController` in core

A framework-agnostic driver that owns a `ChatSession` + the `agent.resubscribe` loop
(seed → tail → clear-and-replay-on-reconnect), exposing `state` via `subscribe`. React's
`useTaskStreaming` and Angular's service both wrap this, so the *subscription lifecycle*
(not just the reducer) is shared:

```ts
class TaskStreamController {
  constructor(opts: { agent: Agent; taskId: string; initialMessages?: DistriChatMessage[] });
  readonly session: ChatSession;
  start(): void; stop(): void; reconnect(): void;
  subscribe(listener: (s: { isStreaming: boolean; isTerminal: boolean; error: Error | null }) => void): () => void;
}
```

### Deliverables (Phase 2)

- `@distri/core`: `ChatSession`, `ChatSessionState`, (optional) `TaskStreamController` +
  the state types (`TaskState`, `ToolCallState`, `PlanState`, `StepState`, …) moved to core.
- `@distri/react`: `chatStateStore.ts` reduced to an adapter; all existing tests green.
- Core unit tests for `ChatSession` and `TaskStreamController`.

---

## Phase 3 — Angular binding (`@distri/angular`)

### Goal

Ship a first-class Angular integration mirroring the React read-only surface, built
entirely on the Phase-2 core primitives. No reducer logic in the Angular package.

### Design

New package `packages/angular` → `@distri/angular` (Angular 17+, standalone APIs,
signals).

```ts
@Injectable()
class DistriTaskStreamService {
  // wraps core TaskStreamController + ChatSession
  connect(opts: { agent: Agent; taskId: string; threadId?: string; initialMessages?: DistriChatMessage[] }): void;
  disconnect(): void;
  reconnect(): void;
  readonly messages: Signal<DistriChatMessage[]>;
  readonly isStreaming: Signal<boolean>;
  readonly isTerminal: Signal<boolean>;
  readonly error: Signal<Error | null>;
  readonly state: Signal<ChatSessionState>;   // full session state for custom views
}
```

- Bridge core's `subscribe(listener)` → Angular signals via `signal()` +
  `NgZone.run` (or `toSignal` over an RxJS `Observable` adapter). Provide **both** a
  signals API and an `Observable<ChatSessionState>` for RxJS-first apps.
- `<distri-task-view>` standalone component: read-only transcript mirroring React's
  `<TaskView>`. Renderer customization via `@Input() toolRenderers` (Angular
  `TemplateRef`/component map), `rendering`, `verbose`. Message/tool rendering is
  re-implemented in Angular templates over `ChatSessionState` — **only the view layer is
  framework-specific; all state/subscription logic is core.**
- Custom views: consumers inject `DistriTaskStreamService` and render `messages()` /
  `state()` with their own templates (mirrors React consumption level 3).

### Testing (Phase 3)

- Angular TestBed unit tests for `DistriTaskStreamService`: mocked `Agent.resubscribe`
  generator → signals update; reconnect clears + replays; disconnect aborts.
- Component tests for `<distri-task-view>` rendering streamed messages, no composer.

### Deliverables (Phase 3)

- `packages/angular` (`@distri/angular`): `DistriTaskStreamService`,
  `<distri-task-view>`, renderer-map support, docs.
- An Angular demo under `apps/` (or `samples/`) mirroring the React demo.
- `docs/task-streaming-angular.md`.

### Non-goals (Phase 3)

- Full interactive Angular `<Chat>` (sending, tools, composer). Only the **read-only**
  surface is in scope — interactive parity is a later, separate effort.
- Vue/Svelte bindings (the Phase-2 core boundary makes them straightforward follow-ups,
  but they are not specified here).
</content>
