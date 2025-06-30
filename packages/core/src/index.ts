// Main exports for @distri/core package

export { DistriClient } from './distri-client';

export * from './types';

// Re-export only the client-side types from @a2a-js/sdk
export type {
  AgentCard,
  Message,
  Task,
  TaskState,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  JSONRPCRequest,
  JSONRPCResponse,
  MessageSendParams,
  TextPart,
  FilePart,
  DataPart,
  Part
} from "@a2a-js/sdk";

// Export event types and decoder
export type {
  TextDeltaEvent,
  TaskStatusChangedEvent,
  TaskCompletedEvent,
  TaskErrorEvent,
  TaskCanceledEvent,
  AgentStatusChangedEvent,
  DistriEvent
} from './distri-client';

export { decodeSSEEvent } from './distri-client';
