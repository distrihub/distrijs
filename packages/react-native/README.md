# @distri/react-native

React Native bindings for Distri. This package shares agent and chat behavior with `@distri/react` through `@distri/core` and `@distri/state`, but does not import browser UI, DOM APIs, Tailwind, or React DOM.

```tsx
import { fetch as expoFetch } from 'expo/fetch';
import { Chat, DistriNativeProvider, useAgent } from '@distri/react-native';

function AgentChat() {
  const { agent, loading, error } = useAgent({ agentIdOrDef: 'support' });
  if (loading) return <Text>Loading…</Text>;
  if (error || !agent) return <Text>{error?.message ?? 'Agent unavailable'}</Text>;
  return <Chat agent={agent} threadId="support-thread" />;
}

export function App() {
  return (
    <DistriNativeProvider config={{
      baseUrl: 'https://api.distri.dev/v1',
      accessToken: 'short-lived-user-token',
      fetchImpl: expoFetch,
    }}>
      <AgentChat />
    </DistriNativeProvider>
  );
}
```

The app owns authentication and secure persistence. Keep API keys and refresh tokens in a trusted server or platform secure storage, never in the JavaScript bundle or AsyncStorage. `accessToken` is held in the `DistriClient` instance; use `onTokenRefresh` for refresh coordination.

Streaming responses are required for agent chat. Inject a Fetch implementation that returns a readable response body (`body.getReader()`) and provides `TextDecoder`; Expo apps should use `expo/fetch`. Bare React Native apps should confirm their networking implementation supports streamed POST responses before enabling chat.

## Native parity surface

`Chat` uses a native `FlatList`, multiline composer, stop-streaming control, optimistic user messages, and incremental assistant text. Its default message renderer supports text, images (URL and base64), files, artifacts, data/resource parts, tool calls/results, handovers, errors, todo updates, context-budget/compaction events, and live-view links. Unsupported parts render a safe readable fallback. `rendering="rich"` adds tool input/result detail and action controls; the default `minimal` mode keeps tool summaries compact.

Client functions and native custom renderers use the same shared chat controller as `@distri/react`:

```tsx
const tools = [{
  name: 'update_profile',
  type: 'function' as const,
  autoExecute: true,
  description: 'Update a profile field',
  parameters: { type: 'object', properties: { field: { type: 'string' }, value: { type: 'string' } } },
  handler: async ({ field, value }: { field: string; value: string }) => {
    await saveProfileField(field, value);
    return { saved: true };
  },
}];

<Chat
  agent={agent}
  threadId={threadId}
  externalTools={tools}
  beforeSendMessage={async message => ({
    ...message,
    parts: [...message.parts, {
      part_type: 'text',
      data: `Current profile: ${JSON.stringify(profile)}`,
    }],
    metadata: {
      ...message.metadata,
      parts: { ...message.metadata?.parts, [message.parts.length]: { developer: true } },
    },
  })}
  toolRenderers={{
    update_profile: ({ toolCall, completeTool }) => (
      <ProfileUpdateCard call={toolCall} onComplete={completeTool} />
    ),
  }}
  rendering="rich"
/>
```

`beforeSendMessage` is useful for attaching current form/app context without showing it as user-authored text. A custom `toolRenderers` entry replaces only that tool's presentation; registered `externalTools` still execute through the shared store/controller. Non-auto tools show native approve/decline actions. Tools with `type: 'ui'` may provide a React Native component and receive `completeTool` for interactive completion.

Use `useChat` when you want controller/state access without the built-in layout, and `ChatMessageList` to reuse the standard renderer in a custom screen. `useTaskStreaming({ agent, taskId })` follows an existing task read-only; `TaskView` adds task messages, nested subtask transcripts, todo progress and context usage. `createChatStore` lets screens share a store explicitly. These are native adapters around `@distri/state`, not a second implementation of stream or tool-execution logic.

The package intentionally does not include browser-only iframe embedding for `live_view`, hover interactions, DOM-based form scraping, Tailwind styles, the web cassette/replay scrubber, or web feedback/read-tracking widgets. On native, live views open through `Linking`, app context is supplied explicitly with `beforeSendMessage`, and recorded UI mutations should be adapted to real native state/tools rather than replayed through the browser bridge. Apps may provide these product-specific experiences with `renderMessage`, `toolRenderers`, and native components.

See [`samples/react-native-chat`](../../samples/react-native-chat) for the runnable Expo and on-device Storybook catalogs, including client tools, approval, custom renderers, rich content, and nested task streams.

See [`samples/react-native-chat`](../../samples/react-native-chat) for a runnable Expo example targeting the local server.
