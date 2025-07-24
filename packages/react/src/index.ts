// Main exports
export { DistriProvider, useDistri } from './DistriProvider';
export { useAgent } from './useAgent';
export { useAgents } from './useAgents';
export { useChat } from './useChat';
export { useThreads } from './useThreads';
export { useTools, createTool, createBuiltinTools } from './useTools';

// Components
export { Chat } from './components/Chat';
export { default as ApprovalDialog } from './components/ApprovalDialog';
export { default as Toast } from './components/Toast';

// Component contexts
export { ChatProvider, useChatConfig } from './components/ChatContext';

// Types from core (re-exported for convenience)
export type {
  DistriAgent,
  DistriTool,
  ToolCall,
  ToolResult,
  ToolHandler,
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