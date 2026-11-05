# Changelog

## 0.5.0

Packages: `@distri/core`, `@distri/state`, `@distri/react`, `@distri/react-native` (0.4.7 → 0.5.0; `@distri/react` skips 0.4.7, it was 0.5.0 already on main). npm has 0.4.6 for core, state and react, and 0.1.0 for react-native.

### @distri/react
- Assistant: scoped, themable embed chat with a slot API, `useTranscript` and one answer per turn (#81, #85).
- Grouped tool calls (`groupToolCalls`), `ToolSteps` slot and the live line (#85).
- `showToolWaitStatus` prop, `clientId` apps name their embed host and origin, a `Chat` with no `threadId` starts its own conversation, composer placeholder and optional context dial.

### @distri/core
- Typed decisions: `DistriClient.decide` and the System One types (#82).
- Namespaced client tool registry and `registerBrowserTools`.
- One `uuid()` helper that works on plain-http origins.
- The encoder routes sub-agent frames by task and reports tool results by call (#84).

### @distri/state
- Reported tools run until their result; sub-agents nest under the call that started them, and one child's error no longer fails the root (#84).

### @distri/react-native
- Chat SDK and sample (#79), `SubTaskCard` nesting under the calling tool (#84).
