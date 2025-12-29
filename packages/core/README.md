# @distri/core

Core API client for Distri Framework with support for DistriMessage and DistriPart types.

## Features

- **DistriMessage**: Enhanced message structure with typed parts
- **DistriPart**: Typed message parts supporting text, code observations, tool calls, and more
- **A2A Protocol Integration**: Seamless conversion between A2A and Distri message formats
- **Enhanced Message Rendering**: Rich display of different message part types

## DistriMessage Structure

```typescript
interface DistriMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: DistriPart[];
  created_at?: string;
  metadata?: any;
}
```

## DistriPart Types

```typescript
type DistriPart =
  | { type: 'text'; text: string }
  | { type: 'code_observation'; code_observation: CodeObservation }
  | { type: 'image'; image: FileType }
  | { type: 'data'; data: any }
  | { type: 'tool_call'; tool_call: ToolCall }
  | { type: 'tool_result'; tool_result: ToolResponse }
  | { type: 'plan'; plan: string };
```

## Usage

### Creating DistriMessages

```typescript
import { DistriClient, DistriMessage } from '@distri/core';

// Create a simple text message
const textMessage = DistriClient.initDistriMessage('Hello, world!', 'user');

// Create a message with multiple parts
const complexMessage = DistriClient.initDistriMessage([
  { type: 'text', text: 'Here is my analysis:' },
  { 
    type: 'code_observation', 
    code_observation: {
      thought: 'I need to analyze this data',
      code: 'const result = data.map(x => x * 2);'
    }
  },
  {
    type: 'tool_call',
    tool_call: {
      tool_call_id: 'call_123',
      tool_name: 'calculate',
      input: { numbers: [1, 2, 3] }
    }
  }
], 'assistant');
```

### Converting Between Formats

```typescript
import { 
  convertA2AMessageToDistri, 
  convertDistriMessageToA2A 
} from '@distri/core';

// Convert A2A Message to DistriMessage
const a2aMessage = /* A2A message from protocol */;
const distriMessage = convertA2AMessageToDistri(a2aMessage);

// Convert DistriMessage to A2A Message
const a2aMessage = convertDistriMessageToA2A(distriMessage);
```

### Extracting Content

```typescript
import { 
  extractTextFromDistriMessage,
  extractToolCallsFromDistriMessage,
  extractToolResultsFromDistriMessage 
} from '@distri/core';

// Extract text content
const text = extractTextFromDistriMessage(message);

// Extract tool calls
const toolCalls = extractToolCallsFromDistriMessage(message);

// Extract tool results
const toolResults = extractToolResultsFromDistriMessage(message);
```

## Message Rendering

The React package includes enhanced message rendering components that can display all DistriPart types:

- **Text**: Standard text rendering with markdown support
- **Code Observations**: Thought process and code with syntax highlighting
- **Tool Calls**: Tool execution details with input/output display
- **Tool Results**: Success/failure status with result data
- **Plans**: Structured plan display
- **Images**: Base64 image rendering
- **Data**: JSON data display

## Migration from A2A Messages

The framework provides backward compatibility while encouraging the use of DistriMessage:

```typescript
// Old way (still supported)
const oldMessage = DistriClient.initMessage('Hello', 'user');

// New way (recommended)
const newMessage = DistriClient.initDistriMessage('Hello', 'user');
```

## Type Safety

All DistriPart types are fully typed, providing compile-time safety and better IDE support:

```typescript
// TypeScript will ensure correct structure
const part: DistriPart = {
  type: 'code_observation',
  code_observation: {
    thought: 'My analysis',
    code: 'console.log("Hello");'
  }
};
```

## Session Store API

The `DistriClient` provides a comprehensive session store API for managing thread-scoped key-value storage.

### Basic Operations

```typescript
import { DistriClient } from '@distri/core';

const client = DistriClient.create();
const sessionId = 'thread-123';

// Set a session value
await client.setSessionValue(sessionId, 'key', { data: 'value' });

// Get a session value
const value = await client.getSessionValue(sessionId, 'key');

// Get all session values (returns a map)
const allValues = await client.getSessionValues(sessionId);

// Delete a session value
await client.deleteSessionValue(sessionId, 'key');

// Clear all session values
await client.clearSession(sessionId);
```

### API Endpoints

All session methods use the following endpoints (mounted at `/v1/sessions/`):

- `POST /sessions/{sessionId}/values` - Set a session value
- `GET /sessions/{sessionId}/values` - Get all session values (returns map)
- `GET /sessions/{sessionId}/values/{key}` - Get a specific session value
- `DELETE /sessions/{sessionId}/values/{key}` - Delete a session value
- `DELETE /sessions/{sessionId}` - Clear all session values

### Integration with Agent Definitions

Session values can be referenced in agent definitions using `UserMessageOverrides`:

```yaml
# Agent definition
user_message_overrides:
  parts:
    - type: session_key
      key: "observation"  # References session value with key "observation"
    - type: template
      template: "custom_user_template"
  include_artifacts: true
```

When the agent processes a message, it will automatically:
1. Load all session values as a map
2. Resolve `PartDefinition::SessionKey` references from the map
3. Merge override parts with the default message parts
4. Include the merged message in the LLM prompt 