# React Native Distri React Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the sample-critical `@distri/react` chat, renderer, client-tool, and task-following patterns work as native React Native APIs and prove them in the Android Storybook sample.

**Architecture:** Reuse `@distri/core` and the framework-agnostic `@distri/state` controllers/stores. Add native presentation and task-following adapters in `@distri/react-native`, then compose realistic Storybook examples over those exported APIs; no DOM/CSS renderer is imported into the native package.

**Tech Stack:** TypeScript, React Native, Zustand, `@distri/core`, `@distri/state`, Vitest/Testing Library, Expo, Storybook for React Native, Android emulator.

**Spec:** `docs/superpowers/specs/2026-09-24-react-native-react-parity-design.md`

## Global Constraints

- Reuse `@distri/state` for transport, message state, external-tool execution, task streaming, and resume behavior; do not fork that logic for native.
- Keep the package on React Native primitives with no DOM/CSS dependency.
- Preserve existing public props and `renderMessage`; app-provided tool renderers override defaults without disabling unrelated tool execution.
- Storybook fixtures must pass through actual exported package APIs and invoke actual client handlers.
- Validate on Android; report a local-cloud reachability limitation separately from deterministic tests.

## Review Focus

- A streamed in-turn client tool must complete only once through `agent.completeTool`; an already-ended/timed-out turn must use the shared role-`tool` resume path.
- A custom tool renderer must not prevent handler execution — assert handler side effects and custom native content independently.
- Malformed/unsupported content parts must not crash a message list — assert a safe fallback is visible.
- Task stream teardown/reconnect must not leak updates across task IDs — assert terminal updates apply only to the subscribed task and stop after unmount.
- Android Storybook stories must be navigable and controls actionable — exercise renderer, approval, and task stories on the emulator and retain screenshots.

---

### Task 1: Native renderer and tool API contracts

**Files:**
- Create: `packages/react-native/src/types.ts`
- Modify: `packages/react-native/src/Chat.tsx`
- Modify: `packages/react-native/src/index.ts`
- Test: `packages/react-native/src/__tests__/Chat.test.tsx`
- Test: `packages/react-native/src/__tests__/native-renderers.test.tsx`

**Interfaces:**
- Consume `ToolCall`, `ToolResult`, `DistriChatMessage`, `DistriEvent`, and `ToolCallState` from the existing core/state exports.
- Produce `RenderingMode = 'minimal' | 'rich'`, `NativeToolRendererProps { toolCall: ToolCall; state?: ToolCallState; completeTool: (result: ToolResult) => void }`, and `NativeToolRendererMap = Record<string, (props: NativeToolRendererProps) => ReactNode>`.
- Extend `ChatProps` with `rendering?: RenderingMode` and `toolRenderers?: NativeToolRendererMap`; retain `renderMessage` precedence.

- [ ] Add a failing test in `Chat.test.tsx` that supplies one auto-executing `externalTools` handler and a streamed call to that tool; assert the handler receives parsed input, the tool call is rendered, and the returned result is sent through `agent.completeTool` exactly once.
- [ ] Run `pnpm --filter @distri/react-native test -- Chat.test.tsx` and confirm the new assertion fails because the native renderer/API surface is missing or incomplete.
- [ ] Add renderer types and the public prop/export surface; keep tool execution in `ChatController` and read tool call state from the provided native chat store.
- [ ] Add `native-renderers.test.tsx` cases for a default function-tool row, a `toolRenderers` override, and unknown-part fallback; assert handler execution separately from renderer output.
- [ ] Run `pnpm --filter @distri/react-native test` and `pnpm --filter @distri/react-native type-check`.

### Task 2: Native message and tool rendering

**Files:**
- Create: `packages/react-native/src/ChatMessageList.tsx`
- Create: `packages/react-native/src/renderers/MessageRenderer.tsx`
- Create: `packages/react-native/src/renderers/ToolExecutionRenderer.tsx`
- Create: `packages/react-native/src/renderers/partRenderers.tsx`
- Modify: `packages/react-native/src/Chat.tsx`
- Modify: `packages/react-native/src/index.ts`
- Test: `packages/react-native/src/__tests__/native-renderers.test.tsx`

**Interfaces:**
- `ChatMessageListProps { messages: DistriChatMessage[]; rendering?: RenderingMode; toolRenderers?: NativeToolRendererMap; renderMessage?: ChatProps['renderMessage'] }`.
- Renderer covers text, image URL/bytes, data, artifact metadata, tool calls/results, and safe unknown-part output using `View`, `Text`, and React Native `Image`.
- `minimal` shows concise tool summaries/status; `rich` shows inputs, results, errors, and action affordances.

- [ ] Add failing renderer tests for a text+image message, successful and failed tool results, and rich/minimal display differences.
- [ ] Run `pnpm --filter @distri/react-native test -- native-renderers.test.tsx` and confirm each new case fails on missing rendering behavior.
- [ ] Implement focused native part renderers and route `Chat` messages through `ChatMessageList` unless `renderMessage` is supplied.
- [ ] Verify custom renderers replace only the named tool and built-in renderers handle other tools in the same message.
- [ ] Run the full `@distri/react-native` suite, type-check, and build.

### Task 3: Interactive native tools and read-only task following

**Files:**
- Create: `packages/react-native/src/useTaskStreaming.ts`
- Create: `packages/react-native/src/TaskView.tsx`
- Create: `packages/react-native/src/renderers/SubTaskTree.tsx`
- Create: `packages/react-native/src/renderers/ContextRow.tsx`
- Modify: `packages/react-native/src/index.ts`
- Test: `packages/react-native/src/__tests__/useTaskStreaming.test.tsx`
- Test: `packages/react-native/src/__tests__/TaskView.test.tsx`
- Test: `packages/react-native/src/__tests__/native-renderers.test.tsx`

**Interfaces:**
- Mirror React's read-only `useTaskStreaming({ agent, taskId, initialMessages?, enabled?, store?, onError? })` return shape by adapting the shared `TaskStreamingController`.
- `TaskView` is a native read-only surface that composes `useTaskStreaming`, `ChatMessageList`, and task/todo/context status; no composer or tool execution.
- Tool renderer completion calls the shared `completeTool` path; approval/checkpoint stories complete and resume using `ToolResult`.

- [ ] Add a controlled `agent.resubscribe(taskId)` test proving task events appear, terminal state is reported, and stop/unmount ends the subscription.
- [ ] Run `pnpm --filter @distri/react-native test -- useTaskStreaming.test.tsx` and confirm the missing hook fails the test.
- [ ] Implement the hook as a lifecycle adapter over `TaskStreamingController`, not a second stream processor.
- [ ] Add a native `TaskView` test for message display, empty state, error display, and read-only behavior.
- [ ] Add approval-renderer tests proving approve/deny returns the expected tool result and invokes completion once.
- [ ] Run the full RN test/type-check/build suite.

### Task 4: Sample-backed mobile story catalog

**Files:**
- Create: `samples/react-native-chat/stories/ToolsAndForms.stories.tsx`
- Create: `samples/react-native-chat/stories/TasksAndProgress.stories.tsx`
- Modify: `samples/react-native-chat/stories/Chat.stories.tsx`
- Modify: `samples/react-native-chat/README.md`
- Test: `samples/react-native-chat/tsconfig.json` (type-check only)

**Interfaces:**
- Stories use only public `@distri/react-native` exports plus a deterministic fixture agent.
- Cover Form Filler (`fill_field`, `fill_multiple_fields`, `get_form_values`, `clear_form`, `submit_form`), Approval/QA checkpoint, reconciliation-style multiple handlers, streamed rich content, and nested task progress.
- Keep sample stories independent from production agent credentials; local-cloud connection remains a separate smoke test.

- [ ] Build a deterministic event fixture that emits tool-call events, streamed assistant deltas, and tool results using the same event types the SDK consumes.
- [ ] Add stories for form mutation/read/submit, approval/deny and continuation, renderer override plus another built-in tool, and task/subtask progress.
- [ ] Add a story-level test or fixture assertion for each handler's resulting state; do not assert only that the story component mounted.
- [ ] Run `pnpm --filter @distri/react-native-chat-sample type-check` and confirm the Storybook config discovers every story.
- [ ] Run Android Storybook on `emulator-5554`, exercise each story and approval controls, and save screenshots in `samples/react-native-chat/screenshots/`.
- [ ] Attempt a sample connection to the already-running local Distri server from the emulator; record URL/reachability outcome and do not treat unavailable networking as a deterministic-test failure.

### Task 5: Repository-level verification and parity audit

**Files:**
- Modify: `packages/react-native/README.md`
- Modify: `samples/react-native-chat/README.md`
- Review: `packages/react/src/components/renderers/`, `packages/react/src/useTaskStreaming.ts`, and `../distri.dev/src/components/samples/configs/`

- [x] Document native equivalents and intentional web-only exclusions with runnable imports and prop examples.
- [x] Run `pnpm --filter @distri/react-native test`, `pnpm --filter @distri/react-native type-check`, `pnpm --filter @distri/react-native build`, and `pnpm --filter @distri/react-native-chat-sample type-check`.
- [x] Run relevant workspace `@distri/state` and `@distri/react` regression tests to verify shared transport/state behavior remains compatible.
- [x] Compare each acceptance criterion in the spec against test output, emulator screenshots, and the local-cloud smoke result; report any gap explicitly.
