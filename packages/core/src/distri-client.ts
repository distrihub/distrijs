import { A2AClient, Message, MessageSendParams, Task, SendMessageResponse, GetTaskResponse, Part } from '@a2a-js/sdk/client';
import {
  DistriMessage,
  DistriPart,
  ConfigurationResponse,
  DistriConfiguration,
  AgentDefinition,
  DistriThread,
  InvokeContext,
  DistriClientConfig,
  DistriError,
  ApiError,
  A2AProtocolError,
  A2AStreamEventData,
  SpeechToTextConfig,
  StreamingTranscriptionOptions,
  ToolResult,
  LLMResponse
} from './types';
import { convertA2AMessageToDistri, convertDistriMessageToA2A } from './encoder';

export type ChatCompletionRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatCompletionMessage {
  role: ChatCompletionRole;
  content: string;
}

export type ChatCompletionResponseFormat =
  | { type: 'text' }
  | {
    type: 'json_schema';
    json_schema: {
      name: string;
      schema: Record<string, unknown>;
      strict?: boolean;
    };
  };

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: ChatCompletionResponseFormat;
  tools?: unknown[];
  tool_choice?: 'none' | 'auto' | Record<string, unknown>;
}

export interface ChatCompletionChoice {
  index: number;
  finish_reason?: string | null;
  message: ChatCompletionMessage;
}

export interface ChatCompletionResponse {
  id: string;
  created: number;
  model: string;
  object: string;
  choices: ChatCompletionChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}
/**
 * Enhanced Distri Client that wraps A2AClient and adds Distri-specific features
 */
export class DistriClient {
  private config: Required<DistriClientConfig>;
  private agentClients = new Map<string, { url: string; client: A2AClient }>();

  constructor(config: DistriClientConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''),
      apiVersion: config.apiVersion || 'v1',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      debug: config.debug || false,
      headers: config.headers || {},
      interceptor: config.interceptor || ((init?: RequestInit) => Promise.resolve(init))
    };

    this.debug('DistriClient initialized with config:', this.config);
  }

  /**
   * Start streaming speech-to-text transcription via WebSocket
   */
  async streamingTranscription(options: StreamingTranscriptionOptions = {}) {
    const baseUrl = this.config.baseUrl;
    // Convert HTTP/HTTPS URLs to WebSocket URLs
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/voice/stream';

    return new Promise<{
      sendAudio: (audioData: ArrayBuffer) => void;
      sendText: (text: string) => void;
      stop: () => void;
      close: () => void;
    }>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let isResolved = false;

      ws.onopen = () => {
        // Start session
        ws.send(JSON.stringify({ type: 'start_session' }));
        options.onStart?.();

        if (!isResolved) {
          isResolved = true;
          resolve({
            sendAudio: (audioData: ArrayBuffer) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(audioData);
              }
            },
            sendText: (text: string) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'text_chunk', text }));
              }
            },
            stop: () => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'end_session' }));
              }
            },
            close: () => {
              ws.close();
            }
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'text_chunk':
              options.onTranscript?.(data.text || '', data.is_final || false);
              break;
            case 'session_started':
              this.debug('Speech-to-text session started');
              break;
            case 'session_ended':
              this.debug('Speech-to-text session ended');
              options.onEnd?.();
              break;
            case 'error': {
              const error = new Error(data.message || 'WebSocket error');
              this.debug('Speech-to-text error:', error);
              options.onError?.(error);
              break;
            }
            default:
              this.debug('Unknown message type:', data.type);
          }
        } catch (error) {
          const parseError = new Error('Failed to parse WebSocket message');
          this.debug('Parse error:', parseError);
          options.onError?.(parseError);
        }
      };

      ws.onerror = (event) => {
        const error = new Error('WebSocket connection error');
        this.debug('WebSocket error:', event);
        options.onError?.(error);

        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      };

      ws.onclose = (event) => {
        this.debug('WebSocket closed:', event.code, event.reason);
        options.onEnd?.();
      };
    });
  }
  /**
   * Transcribe audio blob to text using speech-to-text API
   */
  async transcribe(audioBlob: Blob, config: SpeechToTextConfig = {}): Promise<string> {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64String = btoa(String.fromCharCode(...uint8Array));

      const requestBody = {
        audio: base64String,
        model: config.model || 'whisper-1',
        ...(config.language && { language: config.language }),
        ...(config.temperature !== undefined && { temperature: config.temperature }),
      };

      this.debug('Transcribing audio:', {
        model: requestBody.model,
        language: config.language,
        audioSize: audioBlob.size
      });

      const response = await this.fetch(`/tts/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Transcription failed: ${response.status}`;
        throw new ApiError(errorMessage, response.status);
      }

      const result = await response.json();
      const transcription = result.text || '';

      this.debug('Transcription result:', { text: transcription });
      return transcription;

    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to transcribe audio', 'TRANSCRIPTION_ERROR', error);
    }
  }

  async getConfiguration(): Promise<ConfigurationResponse> {
    const response = await this.fetch(`/configuration`, {
      method: 'GET',
      headers: {
        ...this.config.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.error || 'Failed to load configuration', response.status);
    }

    return response.json();
  }

  async updateConfiguration(configuration: DistriConfiguration): Promise<ConfigurationResponse> {
    const response = await this.fetch(`/configuration`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(configuration),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.error || 'Failed to update configuration', response.status);
    }

    return response.json();
  }

  /**
   * Minimal LLM helper that proxies to the Distri server using Distri messages.
   */
  async llm(messages: DistriMessage[], tools: any[] = []): Promise<LLMResponse> {
    const response = await this.fetch(`/llm/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, tools }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error || response.statusText || 'LLM request failed';
      throw new ApiError(`LLM request failed: ${message}`, response.status);
    }

    return response.json();
  }

  /**
   * Get all available agents from the Distri server
   */
  async getAgents(): Promise<AgentDefinition[]> {
    try {
      const response = await this.fetch(`/agents`, {
        headers: {
          ...this.config.headers,
        }
      });
      if (!response.ok) {
        throw new ApiError(`Failed to fetch agents: ${response.statusText}`, response.status);
      }

      const agents: AgentDefinition[] = await response.json();
      // Temporary fix for agents without an id
      agents.forEach(agent => {
        if (!agent.id) {
          agent.id = agent.name;
        }
      });

      return agents;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to fetch agents', 'FETCH_ERROR', error);
    }
  }

  /**
   * Get specific agent by ID
   */
  async getAgent(agentId: string): Promise<AgentDefinition> {
    try {
      const response = await this.fetch(`/agents/${agentId}`, {
        headers: {
          ...this.config.headers,
        }
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(`Agent not found: ${agentId}`, 404);
        }
        throw new ApiError(`Failed to fetch agent: ${response.statusText}`, response.status);
      }

      const agent: AgentDefinition = await response.json();
      // If the agent doesn't have an id, set it to the agentId
      if (!agent.id) {
        agent.id = agentId;
      }
      return agent;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to fetch agent ${agentId}`, 'FETCH_ERROR', error);
    }
  }

  /**
   * Get or create A2AClient for an agent
   */
  private getA2AClient(agentId: string): A2AClient {
    // Compute the current expected URL for this agent
    const agentUrl = `${this.config.baseUrl}/agents/${agentId}`;
    const existing = this.agentClients.get(agentId);

    if (!existing || existing.url !== agentUrl) {
      const fetchFn = this.fetchAbsolute.bind(this);
      const client = new A2AClient(agentUrl, fetchFn);
      this.agentClients.set(agentId, { url: agentUrl, client });
      this.debug(
        existing
          ? `Recreated A2AClient for agent ${agentId} with new URL ${agentUrl}`
          : `Created A2AClient for agent ${agentId} at ${agentUrl}`
      );
      return client;
    }

    return existing.client;
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
  async * sendMessageStream(agentId: string, params: MessageSendParams): AsyncGenerator<A2AStreamEventData> {
    console.log('sendMessageStream', agentId, params);
    try {
      const client = this.getA2AClient(agentId);
      yield* await client.sendMessageStream(params);
    } catch (error) {
      console.error(error);
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
      const response = await this.fetch(`/threads`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch threads: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to fetch threads', 'FETCH_ERROR', error);
    }
  }

  async getThread(threadId: string): Promise<DistriThread> {
    try {
      const response = await this.fetch(`/threads/${threadId}`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch thread: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to fetch thread ${threadId}`, 'FETCH_ERROR', error);
    }
  }

  /**
   * Get thread messages
   */
  async getThreadMessages(threadId: string): Promise<Message[]> {
    try {
      const response = await this.fetch(`/threads/${threadId}/messages`);
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
   * Get messages from a thread as DistriMessage format
   */
  async getThreadMessagesAsDistri(threadId: string): Promise<DistriMessage[]> {
    const messages = await this.getThreadMessages(threadId);
    return messages.map(convertA2AMessageToDistri);
  }

  /**
   * Send a DistriMessage to a thread
   */
  async sendDistriMessage(threadId: string, message: DistriMessage, context: InvokeContext): Promise<void> {
    const a2aMessage = convertDistriMessageToA2A(message, context);
    const contextMetadata = context.getMetadata?.() || {};
    const params: MessageSendParams = {
      message: a2aMessage,
      metadata: contextMetadata
    };
    await this.sendMessage(threadId, params);
  }

  /**
   * Complete an external tool call
   */
  async completeTool(agentId: string, result: ToolResult): Promise<void> {
    try {
      const response = await this.fetch(`/agents/${agentId}/complete-tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify({
          tool_call_id: result.tool_call_id,
          tool_response: result
        })
      });

      if (!response.ok) {
        throw new ApiError(`Failed to complete tool: ${response.statusText}`, response.status);
      }

      this.debug(`Tool completed: ${result.tool_name} (${result.tool_call_id}) for agent ${agentId}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to complete tool ${result.tool_name} (${result.tool_call_id}) for agent ${agentId}`, 'COMPLETE_TOOL_ERROR', error);
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
  private async fetchAbsolute(url: RequestInfo | URL, initialInit?: RequestInit): Promise<Response> {

    const init = await this.config.interceptor(initialInit);
    // Construct the full URL using baseUrl
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
          headers: {
            ...this.config.headers,
            ...init?.headers
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
   * Enhanced fetch with retry logic
   */
  private async fetch(input: RequestInfo | URL, initialInit?: RequestInit): Promise<Response> {
    // Construct the full URL using baseUrl
    const url = `${this.config.baseUrl}${input}`;
    return this.fetchAbsolute(url, initialInit);
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

    parts: Part[] | string,
    role: 'agent' | 'user' = 'user',
    message: Omit<Partial<Message>, 'parts' | 'role' | 'kind'>
  ): Message {
    return {
      messageId: message.messageId || uuidv4(),
      taskId: message.taskId || uuidv4(),
      contextId: message.contextId,
      role,
      parts: Array.isArray(parts) ? parts : [{ kind: 'text', text: parts.trim() }],
      ...message,
      kind: 'message'
    };
  }

  /**
   * Create a DistriMessage instance
   */
  static initDistriMessage(
    role: DistriMessage['role'],
    parts: DistriPart[],
    id?: string,
    created_at?: number,
  ): DistriMessage {
    return {
      id: id || uuidv4(),
      role,
      parts,
      created_at,
    };
  }

  /**
   * Helper method to create message send parameters
   */
  static initMessageParams(
    message: Message,
    configuration?: MessageSendParams['configuration'],
    metadata?: any
  ): MessageSendParams {
    return {
      message,
      configuration: {
        acceptedOutputModes: ['text/plain'],
        blocking: false, // Default to non-blocking for streaming
        ...configuration
      },
      metadata
    };
  }

  /**
   * Create MessageSendParams from a DistriMessage using InvokeContext
   */
  static initDistriMessageParams(message: DistriMessage, context: InvokeContext): MessageSendParams {
    const a2aMessage = convertDistriMessageToA2A(message, context);
    const contextMetadata = context.getMetadata?.() || {};
    return {
      message: a2aMessage,
      metadata: contextMetadata
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
