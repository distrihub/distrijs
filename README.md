# DistriJS - AI Agent Framework

[![npm version](https://badge.fury.io/js/@distri%2Fcore.svg)](https://badge.fury.io/js/@distri%2Fcore)

DistriJS is a comprehensive TypeScript/JavaScript framework for building AI agent applications with external tool integration. It provides a simplified, type-safe way to create interactive AI agents that can execute tools, handle user input, and integrate with external services.

## ✨ What's New - Major Refactor

**🚀 Version 0.2.0** introduces a completely redesigned tool system following the AG-UI pattern:

- **Simplified Tool Registration**: Register tools directly on agents using `agent.addTool()` or the `useTools` hook
- **Automatic Tool Execution**: Tools are executed immediately when called by the AI - no more manual handling
- **Type-Safe**: Full TypeScript support with proper type inference
- **AG-UI Compatible**: Follows the same patterns as AG-UI for familiar developer experience
- **No More External Tool Events**: Streamlined event handling without complex external tool managers

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
│ │   Tools     │ │    │ ┌─────────────┐ │    │                 │
│ │  Registry   │ │    │ │   Events    │ │    │                 │
│ └─────────────┘ │    │ │  Streaming  │ │    │                 │
└─────────────────┘    │ └─────────────┘ │    └─────────────────┘
                       └─────────────────┘
```

## 📦 Packages

- **`@distri/core`** - Core client, agent management, and tool system
- **`@distri/react`** - React hooks and components for UI integration
- **`@distri/widgets`** - 🆕 Reusable UI widgets (ChartWidget, etc.)

## 🚀 Quick Start

### Installation

```bash
npm install @distri/react @distri/core
# Optional: For widgets
npm install @distri/widgets
```

### Basic Usage

```tsx
import { DistriProvider, useAgent, useTools, createTool, Chat } from '@distri/react';

function MyApp() {
  const { agent } = useAgent({ agentId: 'my-agent' });
  const { addTool } = useTools({ agent });

  // Register tools when agent is ready
  useEffect(() => {
    if (agent) {
      addTool(createTool(
        'get_weather',
        'Get current weather for a location',
        {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name' }
          },
          required: ['location']
        },
        async (input) => {
          // Your tool implementation
          return { weather: 'sunny', temperature: '75°F' };
        }
      ));
    }
  }, [agent, addTool]);

  return (
    <Chat
      agentId="my-agent"
      threadId="conversation-1"
      agent={agent}
    />
  );
}

function App() {
  return (
    <DistriProvider config={{ baseUrl: 'http://localhost:8080/api/v1' }}>
      <MyApp />
    </DistriProvider>
  );
}
```

## 🛠️ Tool System

### Creating Tools

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

### Using Tools Hook

```tsx
import { useTools, createBuiltinTools } from '@distri/react';

function MyComponent() {
  const { agent } = useAgent({ agentId: 'assistant' });
  const { addTool, addTools, removeTool, getTools } = useTools({ agent });

  useEffect(() => {
    if (agent) {
      // Add built-in tools
      const builtins = createBuiltinTools();
      addTools([builtins.confirm, builtins.input, builtins.notify]);

      // Add custom tools
      addTool(calculatorTool);
    }
  }, [agent, addTool, addTools]);
}
```

### Built-in Tools

DistriJS includes common tools out of the box:

- **`confirm`** - Ask user for confirmation
- **`input`** - Request text input from user  
- **`notify`** - Show notifications
- **`approval_request`** - Built-in approval workflow

## 📊 Widgets Package

New `@distri/widgets` package provides reusable components:

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

### 1. **Google Maps Integration** (`samples/maps-chat/`)

Complete example showing external tool integration with Google Maps:

- **Split Layout**: Maps on left, chat on right
- **Real-time Control**: AI agent controls map through natural language
- **Multiple Tools**: Center map, add markers, get directions, search places

```bash
cd samples/maps-chat
npm install
npm run dev
```

**Example interactions:**
- "Show me directions from Times Square to Central Park"
- "Find restaurants near my location"
- "Add a marker at the Statue of Liberty"

### 2. **Data Analyst Agent** (`samples/data-analyst/`)

Agent definition for financial data analysis with chart generation:

- **Trade Data**: Query stocks, crypto, forex, commodities  
- **Visualizations**: Generate charts automatically
- **Analytics**: Calculate metrics and generate reports

### 3. **Tools Demo** (`samples/full-demo/`)

Interactive demonstration of the new tool system:

- **Live Tool Registration**: See tools being registered and removed
- **Built-in Tools**: Test confirmation, input, and notification tools
- **Custom Tools**: Calculator, random number generator, time tools

## 🔧 Migration from v0.1.x

### Major Changes

1. **Simplified Tool System**: No more `external_tools` events or `ExternalToolManager`
2. **Direct Registration**: Use `agent.addTool()` or `useTools` hook
3. **Automatic Execution**: Tools execute immediately when called
4. **Removed Props**: `tools` prop removed from `Chat` and `useChat`

### Migration Steps

**Before (v0.1.x):**
```tsx
const tools = {
  my_tool: async (toolCall, onComplete) => {
    const result = await doSomething(toolCall.input);
    await onComplete(toolCall.tool_call_id, { result, success: true });
  }
};

<Chat tools={tools} onExternalToolCall={handleToolCall} />
```

**After (v0.2.x):**
```tsx
const { agent } = useAgent({ agentId: 'my-agent' });
const { addTool } = useTools({ agent });

useEffect(() => {
  if (agent) {
    addTool(createTool(
      'my_tool',
      'Description',
      { /* schema */ },
      async (input) => {
        return await doSomething(input);
      }
    ));
  }
}, [agent, addTool]);

<Chat agent={agent} />
```

## 🏗️ Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/distrihub/distrijs.git
cd distrijs

# Install dependencies
pnpm install

# Build packages
pnpm build

# Run samples
cd samples/full-demo
npm run dev
```

### Project Structure

```
distrijs/
├── packages/
│   ├── core/          # Core framework
│   ├── react/         # React integration
│   └── widgets/       # UI components
├── samples/
│   ├── full-demo/     # Complete demo app
│   ├── maps-chat/     # Google Maps integration
│   └── data-analyst/ # Financial analysis agent
└── scripts/           # Build and release scripts
```

## 📚 Documentation

- **[API Reference](./docs/api/)** - Complete API documentation
- **[Tool System Guide](./docs/tools.md)** - In-depth tool development
- **[Migration Guide](./docs/migration.md)** - Upgrading from previous versions
- **[Samples](./samples/)** - Working examples and tutorials

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🔗 Links

- **[Documentation](https://distrijs.dev)**
- **[GitHub](https://github.com/distrihub/distrijs)**
- **[npm Packages](https://www.npmjs.com/search?q=%40distri)**
- **[Discord Community](https://discord.gg/distri)**

---

**DistriJS** - Build intelligent AI agents with external tool integration 🚀

