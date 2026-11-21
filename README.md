# distrijs

[![npm](https://img.shields.io/npm/v/@distri/react?label=%40distri%2Freact&color=3b82f6)](https://www.npmjs.com/package/@distri/react)

The client SDKs for [Distri](https://github.com/distrihub/distri): embed AI agents in your product. Put a chat UI in your web or mobile app and let the agent call your app's own functions, in the signed-in user's session.

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

## Use it

```bash
npm i @distri/react @distri/core
```

```tsx
import { DistriProvider, Chat } from '@distri/react';
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

export const App = ({ threadId }: { threadId: string }) => ( // one id per conversation
  <DistriProvider config={{ baseUrl: 'https://api.distri.dev/v1', clientId: 'dpc_…', workspaceId: '…' }}>
    <Chat agentId="shop_agent" threadId={threadId} externalTools={[addToCart]} />
  </DistriProvider>
);
```

The agent lists `add_to_cart` under `[tools] external` in its markdown file. When it calls the tool, the handler runs in the page and the cart changes the way it does for a click. This snippet typechecks against `@distri/react` and `@distri/core` from npm (`tsc --strict`). `baseUrl` can be a self-hosted `distri-server` (`http://127.0.0.1:8081/v1`) instead of Distri Cloud.

Without a bundler, one script tag loads the hosted embed: `<script src="https://embed.distri.dev/v1/embed.js"></script>`; Distri Cloud's Integrate page prints the full snippet for an agent.

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
