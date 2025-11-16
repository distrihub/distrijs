# distrifs-js

## TODO
- [ ] Add automated tests covering the IndexedDB adapter and store actions
- [ ] Expose granular subscriptions for file system events (create/update/delete)
- [ ] Ship optional Monaco-based editor integration as a separate entry point
- [ ] Document production data migration strategies for IndexedDB backups

## Overview
`distrifs-js` is an IndexedDB-backed filesystem layer for Distri agents. It packages:

- a persistence adapter that mirrors the Rust filesystem tools
- a Zustand-powered workspace store with single or multi-tab modes
- a ShadCN-styled workspace shell featuring dialog-driven creation, collapsible sidebar, and previews
- a helper for generating Distri tool definitions that stay in sync with the UI
- helpers for wiring chat interfaces, testing panels, and the script runner UI tool into the workspace shell

The package is designed for browser-hosted agent workspaces that need offline-aware file operations bound to a `projectId` namespace.

## Installation

The package is published as part of the workspace. Add it to your project via pnpm:

```bash
pnpm add distrifs-js
```

`@distri/core` and `@distri/react` are peer workspace dependencies and resolve automatically inside this monorepo.

## Quick start

```tsx
import {
  IndexedDbFilesystem,
  createFilesystemTools,
  FileWorkspace,
  ScriptRunnerTool,
  ScriptTestingPanel,
} from 'distrifs-js';
import { Chat } from '@distri/react';
import { Files, MessageSquare, FlaskConical, Home, Play } from 'lucide-react';

const projectId = 'demo';
const filesystem = IndexedDbFilesystem.forProject(projectId);
const tools = createFilesystemTools(projectId, { filesystem });
const extendedTools = [...tools, ScriptRunnerTool];

<FileWorkspace
  projectId={projectId}
  filesystem={filesystem}
  initialEntries={[{ path: 'README.md', type: 'file', content: '# Hello' }]}
  previewRenderer={({ content }) => <pre>{content}</pre>}
/>;

// With chat + auxiliary panels on each side
<FileWorkspace
  projectId={projectId}
  filesystem={filesystem}
  activityBarItems=[
    {
      id: 'home',
      label: 'Workspace',
      icon: Home,
      position: 'left',
      type: 'action',
      onSelect: () => navigate('/'),
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      position: 'right',
      mode: 'custom',
      content: (
        <Chat
          agent={agent}
          threadId="workspace-thread"
          externalTools={extendedTools}
        />
      ),
    },
  ]
  panels=[
    {
      id: 'notes',
      label: 'Workspace notes',
      position: 'left',
      icon: Files,
      content: <p className="text-xs text-muted-foreground">Add instructions or summaries on the left.</p>,
    },
    {
      id: 'chat-panel',
      label: 'Chat',
      position: 'right',
      allowCollapse: false,
      icon: MessageSquare,
      content: (
        <Chat
          agent={agent}
          threadId="workspace-thread"
          externalTools={extendedTools}
        />
      ),
    },
    {
      id: 'testing',
      label: 'Script testing',
      position: 'right',
      defaultCollapsed: true,
      icon: FlaskConical,
      content: (
        <ScriptTestingPanel
          onRun={async (payload) => doSomething(payload)}
        />
      ),
    },
  ]
  fileActionItems=[
    {
      id: 'run-script',
      label: 'Run script',
      icon: Play,
      isVisible: ({ tab }) => tab.path.endsWith('.ts'),
      onSelect: ({ tab }) => runScript(tab.path),
    },
  ]
  fileActionRenderers=[
    {
      id: 'ts-testing',
      label: 'Script testing',
      match: ({ tab }) => tab.path.endsWith('.ts'),
      render: ({ tab }) => (
        <ScriptTestingPanel key={tab.path} onRun={async () => doSomething(tab.path)} />
      ),
    },
  ]
  defaultActivityId="explorer"
/>;
```

## API surface

### `IndexedDbFilesystem`
- `forProject(projectId)` returns a singleton per namespace
- Implements read, write, move, tree, search, diff, and artifact helpers backed by browser IndexedDB with an in-memory fallback

### `createFileWorkspaceStore(projectId, options)`
- Returns a Zustand store that manages file tabs, saves, and directory state
- Accepts optional `filesystem` and `saveHandler` overrides
- Exposes `handleExternalChange` to sync with agent-driven tool calls

### `FileWorkspace`
- React component that renders a tree + tabbed editor UI
- Props include `projectId`, `initialEntries`, `previewRenderer`, `onSaveFile`, `filesystem`, and `selectionMode` (`'single' | 'multiple'`)
- Save button dispatches the store’s save handler (mocked with a resolved promise by default)
- Uses ShadCN primitives for dialogs, buttons, and sidebar interactions
- `activityBarItems` can place icons on the left or right rails, open workspace panels via `panelId`, or fire callbacks (handy for navigation buttons); the `panels` prop still lets you dock arbitrary sections on either side with shared collapse/resize behavior
- `fileActionItems` adds buttons to the right-side FileActionBar, and `fileActionRenderers` register contextual components (test runners, previews, etc.) that render based on the active tab

### `createFilesystemTools(projectId, options)`
- Generates Distri function tools for every filesystem and artifact operation in the Rust reference implementation
- Tools share the same filesystem instance used by the workspace so UI edits and agent tool calls remain consistent
- Accepts `onChange` callback to react to external write/delete/move events

### `ScriptTestingPanel`
- Standalone React component for JSON (or TOML) payload authoring + execution status
- Pair it with `FileWorkspace` panels to give agents a built-in “run payload” drawer without wiring your own editor every time

### `ScriptRunnerTool`
- `DistriUiTool` that surfaces an embeddable script editor with fullscreen mode and run button
- Emits `distri_execute_code` tool payloads when executed, enabling inline testing workflows

## Sample application

See [`distrijs/samples/file-tools-demo`](../distrijs/samples/file-tools-demo) for a Vite app that wires the toolkit into a standalone playground.

## Persistence notes
- IndexedDB names are derived from `distri-fs-<projectId>`
- Artifacts are stored alongside files under an internal `__artifact__/` prefix
- Environments without IndexedDB (SSR or native) fall back to an in-memory adapter

## Contributing
1. Update or extend the Zustand store
2. Export new helpers from `src/index.ts`
3. Run `pnpm --filter distrifs-js build`
4. Validate manually with the sample app until automated coverage lands
