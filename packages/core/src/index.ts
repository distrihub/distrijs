// Core client
export { DistriClient } from './distri-client';
export { Agent } from './agent';
export type { InvokeConfig, InvokeResult } from './agent';

// All types
export type {
  // Core types
  DistriAgent,
  DistriBaseTool,
  DistriFnTool,
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
  
  // Task message types
  TaskMessage,
  TaskMessageData,
  ExecutionStep,
  PlanStartedData,
  PlanFinishedData,
  StepStartedData,
  StepCompletedData,
  ToolExecutionStartData,
  ToolExecutionEndData,
  ToolRejectedData,
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
  convertA2APartToDistri,
  convertDistriPartToA2A,
  extractTextFromDistriMessage,
  extractToolCallsFromDistriMessage,
  extractToolResultsFromDistriMessage,
} from './encoder';


export { uuidv4 } from './distri-client';