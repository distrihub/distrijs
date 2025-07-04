import {
  A2AClient,
  AgentCard,
  Message,
  MessageSendParams,
  Task,
  SendMessageResponse,
  GetTaskResponse,

} from '@a2a-js/sdk/client';
import {
  DistriClientConfig,
  DistriError,
  ApiError,
  A2AProtocolError,
  DistriAgent,
  DistriThread,
  A2AStreamEventData
} from './types';
/**
 * Enhanced Distri Client that wraps A2AClient and adds Distri-specific features
 */
export class DistriClient {
  private config: Required<DistriClientConfig>;
  private agentClients = new Map<string, A2AClient>();
  private agentCards = new Map<string, AgentCard>();

  constructor(config: DistriClientConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''),
      apiVersion: config.apiVersion || 'v1',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      debug: config.debug || false,
      headers: config.headers || {}
    };

    this.debug('DistriClient initialized with config:', this.config);
  }

  /**
   * Get all available agents from the Distri server
   */
  async getAgents(): Promise<DistriAgent[]> {
    try {
      const response = await this.fetch(`/api/${this.config.apiVersion}/agents`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch agents: ${response.statusText}`, response.status);
      }

      const agentCards: AgentCard[] = await response.json();

      // Cache agent cards for later A2AClient creation
      agentCards.forEach(card => {
        this.agentCards.set(card.name, card);
      });

      // Convert to DistriAgent format
      const distriAgents: DistriAgent[] = agentCards.map(card => ({
        id: card.name,
        name: card.name,
        description: card.description,
        status: 'online' as const,
        card
      }));

      return distriAgents;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to fetch agents', 'FETCH_ERROR', error);
    }
  }

  /**
   * Get specific agent by ID
   */
  async getAgent(agentId: string): Promise<DistriAgent> {
    try {
      const response = await this.fetch(`/api/${this.config.apiVersion}/agents/${agentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(`Agent not found: ${agentId}`, 404);
        }
        throw new ApiError(`Failed to fetch agent: ${response.statusText}`, response.status);
      }

      const card: AgentCard = await response.json();
      this.agentCards.set(agentId, card);

      return {
        id: card.name,
        name: card.name,
        description: card.description,
        status: 'online' as const,
        card
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to fetch agent ${agentId}`, 'FETCH_ERROR', error);
    }
  }

  /**
   * Get or create A2AClient for an agent
   */
  private getA2AClient(agentId: string): A2AClient {
    if (!this.agentClients.has(agentId)) {
      const agentCard = this.agentCards.get(agentId);
      if (!agentCard) {
        throw new DistriError(`Agent card not found for ${agentId}. Call getAgent() first.`, 'AGENT_NOT_FOUND');
      }

      // Use agent's URL from the card, or fall back to Distri server proxy
      const agentUrl = agentCard.url || `${this.config.baseUrl}/api/${this.config.apiVersion}/agents/${agentId}`;
      const client = new A2AClient(agentUrl);
      this.agentClients.set(agentId, client);
      this.debug(`Created A2AClient for agent ${agentId} at ${agentUrl}`);
    }

    return this.agentClients.get(agentId)!;
  }

  /**
   * Send a message to an agent
   */
  async sendMessage(agentId: string, params: MessageSendParams): Promise<Message | Task> {
    try {
      const client = this.getA2AClient(agentId);
      const response: SendMessageResponse = await client.sendMessage(params);

      if ('error' in response && response.error) {
        throw new A2AProtocolError(response.error.message, response.error);
      }

      if ('result' in response) {
        const result = response.result;
        this.debug(`Message sent to ${agentId}, got ${result.kind}:`, result);
        return result;
      }

      throw new DistriError('Invalid response format', 'INVALID_RESPONSE');
    } catch (error) {
      if (error instanceof A2AProtocolError || error instanceof DistriError) throw error;
      throw new DistriError(`Failed to send message to agent ${agentId}`, 'SEND_MESSAGE_ERROR', error);
    }
  }

  /**
   * Send a streaming message to an agent
   */
  async* sendMessageStream(agentId: string, params: MessageSendParams): AsyncGenerator<A2AStreamEventData> {
    try {
      const client = this.getA2AClient(agentId);
      yield* await client.sendMessageStream(params);
    } catch (error) {
      throw new DistriError(`Failed to stream message to agent ${agentId}`, 'STREAM_MESSAGE_ERROR', error);
    }
  }

  /**
   * Get task details
   */
  async getTask(agentId: string, taskId: string): Promise<Task> {
    try {
      const client = this.getA2AClient(agentId);
      const response: GetTaskResponse = await client.getTask({ id: taskId });

      if ('error' in response && response.error) {
        throw new A2AProtocolError(response.error.message, response.error);
      }

      if ('result' in response) {
        const result = response.result;
        this.debug(`Got task ${taskId} from ${agentId}:`, result);
        return result;
      }

      throw new DistriError('Invalid response format', 'INVALID_RESPONSE');
    } catch (error) {
      if (error instanceof A2AProtocolError || error instanceof DistriError) throw error;
      throw new DistriError(`Failed to get task ${taskId} from agent ${agentId}`, 'GET_TASK_ERROR', error);
    }
  }

  /**
   * Cancel a task
   */
  async cancelTask(agentId: string, taskId: string): Promise<void> {
    try {
      const client = this.getA2AClient(agentId);
      await client.cancelTask({ id: taskId });
      this.debug(`Cancelled task ${taskId} on agent ${agentId}`);
    } catch (error) {
      throw new DistriError(`Failed to cancel task ${taskId} on agent ${agentId}`, 'CANCEL_TASK_ERROR', error);
    }
  }

  /**
   * Get threads from Distri server
   */
  async getThreads(): Promise<DistriThread[]> {
    try {
      const response = await this.fetch(`/api/${this.config.apiVersion}/threads`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch threads: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to fetch threads', 'FETCH_ERROR', error);
    }
  }

  /**
   * Get thread messages
   */
  async getThreadMessages(threadId: string): Promise<Message[]> {
    try {
      const response = await this.fetch(`/api/${this.config.apiVersion}/threads/${threadId}/messages`);
      if (!response.ok) {
        if (response.status === 404) {
          return []; // Thread not found, return empty messages
        }
        throw new ApiError(`Failed to fetch thread messages: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to fetch messages for thread ${threadId}`, 'FETCH_ERROR', error);
    }
  }

  /**
   * Get the base URL for making direct requests
   */
  get baseUrl(): string {
    return this.config.baseUrl;
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
  static initMessage(

    input: string,
    role: 'agent' | 'user' = 'user',
    contextId?: string,
    messageId?: string,
    taskId?: string
  ): Message {
    return {
      messageId: messageId || uuidv4(),
      role,
      parts: [{ kind: 'text', text: input.trim() }],
      contextId,
      taskId: taskId || uuidv4(),
      kind: 'message'
    };
  }

  /**
   * Helper method to create message send parameters
   */
  static initMessageParams(
    message: Message,
    configuration?: MessageSendParams['configuration']
  ): MessageSendParams {
    return {
      message,
      configuration: {
        acceptedOutputModes: ['text/plain'],
        blocking: false, // Default to non-blocking for streaming
        ...configuration
      }
    };
  }
}
export function uuidv4(): string {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // Per RFC4122 v4
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;
  return [...array].map((b, i) =>
    ([4, 6, 8, 10].includes(i) ? '-' : '') + b.toString(16).padStart(2, '0')
  ).join('');
}