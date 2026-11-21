# distrijs

[![npm](https://img.shields.io/npm/v/@distri/react?label=%40distri%2Freact&color=3b82f6)](https://www.npmjs.com/package/@distri/react)

The client SDKs for [Distri](https://github.com/distrihub/distri): AI Agents that live natively in your product. Put a chat UI in your web or mobile app and let the agent call your app's own functions, in the signed-in user's session.

The agent server, the CLI and the [samples gallery](https://distri.dev/samples/) live in [distrihub/distri](https://github.com/distrihub/distri).

## Packages

| Package | What it is |
|---|---|
| [`@distri/core`](packages/core) | A2A client for Distri agents: streaming, tasks, client-side tools, durable runs |
| [`@distri/state`](packages/state) | Framework-agnostic state for chat, tasks and workflows, used by the React, React Native and Angular packages |
| [`@distri/react`](packages/react) | `DistriProvider`, `<Chat>`, `useChat` and the tool hooks for React |
| [`@distri/react-native`](packages/react-native) | Hooks and chat UI for React Native and Expo |
| [`@distri/angular`](packages/angular) | Signal-based services and chat components for Angular |
| [`@distri/components`](packages/components) | Tailwind and shadcn primitives the chat UIs are built from |
| [`@distri/fs`](packages/fs) | IndexedDB filesystem tools and workspace components |

## Use it in React

```bash
npm i @distri/react @distri/core
```

Three pieces: a token for the browser, the provider, and the chat with your tools.

**1. A short-lived token, from your server.** Your server exchanges its `DISTRI_API_KEY` for a token the browser can hold; the key never reaches the page:

```ts
const r = await fetch('https://api.distri.dev/v1/token', {
  method: 'POST',
  headers: { 'x-api-key': process.env.DISTRI_API_KEY!, 'content-type': 'application/json' },
  body: JSON.stringify({ ttl: 3600 }),
});
const { access_token } = await r.json();
```

On Distri Cloud a public client id (`dpc_…`, from the Integrate page or `distri apply` on a blueprint with `[embed]`) can take the token's place: pass `clientId` instead of `accessToken`, and `DistriProvider` gets the token from the embed host.

**2. The provider and the styles.**

```tsx
import { DistriProvider, Chat } from '@distri/react';
import '@distri/react/globals.css';

<DistriProvider config={{ baseUrl: 'https://api.distri.dev/v1', accessToken, workspaceId, authReady: true }}>
  …
</DistriProvider>
```

**3. The chat, and the functions the agent may call in the page.**

```tsx
import type { DistriFnTool } from '@distri/core';

const addToCart: DistriFnTool = {
  name: 'add_to_cart',
  description: 'Add a product to the cart',
  type: 'function',
  parameters: { type: 'object', properties: { sku: { type: 'string' } }, required: ['sku'] },
  autoExecute: true,
  handler: async ({ sku }) => {
    await cart.add(sku); // your code, in the user's browser
    return { ok: true, items: cart.count };
  },
};

<Chat agentId="shop_agent" threadId={threadId} externalTools={[addToCart]} />
```

The agent lists `add_to_cart` under `[tools] external` in its markdown file. When it calls the tool, the handler runs in the page and the cart changes the way it does for a click. With `autoExecute: true` the tool runs without asking; leave it off for tools that change data, and the user confirms each call. `baseUrl` can be a self-hosted `distri-server` (`http://127.0.0.1:8081/v1`) instead of Distri Cloud.

A complete app with all three pieces, tested end to end in Chromium: [distri `samples/docs-agent`](https://github.com/distrihub/distri/tree/main/samples/docs-agent) (a React docs portal whose agent searches and opens its pages).

Without a bundler, one script tag loads the hosted embed: `<script src="https://embed.distri.dev/v1/embed.js"></script>`; Distri Cloud's Integrate page prints the full snippet for an agent.

## Use it in React Native

```bash
npm i @distri/react-native @distri/core
```

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
    <DistriNativeProvider config={{ baseUrl: 'https://api.distri.dev/v1', accessToken, fetchImpl: expoFetch }}>
      <AgentChat />
    </DistriNativeProvider>
  );
}
```

Chat streams, so the fetch must return a readable body: Expo apps pass `expo/fetch`. Tools, theming, images and threads: [`packages/react-native`](packages/react-native).

## Upgrading from 0.4

- 0.5 speaks A2A 1.0: it reads the agent card from `/.well-known/agent-card.json`, so it needs a server that serves it (Distri Cloud, or a `distri-server` built from distri `main` since distri#187, 2026-11-21).
- 0.4.x clients keep working against those servers: the server still serves the older card on `/.well-known/agent.json` with the fields 0.4.x reads (distri#190, distri-cloud#284).
- `uuidv4` is deprecated: use `uuid` (same function). It is removed in 0.6.

## Samples

Each runs against a Distri backend; its README says which agent to register.

| Sample | What the agent does |
|---|---|
| [form-filler](samples/form-filler) ([Angular](samples/form-filler-angular)) | Fills a security-incident report from a conversation |
| [data-reconciliation](samples/data-reconciliation) ([Angular](samples/data-reconciliation-angular)) | Matches internal records against a bank statement and flags discrepancies |
| [lesson-planner](samples/lesson-planner) | Reads a scheme of work and generates a lesson |
| [maps-demo](samples/maps-demo) | Drives a Google Map |
| [react-native-chat](samples/react-native-chat) | Expo chat app on `@distri/react-native` |

## Develop

```bash
git clone https://github.com/distrihub/distrijs && cd distrijs
pnpm install
pnpm build          # builds packages/*
```

```
 Tasks:    7 successful, 7 total
Cached:    0 cached, 7 total
  Time:    17.549s
```

Guides: [task streaming](docs/task-streaming.md) (`useTaskStreaming`, `<TaskView>`), [A2A client migration](docs/a2a-client-migration.md). Changes: [CHANGELOG.md](CHANGELOG.md).
