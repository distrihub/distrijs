# DistriJS Chat Enhancements

## Overview

This document outlines the major enhancements made to the DistriJS chat and tool system to improve external tool registration, tool call handling, and event/message management.

## 🚀 Key Improvements

### 1. Enhanced Tool Registration System

#### Before
- Tools were managed through a legacy `ExternalToolManager` system
- Disconnect between agent-registered tools and external tool execution
- Complex tool handling with legacy interfaces

#### After
- **Unified Tool Registry**: All tools are registered directly on agents using `agent.addTool()`
- **Agent-Centric Tool Management**: Tools are properly stored and managed within the agent instance
- **Type-Safe Tool Definitions**: Full TypeScript support with proper schemas and handlers

```tsx
// New approach - register tools directly on agent
const { agent } = useAgent({ agentId: 'assistant' });
const { addTool, addTools } = useTools({ agent });

useEffect(() => {
  if (agent) {
    // Add custom tools
    addTool(createTool(
      'my_tool',
      'My custom tool',
      { /* JSON schema */ },
      async (input) => { /* handler */ }
    ));
    
    // Add builtin tools
    const builtins = createBuiltinTools();
    addTools([builtins.toast, builtins.confirm]);
  }
}, [agent, addTool, addTools]);
```

### 2. Improved Tool Execution Flow

#### Enhanced Agent Class
- **Tool Storage**: Agents now store complete `DistriTool` objects instead of just handlers
- **Parallel Execution**: New `executeToolCalls()` method for parallel tool execution
- **Better Error Handling**: Comprehensive error reporting and recovery
- **Tool Metadata**: Agents provide complete tool definitions to the backend

#### Smart Tool Categorization
- **Internal Tools**: Executed immediately by the agent
- **External Tools**: Require UI interaction (approval, toast, input) - handled by `ExternalToolManager`
- **Automatic Routing**: System automatically determines which tools need UI interaction

### 3. Redesigned ExternalToolManager

#### New Features
- **Agent Integration**: Takes an `Agent` instance and uses its registered tools
- **UI Tool Handling**: Specialized handling for approval dialogs, toasts, and input requests
- **Real-time Updates**: Live status tracking for tool execution
- **Error Recovery**: Better error handling and user feedback

#### Tool Categories Handled
- `approval_request`: Shows approval dialog for user confirmation
- `toast`: Displays toast notifications
- `input_request`: Shows input prompts to users
- External tools not registered on the agent

### 4. Enhanced Chat System

#### useChat Hook Improvements
- **Tool Call Detection**: Automatically detects and categorizes tool calls
- **External Tool State**: Manages external tool call state
- **Integrated Execution**: Seamless integration between internal and external tool execution
- **Event Handling**: Proper tool call event handling and message flow

#### Chat Component Updates
- **ExternalToolManager Integration**: Chat components now include the enhanced tool manager
- **User Feedback**: Clear feedback when external tools are processing
- **Input Blocking**: Prevents new messages while external tools are active

### 5. Streamlined Builtin Tools

#### New Tool Creation System
```tsx
// Create builtin tools with proper types
export const createBuiltinTools = (): Record<string, DistriTool> => {
  return {
    approval_request: {
      name: 'approval_request',
      description: 'Request user approval for actions',
      parameters: { /* schema */ },
      handler: async (input) => { /* implementation */ }
    },
    toast: { /* ... */ },
    input_request: { /* ... */ },
    confirm: { /* ... */ },
    notify: { /* ... */ }
  };
};
```

#### Tool Utilities
- **`createTool()`**: Type-safe tool creation helper
- **Individual Exports**: Export specific builtin tools for convenience
- **Proper Typing**: Full TypeScript support for tool parameters and results

### 6. Event System Alignment

#### A2A Protocol Compliance
- **Consistent Events**: Aligned event types with A2A protocol standards
- **Message Structure**: Proper message metadata for tool calls and responses
- **Stream Handling**: Better SSE integration for real-time updates

#### Tool Call Flow
1. Agent receives message with tool calls
2. System categorizes tools (internal vs external)
3. Internal tools execute immediately
4. External tools trigger UI interactions via ExternalToolManager
5. Tool results are sent back to continue conversation

## 🛠️ Technical Changes

### Core Package (`@distri/core`)

#### Agent Class Enhancements
```typescript
export class Agent {
  private tools: Map<string, DistriTool> = new Map();
  
  addTool(tool: DistriTool): void;
  addTools(tools: DistriTool[]): void;
  getTool(toolName: string): DistriTool | undefined;
  getToolDefinitions(): Record<string, any>;
  async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]>;
  // ... other methods
}
```

#### Type Improvements
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
  input: any; // Parsed JSON input
}

interface ToolResult {
  tool_call_id: string;
  result: any;
  success: boolean;
  error?: string;
}
```

### React Package (`@distri/react`)

#### Hook Updates
- **useChat**: Enhanced with external tool call handling
- **useTools**: Simplified interface for tool management
- **useAgent**: Better agent lifecycle management

#### Component Updates
- **Chat**: Integrated with new tool system
- **EmbeddableChat**: Enhanced tool support with theme integration
- **ExternalToolManager**: Completely redesigned for agent integration

#### Utility Functions
```typescript
export const createTool = <T = any>(
  name: string,
  description: string,
  parameters: any,
  handler: (input: T) => Promise<any> | any
): DistriTool;

export const createBuiltinTools = (): Record<string, DistriTool>;
export const extractExternalToolCalls = (messages: any[]): ToolCall[];
```

## 🎯 Usage Examples

### Basic Tool Registration
```tsx
function MyComponent() {
  const { agent } = useAgent({ agentId: 'assistant' });
  const { addTool } = useTools({ agent });

  useEffect(() => {
    if (agent) {
      addTool(createTool(
        'weather',
        'Get weather for a location',
        {
          type: 'object',
          properties: {
            location: { type: 'string' }
          },
          required: ['location']
        },
        async (input: { location: string }) => {
          const weather = await getWeather(input.location);
          return { weather };
        }
      ));
    }
  }, [agent, addTool]);
}
```

### Chat with External Tools
```tsx
function ChatComponent() {
  const { agent } = useAgent({ agentId: 'assistant' });
  const [hasExternalTools, setHasExternalTools] = useState(false);

  const {
    messages,
    externalToolCalls,
    handleExternalToolComplete,
    handleExternalToolCancel,
  } = useChat({
    agentId: 'assistant',
    threadId: 'thread-123',
    agent,
    onToolCalls: (toolCalls) => {
      setHasExternalTools(toolCalls.length > 0);
    }
  });

  return (
    <div>
      {/* Messages */}
      {messages.map(message => <MessageRenderer key={message.messageId} message={message} />)}
      
      {/* External Tool Manager */}
      {externalToolCalls.length > 0 && (
        <ExternalToolManager
          agent={agent}
          toolCalls={externalToolCalls}
          onToolComplete={handleExternalToolComplete}
          onCancel={handleExternalToolCancel}
        />
      )}
    </div>
  );
}
```

### Google Maps Integration
```tsx
function MapsChat() {
  const { agent } = useAgent({ agentId: 'maps-navigator' });
  const mapManagerRef = useRef<GoogleMapsManagerRef>(null);
  const { addTools } = useTools({ agent });

  // Register Google Maps tools
  useEffect(() => {
    if (agent && mapManagerRef.current) {
      const mapTools = [
        createTool(
          'set_map_center',
          'Set the center location of the Google Maps view',
          {
            type: 'object',
            properties: {
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              zoom: { type: 'number', default: 13 }
            },
            required: ['latitude', 'longitude']
          },
          async (input: { latitude: number; longitude: number; zoom?: number }) => {
            return await mapManagerRef.current?.setMapCenter(input);
          }
        )
        // ... other map tools
      ];
      
      addTools(mapTools);
    }
  }, [agent, addTools]);

  return (
    <div className="flex">
      <GoogleMapsManager ref={mapManagerRef} />
      <EmbeddableChat agentId="maps-navigator" agent={agent} threadId="maps-session" />
    </div>
  );
}
```

## 🔄 Migration Guide

### From Legacy External Tool System

#### Before (Legacy)
```tsx
const tools = {
  my_tool: async (toolCall, onComplete) => {
    const result = await doSomething(toolCall.input);
    await onComplete(toolCall.tool_call_id, { result, success: true });
  }
};

<Chat tools={tools} onExternalToolCall={handleToolCall} />
```

#### After (New System)
```tsx
const { agent } = useAgent({ agentId: 'my-agent' });
const { addTool } = useTools({ agent });

useEffect(() => {
  if (agent) {
    addTool(createTool(
      'my_tool',
      'My tool description',
      { /* schema */ },
      async (input) => {
        return await doSomething(input);
      }
    ));
  }
}, [agent, addTool]);

<Chat thread={thread} agent={agent} />
```

### Benefits of New System

1. **Type Safety**: Full TypeScript support with proper type inference
2. **Simplified API**: No more complex tool callbacks and manual result handling
3. **Better Integration**: Tools are properly integrated with the agent system
4. **Automatic Execution**: Tools execute immediately with proper error handling
5. **UI Integration**: External tools automatically trigger appropriate UI interactions
6. **Real-time Updates**: Live status tracking and user feedback

## 🚀 Future Enhancements

### Planned Improvements

1. **Tool Composition**: Allow tools to call other tools
2. **Tool Validation**: Runtime validation of tool parameters using JSON Schema
3. **Tool Caching**: Cache tool results for improved performance
4. **Tool Analytics**: Track tool usage and performance metrics
5. **Tool Marketplace**: Discoverable tool registry for sharing tools

### Performance Optimizations

1. **Lazy Tool Loading**: Load tools on-demand
2. **Tool Bundling**: Bundle related tools for efficient loading
3. **Streaming Results**: Stream large tool results for better UX
4. **Background Execution**: Execute non-UI tools in background workers

## 📊 Testing

### Tool Testing Strategy

```typescript
describe('Tool System', () => {
  test('should register and execute tools', async () => {
    const agent = new Agent(agentDefinition, client);
    
    const testTool = createTool(
      'test_tool',
      'Test tool',
      { type: 'object', properties: {} },
      async () => ({ success: true })
    );
    
    agent.addTool(testTool);
    
    const result = await agent.executeTool({
      tool_call_id: 'test-123',
      tool_name: 'test_tool',
      input: {}
    });
    
    expect(result.success).toBe(true);
    expect(result.result).toEqual({ success: true });
  });
});
```

### Integration Testing

- **End-to-end tool flows**: Test complete tool execution from call to result
- **UI interactions**: Test external tool UI components (approval dialogs, toasts)
- **Error scenarios**: Test tool failures and error recovery
- **Agent interactions**: Test tool execution within agent conversations

## 📝 Documentation

### Updated Documentation

1. **API Reference**: Complete documentation of new tool system
2. **Migration Guide**: Step-by-step migration from legacy system
3. **Examples**: Working examples for common tool patterns
4. **Best Practices**: Guidelines for tool development and registration

### New Documentation

1. **Tool Development Guide**: How to create effective tools
2. **External Tool Integration**: Patterns for integrating with external services
3. **UI Tool Development**: Creating tools that require user interaction
4. **Tool Testing**: Testing strategies for tools and tool systems

This enhancement significantly improves the DistriJS framework's tool system, making it more intuitive, type-safe, and powerful for building AI agent applications with external tool integration.