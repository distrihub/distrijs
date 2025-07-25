# DistriJS - AI Agent Framework

[![npm version](https://badge.fury.io/js/@distri%2Fcore.svg)](https://badge.fury.io/js/@distri%2Fcore)

DistriJS is a comprehensive TypeScript/JavaScript framework for building AI agent applications with external tool integration. It provides a simplified, type-safe way to create interactive AI agents that can execute tools, handle user input, and integrate with external services.

## ✨ What's New - Enhanced Tool System

**🚀 Version 0.2.1** introduces significant improvements to the tool system:

- **Unified Tool Registration**: Tools are now registered directly on agents using `agent.addTool()` or the `useTools` hook
- **Automatic Tool Execution**: Tools are executed automatically by the agent with proper UI integration
- **Enhanced External Tool Support**: Better handling of UI-requiring tools like approvals, toasts, and input requests
- **Improved Event Handling**: Streamlined message and event system aligned with the A2A protocol
- **Type-Safe Tool Creation**: Full TypeScript support with proper type inference for tool inputs and outputs

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   DistriJS      │    │   Backend       │
│                 │    │   Framework     │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   React     │ │◄──►│ │    Core     │ │◄──►│ │   Distri    │ │
│ │ Components  │ │    │ │   Agent     │ │    │ │   Server    │ │
│ └─────────────┘ │    │ │   Client    │ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ └─────────────┘ │    │                 │
│ │   External  │ │    │ ┌─────────────┐ │    │                 │
│ │   Tools     │ │    │ │   Tool      │ │    │                 │
│ └─────────────┘ │    │ │   Manager   │ │    │                 │
└─────────────────┘    │ └─────────────┘ │    └─────────────────┘
                       └─────────────────┘
```

## 🚀 Quick Start

### Installation

```bash
npm install @distri/core @distri/react
```

### Basic Setup

```tsx
import { DistriProvider, EmbeddableChat, useAgent, useTools, createTool } from '@distri/react';

function App() {
  return (
    <DistriProvider config={{ baseUrl: 'http://localhost:8080/api/v1' }}>
      <MyApp />
    </DistriProvider>
  );
}
```

## 🛠️ Enhanced Tool System

### Creating Custom Tools

Use the `createTool` helper for type-safe tool definitions:

```tsx
import { createTool } from '@distri/react';

const calculatorTool = createTool(
  'add',
  'Add two numbers',
  {
    type: 'object',
    properties: {
      a: { type: 'number', description: 'First number' },
      b: { type: 'number', description: 'Second number' }
    },
    required: ['a', 'b']
  },
  async (input: { a: number; b: number }) => {
    return { result: input.a + input.b };
  }
);
```

### Registering Tools with Agents

```tsx
import { useTools, createBuiltinTools } from '@distri/react';

function MyComponent() {
  const { agent } = useAgent({ agentId: 'assistant' });
  const { addTool, addTools } = useTools({ agent });

  useEffect(() => {
    if (agent) {
      // Add built-in tools
      const builtins = createBuiltinTools();
      addTools([builtins.confirm, builtins.toast, builtins.notify]);

      // Add custom tools
      addTool(calculatorTool);
    }
  }, [agent, addTool, addTools]);
}
```

### Built-in Tools

DistriJS includes common tools out of the box:

- **`approval_request`** - Request user approval for actions with a dialog
- **`toast`** - Show toast notifications to the user
- **`input_request`** - Request text input from the user with a prompt
- **`confirm`** - Ask user for confirmation with a dialog
- **`notify`** - Show browser notifications

### External Tool Integration Example

Here's how to create a Google Maps tool (from the maps demo):

```tsx
const mapTools = [
  {
    name: 'set_map_center',
    description: 'Set the center location of the Google Maps view',
    parameters: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Latitude coordinate' },
        longitude: { type: 'number', description: 'Longitude coordinate' },
        zoom: { type: 'number', description: 'Zoom level (1-20)', default: 13 }
      },
      required: ['latitude', 'longitude']
    },
    handler: async (input: { latitude: number; longitude: number; zoom?: number }) => {
      return await mapManagerRef.current?.setMapCenter(input);
    }
  }
];

// Register with agent
useEffect(() => {
  if (agent) {
    addTools(mapTools);
  }
}, [agent, addTools]);
```

## 📊 Widget System

The `@distri/widgets` package provides reusable components:

```tsx
import { ChartWidget } from '@distri/widgets';

const data = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [{
    label: 'Sales',
    data: [100, 200, 150]
  }]
};

<ChartWidget
  type="line"
  data={data}
  title="Monthly Sales"
  height={400}
/>
```

## 🎯 Examples & Samples

### 1. **Google Maps Integration** (`samples/maps-demo/`)

Complete example showing external tool integration with Google Maps:

- **Real-time Map Control**: Set center, add markers, get directions
- **Place Search**: Search for restaurants, gas stations, etc.
- **Split Layout**: Maps on left, chat on right
- **Tool Approval Flow**: Request approval for map changes

```bash
cd samples/maps-demo
npm install
npm run dev
```

### 2. **Full Demo Application** (`samples/full-demo/`)

Comprehensive example with multiple agents and tools:

- **Multi-agent Chat**: Switch between different specialized agents
- **Tool Demonstrations**: Examples of all built-in tools
- **Thread Management**: Multiple conversation threads
- **Real-time Updates**: Live task monitoring

```bash
cd samples/full-demo
npm install
npm run dev
```

## 🔧 Advanced Usage

### Custom Tool with UI Integration

```tsx
const complexTool = createTool(
  'process_data',
  'Process complex data with user approval',
  {
    type: 'object',
    properties: {
      data: { type: 'array', description: 'Data to process' },
      operation: { type: 'string', description: 'Operation to perform' }
    },
    required: ['data', 'operation']
  },
  async (input: { data: any[]; operation: string }) => {
    // For operations requiring approval, return approval request
    if (input.operation === 'delete') {
      return {
        requiresApproval: true,
        message: `Delete ${input.data.length} items?`,
        action: 'delete_data'
      };
    }
    
    // Process data directly
    const result = processData(input.data, input.operation);
    return { processed: result.length, result };
  }
);
```

### Event Handling

```tsx
const { 
  messages, 
  externalToolCalls, 
  handleExternalToolComplete 
} = useChat({
  agentId: 'assistant',
  threadId: 'thread-123',
  onToolCalls: (toolCalls) => {
    console.log('Tool calls received:', toolCalls);
  }
});

// Handle external tool completion
const onToolComplete = async (results: ToolResult[]) => {
  await handleExternalToolComplete(results);
  console.log('Tools completed:', results);
};
```

### Multiple Agent Setup

```tsx
function MultiAgentChat() {
  const [selectedAgent, setSelectedAgent] = useState('assistant');
  const { agent } = useAgent({ agentId: selectedAgent });
  
  return (
    <div>
      <AgentSelector 
        selected={selectedAgent} 
        onSelect={setSelectedAgent} 
      />
      <EmbeddableChat
        agentId={selectedAgent}
        agent={agent}
        threadId={`thread-${selectedAgent}`}
      />
    </div>
  );
}
```

## 🔑 Key Improvements

### Tool System Enhancements

1. **Unified Registration**: All tools are registered on agents, eliminating the disconnect between internal and external tools
2. **Automatic Execution**: Tools are executed immediately when called, with UI interactions handled seamlessly
3. **Better Error Handling**: Comprehensive error reporting and recovery for failed tool executions
4. **Type Safety**: Full TypeScript support with proper type inference for tool parameters and results

### Event System Improvements

1. **Streamlined Events**: Aligned with A2A protocol for better compatibility
2. **Real-time Updates**: Proper SSE integration for live tool execution status
3. **Message Structure**: Consistent message format for tool calls and responses

### UI Integration

1. **ExternalToolManager**: New component that handles UI-requiring tools automatically
2. **Better UX**: Users are guided through tool interactions with clear feedback
3. **Theme Support**: Dark/light theme support for all tool UIs

## 📚 API Reference

### Core Types

```typescript
interface DistriTool {
  name: string;
  description: string;
  parameters: any; // JSON Schema
  handler: ToolHandler;
}

interface ToolCall {
  tool_call_id: string;
  tool_name: string;
  input: any;
}

interface ToolResult {
  tool_call_id: string;
  result: any;
  success: boolean;
  error?: string;
}
```

### Hooks

- **`useAgent(options)`** - Get or create an agent instance
- **`useTools({ agent })`** - Manage tools for an agent
- **`useChat(options)`** - Handle chat interactions with tool support
- **`useThreads(agentId)`** - Manage conversation threads

### Utilities

- **`createTool(name, description, parameters, handler)`** - Type-safe tool creation
- **`createBuiltinTools()`** - Get all built-in tools
- **`extractExternalToolCalls(messages)`** - Extract tool calls from messages

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) guide for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [docs.distri.dev](https://docs.distri.dev)
- **Examples**: [github.com/distrihub/distri/samples](https://github.com/distrihub/distri/tree/main/samples)
- **Discord**: [Join our community](https://discord.gg/distri)
- **Twitter**: [@distrihub](https://twitter.com/distrihub)

