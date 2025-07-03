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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
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
var import_client = require("@a2a-js/sdk/client");

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
    this.agentClients = /* @__PURE__ */ new Map();
    this.agentCards = /* @__PURE__ */ new Map();
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ""),
      apiVersion: config.apiVersion || "v1",
      timeout: config.timeout || 3e4,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1e3,
      debug: config.debug || false,
      headers: config.headers || {}
    };
    this.debug("DistriClient initialized with config:", this.config);
  }
  /**
   * Get all available agents from the Distri server
   */
  async getAgents() {
    try {
      const response = await this.fetch(`/api/${this.config.apiVersion}/agents`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch agents: ${response.statusText}`, response.status);
      }
      const agentCards = await response.json();
      agentCards.forEach((card) => {
        this.agentCards.set(card.name, card);
      });
      const distriAgents = agentCards.map((card) => ({
        id: card.name,
        name: card.name,
        description: card.description,
        status: "online",
        card
      }));
      return distriAgents;
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
      const response = await this.fetch(`/api/${this.config.apiVersion}/agents/${agentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(`Agent not found: ${agentId}`, 404);
        }
        throw new ApiError(`Failed to fetch agent: ${response.statusText}`, response.status);
      }
      const card = await response.json();
      this.agentCards.set(agentId, card);
      return {
        id: card.name,
        name: card.name,
        description: card.description,
        status: "online",
        card
      };
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
      const agentCard = this.agentCards.get(agentId);
      if (!agentCard) {
        throw new DistriError(`Agent card not found for ${agentId}. Call getAgent() first.`, "AGENT_NOT_FOUND");
      }
      const agentUrl = agentCard.url || `${this.config.baseUrl}/api/${this.config.apiVersion}/agents/${agentId}`;
      const client = new import_client.A2AClient(agentUrl);
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
      const stream = client.sendMessageStream(params);
      for await (const event of stream) {
        this.debug(`Stream event from ${agentId}:`, event);
        if (event.kind === "status-update") {
          this.emit("task_status_update", event);
        } else if (event.kind === "artifact-update") {
          this.emit("task_artifact_update", event);
        } else if (event.kind === "task") {
          this.emit("task_created", event);
        } else if (event.kind === "message") {
          this.emit("message_received", event);
        }
        yield event;
      }
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
      const response = await this.fetch(`/api/${this.config.apiVersion}/threads`);
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
  /**
   * Get thread messages
   */
  async getThreadMessages(threadId) {
    try {
      const response = await this.fetch(`/api/${this.config.apiVersion}/threads/${threadId}/messages`);
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
   * Close all connections
   */
  disconnect() {
    this.agentClients.clear();
    this.agentCards.clear();
    this.removeAllListeners();
    this.debug("DistriClient disconnected");
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
  static createMessage(messageId, text, role = "user", contextId, taskId) {
    return {
      messageId,
      role,
      parts: [{ kind: "text", text }],
      contextId,
      taskId,
      kind: "message"
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
        blocking: false,
        // Default to non-blocking for streaming
        ...configuration
      }
    };
  }
};

// src/index.ts
__reExport(src_exports, require("@a2a-js/sdk/client"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  A2AProtocolError,
  ApiError,
  ConnectionError,
  DistriClient,
  DistriError,
  ...require("@a2a-js/sdk/client")
});
//# sourceMappingURL=index.js.map