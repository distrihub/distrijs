// Main exports for @distri/react package

export { DistriProvider, useDistri, useDistriClient } from './DistriProvider';
export { useAgents } from './useAgents';
export { useChat } from './useChat';
export { useThreads } from './useThreads';
export { useAgent, createBuiltinToolHandlers, createBuiltinApprovalHandler } from './useAgent';

export type { UseAgentsResult } from './useAgents';
export type { UseChatOptions, UseChatResult } from './useChat';
export type { UseAgentOptions, UseAgentResult } from './useAgent';

// Re-export types from core for convenience
export type {
  DistriClientConfig,
  DistriAgent,
  DistriThread,
  AgentCard,
  Task,
  Message,
  TaskStatus,
  MessageSendParams,
  ExternalTool,
  ToolCall,
  MessageMetadata,
  ApprovalMode,
  InvokeConfig,
  InvokeResult,
  InvokeStreamResult,
  ExternalToolHandler,
  ApprovalHandler
} from '@distri/core';

// Re-export Agent class
export { Agent, DistriClient, APPROVAL_REQUEST_TOOL_NAME } from '@distri/core';