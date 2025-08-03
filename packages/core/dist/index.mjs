var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/types.ts
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
var ConnectionError = class extends DistriError {
  constructor(message, details) {
    super(message, "CONNECTION_ERROR", details);
    this.name = "ConnectionError";
  }
};
function isDistriMessage(event) {
  return "id" in event && "role" in event && "parts" in event;
}
function isDistriEvent(event) {
  return "type" in event && "data" in event;
}
function isDistriPlan(event) {
  return "steps" in event && Array.isArray(event.steps);
}
function isDistriArtifact(event) {
  return "type" in event && "timestamp" in event && "id" in event;
}

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

// src/encoder.ts
function convertA2AMessageToDistri(a2aMessage) {
  const role = a2aMessage.role === "agent" ? "assistant" : "user";
  return {
    id: a2aMessage.messageId,
    role,
    parts: a2aMessage.parts.map(convertA2APartToDistri),
    created_at: a2aMessage.createdAt
  };
}
function convertA2AStatusUpdateToDistri(statusUpdate) {
  if (!statusUpdate.metadata || !statusUpdate.metadata.type) {
    return null;
  }
  const metadata = statusUpdate.metadata;
  switch (metadata.type) {
    case "run_started":
      return {
        type: "run_started",
        data: {}
      };
    case "run_finished":
      return {
        type: "run_finished",
        data: {}
      };
    case "plan_started":
      return {
        type: "plan_started",
        data: {
          initial_plan: metadata.initial_plan
        }
      };
    case "plan_finished":
      return {
        type: "plan_finished",
        data: {
          total_steps: metadata.total_steps
        }
      };
    case "step_started":
      return {
        type: "step_started",
        data: {
          step_id: metadata.step_id,
          step_title: metadata.step_title || "Processing",
          step_index: metadata.step_index || 0
        }
      };
    case "step_completed":
      return {
        type: "step_completed",
        data: {
          step_id: metadata.step_id,
          step_title: metadata.step_title || "Processing",
          step_index: metadata.step_index || 0
        }
      };
    case "tool_execution_start":
      return {
        type: "tool_call_start",
        data: {
          tool_call_id: metadata.tool_call_id,
          tool_call_name: metadata.tool_call_name || "Tool",
          parent_message_id: statusUpdate.taskId,
          is_external: true
        }
      };
    case "tool_execution_end":
      return {
        type: "tool_call_end",
        data: {
          tool_call_id: metadata.tool_call_id
        }
      };
    case "text_message_start":
      return {
        type: "text_message_start",
        data: {
          message_id: metadata.message_id,
          role: metadata.role === "assistant" ? "assistant" : "user"
        }
      };
    case "text_message_content":
      return {
        type: "text_message_content",
        data: {
          message_id: metadata.message_id,
          delta: metadata.delta || ""
        }
      };
    case "text_message_end":
      return {
        type: "text_message_end",
        data: {
          message_id: metadata.message_id
        }
      };
    default:
      console.warn(`Unhandled status update metadata type: ${metadata.type}`, metadata);
      return {
        type: "run_started",
        data: { metadata }
      };
  }
}
function convertA2AArtifactToDistri(artifact) {
  if (!artifact || !artifact.parts || !Array.isArray(artifact.parts)) {
    return null;
  }
  const part = artifact.parts[0];
  if (!part || part.kind !== "data" || !part.data) {
    return null;
  }
  const data = part.data;
  if (data.type === "llm_response") {
    const hasContent = data.content && data.content.trim() !== "";
    const hasToolCalls = data.tool_calls && Array.isArray(data.tool_calls) && data.tool_calls.length > 0;
    if (hasToolCalls) {
      const executionResult2 = {
        id: data.id || artifact.artifactId,
        type: "llm_response",
        timestamp: data.timestamp || data.created_at || Date.now(),
        content: data.content?.trim() || "",
        tool_calls: data.tool_calls,
        step_id: data.step_id,
        success: data.success,
        rejected: data.rejected,
        reason: data.reason
      };
      return executionResult2;
    } else {
      const parts = [];
      if (hasContent) {
        parts.push({ type: "text", text: data.content });
      }
      const distriMessage = {
        id: artifact.artifactId,
        role: "assistant",
        parts,
        created_at: data.timestamp || data.created_at || (/* @__PURE__ */ new Date()).toISOString()
      };
      return distriMessage;
    }
  }
  if (data.type === "tool_results") {
    const executionResult2 = {
      id: data.id || artifact.artifactId,
      type: "tool_results",
      timestamp: data.timestamp || data.created_at || Date.now(),
      results: data.results || [],
      step_id: data.step_id,
      success: data.success,
      rejected: data.rejected,
      reason: data.reason
    };
    return executionResult2;
  }
  const executionResult = {
    id: artifact.artifactId,
    type: "artifact",
    timestamp: Date.now(),
    data,
    artifactId: artifact.artifactId,
    name: artifact.name || "",
    description: artifact.description || null
  };
  return executionResult;
}
function decodeA2AStreamEvent(event) {
  if (event.artifactId && event.parts) {
    return convertA2AArtifactToDistri(event);
  }
  if (event.kind === "message") {
    return convertA2AMessageToDistri(event);
  }
  if (event.kind === "status-update") {
    return convertA2AStatusUpdateToDistri(event);
  }
  if (event.kind === "artifact-update") {
    return convertA2AArtifactToDistri(event);
  }
  return null;
}
function processA2AStreamData(streamData) {
  const results = [];
  for (const item of streamData) {
    const converted = decodeA2AStreamEvent(item);
    if (converted) {
      results.push(converted);
    }
  }
  return results;
}
function processA2AMessagesData(data) {
  const results = [];
  for (const item of data) {
    if (item.kind === "message") {
      const distriMessage = convertA2AMessageToDistri(item);
      results.push(distriMessage);
    }
  }
  return results;
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
function extractTextFromDistriMessage(message) {
  return message.parts.filter((part) => part.type === "text").map((part) => part.text).join("\n");
}
function extractToolCallsFromDistriMessage(message) {
  return message.parts.filter((part) => part.type === "tool_call").map((part) => part.tool_call);
}
function extractToolResultsFromDistriMessage(message) {
  return message.parts.filter((part) => part.type === "tool_result").map((part) => part.tool_result);
}

// src/distri-client.ts
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
      console.error(error);
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
    const contextMetadata = context.getMetadata?.() || {};
    const params = {
      message: a2aMessage,
      metadata: contextMetadata
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
    const contextMetadata = context.getMetadata?.() || {};
    return {
      message: a2aMessage,
      metadata: contextMetadata
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

// src/agent.ts
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
        const converted = decodeA2AStreamEvent(event);
        if (converted) {
          yield converted;
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
  static async create(agentIdOrDef, client) {
    const agentDefinition = typeof agentIdOrDef === "string" ? await client.getAgent(agentIdOrDef) : agentIdOrDef;
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
export {
  A2AProtocolError,
  Agent,
  ApiError,
  ConnectionError,
  DistriClient,
  DistriError,
  convertA2AArtifactToDistri,
  convertA2AMessageToDistri,
  convertA2APartToDistri,
  convertA2AStatusUpdateToDistri,
  convertDistriMessageToA2A,
  convertDistriPartToA2A,
  decodeA2AStreamEvent,
  extractTextFromDistriMessage,
  extractToolCallsFromDistriMessage,
  extractToolResultsFromDistriMessage,
  isDistriArtifact,
  isDistriEvent,
  isDistriMessage,
  isDistriPlan,
  processA2AMessagesData,
  processA2AStreamData,
  uuidv4
};
//# sourceMappingURL=index.mjs.map