// Main client
export { DistriClient } from './distri-client';

// Enhanced agent class
export { Agent } from './agent';

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

// Agent types
export type {
  InvokeConfig,
  ToolCallState,
  InvokeResult,
} from './agent';

// Constants
export { APPROVAL_REQUEST_TOOL_NAME } from './types';