# React Native Distri React Parity — Design

## Goal

Make `@distri/react-native` a real mobile integration for the Distri React patterns used by the sample gallery, and demonstrate the supported flows in the Android Storybook app.

## User-facing scope

The package should support the sample-critical patterns using native components and the existing shared `@distri/state` chat controller:

- Streamed user/assistant messages and native rendering of the common Distri message parts used by samples (text, images, tool calls/results, status/thinking, todos, and task activity).
- Client-side function tools through `externalTools`, including multiple handlers, tool completion/resume, errors, and an app-customizable native renderer for interactive tools such as approval/checkpoint cards.
- Form/app integration through `beforeSendMessage`, plus a documented custom message-renderer escape hatch.
- Read-only task following and visible nested/subtask or workflow progress where those events are produced by the shared state layer.
- A native Storybook catalog with deterministic streamed fixtures modeled on Distri.dev Form Filler, Approval Gate/QA Checkpoint, reconciliation, and multi-agent/task samples. The stories must invoke actual package APIs and handlers, not simulate success solely with static cards.

The package keeps React Native primitives and has no DOM/CSS dependency. Existing public props and the shared controller remain compatible. Web-only presentation (browser panes, hover UI, web layout) is not ported. Cassette replay tooling is not part of the production SDK parity surface; deterministic fixtures may be used by Storybook to drive the real native chat pipeline.

## Architecture

1. Keep transport, message state, external-tool execution, and resume behavior in `@distri/state` / `@distri/core`; do not fork that logic for native.
2. Add a focused native rendering layer that maps Distri messages/events and tool state to React Native views. Expose tool-renderer overrides and preserve `renderMessage` as the highest-level escape hatch.
3. Add native task-following/progress UI only by consuming existing shared task streaming/store APIs. If an expected task event or state shape is absent, first identify the missing shared contract and extend it with a regression test rather than fabricating native-only state.
4. Build sample stories as vertical slices over the exported package surface. Keep mock agents deterministic for renderer and interaction coverage, then validate one live connection against the configured local Distri server if it is reachable from the Android emulator.

## Phases

1. **Parity inventory and contracts:** compare React exports/renderers and the sample gallery against RN; add failing tests for the highest-frequency gaps and settle native API names/types.
2. **Message and tool rendering:** implement native rich/minimal message parts, extensible tool renderers, client-tool pending/running/completed/error states, and interactive approval completion/resume.
3. **Task/progress integration:** expose read-only task streaming/view and native subtask/workflow/todo/context progress from shared state, bounded to sample-backed scenarios.
4. **Story catalog:** add form-fill, approval/checkpoint, reconciliation/client-function, and multi-agent/task stories with deterministic stream fixtures and interactive controls.
5. **Verification:** package tests/type-check/build, Storybook/sample checks, Android emulator interaction and screenshots, and local-cloud smoke test when connectivity/config permits.

## Acceptance criteria

- Client function handlers registered through the public native API execute when their streamed tool calls arrive; results resume the same agent turn, and success/failure are visible.
- Native renderer overrides can replace a built-in tool renderer without disabling unrelated tool execution.
- Streamed common message parts and task/progress states render incrementally and remain usable on Android.
- The Storybook stories are runnable on the emulator and cover the sample-critical flows above with screenshots and repeatable tests.
- Existing RN package tests and public APIs remain green; no web/DOM renderer dependency is introduced into the native package.

## Risks / decisions to validate during implementation

- Whether the current core stream event contract supplies enough information for tool-call UI and task trees; any gap must be fixed at the shared contract layer with tests.
- Which `@distri/react` renderers are genuinely exercised by Distri.dev samples versus optional product-specific UI; only the former are required for this parity milestone.
- Local Android emulator reachability to the running cloud server may differ from host reachability; report separately from deterministic Storybook verification.
