// Main exports for @distri/react package

export { DistriProvider, useDistri, useDistriClient } from './DistriProvider';
export { useAgents } from './useAgents';
export { useTask } from './useTask';
export { useThreads, useThreadMessages } from './useThreads';

export type { UseAgentsResult } from './useAgents';
export type { UseTaskOptions, UseTaskResult } from './useTask';
export type { UseThreadsResult, UseThreadMessagesOptions, UseThreadMessagesResult } from './useThreads';

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