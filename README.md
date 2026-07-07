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

## 🎤 Voice Support (NEW!)

DistriJS now includes comprehensive voice interaction capabilities:

- **🎙️ Speech-to-Text**: Record voice messages that are automatically transcribed using OpenAI Whisper
- **🔊 Text-to-Speech**: Convert AI responses to speech with OpenAI TTS or Gemini TTS
- **⚡ Real-time Processing**: Seamless voice interactions with minimal latency
- **🎛️ Configurable**: Multiple TTS providers, voices, and speed settings

```tsx
<Chat
  agent={agent}
  threadId="conversation-1"
  voiceEnabled={true}
  ttsConfig={{
    model: 'openai',
    voice: 'alloy',
    speed: 1.0
  }}
/>
```

👉 **[See Voice Support Guide](VOICE_SUPPORT.md)** for complete setup instructions.

## 👁️ Read-Only Task Streaming (NEW!)

Follow an agent task **without owning the turn**. Where `<Chat>` / `useChat` _send_ a
message and stream the response, `<TaskView>` / `useTaskStreaming` **attach** to a task
that is already running (or already finished), replay its history, and follow the live
tail — using the exact same renderers `<Chat>` uses, with **no composer** and no tool
interaction. Under the hood this is A2A `tasks/resubscribe`.

```tsx
import { TaskView, useTaskStreaming } from '@distri/react';

// 1. Turnkey read-only surface — same renderer surface as <Chat>.
<TaskView agent={agent} taskId={taskId} rendering="rich" />

// 2. Or drive your own UI from the hook.
const { messages, isStreaming, isTerminal, reconnect } = useTaskStreaming({ agent, taskId });
```

New API:

- **`@distri/core`** — `agent.resubscribe(taskId)` (decoded, read-only twin of
  `invokeStream`) and `client.resubscribeTask(agentId, taskId)`.
- **`@distri/react`** — `useTaskStreaming({ agent, taskId })`, `<TaskView>`, and
  `<ChatMessageList>` (the message-list + fork-anchoring renderer shared with `<Chat>`).

Three consumption levels — turnkey `<TaskView>`, `useTaskStreaming` + `<ChatMessageList>`
in your own shell, or `useTaskStreaming` alone for a fully custom view.

👉 **[See the Task Streaming guide](docs/task-streaming.md)** and the runnable
`apps/task-stream-demo`.

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
    <DistriProvider config={{ baseUrl: 'http://localhost:8080/v1' }}>
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

## 💾 Session Store API

The Distri client provides a comprehensive session store API for managing thread-scoped key-value storage. Session values can be used to store state, share data between agent iterations, and attach additional content to user messages.

### Basic Session Operations

```typescript
import { DistriClient } from '@distri/core';

const client = DistriClient.create({ baseUrl: 'http://localhost:8080/v1' });
const sessionId = 'thread-123';

// Set a session value
await client.setSessionValue(
  sessionId,
  'user_preference',
  { theme: 'dark', language: 'en' }
);

// Set with optional expiry
const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
await client.setSessionValue(
  sessionId,
  'temporary_data',
  { data: 'value' },
  expiry
);

// Get a single session value
const value = await client.getSessionValue(sessionId, 'user_preference');
console.log('User preference:', value);

// Get all session values as a map
const allValues = await client.getSessionValues(sessionId);
for (const [key, value] of Object.entries(allValues)) {
  console.log(`${key}:`, value);
}

// Delete a specific key
await client.deleteSessionValue(sessionId, 'user_preference');

// Clear all values in a session
await client.clearSession(sessionId);
```

### Use Cases

- **Browser Automation**: Store screenshots, DOM observations, and user interactions
- **State Management**: Maintain conversation context and user preferences  
- **Tool Integration**: Share data between external tools and agent iterations
- **Multi-step Workflows**: Persist intermediate results across agent calls
- **Agent Message Overrides**: Use session values in agent definitions with `UserMessageOverrides` and `PartDefinition::SessionKey`

### Integration with Agent Definitions

Session values can be referenced in agent definitions using `UserMessageOverrides`:

```yaml
# Agent definition
user_message_overrides:
  parts:
    - type: session_key
      key: "observation"  # References session value with key "observation"
  include_artifacts: true
```

When the agent processes a message, it will automatically include the session value in the user message parts.

## 📚 Documentation

- **[API Reference](./docs/api/)** - Complete API documentation
- **[Tool System Guide](./docs/tools.md)** - In-depth tool development
- **[Task Streaming Guide](./docs/task-streaming.md)** - Read-only task following (`useTaskStreaming` / `<TaskView>`)
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

