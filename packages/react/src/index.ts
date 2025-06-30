// Main exports for @distri/react package

export { DistriProvider, useDistri, useDistriClient } from './DistriProvider';
export { useAgents } from './useAgents';
export { useTask } from './useTask';

export type { UseAgentsResult } from './useAgents';
export type { UseTaskOptions, UseTaskResult } from './useTask';

// Re-export types from core for convenience
export type {
  DistriClientConfig,
  AgentCard,
  Task,
  A2AMessage,
  TaskStatus
} from '@distri/core';