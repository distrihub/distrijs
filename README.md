# Distri JavaScript SDK

A comprehensive JavaScript SDK for the [Distri distributed framework](https://github.com/distrihub/distri), providing both core functionality and React hooks for building applications that interact with AI agents using the A2A (Agent-to-Agent) protocol.

## Features

- 🤖 **Agent Communication**: Interact with AI agents using the A2A protocol
- 📡 **Real-time Updates**: Server-Sent Events (SSE) for live task updates and streaming
- 🎯 **Task Management**: Create, monitor, and manage agent tasks
- ⚛️ **React Integration**: Pre-built hooks for seamless React development
- 🔄 **Auto-retry**: Configurable retry logic with exponential backoff
- 📱 **Modern API**: Built with TypeScript and modern web standards
- � **Developer Experience**: Comprehensive error handling and debugging support

## Packages

This monorepo contains two main packages:

- **`@distri/core`**: Core HTTP client and A2A protocol implementation
- **`@distri/react`**: React hooks and context providers

## Installation

```bash
# Install both packages
npm install @distri/core @distri/react

# Or install individually
npm install @distri/core
npm install @distri/react
```

## Quick Start

### Basic Setup with React

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { DistriProvider } from '@distri/react'
import App from './App'

const config = {
  baseUrl: 'http://localhost:8080', // Your Distri server URL
  apiVersion: 'v1',
  debug: process.env.NODE_ENV === 'development',
  timeout: 30000,
  retryAttempts: 3
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DistriProvider config={config}>
      <App />
    </DistriProvider>
  </React.StrictMode>
)
```

### Using Core SDK Directly

```typescript
import { DistriClient } from '@distri/core'

const client = new DistriClient({
  baseUrl: 'http://localhost:8080',
  apiVersion: 'v1',
  debug: true
})

// Get available agents
const agents = await client.getAgents()
console.log('Available agents:', agents)

// Send a message to an agent
const message = DistriClient.createMessage(
  'msg-123',
  'Hello! Can you help me with a coding problem?',
  'user'
)

const params = DistriClient.createMessageParams(message)
const response = await client.sendMessage('assistant', params)

// Subscribe to real-time updates
client.subscribeToAgent('assistant')
client.on('text_delta', (event) => {
  console.log('Streaming text:', event.delta)
})

client.on('task_completed', (event) => {
  console.log('Task completed:', event.task_id)
})
```

## React Hooks

### useAgents

Manage and interact with available agents:

```tsx
import React from 'react'
import { useAgents } from '@distri/react'

function AgentList() {
  const { agents, loading, error, refetch, getAgent } = useAgents()

  const handleRefresh = async () => {
    await refetch()
  }

  const handleSelectAgent = async (agentId: string) => {
    const agent = await getAgent(agentId)
    console.log('Selected agent:', agent)
  }

  if (loading) return <div>Loading agents...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <button onClick={handleRefresh}>Refresh Agents</button>
      {agents.map(agent => (
        <div key={agent.id} onClick={() => handleSelectAgent(agent.id)}>
          <h3>{agent.name}</h3>
          <p>{agent.description}</p>
          <div>
            {agent.capabilities?.map(cap => (
              <span key={cap}>{cap}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### useTask

Handle agent tasks with real-time streaming:

```tsx
import React, { useState } from 'react'
import { useTask } from '@distri/react'

function AgentChat({ agentId }: { agentId: string }) {
  const { 
    task, 
    loading, 
    error, 
    streamingText, 
    isStreaming, 
    sendMessage, 
    clearTask 
  } = useTask({ agentId, autoSubscribe: true })
  
  const [input, setInput] = useState('')

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    await sendMessage(input)
    setInput('')
  }

  return (
    <div>
      <div className="messages">
        {task?.messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong>
            {message.parts.map((part, i) => (
              <span key={i}>
                {part.kind === 'text' && part.text}
              </span>
            ))}
          </div>
        ))}
        
        {/* Show streaming text in real-time */}
        {isStreaming && streamingText && (
          <div className="message streaming">
            <strong>Assistant:</strong> {streamingText}
            <span className="cursor">|</span>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isStreaming}
        />
        <button type="submit" disabled={!input.trim() || isStreaming}>
          {isStreaming ? 'Streaming...' : 'Send'}
        </button>
      </form>
      
      {task && (
        <div className="task-status">
          Task: {task.id} | Status: {task.status}
        </div>
      )}
      
      <button onClick={clearTask}>Clear Chat</button>
    </div>
  )
}
```

### useDistri

Access the Distri client and handle errors:

```tsx
import React from 'react'
import { useDistri, useDistriClient } from '@distri/react'

function ConnectionStatus() {
  const { error } = useDistri()
  
  if (error) {
    return <div className="error">Connection Error: {error.message}</div>
  }
  
  return <div className="status">Connected to Distri</div>
}

function CustomComponent() {
  const client = useDistriClient()
  
  const handleCustomAction = async () => {
    try {
      const agents = await client.getAgents()
      console.log('Found agents:', agents)
    } catch (error) {
      console.error('Failed to get agents:', error)
    }
  }
  
  return (
    <button onClick={handleCustomAction}>
      Get Available Agents
    </button>
  )
}
```

## Core API Reference

### DistriClient

The main client for interacting with the Distri server.

#### Constructor

```typescript
const client = new DistriClient({
  baseUrl: 'http://localhost:8080',    // Required: Distri server URL
  apiVersion?: 'v1',                   // API version (default: 'v1')
  timeout?: 30000,                     // Request timeout in ms (default: 30000)
  retryAttempts?: 3,                   // Retry attempts (default: 3)
  retryDelay?: 1000,                   // Retry delay in ms (default: 1000)
  debug?: false,                       // Enable debug logging (default: false)
  headers?: {}                         // Additional headers
})
```

#### Methods

**Agent Management:**
- `getAgents()` - Get all available agents
- `getAgent(agentId)` - Get specific agent details

**Task Management:**
- `sendMessage(agentId, params)` - Send a message to an agent
- `sendStreamingMessage(agentId, params)` - Send a streaming message
- `createTask(request)` - Create a new task
- `getTask(taskId)` - Get task details
- `cancelTask(taskId)` - Cancel a task (if supported)
**Helper Methods:**
- `DistriClient.createMessage(id, text, role, contextId?)` - Create A2A message
- `DistriClient.createMessageParams(message, config?)` - Create message parameters

#### Events

The client emits events for real-time updates:

```typescript
client.on('text_delta', (event: TextDeltaEvent) => {
  console.log('Streaming text:', event.delta)
})

client.on('task_status_changed', (event: TaskStatusChangedEvent) => {
  console.log('Task status:', event.status)
})

client.on('task_completed', (event: TaskCompletedEvent) => {
  console.log('Task completed:', event.task_id)
})

client.on('task_error', (event: TaskErrorEvent) => {
  console.log('Task error:', event.error)
})
```

## Configuration

### DistriClientConfig

```typescript
interface DistriClientConfig {
  baseUrl: string                      // Distri server URL
  apiVersion?: string                  // API version (default: 'v1')
  timeout?: number                     // Request timeout (default: 30000ms)
  retryAttempts?: number              // Retry attempts (default: 3)
  retryDelay?: number                 // Retry delay (default: 1000ms)
  debug?: boolean                     // Debug logging (default: false)
  headers?: Record<string, string>    // Additional headers
}
```

### AgentCard

```typescript
interface AgentCard {
  id: string                          // Unique agent identifier
  name: string                        // Human-readable name
  description: string                 // Agent description
  version?: string                    // Agent version
  capabilities?: string[]             // Agent capabilities
  metadata?: Record<string, any>      // Additional metadata
}
```

### Task

```typescript
interface Task {
  id: string                          // Task identifier
  agentId: string                     // Associated agent
  status: TaskStatus                  // Current status
  contextId?: string                  // Context identifier
  createdAt: number                   // Creation timestamp
  updatedAt: number                   // Last update timestamp
  messages: A2AMessage[]              // Conversation messages
  artifacts?: TaskArtifact[]          // Task artifacts
  error?: string                      // Error message if failed
  metadata?: Record<string, any>      // Additional metadata
}
```

## Sample Application

The repository includes a complete Vite + React sample application demonstrating all features:

```bash
# Navigate to the sample
cd samples/vite-demo

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the demo.

The sample includes:
- Agent discovery and selection
- Real-time chat interface with streaming
- Task management and monitoring
- Error handling and retry logic
- Modern responsive UI

## Development

### Building the SDK

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run in development mode
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Project Structure

```
distrijs/
├── packages/
│   ├── core/           # Core SDK (@distri/core)
│   └── react/          # React hooks (@distri/react)
├── samples/
│   └── vite-demo/      # Sample Vite application
├── package.json        # Root package.json with workspaces
├── turbo.json         # Turborepo configuration
└── tsconfig.json      # TypeScript configuration
```

## Requirements

- Node.js 18+
- React 16.8+ (for React hooks)
- Distri server running (see [Distri repository](https://github.com/distrihub/distri))

## Distri Server Setup

To use this SDK, you need a running Distri server. Follow the setup instructions in the [main Distri repository](https://github.com/distrihub/distri):

```bash
# Clone the Distri repository
git clone https://github.com/distrihub/distri.git
cd distri

# Build and run the server
cargo run -- --config test-config.yaml serve

# The server will be available at http://localhost:8080
```

## API Endpoints

The SDK communicates with these Distri server endpoints:

- `GET /api/v1/agents` - List all agents
- `GET /api/v1/agents/{id}` - Get agent details
- `POST /api/v1/agents/{id}` - Send JSON-RPC requests
- `GET /api/v1/agents/{id}/events` - SSE event stream
- `GET /api/v1/tasks/{id}` - Get task details

## Error Handling

The SDK provides comprehensive error handling:

```typescript
import { DistriError, ApiError, A2AProtocolError } from '@distri/core'

try {
  await client.sendMessage('agent-id', params)
} catch (error) {
  if (error instanceof ApiError) {
    console.log('HTTP Error:', error.statusCode, error.message)
  } else if (error instanceof A2AProtocolError) {
    console.log('Protocol Error:', error.message)
  } else if (error instanceof DistriError) {
    console.log('Distri Error:', error.code, error.message)
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- 📖 [Distri Documentation](https://www.distri.dev)
- 💬 [GitHub Discussions](https://github.com/distrihub/distri/discussions)
- 🐛 [Issue Tracker](https://github.com/distrihub/distrijs/issues)
- 📧 [Distri Community](https://github.com/distrihub/distri)

## Related Projects

- [Distri Framework](https://github.com/distrihub/distri) - The main Distri framework
- [MCP Protocol](https://github.com/modelcontextprotocol/specification) - Model Context Protocol specification

