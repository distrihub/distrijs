// Main client
export { DistriClient } from './distri-client';

// Enhanced agent class
export { Agent } from './agent';

// Event streaming
export { EventStream } from './stream';

// Event types
export * from './events';

// All types
export type {
  // Core types
  DistriAgent,
  DistriTool,
  ToolCall,
  ToolResult,
  ToolHandler,
  ApprovalMode,
  MessageMetadata,
  ModelSettings,
  McpDefinition,
  McpServerType,
  ModelProvider,
  DistriThread,
  Thread,
  ChatProps,
  ConnectionStatus,
  DistriClientConfig,
  
  // Error types
  DistriError,
  A2AProtocolError,
  ApiError,
  ConnectionError,
  
  // Agent types
  InvokeConfig,
  ToolCallState,
  InvokeResult,
  
  // A2A re-exports
  AgentCard,
  Message,
  Task,
  TaskStatus,
  MessageSendParams,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  A2AStreamEventData,
} from './types';

// Constants
export { APPROVAL_REQUEST_TOOL_NAME } from './types';