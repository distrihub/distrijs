"use client";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/DistriProvider.tsx
import { createContext as createContext2, useContext as useContext2, useEffect as useEffect2, useState as useState2 } from "react";

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
function isDistriMessage(event) {
  return "id" in event && "role" in event && "parts" in event;
}

// ../core/src/encoder.ts
function convertA2AMessageToDistri(a2aMessage) {
  const role = a2aMessage.role === "agent" ? "assistant" : "user";
  return {
    id: a2aMessage.messageId,
    role,
    parts: a2aMessage.parts.map(convertA2APartToDistri),
    created_at: a2aMessage.createdAt
  };
}
function decodeA2AStreamEvent(event) {
  if (event.kind === "message") {
    return convertA2AMessageToDistri(event);
  } else if (event.kind === "status-update") {
    return event;
  } else if (event.kind === "artifact-update") {
    return event;
  }
  return event;
}
function convertA2APartToDistri(a2aPart) {
  switch (a2aPart.kind) {
    case "text":
      return { type: "text", text: a2aPart.text };
    case "file":
      if ("uri" in a2aPart.file) {
        return { type: "image_url", image: { mime_type: a2aPart.file.mimeType, url: a2aPart.file.uri } };
      } else {
        return { type: "image_bytes", image: { mime_type: a2aPart.file.mimeType, data: a2aPart.file.bytes } };
      }
    case "data":
      switch (a2aPart.data.part_type) {
        case "tool_call":
          return { type: "tool_call", tool_call: a2aPart.data };
        case "tool_result":
          return { type: "tool_result", tool_result: a2aPart.data };
        case "code_observation":
          return { type: "code_observation", thought: a2aPart.data.thought, code: a2aPart.data.code };
        case "plan":
          return { type: "plan", plan: a2aPart.data.plan };
        default:
          return { type: "data", data: a2aPart.data };
      }
    default:
      return { type: "text", text: JSON.stringify(a2aPart) };
  }
}
function convertDistriMessageToA2A(distriMessage, context) {
  let role;
  switch (distriMessage.role) {
    case "assistant":
      role = "agent";
      break;
    case "user":
      role = "user";
      break;
    case "system":
    case "tool":
      role = "user";
      break;
    default:
      role = "user";
  }
  return {
    messageId: distriMessage.id,
    role,
    parts: distriMessage.parts.map(convertDistriPartToA2A),
    kind: "message",
    contextId: context.thread_id,
    taskId: context.run_id
  };
}
function convertDistriPartToA2A(distriPart) {
  switch (distriPart.type) {
    case "text":
      return { kind: "text", text: distriPart.text };
    case "image_url":
      return { kind: "file", file: { mimeType: distriPart.image.mime_type, uri: distriPart.image.url } };
    case "image_bytes":
      return { kind: "file", file: { mimeType: distriPart.image.mime_type, bytes: distriPart.image.data } };
    case "tool_call":
      return { kind: "data", data: { part_type: "tool_call", tool_call: distriPart.tool_call } };
    case "tool_result":
      let val = {
        kind: "data",
        data: {
          tool_call_id: distriPart.tool_result.tool_call_id,
          result: distriPart.tool_result.result,
          part_type: "tool_result"
        }
      };
      console.log("<> val", val);
      return val;
    case "code_observation":
      return { kind: "data", data: { ...distriPart, part_type: "code_observation" } };
    case "plan":
      return { kind: "data", data: { ...distriPart, part_type: "plan" } };
    case "data":
      return { kind: "data", ...distriPart.data };
  }
}

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
   * Get messages from a thread as DistriMessage format
   */
  async getThreadMessagesAsDistri(threadId) {
    const messages = await this.getThreadMessages(threadId);
    return messages.map(convertA2AMessageToDistri);
  }
  /**
   * Send a DistriMessage to a thread
   */
  async sendDistriMessage(threadId, message, context) {
    const a2aMessage = convertDistriMessageToA2A(message, context);
    const params = {
      message: a2aMessage,
      metadata: context.metadata
    };
    await this.sendMessage(threadId, params);
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
   * Create a DistriMessage instance
   */
  static initDistriMessage(role, parts, id, created_at) {
    return {
      id: id || uuidv4(),
      role,
      parts,
      created_at
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
  /**
   * Create MessageSendParams from a DistriMessage using InvokeContext
   */
  static initDistriMessageParams(message, context) {
    const a2aMessage = convertDistriMessageToA2A(message, context);
    return {
      message: a2aMessage,
      metadata: context.metadata
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
    return Array.from(this.tools.values());
  }
  /**
   * Check if a tool is registered
   */
  hasTool(toolName) {
    return this.tools.has(toolName);
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
  get iconUrl() {
    return this.agentDefinition.icon_url;
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
    console.log("enhancedParams", enhancedParams);
    return await this.client.sendMessage(this.agentDefinition.id, enhancedParams);
  }
  /**
   * Streaming invoke
   */
  async invokeStream(params) {
    const enhancedParams = this.enhanceParamsWithTools(params);
    console.log("enhancedParams", enhancedParams);
    const a2aStream = this.client.sendMessageStream(this.agentDefinition.id, enhancedParams);
    return async function* () {
      for await (const event of a2aStream) {
        if (event.kind === "message") {
          yield convertA2AMessageToDistri(event);
        } else if (event.kind === "status-update") {
          yield event;
        } else if (event.kind === "artifact-update") {
          yield event;
        } else {
          yield event;
        }
      }
    }();
  }
  /**
   * Enhance message params with tool definitions
   */
  enhanceParamsWithTools(params) {
    const tools = this.getTools();
    return {
      ...params,
      metadata: {
        ...params.metadata,
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema
        }))
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
import React2, { useState as useState3, useCallback, useRef } from "react";
function useAgent({
  agentId,
  autoCreateAgent = true
}) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agent, setAgent] = useState3(null);
  const [loading, setLoading] = useState3(false);
  const [error, setError] = useState3(null);
  const agentRef = useRef(null);
  const currentAgentIdRef = useRef(null);
  const initializeAgent = useCallback(async () => {
    if (!client || !agentId) return;
    if (currentAgentIdRef.current === agentId && agentRef.current) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      if (currentAgentIdRef.current !== agentId) {
        agentRef.current = null;
        setAgent(null);
      }
      const newAgent = await Agent.create(agentId, client);
      agentRef.current = newAgent;
      currentAgentIdRef.current = agentId;
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
  }, [clientLoading, clientError, autoCreateAgent, client, agentId, initializeAgent]);
  React2.useEffect(() => {
    if (currentAgentIdRef.current !== agentId) {
      agentRef.current = null;
      setAgent(null);
      currentAgentIdRef.current = null;
    }
  }, [agentId]);
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
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedAgents = await client.getAgents();
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
import { useState as useState7, useCallback as useCallback4, useEffect as useEffect6, useRef as useRef3 } from "react";

// src/hooks/registerTools.tsx
import { useEffect as useEffect5, useRef as useRef2 } from "react";

// src/components/toolcalls/ApprovalToolCall.tsx
import { useState as useState5 } from "react";

// src/components/ui/button.tsx
import * as React3 from "react";

// src/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/components/ui/button.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
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
var Button = React3.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return /* @__PURE__ */ jsx3(
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

// src/components/toolcalls/ApprovalToolCall.tsx
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { jsx as jsx4, jsxs } from "react/jsx-runtime";
var ApprovalToolCall = ({
  toolCall,
  completeTool
}) => {
  const [isProcessing, setIsProcessing] = useState5(false);
  const input = typeof toolCall.input === "string" ? JSON.parse(toolCall.input) : toolCall.input;
  const reason = input.reason || "Approval required";
  const toolCallsToApprove = input.tool_calls || [];
  const handleResponse = async (approved) => {
    if (isProcessing || status === "completed") return;
    setIsProcessing(true);
    const result = {
      tool_call_id: toolCall.tool_call_id,
      result: `${toolCall.tool_name} ${approved ? "approved" : "denied"} by user`,
      success: true,
      error: void 0
    };
    completeTool(result);
  };
  if (status === "completed") {
    const result = input.result || {};
    return /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-4 bg-muted/50", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        result.approved ? /* @__PURE__ */ jsx4(CheckCircle, { className: "h-4 w-4 text-green-600" }) : /* @__PURE__ */ jsx4(XCircle, { className: "h-4 w-4 text-red-600" }),
        /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
          "Approval ",
          result.approved ? "Granted" : "Denied"
        ] })
      ] }),
      /* @__PURE__ */ jsx4("p", { className: "text-sm text-muted-foreground", children: reason })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-4 bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx4(AlertTriangle, { className: "h-4 w-4 text-amber-500" }),
      /* @__PURE__ */ jsx4("span", { className: "font-medium", children: "Approval Required" })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "text-sm mb-4", children: reason }),
    toolCallsToApprove.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx4("p", { className: "text-xs text-muted-foreground mb-2", children: "Tool calls requiring approval:" }),
      /* @__PURE__ */ jsx4("div", { className: "space-y-1", children: toolCallsToApprove.map((tc, index) => /* @__PURE__ */ jsx4("div", { className: "text-xs bg-muted p-2 rounded", children: /* @__PURE__ */ jsx4("span", { className: "font-mono", children: tc.tool_name }) }, index)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx4(
        Button,
        {
          size: "sm",
          variant: "destructive",
          onClick: () => handleResponse(false),
          disabled: isProcessing,
          children: "Deny"
        }
      ),
      /* @__PURE__ */ jsx4(
        Button,
        {
          size: "sm",
          onClick: () => handleResponse(true),
          disabled: isProcessing,
          children: "Approve"
        }
      )
    ] })
  ] });
};

// src/components/toolcalls/ToastToolCall.tsx
import { useEffect as useEffect4 } from "react";
import { toast } from "sonner";
import { Fragment, jsx as jsx5 } from "react/jsx-runtime";
var ToastToolCall = ({
  toolCall,
  completeTool
}) => {
  const input = typeof toolCall.input === "string" ? JSON.parse(toolCall.input) : toolCall.input;
  const message = input.message || "Toast message";
  const type = input.type || "info";
  let method;
  switch (type) {
    case "success":
      method = toast.success;
      break;
    case "error":
      method = toast.error;
      break;
    case "warning":
      method = toast.warning;
      break;
    default:
      method = toast.info;
  }
  ;
  let duration = 500;
  useEffect4(() => {
    method(message, {
      duration: duration * 2,
      position: "top-right",
      className: "bg-background text-foreground border border-border",
      style: {
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
        border: "1px solid var(--border)"
      }
    });
    setTimeout(() => {
      const result = {
        tool_call_id: toolCall.tool_call_id,
        result: "Toast displayed successfully",
        success: true,
        error: void 0
      };
      completeTool(result);
    }, duration);
  }, [message, type, completeTool]);
  return /* @__PURE__ */ jsx5(Fragment, {});
};

// src/hooks/registerTools.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function registerTools({ agent, tools }) {
  const lastAgentIdRef = useRef2(null);
  useEffect5(() => {
    if (!agent || !tools || tools.length === 0) {
      return;
    }
    if (lastAgentIdRef.current === agent.id) {
      return;
    }
    [...defaultTools, ...tools].forEach((tool) => {
      agent.registerTool(tool);
      console.log(`\u2713 Registered tool: ${tool.name}`);
    });
    lastAgentIdRef.current = agent.id;
    console.log(`Successfully registered ${tools.length} tools with agent`);
  }, [agent?.id, tools]);
}
var defaultTools = [
  {
    name: "toast",
    type: "ui",
    description: "Show a toast message",
    input_schema: {
      type: "object",
      properties: {
        message: { type: "string" },
        type: { type: "string", enum: ["success", "error", "warning", "info"] }
      }
    },
    component: (props) => {
      return /* @__PURE__ */ jsx6(ToastToolCall, { ...props });
    }
  }
  // {
  //   name: 'approval_request',
  //   type: 'ui',
  //   description: 'Request approval from the user',
  //   parameters: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string' }
  //     }
  //   },
  //   component: (props: UiToolProps) => { return (<ApprovalToolCall {...props} />) },
  // }
];

// src/hooks/useToolCallState.ts
import { useState as useState6, useCallback as useCallback3 } from "react";
function useToolCallState(options) {
  const [toolCallStates, setToolCallStates] = useState6(/* @__PURE__ */ new Map());
  const { onAllToolsCompleted, agent } = options;
  const executeTool = async (tool, toolCall) => {
    if (!tool) {
      console.error(`Tool ${toolCall.tool_name} not found`);
      return;
    }
    let component;
    if (tool.type === "ui") {
      component = tool.component({
        toolCall,
        toolCallState: toolCallStates.get(toolCall.tool_call_id),
        completeTool: (result) => {
          updateToolCallStatus(toolCall.tool_call_id, {
            status: "completed",
            result,
            completedAt: /* @__PURE__ */ new Date()
          });
        }
      });
      updateToolCallStatus(toolCall.tool_call_id, {
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        component,
        status: "running",
        startedAt: /* @__PURE__ */ new Date()
      });
    } else {
      try {
        const result = await tool.handler(toolCall.input);
        console.log("result", result);
        updateToolCallStatus(toolCall.tool_call_id, {
          status: "completed",
          result: JSON.stringify(result),
          completedAt: /* @__PURE__ */ new Date()
        });
      } catch (error) {
        updateToolCallStatus(toolCall.tool_call_id, {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
          completedAt: /* @__PURE__ */ new Date()
        });
      }
    }
  };
  const initToolCall = useCallback3((toolCall) => {
    const tool = agent?.getTools().find((t) => t.name === toolCall.tool_name);
    setToolCallStates((prev) => {
      const newStates = new Map(prev);
      const state = {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        status: "pending",
        startedAt: /* @__PURE__ */ new Date()
      };
      newStates.set(toolCall.tool_call_id, state);
      return newStates;
    });
    if (tool) {
      executeTool(tool, toolCall);
    } else {
      console.log(agent?.getTools());
    }
  }, []);
  const updateToolCallStatus = useCallback3((toolCallId, updates) => {
    setToolCallStates((prev) => {
      const newStates = new Map(prev);
      const currentState = newStates.get(toolCallId);
      if (currentState) {
        newStates.set(toolCallId, {
          ...currentState,
          ...updates
        });
      }
      if (Array.from(newStates.values()).filter((state) => state.status === "pending" || state.status === "running").length === 0 && onAllToolsCompleted) {
        onAllToolsCompleted(Array.from(newStates.values()).map((state) => ({
          tool_call_id: state.tool_call_id,
          result: state.result,
          success: state.status === "completed",
          error: state.error
        })));
      }
      return newStates;
    });
  }, []);
  const getToolCallState = useCallback3((toolCallId) => {
    return toolCallStates.get(toolCallId);
  }, [toolCallStates]);
  const hasPendingToolCalls = useCallback3(() => {
    return Array.from(toolCallStates.values()).some(
      (state) => state.status === "pending" || state.status === "running"
    );
  }, [toolCallStates]);
  const getPendingToolCalls = useCallback3(() => {
    const pendingIds = Array.from(toolCallStates.entries()).filter(([_, state]) => state.status === "pending" || state.status === "running").map(([id, _]) => id);
    return Array.from(toolCallStates.values()).filter((state) => pendingIds.includes(state.tool_call_id));
  }, [toolCallStates]);
  const clearAll = useCallback3(() => {
    setToolCallStates(/* @__PURE__ */ new Map());
  }, []);
  const clearToolResults = useCallback3(() => {
    toolCallStates.forEach((state) => {
      state.result = void 0;
      state.error = void 0;
    });
  }, []);
  return {
    toolCallStates,
    initToolCall,
    updateToolCallStatus,
    getToolCallState,
    hasPendingToolCalls,
    getPendingToolCalls,
    clearAll,
    clearToolResults
  };
}

// src/useChat.ts
function useChat({
  threadId,
  onMessage,
  onError,
  metadata,
  onMessagesUpdate,
  agent,
  tools
}) {
  const [messages, setMessages] = useState7([]);
  const [isLoading, setIsLoading] = useState7(false);
  const [isStreaming, setIsStreaming] = useState7(false);
  const [error, setError] = useState7(null);
  const abortControllerRef = useRef3(null);
  const createInvokeContext = useCallback4(() => ({
    thread_id: threadId,
    run_id: void 0,
    metadata
  }), [threadId, metadata]);
  registerTools({ agent, tools });
  const toolStateHandler = useToolCallState({
    agent,
    onAllToolsCompleted: (toolResults) => {
      sendToolResultsToAgent(toolResults);
    }
  });
  useEffect6(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  const agentIdRef = useRef3(void 0);
  useEffect6(() => {
    if (agent?.id !== agentIdRef.current) {
      setMessages([]);
      toolStateHandler.clearAll();
      setError(null);
      agentIdRef.current = agent?.id;
    }
  }, [agent?.id, toolStateHandler]);
  const clearMessages = useCallback4(() => {
    setMessages([]);
    toolStateHandler.clearAll();
  }, [toolStateHandler]);
  const fetchMessages = useCallback4(async () => {
    if (!agent) return;
    try {
      const a2aMessages = await agent.getThreadMessages(threadId);
      const distriMessages = a2aMessages.map(decodeA2AStreamEvent);
      setMessages(distriMessages);
      onMessagesUpdate?.();
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Failed to fetch messages");
      setError(error2);
      onError?.(error2);
    }
  }, [threadId, agent?.id, onError, onMessagesUpdate]);
  useEffect6(() => {
    if (threadId) {
      fetchMessages();
    }
  }, [threadId, agent?.id]);
  const handleStreamEvent = useCallback4((event) => {
    setMessages((prev) => {
      if (isDistriMessage(event)) {
        const distriMessage = event;
        const existingMessageIndex = prev.findIndex((msg) => isDistriMessage(msg) && msg.id && msg.id === distriMessage.id);
        if (existingMessageIndex >= 0) {
          const updatedMessages = [...prev];
          const existingMessage = updatedMessages[existingMessageIndex];
          const mergedParts = [...existingMessage.parts, ...distriMessage.parts];
          updatedMessages[existingMessageIndex] = {
            ...existingMessage,
            parts: mergedParts
          };
          return updatedMessages;
        } else {
          return [...prev, distriMessage];
        }
      } else {
        return [...prev, event];
      }
    });
    if (isDistriMessage(event)) {
      const distriMessage = event;
      const toolCallParts = distriMessage.parts.filter((part) => part.type === "tool_call");
      if (toolCallParts.length > 0) {
        const newToolCalls = toolCallParts.map((part) => part.tool_call);
        newToolCalls.forEach((toolCall) => {
          toolStateHandler.initToolCall(toolCall);
        });
      }
      const toolResultParts = distriMessage.parts.filter((part) => part.type === "tool_result");
      if (toolResultParts.length > 0) {
        const newToolResults = toolResultParts.map((part) => part.tool_result);
        newToolResults.forEach((toolResult) => {
          toolStateHandler.updateToolCallStatus(
            toolResult.tool_call_id,
            {
              status: toolResult.success ? "completed" : "error",
              result: toolResult.result,
              error: toolResult.error,
              completedAt: /* @__PURE__ */ new Date()
            }
          );
        });
      }
    }
    onMessage?.(event);
  }, [onMessage, agent]);
  const sendMessage = useCallback4(async (content) => {
    if (!agent) return;
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      const parts = typeof content === "string" ? [{ type: "text", text: content }] : content;
      const distriMessage = DistriClient.initDistriMessage("user", parts);
      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);
      setMessages((prev) => [...prev, distriMessage]);
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: context.metadata
      });
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        handleStreamEvent(event);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const error2 = err instanceof Error ? err : new Error("Failed to send message");
      setError(error2);
      onError?.(error2);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, onError]);
  const sendMessageStream = useCallback4(async (content, role = "user") => {
    if (!agent) return;
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      const parts = typeof content === "string" ? [{ type: "text", text: content }] : content;
      const distriMessage = DistriClient.initDistriMessage(role, parts);
      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);
      setMessages((prev) => [...prev, distriMessage]);
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: context.metadata
      });
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        handleStreamEvent(event);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const error2 = err instanceof Error ? err : new Error("Failed to send message");
      setError(error2);
      onError?.(error2);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, onError, threadId]);
  const sendToolResultsToAgent = useCallback4(async (toolResults) => {
    if (agent && toolResults.length > 0) {
      console.log("Sending tool results via streaming:", toolResults);
      try {
        const toolResultParts = toolResults.map((result) => ({
          type: "tool_result",
          tool_result: result
        }));
        await sendMessageStream(toolResultParts, "tool");
        toolStateHandler.clearToolResults();
      } catch (err) {
        console.error("Failed to send tool results:", err);
        setError(err instanceof Error ? err : new Error("Failed to send tool results"));
      }
    }
  }, [sendMessageStream, toolStateHandler]);
  const stopStreaming = useCallback4(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  return {
    messages,
    isStreaming,
    sendMessage,
    sendMessageStream,
    isLoading,
    error,
    clearMessages,
    agent: agent || void 0,
    toolCallStates: toolStateHandler.toolCallStates,
    hasPendingToolCalls: toolStateHandler.hasPendingToolCalls,
    stopStreaming
  };
}

// src/useThreads.ts
import { useState as useState8, useEffect as useEffect7, useCallback as useCallback5 } from "react";
function useThreads() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = useState8([]);
  const [loading, setLoading] = useState8(true);
  const [error, setError] = useState8(null);
  const fetchThreads = useCallback5(async () => {
    if (!client) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedThreads = await client.getThreads();
      setThreads(fetchedThreads);
    } catch (err) {
      console.error("[useThreads] Failed to fetch threads:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch threads"));
    } finally {
      setLoading(false);
    }
  }, [client]);
  const fetchThread = useCallback5(async (threadId) => {
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
  const deleteThread = useCallback5(async (threadId) => {
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
  const updateThread = useCallback5(async (threadId, localId) => {
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
      setLoading(true);
      return;
    }
    if (clientError) {
      setError(clientError);
      setLoading(false);
      return;
    }
    if (client) {
      fetchThreads();
    } else {
      setLoading(false);
    }
  }, [clientLoading, clientError, client, fetchThreads]);
  useEffect7(() => {
    if (!client) return;
    const interval = setInterval(() => {
      fetchThreads();
    }, 3e4);
    return () => clearInterval(interval);
  }, [client, fetchThreads]);
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

// src/components/FullChat.tsx
import { useState as useState13, useCallback as useCallback8, useEffect as useEffect11 } from "react";

// src/components/EmbeddableChat.tsx
import { useState as useState10, useRef as useRef5, useEffect as useEffect9, useMemo as useMemo2 } from "react";
import { MessageSquare } from "lucide-react";

// src/components/Components.tsx
import React8, { useState as useState9 } from "react";
import { User, Bot, Settings, Clock, CheckCircle as CheckCircle2, XCircle as XCircle2, Brain as Brain2, Wrench as Wrench2, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

// src/components/MessageRenderer.tsx
import React7, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Brain, Wrench, FileText } from "lucide-react";

// src/components/ChatContext.tsx
import React6, { createContext as createContext3, useContext as useContext3 } from "react";
import { jsx as jsx7 } from "react/jsx-runtime";
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
import { jsx as jsx8, jsxs as jsxs2 } from "react/jsx-runtime";
var CodeBlock = ({ language, children, inline = false }) => {
  const [copied, setCopied] = React7.useState(false);
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
    return /* @__PURE__ */ jsx8("code", { className: "px-1.5 py-0.5 rounded text-sm font-mono bg-muted text-foreground", children });
  }
  const lineCount = children.split("\n").length;
  const shouldShowLineNumbers = lineCount > 4;
  return /* @__PURE__ */ jsxs2("div", { className: "relative group", children: [
    /* @__PURE__ */ jsx8("div", { className: "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx8(
      "button",
      {
        onClick: handleCopy,
        className: "p-2 rounded-md bg-muted hover:bg-muted/80",
        title: "Copy code",
        children: copied ? /* @__PURE__ */ jsx8(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx8(Copy, { className: "h-4 w-4" })
      }
    ) }),
    /* @__PURE__ */ jsx8("div", { className: "relative", children: /* @__PURE__ */ jsx8(
      SyntaxHighlighter,
      {
        style: oneLight,
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
          background: "hsl(var(--muted))",
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
var CodeObservationComponent = ({ thought, code }) => {
  return /* @__PURE__ */ jsxs2("div", { className: "border rounded-lg p-4 my-4 border-border bg-muted/50", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx8(Brain, { className: "h-4 w-4 text-blue-500" }),
      /* @__PURE__ */ jsx8("span", { className: "text-sm font-medium text-blue-600", children: "Code Observation" })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "mb-3", children: [
      /* @__PURE__ */ jsx8("div", { className: "text-sm text-muted-foreground mb-2", children: "Thought:" }),
      /* @__PURE__ */ jsx8("div", { className: "text-sm text-foreground", children: thought })
    ] }),
    /* @__PURE__ */ jsxs2("div", { children: [
      /* @__PURE__ */ jsx8("div", { className: "text-sm text-muted-foreground mb-2", children: "Code:" }),
      /* @__PURE__ */ jsx8(CodeBlock, { language: "javascript", children: code })
    ] })
  ] });
};
var ToolCallComponent = ({ toolCall }) => {
  return /* @__PURE__ */ jsxs2("div", { className: "border rounded-lg p-4 my-4 border-border bg-muted/50", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx8(Wrench, { className: "h-4 w-4 text-green-500" }),
      /* @__PURE__ */ jsx8("span", { className: "text-sm font-medium text-green-600", children: "Tool Call" })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx8("span", { className: "text-sm text-muted-foreground", children: "Tool:" }),
        /* @__PURE__ */ jsx8("span", { className: "ml-2 text-sm font-mono text-foreground", children: toolCall.tool_name })
      ] }),
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx8("span", { className: "text-sm text-muted-foreground", children: "Input:" }),
        /* @__PURE__ */ jsx8("div", { className: "mt-1", children: /* @__PURE__ */ jsx8(CodeBlock, { language: "json", children: JSON.stringify(toolCall.input, null, 2) }) })
      ] })
    ] })
  ] });
};
var ToolResultComponent = ({ toolResult }) => {
  return /* @__PURE__ */ jsxs2("div", { className: "border rounded-lg p-4 my-4 border-border bg-muted/50", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx8(FileText, { className: "h-4 w-4 text-purple-500" }),
      /* @__PURE__ */ jsx8("span", { className: "text-sm font-medium text-purple-600", children: "Tool Result" }),
      /* @__PURE__ */ jsx8("span", { className: `text-xs px-2 py-1 rounded ${toolResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`, children: toolResult.success ? "Success" : "Error" })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "space-y-2", children: [
      toolResult.error && /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx8("span", { className: "text-sm text-destructive", children: "Error:" }),
        /* @__PURE__ */ jsx8("div", { className: "mt-1 text-sm text-destructive", children: toolResult.error })
      ] }),
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx8("span", { className: "text-sm text-muted-foreground", children: "Result:" }),
        /* @__PURE__ */ jsx8("div", { className: "mt-1", children: /* @__PURE__ */ jsx8(CodeBlock, { language: "json", children: JSON.stringify(toolResult.result, null, 2) }) })
      ] })
    ] })
  ] });
};
var PlanComponent = ({ plan }) => {
  return /* @__PURE__ */ jsxs2("div", { className: "border rounded-lg p-4 my-4 border-border bg-muted/50", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx8(Brain, { className: "h-4 w-4 text-orange-500" }),
      /* @__PURE__ */ jsx8("span", { className: "text-sm font-medium text-orange-600", children: "Plan" })
    ] }),
    /* @__PURE__ */ jsx8("div", { className: "text-sm text-foreground", children: plan })
  ] });
};
var PartRenderer = ({ part }) => {
  switch (part.type) {
    case "text":
      return /* @__PURE__ */ jsx8("div", { className: "whitespace-pre-wrap break-words text-foreground", children: part.text });
    case "code_observation":
      return /* @__PURE__ */ jsx8(CodeObservationComponent, { thought: part.thought, code: part.code });
    case "tool_call":
      return /* @__PURE__ */ jsx8(ToolCallComponent, { toolCall: part.tool_call });
    case "tool_result":
      return /* @__PURE__ */ jsx8(ToolResultComponent, { toolResult: part.tool_result });
    case "plan":
      return /* @__PURE__ */ jsx8(PlanComponent, { plan: part.plan });
    case "image_url":
      return /* @__PURE__ */ jsx8("div", { className: "my-4", children: /* @__PURE__ */ jsx8(
        "img",
        {
          src: part.image.url,
          alt: part.image.name || "Image",
          className: "max-w-full rounded-lg"
        }
      ) });
    case "image_bytes":
      return /* @__PURE__ */ jsx8("div", { className: "my-4", children: /* @__PURE__ */ jsx8(
        "img",
        {
          src: `data:${part.image.mime_type};base64,${part.image.data}`,
          alt: part.image.name || "Image",
          className: "max-w-full rounded-lg"
        }
      ) });
    case "data":
      return /* @__PURE__ */ jsx8("div", { className: "my-4", children: /* @__PURE__ */ jsx8(CodeBlock, { language: "json", children: JSON.stringify(part.data, null, 2) }) });
    default:
      return null;
  }
};
var MessageRenderer = ({
  content,
  message,
  className = "",
  metadata: _metadata
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
  if (message && isDistriMessage(message)) {
    const hasToolCalls = message.parts.some((part) => part.type === "tool_call");
    const filteredParts = hasToolCalls ? message.parts.filter((part) => part.type !== "tool_result") : message.parts;
    const groupedParts = [];
    let currentTextGroup = [];
    for (const part of filteredParts) {
      if (part.type === "text") {
        currentTextGroup.push(part);
      } else {
        if (currentTextGroup.length > 0) {
          groupedParts.push([...currentTextGroup]);
          currentTextGroup = [];
        }
        groupedParts.push([part]);
      }
    }
    if (currentTextGroup.length > 0) {
      groupedParts.push(currentTextGroup);
    }
    return /* @__PURE__ */ jsx8("div", { className: `space-y-2 ${className}`, children: groupedParts.map((group, groupIndex) => {
      if (group.length > 1 && group.every((part) => part.type === "text")) {
        const concatenatedText = group.map((part) => part.type === "text" ? part.text : "").join("");
        return /* @__PURE__ */ jsx8("div", { className: "whitespace-pre-wrap break-words text-foreground", children: concatenatedText }, groupIndex);
      } else {
        return /* @__PURE__ */ jsx8(PartRenderer, { part: group[0] }, groupIndex);
      }
    }) });
  }
  if (!content) return null;
  const hasMarkdownSyntax = useMemo(() => {
    if (!config.enableMarkdown) return false;
    const markdownPatterns = [
      /^#{1, 6}\s+/m,
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
  const looksLikeCode = useMemo(() => {
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
      /^\s*<html|<head|<body|<div /,
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
      /[{ }[\]()]/g,
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
  const detectLanguage = useMemo(() => {
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
    return /* @__PURE__ */ jsx8(
      CodeBlock,
      {
        language: detectLanguage,
        children: content
      }
    );
  }
  if (!hasMarkdownSyntax) {
    return /* @__PURE__ */ jsx8("div", { className: `whitespace-pre-wrap break-words text-foreground ${className}`, children: content });
  }
  return /* @__PURE__ */ jsx8("div", { className: `prose prose-sm max-w-none prose-foreground ${className} break-words`, children: /* @__PURE__ */ jsx8(
    ReactMarkdown,
    {
      components: {
        code({ className: className2, children }) {
          const match = /language-(\w+)/.exec(className2 || "");
          const language = match ? match[1] : "";
          return /* @__PURE__ */ jsx8(
            CodeBlock,
            {
              language,
              inline: true,
              children: String(children).replace(/\n$/, "")
            }
          );
        },
        // Enhanced blockquote styling
        blockquote({ children }) {
          return /* @__PURE__ */ jsx8("blockquote", { className: "border-l-4 pl-4 py-2 italic my-4 rounded-r border-primary text-primary bg-primary/10", children });
        },
        // Enhanced table styling with overflow handling
        table({ children }) {
          return /* @__PURE__ */ jsx8("div", { className: "overflow-x-auto my-4", children: /* @__PURE__ */ jsx8("table", { className: "min-w-full border-collapse rounded-lg overflow-hidden border-border", children }) });
        },
        th({ children }) {
          return /* @__PURE__ */ jsx8("th", { className: "border px-4 py-2 font-semibold text-left border-border bg-muted", children });
        },
        td({ children }) {
          return /* @__PURE__ */ jsx8("td", { className: "border px-4 py-2 border-border", children });
        }
      },
      children: content
    }
  ) });
};
var MessageRenderer_default = MessageRenderer;

// src/components/Components.tsx
import { jsx as jsx9, jsxs as jsxs3 } from "react/jsx-runtime";
var MessageContainer = ({ children, align = "left", className = "", backgroundColor }) => {
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
  return /* @__PURE__ */ jsx9("div", { className: `flex ${justifyClass} w-full ${bgClass} ${className}`, children: /* @__PURE__ */ jsx9("div", { className: "w-full max-w-4xl mx-auto", children }) });
};
var UserMessage = ({
  content,
  message,
  timestamp,
  className = "",
  avatar
}) => {
  return /* @__PURE__ */ jsx9(MessageContainer, { align: "center", className, backgroundColor: "#343541", children: /* @__PURE__ */ jsxs3("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx9("div", { className: "distri-avatar distri-avatar-user", children: avatar || /* @__PURE__ */ jsx9(User, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs3("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx9("div", { className: "text-sm font-medium text-foreground mb-2", children: "You" }),
      /* @__PURE__ */ jsx9("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx9(
        MessageRenderer_default,
        {
          content,
          message,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx9("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var AssistantMessage = ({
  content,
  message,
  timestamp,
  isStreaming = false,
  metadata: _metadata,
  className = "",
  avatar,
  name = "Assistant"
}) => {
  return /* @__PURE__ */ jsx9(MessageContainer, { align: "center", className, backgroundColor: "#444654", children: /* @__PURE__ */ jsxs3("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx9("div", { className: "distri-avatar distri-avatar-assistant", children: avatar || /* @__PURE__ */ jsx9(Bot, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs3("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs3("div", { className: "text-sm font-medium text-foreground mb-2 flex items-center gap-2", children: [
        name,
        isStreaming && /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx9("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse" }),
          /* @__PURE__ */ jsx9("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ jsx9("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      /* @__PURE__ */ jsx9("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx9(
        MessageRenderer_default,
        {
          content,
          message,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx9("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var AssistantWithToolCalls = ({
  content,
  message,
  toolCallStates,
  timestamp,
  isStreaming = false,
  className = "",
  avatar,
  name = "Assistant"
}) => {
  const [expandedTools, setExpandedTools] = useState9(/* @__PURE__ */ new Set());
  const toggleToolExpansion = (toolCallId) => {
    setExpandedTools((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toolCallId)) {
        newSet.delete(toolCallId);
      } else {
        newSet.add(toolCallId);
      }
      return newSet;
    });
  };
  React8.useEffect(() => {
    const newExpanded = new Set(expandedTools);
    toolCallStates.forEach((toolCallState) => {
      if (toolCallState.status === "running" || toolCallState.status === "error" || toolCallState.status === "user_action_required") {
        newExpanded.add(toolCallState.tool_call_id);
      }
    });
    setExpandedTools(newExpanded);
  }, [toolCallStates]);
  return /* @__PURE__ */ jsx9(MessageContainer, { align: "center", className, backgroundColor: "#444654", children: /* @__PURE__ */ jsxs3("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx9("div", { className: "distri-avatar distri-avatar-assistant", children: avatar || /* @__PURE__ */ jsx9(Bot, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs3("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs3("div", { className: "text-sm font-medium text-foreground mb-2 flex items-center gap-2", children: [
        name,
        isStreaming && /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx9("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse" }),
          /* @__PURE__ */ jsx9("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ jsx9("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      /* @__PURE__ */ jsx9("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx9(
        MessageRenderer_default,
        {
          content,
          message,
          className: "text-foreground"
        }
      ) }),
      toolCallStates.length > 0 && /* @__PURE__ */ jsxs3("div", { className: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsx9("div", { className: "text-sm font-medium text-foreground", children: "Tool Calls" }),
        toolCallStates.map((toolCallState, index) => {
          const isExpanded = expandedTools.has(toolCallState.tool_call_id);
          const hasResult = toolCallState?.result !== void 0;
          const hasError = toolCallState?.error !== void 0;
          const canCollapse = hasResult || hasError || toolCallState?.status === "completed" || toolCallState?.status === "error";
          return /* @__PURE__ */ jsxs3("div", { className: "border rounded-lg bg-background overflow-hidden", children: [
            /* @__PURE__ */ jsxs3("div", { className: "p-3 border-b border-border", children: [
              /* @__PURE__ */ jsxs3("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx9(
                    "button",
                    {
                      onClick: () => toggleToolExpansion(toolCallState.tool_call_id),
                      className: "p-1 hover:bg-muted rounded transition-colors",
                      disabled: !canCollapse,
                      children: canCollapse ? isExpanded ? /* @__PURE__ */ jsx9(ChevronDown, { className: "h-3 w-3 text-muted-foreground" }) : /* @__PURE__ */ jsx9(ChevronRight, { className: "h-3 w-3 text-muted-foreground" }) : /* @__PURE__ */ jsx9("div", { className: "h-3 w-3" })
                    }
                  ),
                  /* @__PURE__ */ jsx9(Wrench2, { className: "h-4 w-4 text-green-500" }),
                  /* @__PURE__ */ jsx9("span", { className: "text-sm font-medium text-foreground", children: toolCallState?.tool_name })
                ] }),
                /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2", children: [
                  toolCallState?.status === "pending" && /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-1 text-xs text-yellow-600", children: [
                    /* @__PURE__ */ jsx9(Clock, { className: "h-3 w-3" }),
                    "Pending"
                  ] }),
                  toolCallState?.status === "running" && /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-1 text-xs text-blue-600", children: [
                    /* @__PURE__ */ jsx9(Loader2, { className: "h-3 w-3 animate-spin" }),
                    "Running"
                  ] }),
                  toolCallState?.status === "completed" && /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-1 text-xs text-green-600", children: [
                    /* @__PURE__ */ jsx9(CheckCircle2, { className: "h-3 w-3" }),
                    "Completed"
                  ] }),
                  toolCallState?.status === "error" && /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-1 text-xs text-red-600", children: [
                    /* @__PURE__ */ jsx9(XCircle2, { className: "h-3 w-3" }),
                    "Failed"
                  ] }),
                  toolCallState?.status === "user_action_required" && /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-1 text-xs text-orange-600", children: [
                    /* @__PURE__ */ jsx9(Wrench2, { className: "h-3 w-3" }),
                    "User Action Required"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs3("div", { className: "mt-2", children: [
                /* @__PURE__ */ jsx9("div", { className: "text-xs text-muted-foreground mb-1", children: "Input:" }),
                /* @__PURE__ */ jsx9("div", { className: "text-xs font-mono bg-muted p-2 rounded border", children: JSON.stringify(toolCallState?.input, null, 2) })
              ] }),
              /* @__PURE__ */ jsx9("div", { className: "mt-3", children: !!toolCallState?.component && toolCallState.component })
            ] }),
            canCollapse && isExpanded && /* @__PURE__ */ jsxs3("div", { className: "p-3 bg-muted/30", children: [
              hasError && /* @__PURE__ */ jsxs3("div", { className: "mb-3", children: [
                /* @__PURE__ */ jsx9("div", { className: "text-xs text-red-600 font-medium mb-1", children: "Error:" }),
                /* @__PURE__ */ jsx9("div", { className: "text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200", children: toolCallState?.error })
              ] }),
              hasResult && /* @__PURE__ */ jsxs3("div", { children: [
                /* @__PURE__ */ jsx9("div", { className: "text-xs text-muted-foreground font-medium mb-1", children: "Result:" }),
                /* @__PURE__ */ jsx9("div", { className: "text-xs font-mono bg-background p-2 rounded border", children: JSON.stringify(toolCallState?.result, null, 2) })
              ] })
            ] })
          ] }, index);
        })
      ] }),
      timestamp && /* @__PURE__ */ jsx9("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var PlanMessage = ({
  message,
  plan,
  timestamp,
  className = "",
  avatar
}) => {
  return /* @__PURE__ */ jsx9(MessageContainer, { align: "center", className, backgroundColor: "#40414f", children: /* @__PURE__ */ jsxs3("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx9("div", { className: "distri-avatar distri-avatar-plan", children: avatar || /* @__PURE__ */ jsx9(Brain2, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs3("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx9("div", { className: "text-sm font-medium text-foreground mb-2", children: "Plan" }),
      /* @__PURE__ */ jsx9("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx9(
        MessageRenderer_default,
        {
          content: plan,
          message,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx9("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var DebugMessage = ({
  message,
  className = "",
  timestamp
}) => {
  return /* @__PURE__ */ jsx9(MessageContainer, { align: "center", className, backgroundColor: "#343541", children: /* @__PURE__ */ jsxs3("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx9("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx9(
      MessageRenderer_default,
      {
        content: JSON.stringify(message),
        className: "text-foreground"
      }
    ) }),
    timestamp && /* @__PURE__ */ jsx9("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
  ] }) });
};

// src/utils/messageUtils.ts
var extractTextFromMessage = (message) => {
  if (isDistriMessage(message)) {
    if (!message?.parts || !Array.isArray(message.parts)) {
      return "";
    }
    const textParts = message.parts.filter((part) => part?.type === "text" && part?.text).map((part) => part.text);
    return textParts.join("") || "";
  } else {
    return JSON.stringify(message);
  }
};
var shouldDisplayMessage = (message, showDebugMessages = false) => {
  if (!message) return false;
  if (isDistriMessage(message)) {
    if (message.role === "user") {
      const textContent2 = extractTextFromMessage(message);
      return textContent2.trim().length > 0;
    }
    const textContent = extractTextFromMessage(message);
    if (textContent.trim()) return true;
  }
  return showDebugMessages;
};

// src/components/AgentSelect.tsx
import { Bot as Bot2 } from "lucide-react";

// src/components/ui/select.tsx
import * as React9 from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check as Check2, ChevronDown as ChevronDown2, ChevronUp } from "lucide-react";
import { jsx as jsx10, jsxs as jsxs4 } from "react/jsx-runtime";
var Select = SelectPrimitive.Root;
var SelectGroup = SelectPrimitive.Group;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React9.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs4(
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
      /* @__PURE__ */ jsx10(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx10(ChevronDown2, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx10(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx10(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx10(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx10(ChevronDown2, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React9.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx10(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs4(
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
      /* @__PURE__ */ jsx10(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx10(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx10(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx10(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React9.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs4(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx10("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx10(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx10(Check2, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx10(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx10(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// src/components/AgentSelect.tsx
import { jsx as jsx11, jsxs as jsxs5 } from "react/jsx-runtime";
var AgentSelect = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  className = "",
  placeholder = "Select an agent...",
  disabled = false
}) => {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  return /* @__PURE__ */ jsxs5(Select, { value: selectedAgentId, onValueChange: onAgentSelect, disabled, children: [
    /* @__PURE__ */ jsx11(SelectTrigger, { className: `w-full ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, children: /* @__PURE__ */ jsxs5("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx11(Bot2, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx11(SelectValue, { placeholder, children: selectedAgent?.name || placeholder })
    ] }) }),
    /* @__PURE__ */ jsx11(SelectContent, { children: agents.map((agent) => /* @__PURE__ */ jsx11(SelectItem, { value: agent.id, children: /* @__PURE__ */ jsxs5("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx11(Bot2, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs5("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx11("span", { className: "font-medium", children: agent.name }),
        agent.description && /* @__PURE__ */ jsx11("span", { className: "text-xs text-muted-foreground", children: agent.description })
      ] })
    ] }) }, agent.id)) })
  ] });
};

// src/components/ui/sonner.tsx
import { useTheme as useTheme2 } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { jsx as jsx12 } from "react/jsx-runtime";
var Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme2();
  return /* @__PURE__ */ jsx12(
    Sonner,
    {
      theme,
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};

// src/components/ChatInput.tsx
import { useRef as useRef4, useEffect as useEffect8 } from "react";
import { Send, Square } from "lucide-react";
import { jsx as jsx13, jsxs as jsxs6 } from "react/jsx-runtime";
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
  useEffect8(() => {
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
  return /* @__PURE__ */ jsx13("div", { className: `relative flex min-h-14 w-full items-end ${className}`, children: /* @__PURE__ */ jsx13("div", { className: "relative flex w-full flex-auto flex-col", children: /* @__PURE__ */ jsxs6("div", { className: "relative mx-5 flex min-h-14 flex-auto rounded-lg border border-input bg-input items-start h-full", children: [
    /* @__PURE__ */ jsx13(
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
    /* @__PURE__ */ jsx13("div", { className: "absolute right-2 bottom-0 flex items-center h-full", children: /* @__PURE__ */ jsx13(
      "button",
      {
        onClick: isStreaming ? handleStop : handleSend,
        disabled: !hasContent && !isStreaming,
        className: `h-10 w-10 rounded-md transition-colors flex items-center justify-center ${isStreaming ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : hasContent && !disabled ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted"}`,
        children: isStreaming ? /* @__PURE__ */ jsx13(Square, { className: "h-5 w-5" }) : /* @__PURE__ */ jsx13(Send, { className: "h-5 w-5" })
      }
    ) })
  ] }) }) });
};

// src/components/EmbeddableChat.tsx
import { jsx as jsx14, jsxs as jsxs7 } from "react/jsx-runtime";
var EmbeddableChat = ({
  threadId = uuidv4(),
  agent,
  className = "",
  style = {},
  metadata,
  tools,
  availableAgents = [],
  UserMessageComponent = UserMessage,
  AssistantMessageComponent = AssistantMessage,
  AssistantWithToolCallsComponent = AssistantWithToolCalls,
  PlanMessageComponent = PlanMessage,
  theme = "dark",
  showDebug = false,
  showAgentSelector = true,
  placeholder = "Type your message...",
  disableAgentSelection = false,
  onAgentSelect,
  onResponse: _onResponse,
  onMessagesUpdate
}) => {
  const [input, setInput] = useState10("");
  const messagesEndRef = useRef5(null);
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage: sendChatMessage,
    toolCallStates,
    stopStreaming
  } = useChat({
    threadId,
    agent: agent || void 0,
    tools,
    metadata,
    onMessagesUpdate
  });
  useEffect9(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const messageText = input.trim();
    setInput("");
    try {
      await sendChatMessage(messageText);
    } catch (err) {
      console.error("Failed to send message:", err);
      setInput(messageText);
    }
  };
  const getMessageType = (message) => {
    if (message.parts.some((part) => part.type === "tool_call")) {
      return "assistant_with_tools";
    }
    if (message.parts.some((part) => part.type === "plan")) {
      return "plan";
    }
    return message.role;
  };
  const renderedMessages = useMemo2(() => {
    return messages.filter((msg) => shouldDisplayMessage(msg, showDebug)).map((message, index) => {
      const messageContent = extractTextFromMessage(message);
      const key = `message-${index}`;
      const timestamp = message.created_at ? new Date(message.created_at) : void 0;
      if (isDistriMessage(message)) {
        switch (getMessageType(message)) {
          case "user":
            return /* @__PURE__ */ jsx14(
              UserMessageComponent,
              {
                message,
                timestamp
              },
              key
            );
          case "assistant":
            return /* @__PURE__ */ jsx14(
              AssistantMessageComponent,
              {
                name: agent?.name,
                avatar: agent?.iconUrl ? /* @__PURE__ */ jsx14("img", { src: agent.iconUrl, alt: agent.name, className: "w-6 h-6 rounded-full" }) : /* @__PURE__ */ jsx14("div", { className: "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs", children: agent?.name?.charAt(0).toUpperCase() || "A" }),
                message,
                timestamp,
                isStreaming: isStreaming && index === messages.length - 1
              },
              key
            );
          case "assistant_with_tools":
            const states = (message.parts || []).filter((part) => part.tool_call).map((part) => {
              const toolCallState = toolCallStates.get(part.tool_call.tool_call_id);
              return toolCallState;
            }).filter(Boolean);
            return /* @__PURE__ */ jsx14(
              AssistantWithToolCallsComponent,
              {
                message,
                toolCallStates: states,
                timestamp,
                isStreaming: isStreaming && index === messages.length - 1
              },
              key
            );
          case "plan":
            return /* @__PURE__ */ jsx14(
              PlanMessageComponent,
              {
                message,
                plan: messageContent,
                timestamp
              },
              key
            );
          case "debug":
            return /* @__PURE__ */ jsx14(
              DebugMessage,
              {
                message,
                timestamp
              },
              key
            );
          default:
            return null;
        }
      } else {
        return null;
      }
    }).filter(Boolean);
  }, [
    messages,
    showDebug,
    UserMessageComponent,
    AssistantMessageComponent,
    AssistantWithToolCallsComponent,
    PlanMessageComponent,
    toolCallStates,
    isStreaming
  ]);
  return /* @__PURE__ */ jsxs7(
    "div",
    {
      className: `distri-chat ${className} ${theme === "dark" ? "dark" : "light"} w-full bg-background text-foreground flex flex-col relative`,
      style: {
        ...style
      },
      children: [
        /* @__PURE__ */ jsx14("div", { className: "pt-6 px-6 bg-background flex-shrink-0 z-10", children: showAgentSelector && availableAgents && availableAgents.length > 0 && /* @__PURE__ */ jsx14("div", { className: "mb-6", children: /* @__PURE__ */ jsx14(
          AgentSelect,
          {
            agents: availableAgents,
            selectedAgentId: agent?.id,
            onAgentSelect: (agentId) => onAgentSelect?.(agentId),
            className: "w-full",
            disabled: disableAgentSelection || messages.length > 0
          }
        ) }) }),
        /* @__PURE__ */ jsx14(Toaster, {}),
        /* @__PURE__ */ jsx14("div", { className: "flex-1 relative min-h-0", children: /* @__PURE__ */ jsxs7("div", { className: "absolute inset-0 flex flex-col", children: [
          /* @__PURE__ */ jsx14("div", { className: "flex-1 overflow-y-auto distri-scroll bg-background", children: /* @__PURE__ */ jsxs7("div", { className: "mx-auto", style: { maxWidth: "var(--thread-content-max-width)" }, children: [
            messages.length === 0 ? /* @__PURE__ */ jsx14("div", { className: "h-full flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsxs7("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx14(MessageSquare, { className: "h-16 w-16 text-muted-foreground mx-auto mb-4" }),
              /* @__PURE__ */ jsx14("h3", { className: "text-lg font-medium text-foreground mb-2", children: "Start a conversation" }),
              /* @__PURE__ */ jsx14("p", { className: "text-muted-foreground max-w-sm", children: placeholder || "Type your message below to begin chatting." })
            ] }) }) : /* @__PURE__ */ jsx14("div", { className: "space-y-0 pt-4", children: renderedMessages }),
            isLoading && /* @__PURE__ */ jsxs7("div", { className: "px-6 py-4 flex items-center space-x-2 bg-muted rounded-lg mt-4", children: [
              /* @__PURE__ */ jsx14("div", { className: "h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" }),
              /* @__PURE__ */ jsx14("span", { className: "text-muted-foreground text-sm", children: "Thinking..." })
            ] }),
            error && /* @__PURE__ */ jsx14("div", { className: "px-6 py-4 bg-destructive/20 border border-destructive/20 rounded-lg mt-4", children: /* @__PURE__ */ jsxs7("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx14("div", { className: "h-4 w-4 rounded-full bg-destructive" }),
              /* @__PURE__ */ jsx14("span", { className: "text-destructive text-sm", children: error.message || String(error) })
            ] }) }),
            /* @__PURE__ */ jsx14("div", { ref: messagesEndRef })
          ] }) }),
          /* @__PURE__ */ jsx14("div", { className: "absolute bottom-0 left-0 right-0 bg-background py-4", children: /* @__PURE__ */ jsx14("div", { className: "mx-auto", style: { maxWidth: "var(--thread-content-max-width)" }, children: /* @__PURE__ */ jsx14(
            ChatInput,
            {
              value: input,
              onChange: setInput,
              onSend: sendMessage,
              onStop: stopStreaming,
              placeholder,
              disabled: isLoading,
              isStreaming,
              className: "w-full"
            }
          ) }) })
        ] }) }),
        /* @__PURE__ */ jsx14(Toaster, {})
      ]
    }
  );
};

// src/components/AgentList.tsx
import React12 from "react";
import { RefreshCw, Play, Bot as Bot3 } from "lucide-react";
import { jsx as jsx15, jsxs as jsxs8 } from "react/jsx-runtime";
var AgentList = ({ agents, onRefresh, onStartChat }) => {
  const [refreshing, setRefreshing] = React12.useState(false);
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
      /* @__PURE__ */ jsx15("h2", { className: "text-xl font-semibold text-foreground", children: "Available Agents" }),
      /* @__PURE__ */ jsxs8(
        "button",
        {
          onClick: handleRefresh,
          disabled: refreshing,
          className: "flex items-center space-x-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors",
          children: [
            /* @__PURE__ */ jsx15(RefreshCw, { className: `h-4 w-4 ${refreshing ? "animate-spin" : ""}` }),
            /* @__PURE__ */ jsx15("span", { children: "Refresh" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx15("div", { className: "p-6", children: agents.length === 0 ? /* @__PURE__ */ jsxs8("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx15(Bot3, { className: "h-16 w-16 text-muted-foreground mx-auto mb-4" }),
      /* @__PURE__ */ jsx15("p", { className: "text-muted-foreground text-lg", children: "No agents available" }),
      /* @__PURE__ */ jsx15("p", { className: "text-sm text-muted-foreground mt-2", children: "Check your server connection" })
    ] }) : /* @__PURE__ */ jsx15("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: agents.map((agent) => /* @__PURE__ */ jsxs8(
      "div",
      {
        className: "bg-card border border-border rounded-xl p-6 hover:border-border/80 hover:bg-card/80 transition-all duration-200",
        children: [
          /* @__PURE__ */ jsx15("div", { className: "flex items-start justify-between mb-4", children: /* @__PURE__ */ jsxs8("div", { className: "flex items-center space-x-3", children: [
            /* @__PURE__ */ jsx15("div", { className: "w-12 h-12 bg-primary rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx15(Bot3, { className: "h-6 w-6 text-primary-foreground" }) }),
            /* @__PURE__ */ jsxs8("div", { children: [
              /* @__PURE__ */ jsx15("h3", { className: "font-semibold text-foreground text-lg", children: agent.name }),
              /* @__PURE__ */ jsx15("div", { className: "flex items-center space-x-1", children: /* @__PURE__ */ jsx15("span", { className: "text-xs text-muted-foreground capitalize", children: agent.version ? `v${agent.version}` : "Latest" }) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx15("p", { className: "text-sm text-muted-foreground mb-6 line-clamp-3", children: agent.description || "No description available" }),
          /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx15("div", { className: "text-xs text-muted-foreground", children: agent.version && `Version ${agent.version}` }),
            /* @__PURE__ */ jsx15("div", { className: "flex items-center space-x-2", children: /* @__PURE__ */ jsxs8(
              "button",
              {
                onClick: () => onStartChat(agent),
                className: "flex items-center space-x-1 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors",
                children: [
                  /* @__PURE__ */ jsx15(Play, { className: "h-3 w-3" }),
                  /* @__PURE__ */ jsx15("span", { children: "Chat" })
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
import { jsx as jsx16, jsxs as jsxs9 } from "react/jsx-runtime";
var AgentsPage = ({ onStartChat }) => {
  const { agents, loading, refetch } = useAgents();
  const handleRefresh = async () => {
    await refetch();
  };
  const handleStartChat = (agent) => {
    onStartChat?.(agent);
  };
  if (loading) {
    return /* @__PURE__ */ jsx16("div", { className: "h-full bg-background flex items-center justify-center", children: /* @__PURE__ */ jsxs9("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx16("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" }),
      /* @__PURE__ */ jsx16("span", { className: "text-foreground", children: "Loading agents..." })
    ] }) });
  }
  return /* @__PURE__ */ jsx16("div", { className: "h-full bg-background overflow-auto", children: /* @__PURE__ */ jsxs9("div", { className: "container mx-auto p-6", children: [
    /* @__PURE__ */ jsx16("h1", { className: "text-3xl font-bold text-foreground mb-6", children: "Agents" }),
    /* @__PURE__ */ jsx16(
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
import { useState as useState12, useCallback as useCallback7 } from "react";
import { MoreHorizontal, Trash2, Edit3, Bot as Bot4, Users, Edit2, RefreshCw as RefreshCw2, Github, Loader2 as Loader22 } from "lucide-react";

// src/components/ui/sidebar.tsx
import * as React16 from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva as cva2 } from "class-variance-authority";
import { PanelLeft } from "lucide-react";

// src/components/ui/separator.tsx
import * as React13 from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { jsx as jsx17 } from "react/jsx-runtime";
var Separator2 = React13.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsx17(
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
import * as React14 from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { jsx as jsx18, jsxs as jsxs10 } from "react/jsx-runtime";
var Sheet = SheetPrimitive.Root;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React14.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx18(
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
var SheetContent = React14.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs10(SheetPortal, { children: [
  /* @__PURE__ */ jsx18(SheetOverlay, {}),
  /* @__PURE__ */ jsxs10(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs10(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ jsx18(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx18("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx18(
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
}) => /* @__PURE__ */ jsx18(
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
var SheetTitle = React14.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx18(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React14.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx18(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// src/components/ui/skeleton.tsx
import { jsx as jsx19 } from "react/jsx-runtime";
function Skeleton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx19(
    "div",
    {
      className: cn("animate-pulse rounded-md bg-muted", className),
      ...props
    }
  );
}

// src/components/ui/tooltip.tsx
import * as React15 from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { jsx as jsx20 } from "react/jsx-runtime";
var TooltipProvider = TooltipPrimitive.Provider;
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = React15.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx20(
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
import { jsx as jsx21, jsxs as jsxs11 } from "react/jsx-runtime";
var SIDEBAR_COOKIE_NAME = "sidebar:state";
var SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
var SIDEBAR_WIDTH = "16rem";
var SIDEBAR_WIDTH_MOBILE = "18rem";
var SIDEBAR_WIDTH_ICON = "3rem";
var SIDEBAR_KEYBOARD_SHORTCUT = "b";
var SidebarContext = React16.createContext(null);
function useSidebar() {
  const context = React16.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
var SidebarProvider = React16.forwardRef(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  const [_open, _setOpen] = React16.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React16.useCallback(
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
  const [openMobile, setOpenMobile] = React16.useState(false);
  const [isMobile, setIsMobile] = React16.useState(false);
  React16.useEffect(() => {
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
  React16.useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_COOKIE_NAME);
    if (savedState !== null) {
      setOpen(savedState === "true");
    }
  }, [setOpen]);
  React16.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);
  const toggleSidebar = React16.useCallback(() => {
    return isMobile ? setOpenMobile((open2) => !open2) : setOpen((open2) => !open2);
  }, [isMobile, setOpen, setOpenMobile]);
  const state = open ? "expanded" : "collapsed";
  const contextValue = React16.useMemo(
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
  return /* @__PURE__ */ jsx21(SidebarContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx21(TooltipProvider, { delayDuration: 0, children: /* @__PURE__ */ jsx21(
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
var Sidebar = React16.forwardRef(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (collapsible === "none") {
    return /* @__PURE__ */ jsx21(
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
    return /* @__PURE__ */ jsx21(Sheet, { open: openMobile, onOpenChange: setOpenMobile, ...props, children: /* @__PURE__ */ jsx21(
      SheetContent,
      {
        "data-sidebar": "sidebar",
        "data-mobile": "true",
        className: "w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
        style: {
          "--sidebar-width": SIDEBAR_WIDTH_MOBILE
        },
        side,
        children: /* @__PURE__ */ jsx21("div", { className: "flex h-full w-full flex-col", children })
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
        /* @__PURE__ */ jsx21(
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
        /* @__PURE__ */ jsx21(
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
            children: /* @__PURE__ */ jsx21(
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
var SidebarTrigger = React16.forwardRef(({ className, onClick, ...props }, ref) => {
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
        /* @__PURE__ */ jsx21(PanelLeft, {}),
        /* @__PURE__ */ jsx21("span", { className: "sr-only", children: "Toggle Sidebar" })
      ]
    }
  );
});
SidebarTrigger.displayName = "SidebarTrigger";
var SidebarRail = React16.forwardRef(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ jsx21(
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
var SidebarInset = React16.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx21(
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
var SidebarHeader = React16.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx21(
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
var SidebarFooter = React16.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx21(
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
var SidebarSeparator = React16.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx21(
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
var SidebarContent = React16.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx21(
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
var SidebarGroup = React16.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx21(
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
var SidebarGroupLabel = React16.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  return /* @__PURE__ */ jsx21(
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
var SidebarGroupAction = React16.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx21(
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
var SidebarGroupContent = React16.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx21(
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
var SidebarMenu = React16.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx21(
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
var SidebarMenuItem = React16.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx21(
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
var SidebarMenuButton = React16.forwardRef(({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();
  const button = /* @__PURE__ */ jsx21(
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
    /* @__PURE__ */ jsx21(TooltipTrigger, { asChild: true, children: button }),
    /* @__PURE__ */ jsx21(
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
var SidebarMenuAction = React16.forwardRef(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx21(
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
var SidebarMenuBadge = React16.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx21(
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
var SidebarMenuSkeleton = React16.forwardRef(({ className, showIcon = false, ...props }, ref) => {
  const width = React16.useMemo(() => {
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
        showIcon && /* @__PURE__ */ jsx21(Skeleton, { className: "size-4 rounded-md", "data-sidebar": "menu-skeleton-icon" }),
        /* @__PURE__ */ jsx21(
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
var SidebarMenuSub = React16.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx21(
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
var SidebarMenuSubItem = React16.forwardRef(({ ...props }, ref) => {
  return /* @__PURE__ */ jsx21("li", { ref, ...props });
});
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
var SidebarMenuSubButton = React16.forwardRef(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return /* @__PURE__ */ jsx21(
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

// src/components/ui/input.tsx
import * as React17 from "react";
import { jsx as jsx22 } from "react/jsx-runtime";
var Input = React17.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx22(
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
import * as React18 from "react";
import { jsx as jsx23 } from "react/jsx-runtime";
var Card = React18.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx23(
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
var CardHeader = React18.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx23(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React18.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx23(
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
var CardDescription = React18.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx23(
  "p",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React18.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx23("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React18.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx23(
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
import { jsx as jsx24 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx24("div", { className: cn(badgeVariants({ variant }), className), ...props });
}

// src/components/ui/dialog.tsx
import * as React19 from "react";
import { jsx as jsx25, jsxs as jsxs12 } from "react/jsx-runtime";
var Dialog = React19.createContext({});
var DialogRoot = ({ open, onOpenChange, children }) => {
  return /* @__PURE__ */ jsx25(Dialog.Provider, { value: { open, onOpenChange }, children });
};
var DialogTrigger = React19.forwardRef(({ className, children, ...props }, ref) => {
  const context = React19.useContext(Dialog);
  return /* @__PURE__ */ jsx25(
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
var DialogContent = React19.forwardRef(({ className, children, ...props }, ref) => {
  const context = React19.useContext(Dialog);
  if (!context.open) return null;
  return /* @__PURE__ */ jsx25("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm", children: /* @__PURE__ */ jsxs12(
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
        /* @__PURE__ */ jsx25(
          "button",
          {
            className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            onClick: () => context.onOpenChange?.(false),
            children: /* @__PURE__ */ jsxs12(
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
                  /* @__PURE__ */ jsx25("path", { d: "m18 6-12 12" }),
                  /* @__PURE__ */ jsx25("path", { d: "m6 6 12 12" })
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
var DialogHeader = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx25(
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
var DialogTitle = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx25(
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
import * as React20 from "react";
import { jsx as jsx26 } from "react/jsx-runtime";
var Textarea = React20.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx26(
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

// src/components/ui/dropdown-menu.tsx
import * as React21 from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check as Check3, ChevronRight as ChevronRight2, Circle } from "lucide-react";
import { jsx as jsx27, jsxs as jsxs13 } from "react/jsx-runtime";
var DropdownMenu = DropdownMenuPrimitive.Root;
var DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
var DropdownMenuSubTrigger = React21.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs13(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx27(ChevronRight2, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
var DropdownMenuSubContent = React21.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx27(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
var DropdownMenuContent = React21.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx27(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx27(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
var DropdownMenuItem = React21.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx27(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
var DropdownMenuCheckboxItem = React21.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs13(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx27("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx27(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx27(Check3, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
var DropdownMenuRadioItem = React21.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs13(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx27("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx27(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx27(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
var DropdownMenuLabel = React21.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx27(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
var DropdownMenuSeparator = React21.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx27(
  DropdownMenuPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
var DropdownMenuShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ jsx27(
    "span",
    {
      className: cn("ml-auto text-xs tracking-widest opacity-60", className),
      ...props
    }
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// src/components/AppSidebar.tsx
import { jsx as jsx28, jsxs as jsxs14 } from "react/jsx-runtime";
var ThreadItem = ({
  thread,
  isActive,
  onClick,
  onDelete,
  onRename
}) => {
  const [isEditing, setIsEditing] = useState12(false);
  const [editTitle, setEditTitle] = useState12(thread.title || "New Chat");
  const [showMenu, setShowMenu] = useState12(false);
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
  return /* @__PURE__ */ jsxs14(SidebarMenuItem, { className: "mb-3", children: [
    /* @__PURE__ */ jsx28(SidebarMenuButton, { asChild: true, isActive, children: /* @__PURE__ */ jsx28("div", { onClick, children: isEditing ? /* @__PURE__ */ jsx28(
      Input,
      {
        value: editTitle,
        onChange: (e) => setEditTitle(e.target.value),
        onBlur: handleRename,
        onKeyPress: handleKeyPress,
        className: "flex-1 text-sm bg-transparent border-none outline-none",
        autoFocus: true,
        onClick: (e) => e.stopPropagation()
      }
    ) : /* @__PURE__ */ jsxs14("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsx28("p", { className: "text-sm font-medium truncate leading-tight", children: thread.title || "New Chat" }),
      /* @__PURE__ */ jsx28("p", { className: "text-xs text-muted-foreground truncate leading-tight mt-0.5", children: thread.last_message || "No messages yet" })
    ] }) }) }),
    !isEditing && /* @__PURE__ */ jsxs14(DropdownMenu, { children: [
      /* @__PURE__ */ jsx28(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx28(SidebarMenuAction, { onClick: (e) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
      }, children: /* @__PURE__ */ jsx28(MoreHorizontal, {}) }) }),
      /* @__PURE__ */ jsxs14(DropdownMenuContent, { className: "w-[--radix-popper-anchor-width]", children: [
        /* @__PURE__ */ jsxs14(
          DropdownMenuItem,
          {
            onClick: (e) => {
              e.stopPropagation();
              setIsEditing(true);
              setShowMenu(false);
            },
            children: [
              /* @__PURE__ */ jsx28(Edit3, { className: "h-3 w-3" }),
              /* @__PURE__ */ jsx28("span", { children: "Rename" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs14(
          DropdownMenuItem,
          {
            onClick: (e) => {
              e.stopPropagation();
              onDelete();
              setShowMenu(false);
            },
            children: [
              /* @__PURE__ */ jsx28(Trash2, { className: "h-3 w-3" }),
              /* @__PURE__ */ jsx28("span", { children: "Delete" })
            ]
          }
        )
      ] })
    ] })
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
  const { threads, loading: threadsLoading, refetch } = useThreads();
  const { theme, setTheme } = useTheme();
  const { open } = useSidebar();
  const handleRefresh = useCallback7(() => {
    refetch();
  }, [refetch]);
  return /* @__PURE__ */ jsxs14(Sidebar, { collapsible: "icon", variant: "floating", children: [
    /* @__PURE__ */ jsx28(SidebarHeader, { children: /* @__PURE__ */ jsx28(SidebarMenu, { children: /* @__PURE__ */ jsxs14(SidebarMenuItem, { children: [
      /* @__PURE__ */ jsxs14(
        SidebarMenuButton,
        {
          onClick: onLogoClick,
          children: [
            /* @__PURE__ */ jsx28(Bot4, {}),
            "Distri"
          ]
        }
      ),
      /* @__PURE__ */ jsxs14(
        SidebarMenuAction,
        {
          onClick: () => setTheme(theme === "light" ? "dark" : "light"),
          title: "Toggle theme",
          className: "absolute right-0 top-0",
          children: [
            /* @__PURE__ */ jsxs14("svg", { className: "h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [
              /* @__PURE__ */ jsx28("circle", { cx: "12", cy: "12", r: "5" }),
              /* @__PURE__ */ jsx28("path", { d: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" })
            ] }),
            /* @__PURE__ */ jsx28("svg", { className: "absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx28("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" }) })
          ]
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsx28(SidebarSeparator, {}),
    /* @__PURE__ */ jsxs14(SidebarContent, { children: [
      /* @__PURE__ */ jsxs14(SidebarGroup, { children: [
        /* @__PURE__ */ jsx28(SidebarGroupLabel, { children: "Actions" }),
        /* @__PURE__ */ jsx28(SidebarGroupContent, { children: /* @__PURE__ */ jsxs14(SidebarMenu, { children: [
          /* @__PURE__ */ jsx28(SidebarMenuItem, { className: "mb-1", children: /* @__PURE__ */ jsxs14(
            SidebarMenuButton,
            {
              isActive: currentPage === "chat",
              onClick: () => {
                onPageChange("chat");
                onNewChat();
              },
              children: [
                /* @__PURE__ */ jsx28(Edit2, { className: "h-4 w-4" }),
                "New Chat"
              ]
            }
          ) }),
          /* @__PURE__ */ jsx28(SidebarMenuItem, { className: "mb-1", children: /* @__PURE__ */ jsxs14(
            SidebarMenuButton,
            {
              isActive: currentPage === "agents",
              onClick: () => onPageChange("agents"),
              children: [
                /* @__PURE__ */ jsx28(Users, { className: "h-4 w-4" }),
                "Agents"
              ]
            }
          ) })
        ] }) })
      ] }),
      open && /* @__PURE__ */ jsxs14(SidebarGroup, { children: [
        /* @__PURE__ */ jsx28(SidebarGroupLabel, { children: "Conversations" }),
        /* @__PURE__ */ jsx28(SidebarGroupContent, { children: /* @__PURE__ */ jsx28(SidebarMenu, { children: threadsLoading ? /* @__PURE__ */ jsxs14(SidebarMenuItem, { children: [
          /* @__PURE__ */ jsx28(Loader22, { className: "h-4 w-4 animate-spin" }),
          /* @__PURE__ */ jsx28("span", { children: "Loading threads..." })
        ] }) : threads.length === 0 ? /* @__PURE__ */ jsx28(SidebarMenuItem, { children: "No conversations yet" }) : threads.map((thread) => /* @__PURE__ */ jsx28(
          ThreadItem,
          {
            thread,
            isActive: thread.id === selectedThreadId,
            onClick: () => onThreadSelect(thread.id),
            onDelete: () => onThreadDelete(thread.id),
            onRename: (newTitle) => onThreadRename(thread.id, newTitle)
          },
          thread.id
        )) }) }),
        /* @__PURE__ */ jsxs14(
          SidebarGroupAction,
          {
            onClick: handleRefresh,
            disabled: threadsLoading,
            title: "Refresh conversations",
            children: [
              /* @__PURE__ */ jsx28(RefreshCw2, { className: `${threadsLoading ? "animate-spin" : ""}` }),
              /* @__PURE__ */ jsx28("span", { className: "sr-only", children: "Refresh conversations" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx28(SidebarFooter, { children: /* @__PURE__ */ jsx28(SidebarMenu, { children: /* @__PURE__ */ jsx28(SidebarMenuItem, { children: /* @__PURE__ */ jsxs14(
      SidebarMenuButton,
      {
        onClick: () => window.open("https://github.com/your-repo/distri", "_blank"),
        title: "GitHub",
        children: [
          /* @__PURE__ */ jsx28(Github, {}),
          "Distri"
        ]
      }
    ) }) }) })
  ] });
}

// src/components/FullChat.tsx
import { jsx as jsx29, jsxs as jsxs15 } from "react/jsx-runtime";
var FullChat = ({
  agentId: initialAgentId,
  metadata,
  className = "",
  UserMessageComponent,
  AssistantMessageComponent,
  AssistantWithToolCallsComponent,
  PlanMessageComponent,
  showDebug = false,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
  onLogoClick,
  availableAgents,
  onAgentSelect
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState13(uuidv4());
  const [currentAgentId, setCurrentAgentId] = useState13(initialAgentId);
  const { threads, refetch: refetchThreads } = useThreads();
  const [currentPage, setCurrentPage] = useState13("chat");
  const [defaultOpen, setDefaultOpen] = useState13(true);
  const { agent, loading: agentLoading, error: agentError } = useAgent({ agentId: currentAgentId });
  const { theme } = useTheme();
  const currentThread = threads.find((t) => t.id === selectedThreadId);
  const { messages } = useChat({
    threadId: selectedThreadId,
    agent: agent || void 0
  });
  const threadHasStarted = messages.length > 0;
  useEffect11(() => {
    const savedState = localStorage.getItem("sidebar:state");
    if (savedState !== null) {
      setDefaultOpen(savedState === "true");
    }
  }, []);
  useEffect11(() => {
    if (currentThread?.agent_id && currentThread.agent_id !== currentAgentId) {
      setCurrentAgentId(currentThread.agent_id);
      onAgentSelect?.(currentThread.agent_id);
    }
  }, [currentThread?.agent_id, currentAgentId, onAgentSelect]);
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
  const handleAgentSelect = useCallback8((newAgentId) => {
    if (!threadHasStarted) {
      setCurrentAgentId(newAgentId);
      onAgentSelect?.(newAgentId);
    }
  }, [threadHasStarted, onAgentSelect]);
  const handleMessagesUpdate = useCallback8(() => {
    refetchThreads();
  }, [refetchThreads]);
  const renderMainContent = () => {
    if (currentPage === "agents") {
      return /* @__PURE__ */ jsx29(AgentsPage_default, { onStartChat: (agent2) => {
        setCurrentPage("chat");
        handleAgentSelect(agent2.id);
      } });
    }
    if (!agent) {
      if (agentLoading) return /* @__PURE__ */ jsx29("div", { children: "Loading agent..." });
      if (agentError) return /* @__PURE__ */ jsxs15("div", { children: [
        "Error loading agent: ",
        agentError.message
      ] });
      return /* @__PURE__ */ jsx29("div", { children: "No agent selected" });
    }
    return /* @__PURE__ */ jsx29(
      EmbeddableChat,
      {
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
        disableAgentSelection: threadHasStarted,
        onAgentSelect: handleAgentSelect,
        onMessagesUpdate: handleMessagesUpdate
      }
    );
  };
  return /* @__PURE__ */ jsx29("div", { className: `distri-chat ${className} h-full`, children: /* @__PURE__ */ jsxs15(
    SidebarProvider,
    {
      defaultOpen,
      style: {
        "--sidebar-width": "20rem",
        "--sidebar-width-mobile": "18rem"
      },
      children: [
        /* @__PURE__ */ jsx29(
          AppSidebar,
          {
            selectedThreadId,
            currentPage,
            onNewChat: handleNewChat,
            onThreadSelect: handleThreadSelect,
            onThreadDelete: handleThreadDelete,
            onThreadRename: (threadId, newTitle) => {
              console.log("Rename thread", threadId, "to", newTitle);
              refetchThreads();
            },
            onLogoClick,
            onPageChange: setCurrentPage
          }
        ),
        /* @__PURE__ */ jsxs15(SidebarInset, { children: [
          /* @__PURE__ */ jsx29("header", { className: "flex h-16 shrink-0 items-center gap-2 px-4 border-b", children: /* @__PURE__ */ jsxs15("div", { className: "flex items-center gap-2 flex-1", children: [
            /* @__PURE__ */ jsx29(SidebarTrigger, { className: "-ml-1" }),
            availableAgents && availableAgents.length > 0 && /* @__PURE__ */ jsx29("div", { className: "w-64", children: /* @__PURE__ */ jsx29(
              AgentSelect,
              {
                agents: availableAgents,
                selectedAgentId: currentAgentId,
                onAgentSelect: handleAgentSelect,
                placeholder: "Select an agent...",
                disabled: threadHasStarted
              }
            ) })
          ] }) }),
          /* @__PURE__ */ jsx29("main", { className: "flex-1 overflow-hidden", children: renderMainContent() })
        ] })
      ]
    }
  ) });
};
var FullChat_default = FullChat;

// src/components/ThemeToggle.tsx
import React24 from "react";
import { Moon, Sun } from "lucide-react";
import { jsx as jsx30, jsxs as jsxs16 } from "react/jsx-runtime";
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dropdownRef = React24.useRef(null);
  return /* @__PURE__ */ jsx30("div", { className: "relative", ref: dropdownRef, children: /* @__PURE__ */ jsxs16(
    "button",
    {
      onClick: () => setTheme(theme === "light" ? "dark" : "light"),
      className: "flex items-center justify-center w-9 h-9 rounded-md border bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
      children: [
        /* @__PURE__ */ jsx30(Sun, { className: "h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" }),
        /* @__PURE__ */ jsx30(Moon, { className: "absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" }),
        /* @__PURE__ */ jsx30("span", { className: "sr-only", children: "Toggle theme" })
      ]
    }
  ) });
}
export {
  AgentSelect,
  ApprovalToolCall,
  AssistantMessage,
  AssistantWithToolCalls,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ChatInput,
  DebugMessage,
  DialogRoot as Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DistriProvider,
  EmbeddableChat,
  FullChat_default as FullChat,
  Input,
  PlanMessage,
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
  ThemeToggle,
  ToastToolCall,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UserMessage,
  cn,
  extractTextFromMessage,
  registerTools,
  shouldDisplayMessage,
  useAgent,
  useAgents,
  useChat,
  useDistri,
  useSidebar,
  useTheme,
  useThreads,
  useToolCallState
};
