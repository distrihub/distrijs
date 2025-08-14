// Distri Framework Types - Based on A2A Protocol and SSE
import { AgentSkill, Message, Task, TaskArtifactUpdateEvent, TaskStatusUpdateEvent } from '@a2a-js/sdk/client';
import { DistriEvent } from './events';

/**
 * Message roles supported by Distri
 */
export type MessageRole = 'system' | 'assistant' | 'user' | 'tool';

/**
 * Distri-specific message structure with parts
 */
export interface DistriMessage {
  id: string;
  role: MessageRole;
  parts: DistriPart[];
  created_at?: string;
  step_id?: string;
  is_final?: boolean;
}

export interface AssistantWithToolCalls {
  id: string;
  type: 'llm_response';
  timestamp: number;
  content: string;
  tool_calls: any[];
  step_id?: string;
  success: boolean;
  rejected: boolean;
  is_external: boolean;
  reason: string | null;
}

export interface ToolResults {
  id: string;
  type: 'tool_results';
  timestamp: number;
  results: any[];
  step_id?: string;
  success: boolean;
  rejected: boolean;
  reason: string | null;
}

export interface GenericArtifact {
  id: string;
  type: 'artifact';
  timestamp: number;
  data: any;
  artifactId: string;
  name: string;
  description: string | null;
}

export interface DistriPlan {
  id: string;
  type: 'plan';
  timestamp: number;
  reasoning: string;
  steps: PlanStep[];
}

export interface BasePlanStep {
  id: string;
}

export interface ThoughtPlanStep extends BasePlanStep {
  type: 'thought';
  message: string;
}

export interface ActionPlanStep extends BasePlanStep {
  type: 'action';
  action: PlanAction;
}

export interface CodePlanStep extends BasePlanStep {
  type: 'code';
  code: string;
  language: string;
}

export interface FinalResultPlanStep extends BasePlanStep {
  type: 'final_result';
  content: string;
  tool_calls: any[]; // Vec<ToolCall> in Rust
}

// Action can be either a tool call or an LLM call
export interface PlanAction {
  tool_name?: string;
  input?: string;
  prompt?: string;
  context?: any[];
  tool_calling_config?: any;
}

export type PlanStep = ThoughtPlanStep | ActionPlanStep | CodePlanStep | FinalResultPlanStep;

// Legacy types for backward compatibility
export interface LlmPlanStep extends BasePlanStep {
  type: 'llm_call';
  prompt: string;
  context: any[];
}

export interface BatchToolCallsStep extends BasePlanStep {
  type: 'batch_tool_calls';
  tool_calls: any[];
}

export interface ThoughtStep extends BasePlanStep {
  type: 'thought';
  message: string;
}

export interface ReactStep extends BasePlanStep {
  type: 'react_step';
  thought: string;
  action: string;
}

export type DistriArtifact = AssistantWithToolCalls | ToolResults | GenericArtifact | DistriPlan;

export type DistriStreamEvent = DistriMessage | DistriEvent | DistriArtifact;



/**
 * Context required for constructing A2A messages from DistriMessage
 */
export interface InvokeContext {
  thread_id: string;
  run_id?: string;
  getMetadata?: () => any; // Additional metadata to attach to MessageSendParams
}

/**
 * Distri message parts - equivalent to Rust enum Part
 */

export type TextPart = { type: 'text'; data: string }
export type ToolCallPart = { type: 'tool_call'; data: ToolCall }
export type ToolResultPart = { type: 'tool_result'; data: ToolResult }
export type ImagePart = { type: 'image'; data: FileType }
export type DataPart = { type: 'data'; data: any }
export type DistriPart = TextPart | ToolCallPart | ToolResultPart | ImagePart | DataPart;



/**
 * File type for images
 */
export interface FileBytes {
  mime_type: string;
  data: string; // Base64 encoded data
  name?: string;
}

export interface FileUrl {
  mime_type: string;
  url: string; // File Url
  name?: string;
}
export type FileType = FileBytes | FileUrl;



/**
 * Tool definition interface following AG-UI pattern
 */
export interface DistriBaseTool {
  name: string;
  type: 'function' | 'ui';
  description: string;
  input_schema: object; // JSON Schema
  is_final?: boolean;
  autoExecute?: boolean;
}

export interface DistriFnTool extends DistriBaseTool {
  type: 'function';
  handler: ToolHandler;
  onToolComplete?: (toolCallId: string, toolResult: ToolResult) => void;
}

/**
 * Tool handler function
 */
export interface ToolHandler {
  (input: any): Promise<string | number | boolean | null | object>;
}


/**
 * Tool call from agent
 */
export interface ToolCall {
  tool_call_id: string;
  tool_name: string;
  input: any; // Parsed JSON input
}

/**
 * Tool result for responding to tool calls
 */
export interface ToolResult {
  tool_call_id: string;
  tool_name: string;
  result: string | number | boolean | null;
  success: boolean;
  error?: string;
}


/**
 * Distri-specific Agent type that wraps A2A AgentCard
 */
export interface AgentDefinition {
  /** The name of the agent. */
  name: string;

  id: string;

  /** A brief description of the agent's purpose. */
  description?: string;

  /** The version of the agent. */
  version?: string;

  /** The system prompt for the agent, if any. */
  system_prompt?: string | null;

  /** A list of MCP server definitions associated with the agent. */
  mcp_servers?: McpDefinition[];

  /** Settings related to the model used by the agent. */
  model_settings?: ModelSettings;

  /** The size of the history to maintain for the agent. */
  history_size?: number;

  /** The planning configuration for the agent, if any. */
  plan?: any;

  /** A2A-specific fields */
  icon_url?: string;

  max_iterations?: number;

  skills?: AgentSkill[];

  /** List of sub-agents that this agent can transfer control to */
  sub_agents?: string[];

}

export interface McpDefinition {
  /** The filter applied to the tools in this MCP definition. */
  filter?: string[];

  /** The name of the MCP server. */
  name: string;

  /** The type of the MCP server (Tool or Agent). */
  type?: McpServerType; // Use 'type' here instead of 'r#type'
}

export interface ModelSettings {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_iterations: number;
  provider: ModelProvider;
  /** Additional parameters for the agent, if any. */
  parameters?: any;

  /** The format of the response, if specified. */
  response_format?: any;
}

export type McpServerType = 'tool' | 'agent';

export type ModelProvider = 'openai' | 'aigateway';

/**
 * Distri Thread type for conversation management
 */
export interface DistriThread {
  id: string;
  title: string;
  agent_id: string;
  agent_name: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
}

export interface Thread {
  id: string;
  title: string;
  agent_id: string;
  agent_name: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
}

export interface ChatProps {
  thread: Thread;
  agent: AgentDefinition;
  onThreadUpdate?: () => void;
}

/**
 * Connection Status
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Distri Client Configuration
 */
export interface DistriClientConfig {
  baseUrl: string;
  apiVersion?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  debug?: boolean;
  headers?: Record<string, string>;
  interceptor?: (init?: RequestInit) => Promise<RequestInit | undefined>;
}

/**
 * Error Types
 */
export class DistriError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DistriError';
  }
}

export class A2AProtocolError extends DistriError {
  constructor(message: string, details?: any) {
    super(message, 'A2A_PROTOCOL_ERROR', details);
    this.name = 'A2AProtocolError';
  }
}

export class ApiError extends DistriError {
  constructor(message: string, public statusCode: number, details?: any) {
    super(message, 'API_ERROR', details);
    this.name = 'ApiError';
  }
}

export class ConnectionError extends DistriError {
  constructor(message: string, details?: any) {
    super(message, 'CONNECTION_ERROR', details);
    this.name = 'ConnectionError';
  }
}

// Re-export A2A types for convenience
export type { AgentCard, Message, Task, TaskStatus, MessageSendParams, TaskStatusUpdateEvent, TaskArtifactUpdateEvent } from '@a2a-js/sdk/client';


export type A2AStreamEventData = Message | TaskStatusUpdateEvent | TaskArtifactUpdateEvent | Task;


export function isDistriMessage(event: DistriStreamEvent): event is DistriMessage {
  return 'id' in event && 'role' in event && 'parts' in event;
}

export function isDistriEvent(event: DistriStreamEvent): event is DistriEvent {
  return 'type' in event && 'data' in event;
}

export function isDistriPlan(event: DistriStreamEvent): event is DistriPlan {
  return 'steps' in event && Array.isArray(event.steps) && 'reasoning' in event;
}

export function isDistriArtifact(event: DistriStreamEvent): event is DistriArtifact {
  return 'type' in event && 'timestamp' in event && 'id' in event;
}

export type DistriChatMessage = DistriEvent | DistriMessage | DistriArtifact;