import { EventEmitter } from 'eventemitter3';
import { 
  AgentCard, 
  Message, 
  TaskStatusUpdateEvent, 
  TaskArtifactUpdateEvent, 
  TextPart, 
  JSONRPCRequest, 
  JSONRPCResponse, 
  MessageSendParams, 
  Task,
  TaskState
} from '@a2a-js/sdk';
import {
  DistriClientConfig,
  DistriError,
  ApiError,
  A2AProtocolError,
  ConnectionError
} from './types';

// Additional event types for SSE
export interface TextDeltaEvent {
  type: 'text_delta';
  task_id: string;
  delta: string;
  timestamp: number;
}

export interface TaskStatusChangedEvent {
  type: 'task_status_changed';
  task_id: string;
  status: TaskState;
  timestamp: number;
}

export interface TaskCompletedEvent {
  type: 'task_completed';
  task_id: string;
  timestamp: number;
}

export interface TaskErrorEvent {
  type: 'task_error';
  task_id: string;
  error: string;
  timestamp: number;
}

export interface TaskCanceledEvent {
  type: 'task_canceled';
  task_id: string;
  timestamp: number;
}

export interface AgentStatusChangedEvent {
  type: 'agent_status_changed';
  agent_id: string;
  status: string;
  timestamp: number;
}

export type DistriEvent = 
  | TextDeltaEvent 
  | TaskStatusChangedEvent 
  | TaskCompletedEvent 
  | TaskErrorEvent 
  | TaskCanceledEvent 
  | AgentStatusChangedEvent
  | TaskStatusUpdateEvent
  | TaskArtifactUpdateEvent;

// Helper to decode SSE events
export function decodeSSEEvent(data: string): DistriEvent | null {
  try {
    const parsed = JSON.parse(data);
    
    // Validate that it has the expected structure
    if (!parsed || typeof parsed !== 'object' || !parsed.type) {
      return null;
    }

    // Basic validation for required fields
    switch (parsed.type) {
      case 'text_delta':
        if (parsed.task_id && typeof parsed.delta === 'string') {
          return parsed as TextDeltaEvent;
        }
        break;
      case 'task_status_changed':
        if (parsed.task_id && parsed.status) {
          return parsed as TaskStatusChangedEvent;
        }
        break;
      case 'task_completed':
      case 'task_error':
      case 'task_canceled':
        if (parsed.task_id) {
          return parsed as TaskCompletedEvent | TaskErrorEvent | TaskCanceledEvent;
        }
        break;
      case 'agent_status_changed':
        if (parsed.agent_id) {
          return parsed as AgentStatusChangedEvent;
        }
        break;
      case 'status-update':
        // This is from A2A SDK
        return parsed as TaskStatusUpdateEvent;
      case 'artifact-update':
        // This is from A2A SDK
        return parsed as TaskArtifactUpdateEvent;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to decode SSE event:', error);
    return null;
  }
}

/**
 * Main Distri Client for interacting with Distri server
 * Uses HTTP API with JSON-RPC and Server-Sent Events
 */
export class DistriClient extends EventEmitter {
  private config: Required<DistriClientConfig>;
  private eventSources = new Map<string, EventSource>();
  private requestIdCounter = 0;

  constructor(config: DistriClientConfig) {
    super();

    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''),
      apiVersion: config.apiVersion || 'v1',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      debug: config.debug || false,
      headers: config.headers || {}
    };
  }

  /**
   * Get all available agents
   */
  async getAgents(): Promise<AgentCard[]> {
    try {
      const response = await this.fetch(`/api/${this.config.apiVersion}/agents`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch agents: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      // Handle both array response and object with agents property
      return Array.isArray(data) ? data : data.agents || [];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to fetch agents', 'FETCH_ERROR', error);
    }
  }

  /**
   * Get specific agent card
   */
  async getAgent(agentId: string): Promise<AgentCard> {
    try {
      const response = await this.fetch(`/api/${this.config.apiVersion}/agents/${agentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(`Agent not found: ${agentId}`, 404);
        }
        throw new ApiError(`Failed to fetch agent: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to fetch agent ${agentId}`, 'FETCH_ERROR', error);
    }
  }

  /**
   * Send a message to an agent using JSON-RPC
   */
  async sendMessage(agentId: string, params: MessageSendParams): Promise<JSONRPCResponse> {
    const jsonRpcRequest = {
      jsonrpc: "2.0" as const,
      method: "message/send" as const,
      params,
      id: this.generateRequestId()
    };

    return this.sendJsonRpcRequest(agentId, jsonRpcRequest);
  }

  /**
   * Send a streaming message to an agent
   */
  async sendStreamingMessage(agentId: string, params: MessageSendParams): Promise<JSONRPCResponse> {
    const jsonRpcRequest = {
      jsonrpc: "2.0" as const,
      method: "message/stream" as const,
      params,
      id: this.generateRequestId()
    };

    return this.sendJsonRpcRequest(agentId, jsonRpcRequest);
  }

  /**
   * Create a task (convenience method)
   */
  async createTask(agentId: string, message: Message): Promise<Task> {
    const params: MessageSendParams = {
      message,
      configuration: {
        acceptedOutputModes: ['text/plain'],
        blocking: true,
      }
    };

    const response = await this.sendMessage(agentId, params);

    if ('error' in response) {
      throw new A2AProtocolError(response.error.message, response.error);
    }

    return response.result as Task;
  }

  /**
   * Get task details
   */
  async getTask(taskId: string): Promise<Task> {
    try {
      const response = await this.fetch(`/api/${this.config.apiVersion}/tasks/${taskId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(`Task not found: ${taskId}`, 404);
        }
        throw new ApiError(`Failed to fetch task: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to fetch task ${taskId}`, 'FETCH_ERROR', error);
    }
  }

  /**
   * Cancel a task
   */
  async cancelTask(_taskId: string): Promise<void> {
    throw new DistriError('Task cancellation not yet implemented', 'NOT_IMPLEMENTED');
  }

  /**
   * Subscribe to agent events via Server-Sent Events
   */
  subscribeToAgent(agentId: string): EventSource {
    const existingSource = this.eventSources.get(agentId);
    if (existingSource) {
      return existingSource;
    }

    const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/agents/${agentId}/events`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      this.debug(`Connected to agent ${agentId} event stream`);
      this.emit('agent_stream_connected', agentId);
    };

    eventSource.onmessage = (event) => {
      try {
        const decodedEvent = decodeSSEEvent(event.data);
        if (decodedEvent) {
          this.handleEvent(decodedEvent);
        }
      } catch (error) {
        this.debug('Failed to parse SSE event:', error);
      }
    };

    eventSource.onerror = (error) => {
      this.debug(`SSE error for agent ${agentId}:`, error);
      this.emit('agent_stream_error', agentId, error);
    };

    this.eventSources.set(agentId, eventSource);
    return eventSource;
  }

  /**
   * Subscribe to task events
   */
  subscribeToTask(taskId: string): void {
    this.emit('task_subscribed', taskId);
  }

  /**
   * Unsubscribe from agent events
   */
  unsubscribeFromAgent(agentId: string): void {
    const eventSource = this.eventSources.get(agentId);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(agentId);
      this.emit('agent_stream_disconnected', agentId);
    }
  }

  /**
   * Close all connections
   */
  disconnect(): void {
    this.eventSources.forEach((eventSource) => {
      eventSource.close();
    });
    this.eventSources.clear();
  }

  /**
   * Send a JSON-RPC request to an agent
   */
  private async sendJsonRpcRequest(agentId: string, request: any): Promise<JSONRPCResponse> {
    try {
      const response = await this.fetch(`/api/${this.config.apiVersion}/agents/${agentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new ApiError(`JSON-RPC request failed: ${response.statusText}`, response.status);
      }

      const jsonResponse: JSONRPCResponse = await response.json();

      if ('error' in jsonResponse) {
        throw new A2AProtocolError(jsonResponse.error.message, jsonResponse.error);
      }

      return jsonResponse;
    } catch (error) {
      if (error instanceof ApiError || error instanceof A2AProtocolError) {
        throw error;
      }
      throw new DistriError('JSON-RPC request failed', 'RPC_ERROR', error);
    }
  }

  /**
   * Handle incoming SSE events
   */
  private handleEvent(event: DistriEvent): void {
    this.debug('Received event:', event);
    
    // Handle different event types
    if ('type' in event) {
      // Emit the specific event type for custom events
      this.emit(event.type, event);
    } else if ('kind' in event) {
      // Handle A2A SDK events (TaskStatusUpdateEvent, TaskArtifactUpdateEvent)
      this.emit(event.kind, event);
    }
    
    // Also emit a generic 'event' for any listeners
    this.emit('event', event);
  }

  /**
   * Enhanced fetch with retry logic
   */
  private async fetch(path: string, options?: RequestInit): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...this.config.headers,
            ...options?.headers
          }
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.retryAttempts) {
          this.debug(`Request failed (attempt ${attempt + 1}), retrying in ${this.config.retryDelay}ms...`);
          await this.delay(this.config.retryDelay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${++this.requestIdCounter}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Debug logging
   */
  private debug(...args: any[]): void {
    if (this.config.debug) {
      console.log('[DistriClient]', ...args);
    }
  }

  /**
   * Helper method to create A2A messages
   */
  static createMessage(
    messageId: string,
    text: string,
    role: 'agent' | 'user' = 'user',
    contextId?: string
  ): Message {
    return {
      messageId,
      role,
      parts: [{ kind: 'text', text }],
      contextId,
      kind: 'message'
    };
  }

  /**
   * Helper method to create message send parameters
   */
  static createMessageParams(
    message: Message,
    configuration?: MessageSendParams['configuration']
  ): MessageSendParams {
    return {
      message,
      configuration: {
        acceptedOutputModes: ['text/plain'],
        blocking: true,
        ...configuration
      }
    };
  }
}