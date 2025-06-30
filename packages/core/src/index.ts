// Main exports for @distri/core package

export { DistriClient } from './distri-client';

export * from './types';

// Re-export commonly used types for convenience
export type {
  DistriClientConfig,
  AgentCard,
  Task,
  A2AMessage,
  MessageSendParams,
  DistriEvent,
  TaskStatus,
  SubscriptionOptions
} from './types';