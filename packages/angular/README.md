# @distri/angular

Angular SDK for [Distri](https://distri.dev) agents — Signal-based services and a drop-in
chat component, built on `@distri/state`.

The Angular counterpart of `@distri/react`: same client, same agents, same streaming
protocol. Where React has `<DistriProvider>` and `useChat()`, Angular has `provideDistri()`
and `createChatService()` — and `<distri-chat>` if you just want a working chat panel.

```bash
npm install @distri/angular @distri/core @distri/state
```

Requires Angular ≥ 17 (Signals). `@angular/common`, `@angular/core`, `@angular/forms`,
`@distri/core` and `@distri/state` are peer dependencies.

## Quick start

Register the client once, in `bootstrapApplication`:

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideDistri } from '@distri/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    // Your server exchanges an API key for a short-lived token, so no
    // long-lived credential ever reaches the browser.
    provideDistri({ tokenEndpoint: '/api/distri/token' }),
  ],
};
```

Then drop in the chat. It picks the client up from DI — nothing to wire:

```ts
import { Component } from '@angular/core';
import { DistriChatComponent } from '@distri/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DistriChatComponent],
  template: `<distri-chat [agentIdOrDef]="agentId" [threadId]="threadId" />`,
})
export class AppComponent {
  agentId = 'assistant';
  threadId = crypto.randomUUID();
}
```

That's a working, streaming chat. Everything below is for when you want more control.

## Configuring the client

`provideDistri()` takes three shapes:

**A token endpoint** (recommended for browser apps). `@distri/angular` POSTs the endpoint,
feeds the token to the client, sends `X-Workspace-Id`, and re-mints the token when it
expires — so a long session doesn't die mid-stream:

```ts
provideDistri({ tokenEndpoint: '/api/distri/token' })
```

Your endpoint returns:

```json
{ "access_token": "…", "refresh_token": "…", "workspace_id": "…", "base_url": "…" }
```

`base_url` is optional — it defaults to same-origin `/v1`, the usual dev-proxy setup.

**A client config directly**, when you already hold a token:

```ts
provideDistri({
  baseUrl: 'https://api.distri.dev/v1',
  accessToken: '…',
  workspaceId: '…',
})
```

**An async factory**, when the config depends on something you must await first:

```ts
provideDistri(async () => ({ baseUrl: '…', accessToken: await getToken() }))
```

### Reading the client

`DISTRI_SERVICE` exposes the client and its loading state as Signals — the Angular
equivalent of React's `useDistri()`:

```ts
import { inject } from '@angular/core';
import { DISTRI_SERVICE } from '@distri/angular';

export class MyComponent {
  private readonly distri = inject(DISTRI_SERVICE);

  readonly client = this.distri.client;       // Signal<DistriClient | null>
  readonly isLoading = this.distri.isLoading; // true until the token resolves
  readonly error = this.distri.error;         // Signal<Error | null>

  switchWorkspace(id: string) {
    this.distri.setWorkspaceId(id);
  }
}
```

`client()` is `null` while the token is still being fetched. Guard on `isLoading()` rather
than assuming it's there on first render.

## `<distri-chat>`

| Input | Type | |
|---|---|---|
| `agentIdOrDef` | `string \| AgentDefinition` | **Required.** An agent id to fetch, or a definition you already hold. |
| `threadId` | `string` | **Required.** Conversation to attach to. Reuse it to resume; change it to start fresh. |
| `client` | `DistriClient` | Overrides the DI client. Rarely needed. |
| `externalTools` | `DistriBaseTool[]` | Frontend tools the agent can call (see below). |
| `beforeSendMessage` | `(m: DistriMessage) => Promise<DistriMessage>` | Rewrite the outgoing message — e.g. attach the current form state. |
| `starterPrompts` | `string[]` | Clickable example prompts shown while the chat is empty. |

`externalTools` is read once when the chat connects. Define it as a stable class field;
reassigning it alone won't reconnect the chat (changing `client`, `agentIdOrDef` or
`threadId` will).

## Frontend tools

Tools let the agent act on the page it's embedded in — fill a form, select a row, open a
panel. The agent calls them; your code executes them in the browser and returns a result:

```ts
import { DistriBaseTool } from '@distri/core';

readonly tools: DistriBaseTool[] = [
  {
    name: 'set_field',
    description: 'Set a field on the incident form',
    input_schema: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        value: { type: 'string' },
      },
      required: ['field', 'value'],
    },
    handler: async ({ field, value }) => {
      this.form.patchValue({ [field]: value });
      return { success: true };
    },
  },
];
```

Pair them with `beforeSendMessage` to give the agent the context it needs to call them
well — the current form HTML, the selected rows, whatever the agent is meant to reason
about:

```ts
beforeSendMessage = async (message: DistriMessage) => ({
  ...message,
  parts: [...message.parts, { type: 'text', text: `Current form:\n${this.formHtml()}` }],
});
```

## Building your own UI

`<distri-chat>` is one arrangement of the underlying services. When you want a different
one, use them directly — they're plain factory functions returning Signals, so they work
in a component field initializer, a `useFactory` provider, or anywhere else.

```ts
import { createAgentService, createChatService } from '@distri/angular';

const agents = createAgentService({ client, agentIdOrDef: 'assistant' });
// agents.agent()   -> Signal<Agent | null>
// agents.loading() -> Signal<boolean>
// agents.refresh({ agentIdOrDef: 'other' })

const chat = createChatService({ agent, threadId });
// chat.messages()    -> Signal<DistriChatMessage[]>
// chat.isStreaming() -> Signal<boolean>
// chat.toolCalls()   -> Signal<Map<string, ToolCallState>>
// chat.sendMessage('hello')
// chat.stopStreaming()
// chat.compact()
// chat.dispose()     <- call from ngOnDestroy to abort any in-flight stream
```

Always `dispose()` a chat service you created yourself — otherwise a stream outlives the
component that owns it. `<distri-chat>` does this for you.

The Signals are a thin adapter over `@distri/state`'s framework-agnostic store — the same
layer `@distri/react`'s `useChat` wraps. `chat.store` is that vanilla store, if you need
imperative access.

## Styling

The components render with Tailwind utility classes against CSS-variable design tokens
(`--background`, `--foreground`, `--muted-foreground`, …). **No stylesheet ships with the
package** — you supply the tokens, which is what lets the chat inherit your app's theme
instead of fighting it.

The fastest path is to copy the token block from `@distri/react`'s `theme.css` into your
global `styles.css`, and make sure Tailwind scans the package:

```js
// tailwind.config.js
content: [
  './src/**/*.{html,ts}',
  './node_modules/@distri/angular/**/*.mjs',
],
```

Add the `dark` class to any ancestor to flip the tokens to their dark values — you can
scope it to the chat panel alone if the rest of your app is light.

A complete, working setup — tokens, Tailwind config, tools, and a token endpoint — lives in
[`samples/form-filler-angular`](https://github.com/distrihub/distrijs/tree/main/samples/form-filler-angular).

## Not yet supported

Function tools auto-execute and confirm through data, exactly as in React. What Angular
doesn't have yet is **UI-type tool rendering** — tools that return a component to render
inline in the message stream (React's `renderTool`). `ToolCallState.component` is always
`undefined` here. Chat behavior is otherwise unaffected.

## License

MIT
