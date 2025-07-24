// Main exports
export { DistriProvider, useDistri, useDistriClient } from './DistriProvider';
export { useAgent } from './useAgent';
export { useAgents } from './useAgents';
export { useChat } from './useChat';
export { useThreads } from './useThreads';
export { useTools, createTool, createBuiltinTools } from './useTools';

// ============================================================================
// MAIN CHAT COMPONENTS - Use these for most applications
// ============================================================================

// Primary chat component - ready to use out of the box
export { ChatContainer } from './components/ChatContainer';
export type { ChatContainerProps } from './components/ChatContainer';

// Specialized chat variants
export { EmbeddableChat } from './components/EmbeddableChat';
export type { EmbeddableChatProps } from './components/EmbeddableChat';

export { FullChat } from './components/FullChat';
export type { FullChatProps } from './components/FullChat';

// ============================================================================
// CUSTOMIZABLE MESSAGE COMPONENTS - Override these for custom UIs
// ============================================================================

export { 
  UserMessage, 
  AssistantMessage, 
  AssistantWithToolCalls, 
  Tool,
  MessageContainer,
  PlanMessage 
} from './components/MessageComponents';

// Message Renderer - Advanced markdown and code rendering
export { default as MessageRenderer } from './components/MessageRenderer';

// ============================================================================
// UTILITY FUNCTIONS - Use these when building custom components
// ============================================================================

export {
  shouldDisplayMessage,
  extractTextFromMessage,
  getMessageType,
  formatTimestamp,
  scrollToBottom
} from './utils/messageUtils';

// ============================================================================
// UI COMPONENTS
// ============================================================================

export { default as ApprovalDialog } from './components/ApprovalDialog';
export { default as Toast } from './components/Toast';

// ============================================================================
// BACKWARDS COMPATIBILITY
// ============================================================================

// Legacy Chat component (deprecated - use ChatContainer instead)
export { Chat } from './components/Chat';

// External Tool Manager - For backwards compatibility
export { default as ExternalToolManager } from './components/ExternalToolManager';

// Built-in handlers for backwards compatibility
export * from './builtinHandlers';
export type { LegacyToolHandler } from './builtinHandlers';

// ============================================================================
// CONTEXT & THEMING
// ============================================================================

export { 
  ChatProvider, 
  useChatConfig, 
  getThemeClasses,
  type ChatTheme,
  type ChatConfig,
  type ChatContextValue
} from './components/ChatContext';

// ============================================================================
// TYPES - Re-exported from core for convenience
// ============================================================================

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