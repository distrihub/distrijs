# @distri/react

React components and hooks for building chat applications with DistriJS.

## Installation

```bash
npm install @distri/react @distri/core
```

## Basic Usage

```tsx
import React from 'react';
import { DistriProvider, EmbeddableChat, useAgent } from '@distri/react';

function App() {
  const { agent } = useAgent({ agentId: 'assistant' });

  return (
    <DistriProvider config={{ baseUrl: 'http://localhost:8080/api/v1' }}>
      <EmbeddableChat 
        agent={agent}
        placeholder="Ask me anything..."
      />
    </DistriProvider>
  );
}
```

## Using Built-in Tools

DistriJS provides built-in tools that render as React components within chat messages:

```tsx
import React, { useEffect } from 'react';
import { 
  DistriProvider, 
  EmbeddableChat, 
  useAgent,
  createBuiltinTools
} from '@distri/react';

function App() {
  const { agent } = useAgent({ agentId: 'assistant' });

  useEffect(() => {
    if (agent) {
      // Register all built-in tools
      const builtinTools = createBuiltinTools();
      builtinTools.forEach(tool => agent.registerTool(tool));
    }
  }, [agent]);

  return (
    <DistriProvider config={{ baseUrl: 'http://localhost:8080/api/v1' }}>
      <EmbeddableChat 
        agent={agent}
        placeholder="Ask me anything..."
      />
    </DistriProvider>
  );
}
```

## Available Built-in Tools

### Approval Tool
Shows an interactive approval dialog within the chat:

```tsx
import { createApprovalTool } from '@distri/react';

const approvalTool = createApprovalTool();
agent.registerTool(approvalTool);
```

When called by the agent, it renders an interactive component with "Approve" and "Deny" buttons right in the chat.

### Toast Tool  
Shows toast notifications and displays confirmation in chat:

```tsx
import { createToastTool } from '@distri/react';

const toastTool = createToastTool();
agent.registerTool(toastTool);
```

When called, it shows a toast notification and displays the confirmation in the chat message.

## How Built-in Tools Work

1. **Register the tool** with your agent like any other tool
2. **Agent calls the tool** during conversation
3. **React component renders** in the chat message showing the tool's UI
4. **User interacts** with the component (approve/deny, etc.)
5. **Tool completes** and returns result to the agent
6. **Conversation continues** with the agent having the tool result

## Tool Call State Management

- Each tool call maintains its state (`pending`, `running`, `completed`, `error`)
- Tool calls can be **retriggered** or **cancelled** 
- Custom components receive `onComplete` callback to finish the tool call
- State is automatically managed by the `useChat` hook

## Custom Tools

You can create your own tools with custom React components:

```tsx
const customTool = {
  name: 'my_custom_tool',
  description: 'Does something custom',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    }
  },
  handler: async (input: { input: string }) => {
    // Your custom logic here
    return { result: `Processed: ${input.input}` };
  }
};

agent.registerTool(customTool);
```

Then add a custom renderer in `MessageComponents.tsx`:

```tsx
{toolCall.toolCall.tool_name === 'my_custom_tool' && (
  <MyCustomToolComponent
    toolCall={toolCall.toolCall}
    onComplete={(result, success, error) => {
      onCompleteTool?.(toolCall.toolCall.tool_call_id, result, success, error);
    }}
    status={toolCall.status}
  />
)}
```

## Components

- `EmbeddableChat` - Complete chat interface with built-in tool rendering
- `FullChat` - Full-page chat with sidebar
- `AgentSelect` - Dropdown for selecting agents
- `ChatInput` - Message input component

## Hooks

- `useAgent` - Manage a single agent
- `useAgents` - List available agents  
- `useChat` - Chat functionality with automatic tool call state management
- `useThreads` - Thread management
- `useTools` - Tool registration and management