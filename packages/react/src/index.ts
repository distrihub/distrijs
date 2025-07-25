// Core exports
export * from '@distri/core';

// React components
export { default as Chat } from './components/Chat';
export { EmbeddableChat } from './components/EmbeddableChat';
export { default as ExternalToolManager } from './components/ExternalToolManager';
export { default as MessageRenderer } from './components/MessageRenderer';
export { default as ApprovalDialog } from './components/ApprovalDialog';
export { default as Toast } from './components/Toast';

// Provider and context
export { DistriProvider } from './DistriProvider';

// Hooks
export { useAgent } from './useAgent';
export { useAgents } from './useAgents';
export { useChat } from './useChat';
export { useThreads } from './useThreads';
export { useTools } from './useTools';

// Tool utilities
export { 
  createBuiltinTools, 
  createTool,
  builtinTools,
  approvalRequestTool,
  toastTool,
  inputRequestTool,
  confirmTool,
  notifyTool
} from './builtinHandlers';

// Utility functions
export { extractExternalToolCalls } from './utils/toolCallUtils';

// UI components (optional)
export * from './components/ui/button';
export * from './components/ui/input';
export * from './components/ui/textarea';

// Re-export types for convenience
export type {
  DistriTool,
  ToolCall,
  ToolResult,
  ToolHandler,
  DistriAgent,
  DistriThread,
  MessageMetadata
} from '@distri/core';

// Component prop types for customization
export type { ChatProps } from './components/Chat';
export type { EmbeddableChatProps } from './components/EmbeddableChat';