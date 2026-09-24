# React Native SDK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a usable `@distri/react-native` integration for authenticated agent chat, streaming, tool events, and a native chat UI, validated against React parity cases and the local Distri server.

**Architecture:** Keep `@distri/react-native` separate from the browser-oriented `@distri/react`. Reuse `@distri/core` for API/agent behavior and `@distri/state` for `ChatController` plus the vanilla chat store; add only native React bindings and a small `View`/`TextInput`/`FlatList` chat surface. Add a configurable fetch transport seam to core only if RN's fetch/SSE support requires it, preserving browser defaults.

**Tech Stack:** TypeScript, React hooks, React Native primitives, `@distri/core`, `@distri/state`, Zustand, Vitest, and an Expo sample.

**Spec:** This plan is the scoped implementation spec: native package APIs are `DistriNativeProvider`, `useAgent`, `useChat`, `useChatStateStore`, `Chat`, and `ChatInput`; native callers own auth token acquisition/storage; sample credentials are never committed.

## Global Constraints

- Keep browser-only UI dependencies out of `@distri/react-native`.
- Reuse `ChatController` and `createChatStore` from `@distri/state` rather than duplicating chat behavior.
- Use React Native components, not DOM elements, for the native chat surface.
- Keep auth tokens in caller-provided secure storage; do not use AsyncStorage for secrets.
- Use `FlatList` for broad RN compatibility in phase 1; virtualization upgrades can be optional later.
- Never include real API keys or client secrets in the sample.

## Review Focus

- RN fetch without streaming `ReadableStream` support: provide an explicit transport path or fail with a clear compatibility message.
- Missing or expired access token: provider/hook errors must be actionable and must not leak token values.
- Thread/agent changes while streaming: match React cleanup/reset semantics.
- Tool events with no native renderer: retain structured tool state and do not crash.
- Empty messages, multiline input, and send while loading: native UI must preserve expected send/disable behavior.

---

### Task 1: Native core transport compatibility

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/distri-client.ts`
- Test: `packages/core/src/__tests__/react-native-transport.test.ts`

**Interfaces:**
- Add optional `fetchImpl` to `DistriClientConfig`, typed from the available Fetch API surface.
- Existing clients continue to use global `fetch`; native clients may inject a compatible implementation.

- [x] Add failing tests proving custom `fetchImpl` is used for ordinary requests and agent card/SSE requests.
- [x] Run the focused core test and confirm it fails on the missing injection behavior.
- [x] Implement the smallest transport seam while preserving current header, auth, and retry behavior.
- [x] Run focused tests, then core type-check and test suite.

### Task 2: `@distri/react-native` hooks and provider

**Files:**
- Create: `packages/react-native/package.json`
- Create: `packages/react-native/tsconfig.json`
- Create: `packages/react-native/tsup.config.ts`
- Create: `packages/react-native/src/index.ts`
- Create: `packages/react-native/src/DistriNativeProvider.tsx`
- Create: `packages/react-native/src/useAgent.ts`
- Create: `packages/react-native/src/useChat.ts`
- Create: `packages/react-native/src/chatStateStore.ts`
- Test: `packages/react-native/src/__tests__/useChat.test.tsx`

**Interfaces:**
- `DistriNativeProvider` provides a configured `DistriClient` and token callback.
- `useAgent({ agentId })` exposes the resolved `Agent`, loading/error state, and refresh.
- `useChat(options)` returns messages, loading/streaming/error state, `sendMessage`, `sendMessageStream`, `stopStreaming`, `addMessage`, and `compact`, matching `@distri/react` behavior.
- Native `createChatStore` omits React-element tool rendering while preserving tool data and execution.

- [x] Add parity tests for optimistic user messages, send options, initial messages, native composer send/stop behavior, and stale agent responses.
- [x] Run the focused tests and confirm expected API/behavior failures.
- [x] Implement provider, hooks, native-safe store adapter, and package exports.
- [x] Run package test/build/type-check.

### Task 3: Native chat UI and Expo sample

**Files:**
- Create: `packages/react-native/src/Chat.tsx`
- Create: `packages/react-native/src/ChatInput.tsx`
- Create: `packages/react-native/src/__tests__/Chat.test.tsx`
- Create: `samples/react-native-chat/package.json`
- Create: `samples/react-native-chat/app.json`
- Create: `samples/react-native-chat/App.tsx`
- Create: `samples/react-native-chat/README.md`
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`

**Interfaces:**
- `Chat` renders plain text messages and a composer using React Native primitives and accepts a message renderer override for app-specific cards.
- Sample reads only `EXPO_PUBLIC_DISTRI_BASE_URL`, `EXPO_PUBLIC_DISTRI_AGENT_ID`, and a user-provided short-lived token at runtime; no secret is checked in.

- [x] Add UI tests for send, busy/stop state, multiline text, and rendering messages.
- [x] Run the focused UI tests and confirm expected failures.
- [x] Implement the native UI and Expo sample.
- [x] Build/type-check the package, start the sample, and send a test message to the local service if a usable local agent/token is available.

### Task 4: Integration and delivery verification

**Files:**
- Modify: `README.md`
- Modify: root `AGENTS.md` or package guidance only if needed to document the new package.

- [x] Run core and native package test suites, package build, and relevant type-checks.
- [x] Confirm Expo sample startup; verify local server reachability and report any auth/agent prerequisites without exposing secrets.
- [x] Review the final diff and ensure existing untracked user files are unchanged.

**Verification notes:** core 96 tests, state 26 tests, native 7 tests; core/state/native/sample type-checks passed; core/state/native builds passed. Android debug build was installed and launched on the connected Android 17 emulator. The sample fetched `single_invoke_test` from the local cloud server and completed a native chat round-trip (`Reply exactly android-native-ok.` → `ok-99`). The app uses the emulator host bridge URL and requires a workspace ID for cloud agent lookup. Expo Go on this machine targets a newer SDK than the sample, so verification used the native debug build. Generated Expo and Android/iOS directories are ignored by the sample `.gitignore`.
