// Main exports
export { DistriProvider, useDistri, useDistriClient } from './DistriProvider';
export { useAgent } from './useAgent';
export { useAgents } from './useAgents';
export { useChat } from './useChat';
export { useThreads } from './useThreads';
export { useTools, createTool, createBuiltinTools } from './useTools';

// Components - Main Chat component
export { Chat } from './components/Chat';

// Customizable Message Components - Users can override these
export { 
  UserMessage, 
  AssistantMessage, 
  AssistantWithToolCalls, 
  Tool,
  MessageContainer,
  PlanMessage 
} from './components/MessageComponents';

// Message Renderer - Users can customize this
export { default as MessageRenderer } from './components/MessageRenderer';

// External Tool Manager - For backwards compatibility
export { default as ExternalToolManager } from './components/ExternalToolManager';

// UI Components
export { default as ApprovalDialog } from './components/ApprovalDialog';
export { default as Toast } from './components/Toast';

// Component contexts and theming
export { 
  ChatProvider, 
  useChatConfig, 
  getThemeClasses,
  type ChatTheme,
  type ChatConfig,
  type ChatContextValue
} from './components/ChatContext';

// Built-in handlers for backwards compatibility
export * from './builtinHandlers';
export type { LegacyToolHandler } from './builtinHandlers';

// Types from core (re-exported for convenience)
export type {
  DistriAgent,
  DistriTool,
  ToolCall,
  ToolResult,
  ToolHandler,
  ToolCallState,
  Agent,
  DistriClientConfig,
  DistriError,
  A2AProtocolError,
  ApiError,
  ConnectionError,
  ConnectionStatus,
  Thread,
  DistriThread,
  Message,
  MessageMetadata,
} from '@distri/core';

// Export prop types for message components
export type {
  BaseMessageProps,
  UserMessageProps,
  AssistantMessageProps,
  ToolCallProps,
  AssistantWithToolCallsProps,
  PlanMessageProps,
} from './components/MessageComponents';