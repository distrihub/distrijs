// Core Distri Framework

export { Agent } from './agent';
export type { InvokeConfig, InvokeResult } from './agent';

// All types
export type {
  // Core types
  DistriAgent,
  DistriFnTool,
  DistriBaseTool,
  ToolCall,
  ToolResult,
  ModelSettings,
  McpDefinition,
  McpServerType,
  ModelProvider,
  DistriThread,
  Thread,
  ChatProps,
  ConnectionStatus,
  DistriClientConfig,

  // New Distri message types
  DistriMessage,
  DistriPart,
  MessageRole,
  CodeObservationPart,
  ImagePart,
  DataPart,
  ToolCallPart,
  ToolResultPart,
  TextPart,
  PlanPart,
  FileType,
  InvokeContext,
  DistriStreamEvent,
} from './types';

export {
  isDistriMessage,
  isDistriEvent,
} from './types';

export type {
  DistriEvent,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  PlanStartedEvent,
  PlanFinishedEvent,
  PlanPrunedEvent,
  StepStartedEvent,
  StepCompletedEvent,
  ToolExecutionStartEvent,
  ToolExecutionEndEvent,
  ToolRejectedEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  MessageEvent,
  ExecutionResultEvent,
  AgentHandoverEvent,
  FeedbackReceivedEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
} from './events';

// Message converter utilities
export {
  convertA2AMessageToDistri,
  convertDistriMessageToA2A,
  decodeA2AStreamEvent,
  createInvokeContext,
} from './encoder';

// Client
export { DistriClient } from './distri-client';