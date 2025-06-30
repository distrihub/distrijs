// Main exports for @distri/react package

export { DistriProvider, useDistri, useDistriClient } from './DistriProvider';
export { useThreads } from './useThreads';
export { useMessages } from './useMessages';

export type { UseThreadsResult } from './useThreads';
export type { UseMessagesOptions, UseMessagesResult } from './useMessages';

// Re-export types from core for convenience
export type {
  DistriClientConfig,
  DistriNode,
  Thread,
  Message,
  User,
  ConnectionStatus
} from '@distri/core';