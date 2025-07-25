"use client";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// ../../node_modules/.pnpm/@a2a-js+sdk@https+++codeload.github.com+v3g42+a2a-js+tar.gz+51444c9/node_modules/@a2a-js/sdk/dist/chunk-CUGIRVQB.js
var A2AClient = class {
  /**
   * Constructs an A2AClient instance.
   * It initiates fetching the agent card from the provided agent baseUrl.
   * The Agent Card is expected at `${agentBaseUrl}/.well-known/agent.json`.
   * The `url` field from the Agent Card will be used as the RPC service endpoint.
   * @param agentBaseUrl The base URL of the A2A agent (e.g., https://agent.example.com).
   */
  constructor(agentBaseUrl, fetchFn) {
    __publicField(this, "agentBaseUrl");
    __publicField(this, "agentCardPromise");
    __publicField(this, "requestIdCounter", 1);
    __publicField(this, "serviceEndpointUrl");
    // To be populated from AgentCard after fetching
    __publicField(this, "fetchFn");
    this.agentBaseUrl = agentBaseUrl.replace(/\/$/, "");
    this.fetchFn = fetchFn || globalThis.fetch;
    this.agentCardPromise = this._fetchAndCacheAgentCard();
  }
  /**
   * Fetches the Agent Card from the agent's well-known URI and caches its service endpoint URL.
   * This method is called by the constructor.
   * @returns A Promise that resolves to the AgentCard.
   */
  async _fetchAndCacheAgentCard() {
    const agentCardUrl = `${this.agentBaseUrl}/.well-known/agent.json`;
    try {
      const response = await this.fetchFn(agentCardUrl, {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch Agent Card from ${agentCardUrl}: ${response.status} ${response.statusText}`);
      }
      const agentCard = await response.json();
      if (!agentCard.url) {
        throw new Error("Fetched Agent Card does not contain a valid 'url' for the service endpoint.");
      }
      this.serviceEndpointUrl = agentCard.url;
      return agentCard;
    } catch (error) {
      console.error("Error fetching or parsing Agent Card:");
      throw error;
    }
  }
  /**
   * Retrieves the Agent Card.
   * If an `agentBaseUrl` is provided, it fetches the card from that specific URL.
   * Otherwise, it returns the card fetched and cached during client construction.
   * @param agentBaseUrl Optional. The base URL of the agent to fetch the card from.
   * If provided, this will fetch a new card, not use the cached one from the constructor's URL.
   * @returns A Promise that resolves to the AgentCard.
   */
  async getAgentCard(agentBaseUrl) {
    if (agentBaseUrl) {
      const specificAgentBaseUrl = agentBaseUrl.replace(/\/$/, "");
      const agentCardUrl = `${specificAgentBaseUrl}/.well-known/agent.json`;
      const response = await this.fetchFn(agentCardUrl, {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch Agent Card from ${agentCardUrl}: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    }
    return this.agentCardPromise;
  }
  /**
   * Gets the RPC service endpoint URL. Ensures the agent card has been fetched first.
   * @returns A Promise that resolves to the service endpoint URL string.
   */
  async _getServiceEndpoint() {
    if (this.serviceEndpointUrl) {
      return this.serviceEndpointUrl;
    }
    await this.agentCardPromise;
    if (!this.serviceEndpointUrl) {
      throw new Error("Agent Card URL for RPC endpoint is not available. Fetching might have failed.");
    }
    return this.serviceEndpointUrl;
  }
  /**
   * Helper method to make a generic JSON-RPC POST request.
   * @param method The RPC method name.
   * @param params The parameters for the RPC method.
   * @returns A Promise that resolves to the RPC response.
   */
  async _postRpcRequest(method, params) {
    const endpoint = await this._getServiceEndpoint();
    const requestId = this.requestIdCounter++;
    const rpcRequest = {
      jsonrpc: "2.0",
      method,
      params,
      // Cast because TParams structure varies per method
      id: requestId
    };
    const httpResponse = await this.fetchFn(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
        // Expect JSON response for non-streaming requests
      },
      body: JSON.stringify(rpcRequest)
    });
    if (!httpResponse.ok) {
      let errorBodyText = "(empty or non-JSON response)";
      try {
        errorBodyText = await httpResponse.text();
        const errorJson = JSON.parse(errorBodyText);
        if (!errorJson.jsonrpc && errorJson.error) {
          throw new Error(`RPC error for ${method}: ${errorJson.error.message} (Code: ${errorJson.error.code}, HTTP Status: ${httpResponse.status}) Data: ${JSON.stringify(errorJson.error.data)}`);
        } else if (!errorJson.jsonrpc) {
          throw new Error(`HTTP error for ${method}! Status: ${httpResponse.status} ${httpResponse.statusText}. Response: ${errorBodyText}`);
        }
      } catch (e) {
        if (e.message.startsWith("RPC error for") || e.message.startsWith("HTTP error for"))
          throw e;
        throw new Error(`HTTP error for ${method}! Status: ${httpResponse.status} ${httpResponse.statusText}. Response: ${errorBodyText}`);
      }
    }
    const rpcResponse = await httpResponse.json();
    if (rpcResponse.id !== requestId) {
      console.error(`CRITICAL: RPC response ID mismatch for method ${method}. Expected ${requestId}, got ${rpcResponse.id}. This may lead to incorrect response handling.`);
    }
    return rpcResponse;
  }
  /**
   * Sends a message to the agent.
   * The behavior (blocking/non-blocking) and push notification configuration
   * are specified within the `params.configuration` object.
   * Optionally, `params.message.contextId` or `params.message.taskId` can be provided.
   * @param params The parameters for sending the message, including the message content and configuration.
   * @returns A Promise resolving to SendMessageResponse, which can be a Message, Task, or an error.
   */
  async sendMessage(params) {
    return this._postRpcRequest("message/send", params);
  }
  /**
   * Sends a message to the agent and streams back responses using Server-Sent Events (SSE).
   * Push notification configuration can be specified in `params.configuration`.
   * Optionally, `params.message.contextId` or `params.message.taskId` can be provided.
   * Requires the agent to support streaming (`capabilities.streaming: true` in AgentCard).
   * @param params The parameters for sending the message.
   * @returns An AsyncGenerator yielding A2AStreamEventData (Message, Task, TaskStatusUpdateEvent, or TaskArtifactUpdateEvent).
   * The generator throws an error if streaming is not supported or if an HTTP/SSE error occurs.
   */
  async *sendMessageStream(params) {
    const agentCard = await this.agentCardPromise;
    if (!agentCard.capabilities?.streaming) {
      throw new Error("Agent does not support streaming (AgentCard.capabilities.streaming is not true).");
    }
    const endpoint = await this._getServiceEndpoint();
    const clientRequestId = this.requestIdCounter++;
    const rpcRequest = {
      // This is the initial JSON-RPC request to establish the stream
      jsonrpc: "2.0",
      method: "message/stream",
      params,
      id: clientRequestId
    };
    const response = await this.fetchFn(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
        // Crucial for SSE
      },
      body: JSON.stringify(rpcRequest)
    });
    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error) {
          throw new Error(`HTTP error establishing stream for message/stream: ${response.status} ${response.statusText}. RPC Error: ${errorJson.error.message} (Code: ${errorJson.error.code})`);
        }
      } catch (e) {
        if (e.message.startsWith("HTTP error establishing stream"))
          throw e;
        throw new Error(`HTTP error establishing stream for message/stream: ${response.status} ${response.statusText}. Response: ${errorBody || "(empty)"}`);
      }
      throw new Error(`HTTP error establishing stream for message/stream: ${response.status} ${response.statusText}`);
    }
    if (!response.headers.get("Content-Type")?.startsWith("text/event-stream")) {
      throw new Error("Invalid response Content-Type for SSE stream. Expected 'text/event-stream'.");
    }
    yield* this._parseA2ASseStream(response, clientRequestId);
  }
  /**
   * Sets or updates the push notification configuration for a given task.
   * Requires the agent to support push notifications (`capabilities.pushNotifications: true` in AgentCard).
   * @param params Parameters containing the taskId and the TaskPushNotificationConfig.
   * @returns A Promise resolving to SetTaskPushNotificationConfigResponse.
   */
  async setTaskPushNotificationConfig(params) {
    const agentCard = await this.agentCardPromise;
    if (!agentCard.capabilities?.pushNotifications) {
      throw new Error("Agent does not support push notifications (AgentCard.capabilities.pushNotifications is not true).");
    }
    return this._postRpcRequest(
      "tasks/pushNotificationConfig/set",
      params
    );
  }
  /**
   * Gets the push notification configuration for a given task.
   * @param params Parameters containing the taskId.
   * @returns A Promise resolving to GetTaskPushNotificationConfigResponse.
   */
  async getTaskPushNotificationConfig(params) {
    return this._postRpcRequest(
      "tasks/pushNotificationConfig/get",
      params
    );
  }
  /**
   * Retrieves a task by its ID.
   * @param params Parameters containing the taskId and optional historyLength.
   * @returns A Promise resolving to GetTaskResponse, which contains the Task object or an error.
   */
  async getTask(params) {
    return this._postRpcRequest("tasks/get", params);
  }
  /**
   * Cancels a task by its ID.
   * @param params Parameters containing the taskId.
   * @returns A Promise resolving to CancelTaskResponse, which contains the updated Task object or an error.
   */
  async cancelTask(params) {
    return this._postRpcRequest("tasks/cancel", params);
  }
  /**
   * Resubscribes to a task's event stream using Server-Sent Events (SSE).
   * This is used if a previous SSE connection for an active task was broken.
   * Requires the agent to support streaming (`capabilities.streaming: true` in AgentCard).
   * @param params Parameters containing the taskId.
   * @returns An AsyncGenerator yielding A2AStreamEventData (Message, Task, TaskStatusUpdateEvent, or TaskArtifactUpdateEvent).
   */
  async *resubscribeTask(params) {
    const agentCard = await this.agentCardPromise;
    if (!agentCard.capabilities?.streaming) {
      throw new Error("Agent does not support streaming (required for tasks/resubscribe).");
    }
    const endpoint = await this._getServiceEndpoint();
    const clientRequestId = this.requestIdCounter++;
    const rpcRequest = {
      // Initial JSON-RPC request to establish the stream
      jsonrpc: "2.0",
      method: "tasks/resubscribe",
      params,
      id: clientRequestId
    };
    const response = await this.fetchFn(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
      },
      body: JSON.stringify(rpcRequest)
    });
    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error) {
          throw new Error(`HTTP error establishing stream for tasks/resubscribe: ${response.status} ${response.statusText}. RPC Error: ${errorJson.error.message} (Code: ${errorJson.error.code})`);
        }
      } catch (e) {
        if (e.message.startsWith("HTTP error establishing stream"))
          throw e;
        throw new Error(`HTTP error establishing stream for tasks/resubscribe: ${response.status} ${response.statusText}. Response: ${errorBody || "(empty)"}`);
      }
      throw new Error(`HTTP error establishing stream for tasks/resubscribe: ${response.status} ${response.statusText}`);
    }
    if (!response.headers.get("Content-Type")?.startsWith("text/event-stream")) {
      throw new Error("Invalid response Content-Type for SSE stream on resubscribe. Expected 'text/event-stream'.");
    }
    yield* this._parseA2ASseStream(response, clientRequestId);
  }
  /**
   * Parses an HTTP response body as an A2A Server-Sent Event stream.
   * Each 'data' field of an SSE event is expected to be a JSON-RPC 2.0 Response object,
   * specifically a SendStreamingMessageResponse (or similar structure for resubscribe).
   * @param response The HTTP Response object whose body is the SSE stream.
   * @param originalRequestId The ID of the client's JSON-RPC request that initiated this stream.
   * Used to validate the `id` in the streamed JSON-RPC responses.
   * @returns An AsyncGenerator yielding the `result` field of each valid JSON-RPC success response from the stream.
   */
  async *_parseA2ASseStream(response, originalRequestId) {
    if (!response.body) {
      throw new Error("SSE response body is undefined. Cannot read stream.");
    }
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    let eventDataBuffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (eventDataBuffer.trim()) {
            const result = this._processSseEventData(eventDataBuffer, originalRequestId);
            yield result;
          }
          break;
        }
        buffer += value;
        let lineEndIndex;
        while ((lineEndIndex = buffer.indexOf("\n")) >= 0) {
          const line = buffer.substring(0, lineEndIndex).trim();
          buffer = buffer.substring(lineEndIndex + 1);
          if (line === "") {
            if (eventDataBuffer) {
              const result = this._processSseEventData(eventDataBuffer, originalRequestId);
              yield result;
              eventDataBuffer = "";
            }
          } else if (line.startsWith("data:")) {
            eventDataBuffer += line.substring(5).trimStart() + "\n";
          } else if (line.startsWith(":")) {
          } else if (line.includes(":")) {
          }
        }
      }
    } catch (error) {
      console.error("Error reading or parsing SSE stream:", error.message);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
  /**
   * Processes a single SSE event's data string, expecting it to be a JSON-RPC response.
   * @param jsonData The string content from one or more 'data:' lines of an SSE event.
   * @param originalRequestId The ID of the client's request that initiated the stream.
   * @returns The `result` field of the parsed JSON-RPC success response.
   * @throws Error if data is not valid JSON, not a valid JSON-RPC response, an error response, or ID mismatch.
   */
  _processSseEventData(jsonData, originalRequestId) {
    if (!jsonData.trim()) {
      throw new Error("Attempted to process empty SSE event data.");
    }
    try {
      const sseJsonRpcResponse = JSON.parse(jsonData.replace(/\n$/, ""));
      const a2aStreamResponse = sseJsonRpcResponse;
      if (a2aStreamResponse.id !== originalRequestId) {
        console.warn(`SSE Event's JSON-RPC response ID mismatch. Client request ID: ${originalRequestId}, event response ID: ${a2aStreamResponse.id}.`);
      }
      if (this.isErrorResponse(a2aStreamResponse)) {
        const err = a2aStreamResponse.error;
        throw new Error(`SSE event contained an error: ${err.message} (Code: ${err.code}) Data: ${JSON.stringify(err.data)}`);
      }
      if (!("result" in a2aStreamResponse) || typeof a2aStreamResponse.result === "undefined") {
        throw new Error(`SSE event JSON-RPC response is missing 'result' field. Data: ${jsonData}`);
      }
      const successResponse = a2aStreamResponse;
      return successResponse.result;
    } catch (e) {
      if (e.message.startsWith("SSE event contained an error") || e.message.startsWith("SSE event JSON-RPC response is missing 'result' field")) {
        throw e;
      }
      console.error("Failed to parse SSE event data string or unexpected JSON-RPC structure:", jsonData, e);
      throw new Error(`Failed to parse SSE event data: "${jsonData.substring(0, 100)}...". Original error: ${e.message}`);
    }
  }
  isErrorResponse(response) {
    return "error" in response;
  }
};

// ../core/src/types.ts
var APPROVAL_REQUEST_TOOL_NAME = "approval_request";
var DistriError = class extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "DistriError";
  }
};
var A2AProtocolError = class extends DistriError {
  constructor(message, details) {
    super(message, "A2A_PROTOCOL_ERROR", details);
    this.name = "A2AProtocolError";
  }
};
var ApiError = class extends DistriError {
  constructor(message, statusCode, details) {
    super(message, "API_ERROR", details);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
};

// ../core/src/distri-client.ts
var DistriClient = class {
  constructor(config) {
    this.agentClients = /* @__PURE__ */ new Map();
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ""),
      apiVersion: config.apiVersion || "v1",
      timeout: config.timeout || 3e4,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1e3,
      debug: config.debug || false,
      headers: config.headers || {},
      interceptor: config.interceptor || ((init) => Promise.resolve(init))
    };
    this.debug("DistriClient initialized with config:", this.config);
  }
  /**
   * Get all available agents from the Distri server
   */
  async getAgents() {
    try {
      const response = await this.fetch(`/agents`, {
        headers: {
          ...this.config.headers
        }
      });
      if (!response.ok) {
        throw new ApiError(`Failed to fetch agents: ${response.statusText}`, response.status);
      }
      const agents = await response.json();
      agents.forEach((agent) => {
        if (!agent.id) {
          agent.id = agent.name;
        }
      });
      return agents;
    } catch (error) {
      if (error instanceof ApiError)
        throw error;
      throw new DistriError("Failed to fetch agents", "FETCH_ERROR", error);
    }
  }
  /**
   * Get specific agent by ID
   */
  async getAgent(agentId) {
    try {
      const response = await this.fetch(`/agents/${agentId}`, {
        headers: {
          ...this.config.headers
        }
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(`Agent not found: ${agentId}`, 404);
        }
        throw new ApiError(`Failed to fetch agent: ${response.statusText}`, response.status);
      }
      const agent = await response.json();
      if (!agent.id) {
        agent.id = agentId;
      }
      return agent;
    } catch (error) {
      if (error instanceof ApiError)
        throw error;
      throw new DistriError(`Failed to fetch agent ${agentId}`, "FETCH_ERROR", error);
    }
  }
  /**
   * Get or create A2AClient for an agent
   */
  getA2AClient(agentId) {
    if (!this.agentClients.has(agentId)) {
      const fetchFn = this.fetchAbsolute.bind(this);
      const agentUrl = `${this.config.baseUrl}/agents/${agentId}`;
      const client = new A2AClient(agentUrl, fetchFn);
      this.agentClients.set(agentId, client);
      this.debug(`Created A2AClient for agent ${agentId} at ${agentUrl}`);
    }
    return this.agentClients.get(agentId);
  }
  /**
   * Send a message to an agent
   */
  async sendMessage(agentId, params) {
    try {
      const client = this.getA2AClient(agentId);
      const response = await client.sendMessage(params);
      if ("error" in response && response.error) {
        throw new A2AProtocolError(response.error.message, response.error);
      }
      if ("result" in response) {
        const result = response.result;
        this.debug(`Message sent to ${agentId}, got ${result.kind}:`, result);
        return result;
      }
      throw new DistriError("Invalid response format", "INVALID_RESPONSE");
    } catch (error) {
      if (error instanceof A2AProtocolError || error instanceof DistriError)
        throw error;
      throw new DistriError(`Failed to send message to agent ${agentId}`, "SEND_MESSAGE_ERROR", error);
    }
  }
  /**
   * Send a streaming message to an agent
   */
  async *sendMessageStream(agentId, params) {
    try {
      const client = this.getA2AClient(agentId);
      yield* await client.sendMessageStream(params);
    } catch (error) {
      throw new DistriError(`Failed to stream message to agent ${agentId}`, "STREAM_MESSAGE_ERROR", error);
    }
  }
  /**
   * Get task details
   */
  async getTask(agentId, taskId) {
    try {
      const client = this.getA2AClient(agentId);
      const response = await client.getTask({ id: taskId });
      if ("error" in response && response.error) {
        throw new A2AProtocolError(response.error.message, response.error);
      }
      if ("result" in response) {
        const result = response.result;
        this.debug(`Got task ${taskId} from ${agentId}:`, result);
        return result;
      }
      throw new DistriError("Invalid response format", "INVALID_RESPONSE");
    } catch (error) {
      if (error instanceof A2AProtocolError || error instanceof DistriError)
        throw error;
      throw new DistriError(`Failed to get task ${taskId} from agent ${agentId}`, "GET_TASK_ERROR", error);
    }
  }
  /**
   * Cancel a task
   */
  async cancelTask(agentId, taskId) {
    try {
      const client = this.getA2AClient(agentId);
      await client.cancelTask({ id: taskId });
      this.debug(`Cancelled task ${taskId} on agent ${agentId}`);
    } catch (error) {
      throw new DistriError(`Failed to cancel task ${taskId} on agent ${agentId}`, "CANCEL_TASK_ERROR", error);
    }
  }
  /**
   * Get threads from Distri server
   */
  async getThreads() {
    try {
      const response = await this.fetch(`/threads`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch threads: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError)
        throw error;
      throw new DistriError("Failed to fetch threads", "FETCH_ERROR", error);
    }
  }
  async getThread(threadId) {
    try {
      const response = await this.fetch(`/threads/${threadId}`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch thread: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError)
        throw error;
      throw new DistriError(`Failed to fetch thread ${threadId}`, "FETCH_ERROR", error);
    }
  }
  /**
   * Get thread messages
   */
  async getThreadMessages(threadId) {
    try {
      const response = await this.fetch(`/threads/${threadId}/messages`);
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new ApiError(`Failed to fetch thread messages: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError)
        throw error;
      throw new DistriError(`Failed to fetch messages for thread ${threadId}`, "FETCH_ERROR", error);
    }
  }
  /**
   * Get the base URL for making direct requests
   */
  get baseUrl() {
    return this.config.baseUrl;
  }
  /**
   * Enhanced fetch with retry logic
   */
  async fetchAbsolute(url, initialInit) {
    const init = await this.config.interceptor(initialInit);
    let lastError;
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
    throw lastError;
  }
  /**
   * Enhanced fetch with retry logic
   */
  async fetch(input, initialInit) {
    const url = `${this.config.baseUrl}${input}`;
    return this.fetchAbsolute(url, initialInit);
  }
  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Debug logging
   */
  debug(...args) {
    if (this.config.debug) {
      console.log("[DistriClient]", ...args);
    }
  }
  /**
   * Helper method to create A2A messages
   */
  static initMessage(parts, role = "user", message) {
    return {
      messageId: message.messageId || uuidv4(),
      taskId: message.taskId || uuidv4(),
      contextId: message.contextId,
      role,
      parts: Array.isArray(parts) ? parts : [{ kind: "text", text: parts.trim() }],
      ...message,
      kind: "message"
    };
  }
  /**
   * Helper method to create message send parameters
   */
  static initMessageParams(message, configuration, metadata) {
    return {
      message,
      configuration: {
        acceptedOutputModes: ["text/plain"],
        blocking: false,
        // Default to non-blocking for streaming
        ...configuration
      },
      metadata
    };
  }
};
function uuidv4() {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  array[6] = array[6] & 15 | 64;
  array[8] = array[8] & 63 | 128;
  return [...array].map(
    (b, i) => ([4, 6, 8, 10].includes(i) ? "-" : "") + b.toString(16).padStart(2, "0")
  ).join("");
}

// ../core/src/agent.ts
var Agent = class _Agent {
  constructor(agentDefinition, client) {
    this.tools = /* @__PURE__ */ new Map();
    this.agentDefinition = agentDefinition;
    this.client = client;
    this.initializeBuiltinTools();
  }
  /**
   * Initialize built-in tools
   */
  initializeBuiltinTools() {
    this.addTool({
      name: APPROVAL_REQUEST_TOOL_NAME,
      description: "Request user approval for actions",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Approval prompt to show user" },
          action: { type: "string", description: "Action requiring approval" },
          tool_calls: {
            type: "array",
            description: "Tool calls requiring approval",
            items: {
              type: "object",
              properties: {
                tool_call_id: { type: "string" },
                tool_name: { type: "string" },
                input: { type: "object" }
              }
            }
          }
        },
        required: ["prompt"]
      },
      handler: async (_input) => {
        return { approved: false, message: "Approval handler not implemented" };
      }
    });
    this.addTool({
      name: "toast",
      description: "Show a toast notification to the user",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Message to display" },
          type: {
            type: "string",
            enum: ["success", "error", "warning", "info"],
            default: "info",
            description: "Type of toast notification"
          }
        },
        required: ["message"]
      },
      handler: async (_input) => {
        return { success: true, message: "Toast displayed" };
      }
    });
    this.addTool({
      name: "input_request",
      description: "Request text input from the user",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Prompt to show the user" },
          default: { type: "string", description: "Default value for the input" }
        },
        required: ["prompt"]
      },
      handler: async (input) => {
        const userInput = prompt(input.prompt || "Please provide input:", input.default || "");
        return { input: userInput };
      }
    });
  }
  /**
   * Add a tool to the agent (AG-UI style)
   */
  addTool(tool) {
    this.tools.set(tool.name, tool);
  }
  /**
   * Add multiple tools at once
   */
  addTools(tools) {
    tools.forEach((tool) => this.addTool(tool));
  }
  /**
   * Remove a tool
   */
  removeTool(toolName) {
    this.tools.delete(toolName);
  }
  /**
   * Get all registered tools
   */
  getTools() {
    return Array.from(this.tools.keys());
  }
  /**
   * Get all registered tool definitions
   */
  getToolDefinitions() {
    const definitions = {};
    this.tools.forEach((tool, name) => {
      definitions[name] = {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      };
    });
    return definitions;
  }
  /**
   * Get a specific tool definition
   */
  getTool(toolName) {
    return this.tools.get(toolName);
  }
  /**
   * Check if a tool is registered
   */
  hasTool(toolName) {
    return this.tools.has(toolName);
  }
  /**
   * Execute a tool call
   */
  async executeTool(toolCall) {
    const tool = this.tools.get(toolCall.tool_name);
    if (!tool) {
      return {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: `Tool '${toolCall.tool_name}' not found`
      };
    }
    try {
      const result = await tool.handler(toolCall.input);
      return {
        tool_call_id: toolCall.tool_call_id,
        result,
        success: true
      };
    } catch (error) {
      return {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Execute multiple tool calls in parallel
   */
  async executeToolCalls(toolCalls) {
    const promises = toolCalls.map((toolCall) => this.executeTool(toolCall));
    return Promise.all(promises);
  }
  /**
   * Get agent information
   */
  get id() {
    return this.agentDefinition.id;
  }
  get name() {
    return this.agentDefinition.name;
  }
  get description() {
    return this.agentDefinition.description;
  }
  /**
   * Fetch messages for a thread (public method for useChat)
   */
  async getThreadMessages(threadId) {
    return this.client.getThreadMessages(threadId);
  }
  /**
   * Direct (non-streaming) invoke
   */
  async invoke(params) {
    const enhancedParams = this.enhanceParamsWithTools(params);
    return await this.client.sendMessage(this.agentDefinition.id, enhancedParams);
  }
  /**
   * Streaming invoke
   */
  async invokeStream(params) {
    const enhancedParams = this.enhanceParamsWithTools(params);
    return this.client.sendMessageStream(this.agentDefinition.id, enhancedParams);
  }
  /**
   * Enhance message params with tool definitions
   */
  enhanceParamsWithTools(params) {
    const toolDefinitions = this.getToolDefinitions();
    return {
      ...params,
      metadata: {
        ...params.metadata,
        tools: Object.keys(toolDefinitions).length > 0 ? toolDefinitions : void 0
      }
    };
  }
  /**
   * Create an agent instance from an agent ID
   */
  static async create(agentId, client) {
    const agentDefinition = await client.getAgent(agentId);
    return new _Agent(agentDefinition, client);
  }
  /**
   * List all available agents
   */
  static async list(client) {
    const agentDefinitions = await client.getAgents();
    return agentDefinitions.map((def) => new _Agent(def, client));
  }
};

// src/components/Chat.tsx
import { useState as useState7, useCallback as useCallback4, useMemo as useMemo3 } from "react";
import { Send, Bot, User, Loader2 as Loader22, AlertCircle as AlertCircle2 } from "lucide-react";

// src/useChat.ts
import { useState as useState4, useCallback as useCallback2, useRef as useRef2, useEffect as useEffect3, useMemo } from "react";

// src/useAgent.ts
import React2, { useState as useState3, useCallback, useRef } from "react";

// src/DistriProvider.tsx
import { createContext as createContext2, useContext as useContext2, useEffect as useEffect2, useState as useState2 } from "react";

// src/components/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { jsx } from "react/jsx-runtime";
var initialState = {
  theme: "system",
  setTheme: () => null
};
var ThemeProviderContext = createContext(initialState);
function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "distri-theme",
  ...props
}) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }
    return defaultTheme === "system" ? "dark" : defaultTheme;
  });
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "chatgpt");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(theme);
  }, [theme]);
  const value = {
    theme,
    setTheme: (theme2) => {
      localStorage.setItem(storageKey, theme2);
      setTheme(theme2);
    }
  };
  return /* @__PURE__ */ jsx(ThemeProviderContext.Provider, { ...props, value, children });
}

// src/DistriProvider.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var DistriContext = createContext2({
  client: null,
  error: null,
  isLoading: true
});
var debug = (config, ...args) => {
  if (config.debug) {
    console.log("[DistriProvider]", ...args);
  }
};
function DistriProvider({ config, children, defaultTheme = "dark" }) {
  const [client, setClient] = useState2(null);
  const [error, setError] = useState2(null);
  const [isLoading, setIsLoading] = useState2(true);
  useEffect2(() => {
    let currentClient = null;
    try {
      debug(config, "[DistriProvider] Initializing client with config:", config);
      currentClient = new DistriClient(config);
      setClient(currentClient);
      setError(null);
      setIsLoading(false);
      debug(config, "[DistriProvider] Client initialized successfully");
    } catch (err) {
      debug(config, "[DistriProvider] Failed to initialize client:", err);
      const error2 = err instanceof Error ? err : new Error("Failed to initialize client");
      setError(error2);
      setClient(null);
      setIsLoading(false);
    }
  }, [config]);
  const contextValue = {
    client,
    error,
    isLoading
  };
  if (error) {
    console.error(config, "[DistriProvider] Rendering error state:", error.message);
  }
  if (isLoading) {
    debug(config, "[DistriProvider] Rendering loading state");
  }
  if (client) {
    debug(config, "[DistriProvider] Rendering with client available");
  }
  return /* @__PURE__ */ jsx2(ThemeProvider, { defaultTheme, children: /* @__PURE__ */ jsx2(DistriContext.Provider, { value: contextValue, children }) });
}
function useDistri() {
  const context = useContext2(DistriContext);
  if (!context) {
    throw new Error("useDistri must be used within a DistriProvider");
  }
  return context;
}

// src/useAgent.ts
function useAgent({
  agentId,
  autoCreateAgent = true
}) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agent, setAgent] = useState3(null);
  const [loading, setLoading] = useState3(false);
  const [error, setError] = useState3(null);
  const agentRef = useRef(null);
  const initializeAgent = useCallback(async () => {
    if (!client || !agentId)
      return;
    try {
      setLoading(true);
      setError(null);
      const newAgent = await Agent.create(agentId, client);
      agentRef.current = newAgent;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create agent"));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);
  React2.useEffect(() => {
    if (!clientLoading && !clientError && autoCreateAgent && client && agentId) {
      initializeAgent();
    }
  }, [clientLoading, clientError, autoCreateAgent, client, agentId, initializeAgent]);
  return {
    // Agent information
    agent,
    // State management
    loading: loading || clientLoading,
    error: error || clientError
  };
}

// src/utils/toolCallUtils.ts
var extractExternalToolCalls = (messages) => {
  const externalToolCalls = [];
  messages.forEach((message) => {
    const meta = message.metadata;
    if (meta && meta.type === "assistant_response" && meta.tool_calls && Array.isArray(meta.tool_calls)) {
      meta.tool_calls.forEach((toolCall) => {
        const existingToolCall = externalToolCalls.find((tc) => tc.tool_call_id === toolCall.tool_call_id);
        if (!existingToolCall) {
          externalToolCalls.push(toolCall);
        }
      });
    }
  });
  return externalToolCalls;
};

// src/useChat.ts
function useChat({
  agentId,
  threadId,
  agent: providedAgent,
  onToolCalls
}) {
  const { agent: internalAgent } = useAgent({
    agentId: providedAgent ? void 0 : agentId || void 0
  });
  const agent = providedAgent || internalAgent;
  const [messages, setMessages] = useState4([]);
  const [loading, setLoading] = useState4(false);
  const [error, setError] = useState4(null);
  const [externalToolCalls, setExternalToolCalls] = useState4([]);
  const abortControllerRef = useRef2(null);
  const invokeConfig = useMemo(() => ({
    configuration: {
      acceptedOutputModes: ["text/plain", "text/markdown"],
      blocking: true
    }
  }), []);
  const fetchMessages = useCallback2(async () => {
    if (!agent)
      return;
    try {
      setError(null);
      const msgs = await agent.getThreadMessages(threadId);
      setMessages(msgs);
      const toolCalls = extractExternalToolCalls(msgs);
      if (toolCalls.length > 0) {
        setExternalToolCalls(toolCalls);
        onToolCalls?.(toolCalls);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch messages"));
    }
  }, [agent, threadId, onToolCalls]);
  useEffect3(() => {
    if (agent && threadId) {
      fetchMessages();
    }
  }, [fetchMessages]);
  const handleToolCalls = useCallback2(async (toolCalls) => {
    if (!agent || toolCalls.length === 0)
      return;
    const externalToolNames = [
      "approval_request",
      "toast",
      "input_request"
      // Add other UI-requiring tools here
    ];
    const externalCalls = toolCalls.filter(
      (tc) => externalToolNames.includes(tc.tool_name) || !agent.hasTool(tc.tool_name)
    );
    const internalCalls = toolCalls.filter(
      (tc) => !externalToolNames.includes(tc.tool_name) && agent.hasTool(tc.tool_name)
    );
    let allResults = [];
    if (internalCalls.length > 0) {
      try {
        const internalResults = await agent.executeToolCalls(internalCalls);
        allResults = [...allResults, ...internalResults];
      } catch (error2) {
        console.error("Error executing internal tools:", error2);
        const errorResults = internalCalls.map((tc) => ({
          tool_call_id: tc.tool_call_id,
          result: null,
          success: false,
          error: error2 instanceof Error ? error2.message : "Unknown error"
        }));
        allResults = [...allResults, ...errorResults];
      }
    }
    if (externalCalls.length > 0) {
      setExternalToolCalls(externalCalls);
      onToolCalls?.(externalCalls);
    }
    if (allResults.length > 0) {
      await continueWithToolResults(allResults);
    }
  }, [agent, threadId, invokeConfig.configuration, onToolCalls]);
  const continueWithToolResults = useCallback2(async (results) => {
    if (!agent || results.length === 0)
      return;
    const responseMessage = DistriClient.initMessage([], "user", {
      contextId: threadId,
      metadata: {
        type: "tool_responses",
        results
      }
    });
    const params = DistriClient.initMessageParams(
      responseMessage,
      invokeConfig.configuration,
      responseMessage.metadata
    );
    try {
      const stream = await agent.invokeStream(params);
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted)
          break;
        await handleStreamEvent(event);
      }
    } catch (err) {
      console.error("Error continuing conversation with tool results:", err);
      setError(err instanceof Error ? err : new Error("Failed to continue conversation"));
    }
  }, [agent, threadId, invokeConfig.configuration]);
  const handleExternalToolComplete = useCallback2(async (results) => {
    setExternalToolCalls([]);
    await continueWithToolResults(results);
  }, [continueWithToolResults]);
  const handleExternalToolCancel = useCallback2(() => {
    setExternalToolCalls([]);
    setLoading(false);
  }, []);
  const handleStreamEvent = useCallback2(async (event) => {
    if (event.kind === "message") {
      const message = event;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.messageId === message.messageId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], parts: [...updated[idx].parts, ...message.parts] };
          return updated;
        } else {
          return [...prev, message];
        }
      });
      const msgMetadata = message.metadata;
      if (msgMetadata?.type === "assistant_response" && msgMetadata.tool_calls) {
        const toolCalls = msgMetadata.tool_calls;
        await handleToolCalls(toolCalls);
      }
    } else if (event.kind === "status-update") {
      console.debug("Task status update:", event);
    }
  }, [handleToolCalls]);
  const sendMessage = useCallback2(async (input, metadata) => {
    if (!agent)
      return;
    const userMessage = DistriClient.initMessage(input, "user", { contextId: threadId, metadata });
    setMessages((prev) => [...prev, userMessage]);
    const params = DistriClient.initMessageParams(userMessage, invokeConfig.configuration, metadata);
    try {
      setLoading(true);
      setError(null);
      const result = await agent.invoke(params);
      if (result && "message" in result && result.message) {
        setMessages((prev) => [...prev, result.message]);
        const resultMetadata = result.message.metadata;
        if (resultMetadata?.type === "assistant_response" && resultMetadata.tool_calls) {
          const toolCalls = resultMetadata.tool_calls;
          await handleToolCalls(toolCalls);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to send message"));
    } finally {
      setLoading(false);
    }
  }, [agent, threadId, invokeConfig.configuration, handleToolCalls]);
  const sendMessageStream = useCallback2(async (input, metadata) => {
    if (!agent)
      return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const userMessage = DistriClient.initMessage(input, "user", { contextId: threadId, metadata });
    setMessages((prev) => [...prev, userMessage]);
    const params = DistriClient.initMessageParams(userMessage, invokeConfig.configuration, metadata);
    try {
      setLoading(true);
      setError(null);
      const stream = await agent.invokeStream(params);
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted)
          break;
        await handleStreamEvent(event);
      }
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        setError(err instanceof Error ? err : new Error("Failed to send message"));
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [agent, threadId, invokeConfig.configuration, handleStreamEvent]);
  return {
    messages,
    loading,
    error,
    agent,
    sendMessage,
    sendMessageStream,
    fetchMessages,
    externalToolCalls,
    handleExternalToolComplete,
    handleExternalToolCancel
  };
}

// src/components/MessageRenderer.tsx
import React4, { useMemo as useMemo2 } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Code2 } from "lucide-react";

// src/components/ChatContext.tsx
import React3, { createContext as createContext3, useContext as useContext3 } from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
var defaultConfig = {
  theme: "auto",
  showDebug: false,
  autoScroll: true,
  showTimestamps: true,
  enableMarkdown: true,
  enableCodeHighlighting: true
};
var ChatContext = createContext3(null);
var useChatConfig = () => {
  const context = useContext3(ChatContext);
  if (!context) {
    return {
      config: defaultConfig,
      updateConfig: () => {
      }
    };
  }
  return context;
};

// src/components/MessageRenderer.tsx
import { Fragment, jsx as jsx4, jsxs } from "react/jsx-runtime";
var CodeBlock = ({ language, children, inline = false, isDark = false }) => {
  const [copied, setCopied] = React4.useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  const normalizeLanguage = (lang) => {
    if (!lang)
      return "text";
    const langMap = {
      "js": "javascript",
      "ts": "typescript",
      "jsx": "javascript",
      "tsx": "typescript",
      "py": "python",
      "rb": "ruby",
      "sh": "bash",
      "shell": "bash",
      "yml": "yaml",
      "md": "markdown",
      "json5": "json",
      "dockerfile": "docker",
      "rs": "rust",
      "go": "go",
      "php": "php",
      "cpp": "cpp",
      "cxx": "cpp",
      "cc": "cpp",
      "c++": "cpp",
      "cs": "csharp",
      "kt": "kotlin",
      "swift": "swift",
      "scala": "scala",
      "clj": "clojure",
      "cljs": "clojure",
      "r": "r",
      "matlab": "matlab",
      "sql": "sql",
      "psql": "sql",
      "mysql": "sql",
      "sqlite": "sql"
    };
    const normalized = lang.toLowerCase();
    return langMap[normalized] || normalized;
  };
  const normalizedLanguage = normalizeLanguage(language);
  if (inline) {
    return /* @__PURE__ */ jsx4("code", { className: `px-1.5 py-0.5 rounded text-sm font-mono ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`, children });
  }
  const lineCount = children.split("\n").length;
  const shouldShowLineNumbers = lineCount > 4;
  return /* @__PURE__ */ jsxs("div", { className: "relative my-4 rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-gray-50 border-b border-gray-200 px-3 py-2 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx4(Code2, { className: "h-4 w-4 text-gray-500" }),
        /* @__PURE__ */ jsx4("span", { className: "font-medium text-gray-700", children: normalizedLanguage === "text" ? "Code" : normalizedLanguage.toUpperCase() }),
        /* @__PURE__ */ jsxs("span", { className: "text-gray-500 text-xs", children: [
          lineCount,
          " ",
          lineCount === 1 ? "line" : "lines"
        ] })
      ] }),
      /* @__PURE__ */ jsx4(
        "button",
        {
          onClick: handleCopy,
          className: "flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800",
          title: "Copy code",
          children: copied ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx4(Check, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsx4("span", { className: "text-xs", children: "Copied!" })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx4(Copy, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsx4("span", { className: "text-xs", children: "Copy" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsx4("div", { className: "relative", children: /* @__PURE__ */ jsx4(
      SyntaxHighlighter,
      {
        style: isDark ? vscDarkPlus : oneLight,
        language: normalizedLanguage,
        PreTag: "div",
        showLineNumbers: shouldShowLineNumbers,
        wrapLines: true,
        wrapLongLines: true,
        lineNumberStyle: {
          minWidth: "2.5em",
          paddingRight: "1em",
          color: "#9CA3AF",
          fontSize: "0.75rem",
          userSelect: "none"
        },
        customStyle: {
          margin: 0,
          padding: "0.75rem",
          background: isDark ? "#1e1e1e" : "#fafafa",
          fontSize: "0.875rem",
          lineHeight: "1.5",
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          overflowX: "auto",
          maxWidth: "100%"
        },
        codeTagProps: {
          style: {
            fontSize: "0.875rem",
            fontFamily: "inherit"
          }
        },
        children: children.replace(/\n$/, "")
      }
    ) })
  ] });
};
var MessageRenderer = ({
  message,
  content: providedContent,
  className = "",
  isUser = false,
  isStreaming = false,
  theme = "light"
}) => {
  const content = useMemo2(() => {
    if (providedContent)
      return providedContent;
    if (message?.parts) {
      return message.parts.filter((part) => part.kind === "text").map((part) => part.text || "").join("");
    }
    return "";
  }, [message, providedContent]);
  let config;
  try {
    const chatConfig = useChatConfig();
    config = chatConfig.config;
  } catch {
    config = {
      enableMarkdown: true,
      enableCodeHighlighting: true,
      theme: theme === "dark" ? "dark" : "chatgpt"
    };
  }
  const isDark = theme === "dark" || isUser || className.includes("text-white");
  const hasMarkdownSyntax = useMemo2(() => {
    if (!config.enableMarkdown || !content)
      return false;
    const markdownPatterns = [
      /^#{1,6}\s+/m,
      // Headers
      /\*\*.*?\*\*/g,
      // Bold
      /\*.*?\*/g,
      // Italic  
      /`.*?`/g,
      // Inline code
      /```[\s\S]*?```/g,
      // Code blocks
      /^\s*[-*+]\s+/m,
      // Lists
      /^\s*\d+\.\s+/m,
      // Numbered lists
      /^\s*>\s+/m,
      // Blockquotes
      /\[.*?\]\(.*?\)/g,
      // Links
      /!\[.*?\]\(.*?\)/g,
      // Images
      /^\|.*\|/m
      // Tables
    ];
    return markdownPatterns.some((pattern) => pattern.test(content));
  }, [content, config.enableMarkdown]);
  const looksLikeCode = useMemo2(() => {
    if (!config.enableCodeHighlighting)
      return false;
    if (hasMarkdownSyntax)
      return false;
    const lines = content.split("\n");
    const totalLines = lines.length;
    if (totalLines === 1 && content.length < 50) {
      return false;
    }
    const explicitCodePatterns = [
      /^#!\//,
      // Shebang
      /^\s*(function|const|let|var)\s+\w+\s*[=\(]/,
      // JS/TS function/variable declarations
      /^\s*(class|interface)\s+\w+/,
      // Class/interface declarations
      /^\s*(import|export)\s+/,
      // Import/export statements
      /^\s*(def|class)\s+\w+/,
      // Python def/class
      /^\s*(public|private|protected)\s+(class|interface|static)/,
      // Java/C# declarations
      /^\s*<\?php/,
      // PHP opening tag
      /^\s*<html|<head|<body|<div/,
      // HTML tags
      /^\s*\{[\s]*"[\w"]+"\s*:/,
      // JSON objects (key-value pairs)
      /^\s*SELECT\s+.*\s+FROM\s+/i,
      // SQL SELECT statements
      /^\s*\/\*[\s\S]*\*\//,
      // Block comments
      /^[ \t]*\/\/\s*\w+/,
      // Line comments (with actual content)
      /;\s*$/
      // Lines ending with semicolons
    ];
    const hasExplicitCode = explicitCodePatterns.some((pattern) => pattern.test(content));
    if (!hasExplicitCode)
      return false;
    const structuralPatterns = [
      /[{}[\]()]/g,
      // Brackets and braces
      /^\s{2,}/m,
      // Indentation
      /=>/g,
      // Arrow functions
      /[;:]/g
      // Semicolons or colons
    ];
    const structureCount = structuralPatterns.reduce((count, pattern) => {
      const matches = content.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
    return structureCount >= 3;
  }, [content, hasMarkdownSyntax, config.enableCodeHighlighting]);
  const detectLanguage = useMemo2(() => {
    if (/\b(function|const|let|var|=>|console\.log)\b/.test(content))
      return "javascript";
    if (/\b(interface|type|as\s+\w+)\b/.test(content))
      return "typescript";
    if (/\b(def|import|from|print|if\s+\w+:)\b/.test(content))
      return "python";
    if (/\b(public\s+class|static\s+void|System\.out)\b/.test(content))
      return "java";
    if (/\b(fn|let\s+mut|impl|match)\b/.test(content))
      return "rust";
    if (/\b(func|package|import|fmt\.)\b/.test(content))
      return "go";
    if (/SELECT.*FROM|INSERT.*INTO|UPDATE.*SET/i.test(content))
      return "sql";
    if (/<[^>]+>.*<\/[^>]+>/.test(content))
      return "html";
    if (/\{[^}]*:[^}]*\}/.test(content))
      return "json";
    if (/^#!\/bin\/(bash|sh)/.test(content))
      return "bash";
    if (/\$\w+|echo\s+/.test(content))
      return "bash";
    return "text";
  }, [content]);
  if (looksLikeCode) {
    return /* @__PURE__ */ jsx4(
      CodeBlock,
      {
        language: detectLanguage,
        isDark,
        children: content
      }
    );
  }
  if (!hasMarkdownSyntax) {
    return /* @__PURE__ */ jsx4("div", { className: `whitespace-pre-wrap break-words ${className}`, children: content });
  }
  return /* @__PURE__ */ jsxs("div", { className: `prose prose-sm max-w-none ${isDark ? "prose-invert" : ""} ${className} break-words`, children: [
    /* @__PURE__ */ jsx4(
      ReactMarkdown,
      {
        components: {
          code({ className: className2, children }) {
            const match = /language-(\w+)/.exec(className2 || "");
            const language = match ? match[1] : "";
            return /* @__PURE__ */ jsx4(
              CodeBlock,
              {
                language,
                inline: true,
                isDark,
                children: String(children).replace(/\n$/, "")
              }
            );
          },
          // Enhanced blockquote styling
          blockquote({ children }) {
            return /* @__PURE__ */ jsx4("blockquote", { className: `border-l-4 pl-4 py-2 italic my-4 rounded-r ${isDark ? "border-blue-400 text-blue-200 bg-blue-900/20" : "border-blue-500 text-blue-700 bg-blue-50"}`, children });
          },
          // Enhanced table styling with overflow handling
          table({ children }) {
            return /* @__PURE__ */ jsx4("div", { className: "overflow-x-auto my-4", children: /* @__PURE__ */ jsx4("table", { className: `min-w-full border-collapse rounded-lg overflow-hidden ${isDark ? "border-gray-600" : "border-gray-300"}`, children }) });
          },
          th({ children }) {
            return /* @__PURE__ */ jsx4("th", { className: `border px-4 py-2 font-semibold text-left ${isDark ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-gray-100"}`, children });
          },
          td({ children }) {
            return /* @__PURE__ */ jsx4("td", { className: `border px-4 py-2 ${isDark ? "border-gray-600" : "border-gray-300"}`, children });
          }
        },
        children: content
      }
    ),
    isStreaming && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-2 text-xs opacity-60", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex space-x-1", children: [
        /* @__PURE__ */ jsx4("div", { className: "w-1 h-1 bg-current rounded-full animate-bounce" }),
        /* @__PURE__ */ jsx4("div", { className: "w-1 h-1 bg-current rounded-full animate-bounce", style: { animationDelay: "0.1s" } }),
        /* @__PURE__ */ jsx4("div", { className: "w-1 h-1 bg-current rounded-full animate-bounce", style: { animationDelay: "0.2s" } })
      ] }),
      /* @__PURE__ */ jsx4("span", { children: "AI is typing..." })
    ] })
  ] });
};
var MessageRenderer_default = MessageRenderer;

// src/components/ExternalToolManager.tsx
import { useState as useState6, useCallback as useCallback3, useEffect as useEffect5 } from "react";
import { X as X2, Loader2 } from "lucide-react";

// src/components/Toast.tsx
import { useEffect as useEffect4 } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { jsx as jsx5, jsxs as jsxs2 } from "react/jsx-runtime";
var Toast = ({ message, type, onClose }) => {
  useEffect4(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5e3);
    return () => clearTimeout(timer);
  }, [onClose]);
  const getIcon = () => {
    switch (type) {
      case "success":
        return /* @__PURE__ */ jsx5(CheckCircle, { className: "w-5 h-5 text-green-500" });
      case "error":
        return /* @__PURE__ */ jsx5(AlertCircle, { className: "w-5 h-5 text-red-500" });
      case "warning":
        return /* @__PURE__ */ jsx5(AlertTriangle, { className: "w-5 h-5 text-yellow-500" });
      case "info":
        return /* @__PURE__ */ jsx5(Info, { className: "w-5 h-5 text-blue-500" });
    }
  };
  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
        return "bg-blue-50 border-blue-200";
    }
  };
  return /* @__PURE__ */ jsx5("div", { className: `fixed top-4 right-4 z-50 p-4 border rounded-lg shadow-lg ${getBgColor()}`, children: /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-3", children: [
    getIcon(),
    /* @__PURE__ */ jsx5("span", { className: "text-sm font-medium text-gray-900", children: message }),
    /* @__PURE__ */ jsx5(
      "button",
      {
        onClick: onClose,
        className: "ml-2 text-gray-400 hover:text-gray-600 transition-colors",
        children: /* @__PURE__ */ jsx5(X, { className: "w-4 h-4" })
      }
    )
  ] }) });
};
var Toast_default = Toast;

// src/components/ApprovalDialog.tsx
import { useState as useState5 } from "react";
import { AlertTriangle as AlertTriangle2, CheckCircle as CheckCircle2, XCircle } from "lucide-react";

// src/components/ui/button.tsx
import * as React6 from "react";

// src/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/components/ui/button.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
var buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline"
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10"
  }
};
var Button = React6.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return /* @__PURE__ */ jsx6(
      "button",
      {
        className: cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";

// src/components/ui/dialog.tsx
import * as React7 from "react";
import { jsx as jsx7, jsxs as jsxs3 } from "react/jsx-runtime";
var Dialog = React7.createContext({});
var DialogRoot = ({ open, onOpenChange, children }) => {
  return /* @__PURE__ */ jsx7(Dialog.Provider, { value: { open, onOpenChange }, children });
};
var DialogTrigger = React7.forwardRef(({ className, children, ...props }, ref) => {
  const context = React7.useContext(Dialog);
  return /* @__PURE__ */ jsx7(
    "button",
    {
      ref,
      className: cn(className),
      onClick: () => context.onOpenChange?.(true),
      ...props,
      children
    }
  );
});
DialogTrigger.displayName = "DialogTrigger";
var DialogContent = React7.forwardRef(({ className, children, ...props }, ref) => {
  const context = React7.useContext(Dialog);
  if (!context.open)
    return null;
  return /* @__PURE__ */ jsx7("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm", children: /* @__PURE__ */ jsxs3(
    "div",
    {
      ref,
      className: cn(
        "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx7(
          "button",
          {
            className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            onClick: () => context.onOpenChange?.(false),
            children: /* @__PURE__ */ jsxs3(
              "svg",
              {
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: "h-4 w-4",
                children: [
                  /* @__PURE__ */ jsx7("path", { d: "m18 6-12 12" }),
                  /* @__PURE__ */ jsx7("path", { d: "m6 6 12 12" })
                ]
              }
            )
          }
        )
      ]
    }
  ) });
});
DialogContent.displayName = "DialogContent";
var DialogHeader = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx7(
  "div",
  {
    ref,
    className: cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    ),
    ...props
  }
));
DialogHeader.displayName = "DialogHeader";
var DialogTitle = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx7(
  "h3",
  {
    ref,
    className: cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = "DialogTitle";

// src/components/ApprovalDialog.tsx
import { jsx as jsx8, jsxs as jsxs4 } from "react/jsx-runtime";
var ApprovalDialog = ({
  toolCalls,
  reason,
  onApprove,
  onDeny,
  onCancel
}) => {
  const [isVisible, setIsVisible] = useState5(true);
  if (!isVisible)
    return null;
  const handleApprove = () => {
    setIsVisible(false);
    onApprove();
  };
  const handleDeny = () => {
    setIsVisible(false);
    onDeny();
  };
  const handleCancel = () => {
    setIsVisible(false);
    onCancel();
  };
  return /* @__PURE__ */ jsx8(DialogRoot, { children: /* @__PURE__ */ jsxs4(DialogContent, { children: [
    /* @__PURE__ */ jsx8(DialogHeader, { children: /* @__PURE__ */ jsxs4("div", { className: "flex items-center", children: [
      /* @__PURE__ */ jsx8(AlertTriangle2, { className: "w-6 h-6 text-yellow-500 mr-3" }),
      /* @__PURE__ */ jsx8(DialogTitle, { children: "Tool Execution Approval" })
    ] }) }),
    /* @__PURE__ */ jsxs4("div", { className: "p-4", children: [
      reason && /* @__PURE__ */ jsx8("div", { className: "mb-4", children: /* @__PURE__ */ jsx8("p", { className: "text-sm text-muted-foreground", children: reason }) }),
      /* @__PURE__ */ jsxs4("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx8("h4", { className: "text-sm font-medium mb-2", children: "Tools to execute:" }),
        /* @__PURE__ */ jsx8("div", { className: "space-y-2", children: toolCalls.map((toolCall) => /* @__PURE__ */ jsx8("div", { className: "flex items-center p-2 bg-muted rounded", children: /* @__PURE__ */ jsxs4("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx8("p", { className: "text-sm font-medium", children: toolCall.tool_name }),
          toolCall.input && /* @__PURE__ */ jsx8("p", { className: "text-xs text-muted-foreground mt-1", children: typeof toolCall.input === "string" ? toolCall.input : JSON.stringify(toolCall.input) })
        ] }) }, toolCall.tool_call_id)) })
      ] }),
      /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-end space-x-2 p-6 pt-0", children: [
        /* @__PURE__ */ jsxs4(
          Button,
          {
            onClick: handleApprove,
            variant: "default",
            className: "flex-1",
            children: [
              /* @__PURE__ */ jsx8(CheckCircle2, { className: "w-4 h-4 mr-2" }),
              "Approve"
            ]
          }
        ),
        /* @__PURE__ */ jsxs4(
          Button,
          {
            onClick: handleDeny,
            variant: "destructive",
            className: "flex-1",
            children: [
              /* @__PURE__ */ jsx8(XCircle, { className: "w-4 h-4 mr-2" }),
              "Deny"
            ]
          }
        ),
        /* @__PURE__ */ jsx8(
          Button,
          {
            onClick: handleCancel,
            variant: "outline",
            children: "Cancel"
          }
        )
      ] })
    ] })
  ] }) });
};
var ApprovalDialog_default = ApprovalDialog;

// src/components/ExternalToolManager.tsx
import { Fragment as Fragment2, jsx as jsx9, jsxs as jsxs5 } from "react/jsx-runtime";
var ExternalToolManager = ({
  agent,
  toolCalls,
  onToolComplete,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState6(false);
  const [toasts, setToasts] = useState6([]);
  const [approvalDialog, setApprovalDialog] = useState6(null);
  const [processingResults, setProcessingResults] = useState6([]);
  const showToast = useCallback3((message, type = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5e3);
  }, []);
  const showApprovalDialog = useCallback3((toolCalls2, reason) => {
    return new Promise((resolve) => {
      setApprovalDialog({ toolCalls: toolCalls2, reason, resolve });
    });
  }, []);
  useEffect5(() => {
    if (toolCalls.length > 0 && !isProcessing) {
      processToolCalls();
    }
  }, [toolCalls, agent]);
  const processToolCalls = useCallback3(async () => {
    if (toolCalls.length === 0 || !agent)
      return;
    setIsProcessing(true);
    setProcessingResults([]);
    try {
      const results = [];
      for (const toolCall of toolCalls) {
        try {
          if (toolCall.tool_name === APPROVAL_REQUEST_TOOL_NAME) {
            const input = toolCall.input;
            const toolCallsToApprove = input.tool_calls || [];
            const reason = input.reason || input.prompt || "Approval required";
            const approved = await showApprovalDialog(toolCallsToApprove, reason);
            const result = {
              tool_call_id: toolCall.tool_call_id,
              result: {
                approved,
                reason: approved ? "Approved by user" : "Denied by user",
                tool_calls: toolCallsToApprove
              },
              success: true
            };
            results.push(result);
          } else if (toolCall.tool_name === "toast") {
            const input = toolCall.input;
            const message = input.message || "Toast message";
            const type = input.type || "info";
            showToast(message, type);
            const result = {
              tool_call_id: toolCall.tool_call_id,
              result: { success: true, message: "Toast displayed successfully" },
              success: true
            };
            results.push(result);
          } else if (toolCall.tool_name === "input_request") {
            const input = toolCall.input;
            const prompt2 = input.prompt || "Please provide input:";
            const defaultValue = input.default || "";
            const userInput = window.prompt(prompt2, defaultValue);
            if (userInput === null) {
              const result = {
                tool_call_id: toolCall.tool_call_id,
                result: null,
                success: false,
                error: "User cancelled input"
              };
              results.push(result);
            } else {
              const result = {
                tool_call_id: toolCall.tool_call_id,
                result: { input: userInput },
                success: true
              };
              results.push(result);
            }
          } else {
            const result = await agent.executeTool(toolCall);
            results.push(result);
          }
          setProcessingResults((prev) => [...prev, ...results.slice(-1)]);
        } catch (error) {
          console.error(`Error executing tool ${toolCall.tool_name}:`, error);
          const errorResult = {
            tool_call_id: toolCall.tool_call_id,
            result: null,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          };
          results.push(errorResult);
          setProcessingResults((prev) => [...prev, errorResult]);
        }
      }
      if (results.length > 0) {
        onToolComplete(results);
      }
    } catch (error) {
      console.error("Error processing tool calls:", error);
      const errorResults = toolCalls.map((toolCall) => ({
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }));
      setProcessingResults(errorResults);
      onToolComplete(errorResults);
    } finally {
      setIsProcessing(false);
    }
  }, [toolCalls, agent, onToolComplete, showToast, showApprovalDialog]);
  const handleApprovalDialogResponse = useCallback3((approved) => {
    if (approvalDialog) {
      approvalDialog.resolve(approved);
      setApprovalDialog(null);
    }
  }, [approvalDialog]);
  const handleApprovalDialogCancel = useCallback3(() => {
    if (approvalDialog) {
      approvalDialog.resolve(false);
      setApprovalDialog(null);
    }
  }, [approvalDialog]);
  const removeToast = useCallback3((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  if (toolCalls.length === 0)
    return null;
  return /* @__PURE__ */ jsxs5(Fragment2, { children: [
    /* @__PURE__ */ jsxs5("div", { className: "my-4 p-4 border border-blue-200 bg-blue-50 rounded-lg", children: [
      /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx9(Loader2, { className: `w-5 h-5 text-blue-600 ${isProcessing ? "animate-spin" : ""}` }),
          /* @__PURE__ */ jsx9("span", { className: "font-semibold text-blue-800", children: isProcessing ? "Processing External Tools..." : "External Tools Completed" })
        ] }),
        /* @__PURE__ */ jsxs5(
          "button",
          {
            onClick: onCancel,
            className: "flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors",
            children: [
              /* @__PURE__ */ jsx9(X2, { className: "w-4 h-4" }),
              "Cancel"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx9("div", { className: "space-y-2", children: toolCalls.map((toolCall) => {
        const result = processingResults.find((r) => r.tool_call_id === toolCall.tool_call_id);
        const status = result ? result.success ? "completed" : "error" : isProcessing ? "processing" : "pending";
        return /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between p-2 bg-white rounded border", children: [
          /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx9("span", { className: "font-medium", children: toolCall.tool_name }),
            /* @__PURE__ */ jsx9("span", { className: `text-sm ${status === "completed" ? "text-green-600" : status === "error" ? "text-red-600" : status === "processing" ? "text-blue-600" : "text-gray-500"}`, children: status })
          ] }),
          result && !result.success && /* @__PURE__ */ jsx9("span", { className: "text-xs text-red-600", children: result.error })
        ] }, toolCall.tool_call_id);
      }) }),
      processingResults.length > 0 && /* @__PURE__ */ jsx9("div", { className: "mt-3 p-2 bg-gray-100 rounded", children: /* @__PURE__ */ jsxs5("p", { className: "text-sm text-gray-700", children: [
        processingResults.filter((r) => r.success).length,
        " of ",
        processingResults.length,
        " tools completed successfully"
      ] }) })
    ] }),
    approvalDialog && /* @__PURE__ */ jsx9(
      ApprovalDialog_default,
      {
        toolCalls: approvalDialog.toolCalls,
        reason: approvalDialog.reason,
        onApprove: () => handleApprovalDialogResponse(true),
        onDeny: () => handleApprovalDialogResponse(false),
        onCancel: handleApprovalDialogCancel
      }
    ),
    toasts.map((toast) => /* @__PURE__ */ jsx9(
      Toast_default,
      {
        message: toast.message,
        type: toast.type,
        onClose: () => removeToast(toast.id)
      },
      toast.id
    ))
  ] });
};
var ExternalToolManager_default = ExternalToolManager;

// src/components/Chat.tsx
import { jsx as jsx10, jsxs as jsxs6 } from "react/jsx-runtime";
var ChatContent = ({
  thread,
  agent,
  onThreadUpdate,
  MessageRendererComponent = MessageRenderer_default,
  ExternalToolManagerComponent = ExternalToolManager_default,
  HeaderComponent,
  InputComponent,
  LoadingComponent,
  ErrorComponent,
  className = "",
  placeholder,
  showHeader = true,
  theme = "light"
}) => {
  const [input, setInput] = useState7("");
  const [hasExternalTools, setHasExternalTools] = useState7(false);
  const handleToolCalls = useCallback4((toolCalls) => {
    setHasExternalTools(toolCalls.length > 0);
  }, []);
  const {
    messages,
    loading,
    error,
    sendMessageStream,
    externalToolCalls,
    handleExternalToolComplete,
    handleExternalToolCancel
  } = useChat({
    agentId: agent.id,
    threadId: thread.id,
    agent,
    onToolCalls: handleToolCalls
  });
  const handleSubmit = useCallback4(async (e) => {
    e.preventDefault();
    if (!input.trim() || loading)
      return;
    const message = input.trim();
    setInput("");
    try {
      await sendMessageStream(message);
      onThreadUpdate?.();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }, [input, loading, sendMessageStream, onThreadUpdate]);
  const handleKeyDown = useCallback4((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);
  const displayMessages = useMemo3(() => {
    return messages.filter((msg) => {
      if (msg.role === "user")
        return true;
      if (msg.role === "agent") {
        const hasContent = msg.parts?.some(
          (part) => part.kind === "text" && part.text?.trim() || part.kind === "file"
        );
        return hasContent;
      }
      return false;
    });
  }, [messages]);
  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-gray-900" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const borderClass = isDark ? "border-gray-700" : "border-gray-200";
  const headerBgClass = isDark ? "bg-gray-800" : "bg-gray-50";
  const DefaultHeader = () => /* @__PURE__ */ jsx10("div", { className: `flex-shrink-0 px-4 py-3 border-b ${borderClass} ${headerBgClass}`, children: /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsx10("div", { className: "w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx10(Bot, { className: "w-5 h-5 text-blue-600" }) }),
    /* @__PURE__ */ jsxs6("div", { children: [
      /* @__PURE__ */ jsx10("h2", { className: `font-semibold ${textClass}`, children: agent.name }),
      /* @__PURE__ */ jsx10("p", { className: `text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`, children: agent.description })
    ] })
  ] }) });
  const DefaultLoading = () => /* @__PURE__ */ jsxs6("div", { className: "flex gap-3", children: [
    /* @__PURE__ */ jsx10("div", { className: "w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx10(Bot, { className: "w-5 h-5 text-blue-600" }) }),
    /* @__PURE__ */ jsx10("div", { className: `rounded-lg px-4 py-2 ${isDark ? "bg-gray-800" : "bg-gray-100"}`, children: /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx10(Loader22, { className: "w-4 h-4 animate-spin" }),
      /* @__PURE__ */ jsx10("span", { className: isDark ? "text-gray-300" : "text-gray-600", children: "Thinking..." })
    ] }) })
  ] });
  const DefaultError = ({ error: error2 }) => /* @__PURE__ */ jsxs6("div", { className: `flex items-center gap-2 p-3 ${isDark ? "bg-red-900 border-red-700" : "bg-red-50 border-red-200"} border rounded-lg`, children: [
    /* @__PURE__ */ jsx10(AlertCircle2, { className: "w-5 h-5 text-red-600" }),
    /* @__PURE__ */ jsx10("span", { className: "text-red-700", children: error2.message })
  ] });
  const DefaultInput = () => /* @__PURE__ */ jsxs6("div", { className: `flex-shrink-0 border-t ${borderClass} p-4`, children: [
    /* @__PURE__ */ jsxs6("form", { onSubmit: handleSubmit, className: "flex gap-2", children: [
      /* @__PURE__ */ jsx10("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsx10(
        "textarea",
        {
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown: handleKeyDown,
          placeholder: placeholder || `Message ${agent.name}...`,
          className: `w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`,
          rows: 1,
          disabled: loading || hasExternalTools,
          style: {
            minHeight: "40px",
            maxHeight: "120px",
            height: "auto"
          }
        }
      ) }),
      /* @__PURE__ */ jsx10(
        "button",
        {
          type: "submit",
          disabled: !input.trim() || loading || hasExternalTools,
          className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]",
          children: loading ? /* @__PURE__ */ jsx10(Loader22, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx10(Send, { className: "w-4 h-4" })
        }
      )
    ] }),
    hasExternalTools && /* @__PURE__ */ jsx10("div", { className: `mt-2 text-sm px-3 py-2 rounded ${isDark ? "text-amber-300 bg-amber-900 border border-amber-700" : "text-amber-600 bg-amber-50 border border-amber-200"}`, children: "Please respond to the tool requests above before sending a new message." })
  ] });
  return /* @__PURE__ */ jsxs6("div", { className: `flex flex-col h-full ${bgClass} ${textClass} ${className}`, children: [
    showHeader && (HeaderComponent ? /* @__PURE__ */ jsx10(HeaderComponent, { agent, thread }) : /* @__PURE__ */ jsx10(DefaultHeader, {})),
    /* @__PURE__ */ jsxs6("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [
      error && (ErrorComponent ? /* @__PURE__ */ jsx10(ErrorComponent, { error }) : /* @__PURE__ */ jsx10(DefaultError, { error })),
      displayMessages.length === 0 && !loading && /* @__PURE__ */ jsxs6("div", { className: "text-center py-8", children: [
        /* @__PURE__ */ jsx10(Bot, { className: `w-12 h-12 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-400"}` }),
        /* @__PURE__ */ jsxs6("p", { className: isDark ? "text-gray-400" : "text-gray-500", children: [
          "Start a conversation with ",
          agent.name
        ] })
      ] }),
      displayMessages.map((message, index) => /* @__PURE__ */ jsxs6(
        "div",
        {
          className: `flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`,
          children: [
            message.role === "agent" && /* @__PURE__ */ jsx10("div", { className: "w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx10(Bot, { className: "w-5 h-5 text-blue-600" }) }),
            /* @__PURE__ */ jsx10("div", { className: `max-w-[80%] ${message.role === "user" ? "order-first" : ""}`, children: /* @__PURE__ */ jsx10(
              "div",
              {
                className: `rounded-lg px-4 py-2 ${message.role === "user" ? "bg-blue-600 text-white ml-auto" : isDark ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-900"}`,
                children: /* @__PURE__ */ jsx10(
                  MessageRendererComponent,
                  {
                    message,
                    isUser: message.role === "user",
                    isStreaming: loading && index === displayMessages.length - 1
                  }
                )
              }
            ) }),
            message.role === "user" && /* @__PURE__ */ jsx10("div", { className: `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-gray-700" : "bg-gray-100"}`, children: /* @__PURE__ */ jsx10(User, { className: `w-5 h-5 ${isDark ? "text-gray-300" : "text-gray-600"}` }) })
          ]
        },
        `${message.messageId}-${index}`
      )),
      loading && displayMessages.length === 0 && (LoadingComponent ? /* @__PURE__ */ jsx10(LoadingComponent, {}) : /* @__PURE__ */ jsx10(DefaultLoading, {})),
      externalToolCalls.length > 0 && /* @__PURE__ */ jsx10(
        ExternalToolManagerComponent,
        {
          agent,
          toolCalls: externalToolCalls,
          onToolComplete: handleExternalToolComplete,
          onCancel: handleExternalToolCancel
        }
      )
    ] }),
    InputComponent ? /* @__PURE__ */ jsx10(
      InputComponent,
      {
        value: input,
        onChange: setInput,
        onSubmit: handleSubmit,
        onKeyDown: handleKeyDown,
        placeholder,
        loading,
        hasExternalTools,
        agent,
        theme
      }
    ) : /* @__PURE__ */ jsx10(DefaultInput, {})
  ] });
};
var Chat_default = ChatContent;

// src/components/EmbeddableChat.tsx
import { useState as useState8, useCallback as useCallback5, useMemo as useMemo4 } from "react";
import { Send as Send2, Bot as Bot2, User as User2, Loader2 as Loader23, AlertCircle as AlertCircle3 } from "lucide-react";
import { Fragment as Fragment3, jsx as jsx11, jsxs as jsxs7 } from "react/jsx-runtime";
var EmbeddableChat = ({
  agentId,
  threadId,
  agent: providedAgent,
  height = "600px",
  placeholder = "Type a message...",
  theme = "light",
  showDebug = false,
  onThreadUpdate,
  className = "",
  MessageRendererComponent = MessageRenderer_default,
  ExternalToolManagerComponent = ExternalToolManager_default,
  HeaderComponent,
  InputComponent,
  LoadingComponent,
  ErrorComponent,
  showHeader = true
}) => {
  const { agent: internalAgent, loading: agentLoading } = useAgent({
    agentId: providedAgent ? void 0 : agentId
  });
  const agent = providedAgent || internalAgent;
  const [input, setInput] = useState8("");
  const [hasExternalTools, setHasExternalTools] = useState8(false);
  const handleToolCalls = useCallback5((toolCalls) => {
    setHasExternalTools(toolCalls.length > 0);
  }, []);
  const {
    messages,
    loading,
    error,
    sendMessageStream,
    externalToolCalls,
    handleExternalToolComplete,
    handleExternalToolCancel
  } = useChat({
    agentId: agent?.id || agentId,
    threadId,
    agent: agent || void 0,
    onToolCalls: handleToolCalls
  });
  const handleSubmit = useCallback5(async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || !agent)
      return;
    const message = input.trim();
    setInput("");
    try {
      await sendMessageStream(message);
      onThreadUpdate?.();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }, [input, loading, agent, sendMessageStream, onThreadUpdate]);
  const handleKeyDown = useCallback5((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);
  const displayMessages = useMemo4(() => {
    return messages.filter((msg) => {
      if (msg.role === "user")
        return true;
      if (msg.role === "agent") {
        const hasContent = msg.parts?.some(
          (part) => part.kind === "text" && part.text?.trim() || part.kind === "file"
        );
        return hasContent;
      }
      if (showDebug && msg.metadata)
        return true;
      return false;
    });
  }, [messages, showDebug]);
  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-gray-900" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const borderClass = isDark ? "border-gray-700" : "border-gray-200";
  const headerBgClass = isDark ? "bg-gray-800" : "bg-gray-50";
  const DefaultHeader = () => /* @__PURE__ */ jsx11("div", { className: `flex-shrink-0 px-4 py-3 border-b ${borderClass} ${headerBgClass}`, children: /* @__PURE__ */ jsxs7("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsx11("div", { className: "w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx11(Bot2, { className: "w-5 h-5 text-blue-600" }) }),
    /* @__PURE__ */ jsxs7("div", { children: [
      /* @__PURE__ */ jsx11("h2", { className: `font-semibold ${textClass}`, children: agent?.name || "Assistant" }),
      /* @__PURE__ */ jsx11("p", { className: `text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`, children: agent?.description || "AI Assistant" })
    ] })
  ] }) });
  const DefaultLoading = () => /* @__PURE__ */ jsx11("div", { className: `flex items-center justify-center ${bgClass} ${className}`, style: { height }, children: /* @__PURE__ */ jsxs7("div", { className: "flex items-center space-x-2", children: [
    /* @__PURE__ */ jsx11(Loader23, { className: "h-6 w-6 animate-spin text-blue-600" }),
    /* @__PURE__ */ jsx11("span", { className: textClass, children: "Loading agent..." })
  ] }) });
  const DefaultError = ({ error: error2 }) => /* @__PURE__ */ jsxs7("div", { className: `flex items-center gap-2 p-3 ${isDark ? "bg-red-900 border-red-700" : "bg-red-50 border-red-200"} border rounded-lg`, children: [
    /* @__PURE__ */ jsx11(AlertCircle3, { className: "w-5 h-5 text-red-600" }),
    /* @__PURE__ */ jsx11("span", { className: "text-red-700", children: error2.message })
  ] });
  const DefaultInput = () => /* @__PURE__ */ jsxs7("div", { className: `flex-shrink-0 border-t ${borderClass} p-4`, children: [
    /* @__PURE__ */ jsxs7("form", { onSubmit: handleSubmit, className: "flex gap-2", children: [
      /* @__PURE__ */ jsx11("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsx11(
        "textarea",
        {
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown: handleKeyDown,
          placeholder: placeholder || `Message ${agent?.name || "Assistant"}...`,
          className: `w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`,
          rows: 1,
          disabled: loading || hasExternalTools,
          style: {
            minHeight: "40px",
            maxHeight: "120px",
            height: "auto"
          }
        }
      ) }),
      /* @__PURE__ */ jsx11(
        "button",
        {
          type: "submit",
          disabled: !input.trim() || loading || hasExternalTools,
          className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]",
          children: loading ? /* @__PURE__ */ jsx11(Loader23, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx11(Send2, { className: "w-4 h-4" })
        }
      )
    ] }),
    hasExternalTools && /* @__PURE__ */ jsx11("div", { className: `mt-2 text-sm px-3 py-2 rounded ${isDark ? "text-amber-300 bg-amber-900 border border-amber-700" : "text-amber-600 bg-amber-50 border border-amber-200"}`, children: "Please respond to the tool requests above before sending a new message." })
  ] });
  if (agentLoading) {
    return LoadingComponent ? /* @__PURE__ */ jsx11(LoadingComponent, {}) : /* @__PURE__ */ jsx11(DefaultLoading, {});
  }
  if (!agent) {
    const noAgentError = new Error("Failed to load agent");
    return /* @__PURE__ */ jsx11("div", { className: `flex items-center justify-center ${bgClass} ${className}`, style: { height }, children: /* @__PURE__ */ jsx11("div", { className: "text-center", children: ErrorComponent ? /* @__PURE__ */ jsx11(ErrorComponent, { error: noAgentError }) : /* @__PURE__ */ jsxs7(Fragment3, { children: [
      /* @__PURE__ */ jsx11(AlertCircle3, { className: "h-12 w-12 text-red-500 mx-auto mb-2" }),
      /* @__PURE__ */ jsx11("p", { className: textClass, children: "Failed to load agent" })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs7("div", { className: `flex flex-col ${bgClass} ${textClass} ${className}`, style: { height }, children: [
    showHeader && (HeaderComponent ? /* @__PURE__ */ jsx11(HeaderComponent, { agent, agentId }) : /* @__PURE__ */ jsx11(DefaultHeader, {})),
    /* @__PURE__ */ jsxs7("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [
      error && (ErrorComponent ? /* @__PURE__ */ jsx11(ErrorComponent, { error }) : /* @__PURE__ */ jsx11(DefaultError, { error })),
      displayMessages.length === 0 && !loading && /* @__PURE__ */ jsxs7("div", { className: "text-center py-8", children: [
        /* @__PURE__ */ jsx11(Bot2, { className: `w-12 h-12 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-400"}` }),
        /* @__PURE__ */ jsxs7("p", { className: isDark ? "text-gray-400" : "text-gray-500", children: [
          "Start a conversation with ",
          agent.name
        ] })
      ] }),
      displayMessages.map((message, index) => /* @__PURE__ */ jsxs7(
        "div",
        {
          className: `flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`,
          children: [
            message.role === "agent" && /* @__PURE__ */ jsx11("div", { className: "w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx11(Bot2, { className: "w-5 h-5 text-blue-600" }) }),
            /* @__PURE__ */ jsx11("div", { className: `max-w-[80%] ${message.role === "user" ? "order-first" : ""}`, children: /* @__PURE__ */ jsx11(
              "div",
              {
                className: `rounded-lg px-4 py-2 ${message.role === "user" ? "bg-blue-600 text-white ml-auto" : isDark ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-900"}`,
                children: /* @__PURE__ */ jsx11(
                  MessageRendererComponent,
                  {
                    message,
                    isUser: message.role === "user",
                    isStreaming: loading && index === displayMessages.length - 1
                  }
                )
              }
            ) }),
            message.role === "user" && /* @__PURE__ */ jsx11("div", { className: `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-gray-700" : "bg-gray-100"}`, children: /* @__PURE__ */ jsx11(User2, { className: `w-5 h-5 ${isDark ? "text-gray-300" : "text-gray-600"}` }) })
          ]
        },
        `${message.messageId}-${index}`
      )),
      loading && displayMessages.length === 0 && /* @__PURE__ */ jsxs7("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsx11("div", { className: "w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx11(Bot2, { className: "w-5 h-5 text-blue-600" }) }),
        /* @__PURE__ */ jsx11("div", { className: `rounded-lg px-4 py-2 ${isDark ? "bg-gray-800" : "bg-gray-100"}`, children: /* @__PURE__ */ jsxs7("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx11(Loader23, { className: "w-4 h-4 animate-spin" }),
          /* @__PURE__ */ jsx11("span", { className: isDark ? "text-gray-300" : "text-gray-600", children: "Thinking..." })
        ] }) })
      ] }),
      externalToolCalls.length > 0 && /* @__PURE__ */ jsx11(
        ExternalToolManagerComponent,
        {
          agent,
          toolCalls: externalToolCalls,
          onToolComplete: handleExternalToolComplete,
          onCancel: handleExternalToolCancel
        }
      )
    ] }),
    InputComponent ? /* @__PURE__ */ jsx11(
      InputComponent,
      {
        value: input,
        onChange: setInput,
        onSubmit: handleSubmit,
        onKeyDown: handleKeyDown,
        placeholder,
        loading,
        hasExternalTools,
        agent,
        theme
      }
    ) : /* @__PURE__ */ jsx11(DefaultInput, {})
  ] });
};

// src/useAgents.ts
import { useState as useState9, useEffect as useEffect6, useCallback as useCallback6 } from "react";
function useAgents() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = useState9([]);
  const [loading, setLoading] = useState9(true);
  const [error, setError] = useState9(null);
  const fetchAgents = useCallback6(async () => {
    if (!client) {
      console.log("[useAgents] Client not available, skipping fetch");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log("[useAgents] Fetching agents...");
      const fetchedAgents = await client.getAgents();
      console.log("[useAgents] Fetched agents:", fetchedAgents);
      setAgents(fetchedAgents);
    } catch (err) {
      console.error("[useAgents] Failed to fetch agents:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch agents"));
    } finally {
      setLoading(false);
    }
  }, [client]);
  const getAgent = useCallback6(async (agentId) => {
    if (!client) {
      throw new Error("Client not available");
    }
    try {
      const agent = await client.getAgent(agentId);
      setAgents((prev) => prev.map((a) => a.id === agentId ? agent : a));
      return agent;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Failed to get agent");
      setError(error2);
      throw error2;
    }
  }, [client]);
  useEffect6(() => {
    if (clientLoading) {
      console.log("[useAgents] Client is loading, waiting...");
      setLoading(true);
      return;
    }
    if (clientError) {
      console.error("[useAgents] Client error:", clientError);
      setError(clientError);
      setLoading(false);
      return;
    }
    if (client) {
      console.log("[useAgents] Client ready, fetching agents");
      fetchAgents();
    } else {
      console.log("[useAgents] No client available");
      setLoading(false);
    }
  }, [clientLoading, clientError, client, fetchAgents]);
  return {
    agents,
    loading: loading || clientLoading,
    error: error || clientError,
    refetch: fetchAgents,
    getAgent
  };
}

// src/useThreads.ts
import { useState as useState10, useEffect as useEffect7, useCallback as useCallback7 } from "react";
function useThreads() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = useState10([]);
  const [loading, setLoading] = useState10(true);
  const [error, setError] = useState10(null);
  const fetchThreads = useCallback7(async () => {
    if (!client) {
      console.log("[useThreads] Client not available, skipping fetch");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log("[useThreads] Fetching threads...");
      const fetchedThreads = await client.getThreads();
      console.log("[useThreads] Fetched threads:", fetchedThreads);
      setThreads(fetchedThreads);
    } catch (err) {
      console.error("[useThreads] Failed to fetch threads:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch threads"));
    } finally {
      setLoading(false);
    }
  }, [client]);
  const fetchThread = useCallback7(async (threadId) => {
    if (!client) {
      throw new Error("Client not available");
    }
    try {
      const response = await client.getThread(threadId);
      return response;
    } catch (err) {
      console.error("[useThreads] Failed to fetch thread:", err);
      throw err;
    }
  }, [client]);
  const deleteThread = useCallback7(async (threadId) => {
    if (!client) {
      throw new Error("Client not available");
    }
    try {
      const response = await fetch(`${client.baseUrl}/api/v1/threads/${threadId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Failed to delete thread");
      }
      setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
    } catch (err) {
      setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
      console.warn("Failed to delete thread from server, but removed locally:", err);
    }
  }, [client]);
  const updateThread = useCallback7(async (threadId, localId) => {
    if (!client) {
      return;
    }
    try {
      const response = await fetch(`${client.baseUrl}/api/v1/threads/${threadId}`);
      if (response.ok) {
        const updatedThread = await response.json();
        setThreads((prev) => {
          if (localId && prev.some((thread) => thread.id === localId)) {
            return [
              updatedThread,
              ...prev.filter((thread) => thread.id !== localId && thread.id !== threadId)
            ];
          }
          return prev.map(
            (thread) => thread.id === threadId ? updatedThread : thread
          );
        });
      }
    } catch (err) {
      console.warn("Failed to update thread:", err);
    }
  }, [client]);
  useEffect7(() => {
    if (clientLoading) {
      console.log("[useThreads] Client is loading, waiting...");
      setLoading(true);
      return;
    }
    if (clientError) {
      console.error("[useThreads] Client error:", clientError);
      setError(clientError);
      setLoading(false);
      return;
    }
    if (client) {
      console.log("[useThreads] Client ready, fetching threads");
      fetchThreads();
    } else {
      console.log("[useThreads] No client available");
      setLoading(false);
    }
  }, [clientLoading, clientError, client, fetchThreads]);
  return {
    threads,
    loading: loading || clientLoading,
    error: error || clientError,
    refetch: fetchThreads,
    deleteThread,
    fetchThread,
    updateThread
  };
}

// src/useTools.ts
import { useCallback as useCallback8, useRef as useRef3 } from "react";
function useTools({ agent }) {
  const toolsRef = useRef3(/* @__PURE__ */ new Set());
  const addTool = useCallback8((tool) => {
    if (!agent) {
      console.warn("Cannot add tool: no agent provided");
      return;
    }
    agent.addTool(tool);
    toolsRef.current.add(tool.name);
  }, [agent]);
  const addTools = useCallback8((tools) => {
    if (!agent) {
      console.warn("Cannot add tools: no agent provided");
      return;
    }
    tools.forEach((tool) => {
      agent.addTool(tool);
      toolsRef.current.add(tool.name);
    });
  }, [agent]);
  const removeTool = useCallback8((toolName) => {
    if (!agent) {
      console.warn("Cannot remove tool: no agent provided");
      return;
    }
    agent.removeTool(toolName);
    toolsRef.current.delete(toolName);
  }, [agent]);
  const executeTool = useCallback8(async (toolCall) => {
    if (!agent) {
      return {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: "No agent provided"
      };
    }
    return agent.executeTool(toolCall);
  }, [agent]);
  const getTools = useCallback8(() => {
    if (!agent)
      return [];
    return agent.getTools();
  }, [agent]);
  const hasTool = useCallback8((toolName) => {
    if (!agent)
      return false;
    return agent.hasTool(toolName);
  }, [agent]);
  return {
    addTool,
    addTools,
    removeTool,
    executeTool,
    getTools,
    hasTool
  };
}

// src/builtinHandlers.ts
var createBuiltinTools = () => {
  const tools = {
    // Approval request tool
    [APPROVAL_REQUEST_TOOL_NAME]: {
      name: APPROVAL_REQUEST_TOOL_NAME,
      description: "Request user approval for actions",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Approval prompt to show user" },
          action: { type: "string", description: "Action requiring approval" },
          tool_calls: {
            type: "array",
            description: "Tool calls requiring approval",
            items: {
              type: "object",
              properties: {
                tool_call_id: { type: "string" },
                tool_name: { type: "string" },
                input: { type: "object" }
              }
            }
          }
        },
        required: ["prompt"]
      },
      handler: async (_input) => {
        return { approved: false, message: "Approval handled by UI" };
      }
    },
    // Toast notification tool
    toast: {
      name: "toast",
      description: "Show a toast notification to the user",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Message to display" },
          type: {
            type: "string",
            enum: ["success", "error", "warning", "info"],
            default: "info",
            description: "Type of toast notification"
          }
        },
        required: ["message"]
      },
      handler: async (_input) => {
        return { success: true, message: "Toast displayed" };
      }
    },
    // Input request tool
    input_request: {
      name: "input_request",
      description: "Request text input from the user",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Prompt to show the user" },
          default: { type: "string", description: "Default value for the input" }
        },
        required: ["prompt"]
      },
      handler: async (input) => {
        const userInput = prompt(input.prompt || "Please provide input:", input.default || "");
        return { input: userInput };
      }
    },
    // Confirmation tool
    confirm: {
      name: "confirm",
      description: "Ask user for confirmation",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Confirmation message" },
          title: { type: "string", description: "Title for the confirmation dialog" }
        },
        required: ["message"]
      },
      handler: async (input) => {
        const confirmed = confirm(input.message || "Are you sure?");
        return { confirmed };
      }
    },
    // Notification tool
    notify: {
      name: "notify",
      description: "Show a notification to the user",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Notification title" },
          message: { type: "string", description: "Notification message" },
          type: {
            type: "string",
            enum: ["success", "error", "warning", "info"],
            default: "info",
            description: "Type of notification"
          }
        },
        required: ["message"]
      },
      handler: async (input) => {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(input.title || "Notification", {
            body: input.message,
            icon: "/favicon.ico"
          });
        } else {
          alert(`${input.title ? input.title + ": " : ""}${input.message}`);
        }
        return { success: true };
      }
    }
  };
  return tools;
};
var createTool = (name, description, parameters, handler) => {
  return {
    name,
    description,
    parameters,
    handler
  };
};
var builtinTools = createBuiltinTools();
var approvalRequestTool = builtinTools[APPROVAL_REQUEST_TOOL_NAME];
var toastTool = builtinTools.toast;
var inputRequestTool = builtinTools.input_request;
var confirmTool = builtinTools.confirm;
var notifyTool = builtinTools.notify;

// src/components/ui/input.tsx
import * as React12 from "react";
import { jsx as jsx12 } from "react/jsx-runtime";
var Input = React12.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx12(
      "input",
      {
        type,
        className: cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";

// src/components/ui/textarea.tsx
import * as React13 from "react";
import { jsx as jsx13 } from "react/jsx-runtime";
var Textarea = React13.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx13(
      "textarea",
      {
        className: cn(
          "flex min-h-[80px] w-full rounded-md border-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";
export {
  APPROVAL_REQUEST_TOOL_NAME,
  Agent,
  ApprovalDialog_default as ApprovalDialog,
  Button,
  Chat_default as Chat,
  DistriClient,
  DistriProvider,
  EmbeddableChat,
  ExternalToolManager_default as ExternalToolManager,
  Input,
  MessageRenderer_default as MessageRenderer,
  Textarea,
  Toast_default as Toast,
  approvalRequestTool,
  builtinTools,
  buttonVariants,
  confirmTool,
  createBuiltinTools,
  createTool,
  extractExternalToolCalls,
  inputRequestTool,
  notifyTool,
  toastTool,
  useAgent,
  useAgents,
  useChat,
  useThreads,
  useTools
};
