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

DistriJS provides several built-in tools that you can register with your agent:

```tsx
import React, { useEffect } from 'react';
import { 
  DistriProvider, 
  EmbeddableChat, 
  useAgent,
  createBuiltinTools,
  createApprovalTool,
  createToastTool
} from '@distri/react';

function App() {
  const { agent } = useAgent({ agentId: 'assistant' });

  useEffect(() => {
    if (agent) {
      // Register all built-in tools
      const builtinTools = createBuiltinTools();
      builtinTools.forEach(tool => agent.registerTool(tool));

      // Or register individual tools
      agent.registerTool(createApprovalTool());
      agent.registerTool(createToastTool());
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
Shows a dialog asking for user approval:
```tsx
const approvalTool = createApprovalTool();
agent.registerTool(approvalTool);
```

When called by the agent:
```json
{
  "tool_name": "approval_request",
  "input": {
    "reason": "Do you want to delete all files?",
    "tool_calls": [...]
  }
}
```

### Toast Tool
Shows toast notifications:
```tsx
const toastTool = createToastTool();
agent.registerTool(toastTool);
```

When called by the agent:
```json
{
  "tool_name": "toast",
  "input": {
    "message": "Operation completed successfully!",
    "type": "success"
  }
}
```

## Custom Tools

You can create your own tools following the same pattern:

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

## Components

- `EmbeddableChat` - Complete chat interface
- `FullChat` - Full-page chat with sidebar
- `AgentSelect` - Dropdown for selecting agents
- `ChatInput` - Message input component

## Hooks

- `useAgent` - Manage a single agent
- `useAgents` - List available agents  
- `useChat` - Chat functionality and message handling
- `useThreads` - Thread management
- `useTools` - Tool registration and management