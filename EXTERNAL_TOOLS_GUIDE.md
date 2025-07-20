# External Tools and Agent API Guide

This guide documents the enhanced external tools handling, approval request system, and new Agent API syntax implemented based on PR #41.

## Overview

The latest updates introduce:

1. **Unified Tool Approval System**: Uses standard external tool calls instead of custom metadata types
2. **External Tool Handlers**: Frontend provision for handling external tools like file uploads, emails, etc.
3. **Enhanced Agent API**: Nice syntax with `new Agent()` and `agent.invoke()` methods
4. **Approval Request Tool**: Standardized approval handling through the `approval_request` external tool

## Event Type Changes

### Updated ToolCallStartEvent

The `ToolCallStartEvent` now includes an `is_external` field to identify external tools:

```typescript
export interface ToolCallStartEvent {
  type: 'tool_call_start';
  data: {
    tool_call_id: string;
    tool_call_name: string;
    parent_message_id?: string;
    is_external?: boolean; // NEW: Identifies external tools
  };
}
```

### Message Metadata Types

New message metadata types for external tool communication:

```typescript
export type MessageMetadata = 
  | {
      type: 'tool_response';
      tool_call_id: string;
      result: any;
    }
  | {
      type: 'tool_calls';
      tool_calls: ToolCall[];
    }
  | {
      type: 'external_tool_calls';
      tool_calls: ToolCall[];
      requires_approval: boolean;
    };
```

## Agent API

### New Agent Class

Create and work with agents using a clean, intuitive API:

```typescript
import { Agent, DistriClient } from '@distri/core';

// Create a client
const client = new DistriClient({
  baseUrl: 'http://localhost:8080/api/v1'
});

// Create an agent
const agent = await Agent.create('my-agent-id', client);

// Basic invoke
const result = await agent.invoke('Hello!');

// Streaming invoke
const streamResult = await agent.invoke('Hello!', { stream: true });
for await (const event of streamResult.stream) {
  console.log('Event:', event);
}
```

### External Tool Handlers

Handle external tools with custom handlers:

```typescript
const toolHandlers = {
  file_upload: async (toolCall) => {
    // Handle file upload
    const input = JSON.parse(toolCall.input);
    return { success: true, files: [...] };
  },
  
  email_send: async (toolCall) => {
    // Handle email sending
    const input = JSON.parse(toolCall.input);
    return { success: true, messageId: 'msg_123' };
  }
};

const result = await agent.invoke('Upload a file', {
  externalToolHandlers: toolHandlers
});
```

### Approval Handling

Handle approval requests for sensitive operations:

```typescript
const approvalHandler = async (toolCalls, reason) => {
  const toolNames = toolCalls.map(tc => tc.tool_name).join(', ');
  return confirm(`${reason}\nApprove execution of: ${toolNames}?`);
};

const result = await agent.invoke('Perform dangerous operation', {
  approvalHandler
});
```

## React Integration

### useAgent Hook

The `useAgent` hook provides easy React integration:

```typescript
import { useAgent, createBuiltinToolHandlers, createBuiltinApprovalHandler } from '@distri/react';

function MyComponent() {
  const { agent, loading, error, invoke } = useAgent({
    agentId: 'my-agent',
    defaultExternalToolHandlers: createBuiltinToolHandlers(),
    defaultApprovalHandler: createBuiltinApprovalHandler()
  });

  const handleSendMessage = async () => {
    const result = await invoke('Hello!');
    console.log('Response:', result);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>{agent?.name}</h2>
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  );
}
```

### Built-in Tool Handlers

The library provides built-in handlers for common external tools:

```typescript
import { createBuiltinToolHandlers, createBuiltinApprovalHandler } from '@distri/react';

// Built-in handlers include:
// - file_upload: Opens file picker
// - input_request: Shows prompt dialog
// - email_send: Confirmation dialog
const handlers = createBuiltinToolHandlers();

// Built-in approval handler uses confirm() dialog
const approvalHandler = createBuiltinApprovalHandler();
```

## Frontend Components

### ExternalToolHandler Component

The `ExternalToolHandler` component provides a rich UI for external tool execution:

```typescript
import { ExternalToolHandler } from './components/ExternalToolHandler';

<ExternalToolHandler
  toolCalls={toolCalls}
  requiresApproval={requiresApproval}
  onToolResponse={(toolCallId, result) => {
    // Handle tool response
  }}
  onApprovalResponse={(approved, reason) => {
    // Handle approval response
  }}
/>
```

### Enhanced MessageRenderer

The updated `MessageRenderer` automatically handles external tool calls:

```typescript
<MessageRenderer 
  content={messageText}
  metadata={message.metadata}
  onToolResponse={handleToolResponse}
  onApprovalResponse={handleApprovalResponse}
/>
```

## Approval Request System

### How It Works

1. **Agent requests approval**: Uses the `approval_request` external tool
2. **Frontend shows approval UI**: Displays tool details and approval options
3. **User approves/denies**: Response sent back as `tool_response` metadata
4. **Agent continues execution**: Based on approval response

### Approval Request Tool Call

```json
{
  "tool_call_id": "call_123",
  "tool_name": "approval_request",
  "input": "{\"tool_calls\": [...], \"reason\": \"This operation will delete files\"}"
}
```

### Approval Response

```json
{
  "type": "tool_response",
  "tool_call_id": "call_123", 
  "result": "{\"approved\": true, \"reason\": \"Approved by user\", \"tool_calls\": [...]}"
}
```

## External Tool Examples

### File Upload Tool

```typescript
const fileUploadHandler = async (toolCall) => {
  const input = JSON.parse(toolCall.input);
  
  return new Promise((resolve, reject) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = input.multiple || false;
    
    fileInput.onchange = (e) => {
      const files = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));
      resolve({ success: true, files });
    };
    
    fileInput.click();
  });
};
```

### Email Send Tool

```typescript
const emailSendHandler = async (toolCall) => {
  const input = JSON.parse(toolCall.input);
  
  const confirmed = confirm(
    `Send email to: ${input.to}\nSubject: ${input.subject}\n\nContinue?`
  );
  
  if (confirmed) {
    // Send email via your email service
    return { 
      success: true, 
      messageId: 'msg_' + Date.now() 
    };
  } else {
    throw new Error('Email sending cancelled by user');
  }
};
```

### Input Request Tool

```typescript
const inputRequestHandler = async (toolCall) => {
  const input = JSON.parse(toolCall.input);
  const userInput = prompt(input.prompt || 'Please provide input:');
  
  if (userInput !== null) {
    return { input: userInput };
  } else {
    throw new Error('Input request cancelled by user');
  }
};
```

## Configuration

### Agent Configuration

Agents can be configured with external tools and approval modes:

```yaml
agents:
  - name: "my-agent"
    description: "Agent with external tools"
    external_tools:
      - name: "file_upload"
        description: "Upload files"
        input_schema:
          type: "object"
          properties:
            multiple:
              type: "boolean"
            accept:
              type: "string"
    
    tool_approval:
      type: "filter"
      tools: ["file_upload", "email_send"]
```

### Client Configuration

```typescript
const client = new DistriClient({
  baseUrl: 'http://localhost:8080/api/v1',
  timeout: 30000,
  debug: true
});
```

## Best Practices

1. **Security**: Always validate external tool inputs
2. **User Experience**: Provide clear approval dialogs with context
3. **Error Handling**: Handle tool failures gracefully
4. **Performance**: Use streaming for long-running operations
5. **Testing**: Test both approval and non-approval flows

## Migration Guide

### From Previous Version

1. **Update event handlers**: Check for `is_external` in `ToolCallStartEvent`
2. **Replace approval metadata**: Use `approval_request` tool instead of custom metadata
3. **Update message handling**: Handle new `external_tool_calls` metadata type
4. **Add tool handlers**: Implement handlers for external tools
5. **Update UI components**: Use new `ExternalToolHandler` component

### Example Migration

**Before:**
```typescript
// Old approval handling
if (metadata.type === 'tool_approval_request') {
  showApprovalDialog(metadata);
}
```

**After:**
```typescript
// New approval handling
if (metadata.type === 'external_tool_calls') {
  const approvalTool = metadata.tool_calls.find(tc => tc.tool_name === 'approval_request');
  if (approvalTool) {
    handleApprovalRequest(approvalTool);
  }
}
```

## Demo Application

The `samples/full-demo` includes a complete demonstration of the new features:

- **API Demo Tab**: Interactive demonstration of the Agent API
- **External Tool Examples**: File upload, email send, input request
- **Approval Flow**: Visual approval dialogs
- **Streaming Support**: Real-time response handling

Run the demo:

```bash
cd samples/full-demo
npm install
npm run dev
```

## Troubleshooting

### Common Issues

1. **External tools not executing**: Check tool handler registration
2. **Approval not working**: Ensure approval handler is provided
3. **Streaming issues**: Verify stream handling implementation
4. **Type errors**: Update to latest package versions

### Debug Tips

1. Enable debug mode in client configuration
2. Check browser console for tool execution logs
3. Verify message metadata structure
4. Test with simple tool handlers first

## API Reference

See the complete TypeScript definitions in:
- `packages/core/src/types.ts` - Core types and interfaces
- `packages/core/src/agent.ts` - Agent class implementation
- `packages/react/src/useAgent.ts` - React hook implementation

For more information, see the [API Documentation](./API.md).