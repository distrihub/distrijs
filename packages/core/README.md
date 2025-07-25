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