# Distri JavaScript SDK

A comprehensive JavaScript SDK for the Distri distributed framework, providing both core functionality and React hooks for building distributed applications with real-time messaging and thread management.

## Features

- 🌐 **A2A Protocol**: Agent-to-Agent communication using WebSockets
- 🧵 **Thread Management**: Create, manage, and participate in conversation threads
- 💬 **Real-time Messaging**: Send and receive messages with real-time updates
- ⚛️ **React Hooks**: Pre-built hooks for easy React integration
- 🔄 **Auto-reconnection**: Automatic reconnection with configurable retry logic
- 📱 **Responsive**: Works across different devices and screen sizes
- 🎯 **TypeScript**: Full TypeScript support with comprehensive type definitions

## Packages

This monorepo contains two main packages:

- **`@distri/core`**: Core functionality and A2A protocol implementation
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
  node: {
    id: 'my-client',
    name: 'My Application',
    endpoint: 'ws://localhost:8080', // Your Distri node endpoint
    status: 'connecting' as const,
    capabilities: ['threads', 'messages', 'reactions']
  },
  autoConnect: true,
  debug: process.env.NODE_ENV === 'development'
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
  node: {
    id: 'my-client',
    name: 'My Application',
    endpoint: 'ws://localhost:8080',
    status: 'connecting',
    capabilities: ['threads', 'messages']
  },
  autoConnect: true,
  debug: true
})

// Connect and use
await client.connect()

// Create a thread
const thread = await client.createThread({
  title: 'My First Thread',
  description: 'A test thread for demonstration'
})

// Send a message
const message = await client.sendMessage({
  threadId: thread.id,
  content: 'Hello, Distri!'
})

// Listen for new messages
client.on('message_received', (message) => {
  console.log('New message:', message)
})
```

## React Hooks

### useThreads

Manage threads with full CRUD operations:

```tsx
import React from 'react'
import { useThreads } from '@distri/react'

function ThreadList() {
  const { 
    threads, 
    loading, 
    error, 
    createThread, 
    updateThread, 
    deleteThread 
  } = useThreads()

  const handleCreateThread = async () => {
    await createThread({
      title: 'New Thread',
      description: 'Created from React'
    })
  }

  if (loading) return <div>Loading threads...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <button onClick={handleCreateThread}>Create Thread</button>
      {threads.map(thread => (
        <div key={thread.id}>
          <h3>{thread.title}</h3>
          <p>{thread.description}</p>
          <span>{thread.participants.length} participants</span>
        </div>
      ))}
    </div>
  )
}
```

### useMessages

Handle messages within a thread:

```tsx
import React, { useState } from 'react'
import { useMessages } from '@distri/react'

function Chat({ threadId }: { threadId: string }) {
  const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    addReaction 
  } = useMessages({ 
    threadId,
    autoSubscribe: true 
  })
  
  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    
    await sendMessage({ content: newMessage })
    setNewMessage('')
  }

  const handleAddReaction = async (messageId: string, emoji: string) => {
    await addReaction(messageId, emoji)
  }

  return (
    <div>
      <div className="messages">
        {messages.map(message => (
          <div key={message.id}>
            <strong>User {message.authorId.slice(-4)}</strong>
            <p>{message.content}</p>
            <button onClick={() => handleAddReaction(message.id, '👍')}>
              👍
            </button>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSendMessage}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
```

### useDistri

Access the Distri client and connection status:

```tsx
import React from 'react'
import { useDistri, useDistriClient } from '@distri/react'

function ConnectionStatus() {
  const { connectionStatus, error } = useDistri()
  
  return (
    <div>
      Status: <span className={connectionStatus}>{connectionStatus}</span>
      {error && <div>Error: {error.message}</div>}
    </div>
  )
}

function DataComponent() {
  const client = useDistriClient()
  
  const handleCustomAction = async () => {
    // Use the client directly for custom operations
    const result = await client.request('custom.method', { data: 'example' })
    console.log(result)
  }
  
  return (
    <button onClick={handleCustomAction}>
      Perform Custom Action
    </button>
  )
}
```

## Core API Reference

### DistriClient

The main client class for interacting with Distri nodes.

#### Methods

- `connect()` - Connect to the Distri network
- `disconnect()` - Disconnect from the network
- `getConnectionStatus()` - Get current connection status

**Thread Management:**
- `getThreads()` - Fetch all threads
- `getThread(id)` - Get a specific thread
- `createThread(data)` - Create a new thread
- `updateThread(id, updates)` - Update thread properties
- `deleteThread(id)` - Delete a thread
- `joinThread(id)` - Join an existing thread
- `leaveThread(id)` - Leave a thread

**Message Management:**
- `getMessages(threadId, options)` - Get messages for a thread
- `sendMessage(data)` - Send a new message
- `editMessage(id, content)` - Edit an existing message
- `deleteMessage(id)` - Delete a message
- `addReaction(messageId, emoji)` - Add reaction to message
- `removeReaction(messageId, emoji)` - Remove reaction from message

**Subscriptions:**
- `subscribeToThread(threadId)` - Subscribe to thread events
- `subscribeToUser(userId)` - Subscribe to user events
- `subscribeToEvents(eventTypes)` - Subscribe to specific event types

#### Events

The client emits the following events:

- `connection_status_changed` - Connection status changes
- `message_received` - New message received
- `thread_created` - New thread created
- `thread_updated` - Thread updated
- `user_joined` - User joined a thread
- `user_left` - User left a thread
- `error` - Error occurred

### A2AClient

Low-level A2A protocol client for direct protocol communication.

```typescript
import { A2AClient } from '@distri/core'

const a2aClient = new A2AClient(node, {
  autoConnect: true,
  reconnectAttempts: 3,
  reconnectDelay: 5000,
  heartbeatInterval: 30000,
  timeout: 10000
})

// Send raw A2A requests
const result = await a2aClient.request('method.name', { param: 'value' })

// Subscribe to channels
await a2aClient.subscribe({ threadId: 'thread-id' })

// Publish messages
await a2aClient.publish('channel', { data: 'message' })
```

## Configuration

### DistriClientConfig

```typescript
interface DistriClientConfig {
  node: DistriNode
  autoConnect?: boolean          // Default: true
  reconnectAttempts?: number     // Default: 3
  reconnectDelay?: number        // Default: 5000ms
  heartbeatInterval?: number     // Default: 30000ms
  timeout?: number              // Default: 10000ms
  encryption?: {
    enabled: boolean
    algorithm?: string
  }
  debug?: boolean               // Default: false
}
```

### DistriNode

```typescript
interface DistriNode {
  id: string                    // Unique identifier for this client
  name: string                  // Human-readable name
  endpoint: string              // WebSocket endpoint (ws:// or wss://)
  publicKey?: string            // Optional public key for encryption
  status: 'online' | 'offline' | 'connecting'
  capabilities: string[]        // Supported capabilities
  metadata?: Record<string, any> // Additional metadata
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

The sample includes:
- Thread creation and management
- Real-time messaging
- Message reactions
- Connection status monitoring
- Responsive UI design

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
- Modern browser with WebSocket support

## Browser Support

- Chrome 88+
- Firefox 84+
- Safari 14+
- Edge 88+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- 📖 [Documentation](https://docs.distri.ai)
- 💬 [Community Discord](https://discord.gg/distri)
- 🐛 [Issue Tracker](https://github.com/distrihub/distrijs/issues)
- 📧 [Email Support](mailto:support@distri.ai)

## Roadmap

- [ ] End-to-end encryption support
- [ ] File upload and sharing
- [ ] Voice and video messaging
- [ ] Advanced search and filtering
- [ ] Mobile React Native SDK
- [ ] Vue.js bindings
- [ ] Angular bindings

