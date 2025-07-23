// Core hooks
export { useAgent } from './useAgent';
export { useAgents } from './useAgents';
export { useChat } from './useChat';
export { useThreads } from './useThreads';

// Components
export { default as Chat } from './components/Chat';
export { 
  UserMessage, 
  AssistantMessage, 
  AssistantWithToolCalls, 
  Tool,
  MessageContainer 
} from './components/MessageComponents';
export { default as MessageRenderer } from './components/MessageRenderer';
export { default as ExternalToolManager } from './components/ExternalToolManager';
export { default as Toast } from './components/Toast';
export { default as ApprovalDialog } from './components/ApprovalDialog';

// Context and theming
export { 
  ChatProvider, 
  useChatConfig, 
  getThemeClasses,
  type ChatTheme,
  type ChatConfig,
  type ChatContextValue
} from './components/ChatContext';

// Provider
export { DistriProvider, useDistri, useDistriClient } from './DistriProvider';

// Built-in handlers
export * from './builtinHandlers';

// Re-export types from core
export type {
  DistriAgent,
  DistriThread,
  Message,
  MessageMetadata,
  ToolHandler,
  ToolResult,
  ToolCall,
  ToolCallState,
} from '@distri/core';