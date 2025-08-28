# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- Follow shadcn design tokens: `bg-muted`, `text-foreground`, `border-muted-foreground`, etc.
- Use semantic color variables for consistency across themes
- Prefer standard component patterns from shadcn documentation

**Custom Styling Rules:**
- Only add custom styling when extending existing shadcn components
- Custom elements should use shadcn color tokens (e.g., `text-muted-foreground` not `text-blue-500`)
- Maintain design consistency with existing shadcn theme system
- Avoid hardcoded colors - use CSS variables and design tokens

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

**Error Handling:**
All operations use typed error classes: `DistriError`, `ApiError`, `ConnectionError`, `A2AProtocolError`.