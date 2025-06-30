import { EventEmitter } from 'eventemitter3';
import { AgentCard, Message, TaskStatusUpdateEvent, TextPart, JSONRPCRequest, JSONRPCResponse, MessageSendParams, Task } from '@a2a-js/sdk';
import {
  DistriClientConfig,
  DistriError,
  ApiError,
  A2AProtocolError
} from './types';

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

      const data: AgentCard[] = await response.json();
      return data;
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
    const jsonRpcRequest: JSONRPCRequest = {
      jsonrpc: "2.0",
      method: "message/send",
      params: {
        message: params.message,
        configuration: params.configuration,
        metadata: params.metadata
      },
      id: this.generateRequestId()
    };

    return this.sendJsonRpcRequest(agentId, jsonRpcRequest);
  }

  /**
   * Send a streaming message to an agent
   */
  async sendStreamingMessage(agentId: string, params: MessageSendParams): Promise<JSONRPCResponse> {
    const jsonRpcRequest: JSONRPCRequest = {
      jsonrpc: "2.0",
      method: "message/send_streaming",
      params: {
        message: params.message,
        configuration: params.configuration,
        metadata: params.metadata
      },
      id: this.generateRequestId()
    };

    return this.sendJsonRpcRequest(agentId, jsonRpcRequest);
  }

  /**
   * Create a task (convenience method)
   */
  async createTask(agentId: string, user_message: Message): Promise<Task> {
    const params: MessageSendParams = {
      message: user_message,
      configuration: {
        acceptedOutputModes: ['text/plain'],
        blocking: true,
      }
    };

    const response = await this.sendMessage(agentId, params);

    if (typeof response === 'object' && 'error' in response) {
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
    // This would be implemented via JSON-RPC to the agent handling the task
    // For now, we'll assume there's a cancel endpoint or method
    // Note: We'd need to know which agent is handling this task
    // This is simplified for the example
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
        const data: DistriEvent = JSON.parse(event.data);
        this.handleEvent(data);
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
    // In the actual implementation, you might subscribe to specific task events
    // For now, we'll rely on agent-level subscriptions
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
  private async sendJsonRpcRequest(agentId: string, request: JSONRPCRequest): Promise<JSONRPCResponse> {
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

      if (typeof jsonResponse === 'object' && 'error' in jsonResponse) {
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