# Distri React Native Chat sample

This Expo sample exercises `@distri/react-native` with the local Distri API.

```sh
cd distrijs
pnpm install
pnpm --filter @distri/react-native build
pnpm --filter @distri/react-native-chat-sample start
```

Enter a user short-lived access token in the app. The token is held only in React state; the sample does not persist it. Do not put API keys, client secrets, or access tokens in `EXPO_PUBLIC_*` variables. `EXPO_PUBLIC_DISTRI_BASE_URL`, `EXPO_PUBLIC_DISTRI_AGENT_ID`, and `EXPO_PUBLIC_DISTRI_WORKSPACE_ID` are non-secret convenience defaults. The workspace ID is required by this Cloud sample and is sent as `X-Workspace-Id`.

For the local server on port `1341`, Android emulator defaults to `http://10.0.2.2:1341/v1`; use `http://localhost:1341/v1` in an iOS simulator. A physical device needs the Mac's LAN IP and firewall access. The sample uses `expo/fetch` because it supports streamed responses; the native SDK relies on Fetch-compatible response streams for A2A chat.

## Native component catalog

This sample includes an on-device Storybook for inspecting the native package without a server or access token. Stories use a deterministic mock agent, so the streaming and error examples work offline.

```sh
pnpm --filter @distri/react-native-chat-sample storybook
pnpm --filter @distri/react-native-chat-sample storybook:android
```

The regular `start` / `android` commands still launch the local-cloud chat sample; Storybook only replaces the app entry when `EXPO_PUBLIC_STORYBOOK_ENABLED=true` is set (the Storybook scripts set it for you).

The on-device catalog uses deterministic fixtures and covers:

- `ChatInput`: ready, disabled, and generating/stop states. Type in the ready composer to inspect a draft or multiline input.
- `Chat`: empty, seeded conversation, incremental text streaming, connection error, custom app message renderer, and rich content.
- `Sample workflows / Form filler`: six form tools (single/multiple field fill, read, dropdown options, clear, submit) update visible local state through `externalTools`; `beforeSendMessage` attaches current form state as hidden developer context.
- `Sample workflows / Approval`: a destructive action waits for Run or Decline and continues the fixture stream with the tool result.
- `Sample workflows / Reconciliation`: independent ledger lookup and match handlers, with a custom native renderer overriding only the lookup call.
- `Sample workflows / Rich content` and `Runtime events`: native text/data/artifact content, live-view deep links, todos, and context-compaction summaries.
- `Task following / Multi-agent research`: native read-only task streaming, a nested child task, todos, context usage and streamed task messages.

These are working sample integrations, not static mockups. The fixtures are offline and deterministic; they don't need credentials. For the real local-cloud chat, use the regular sample app and the URL/token settings above.

The package's other exports (`DistriNativeProvider`, `useAgent`, `useChat`, and `createChatStore`) are integration APIs rather than visual components. `Chat` stories exercise `useChat`; the regular sample demonstrates the provider and `useAgent` against Distri Cloud. Native `ChatMessageList`, `TaskView`, tool renderers and the task progress components are also shown in the workflow stories.

Run the component behavior tests and sample type-check with:

```sh
pnpm --filter @distri/react-native test
pnpm --filter @distri/react-native lint
pnpm --filter @distri/react-native-chat-sample type-check
```
