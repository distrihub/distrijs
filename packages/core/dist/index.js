"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  A2AProtocolError: () => A2AProtocolError,
  ApiError: () => ApiError,
  ConnectionError: () => ConnectionError,
  DistriClient: () => DistriClient,
  DistriError: () => DistriError
});
module.exports = __toCommonJS(src_exports);

// src/distri-client.ts
var import_eventemitter3 = require("eventemitter3");

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

// src/distri-client.ts
var DistriClient = class extends import_eventemitter3.EventEmitter {
  constructor(config) {
    super();
    this.eventSources = /* @__PURE__ */ new Map();
    this.requestIdCounter = 0;
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ""),
      apiVersion: config.apiVersion || "v1",
      timeout: config.timeout || 3e4,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1e3,
      debug: config.debug || false,
      headers: config.headers || {}
    };
  }
  /**
   * Get all available agents
   */
  async getAgents() {
    try {
      const response = await this.fetch(`/api/${this.config.apiVersion}/agents`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch agents: ${response.statusText}`, response.status);
      }
      const data = await response.json();
      return data.agents;
    } catch (error) {
      if (error instanceof ApiError)
        throw error;
      throw new DistriError("Failed to fetch agents", "FETCH_ERROR", error);
    }
  }
  /**
   * Get specific agent card
   */
  async getAgent(agentId) {
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
      if (error instanceof ApiError)
        throw error;
      throw new DistriError(`Failed to fetch agent ${agentId}`, "FETCH_ERROR", error);
    }
  }
  /**
   * Send a message to an agent using JSON-RPC
   */
  async sendMessage(agentId, params) {
    const request = {
      jsonrpc: "2.0",
      method: "message/send",
      params,
      id: this.generateRequestId()
    };
    return this.sendJsonRpcRequest(agentId, request);
  }
  /**
   * Send a streaming message to an agent
   */
  async sendStreamingMessage(agentId, params) {
    const request = {
      jsonrpc: "2.0",
      method: "message/send_streaming",
      params,
      id: this.generateRequestId()
    };
    return this.sendJsonRpcRequest(agentId, request);
  }
  /**
   * Create a task (convenience method)
   */
  async createTask(request) {
    const params = {
      message: request.message,
      configuration: request.configuration
    };
    const response = await this.sendMessage(request.agentId, params);
    if (response.error) {
      throw new A2AProtocolError(response.error.message, response.error);
    }
    return response.result;
  }
  /**
   * Get task details
   */
  async getTask(taskId) {
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
      if (error instanceof ApiError)
        throw error;
      throw new DistriError(`Failed to fetch task ${taskId}`, "FETCH_ERROR", error);
    }
  }
  /**
   * Cancel a task
   */
  async cancelTask(taskId) {
    const request = {
      jsonrpc: "2.0",
      method: "task/cancel",
      params: { taskId },
      id: this.generateRequestId()
    };
    throw new DistriError("Task cancellation not yet implemented", "NOT_IMPLEMENTED");
  }
  /**
   * Subscribe to agent events via Server-Sent Events
   */
  subscribeToAgent(agentId, options) {
    const existingSource = this.eventSources.get(agentId);
    if (existingSource) {
      return existingSource;
    }
    const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/agents/${agentId}/events`;
    const eventSource = new EventSource(url);
    eventSource.onopen = () => {
      this.debug(`Connected to agent ${agentId} event stream`);
      this.emit("agent_stream_connected", agentId);
    };
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleEvent(data);
      } catch (error) {
        this.debug("Failed to parse SSE event:", error);
      }
    };
    eventSource.onerror = (error) => {
      this.debug(`SSE error for agent ${agentId}:`, error);
      this.emit("agent_stream_error", agentId, error);
    };
    this.eventSources.set(agentId, eventSource);
    return eventSource;
  }
  /**
   * Subscribe to task events
   */
  subscribeToTask(taskId) {
    this.emit("task_subscribed", taskId);
  }
  /**
   * Unsubscribe from agent events
   */
  unsubscribeFromAgent(agentId) {
    const eventSource = this.eventSources.get(agentId);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(agentId);
      this.emit("agent_stream_disconnected", agentId);
    }
  }
  /**
   * Close all connections
   */
  disconnect() {
    for (const [agentId, eventSource] of this.eventSources) {
      eventSource.close();
    }
    this.eventSources.clear();
  }
  /**
   * Send a JSON-RPC request to an agent
   */
  async sendJsonRpcRequest(agentId, request) {
    try {
      const response = await this.fetch(`/api/${this.config.apiVersion}/agents/${agentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.config.headers
        },
        body: JSON.stringify(request)
      });
      if (!response.ok) {
        throw new ApiError(`JSON-RPC request failed: ${response.statusText}`, response.status);
      }
      const jsonResponse = await response.json();
      if (jsonResponse.error) {
        throw new A2AProtocolError(jsonResponse.error.message, jsonResponse.error);
      }
      return jsonResponse;
    } catch (error) {
      if (error instanceof ApiError || error instanceof A2AProtocolError) {
        throw error;
      }
      throw new DistriError("JSON-RPC request failed", "RPC_ERROR", error);
    }
  }
  /**
   * Handle incoming SSE events
   */
  handleEvent(event) {
    this.debug("Received event:", event);
    switch (event.type) {
      case "task_status_changed":
        this.emit("task_status_changed", event);
        break;
      case "text_delta":
        this.emit("text_delta", event);
        break;
      case "task_completed":
        this.emit("task_completed", event);
        break;
      case "task_error":
        this.emit("task_error", event);
        break;
      case "task_canceled":
        this.emit("task_canceled", event);
        break;
      case "agent_status_changed":
        this.emit("agent_status_changed", event);
        break;
      default:
        this.emit("event", event);
    }
  }
  /**
   * Enhanced fetch with retry logic
   */
  async fetch(path, options) {
    const url = `${this.config.baseUrl}${path}`;
    let lastError;
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
    throw lastError;
  }
  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req-${Date.now()}-${++this.requestIdCounter}`;
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
  static createMessage(messageId, text, role = "user", contextId) {
    return {
      messageId,
      role,
      parts: [{ kind: "text", text }],
      contextId,
      timestamp: Date.now()
    };
  }
  /**
   * Helper method to create message send parameters
   */
  static createMessageParams(message, configuration) {
    return {
      message,
      configuration: {
        acceptedOutputModes: ["text/plain"],
        blocking: true,
        ...configuration
      }
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  A2AProtocolError,
  ApiError,
  ConnectionError,
  DistriClient,
  DistriError
});
//# sourceMappingURL=index.js.map