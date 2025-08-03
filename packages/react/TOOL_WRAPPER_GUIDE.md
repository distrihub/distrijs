# Tool Wrapper Guide

This guide explains how to use the new DefaultToolActions component and automatic tool rendering functionality in @distri/react.

## Overview

The `DefaultToolActions` component provides a consistent UI for external tool calls with Confirm and Cancel buttons. All `DistriFnTool` instances are automatically rendered with this default interface through the `ToolCallRenderer`.

## Automatic Tool Rendering

When you register tools with an agent, `DistriFnTool` instances are automatically rendered with the `DefaultToolActions` component:

```typescript
import { Chat, DistriProvider } from '@distri/react';
import { DistriFnTool } from '@distri/core';

// Your function tools
const tools: DistriFnTool[] = [
  {
    name: 'set_map_center',
    type: 'function',
    description: 'Set the center location of the Google Maps view',
    input_schema: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        zoom: { type: 'number', default: 13 }
      },
      required: ['latitude', 'longitude']
    },
    handler: async (input: string) => {
      const { latitude, longitude, zoom } = JSON.parse(input);
      // Your tool logic here
      return `Map center set to ${latitude}, ${longitude}`;
    }
  }
];

// Tools are automatically rendered with DefaultToolActions
function MyApp() {
  return (
    <DistriProvider>
      <Chat
        agent={agent}
        tools={tools} // Automatically rendered with DefaultToolActions
        threadId="my-thread"
      />
    </DistriProvider>
  );
}
```

## Auto-Execute Mode

You can configure tools to execute automatically without requiring user confirmation:

```typescript
import { Chat, DistriProvider } from '@distri/react';

function MyApp() {
  return (
    <DistriProvider>
      <Chat
        agent={agent}
        tools={tools}
        threadId="my-thread"
        // Configure auto-execute for all function tools
        wrapOptions={{ autoExecute: true }}
      />
    </DistriProvider>
  );
}
```

## Custom Tool Components

For custom UI, create your own `DistriUiTool`:

```typescript
import { DistriUiTool, UiToolProps } from '@distri/react';

const MyCustomTool: React.FC<UiToolProps> = ({ toolCall, completeTool }) => {
  const handleExecute = async () => {
    // Custom execution logic
    const result = await myCustomLogic(toolCall.input);
    
    completeTool({
      tool_call_id: toolCall.tool_call_id,
      result: JSON.stringify(result),
      success: true
    });
  };

  return (
    <div className="my-custom-tool">
      <h3>Custom Tool: {toolCall.tool_name}</h3>
      <button onClick={handleExecute}>Execute</button>
    </div>
  );
};

const customTool: DistriUiTool = {
  name: 'my_custom_tool',
  type: 'ui',
  description: 'My custom tool with custom UI',
  input_schema: { /* ... */ },
  component: MyCustomTool
};
```

## External Tool Workflow

The external tool workflow automatically:

1. **Detects tool calls** in the ToolCallRenderer
2. **For DistriFnTools**: Creates DefaultToolActions component with the tool handler
3. **For DistriUiTools**: Uses the custom component provided
4. **For missing tools**: Creates MissingTool component with error handling
5. **Shows appropriate UI** (Confirm/Cancel, custom UI, or error message)
6. **Executes or handles** the tool call based on type
7. **Displays the result** or error
8. **Sends results back to the agent** automatically when all external tools complete

This provides a smooth user experience where users can approve tool executions and see their results in real-time.

## DefaultToolActions Component

The `DefaultToolActions` component is automatically created for `DistriFnTool` instances and provides the standard UI:

### Auto-Generated Props

- `toolCall`: The tool call data
- `toolCallState`: Current state of the tool call  
- `completeTool`: Callback to complete the tool with results
- `toolHandler`: The original DistriFnTool handler function
- `autoExecute`: Configured via `wrapOptions.autoExecute`

### States

- **Pending**: Shows tool info with Confirm/Cancel buttons
- **Processing**: Shows loading spinner while executing
- **Completed**: Shows result or error after execution

This workflow ensures all external tool calls are properly managed and user-approved before execution, with automatic component creation handled by the `ToolCallRenderer`.

## Missing Tool Handling

When a tool call is made for a tool that doesn't exist in the agent definition or external tools, the `MissingTool` component is automatically displayed:

### Features

- **Clear Error Message**: Shows which tool is missing
- **Debug Information**: Collapsible section showing the attempted input
- **Dismissal Action**: Button to dismiss the missing tool call
- **Helpful Tips**: Guidance on how to fix the issue

### Automatic Behavior

```typescript
// When agent calls a non-existent tool
// The MissingTool component is automatically created and displayed
// User can dismiss it, which sends an error result back to the agent

const missingToolCall = {
  tool_name: 'non_existent_tool',
  input: { param: 'value' }
};
// → Automatically shows MissingTool component
```

### Error Result

When dismissed, the MissingTool sends back an error result:

```typescript
{
  tool_call_id: "call_123",
  result: "Tool 'non_existent_tool' is not available",
  success: false,
  error: "Tool 'non_existent_tool' not found in agent definition or external tools"
}
```

This helps the agent understand that the tool is not available and can adjust its response accordingly. 