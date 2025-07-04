// Main exports for @distri/react package

export { DistriProvider, useDistri, useDistriClient } from './DistriProvider';
export { useAgents } from './useAgents';
export { useChat } from './useChat';
export { useThreads } from './useThreads';

export type { UseAgentsResult } from './useAgents';
export type { UseChatOptions, UseChatResult } from './useChat';

// Re-export types from core for convenience
export type {
  DistriClientConfig,
  DistriAgent,
  DistriThread,
  AgentCard,
  Task,
  Message,
  TaskStatus,
  MessageSendParams
} from '@distri/core';