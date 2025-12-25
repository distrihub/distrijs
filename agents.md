# Agent Development Guide

This file provides guidance to AI coding agents (Claude Code, GPT-based, etc.) when working with this repository.

## Monorepo Context

- The `distrijs/` directory now lives inside the main `distri` repository, which
  also includes the Rust backend crates (`distri-server`, `distri-stores`, etc.).
- Frontend and TypeScript work happens entirely inside this folder; backend API
  changes should be coordinated with `../distri-server/src/routes.rs`.
- Agents contributing here should also read `../Agents.md` for the high-level
  repository map and pointers to key personas (`agents/distri.md`,
  `agents/scripter.md`).

When you need to exercise the full stack locally, run the Rust backend from the
repo root (`cargo run -p distri-server`) and start the UI via Turborepo commands
documented below.

## Development Commands

This is a TypeScript monorepo using Turbo and PNPM workspaces.

**Build Commands:**
- `pnpm build` - Build all packages in workspace
- `pnpm build:all` - Build everything including samples
- `pnpm build:prepare` - Full build with file copying for distribution

**Development:**
- `pnpm dev` - Start development mode for all packages
- `pnpm dev:demo` - Run core, react packages + full-demo sample
- `pnpm dev:maps` - Run core, react packages + maps-demo sample

**Quality Assurance:**
- `pnpm lint` - Lint all packages
- `pnpm type-check` - TypeScript type checking across workspace
- `pnpm clean` - Clean all build artifacts

**Single Package Linting:**
Navigate to specific package directory for focused linting:
- `cd packages/react && pnpm lint` - Lint only react package
- `cd packages/core && pnpm lint` - Lint only core package
- `cd packages/components && pnpm lint` - Lint only components package

**Single Package Development:**
Navigate to specific package directory and use local scripts:
- `cd packages/core && pnpm build`
- `cd packages/react && pnpm dev` (watch mode)

## Architecture Overview

DistriJS is an AI agent framework with a 3-layer architecture:

1. **@distri/core** - Core agent client and A2A protocol integration
2. **@distri/react** - React hooks, components, and UI integration
3. **@distri/components** - Shared UI components (shadcn/ui based)

### Key Architectural Concepts

**Agent-Centric Design:** Everything revolves around Agent instances created via `Agent.create()`. Agents handle:
- A2A protocol communication with Distri backend
- Tool registration and execution
- Message streaming and state management

**Tool System (v0.2.x):** Follows AG-UI pattern with automatic execution:
- Tools register directly on agents via `agent.addTool()` or `useTools` hook
- Tools execute immediately when called by AI (no manual handling)
- Type-safe tool definitions using `createTool()` helper

**Streaming Architecture:** Built on Server-Sent Events (SSE) with typed event system:
- `DistriMessage` - Chat messages with role/parts structure
- `DistriEvent` - System events (connection, errors, tool calls, tool results)
- `DistriArtifact` - Rich content (plans, artifacts)

### Package Structure

```
packages/
├── core/          # Agent client, A2A integration, streaming
│   ├── agent.ts         # Main Agent class
│   ├── distri-client.ts # HTTP client for Distri API
│   ├── stream.ts        # SSE handling
│   └── types.ts         # Core type definitions
├── react/         # React integration layer
│   ├── useAgent.ts      # Agent management hook
│   ├── useChat.ts       # Chat UI hook
│   ├── components/      # Pre-built chat components
│   └── hooks/           # Tool registration utilities
└── components/    # Shared UI components (shadcn/ui)
```

## Tool Development Patterns

**Creating Tools:**
```typescript
import { createTool } from '@distri/react';

const myTool = createTool(
  'tool_name',
  'Description for AI',
  { /* JSON Schema */ },
  async (input) => { /* handler */ }
);
```

**Built-in Tools Available:**
- `confirm` - User confirmation dialogs
- `input` - Text input from user
- `notify` - Toast notifications
- `approval_request` - Workflow approvals

**Tool Registration:**
Use `useTools` hook with agent instance - tools auto-execute when called by AI.

## Message Processing

The framework processes three main event types from SSE streams:

1. **DistriMessage** - Standard chat messages (user/assistant)
2. **DistriEvent** - System events including:
   - Connection status (run_started, run_finished)  
   - Planning events (plan_started, plan_finished)
   - **Tool calls** (`tool_calls` event with array of tool call data)
   - **Tool results** (`tool_results` event with array of result data)
   - Text streaming (text_message_start, text_message_content, text_message_end)
3. **DistriArtifact** - Rich content like plans and structured data

**Event-Based Tool Processing:**
- Tool calls arrive as `tool_calls` events with immediate processing
- Tool results arrive as `tool_results` events updating existing tool states
- No longer embedded in `llm_response` artifacts for cleaner separation

**Message Parts System:**
Messages contain typed parts: `text`, `tool_call`, `tool_result`, `image_url`, `data`, etc.

## Styling and UI

- Built on **Tailwind CSS** with **shadcn/ui** components
- **Radix UI** primitives for accessibility
- **Zustand** for React state management
- **react-markdown** for message rendering
- **Lucide React** for icons

## Testing and Samples

**Sample Applications:**
- `samples/full-demo/` - Complete tool system demonstration
- `samples/maps-demo/` - Google Maps integration example

**Key Testing Files:**
- `test_artifacts.js` - Message processing test utilities
- `packages/react/src/utils/testMessageProcessing.ts` - Message parsing tests
- `test-plan-formatting.js` - Standalone plan structure validation (run with `node test-plan-formatting.js`)
- `test-event-processing.js` - New event-based tool call testing (run with `node test-event-processing.js`)
- `packages/react/src/utils/testPlanFormatting.ts` - React-compatible plan formatting test utilities

**Plan Structure Testing:**
The `test-plan-formatting.js` file contains comprehensive tests for the new plan structure with action steps. It validates:
- Plan conversion from A2A artifacts
- Action steps with `tool_name` and `input` fields  
- Tool call extraction from action steps
- All step types (thought, action, code, final_result)
- JSON input parsing and validation

**Event Processing Testing:**
The `test-event-processing.js` file validates the new event-based architecture:
- Direct `tool_calls` event processing
- Direct `tool_results` event processing  
- Event structure validation
- Tool state management through events

## Design System and UI Guidelines

**Component Standards:**
- **ALWAYS use shadcn/ui components and colors** - Do not introduce custom colors or styling

## Skill Designer Workflow

- The `apps/distri-ui` project includes a **Skill Designer** route that embeds
  the `@distri/fs` workspace for authoring skill bundles (scripts + docs).
- Use `distrijs/samples/file-tools-demo` as the reference implementation when
  adding filesystem features or workspace behaviours.
- Skill persistence flows through the backend `POST /v1/skills` endpoints
  defined in `../distri-server/src/routes.rs`.
- Coordinate with the `agents/scripter.md` persona when the UI needs
  automation or default script scaffolding for new skills.
- Follow shadcn design tokens: `bg-muted`, `text-foreground`, `border-muted-foreground`, etc.
- Use semantic color variables for consistency across themes
- Prefer standard component patterns from shadcn documentation

**Custom Styling Rules:**
- Only add custom styling when extending existing shadcn components
- Custom elements should use shadcn color tokens (e.g., `text-muted-foreground` not `text-blue-500`)
- Maintain design consistency with existing shadcn theme system
- Avoid hardcoded colors - use CSS variables and design tokens

**Mobile-First Responsive Design:**
- **ALWAYS use responsive sizing classes**: `text-xs sm:text-sm`, `p-2 sm:p-4`, `h-3 w-3 sm:h-4 sm:w-4`
- **Consistent Header styling**: Use responsive text sizes for headers - `text-sm sm:text-base lg:text-lg`
- **Icon scaling**: Icons should scale responsively - `h-3 w-3 sm:h-4 sm:w-4` for small icons, `h-6 w-6 sm:h-8 sm:w-8` for large
- **Spacing optimization**: Use smaller spacing on mobile - `space-y-1 sm:space-y-2`, `gap-3 sm:gap-4 lg:gap-6`
- **Grid responsiveness**: Start with single column, expand on larger screens - `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Content padding**: Reduce padding on small screens - `p-2 sm:p-4 lg:p-6`
- **Button sizing**: Use `size="sm"` for mobile-friendly buttons with responsive text - `text-xs sm:text-sm`
- **Form elements**: Apply responsive classes to inputs, textareas, selects - `text-xs sm:text-sm`
- **Card layouts**: Reduce header and content padding for compact design - `p-3 sm:p-4 lg:p-6`, `pb-2 sm:pb-3`, `pt-0`
- **Badge visibility**: Hide secondary badges on mobile - `hidden sm:inline-flex` for less important badges
- **Sidebar behavior**: Use `isEmbedded` (not `isMobile`) for auto-close functionality in embedded contexts

**Message Rendering:**
- `<thought>` tags styled with muted colors and left border
- Code blocks use syntax highlighting with appropriate themes
- All text rendering follows shadcn typography scale

## Dependencies and Integration

**Core Dependencies:**
- `@a2a-js/sdk` - A2A protocol implementation (external Git dependency)
- Custom Distri backend integration via REST + SSE

**Development Stack:**
- **TypeScript 5+** with strict type checking
- **Turbo** for monorepo build orchestration
- **tsup** for package bundling
- **ESLint** for code linting

## Header Component Usage

**Consistent Header Styling:**
```typescript
// Standard Header pattern with responsive title and Back button
<Header
  title="Page Title"           // Keep titles concise for mobile
  subtitle="Brief description"  // Optional, shortened on mobile
  rightElement={<Back />}       // Consistent Back button usage
/>
```

**Header Guidelines:**
- Titles should be 2-3 words maximum for mobile compatibility
- Subtitles should provide context but be brief enough for small screens
- Use `<Back />` component consistently for navigation
- Right element should be minimal (single button or small button group)

**Card Component Styling:**
- Use compact padding: `p-3 sm:p-4 lg:p-6` for main content
- Header padding: `p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3` with reduced bottom padding
- Content with header: `pt-0` to remove top padding and create seamless flow
- Responsive spacing between elements: `space-y-3 sm:space-y-4`

## Common Development Patterns

**Agent Initialization:**
```typescript
const { agent } = useAgent({ agentIdOrDef: 'agent-id' });
```

**Chat Integration:**
```typescript
const { messages, sendMessage } = useChat({ 
  agent, 
  threadId: 'conversation-id' 
});
```

Empty-state UX can be customized either by supplying structured data to the built-in renderer or by providing a full React override.

Use the `emptyState` prop to populate the minimal default layout with your own copy and optional conversation starters:

```tsx
<Chat
  threadId="..."
  agent={agent}
  emptyState={{
    eyebrow: 'Quick start',
    title: 'Build an enrichment',
    categories: [{
      id: 'ideas',
      title: 'Idea starters',
      starters: [{ label: 'Suggest a workflow for refreshing company firmographics' }],
    }],
  }}
/>
```

For complete control, continue to use the `renderEmptyState` prop:

```tsx
<Chat
  threadId="..."
  agent={agent}
  renderEmptyState={({ input, setInput, submit, isLoading }) => (
    <MyEmptyState
      value={input}
      disabled={isLoading}
      onChange={setInput}
      onSubmit={submit}
    />
  )}
/>
```

`renderEmptyState` runs only when the thread has no messages and no errors. The callback receives a controller with:
- `input` – current composer value
- `setInput(next: string)` – updates the composer
- `submit(content?: string | DistriPart[])` – sends either the provided content or the current input
- `isLoading` / `isStreaming` – flags for disabling UI
- `composer` – preconfigured `<ChatInput>` you can mount inside the empty state if you want the hero-style composer instead of the footer version

If neither prop is provided the default empty state renders a bare hero composer with no opinionated copy. The override you pass to `renderEmptyState` always wins over `emptyState`.

**Error Handling:**
All operations use typed error classes: `DistriError`, `ApiError`, `ConnectionError`, `A2AProtocolError`.
