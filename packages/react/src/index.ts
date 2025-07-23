// Main exports for @distri/react package

// Hooks
export { useChat } from './useChat';
export { useAgent, createBuiltinApprovalHandler } from './useAgent';
export { useAgents } from './useAgents';
export { useThreads } from './useThreads';
export { DistriProvider, useDistri, useDistriClient } from './DistriProvider';

// New components for external tool handling
export { default as Toast } from './components/Toast';
export { default as ApprovalDialog } from './components/ApprovalDialog';
export { default as ExternalToolManager } from './components/ExternalToolManager';

// Builtin handlers
export {
  createBuiltinToolHandlers,
  processExternalToolCalls,
  initializeBuiltinHandlers,
  clearPendingToolCalls
} from './builtinHandlers';

// Utility functions
export {
  extractExternalToolCalls
} from './utils/toolCallUtils';
export type { ToolCallState } from './utils/toolCallUtils';

// Re-export core types
export type {
  DistriClientConfig,
  DistriAgent,
  DistriThread,
  Message,
  MessageMetadata,
  ToolCall,
  ToolResult,
  ToolHandler,
  ExternalTool,
  ApprovalHandler,
  ApprovalMode,
  InvokeConfig,
  InvokeResult,
  InvokeStreamResult,
  Task,
  TaskStatus,
  MessageSendParams
} from '@distri/core';

// Re-export core classes and constants
export {
  DistriClient,
  APPROVAL_REQUEST_TOOL_NAME,
  Agent
} from '@distri/core';