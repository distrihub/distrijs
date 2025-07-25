"use client";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/useAgent.ts
import React2, { useState as useState3, useCallback, useRef } from "react";

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
        if (e.message.startsWith("RPC error for") || e.message.startsWith("HTTP error for")) throw e;
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
        if (e.message.startsWith("HTTP error establishing stream")) throw e;
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
        if (e.message.startsWith("HTTP error establishing stream")) throw e;
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
      if (error instanceof ApiError) throw error;
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
      if (error instanceof ApiError) throw error;
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
      if (error instanceof A2AProtocolError || error instanceof DistriError) throw error;
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
      if (error instanceof A2AProtocolError || error instanceof DistriError) throw error;
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
      if (error instanceof ApiError) throw error;
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
      if (error instanceof ApiError) throw error;
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
      if (error instanceof ApiError) throw error;
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
    this.registerTool({
      name: APPROVAL_REQUEST_TOOL_NAME,
      description: "Request user approval for actions",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Approval prompt to show user" },
          action: { type: "string", description: "Action requiring approval" }
        },
        required: ["prompt"]
      },
      handler: async (input) => {
        const userInput = prompt(input.prompt || "Please provide input:");
        return { approved: !!userInput, input: userInput };
      }
    });
  }
  /**
   * Add a tool to the agent (AG-UI style)
   */
  registerTool(tool) {
    this.tools.set(tool.name, tool);
  }
  /**
   * Add multiple tools at once
   */
  registerTools(tools) {
    tools.forEach((tool) => this.registerTool(tool));
  }
  /**
   * Remove a tool
   */
  unregisterTool(toolName) {
    this.tools.delete(toolName);
  }
  /**
   * Get all registered tools
   */
  getTools() {
    return Array.from(this.tools.keys());
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
   * Get tool definitions for context metadata
   */
  getToolDefinitions() {
    const definitions = {};
    this.tools.forEach((_handler, name) => {
      definitions[name] = { name };
    });
    return definitions;
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
var useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === void 0)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

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
    if (!client || !agentId || agentRef.current) return;
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
    if (!clientLoading && !clientError && autoCreateAgent && client) {
      initializeAgent();
    }
  }, [clientLoading, clientError, autoCreateAgent, client, initializeAgent]);
  return {
    // Agent information
    agent,
    // State management
    loading: loading || clientLoading,
    error: error || clientError
  };
}

// src/useAgents.ts
import { useState as useState4, useEffect as useEffect3, useCallback as useCallback2 } from "react";
function useAgents() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = useState4([]);
  const [loading, setLoading] = useState4(true);
  const [error, setError] = useState4(null);
  const fetchAgents = useCallback2(async () => {
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
  const getAgent = useCallback2(async (agentId) => {
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
  useEffect3(() => {
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

// src/useChat.ts
import { useState as useState5, useEffect as useEffect4, useCallback as useCallback3, useRef as useRef2, useMemo } from "react";
function useChat({
  agentId,
  threadId,
  agent: providedAgent,
  metadata
}) {
  const { agent: internalAgent } = useAgent({
    agentId
  });
  const agent = providedAgent && typeof providedAgent.getThreadMessages === "function" ? providedAgent : internalAgent;
  const [messages, setMessages] = useState5([]);
  const [loading, setLoading] = useState5(false);
  const [error, setError] = useState5(null);
  const [isStreaming, setIsStreaming] = useState5(false);
  const abortControllerRef = useRef2(null);
  useEffect4(() => {
    setMessages([]);
    setError(null);
  }, [threadId]);
  const invokeConfig = useMemo(() => {
    return {
      contextId: threadId,
      configuration: {
        acceptedOutputModes: ["text/plain"],
        blocking: false
      },
      metadata
    };
  }, [threadId, metadata]);
  const fetchMessages = useCallback3(async () => {
    if (!agent || !threadId) {
      setMessages([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedMessages = await agent.getThreadMessages(threadId);
      setMessages(fetchedMessages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch messages"));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [agent, threadId]);
  useEffect4(() => {
    fetchMessages();
  }, [fetchMessages]);
  const handleToolCalls = useCallback3(async (toolCalls) => {
    if (!agent) return;
    const results = [];
    for (const toolCall of toolCalls) {
      const result = await agent.executeTool(toolCall);
      results.push(result);
    }
    if (results.length > 0) {
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
          if (abortControllerRef.current?.signal.aborted) break;
          await handleStreamEvent(event);
        }
      } catch (err) {
        console.error("Error continuing conversation with tool results:", err);
      }
    }
  }, [agent, threadId, invokeConfig.configuration]);
  const handleStreamEvent = useCallback3(async (event) => {
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
      if (message.metadata?.type === "assistant_response" && message.metadata.tool_calls) {
        const toolCalls = message.metadata.tool_calls;
        await handleToolCalls(toolCalls);
      }
    } else if (event.kind === "status-update") {
      console.debug("Task status update:", event);
    }
  }, [handleToolCalls]);
  const sendMessage = useCallback3(async (input, metadata2) => {
    if (!agent) return;
    const userMessage = DistriClient.initMessage(input, "user", { contextId: threadId, metadata: metadata2 });
    setMessages((prev) => [...prev, userMessage]);
    const params = DistriClient.initMessageParams(userMessage, invokeConfig.configuration, metadata2);
    try {
      setLoading(true);
      setError(null);
      const result = await agent.invoke(params);
      if (result && "message" in result && result.message) {
        setMessages((prev) => [...prev, result.message]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to send message"));
    } finally {
      setLoading(false);
    }
  }, [agent, threadId, invokeConfig.configuration]);
  const sendMessageStream = useCallback3(async (input, metadata2) => {
    if (!agent) return;
    const userMessage = DistriClient.initMessage(input, "user", { contextId: threadId, metadata: metadata2 });
    setMessages((prev) => [...prev, userMessage]);
    const params = DistriClient.initMessageParams(userMessage, invokeConfig.configuration, metadata2);
    try {
      setLoading(true);
      setIsStreaming(true);
      setError(null);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const stream = await agent.invokeStream(params);
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        await handleStreamEvent(event);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err : new Error("Failed to stream message"));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [agent, threadId, invokeConfig.configuration, handleStreamEvent]);
  const clearMessages = useCallback3(() => {
    setMessages([]);
  }, []);
  const refreshMessages = useCallback3(async () => {
    await fetchMessages();
  }, [fetchMessages]);
  return {
    messages,
    loading,
    error,
    isStreaming,
    sendMessage,
    sendMessageStream,
    refreshMessages,
    clearMessages,
    agent: agent ? agent : null
  };
}

// src/useThreads.ts
import { useState as useState6, useEffect as useEffect5, useCallback as useCallback4 } from "react";
function useThreads() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = useState6([]);
  const [loading, setLoading] = useState6(true);
  const [error, setError] = useState6(null);
  const fetchThreads = useCallback4(async () => {
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
  const fetchThread = useCallback4(async (threadId) => {
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
  const deleteThread = useCallback4(async (threadId) => {
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
  const updateThread = useCallback4(async (threadId, localId) => {
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
  useEffect5(() => {
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
import { useCallback as useCallback5, useRef as useRef3 } from "react";
function useTools({ agent }) {
  const toolsRef = useRef3(/* @__PURE__ */ new Set());
  const registerTool = useCallback5((tool) => {
    if (!agent) {
      console.warn("Cannot add tool: no agent provided");
      return;
    }
    agent.registerTool(tool);
    toolsRef.current.add(tool.name);
  }, [agent]);
  const registerTools = useCallback5((tools) => {
    if (!agent) {
      console.warn("Cannot add tools: no agent provided");
      return;
    }
    tools.forEach((tool) => {
      agent.registerTool(tool);
      toolsRef.current.add(tool.name);
    });
  }, [agent]);
  const unregisterTool = useCallback5((toolName) => {
    if (!agent) {
      console.warn("Cannot remove tool: no agent provided");
      return;
    }
    agent.unregisterTool(toolName);
    toolsRef.current.delete(toolName);
  }, [agent]);
  const executeTool = useCallback5(async (toolCall) => {
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
  const getTools = useCallback5(() => {
    if (!agent) return [];
    return agent.getTools();
  }, [agent]);
  const hasTool = useCallback5((toolName) => {
    if (!agent) return false;
    return agent.hasTool(toolName);
  }, [agent]);
  return {
    registerTool,
    registerTools,
    unregisterTool,
    executeTool,
    getTools,
    hasTool
  };
}

// src/components/EmbeddableChat.tsx
import { useState as useState7, useRef as useRef5, useEffect as useEffect7, useMemo as useMemo3 } from "react";
import { MessageSquare } from "lucide-react";

// src/components/MessageComponents.tsx
import React5 from "react";
import { User, Bot, Settings, Clock, CheckCircle, XCircle, Brain } from "lucide-react";

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
var ChatProvider = ({
  children,
  config: initialConfig = {}
}) => {
  const [config, setConfig] = React3.useState({
    ...defaultConfig,
    ...initialConfig
  });
  const updateConfig = React3.useCallback((updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);
  const value = {
    config,
    updateConfig
  };
  return /* @__PURE__ */ jsx3(ChatContext.Provider, { value, children });
};
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
    if (!lang) return "text";
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
  content,
  className = ""
}) => {
  let config;
  try {
    const chatConfig = useChatConfig();
    config = chatConfig.config;
  } catch {
    config = {
      enableMarkdown: true,
      enableCodeHighlighting: true,
      theme: "chatgpt"
    };
  }
  const isDark = className.includes("text-white");
  const hasMarkdownSyntax = useMemo2(() => {
    if (!config.enableMarkdown) return false;
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
    if (!config.enableCodeHighlighting) return false;
    if (hasMarkdownSyntax) return false;
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
    if (!hasExplicitCode) return false;
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
    if (/\b(function|const|let|var|=>|console\.log)\b/.test(content)) return "javascript";
    if (/\b(interface|type|as\s+\w+)\b/.test(content)) return "typescript";
    if (/\b(def|import|from|print|if\s+\w+:)\b/.test(content)) return "python";
    if (/\b(public\s+class|static\s+void|System\.out)\b/.test(content)) return "java";
    if (/\b(fn|let\s+mut|impl|match)\b/.test(content)) return "rust";
    if (/\b(func|package|import|fmt\.)\b/.test(content)) return "go";
    if (/SELECT.*FROM|INSERT.*INTO|UPDATE.*SET/i.test(content)) return "sql";
    if (/<[^>]+>.*<\/[^>]+>/.test(content)) return "html";
    if (/\{[^}]*:[^}]*\}/.test(content)) return "json";
    if (/^#!\/bin\/(bash|sh)/.test(content)) return "bash";
    if (/\$\w+|echo\s+/.test(content)) return "bash";
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
  return /* @__PURE__ */ jsx4("div", { className: `prose prose-sm max-w-none ${isDark ? "prose-invert" : ""} ${className} break-words`, children: /* @__PURE__ */ jsx4(
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
  ) });
};
var MessageRenderer_default = MessageRenderer;

// src/components/MessageComponents.tsx
import { jsx as jsx5, jsxs as jsxs2 } from "react/jsx-runtime";
var MessageContainer = ({ children, align, className = "", backgroundColor }) => {
  const justifyClass = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  const getBgClass = (color) => {
    switch (color) {
      case "#343541":
        return "bg-background";
      case "#444654":
        return "bg-muted";
      case "#40414f":
        return "bg-background";
      default:
        return "";
    }
  };
  const bgClass = backgroundColor ? getBgClass(backgroundColor) : "";
  return /* @__PURE__ */ jsx5("div", { className: `flex ${justifyClass} w-full ${bgClass} ${className}`, children: /* @__PURE__ */ jsx5("div", { className: "w-full max-w-4xl mx-auto px-6", children }) });
};
var PlanMessage = ({
  content,
  duration,
  timestamp,
  className = ""
}) => {
  return /* @__PURE__ */ jsx5(MessageContainer, { align: "center", className, backgroundColor: "#444654", children: /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-4 py-6 px-4", children: [
    /* @__PURE__ */ jsx5("div", { className: "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-600", children: /* @__PURE__ */ jsx5(Brain, { className: "h-4 w-4 text-white" }) }),
    /* @__PURE__ */ jsxs2("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs2("div", { className: "text-sm font-medium text-white mb-2 flex items-center gap-2", children: [
        "Thought",
        duration ? ` for ${duration}s` : ""
      ] }),
      /* @__PURE__ */ jsx5("div", { className: "prose prose-sm max-w-none text-white", children: /* @__PURE__ */ jsx5(
        MessageRenderer_default,
        {
          content,
          className: "text-white"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx5("div", { className: "text-xs text-gray-400 mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var UserMessage = ({
  content,
  timestamp,
  className = "",
  avatar
}) => {
  return /* @__PURE__ */ jsx5(MessageContainer, { align: "center", className, backgroundColor: "#343541", children: /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-4 py-6 px-4", children: [
    /* @__PURE__ */ jsx5("div", { className: "distri-avatar distri-avatar-user", children: avatar || /* @__PURE__ */ jsx5(User, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs2("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx5("div", { className: "text-sm font-medium text-foreground mb-2", children: "You" }),
      /* @__PURE__ */ jsx5("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx5(
        MessageRenderer_default,
        {
          content,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx5("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var AssistantMessage = ({
  content,
  timestamp,
  isStreaming = false,
  metadata: _metadata,
  className = "",
  avatar
}) => {
  return /* @__PURE__ */ jsx5(MessageContainer, { align: "center", className, backgroundColor: "#444654", children: /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-4 py-6 px-4", children: [
    /* @__PURE__ */ jsx5("div", { className: "distri-avatar distri-avatar-assistant", children: avatar || /* @__PURE__ */ jsx5(Bot, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs2("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs2("div", { className: "text-sm font-medium text-foreground mb-2 flex items-center gap-2", children: [
        "ChatGPT",
        isStreaming && /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx5("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse" }),
          /* @__PURE__ */ jsx5("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ jsx5("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      /* @__PURE__ */ jsx5("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx5(
        MessageRenderer_default,
        {
          content,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx5("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var Tool = ({
  toolCall,
  status = "pending",
  result,
  error
}) => {
  const [isExpanded, setIsExpanded] = React5.useState(true);
  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return /* @__PURE__ */ jsx5(Clock, { className: "h-4 w-4 text-gray-400" });
      case "running":
        return /* @__PURE__ */ jsx5(Settings, { className: "h-4 w-4 text-blue-400 distri-animate-spin" });
      case "completed":
        return /* @__PURE__ */ jsx5(CheckCircle, { className: "h-4 w-4 text-green-400" });
      case "error":
        return /* @__PURE__ */ jsx5(XCircle, { className: "h-4 w-4 text-red-400" });
      default:
        return /* @__PURE__ */ jsx5(Clock, { className: "h-4 w-4 text-gray-400" });
    }
  };
  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "border-gray-600 bg-gray-800/50";
      case "running":
        return "border-blue-500 bg-blue-900/20";
      case "completed":
        return "border-green-500/50 bg-green-900/20";
      case "error":
        return "border-red-500/50 bg-red-900/20";
      default:
        return "border-gray-600 bg-gray-800/50";
    }
  };
  const toolName = "tool_name" in toolCall ? toolCall.tool_name : toolCall.tool_name;
  const toolId = "tool_call_id" in toolCall ? toolCall.tool_call_id : toolCall.tool_call_id;
  const input = "input" in toolCall ? toolCall.input : toolCall.args;
  const shouldShowExpand = input || result || error;
  return /* @__PURE__ */ jsxs2("div", { className: `distri-tool ${getStatusColor()}`, children: [
    /* @__PURE__ */ jsx5(
      "div",
      {
        className: "distri-tool-header",
        onClick: () => setIsExpanded(!isExpanded),
        children: /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-3 w-full", children: [
          getStatusIcon(),
          /* @__PURE__ */ jsx5("span", { className: "font-medium text-sm text-white flex-1", children: toolName }),
          /* @__PURE__ */ jsx5("span", { className: "text-xs text-gray-400 font-mono", children: toolId }),
          shouldShowExpand && /* @__PURE__ */ jsx5("button", { className: "text-gray-400 hover:text-white transition-colors ml-2", children: isExpanded ? /* @__PURE__ */ jsx5("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) }) : /* @__PURE__ */ jsx5("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }) })
        ] })
      }
    ),
    isExpanded && /* @__PURE__ */ jsxs2("div", { className: "p-4 space-y-4 border-t border-gray-600/50", children: [
      input && /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx5("div", { className: "text-xs font-medium text-gray-300 mb-2", children: "Input:" }),
        /* @__PURE__ */ jsx5("div", { className: "distri-tool-content", children: typeof input === "string" ? input : JSON.stringify(input, null, 2) })
      ] }),
      result && /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx5("div", { className: "text-xs font-medium text-gray-300 mb-2", children: "Output:" }),
        /* @__PURE__ */ jsx5("div", { className: "distri-tool-content", children: typeof result === "string" ? result : JSON.stringify(result, null, 2) })
      ] }),
      error && /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx5("div", { className: "text-xs font-medium text-red-300 mb-2", children: "Error:" }),
        /* @__PURE__ */ jsx5("div", { className: "text-sm bg-red-900/20 border border-red-500/50 rounded p-3 text-red-200", children: error })
      ] })
    ] })
  ] });
};
var AssistantWithToolCalls = ({
  content,
  toolCalls,
  timestamp,
  isStreaming = false,
  metadata: _metadata,
  className = "",
  avatar
}) => {
  return /* @__PURE__ */ jsx5(MessageContainer, { align: "center", className, backgroundColor: "#444654", children: /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-4 py-6 px-4", children: [
    /* @__PURE__ */ jsx5("div", { className: "distri-avatar distri-avatar-assistant", children: avatar || /* @__PURE__ */ jsx5(Bot, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs2("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs2("div", { className: "text-sm font-medium text-white mb-2 flex items-center gap-2", children: [
        "ChatGPT",
        isStreaming && /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1 text-xs text-gray-400", children: [
          /* @__PURE__ */ jsx5("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse" }),
          /* @__PURE__ */ jsx5("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ jsx5("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      content && /* @__PURE__ */ jsx5("div", { className: "prose prose-sm max-w-none mb-4 text-white", children: /* @__PURE__ */ jsx5(
        MessageRenderer_default,
        {
          content,
          className: "text-white"
        }
      ) }),
      toolCalls.length > 0 && /* @__PURE__ */ jsx5("div", { className: "space-y-3", children: toolCalls.map((toolCallProps, index) => /* @__PURE__ */ jsx5(Tool, { ...toolCallProps }, index)) }),
      timestamp && /* @__PURE__ */ jsx5("div", { className: "text-xs text-gray-400 mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};

// src/utils/messageUtils.ts
var extractTextFromMessage = (message) => {
  if (!message?.parts || !Array.isArray(message.parts)) {
    return "";
  }
  const textParts = message.parts.filter((part) => part?.kind === "text" && part?.text).map((part) => part.text);
  return textParts.join("") || "";
};
var shouldDisplayMessage = (message, showDebugMessages = false) => {
  if (!message) return false;
  if (message.role === "user") {
    const textContent2 = extractTextFromMessage(message);
    return textContent2.trim().length > 0;
  }
  const textContent = extractTextFromMessage(message);
  if (textContent.trim()) return true;
  if (message.metadata?.type === "assistant_response" && message.metadata.tool_calls) {
    return true;
  }
  if (message.metadata?.type === "plan" || message.metadata?.plan) {
    return true;
  }
  if (message.metadata?.type && message.metadata.type !== "assistant_response") {
    return showDebugMessages;
  }
  return false;
};
var getMessageType = (message) => {
  if (message.role === "user") return "user";
  if (message.role === "assistant" || message.role === "agent") {
    if (message.metadata?.type === "assistant_response" && message.metadata.tool_calls) {
      return "assistant_with_tools";
    }
    return "assistant";
  }
  if (message.metadata?.type === "plan" || message.metadata?.plan) {
    return "plan";
  }
  return "system";
};

// src/components/AgentSelect.tsx
import { Bot as Bot2 } from "lucide-react";

// src/components/ui/select.tsx
import * as React6 from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check as Check2, ChevronDown, ChevronUp } from "lucide-react";

// src/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/components/ui/select.tsx
import { jsx as jsx6, jsxs as jsxs3 } from "react/jsx-runtime";
var Select = SelectPrimitive.Root;
var SelectGroup = SelectPrimitive.Group;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React6.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs3(
  SelectPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx6(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx6(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx6(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx6(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React6.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx6(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs3(
  SelectPrimitive.Content,
  {
    ref,
    className: cn(
      "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsx6(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx6(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx6(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React6.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs3(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx6("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx6(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx6(Check2, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx6(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// src/components/AgentSelect.tsx
import { jsx as jsx7, jsxs as jsxs4 } from "react/jsx-runtime";
var AgentSelect = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  className = "",
  placeholder = "Select an agent..."
}) => {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  return /* @__PURE__ */ jsxs4(Select, { value: selectedAgentId, onValueChange: onAgentSelect, children: [
    /* @__PURE__ */ jsx7(SelectTrigger, { className: `w-full ${className}`, children: /* @__PURE__ */ jsxs4("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx7(Bot2, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx7(SelectValue, { placeholder, children: selectedAgent?.name || placeholder })
    ] }) }),
    /* @__PURE__ */ jsx7(SelectContent, { children: agents.map((agent) => /* @__PURE__ */ jsx7(SelectItem, { value: agent.id, children: /* @__PURE__ */ jsxs4("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx7(Bot2, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs4("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx7("span", { className: "font-medium", children: agent.name }),
        agent.description && /* @__PURE__ */ jsx7("span", { className: "text-xs text-muted-foreground", children: agent.description })
      ] })
    ] }) }, agent.id)) })
  ] });
};

// src/components/ChatInput.tsx
import { useRef as useRef4, useEffect as useEffect6 } from "react";
import { Send, Square } from "lucide-react";
import { jsx as jsx8, jsxs as jsxs5 } from "react/jsx-runtime";
var ChatInput = ({
  value,
  onChange,
  onSend,
  onStop,
  placeholder = "Type your message...",
  disabled = false,
  isStreaming = false,
  className = ""
}) => {
  const textareaRef = useRef4(null);
  useEffect6(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isStreaming) {
        onSend();
      }
    }
  };
  const handleSend = () => {
    if (value.trim() && !disabled && !isStreaming) {
      onSend();
    }
  };
  const handleStop = () => {
    if (isStreaming && onStop) {
      onStop();
    }
  };
  const hasContent = value.trim().length > 0;
  const isDisabled = disabled || isStreaming;
  return /* @__PURE__ */ jsx8("div", { className: `relative flex min-h-14 w-full items-end ${className}`, children: /* @__PURE__ */ jsxs5("div", { className: "relative flex w-full flex-auto flex-col", children: [
    /* @__PURE__ */ jsxs5("div", { className: "relative mx-5 flex min-h-14 flex-auto rounded-lg border border-input bg-input items-start h-full", children: [
      /* @__PURE__ */ jsx8(
        "textarea",
        {
          ref: textareaRef,
          value,
          onChange: (e) => onChange(e.target.value),
          onKeyPress: handleKeyPress,
          placeholder,
          disabled: isDisabled,
          rows: 1,
          className: "max-h-[25dvh] flex-1 resize-none border-none outline-none bg-transparent placeholder:text-muted-foreground focus:ring-0 overflow-auto text-sm p-4 pr-20 text-foreground min-h-[52px] max-h-[120px]"
        }
      ),
      /* @__PURE__ */ jsx8("div", { className: "absolute right-2 bottom-0 flex items-center h-full", children: /* @__PURE__ */ jsx8(
        "button",
        {
          onClick: isStreaming ? handleStop : handleSend,
          disabled: !hasContent && !isStreaming,
          className: `h-10 w-10 rounded-md transition-colors flex items-center justify-center ${isStreaming ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : hasContent && !disabled ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted"}`,
          children: isStreaming ? /* @__PURE__ */ jsx8(Square, { className: "h-5 w-5" }) : /* @__PURE__ */ jsx8(Send, { className: "h-5 w-5" })
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx8("div", { className: "h-8" })
  ] }) });
};

// src/components/EmbeddableChat.tsx
import { jsx as jsx9, jsxs as jsxs6 } from "react/jsx-runtime";
var EmbeddableChat = ({
  agentId,
  threadId = "default",
  agent,
  height = "600px",
  className = "",
  style = {},
  metadata,
  availableAgents = [],
  UserMessageComponent = UserMessage,
  AssistantMessageComponent = AssistantMessage,
  AssistantWithToolCallsComponent = AssistantWithToolCalls,
  PlanMessageComponent = PlanMessage,
  theme: _theme = "dark",
  showDebug = false,
  showAgentSelector = true,
  placeholder = "Type your message...",
  onAgentSelect,
  onResponse: _onResponse
}) => {
  const [input, setInput] = useState7("");
  const messagesEndRef = useRef5(null);
  const {
    messages,
    loading,
    error,
    sendMessageStream,
    isStreaming
  } = useChat({
    agentId,
    threadId,
    agent,
    metadata
  });
  useEffect7(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const messageText = input.trim();
    setInput("");
    try {
      await sendMessageStream(messageText, metadata);
    } catch (err) {
      console.error("Failed to send message:", err);
      setInput(messageText);
    }
  };
  const renderedMessages = useMemo3(() => {
    return messages.filter((msg) => shouldDisplayMessage(msg, showDebug)).map((message, index) => {
      const messageType = getMessageType(message);
      const messageContent = extractTextFromMessage(message);
      const key = `message-${index}`;
      const timestamp = message.created_at ? new Date(message.created_at) : void 0;
      switch (messageType) {
        case "user":
          return /* @__PURE__ */ jsx9(
            UserMessageComponent,
            {
              content: messageContent,
              timestamp
            },
            key
          );
        case "assistant":
          return /* @__PURE__ */ jsx9(
            AssistantMessageComponent,
            {
              content: messageContent,
              timestamp,
              isStreaming: isStreaming && index === messages.length - 1
            },
            key
          );
        case "assistant_with_tools":
          const toolCalls = (message.parts || []).filter((part) => part.tool_call).map((part) => ({
            toolCall: part.tool_call,
            status: "completed",
            result: part.tool_result || "Completed successfully"
          }));
          return /* @__PURE__ */ jsx9(
            AssistantWithToolCallsComponent,
            {
              content: messageContent,
              toolCalls,
              timestamp,
              isStreaming: isStreaming && index === messages.length - 1
            },
            key
          );
        case "plan":
          return /* @__PURE__ */ jsx9(
            PlanMessageComponent,
            {
              content: messageContent,
              timestamp
            },
            key
          );
        default:
          return null;
      }
    }).filter(Boolean);
  }, [
    messages,
    showDebug,
    isStreaming,
    UserMessageComponent,
    AssistantMessageComponent,
    AssistantWithToolCallsComponent,
    PlanMessageComponent
  ]);
  return /* @__PURE__ */ jsx9(
    "div",
    {
      className: `distri-chat ${className} w-full bg-background text-foreground`,
      style: {
        height,
        ...style
      },
      children: /* @__PURE__ */ jsxs6("div", { className: "h-full flex flex-col", children: [
        /* @__PURE__ */ jsx9("div", { className: "pt-6 px-6 bg-background", children: showAgentSelector && availableAgents && availableAgents.length > 0 && /* @__PURE__ */ jsx9("div", { className: "mb-6", children: /* @__PURE__ */ jsx9(
          AgentSelect,
          {
            agents: availableAgents,
            selectedAgentId: agentId,
            onAgentSelect: (agentId2) => onAgentSelect?.(agentId2),
            className: "w-full"
          }
        ) }) }),
        /* @__PURE__ */ jsx9("div", { className: "flex-1 flex flex-col min-h-0", children: /* @__PURE__ */ jsxs6("div", { className: "mx-auto flex-1 group/turn-messages focus-visible:outline-hidden relative flex w-full min-w-0 flex-col", style: { maxWidth: "var(--thread-content-max-width)" }, children: [
          /* @__PURE__ */ jsxs6("div", { className: "flex-1 overflow-y-auto distri-scroll bg-background min-h-0", children: [
            messages.length === 0 ? /* @__PURE__ */ jsx9("div", { className: "h-full flex items-center justify-center", children: /* @__PURE__ */ jsxs6("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx9(MessageSquare, { className: "h-16 w-16 text-muted-foreground mx-auto mb-4" }),
              /* @__PURE__ */ jsx9("h3", { className: "text-lg font-medium text-foreground mb-2", children: "Start a conversation" }),
              /* @__PURE__ */ jsx9("p", { className: "text-muted-foreground max-w-sm", children: placeholder || "Type your message below to begin chatting." })
            ] }) }) : /* @__PURE__ */ jsx9("div", { className: "space-y-0", children: renderedMessages }),
            loading && /* @__PURE__ */ jsxs6("div", { className: "px-6 py-4 flex items-center space-x-2 bg-muted", children: [
              /* @__PURE__ */ jsx9("div", { className: "h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" }),
              /* @__PURE__ */ jsx9("span", { className: "text-muted-foreground text-sm", children: "Thinking..." })
            ] }),
            error && /* @__PURE__ */ jsx9("div", { className: "px-6 py-4 bg-destructive/20 border border-destructive/20 mx-4 rounded-lg", children: /* @__PURE__ */ jsxs6("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx9("div", { className: "h-4 w-4 rounded-full bg-destructive" }),
              /* @__PURE__ */ jsx9("span", { className: "text-destructive text-sm", children: error.message || String(error) })
            ] }) }),
            /* @__PURE__ */ jsx9("div", { ref: messagesEndRef })
          ] }),
          /* @__PURE__ */ jsx9("div", { className: "flex items-center justify-center px-6 py-4", children: /* @__PURE__ */ jsx9("div", { className: "w-full max-w-2xl", children: messages.length === 0 ? /* @__PURE__ */ jsx9(
            ChatInput,
            {
              value: input,
              onChange: setInput,
              onSend: sendMessage,
              onStop: () => {
                console.log("Stop streaming");
              },
              placeholder,
              disabled: loading,
              isStreaming,
              className: "w-full"
            }
          ) : /* @__PURE__ */ jsx9(
            ChatInput,
            {
              value: input,
              onChange: setInput,
              onSend: sendMessage,
              onStop: () => {
                console.log("Stop streaming");
              },
              placeholder,
              disabled: loading,
              isStreaming,
              className: "w-full"
            }
          ) }) })
        ] }) })
      ] })
    }
  );
};

// src/components/FullChat.tsx
import { useState as useState10, useCallback as useCallback8, useEffect as useEffect9 } from "react";

// src/components/ThemeToggle.tsx
import React9 from "react";
import { Moon, Sun } from "lucide-react";
import { jsx as jsx10, jsxs as jsxs7 } from "react/jsx-runtime";
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dropdownRef = React9.useRef(null);
  return /* @__PURE__ */ jsx10("div", { className: "relative", ref: dropdownRef, children: /* @__PURE__ */ jsxs7(
    "button",
    {
      onClick: () => setTheme(theme === "light" ? "dark" : "light"),
      className: "flex items-center justify-center w-9 h-9 rounded-md border  bg-background hover:bg-accent hover:text-accent-foreground transition-colors",
      children: [
        /* @__PURE__ */ jsx10(Sun, { className: "h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" }),
        /* @__PURE__ */ jsx10(Moon, { className: "absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" }),
        /* @__PURE__ */ jsx10("span", { className: "sr-only", children: "Toggle theme" })
      ]
    }
  ) });
}

// src/components/AgentList.tsx
import React10 from "react";
import { RefreshCw, Play, Bot as Bot3 } from "lucide-react";
import { jsx as jsx11, jsxs as jsxs8 } from "react/jsx-runtime";
var AgentList = ({ agents, onRefresh, onStartChat }) => {
  const [refreshing, setRefreshing] = React10.useState(false);
  console.log("agents", agents);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };
  return /* @__PURE__ */ jsxs8("div", { className: "", children: [
    /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between p-6 border-b border-border", children: [
      /* @__PURE__ */ jsx11("h2", { className: "text-xl font-semibold text-foreground", children: "Available Agents" }),
      /* @__PURE__ */ jsxs8(
        "button",
        {
          onClick: handleRefresh,
          disabled: refreshing,
          className: "flex items-center space-x-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors",
          children: [
            /* @__PURE__ */ jsx11(RefreshCw, { className: `h-4 w-4 ${refreshing ? "animate-spin" : ""}` }),
            /* @__PURE__ */ jsx11("span", { children: "Refresh" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx11("div", { className: "p-6", children: agents.length === 0 ? /* @__PURE__ */ jsxs8("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx11(Bot3, { className: "h-16 w-16 text-muted-foreground mx-auto mb-4" }),
      /* @__PURE__ */ jsx11("p", { className: "text-muted-foreground text-lg", children: "No agents available" }),
      /* @__PURE__ */ jsx11("p", { className: "text-sm text-muted-foreground mt-2", children: "Check your server connection" })
    ] }) : /* @__PURE__ */ jsx11("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: agents.map((agent) => /* @__PURE__ */ jsxs8(
      "div",
      {
        className: "bg-card border border-border rounded-xl p-6 hover:border-border/80 hover:bg-card/80 transition-all duration-200",
        children: [
          /* @__PURE__ */ jsx11("div", { className: "flex items-start justify-between mb-4", children: /* @__PURE__ */ jsxs8("div", { className: "flex items-center space-x-3", children: [
            /* @__PURE__ */ jsx11("div", { className: "w-12 h-12 bg-primary rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx11(Bot3, { className: "h-6 w-6 text-primary-foreground" }) }),
            /* @__PURE__ */ jsxs8("div", { children: [
              /* @__PURE__ */ jsx11("h3", { className: "font-semibold text-foreground text-lg", children: agent.name }),
              /* @__PURE__ */ jsx11("div", { className: "flex items-center space-x-1", children: /* @__PURE__ */ jsx11("span", { className: "text-xs text-muted-foreground capitalize", children: agent.version ? `v${agent.version}` : "Latest" }) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx11("p", { className: "text-sm text-muted-foreground mb-6 line-clamp-3", children: agent.description || "No description available" }),
          /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx11("div", { className: "text-xs text-muted-foreground", children: agent.version && `Version ${agent.version}` }),
            /* @__PURE__ */ jsx11("div", { className: "flex items-center space-x-2", children: /* @__PURE__ */ jsxs8(
              "button",
              {
                onClick: () => onStartChat(agent),
                className: "flex items-center space-x-1 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors",
                children: [
                  /* @__PURE__ */ jsx11(Play, { className: "h-3 w-3" }),
                  /* @__PURE__ */ jsx11("span", { children: "Chat" })
                ]
              }
            ) })
          ] })
        ]
      },
      agent.name
    )) }) })
  ] });
};
var AgentList_default = AgentList;

// src/components/AgentsPage.tsx
import { jsx as jsx12, jsxs as jsxs9 } from "react/jsx-runtime";
var AgentsPage = ({ onStartChat }) => {
  const { agents, loading, refetch } = useAgents();
  const handleRefresh = async () => {
    await refetch();
  };
  const handleStartChat = (agent) => {
    console.log("Starting chat with agent:", agent.name);
    onStartChat?.(agent);
  };
  if (loading) {
    return /* @__PURE__ */ jsx12("div", { className: "h-full bg-background flex items-center justify-center", children: /* @__PURE__ */ jsxs9("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx12("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" }),
      /* @__PURE__ */ jsx12("span", { className: "text-foreground", children: "Loading agents..." })
    ] }) });
  }
  return /* @__PURE__ */ jsx12("div", { className: "h-full bg-background overflow-auto", children: /* @__PURE__ */ jsxs9("div", { className: "container mx-auto p-6", children: [
    /* @__PURE__ */ jsx12("h1", { className: "text-3xl font-bold text-foreground mb-6", children: "Agents" }),
    /* @__PURE__ */ jsx12(
      AgentList_default,
      {
        agents,
        onRefresh: handleRefresh,
        onStartChat: handleStartChat
      }
    )
  ] }) });
};
var AgentsPage_default = AgentsPage;

// src/components/AppSidebar.tsx
import { useState as useState9, useCallback as useCallback7 } from "react";
import { MessageSquare as MessageSquare2, MoreHorizontal, Trash2, Edit3, Bot as Bot4, Users, Edit2 } from "lucide-react";

// src/components/ui/sidebar.tsx
import * as React15 from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva as cva2 } from "class-variance-authority";
import { PanelLeft } from "lucide-react";

// src/components/ui/button.tsx
import * as React11 from "react";
import { jsx as jsx13 } from "react/jsx-runtime";
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
var Button = React11.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return /* @__PURE__ */ jsx13(
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

// src/components/ui/separator.tsx
import * as React12 from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { jsx as jsx14 } from "react/jsx-runtime";
var Separator2 = React12.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsx14(
    SeparatorPrimitive.Root,
    {
      ref,
      decorative,
      orientation,
      className: cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      ),
      ...props
    }
  )
);
Separator2.displayName = SeparatorPrimitive.Root.displayName;

// src/components/ui/sheet.tsx
import * as React13 from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { jsx as jsx15, jsxs as jsxs10 } from "react/jsx-runtime";
var Sheet = SheetPrimitive.Root;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React13.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx15(
  SheetPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
var sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
var SheetContent = React13.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs10(SheetPortal, { children: [
  /* @__PURE__ */ jsx15(SheetOverlay, {}),
  /* @__PURE__ */ jsxs10(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs10(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ jsx15(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx15("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx15(
  "div",
  {
    className: cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    ),
    ...props
  }
);
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx15(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
SheetFooter.displayName = "SheetFooter";
var SheetTitle = React13.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx15(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React13.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx15(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// src/components/ui/skeleton.tsx
import { jsx as jsx16 } from "react/jsx-runtime";
function Skeleton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx16(
    "div",
    {
      className: cn("animate-pulse rounded-md bg-muted", className),
      ...props
    }
  );
}

// src/components/ui/tooltip.tsx
import * as React14 from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { jsx as jsx17 } from "react/jsx-runtime";
var TooltipProvider = TooltipPrimitive.Provider;
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = React14.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx17(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// src/components/ui/sidebar.tsx
import { jsx as jsx18, jsxs as jsxs11 } from "react/jsx-runtime";
var SIDEBAR_COOKIE_NAME = "sidebar:state";
var SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
var SIDEBAR_WIDTH = "16rem";
var SIDEBAR_WIDTH_MOBILE = "18rem";
var SIDEBAR_WIDTH_ICON = "3rem";
var SIDEBAR_KEYBOARD_SHORTCUT = "b";
var SidebarContext = React15.createContext(null);
function useSidebar() {
  const context = React15.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
var SidebarProvider = React15.forwardRef(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  const [_open, _setOpen] = React15.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React15.useCallback(
    (value) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );
  const [openMobile, setOpenMobile] = React15.useState(false);
  const [isMobile, setIsMobile] = React15.useState(false);
  React15.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && open) {
        setOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setOpen, open]);
  React15.useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_COOKIE_NAME);
    if (savedState !== null) {
      setOpen(savedState === "true");
    }
  }, [setOpen]);
  React15.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);
  const toggleSidebar = React15.useCallback(() => {
    return isMobile ? setOpenMobile((open2) => !open2) : setOpen((open2) => !open2);
  }, [isMobile, setOpen, setOpenMobile]);
  const state = open ? "expanded" : "collapsed";
  const contextValue = React15.useMemo(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );
  return /* @__PURE__ */ jsx18(SidebarContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx18(TooltipProvider, { delayDuration: 0, children: /* @__PURE__ */ jsx18(
    "div",
    {
      style: {
        "--sidebar-width": SIDEBAR_WIDTH,
        "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
        ...style
      },
      className: cn(
        "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
        className
      ),
      ref,
      ...props,
      children
    }
  ) }) });
});
SidebarProvider.displayName = "SidebarProvider";
var Sidebar = React15.forwardRef(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (collapsible === "none") {
    return /* @__PURE__ */ jsx18(
      "div",
      {
        className: cn(
          "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
          className
        ),
        ref,
        ...props,
        children
      }
    );
  }
  if (isMobile) {
    return /* @__PURE__ */ jsx18(Sheet, { open: openMobile, onOpenChange: setOpenMobile, ...props, children: /* @__PURE__ */ jsx18(
      SheetContent,
      {
        "data-sidebar": "sidebar",
        "data-mobile": "true",
        className: "w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
        style: {
          "--sidebar-width": SIDEBAR_WIDTH_MOBILE
        },
        side,
        children: /* @__PURE__ */ jsx18("div", { className: "flex h-full w-full flex-col", children })
      }
    ) });
  }
  return /* @__PURE__ */ jsxs11(
    "div",
    {
      ref,
      className: "group peer hidden md:block text-sidebar-foreground",
      "data-state": state,
      "data-collapsible": state === "collapsed" ? collapsible : "",
      "data-variant": variant,
      "data-side": side,
      children: [
        /* @__PURE__ */ jsx18(
          "div",
          {
            className: cn(
              "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
              "group-data-[collapsible=offcanvas]:w-0",
              "group-data-[side=right]:rotate-180",
              variant === "floating" || variant === "inset" ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]" : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
            )
          }
        ),
        /* @__PURE__ */ jsx18(
          "div",
          {
            className: cn(
              "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
              side === "left" ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]" : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
              // Adjust the padding for floating and inset variants.
              variant === "floating" || variant === "inset" ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]" : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
              className
            ),
            ...props,
            children: /* @__PURE__ */ jsx18(
              "div",
              {
                "data-sidebar": "sidebar",
                className: "flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow",
                children
              }
            )
          }
        )
      ]
    }
  );
});
Sidebar.displayName = "Sidebar";
var SidebarTrigger = React15.forwardRef(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ jsxs11(
    Button,
    {
      ref,
      "data-sidebar": "trigger",
      variant: "ghost",
      size: "icon",
      className: cn("h-7 w-7", className),
      onClick: (event) => {
        onClick?.(event);
        toggleSidebar();
      },
      ...props,
      children: [
        /* @__PURE__ */ jsx18(PanelLeft, {}),
        /* @__PURE__ */ jsx18("span", { className: "sr-only", children: "Toggle Sidebar" })
      ]
    }
  );
});
SidebarTrigger.displayName = "SidebarTrigger";
var SidebarRail = React15.forwardRef(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ jsx18(
    "button",
    {
      ref,
      "data-sidebar": "rail",
      "aria-label": "Toggle Sidebar",
      tabIndex: -1,
      onClick: toggleSidebar,
      title: "Toggle Sidebar",
      className: cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] after:-translate-x-1/2 after:bg-sidebar-border hover:after:bg-sidebar-accent-foreground group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      ),
      ...props
    }
  );
});
SidebarRail.displayName = "SidebarRail";
var SidebarInset = React15.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx18(
    "main",
    {
      ref,
      className: cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      ),
      ...props
    }
  );
});
SidebarInset.displayName = "SidebarInset";
var SidebarHeader = React15.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx18(
    "div",
    {
      ref,
      "data-sidebar": "header",
      className: cn("flex flex-col gap-2 p-2", className),
      ...props
    }
  );
});
SidebarHeader.displayName = "SidebarHeader";
var SidebarFooter = React15.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx18(
    "div",
    {
      ref,
      "data-sidebar": "footer",
      className: cn("flex flex-col gap-2 p-2", className),
      ...props
    }
  );
});
SidebarFooter.displayName = "SidebarFooter";
var SidebarSeparator = React15.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx18(
    Separator2,
    {
      ref,
      "data-sidebar": "separator",
      className: cn("mx-2 w-auto bg-sidebar-border", className),
      ...props
    }
  );
});
SidebarSeparator.displayName = "SidebarSeparator";
var SidebarContent = React15.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx18(
    "div",
    {
      ref,
      "data-sidebar": "content",
      className: cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      ),
      ...props
    }
  );
});
SidebarContent.displayName = "SidebarContent";
var SidebarGroup = React15.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx18(
    "div",
    {
      ref,
      "data-sidebar": "group",
      className: cn("relative flex w-full min-w-0 flex-col p-2", className),
      ...props
    }
  );
});
SidebarGroup.displayName = "SidebarGroup";
var SidebarGroupLabel = React15.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  return /* @__PURE__ */ jsx18(
    Comp,
    {
      ref,
      "data-sidebar": "group-label",
      className: cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      ),
      ...props
    }
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";
var SidebarGroupAction = React15.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx18(
    Comp,
    {
      ref,
      "data-sidebar": "group-action",
      className: cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";
var SidebarGroupContent = React15.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx18(
    "div",
    {
      ref,
      "data-sidebar": "group-content",
      className: cn("w-full text-sm", className),
      ...props
    }
  );
});
SidebarGroupContent.displayName = "SidebarGroupContent";
var SidebarMenu = React15.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx18(
    "ul",
    {
      ref,
      "data-sidebar": "menu",
      className: cn("flex w-full min-w-0 flex-col gap-1", className),
      ...props
    }
  );
});
SidebarMenu.displayName = "SidebarMenu";
var SidebarMenuItem = React15.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx18(
    "li",
    {
      ref,
      "data-sidebar": "menu-item",
      className: cn("group/menu-item relative", className),
      ...props
    }
  );
});
SidebarMenuItem.displayName = "SidebarMenuItem";
var sidebarMenuButtonVariants = cva2(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline: "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]"
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!size-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
var SidebarMenuButton = React15.forwardRef(({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();
  const button = /* @__PURE__ */ jsx18(
    Comp,
    {
      ref,
      "data-sidebar": "menu-button",
      "data-size": size,
      "data-active": isActive,
      className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      ...props
    }
  );
  if (!tooltip) {
    return button;
  }
  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip
    };
  }
  return /* @__PURE__ */ jsxs11(Tooltip, { children: [
    /* @__PURE__ */ jsx18(TooltipTrigger, { asChild: true, children: button }),
    /* @__PURE__ */ jsx18(
      TooltipContent,
      {
        side: "right",
        align: "center",
        hidden: state !== "collapsed" || isMobile,
        ...tooltip
      }
    )
  ] });
});
SidebarMenuButton.displayName = "SidebarMenuButton";
var SidebarMenuAction = React15.forwardRef(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx18(
    Comp,
    {
      ref,
      "data-sidebar": "menu-action",
      className: cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover && "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      ),
      ...props
    }
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";
var SidebarMenuBadge = React15.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx18(
    "div",
    {
      ref,
      "data-sidebar": "menu-badge",
      className: cn(
        "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  );
});
SidebarMenuBadge.displayName = "SidebarMenuBadge";
var SidebarMenuSkeleton = React15.forwardRef(({ className, showIcon = false, ...props }, ref) => {
  const width = React15.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);
  return /* @__PURE__ */ jsxs11(
    "div",
    {
      ref,
      "data-sidebar": "menu-skeleton",
      className: cn("rounded-md h-8 flex gap-2 px-2 items-center", className),
      ...props,
      children: [
        showIcon && /* @__PURE__ */ jsx18(Skeleton, { className: "size-4 rounded-md", "data-sidebar": "menu-skeleton-icon" }),
        /* @__PURE__ */ jsx18(
          Skeleton,
          {
            className: "h-4 flex-1 max-w-[--skeleton-width]",
            "data-sidebar": "menu-skeleton-text",
            style: {
              "--skeleton-width": width
            }
          }
        )
      ]
    }
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";
var SidebarMenuSub = React15.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx18(
    "ul",
    {
      ref,
      "data-sidebar": "menu-sub",
      className: cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  );
});
SidebarMenuSub.displayName = "SidebarMenuSub";
var SidebarMenuSubItem = React15.forwardRef(({ ...props }, ref) => {
  return /* @__PURE__ */ jsx18("li", { ref, ...props });
});
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
var SidebarMenuSubButton = React15.forwardRef(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return /* @__PURE__ */ jsx18(
    Comp,
    {
      ref,
      "data-sidebar": "menu-sub-button",
      "data-size": size,
      "data-active": isActive,
      className: cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-foreground/50",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

// src/components/AppSidebar.tsx
import { jsx as jsx19, jsxs as jsxs12 } from "react/jsx-runtime";
var ThreadItem = ({
  thread,
  isActive,
  onClick,
  onDelete,
  onRename
}) => {
  const [isEditing, setIsEditing] = useState9(false);
  const [editTitle, setEditTitle] = useState9(thread.title || "New Chat");
  const [showMenu, setShowMenu] = useState9(false);
  const handleRename = useCallback7(() => {
    if (editTitle.trim() && editTitle !== thread.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  }, [editTitle, thread.title, onRename]);
  const handleKeyPress = useCallback7((e) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditTitle(thread.title || "New Chat");
      setIsEditing(false);
    }
  }, [handleRename, thread.title]);
  return /* @__PURE__ */ jsxs12(SidebarMenuItem, { className: "mb-3", children: [
    /* @__PURE__ */ jsx19(SidebarMenuButton, { asChild: true, isActive, className: "group py-3 px-3 rounded-lg", children: /* @__PURE__ */ jsxs12("div", { onClick, className: "flex items-center space-x-3 flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx19(MessageSquare2, { className: "h-4 w-4 flex-shrink-0" }),
      isEditing ? /* @__PURE__ */ jsx19(
        "input",
        {
          value: editTitle,
          onChange: (e) => setEditTitle(e.target.value),
          onBlur: handleRename,
          onKeyPress: handleKeyPress,
          className: "flex-1 text-sm bg-transparent border-none outline-none",
          autoFocus: true,
          onClick: (e) => e.stopPropagation()
        }
      ) : /* @__PURE__ */ jsxs12("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx19("p", { className: "text-sm font-medium truncate leading-tight", children: thread.title || "New Chat" }),
        /* @__PURE__ */ jsx19("p", { className: "text-xs text-muted-foreground truncate leading-tight mt-0.5", children: thread.last_message || "No messages yet" })
      ] })
    ] }) }),
    !isEditing && /* @__PURE__ */ jsx19(SidebarMenuAction, { showOnHover: true, children: /* @__PURE__ */ jsxs12("div", { className: "relative", children: [
      /* @__PURE__ */ jsx19(
        "button",
        {
          onClick: (e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          },
          className: "p-1.5 rounded-md hover:bg-sidebar-accent transition-opacity",
          children: /* @__PURE__ */ jsx19(MoreHorizontal, { className: "h-4 w-4" })
        }
      ),
      showMenu && /* @__PURE__ */ jsxs12("div", { className: "absolute right-0 top-6 w-32 bg-card border rounded-lg shadow-lg z-10", children: [
        /* @__PURE__ */ jsxs12(
          "button",
          {
            onClick: (e) => {
              e.stopPropagation();
              setIsEditing(true);
              setShowMenu(false);
            },
            className: "w-full text-left px-3 py-2 text-sm hover:bg-accent text-card-foreground flex items-center space-x-2 rounded-t-lg",
            children: [
              /* @__PURE__ */ jsx19(Edit3, { className: "h-3 w-3" }),
              /* @__PURE__ */ jsx19("span", { children: "Rename" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs12(
          "button",
          {
            onClick: (e) => {
              e.stopPropagation();
              onDelete();
              setShowMenu(false);
            },
            className: "w-full text-left px-3 py-2 text-sm hover:bg-accent text-destructive flex items-center space-x-2 rounded-b-lg",
            children: [
              /* @__PURE__ */ jsx19(Trash2, { className: "h-3 w-3" }),
              /* @__PURE__ */ jsx19("span", { children: "Delete" })
            ]
          }
        )
      ] })
    ] }) })
  ] });
};
function AppSidebar({
  selectedThreadId,
  currentPage,
  onNewChat,
  onThreadSelect,
  onThreadDelete,
  onThreadRename,
  onLogoClick,
  onPageChange
}) {
  const { threads, loading: threadsLoading } = useThreads();
  return /* @__PURE__ */ jsxs12(Sidebar, { children: [
    /* @__PURE__ */ jsx19(SidebarHeader, { className: "p-4", children: /* @__PURE__ */ jsxs12(
      "button",
      {
        onClick: onLogoClick,
        className: "flex items-center space-x-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg p-2 transition-colors w-full",
        children: [
          /* @__PURE__ */ jsx19(Bot4, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx19("span", { className: "font-semibold flex-1 text-left", children: "Distri" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx19(SidebarSeparator, {}),
    /* @__PURE__ */ jsxs12(SidebarContent, { children: [
      /* @__PURE__ */ jsx19(SidebarGroup, { children: /* @__PURE__ */ jsx19(SidebarGroupContent, { className: "px-2", children: /* @__PURE__ */ jsxs12(SidebarMenu, { children: [
        /* @__PURE__ */ jsx19(SidebarMenuItem, { className: "mb-1", children: /* @__PURE__ */ jsx19(
          SidebarMenuButton,
          {
            asChild: true,
            isActive: currentPage === "chat",
            onClick: () => {
              onPageChange("chat");
              onNewChat();
            },
            className: "py-3 px-3 rounded-lg",
            children: /* @__PURE__ */ jsxs12("button", { className: "flex items-center space-x-3 w-full", children: [
              /* @__PURE__ */ jsx19(Edit2, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx19("span", { children: "New Chat" })
            ] })
          }
        ) }),
        /* @__PURE__ */ jsx19(SidebarMenuItem, { className: "mb-1", children: /* @__PURE__ */ jsx19(
          SidebarMenuButton,
          {
            asChild: true,
            isActive: currentPage === "agents",
            onClick: () => onPageChange("agents"),
            className: "py-3 px-3 rounded-lg",
            children: /* @__PURE__ */ jsxs12("button", { className: "flex items-center space-x-3 w-full", children: [
              /* @__PURE__ */ jsx19(Users, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx19("span", { children: "Agents" })
            ] })
          }
        ) })
      ] }) }) }),
      /* @__PURE__ */ jsxs12(SidebarGroup, { children: [
        /* @__PURE__ */ jsx19(SidebarGroupLabel, { className: "px-3 py-2", children: "Conversations" }),
        /* @__PURE__ */ jsx19(SidebarGroupContent, { className: "px-2", children: /* @__PURE__ */ jsx19(SidebarMenu, { children: threadsLoading ? /* @__PURE__ */ jsx19("div", { className: "text-center py-8", children: /* @__PURE__ */ jsx19("div", { className: "text-sm text-muted-foreground", children: "Loading threads..." }) }) : threads.length === 0 ? /* @__PURE__ */ jsxs12("div", { className: "text-center py-8", children: [
          /* @__PURE__ */ jsx19(MessageSquare2, { className: "h-8 w-8 text-muted-foreground mx-auto mb-3" }),
          /* @__PURE__ */ jsx19("div", { className: "text-sm text-muted-foreground", children: "No conversations yet" })
        ] }) : threads.map((thread) => /* @__PURE__ */ jsx19(
          ThreadItem,
          {
            thread,
            isActive: thread.id === selectedThreadId,
            onClick: () => onThreadSelect(thread.id),
            onDelete: () => onThreadDelete(thread.id),
            onRename: (newTitle) => onThreadRename(thread.id, newTitle)
          },
          thread.id
        )) }) })
      ] })
    ] })
  ] });
}

// src/components/FullChat.tsx
import { jsx as jsx20, jsxs as jsxs13 } from "react/jsx-runtime";
var FullChat = ({
  agentId,
  agent,
  metadata,
  className = "",
  UserMessageComponent,
  AssistantMessageComponent,
  AssistantWithToolCallsComponent,
  PlanMessageComponent,
  theme = "dark",
  showDebug = false,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
  onLogoClick,
  availableAgents,
  onAgentSelect
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState10("default");
  const { threads, refetch: refetchThreads } = useThreads();
  const [currentPage, setCurrentPage] = useState10("chat");
  const [defaultOpen, setDefaultOpen] = useState10(true);
  useEffect9(() => {
    const savedState = localStorage.getItem("sidebar:state");
    if (savedState !== null) {
      setDefaultOpen(savedState === "true");
    }
  }, []);
  const handleNewChat = useCallback8(() => {
    const newThreadId = `thread-${Date.now()}`;
    setSelectedThreadId(newThreadId);
    onThreadCreate?.(newThreadId);
  }, [onThreadCreate]);
  const handleThreadSelect = useCallback8((threadId) => {
    setCurrentPage("chat");
    setSelectedThreadId(threadId);
    onThreadSelect?.(threadId);
  }, [onThreadSelect]);
  const handleThreadDelete = useCallback8((threadId) => {
    if (threadId === selectedThreadId) {
      const remainingThreads = threads.filter((t) => t.id !== threadId);
      if (remainingThreads.length > 0) {
        setSelectedThreadId(remainingThreads[0].id);
      } else {
        handleNewChat();
      }
    }
    onThreadDelete?.(threadId);
    refetchThreads();
  }, [selectedThreadId, threads, handleNewChat, onThreadDelete, refetchThreads]);
  const handleThreadRename = useCallback8((threadId, newTitle) => {
    console.log("Rename thread", threadId, "to", newTitle);
    refetchThreads();
  }, [refetchThreads]);
  return /* @__PURE__ */ jsx20("div", { className: `distri-chat ${className} h-full`, children: /* @__PURE__ */ jsxs13(
    SidebarProvider,
    {
      defaultOpen,
      style: {
        "--sidebar-width": "20rem",
        "--sidebar-width-mobile": "18rem"
      },
      children: [
        /* @__PURE__ */ jsx20(
          AppSidebar,
          {
            selectedThreadId,
            currentPage,
            onNewChat: handleNewChat,
            onThreadSelect: handleThreadSelect,
            onThreadDelete: handleThreadDelete,
            onThreadRename: handleThreadRename,
            onLogoClick,
            onPageChange: setCurrentPage
          }
        ),
        /* @__PURE__ */ jsxs13(SidebarInset, { children: [
          /* @__PURE__ */ jsxs13("header", { className: "flex h-16 shrink-0 items-center gap-2 px-4 border-b", children: [
            /* @__PURE__ */ jsxs13("div", { className: "flex items-center gap-2 flex-1", children: [
              /* @__PURE__ */ jsx20(SidebarTrigger, { className: "-ml-1" }),
              availableAgents && availableAgents.length > 0 && /* @__PURE__ */ jsx20("div", { className: "ml-4 w-64", children: /* @__PURE__ */ jsx20(
                AgentSelect,
                {
                  agents: availableAgents,
                  selectedAgentId: agentId,
                  onAgentSelect: (agentId2) => onAgentSelect?.(agentId2),
                  placeholder: "Select an agent..."
                }
              ) })
            ] }),
            /* @__PURE__ */ jsx20("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx20(ThemeToggle, {}) })
          ] }),
          /* @__PURE__ */ jsxs13("main", { className: "flex-1 overflow-hidden", children: [
            currentPage === "chat" && /* @__PURE__ */ jsx20(
              EmbeddableChat,
              {
                agentId,
                threadId: selectedThreadId,
                showAgentSelector: false,
                agent,
                metadata,
                height: "calc(100vh - 4rem)",
                availableAgents,
                UserMessageComponent,
                AssistantMessageComponent,
                AssistantWithToolCallsComponent,
                PlanMessageComponent,
                theme,
                showDebug,
                placeholder: "Type your message...",
                onAgentSelect
              }
            ),
            currentPage === "agents" && /* @__PURE__ */ jsx20("div", { className: "h-full overflow-auto", children: /* @__PURE__ */ jsx20(AgentsPage_default, { onStartChat: (agent2) => {
              setCurrentPage("chat");
              onAgentSelect?.(agent2.id);
            } }) })
          ] })
        ] })
      ]
    }
  ) });
};

// src/components/ChatContainer.tsx
import { jsx as jsx21 } from "react/jsx-runtime";
var ChatContainer = ({
  variant = "embedded",
  height = 500,
  theme = "auto",
  showDebug = false,
  placeholder = "Type your message...",
  ...props
}) => {
  const heightString = typeof height === "number" ? `${height}px` : height;
  if (variant === "full") {
    return /* @__PURE__ */ jsx21(
      FullChat,
      {
        ...props,
        theme,
        showDebug
      }
    );
  }
  return /* @__PURE__ */ jsx21(
    EmbeddableChat,
    {
      ...props,
      height: heightString,
      theme,
      showDebug,
      placeholder
    }
  );
};

// src/components/Chat.tsx
import { useState as useState11, useRef as useRef6, useEffect as useEffect10, useCallback as useCallback9, useMemo as useMemo5 } from "react";
import { Loader2, Eye, EyeOff, Bot as Bot5 } from "lucide-react";
import { Fragment as Fragment2, jsx as jsx22, jsxs as jsxs14 } from "react/jsx-runtime";
var DebugToggle = ({ showDebug, onToggle }) => {
  return /* @__PURE__ */ jsxs14(
    Button,
    {
      onClick: onToggle,
      variant: "outline",
      size: "sm",
      className: "flex items-center gap-2",
      children: [
        showDebug ? /* @__PURE__ */ jsx22(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx22(Eye, { className: "h-4 w-4" }),
        "Debug"
      ]
    }
  );
};
var ChatContent = ({
  agentId,
  threadId,
  agent,
  tools,
  metadata,
  height = "600px",
  onThreadUpdate,
  placeholder = "Type a message...",
  UserMessageComponent = UserMessage,
  AssistantMessageComponent = AssistantMessage,
  AssistantWithToolCallsComponent = AssistantWithToolCalls,
  PlanMessageComponent = PlanMessage,
  onExternalToolCall
}) => {
  const [input, setInput] = useState11("");
  const messagesEndRef = useRef6(null);
  const { config, updateConfig } = useChatConfig();
  const {
    messages,
    loading,
    error,
    isStreaming,
    sendMessageStream
  } = useChat({
    agentId,
    threadId,
    agent,
    metadata
  });
  useEffect10(() => {
    if (tools && onExternalToolCall) {
      console.warn("Legacy tools prop detected. Consider migrating to the new useTools hook for better performance.");
    }
  }, [tools, onExternalToolCall]);
  const extractTextFromMessage2 = useCallback9((message) => {
    if (!message?.parts || !Array.isArray(message.parts)) {
      return "";
    }
    return message.parts.filter((part) => part?.kind === "text" && part?.text).map((part) => part.text).join("") || "";
  }, []);
  const shouldDisplayMessage2 = useCallback9((message) => {
    if (!message) return false;
    if (message.role === "user") {
      const textContent2 = extractTextFromMessage2(message);
      return textContent2.trim().length > 0;
    }
    const textContent = extractTextFromMessage2(message);
    if (textContent.trim()) return true;
    if (message.metadata?.type === "assistant_response" && message.metadata.tool_calls) {
      return true;
    }
    if (message.metadata?.type === "plan" || message.metadata?.plan) {
      return true;
    }
    if (message.metadata?.type && message.metadata.type !== "assistant_response") {
      return config.showDebug;
    }
    return false;
  }, [extractTextFromMessage2, config.showDebug]);
  const scrollToBottom = useCallback9(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect10(() => {
    if (threadId && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, threadId, scrollToBottom]);
  const sendMessage = useCallback9(async () => {
    if (!input.trim() || loading || isStreaming) return;
    const messageText = input.trim();
    setInput("");
    try {
      await sendMessageStream(messageText);
      onThreadUpdate?.(threadId);
    } catch (error2) {
      console.error("Failed to send message:", error2);
      setInput(messageText);
    }
  }, [input, loading, isStreaming, sendMessageStream, onThreadUpdate, threadId]);
  const renderedMessages = useMemo5(() => {
    return messages.filter(shouldDisplayMessage2).map((message, index) => {
      const timestamp = new Date(message.timestamp || Date.now());
      const messageText = extractTextFromMessage2(message);
      const isUser = message.role === "user";
      if (isUser) {
        return /* @__PURE__ */ jsx22(
          UserMessageComponent,
          {
            content: messageText,
            timestamp
          },
          message.messageId || `user-${index}`
        );
      }
      if (message.metadata?.type === "assistant_response" && message.metadata.tool_calls) {
        const toolCallsProps = message.metadata.tool_calls.map((toolCall) => ({
          toolCall,
          status: "completed",
          // Tools are executed immediately now
          result: "Tool executed successfully",
          error: null
        }));
        return /* @__PURE__ */ jsx22(
          AssistantWithToolCallsComponent,
          {
            content: messageText,
            toolCalls: toolCallsProps,
            timestamp,
            isStreaming: isStreaming && index === messages.length - 1,
            metadata: message.metadata
          },
          message.messageId || `assistant-tools-${index}`
        );
      }
      if (message.metadata?.type === "plan" || message.metadata?.plan) {
        return /* @__PURE__ */ jsx22(
          PlanMessageComponent,
          {
            content: messageText || message.metadata?.plan || "Planning...",
            duration: message.metadata?.duration,
            timestamp
          },
          message.messageId || `plan-${index}`
        );
      }
      if (message.role === "assistant" || message.role === "agent") {
        return /* @__PURE__ */ jsx22(
          AssistantMessageComponent,
          {
            content: messageText || "Empty message",
            timestamp,
            isStreaming: isStreaming && index === messages.length - 1,
            metadata: message.metadata
          },
          message.messageId || `assistant-${index}`
        );
      }
      return null;
    });
  }, [messages, shouldDisplayMessage2, extractTextFromMessage2, isStreaming, UserMessageComponent, AssistantMessageComponent, AssistantWithToolCallsComponent, PlanMessageComponent]);
  return /* @__PURE__ */ jsxs14("div", { className: "flex flex-col bg-gray-900 text-white", style: { height }, children: [
    /* @__PURE__ */ jsx22("div", { className: "flex-shrink-0 border-b border-gray-700 bg-gray-900 p-4", children: /* @__PURE__ */ jsxs14("div", { className: "max-w-4xl mx-auto flex items-center justify-between", children: [
      /* @__PURE__ */ jsx22("div", { children: agent && /* @__PURE__ */ jsxs14(Fragment2, { children: [
        /* @__PURE__ */ jsx22("h2", { className: "text-lg font-semibold text-white", children: agent.name }),
        /* @__PURE__ */ jsx22("p", { className: "text-sm text-gray-400", children: agent.description })
      ] }) }),
      /* @__PURE__ */ jsxs14("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx22(
          DebugToggle,
          {
            showDebug: config.showDebug,
            onToggle: () => updateConfig({ showDebug: !config.showDebug })
          }
        ),
        (loading || isStreaming) && /* @__PURE__ */ jsxs14("div", { className: "flex items-center text-blue-400", children: [
          /* @__PURE__ */ jsx22(Loader2, { className: "h-4 w-4 animate-spin mr-2" }),
          /* @__PURE__ */ jsx22("span", { className: "text-sm", children: "Processing..." })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs14("div", { className: "flex-1 overflow-y-auto bg-gray-900", children: [
      error && /* @__PURE__ */ jsx22("div", { className: "max-w-4xl mx-auto px-4 py-4", children: /* @__PURE__ */ jsx22("div", { className: "bg-red-900 border border-red-700 rounded-lg p-4", children: /* @__PURE__ */ jsxs14("p", { className: "text-red-200", children: [
        "Error: ",
        error.message
      ] }) }) }),
      /* @__PURE__ */ jsx22("div", { className: "min-h-full", children: messages.length === 0 ? /* @__PURE__ */ jsx22("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxs14("div", { className: "text-center max-w-2xl mx-auto px-4", children: [
        /* @__PURE__ */ jsx22("div", { className: "w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx22(Bot5, { className: "h-8 w-8 text-white" }) }),
        /* @__PURE__ */ jsx22("h1", { className: "text-2xl font-semibold text-white mb-2", children: agent?.name || "Assistant" }),
        /* @__PURE__ */ jsx22("p", { className: "text-gray-400 text-lg mb-8", children: agent?.description || "How can I help you today?" }),
        /* @__PURE__ */ jsx22("div", { className: "text-sm text-gray-500", children: /* @__PURE__ */ jsx22("p", { children: "Start a conversation by typing a message below." }) })
      ] }) }) : renderedMessages }),
      /* @__PURE__ */ jsx22("div", { ref: messagesEndRef })
    ] }),
    /* @__PURE__ */ jsx22(
      ChatInput,
      {
        value: input,
        onChange: setInput,
        onSend: sendMessage,
        onStop: () => {
          console.log("Stop streaming");
        },
        disabled: loading,
        isStreaming,
        placeholder
      }
    )
  ] });
};
var Chat = (props) => {
  return /* @__PURE__ */ jsx22(ChatProvider, { children: /* @__PURE__ */ jsx22(ChatContent, { ...props }) });
};

// src/components/ui/input.tsx
import * as React19 from "react";
import { jsx as jsx23 } from "react/jsx-runtime";
var Input = React19.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx23(
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

// src/components/ui/card.tsx
import * as React20 from "react";
import { jsx as jsx24 } from "react/jsx-runtime";
var Card = React20.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx24(
  "div",
  {
    ref,
    className: cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    ),
    ...props
  }
));
Card.displayName = "Card";
var CardHeader = React20.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx24(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React20.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx24(
  "h3",
  {
    ref,
    className: cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
var CardDescription = React20.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx24(
  "p",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React20.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx24("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React20.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx24(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";

// src/components/ui/badge.tsx
import { cva as cva3 } from "class-variance-authority";
import { jsx as jsx25 } from "react/jsx-runtime";
var badgeVariants = cva3(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx25("div", { className: cn(badgeVariants({ variant }), className), ...props });
}

// src/components/ui/dialog.tsx
import * as React21 from "react";
import { jsx as jsx26, jsxs as jsxs15 } from "react/jsx-runtime";
var Dialog = React21.createContext({});
var DialogRoot = ({ open, onOpenChange, children }) => {
  return /* @__PURE__ */ jsx26(Dialog.Provider, { value: { open, onOpenChange }, children });
};
var DialogTrigger = React21.forwardRef(({ className, children, ...props }, ref) => {
  const context = React21.useContext(Dialog);
  return /* @__PURE__ */ jsx26(
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
var DialogContent = React21.forwardRef(({ className, children, ...props }, ref) => {
  const context = React21.useContext(Dialog);
  if (!context.open) return null;
  return /* @__PURE__ */ jsx26("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm", children: /* @__PURE__ */ jsxs15(
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
        /* @__PURE__ */ jsx26(
          "button",
          {
            className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            onClick: () => context.onOpenChange?.(false),
            children: /* @__PURE__ */ jsxs15(
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
                  /* @__PURE__ */ jsx26("path", { d: "m18 6-12 12" }),
                  /* @__PURE__ */ jsx26("path", { d: "m6 6 12 12" })
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
var DialogHeader = React21.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx26(
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
var DialogTitle = React21.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx26(
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

// src/components/ui/textarea.tsx
import * as React22 from "react";
import { jsx as jsx27 } from "react/jsx-runtime";
var Textarea = React22.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx27(
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
  AgentSelect,
  AppSidebar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Chat,
  ChatContainer,
  DialogRoot as Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DistriProvider,
  EmbeddableChat,
  FullChat,
  Input,
  MessageRenderer_default as MessageRenderer,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Separator2 as Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  Skeleton,
  Textarea,
  ThemeProvider,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
  useAgent,
  useAgents,
  useChat,
  useSidebar,
  useTheme,
  useThreads,
  useTools
};
