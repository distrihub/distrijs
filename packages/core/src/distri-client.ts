import { A2AClient } from '@a2a-js/sdk/client';
import { Message, MessageSendParams, Task, SendMessageResponse, GetTaskResponse, Part } from '@a2a-js/sdk';
import {
  DistriMessage,
  DistriPart,
  ConfigurationResponse,
  DistriConfiguration,
  AgentDefinition,
  AgentCard,
  DistriThread,
  InvokeContext,
  DistriClientConfig,
  DistriError,
  ApiError,
  A2AProtocolError,
  A2AStreamEventData,
  SpeechToTextConfig,
  ToolResult,
  LLMResponse,
  LlmExecuteOptions,
  ToolDefinition,
  DEFAULT_BASE_URL,
  AgentConfigWithTools,
  ThreadListParams,
  ThreadListResponse,
  AgentUsageInfo,
  BrowserSession,
  MessageReadStatus,
  MessageVote,
  MessageVoteSummary,
  VoteMessageRequest,
  DynamicMetadata,
  ProviderModelsStatus,
  ModelWithProvider,
  TtsSpeechRequest,
  TtsSpeechResponse,
  CompactTaskResult,
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
 * Configuration with resolved defaults
 */
interface ResolvedConfig
  extends Required<
    Omit<DistriClientConfig, 'accessToken' | 'refreshToken' | 'tokenRefreshSkewMs' | 'onTokenRefresh' | 'clientId' | 'workspaceId'>
  > {
  onTokenRefresh?: () => Promise<string | null>;
  clientId?: string;
  workspaceId?: string;
}

/**
 * Enhanced Distri Client that wraps A2AClient and adds Distri-specific features
 *
 * @example
 * // Local development
 * const client = new DistriClient({ baseUrl: 'http://localhost:3033' });
 *
 * // Cloud with default URL (https://api.distri.dev)
 * const client = DistriClient.create();
 */
/** Dynamic tool factory registered on the client.
 * Note: `type` matches the wire format (Rust uses `#[serde(rename = "type")]`).
 */
export interface DynamicToolFactory {
  name: string;
  type: string;
  config: Record<string, unknown>;
  description?: string;
}

// ============================================================
// Token issuance — see DistriClient.issueToken for usage docs
// ============================================================

/** Scope under which the minted token operates. Matches cloud spec §6. */
export type TokenScope = 'workspace' | 'user';

/** Built-in role names. Cloud rejects any other string. */
export type TokenRole = 'owner' | 'admin' | 'member' | 'viewer' | 'end_user';

/**
 * Resource kinds known to cloud's typed authorization model. Used as keys
 * in `IssueTokenOptions.permissions`. PascalCase to match the wire form.
 */
export type ResourceKind =
  | 'Completion'
  | 'Agent'
  | 'Skill'
  | 'Workflow'
  | 'Note'
  | 'Bot'
  | 'Secret'
  | 'ConnectionWorkspace'
  | 'ConnectionUser'
  | 'Workspace'
  | 'Observability'
  | 'Mcp';

/**
 * Bitmask of allowed actions on a resource. Cloud serialises `ActionSet`
 * as a `u8`; combine flags with bitwise OR.
 */
export const TokenAction = {
  Read: 1,
  Write: 2,
  Manage: 4,
  Execute: 8,
} as const;
export type TokenActionValue = number;

/** Per-token rate-limit overrides. Cloud caps at user-tier defaults. */
export interface TokenLimits {
  daily_calls?: number;
  weekly_calls?: number;
}

/** Optional body for [`DistriClient.issueToken`]. */
export interface IssueTokenOptions {
  scope?: TokenScope;
  role?: TokenRole;
  /** Per-resource bitmask of allowed actions. */
  permissions?: Partial<Record<ResourceKind, TokenActionValue>>;
  identifier_id?: string;
  limits?: TokenLimits;
}

/** Cloud's response body for `POST /v1/token`. Fields beyond `access_token`,
 *  `refresh_token`, and `expires_at` are optional and informational —
 *  permissions/scope/role reflect what cloud actually granted (post §6.1
 *  attenuation). */
export interface IssueTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  identifier_id?: string;
  limits?: TokenLimits;
  permissions?: Partial<Record<ResourceKind, TokenActionValue>>;
  scope?: TokenScope;
}

/** Build the JSON body cloud expects on `POST /v1/token`. Cloud accepts
 *  unknown fields silently per spec §6; we only emit fields the caller set. */
function serializeIssueTokenOptions(opts: IssueTokenOptions): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (opts.scope !== undefined) out.scope = opts.scope;
  if (opts.role !== undefined) out.role = opts.role;
  if (opts.permissions !== undefined) out.permissions = opts.permissions;
  if (opts.identifier_id !== undefined) out.identifier_id = opts.identifier_id;
  if (opts.limits !== undefined) out.limits = opts.limits;
  return out;
}

export class DistriClient {
  private config: ResolvedConfig;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenRefreshSkewMs: number;
  private onTokenRefresh?: () => Promise<string | null>;
  private refreshPromise?: Promise<void>;
  private agentClients = new Map<string, { url: string; client: A2AClient }>();
  private registeredTools: DynamicToolFactory[] = [];

  constructor(config: DistriClientConfig) {
    const headers: Record<string, string> = { ...config.headers };

    // Add workspace header if workspaceId is provided
    if (config.workspaceId) {
      headers['X-Workspace-Id'] = config.workspaceId;
    }

    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.tokenRefreshSkewMs = config.tokenRefreshSkewMs ?? 60000;
    this.onTokenRefresh = config.onTokenRefresh;

    this.config = {
      baseUrl: config.baseUrl?.replace(/\/$/, '') || DEFAULT_BASE_URL,
      apiVersion: config.apiVersion || 'v1',
      timeout: config.timeout ?? 30000,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      debug: config.debug ?? false,
      headers,
      interceptor: config.interceptor ?? (async (init?: RequestInit) => Promise.resolve(init)),
      onTokenRefresh: config.onTokenRefresh,
      clientId: config.clientId,
      workspaceId: config.workspaceId
    };

    // Auto-register distri_request so agents can call the platform API
    this.registerHttpTool('distri_request', {
      base_url: this.config.baseUrl,
      headers: this.buildAuthHeaders(),
    });
  }

  /** Build auth headers for tool factories from client config. */
  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.config.headers['Authorization']) {
      headers['Authorization'] = this.config.headers['Authorization'];
    }
    if (this.config.headers['x-api-key']) {
      headers['x-api-key'] = this.config.headers['x-api-key'];
    }
    if (this.config.workspaceId) {
      headers['x-workspace-id'] = this.config.workspaceId;
    }
    return headers;
  }

  /**
   * Register a dynamic tool factory. It will be included in every outgoing
   * message's `definition_overrides.dynamic_tools`, deduplicated by name.
   */
  registerDynamicTool(factory: DynamicToolFactory): void {
    const idx = this.registeredTools.findIndex((t) => t.name === factory.name);
    if (idx >= 0) {
      this.registeredTools[idx] = factory;
    } else {
      this.registeredTools.push(factory);
    }
  }

  /**
   * Convenience: register an HTTP dynamic tool factory.
   */
  registerHttpTool(name: string, config: { base_url: string; headers: Record<string, string> }): void {
    this.registerDynamicTool({
      name,
      type: 'http',
      config,
      description: `Call the ${name} REST API. Input: {path, method, headers?, body?}`,
    });
  }

  /**
   * Get the configured client ID.
   */
  get clientId(): string | undefined {
    return this.config.clientId;
  }

  /**
   * Set the client ID for embed token issuance.
   */
  set clientId(value: string | undefined) {
    this.config.clientId = value;
  }

  /**
   * Get the configured workspace ID.
   */
  get workspaceId(): string | undefined {
    return this.config.workspaceId;
  }

  /**
   * Set the workspace ID for multi-tenant support.
   * Updates the X-Workspace-Id header for all subsequent requests.
   */
  set workspaceId(value: string | undefined) {
    this.config.workspaceId = value;
    if (value) {
      this.config.headers['X-Workspace-Id'] = value;
    } else {
      delete this.config.headers['X-Workspace-Id'];
    }
  }

  /**
   * Create a client with default cloud configuration.
   *
   * @param overrides - Optional overrides for the default config
   */
  static create(overrides: Partial<DistriClientConfig> = {}): DistriClient {
    return new DistriClient({
      baseUrl: DEFAULT_BASE_URL,
      ...overrides
    });
  }

  /**
   * Check if this client has authentication configured.
   */
  hasAuth(): boolean {
    return !!this.accessToken || !!this.refreshToken;
  }

  /**
   * Check if this client is configured for local development.
   */
  isLocal(): boolean {
    return this.config.baseUrl.includes('localhost') || this.config.baseUrl.includes('127.0.0.1');
  }

  /**
   * Session store: set a value (optionally with expiry)
   */
  async setSessionValue(sessionId: string, key: string, value: unknown, expiry?: Date | string): Promise<void> {
    const body: any = { key, value };
    if (expiry) {
      body.expiry = typeof expiry === 'string' ? expiry : (expiry as Date).toISOString();
    }
    const resp = await this.fetch(`/sessions/${encodeURIComponent(sessionId)}/values`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok && resp.status !== 204) {
      const errorData = await resp.json().catch(() => ({}));
      throw new ApiError(errorData.error || 'Failed to set session value', resp.status);
    }
  }

  /**
   * Session store: get a single value
   */
  async getSessionValue<T = unknown>(sessionId: string, key: string): Promise<T | null> {
    const resp = await this.fetch(`/sessions/${encodeURIComponent(sessionId)}/values/${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: {
        ...this.config.headers,
      },
    });
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new ApiError(errorData.error || 'Failed to get session value', resp.status);
    }
    const data = await resp.json().catch(() => ({ value: null }));
    return (data?.value ?? null) as T | null;
  }

  /**
   * Session store: get all values in a session
   */
  async getSessionValues(sessionId: string): Promise<Record<string, unknown>> {
    const resp = await this.fetch(`/sessions/${encodeURIComponent(sessionId)}/values`, {
      method: 'GET',
      headers: {
        ...this.config.headers,
      },
    });
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new ApiError(errorData.error || 'Failed to get session values', resp.status);
    }
    const data = await resp.json().catch(() => ({ values: {} }));
    return (data?.values ?? {}) as Record<string, unknown>;
  }

  /**
   * Session store: delete a single key
   */
  async deleteSessionValue(sessionId: string, key: string): Promise<void> {
    const resp = await this.fetch(`/sessions/${encodeURIComponent(sessionId)}/values/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: {
        ...this.config.headers,
      },
    });
    if (!resp.ok && resp.status !== 204) {
      const errorData = await resp.json().catch(() => ({}));
      throw new ApiError(errorData.error || 'Failed to delete session value', resp.status);
    }
  }

  /**
   * Session store: clear all keys in a session
   */
  async clearSession(sessionId: string): Promise<void> {
    const resp = await this.fetch(`/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      headers: {
        ...this.config.headers,
      },
    });
    if (!resp.ok && resp.status !== 204) {
      const errorData = await resp.json().catch(() => ({}));
      throw new ApiError(errorData.error || 'Failed to clear session', resp.status);
    }
  }

  // ============================================================
  // Token API
  // ============================================================
  // Issue access + refresh tokens for temporary authentication (e.g., frontend use)

  /**
   * Response from the token endpoint
   */
  static readonly TokenType = {
    Main: 'main',
    Short: 'short',
  } as const;

  /**
   * Issue an access token + refresh token for temporary authentication.
   * Requires an existing authenticated session (bearer token).
   *
   * Cloud spec §6: the request body is optional. When supplied, it lets the
   * caller request a specific token shape:
   *
   *  - `scope`: `'workspace'` (the default for SDK callers) or `'user'`
   *    (for tokens that represent an end-user identifier; requires
   *    `identifier_id`).
   *  - `role`: a named permission bundle (`owner | admin | member | viewer | end_user`).
   *    Takes precedence over `permissions`. Caller must hold equal-or-higher
   *    rank, else cloud responds 403.
   *  - `permissions`: an explicit `(ResourceKind, Action)` map for fine
   *    control. Cloud intersects this against the caller's own ceiling.
   *  - `identifier_id`: a per-tenant customer identifier (e.g.
   *    `'blinksheets'`); when set, cloud mints a `scope=user` token bound
   *    to that external actor.
   *  - `limits`: per-token rate-limit overrides.
   *
   * Defaults (no body) → cloud mints a `scope=workspace` token with
   * full workspace-member permissions, suitable for typical SDK usage.
   *
   * @returns Token response with access/refresh token strings; cloud also
   *          surfaces the granted permissions/scope/role for inspection.
   * @throws ApiError if not authenticated or token issuance fails
   *
   * @example
   * ```typescript
   * // Default — workspace-member token
   * const { access_token, refresh_token } = await client.issueToken();
   *
   * // Read-only viewer token
   * await client.issueToken({ role: 'viewer' });
   *
   * // End-user-scoped token bound to a customer identifier
   * await client.issueToken({
   *   scope: 'user',
   *   identifier_id: 'customer-42',
   * });
   *
   * // Fine-grained — only completion + agent.read
   * await client.issueToken({
   *   scope: 'workspace',
   *   permissions: {
   *     Completion: 8,  // Execute
   *     Agent: 1,       // Read
   *   },
   * });
   * // Persist the refresh token and use access_token for requests
   * ```
   */
  async issueToken(
    options?: IssueTokenOptions,
  ): Promise<IssueTokenResponse> {
    const body = options ? JSON.stringify(serializeIssueTokenOptions(options)) : undefined;
    const response = await this.fetch('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      ...(body ? { body } : {}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.error || 'Failed to issue token', response.status);
    }

    const tokens = await response.json();
    if (!tokens?.access_token || !tokens?.refresh_token || typeof tokens?.expires_at !== 'number') {
      throw new ApiError('Invalid token response', response.status);
    }
    this.applyTokens(tokens.access_token, tokens.refresh_token);
    return tokens;
  }

  /**
   * Get the current access/refresh tokens.
   */
  getTokens(): { accessToken?: string; refreshToken?: string } {
    return { accessToken: this.accessToken, refreshToken: this.refreshToken };
  }

  /**
   * Update the access/refresh tokens in memory.
   */
  setTokens(tokens: { accessToken?: string; refreshToken?: string }): void {
    this.accessToken = tokens.accessToken;
    if (tokens.refreshToken) {
      this.refreshToken = tokens.refreshToken;
    }
  }

  /**
   * Reset all authentication tokens.
   */
  resetTokens(): void {
    this.accessToken = undefined;
    this.refreshToken = undefined;
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
        ...(config.provider && { provider: config.provider }),
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
  async llm(messages: DistriMessage[], tools: ToolDefinition[] = [], options?: LlmExecuteOptions): Promise<LLMResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const response = await this.fetch(`/llm/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, tools, ...options }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error || response.statusText || 'LLM request failed';
      throw new ApiError(`LLM request failed: ${message}`, response.status);
    }

    return response.json();
  }

  /**
   * Get all available agents from the Distri server.
   *
   * NOTE: This is a HEAVY call — it returns full {@link AgentDefinition}
   * objects including system prompts, tools, and model settings. The backend
   * exposes no bulk "agent card" list endpoint, so for listings/pickers that
   * only need metadata (name, description, version, icon) consume only those
   * card-shaped fields from the result and avoid reading heavy fields, or fetch
   * per-item cards via {@link getAgentCard}.
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

      return agents;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to fetch agents', 'FETCH_ERROR', error);
    }
  }

  /**
   * Get specific agent by name
   */
  async getAgent(agentId: string): Promise<AgentConfigWithTools> {
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
      return agent;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to fetch agent ${agentId}`, 'FETCH_ERROR', error);
    }
  }

  /**
   * Fetch the lightweight A2A agent card for a single agent.
   *
   * Returns only the public metadata the A2A protocol exposes
   * (name, description, version, icon, skills, capabilities) — it does NOT
   * include the full {@link AgentDefinition} (system prompt, tools, model
   * settings). Use this for listings, pickers, and anywhere only metadata is
   * needed; use {@link getAgent} when the full, heavy definition is required
   * (editing or running an agent through our own interface).
   */
  async getAgentCard(agentId: string): Promise<AgentCard> {
    try {
      const response = await this.fetch(`/agents/${agentId}/.well-known/agent.json`, {
        headers: {
          ...this.config.headers,
        }
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(`Agent not found: ${agentId}`, 404);
        }
        throw new ApiError(`Failed to fetch agent card: ${response.statusText}`, response.status);
      }

      const card: AgentCard = await response.json();
      return card;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to fetch agent card ${agentId}`, 'FETCH_ERROR', error);
    }
  }

  /**
   * Delete an agent by name
   */
  async deleteAgent(agentId: string): Promise<void> {
    try {
      const response = await this.fetch(`/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          ...this.config.headers,
        }
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(`Agent not found: ${agentId}`, 404);
        }
        if (response.status === 403) {
          throw new ApiError(`Cannot delete this agent`, 403);
        }
        throw new ApiError(`Failed to delete agent: ${response.statusText}`, response.status);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to delete agent', 'DELETE_ERROR', error);
    }
  }

  /**
   * Fetch all available models grouped by provider, with configuration status.
   * Each provider includes `configured: boolean` indicating whether the
   * provider's required API key(s) are set on the server.
   */
  /**
   * Fetch all models with provider info. Returns flat ModelWithProvider[].
   */
  async fetchModels(): Promise<ModelWithProvider[]> {
    try {
      const response = await this.fetch(`/models`, {
        headers: { ...this.config.headers },
      });
      if (!response.ok) {
        throw new ApiError(`Failed to fetch models: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to fetch models', 'FETCH_ERROR', error);
    }
  }

  /**
   * @deprecated Use fetchModels() and group client-side if needed.
   */
  async fetchAvailableModels(): Promise<ProviderModelsStatus[]> {
    const flat = await this.fetchModels();
    const grouped = new Map<string, ProviderModelsStatus>();
    for (const m of flat) {
      if (!grouped.has(m.provider_id)) {
        grouped.set(m.provider_id, {
          provider_id: m.provider_id,
          provider_label: m.provider_label,
          configured: m.configured,
          models: [],
        });
      }
      grouped.get(m.provider_id)!.models.push({ id: m.id, name: m.name });
    }
    return Array.from(grouped.values());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Text-to-Speech API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate speech from text via the TTS endpoint.
   *
   * Returns an ArrayBuffer of audio bytes along with metadata.
   * When model/provider/voice are omitted, the server resolves them from
   * workspace defaults (configured in Agent Settings > Text-to-Speech).
   *
   * @example
   * ```typescript
   * const client = new DistriClient({ baseUrl: 'https://api.distri.dev' });
   *
   * // Use workspace defaults
   * const result = await client.ttsSpeech({ input: 'Hello world' });
   * const blob = new Blob([result.audio], { type: result.contentType });
   *
   * // Explicit model and voice
   * const result = await client.ttsSpeech({
   *   input: 'Hello world',
   *   model: 'tts-1-hd',
   *   voice: 'nova',
   *   provider: 'openai',
   * });
   * ```
   */
  async ttsSpeech(request: TtsSpeechRequest): Promise<TtsSpeechResponse> {
    const response = await this.fetch(`/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new ApiError(
        `TTS speech failed: ${errorBody || response.statusText}`,
        response.status,
      );
    }

    const audio = await response.arrayBuffer();
    return {
      audio,
      contentType: response.headers.get('content-type') || 'audio/mpeg',
      provider: response.headers.get('x-tts-provider') || undefined,
      model: response.headers.get('x-tts-model') || undefined,
      voice: response.headers.get('x-tts-voice') || undefined,
    };
  }

  /**
   * List available TTS models and voices.
   *
   * Returns model info grouped by provider, including available voices
   * and supported audio formats.
   */
  async fetchTtsModels(): Promise<any[]> {
    try {
      const response = await this.fetch(`/audio/models`, {
        headers: { ...this.config.headers },
      });
      if (!response.ok) {
        throw new ApiError(`Failed to fetch TTS models: ${response.statusText}`, response.status);
      }
      const data: { models: any[] } = await response.json();
      return data.models;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to fetch TTS models', 'FETCH_ERROR', error);
    }
  }

  /**
   * List TTS provider definitions (required keys, models, configuration status).
   */
  async fetchTtsProviders(): Promise<any[]> {
    try {
      const response = await this.fetch(`/audio/providers`, {
        headers: { ...this.config.headers },
      });
      if (!response.ok) {
        throw new ApiError(`Failed to fetch TTS providers: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to fetch TTS providers', 'FETCH_ERROR', error);
    }
  }

  /**
   * Update an agent's definition (markdown only)
   */
  async updateAgent(agentId: string, update: { markdown: string }): Promise<AgentConfigWithTools> {
    try {
      const response = await this.fetch(`/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(update),
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(`Agent not found: ${agentId}`, 404);
        }
        throw new ApiError(`Failed to update agent: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to update agent ${agentId}`, 'UPDATE_ERROR', error);
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
      const client = new A2AClient(agentUrl, {
        fetchImpl: fetchFn,
        agentCardPath: '/.well-known/agent.json',
      });
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
   * Merge registered dynamic tools into message params metadata,
   * deduplicating by name. Caller-provided tools take precedence.
   */
  private mergeRegisteredTools(params: MessageSendParams): MessageSendParams {
    if (this.registeredTools.length === 0) return params;

    const metadata = (params.metadata ?? {}) as Record<string, unknown>;
    const existing = (metadata.definition_overrides ?? {}) as Record<string, unknown>;
    const dynamicTools: DynamicToolFactory[] = Array.isArray(existing.dynamic_tools)
      ? [...existing.dynamic_tools] as DynamicToolFactory[]
      : [];

    for (const tool of this.registeredTools) {
      if (!dynamicTools.some((t) => t.name === tool.name)) {
        dynamicTools.push(tool);
      }
    }

    return {
      ...params,
      metadata: {
        ...metadata,
        definition_overrides: {
          ...existing,
          dynamic_tools: dynamicTools,
        },
      },
    };
  }

  /**
   * Send a message to an agent
   */
  async sendMessage(agentId: string, params: MessageSendParams): Promise<Message | Task> {
    try {
      const client = this.getA2AClient(agentId);
      params = this.mergeRegisteredTools(params);

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
      params = this.mergeRegisteredTools(params);
      yield* await client.sendMessageStream(params);
    } catch (error) {
      console.error(error);
      // Extract the actual error message from nested errors
      const errorMessage = this.extractErrorMessage(error);
      throw new DistriError(errorMessage, 'STREAM_MESSAGE_ERROR', error);
    }
  }

  /**
   * Extract a user-friendly error message from potentially nested errors
   */
  private extractErrorMessage(error: unknown): string {
    if (!error) return 'Unknown error occurred';

    // Handle JSON-RPC style errors (from A2A protocol)
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;

      // Check for JSON-RPC error structure: { error: { message: "..." } }
      if (err.error && typeof err.error === 'object') {
        const jsonRpcError = err.error as Record<string, unknown>;
        if (typeof jsonRpcError.message === 'string') {
          return jsonRpcError.message;
        }
      }

      // Check for standard Error with message
      if (err.message && typeof err.message === 'string') {
        return err.message;
      }

      // Check for A2AProtocolError or DistriError with details
      if (err.details && typeof err.details === 'object') {
        const details = err.details as Record<string, unknown>;
        if (details.message && typeof details.message === 'string') {
          return details.message;
        }
        // Check nested error structure in details
        if (details.error && typeof details.error === 'object') {
          const nestedError = details.error as Record<string, unknown>;
          if (typeof nestedError.message === 'string') {
            return nestedError.message;
          }
        }
      }

      // Check for cause (newer Error pattern)
      if (err.cause && typeof err.cause === 'object') {
        return this.extractErrorMessage(err.cause);
      }
    }

    // Fallback: try to extract the real error from A2A SDK wrapped messages
    if (error instanceof Error) {
      const msg = error.message;
      // "SSE event contained an error: <real message> (Code: -32603) Data: ..."
      const sseMatch = msg.match(/SSE event contained an error:\s*(.+?)\s*\(Code:/);
      if (sseMatch) return sseMatch[1];
      // "HTTP error establishing stream ... RPC Error: <real message> (Code: ...)"
      const rpcMatch = msg.match(/RPC Error:\s*(.+?)\s*\(Code:/);
      if (rpcMatch) return rpcMatch[1];
      return msg;
    }

    return String(error);
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
   * Manually compact the conversation history for a task. Calls
   * `POST /v1/tasks/{taskId}/compact`. The server runs the same compactor as
   * the agent loop's auto-trigger, unconditionally.
   *
   * Returns the parsed JSON body — `{ compacted, tokens_before, tokens_after,
   * entries_affected, usage_ratio, tier }` when compaction ran, or
   * `{ compacted: false, reason }` when there was nothing to compact.
   */
  async compactTask(taskId: string): Promise<CompactTaskResult> {
    try {
      const response = await this.fetch(`/tasks/${encodeURIComponent(taskId)}/compact`, {
        method: 'POST',
      });
      if (!response.ok) {
        const text = await response.text();
        throw new DistriError(
          `Failed to compact task ${taskId}: ${response.status} ${text}`,
          'COMPACT_TASK_ERROR'
        );
      }
      return (await response.json()) as CompactTaskResult;
    } catch (error) {
      if (error instanceof DistriError) throw error;
      throw new DistriError(`Failed to compact task ${taskId}`, 'COMPACT_TASK_ERROR', error);
    }
  }

  /**
   * Get threads from Distri server with filtering and pagination
   */
  async getThreads(params: ThreadListParams = {}): Promise<ThreadListResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params.agent_id) searchParams.set('agent_id', params.agent_id);
      if (params.external_id) searchParams.set('external_id', params.external_id);
      if (params.search) searchParams.set('search', params.search);
      if (params.from_date) searchParams.set('from_date', params.from_date);
      if (params.to_date) searchParams.set('to_date', params.to_date);
      if (params.tags?.length) searchParams.set('tags', params.tags.join(','));
      if (params.limit !== undefined) searchParams.set('limit', params.limit.toString());
      if (params.offset !== undefined) searchParams.set('offset', params.offset.toString());

      const queryString = searchParams.toString();
      const url = queryString ? `/threads?${queryString}` : '/threads';

      const response = await this.fetch(url);
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
   * Get agents sorted by thread count (most active first).
   * Includes all registered agents, even those with 0 threads.
   * Optionally filter by name with search parameter.
   */
  async getAgentsByUsage(options?: { search?: string }): Promise<AgentUsageInfo[]> {
    try {
      const params = new URLSearchParams();
      if (options?.search) {
        params.set('search', options.search);
      }
      const query = params.toString();
      const url = query ? `/threads/agents?${query}` : '/threads/agents';
      const response = await this.fetch(url);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch agents by usage: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to fetch agents by usage', 'FETCH_ERROR', error);
    }
  }

  /**
   * Create a new browser session
   * Returns session info including viewer_url and stream_url from browsr
   */
  async createBrowserSession(): Promise<BrowserSession> {
    try {
      const response = await this.fetch('/browser/session', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new ApiError(`Failed to create browser session: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError('Failed to create browser session', 'FETCH_ERROR', error);
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

  // ========== Message Read Status Methods ==========

  /**
   * Mark a message as read
   */
  async markMessageRead(threadId: string, messageId: string): Promise<MessageReadStatus> {
    try {
      const response = await this.fetch(
        `/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}/read`,
        { method: 'POST' }
      );
      if (!response.ok) {
        throw new ApiError(`Failed to mark message as read: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to mark message ${messageId} as read`, 'MARK_READ_ERROR', error);
    }
  }

  /**
   * Get read status for a specific message
   */
  async getMessageReadStatus(threadId: string, messageId: string): Promise<MessageReadStatus | null> {
    try {
      const response = await this.fetch(
        `/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}/read`
      );
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new ApiError(`Failed to get message read status: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to get read status for message ${messageId}`, 'FETCH_ERROR', error);
    }
  }

  /**
   * Get read status for all messages in a thread
   */
  async getThreadReadStatus(threadId: string): Promise<MessageReadStatus[]> {
    try {
      const response = await this.fetch(
        `/threads/${encodeURIComponent(threadId)}/read-status`
      );
      if (!response.ok) {
        throw new ApiError(`Failed to get thread read status: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to get read status for thread ${threadId}`, 'FETCH_ERROR', error);
    }
  }

  // ========== Message Voting Methods ==========

  /**
   * Vote on a message (upvote or downvote)
   * Downvotes require a comment explaining the issue
   */
  async voteMessage(threadId: string, messageId: string, request: VoteMessageRequest): Promise<MessageVote> {
    try {
      const response = await this.fetch(
        `/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}/vote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(errorData.error || `Failed to vote on message: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to vote on message ${messageId}`, 'VOTE_ERROR', error);
    }
  }

  /**
   * Remove vote from a message
   */
  async removeVote(threadId: string, messageId: string): Promise<void> {
    try {
      const response = await this.fetch(
        `/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}/vote`,
        { method: 'DELETE' }
      );
      if (!response.ok && response.status !== 204) {
        throw new ApiError(`Failed to remove vote: ${response.statusText}`, response.status);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to remove vote from message ${messageId}`, 'VOTE_ERROR', error);
    }
  }

  /**
   * Get vote summary for a message (counts + current user's vote)
   */
  async getMessageVoteSummary(threadId: string, messageId: string): Promise<MessageVoteSummary> {
    try {
      const response = await this.fetch(
        `/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}/vote`
      );
      if (!response.ok) {
        throw new ApiError(`Failed to get vote summary: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to get vote summary for message ${messageId}`, 'FETCH_ERROR', error);
    }
  }

  /**
   * Get all votes for a message (admin/analytics use)
   */
  async getMessageVotes(threadId: string, messageId: string): Promise<MessageVote[]> {
    try {
      const response = await this.fetch(
        `/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}/votes`
      );
      if (!response.ok) {
        throw new ApiError(`Failed to get message votes: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new DistriError(`Failed to get votes for message ${messageId}`, 'FETCH_ERROR', error);
    }
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
      // Send parts in Distri format (part_type/data) - backend expects this format
      const response = await this.fetch(`/agents/${agentId}/complete-tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify({
          tool_call_id: result.tool_call_id,
          tool_response: {
            tool_call_id: result.tool_call_id,
            tool_name: result.tool_name,
            parts: result.parts,
            parts_metadata: result.parts_metadata
          }
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
   * Complete an inline hook with a mutation payload.
   */
  async completeInlineHook(hookId: string, mutation: any): Promise<void> {
    const response = await this.fetch(`/event/hooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify({
        hook_id: hookId,
        mutation,
      }),
    });

    if (!response.ok) {
      throw new ApiError(`Failed to complete inline hook: ${response.statusText}`, response.status);
    }
  }

  /**
   * Get the base URL for making direct requests
   */
  get baseUrl(): string {
    return this.config.baseUrl;
  }

  private applyTokens(accessToken: string, refreshToken?: string): void {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
  }

  /**
   * Ensure access token is valid, refreshing if necessary.
   * Call this before starting operations (e.g. sending messages) to
   * proactively refresh an expiring token instead of failing mid-request.
   *
   * Skipped entirely when the caller has supplied a static auth signal
   * in `config.headers` — `x-api-key` or a non-Bearer `Authorization`
   * (e.g. a long-lived JWT). Those auths are stamped on every request
   * via `applyHeaders(this.config.headers)` in `fetchAbsolute`, so the
   * managed-token path is unused.
   */
  async ensureAccessToken(): Promise<void> {
    if (this.hasStaticAuthHeader()) {
      return;
    }
    if (!this.accessToken || this.isTokenExpiring(this.accessToken)) {
      if (this.refreshToken || this.onTokenRefresh) {
        await this.refreshTokens();
      } else if (!this.accessToken) {
        throw new ApiError('No access token available', 401);
      } else {
        throw new ApiError('Access token expired and no refresh mechanism available', 401);
      }
    }
  }

  /** True iff the user provided a static auth header in `config.headers`. */
  private hasStaticAuthHeader(): boolean {
    const h = this.config.headers;
    if (!h) return false;
    return Boolean(h['x-api-key'] || h['X-Api-Key'] || h['Authorization'] || h['authorization']);
  }

  private async refreshTokens(): Promise<void> {
    if (!this.refreshToken && !this.onTokenRefresh) {
      return;
    }
    if (!this.refreshPromise) {
      this.refreshPromise = this.performTokenRefresh().finally(() => {
        this.refreshPromise = undefined;
      });
    }
    return this.refreshPromise;
  }

  private async performTokenRefresh(): Promise<void> {
    if (this.onTokenRefresh) {
      // If we are using a callback, we MUST reset the token first to ensure
      // any concurrent requests also wait for the new token.
      this.accessToken = undefined;
      const newToken = await this.onTokenRefresh();
      if (newToken) {
        this.applyTokens(newToken);
        return;
      }
    }

    if (!this.refreshToken) {
      return;
    }

    const response = await this.fetchAbsolute(
      `${this.config.baseUrl}/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      },
      { skipAuth: true, retryOnAuth: false }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.error || 'Failed to refresh token', response.status);
    }

    const tokens = await response.json();
    if (!tokens?.access_token || !tokens?.refresh_token) {
      throw new ApiError('Invalid token response', response.status);
    }
    this.applyTokens(tokens.access_token, tokens.refresh_token);
  }

  private isTokenExpiring(token: string): boolean {
    const expiresAt = this.getTokenExpiry(token);
    if (!expiresAt) {
      return false;
    }
    return expiresAt <= Date.now() + this.tokenRefreshSkewMs;
  }

  private getTokenExpiry(token: string): number | null {
    const payload = this.decodeJwtPayload(token);
    const exp = payload?.exp;
    if (typeof exp !== 'number') {
      return null;
    }
    return exp * 1000;
  }

  private decodeJwtPayload(token: string): Record<string, any> | null {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }
    const decoded = this.decodeBase64Url(parts[1]);
    if (!decoded) {
      return null;
    }
    try {
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  private decodeBase64Url(value: string): string | null {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    try {
      if (typeof atob === 'function') {
        return atob(padded);
      }
      const buffer = (globalThis as any).Buffer;
      if (typeof buffer !== 'undefined') {
        return buffer.from(padded, 'base64').toString('utf8');
      }
    } catch {
      return null;
    }
    return null;
  }

  private applyAuthHeader(headers: Headers): void {
    if (this.accessToken && !headers.has('authorization')) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }
  }

  /**
   * Enhanced fetch with retry logic
   */
  private async fetchAbsolute(
    url: RequestInfo | URL,
    initialInit?: RequestInit,
    options?: { skipAuth?: boolean; retryOnAuth?: boolean }
  ): Promise<Response> {
    const { skipAuth = false, retryOnAuth = true } = options ?? {};
    const init = await this.config.interceptor(initialInit);
    // Construct the full URL using baseUrl
    let lastError: Error | undefined;

    // Merge headers (config first, then init) and always ensure a Content-Type for body requests
    const headers = new Headers();
    const applyHeaders = (src?: HeadersInit) => {
      if (!src) return;
      if (src instanceof Headers) {
        src.forEach((value, key) => headers.set(key, value));
      } else if (Array.isArray(src)) {
        src.forEach(([key, value]) => headers.set(key, value));
      } else if (typeof src === 'object') {
        Object.entries(src).forEach(([key, value]) => {
          if (typeof value === 'string') {
            headers.set(key, value);
          }
        });
      }
    };

    applyHeaders(this.config.headers);
    applyHeaders(init?.headers);

    const hasBody =
      init?.body !== undefined &&
      !(init.body instanceof FormData) &&
      !(init.body instanceof Blob);

    if (!headers.has('content-type') && hasBody) {
      headers.set('Content-Type', 'application/json');
    }

    if (!skipAuth) {
      await this.ensureAccessToken();
      this.applyAuthHeader(headers);
    }

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
          headers,
        });

        clearTimeout(timeoutId);
        if (!skipAuth && retryOnAuth && response.status === 401 && (this.refreshToken || this.onTokenRefresh)) {
          const refreshed = await this.refreshTokens().then(() => true).catch(() => false);
          if (refreshed) {
            return this.fetchAbsolute(url, initialInit, { skipAuth, retryOnAuth: false });
          }
        }
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
   * Resolve secret values by key names via the server's /secrets/resolve endpoint.
   */
  async resolveSecrets(keys: string[]): Promise<Record<string, string>> {
    const response = await this.fetch('/secrets/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify({ keys }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.error || 'Failed to resolve secrets', response.status);
    }
    const data = await response.json();
    return data.resolved;
  }

  /**
   * Fetch an OAuth connection token by connection ID.
   */
  async getConnectionToken(connectionId: string): Promise<{ access_token: string; token_type?: string; expires_at?: string }> {
    const response = await this.fetch(`/connections/${encodeURIComponent(connectionId)}/token`, {
      method: 'POST',
      headers: {
        ...this.config.headers,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.error || 'Failed to get connection token', response.status);
    }
    return response.json();
  }

  /** Call a registered tool via the server's /tools/call endpoint. */
  /**
   * Proxy an HTTP request through the Distri server.
   *
   * Sends the raw HttpRequestInput to `POST /request` so the server can
   * resolve secrets, inject connection tokens, and execute the request.
   */
  async proxyRequest(input: import('./http-request').HttpRequestInput): Promise<import('./http-request').HttpRequestResponse> {
    const response = await this.fetch('/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.config.headers },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new ApiError(`Request proxy failed: ${response.statusText}`, response.status);
    }
    return response.json();
  }

  async callTool(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    const resp = await this.fetch('/tools/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_name: toolName, input }),
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`Tool '${toolName}' failed (${resp.status}): ${text}`)
    }
    return resp.json()
  }

  public async fetch(input: RequestInfo | URL, initialInit?: RequestInit): Promise<Response> {
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
      created_at: created_at || new Date().getTime(),
    };
  }

  /**
   * Helper method to create message send parameters.
   *
   * Pass `dynamicMetadata` to inject `dynamic_sections` and/or `dynamic_values`
   * into the metadata so the server can apply them to prompt templates.
   */
  static initMessageParams(
    message: Message,
    configuration?: MessageSendParams['configuration'],
    metadata?: any,
    dynamicMetadata?: DynamicMetadata,
  ): MessageSendParams {
    const mergedMetadata = {
      ...metadata,
      ...(dynamicMetadata?.dynamic_sections ? { dynamic_sections: dynamicMetadata.dynamic_sections } : {}),
      ...(dynamicMetadata?.dynamic_values ? { dynamic_values: dynamicMetadata.dynamic_values } : {}),
    };

    return {
      message,
      configuration: {
        acceptedOutputModes: ['text/plain'],
        blocking: false, // Default to non-blocking for streaming
        ...configuration
      },
      metadata: Object.keys(mergedMetadata).length > 0 ? mergedMetadata : metadata,
    };
  }

  /**
   * Create MessageSendParams from a DistriMessage using InvokeContext.
   *
   * Pass `dynamicMetadata` to inject `dynamic_sections` and/or `dynamic_values`
   * into the metadata so the server can apply them to prompt templates.
   */
  static initDistriMessageParams(
    message: DistriMessage,
    context: InvokeContext,
    dynamicMetadata?: DynamicMetadata,
  ): MessageSendParams {
    const a2aMessage = convertDistriMessageToA2A(message, context);
    const contextMetadata = context.getMetadata?.() || {};
    const mergedMetadata = {
      ...contextMetadata,
      ...(dynamicMetadata?.dynamic_sections ? { dynamic_sections: dynamicMetadata.dynamic_sections } : {}),
      ...(dynamicMetadata?.dynamic_values ? { dynamic_values: dynamicMetadata.dynamic_values } : {}),
    };
    return {
      message: a2aMessage,
      metadata: Object.keys(mergedMetadata).length > 0 ? mergedMetadata : contextMetadata,
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
