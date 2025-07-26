# Distri React

React components and hooks for building chat interfaces with Distri agents.

## Core Features

### Tool Call Management
- **Automatic State Restoration**: When messages are reloaded from history, tool call states are automatically restored
- **Rerun Capability**: Users can rerun failed or completed tool calls with a single click
- **Real-time Status Tracking**: Visual indicators show tool call status (pending, running, completed, error)

### Message History Persistence
- Messages with tool calls are properly loaded from thread history
- Tool call results are matched with their original calls
- Historical tool call states are preserved and displayed

## Usage

### Basic Chat Interface

```tsx
import { EmbeddableChat, useAgent } from '@distri/react';

function MyChat() {
  const { agent } = useAgent({ agentId: 'your-agent-id' });

  return (
    <EmbeddableChat
      agent={agent}
      threadId="your-thread-id"
      height="600px"
    />
  );
}
```

### Tool Call Rerun Functionality

The chat interface automatically provides rerun buttons for completed or failed tool calls:

- **Completed tools**: Show a "Rerun" button next to the success indicator
- **Failed tools**: Show a "Rerun" button next to the error indicator  
- **Running tools**: Show spinning indicator, no rerun option
- **Pending tools**: Show waiting indicator

### Custom Tool Handlers

```tsx
import { useChat, useToolManager } from '@distri/react';

function CustomChatWithTools() {
  const tools = {
    'my_custom_tool': async (input) => {
      // Your tool implementation
      return { result: 'Tool executed successfully' };
    }
  };

  const { 
    messages, 
    executeTool, 
    rerunTool,
    getToolCallStatus 
  } = useChat({
    threadId: 'your-thread-id',
    agent: agent,
    tools
  });

  // Manually rerun a specific tool call
  const handleRerun = async (toolCallId) => {
    await rerunTool(toolCallId);
  };

  return (
    <div>
      {/* Your chat UI */}
    </div>
  );
}
```

### Tool Call State Extraction

For custom implementations, you can extract tool call states from message history:

```tsx
import { extractToolCallsWithResults } from '@distri/react';

function MyCustomComponent({ messages }) {
  const toolCallStates = extractToolCallsWithResults(messages);
  
  toolCallStates.forEach(state => {
    console.log('Tool:', state.toolCall.tool_name);
    console.log('Status:', state.status);
    console.log('Result:', state.result);
  });
}
```

## API Reference

### useChat Hook

The `useChat` hook now includes:

```tsx
interface UseChatReturn {
  // ... existing properties
  rerunTool: (toolCallId: string) => Promise<void>;
  getToolCallStatus: (toolCallId: string) => ToolCallState | undefined;
}
```

### Tool Call State Structure

```tsx
interface ToolCallState {
  toolCall: ToolCall;
  status: 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}
```

### Message Reload Behavior

When messages are loaded from history:

1. **Tool Call Extraction**: All tool calls are extracted from message parts
2. **Result Matching**: Tool results are matched to their corresponding calls
3. **Status Inference**: Final status is determined based on success/failure of results
4. **State Restoration**: Tool manager state is updated with historical information
5. **UI Updates**: Components automatically reflect the restored states

This ensures that when users return to a chat thread, they can see the complete history of tool executions and rerun any tools as needed.

## Components

All components now support the enhanced tool call functionality:

- `EmbeddableChat`: Full-featured chat with automatic tool call management
- `FullChat`: Complete chat interface with sidebar and tool call rerun support
- `AssistantWithToolCalls`: Message component with integrated rerun buttons

## Installation

```bash
npm install @distri/react @distri/core
```