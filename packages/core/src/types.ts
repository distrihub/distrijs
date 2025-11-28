// Distri Framework Types - Based on A2A Protocol and SSE
import { AgentSkill, Message, Task, TaskArtifactUpdateEvent, TaskStatusUpdateEvent } from '@a2a-js/sdk/client';
import { DistriEvent } from './events';
import { Agent } from './agent';

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
  created_at: number;
  step_id?: string;
  is_final?: boolean;
}

export interface LlmExecuteOptions {
  thread_id?: string;
  parent_task_id?: string;
  run_id?: string;
  model_settings?: any;
  is_sub_task?: boolean
};
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

export interface UseToolsOptions {
  agent?: Agent;
  externalTools?: DistriBaseTool[];
  executionOptions?: ToolExecutionOptions;
}

export interface ToolExecutionOptions {
  autoExecute?: boolean;
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

export type DistriStreamEvent = DistriMessage | DistriEvent;



/**
 * Context required for constructing A2A messages from DistriMessage
 */
export interface InvokeContext {
  thread_id: string;
  run_id?: string;
  task_id?: string; // A2A taskId to preserve context
  getMetadata?: () => any; // Additional metadata to attach to MessageSendParams
}

/**
 * Distri message parts - equivalent to Rust enum Part
 */

export type TextPart = { part_type: 'text'; data: string }
export type ToolCallPart = { part_type: 'tool_call'; data: ToolCall }
export type ToolResultRefPart = { part_type: 'tool_result'; data: ToolResult }
export type ImagePart = { part_type: 'image'; data: FileType }
export type DataPart = { part_type: 'data'; data: object }
export type DistriPart = TextPart | ToolCallPart | ToolResultRefPart | ImagePart | DataPart;



/**
 * File type for images
 */
export interface FileBytes {
  type: 'bytes';
  mime_type: string;
  data: string; // Base64 encoded data
  name?: string;
}

export interface FileUrl {
  type: 'url';
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
  parameters: object; // JSON Schema
  is_final?: boolean;
  autoExecute?: boolean;
  isExternal?: boolean; // True if frontend handles execution, false if backend handles it
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
  (input: any): Promise<string | number | boolean | null | DistriPart[] | object>;
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
 * Tool result structure that can come from backend or frontend
 */
export interface ToolResult {
  readonly tool_call_id: string;
  readonly tool_name: string;
  readonly parts: readonly DistriPart[];
}

/**
 * Tool result data that goes inside the parts array
 */
export interface ToolResultData {
  result: string | number | boolean | null | object;
  success: boolean;
  error?: string;
}

export function isArrayParts(result: any): boolean {
  return Array.isArray(result) && result[0].part_type
}
/**
 * Type-safe helper to create a successful ToolResult
 * Uses proper DistriPart structure - conversion to backend format happens in encoder
 */
export function createSuccessfulToolResult(
  toolCallId: string,
  toolName: string,
  result: string | number | boolean | null | object | DistriPart[]
): ToolResult {
  const parts = isArrayParts(result) ? result as DistriPart[] : [{
    part_type: 'data' as const,
    data: {
      result,
      success: true,
      error: undefined
    } satisfies ToolResultData
  }];
  return {
    tool_call_id: toolCallId,
    tool_name: toolName,
    parts
  };
}

/**
 * Type-safe helper to create a failed ToolResult
 * Uses proper DistriPart structure - conversion to backend format happens in encoder
 */
export function createFailedToolResult(
  toolCallId: string,
  toolName: string,
  error: string,
  result?: string | number | boolean | null | object
): ToolResult {
  return {
    tool_call_id: toolCallId,
    tool_name: toolName,
    parts: [{
      part_type: 'data' as const,
      data: {
        result: result ?? `Tool execution failed: ${error}`,
        success: false,
        error
      } satisfies ToolResultData
    }]
  };
}

/**
 * Type guard to check if an object is a frontend DistriPart with data
 */
function isDataPart(part: unknown): part is DataPart {
  return (
    typeof part === 'object' &&
    part !== null &&
    'part_type' in part &&
    part.part_type === 'data' &&
    'data' in part
  );
}
/**
 * Type guard to check if data has ToolResultData structure
 */
function isToolResultData(data: unknown): data is ToolResultData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    typeof (data as ToolResultData).success === 'boolean'
  );
}

/**
 * Type-safe helper to extract ToolResultData from a ToolResult
 * Handles both frontend DistriPart format and backend BackendPart format
 */
export function extractToolResultData(toolResult: ToolResult): ToolResultData | null {
  if (!toolResult.parts || !Array.isArray(toolResult.parts) || toolResult.parts.length === 0) {
    return null;
  }

  const firstPart = toolResult.parts[0];

  // Handle frontend DistriPart structure (type field)
  if (isDataPart(firstPart)) {
    const data = firstPart.data;

    // If data is already ToolResultData structure
    if (isToolResultData(data)) {
      return {
        result: data.result,
        success: data.success,
        error: data.error
      };
    }

    // If data is a string, try to parse as JSON
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (isToolResultData(parsed)) {
          return {
            result: parsed.result,
            success: parsed.success,
            error: parsed.error
          };
        }
        // If parsed but not ToolResultData structure, treat as successful result
        return {
          result: parsed,
          success: true,
          error: undefined
        };
      } catch {
        // JSON parsing failed, treat string as successful result
        return {
          result: data,
          success: true,
          error: undefined
        };
      }
    }

    // For other data types, assume successful result
    return {
      result: data,
      success: true,
      error: undefined
    };
  }

  return null;
}


/**
 * Distri-specific Agent type that wraps A2A AgentCard
 */
export interface AgentDefinition {
  /** The name of the agent. */
  name: string;

  id: string;

  /** Optional package identifier (workspace/plugin) that registered the agent */
  package_name?: string | null;

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


  agentType?: string;
  agent_type?: string;

  tools?: DistriBaseTool[];

  browser_config?: BrowserAgentConfig;

}

export interface BrowserAgentConfig {
  enabled?: boolean;
  persist_session?: boolean;
  runtime?: DistriBrowserRuntimeConfig | null;
}

export interface DistriBrowserRuntimeConfig {
  window_size?: [number, number];
  headless?: boolean;
  enable_stealth_mode?: boolean;
  enable_real_emulation?: boolean;
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
  context_size: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  provider: ModelProviderConfig;
  /** Additional parameters for the agent, if any. */
  parameters?: any;

  /** The format of the response, if specified. */
  response_format?: any;
}

export type McpServerType = 'tool' | 'agent';

export type ModelProviderName = 'openai' | 'openai_compat' | 'vllora' | string;

export type ModelProviderConfig =
  | { name: 'openai' }
  | { name: 'openai_compat'; base_url: string; api_key?: string; project_id?: string }
  | { name: 'vllora'; base_url?: string }
  | { name: string;[key: string]: any };

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

export interface SpeechToTextConfig {
  model?: 'whisper-1';
  language?: string;
  temperature?: number;
}

export interface StreamingTranscriptionOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
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

export interface LLMResponse {
  finish_reason: string;
  content: string;
  tool_calls: ToolCall[];
  token_usage: number;
  tools?: any[];
}

export interface ExternalMcpServer {
  name: string;
  [key: string]: any;
}

export interface ServerConfig {
  base_url?: string;
  host?: string;
  port?: number;
  [key: string]: any;
}

export interface DistriConfiguration {
  name: string;
  version: string;
  description?: string;
  license?: string;
  working_directory?: string;
  agents?: string[];
  mcp_servers?: ExternalMcpServer[];
  server?: ServerConfig;
  model_settings?: ModelSettings;
  analysis_model_settings?: ModelSettings;
  keywords?: string[];
  [key: string]: any;
}

export interface ConfigurationMeta {
  base_path: string;
  overrides_path: string;
  overrides_active: boolean;
}

export interface ConfigurationResponse {
  configuration: DistriConfiguration;
  meta: ConfigurationMeta;
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

export type DistriChatMessage = DistriEvent | DistriMessage;
