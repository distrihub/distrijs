// Distri Framework Types - Based on A2A Protocol and SSE
import { AgentSkill, Message, Task, TaskArtifactUpdateEvent, TaskStatusUpdateEvent } from '@a2a-js/sdk/client';

/**
 * Distri-specific Agent type that wraps A2A AgentCard
 */
export interface DistriAgent {
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

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'online' | 'offline';
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
  agent: Agent;
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
  interceptor?: (input: RequestInfo | URL, init?: RequestInit) => Promise<RequestInfo | URL>;
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