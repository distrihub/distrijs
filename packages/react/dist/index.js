"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  APPROVAL_REQUEST_TOOL_NAME: () => import_core4.APPROVAL_REQUEST_TOOL_NAME,
  Agent: () => import_core4.Agent,
  DistriClient: () => import_core4.DistriClient,
  DistriProvider: () => DistriProvider,
  createBuiltinApprovalHandler: () => createBuiltinApprovalHandler,
  createBuiltinToolHandlers: () => createBuiltinToolHandlers,
  useAgent: () => useAgent,
  useAgents: () => useAgents,
  useChat: () => useChat,
  useDistri: () => useDistri,
  useDistriClient: () => useDistriClient,
  useThreads: () => useThreads
});
module.exports = __toCommonJS(src_exports);

// src/DistriProvider.tsx
var import_react = require("react");
var import_core = require("@distri/core");
var import_jsx_runtime = require("react/jsx-runtime");
var DistriContext = (0, import_react.createContext)({
  client: null,
  error: null,
  isLoading: true
});
var debug = (config, ...args) => {
  if (config.debug) {
    console.log("[DistriProvider]", ...args);
  }
};
function DistriProvider({ config, children }) {
  const [client, setClient] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react.useState)(true);
  (0, import_react.useEffect)(() => {
    let currentClient = null;
    try {
      debug(config, "[DistriProvider] Initializing client with config:", config);
      currentClient = new import_core.DistriClient(config);
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
  }, [config.baseUrl, config.apiVersion, config.debug]);
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DistriContext.Provider, { value: contextValue, children });
}
function useDistri() {
  const context = (0, import_react.useContext)(DistriContext);
  if (!context) {
    throw new Error("useDistri must be used within a DistriProvider");
  }
  return context;
}
function useDistriClient() {
  const { client, error, isLoading } = useDistri();
  if (isLoading) {
    throw new Error("Distri client is still loading");
  }
  if (error) {
    throw new Error(`Distri client initialization failed: ${error.message}`);
  }
  if (!client) {
    throw new Error("Distri client is not initialized");
  }
  return client;
}

// src/useAgents.ts
var import_react2 = require("react");
function useAgents() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = (0, import_react2.useState)([]);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  const fetchAgents = (0, import_react2.useCallback)(async () => {
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
  const getAgent = (0, import_react2.useCallback)(async (agentId) => {
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
  (0, import_react2.useEffect)(() => {
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
var import_react3 = require("react");
var import_core2 = require("@distri/core");
function useChat({ agentId, contextId }) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [loading, setLoading] = (0, import_react3.useState)(false);
  const [error, setError] = (0, import_react3.useState)(null);
  const [messages, setMessages] = (0, import_react3.useState)([]);
  const [isStreaming, setIsStreaming] = (0, import_react3.useState)(false);
  const abortControllerRef = (0, import_react3.useRef)(null);
  const fetchMessages = (0, import_react3.useCallback)(async () => {
    if (!client || !contextId) {
      setMessages([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedMessages = await client.getThreadMessages(contextId);
      setMessages(fetchedMessages);
    } catch (err) {
      console.error("[useThreadMessages] Failed to fetch messages:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch messages"));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [client, contextId]);
  (0, import_react3.useEffect)(() => {
    if (!clientLoading && !clientError && contextId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [clientLoading, clientError, contextId, fetchMessages]);
  const sendMessage = (0, import_react3.useCallback)(async (input, configuration) => {
    if (!client) {
      setError(new Error("Client not available"));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const userMessage = import_core2.DistriClient.initMessage(input, "user", contextId);
      setMessages((prev) => [...prev, userMessage]);
      const params = import_core2.DistriClient.initMessageParams(userMessage, configuration);
      const result = await client.sendMessage(agentId, params);
      let message = void 0;
      if (result.kind === "message") {
        message = result;
      } else if (result.kind === "task") {
        message = result.status.message;
      }
      if (!message) {
        throw new Error("Invalid response format");
      }
      setMessages((prev) => {
        if (prev.find((msg) => msg.messageId === message.messageId)) {
          return prev.map((msg) => {
            if (msg.messageId === message.messageId) {
              return {
                ...msg,
                parts: [...msg.parts, ...message.parts]
              };
            }
            return msg;
          });
        } else {
          return [...prev, message];
        }
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error("Failed to send message"));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);
  const sendMessageStream = (0, import_react3.useCallback)(async (input, configuration) => {
    if (!client) {
      setError(new Error("Client not available"));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setIsStreaming(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const userMessage = import_core2.DistriClient.initMessage(input, "user", contextId);
      setMessages((prev) => [...prev, userMessage]);
      const params = import_core2.DistriClient.initMessageParams(userMessage, {
        blocking: false,
        acceptedOutputModes: ["text/plain"],
        ...configuration
      });
      setIsStreaming(true);
      const stream = await client.sendMessageStream(agentId, params);
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log("abort signal received");
          break;
        }
        let message = void 0;
        if (event.kind === "message") {
          message = event;
        }
        if (!message)
          continue;
        setMessages((prev) => {
          if (prev.find((msg) => msg.messageId === message.messageId)) {
            return prev.map((msg) => {
              if (msg.messageId === message.messageId) {
                return {
                  ...msg,
                  parts: [...msg.parts, ...message.parts]
                };
              }
              return msg;
            });
          } else {
            return [...prev, message];
          }
        });
      }
      setIsStreaming(false);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.log("error", err);
      setError(err instanceof Error ? err : new Error("Failed to stream message"));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [client, agentId]);
  const clearMessages = (0, import_react3.useCallback)(() => {
    setMessages([]);
  }, []);
  (0, import_react3.useEffect)(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  const abort = (0, import_react3.useCallback)(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  return {
    loading: loading || clientLoading,
    error: error || clientError,
    messages,
    isStreaming,
    sendMessage,
    sendMessageStream,
    clearMessages,
    refreshMessages: fetchMessages,
    abort
  };
}

// src/useThreads.ts
var import_react4 = require("react");
function useThreads() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = (0, import_react4.useState)([]);
  const [loading, setLoading] = (0, import_react4.useState)(true);
  const [error, setError] = (0, import_react4.useState)(null);
  const fetchThreads = (0, import_react4.useCallback)(async () => {
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
  const fetchThread = (0, import_react4.useCallback)(async (threadId) => {
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
  const deleteThread = (0, import_react4.useCallback)(async (threadId) => {
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
  const updateThread = (0, import_react4.useCallback)(async (threadId, localId) => {
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
  (0, import_react4.useEffect)(() => {
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

// src/useAgent.ts
var import_react5 = __toESM(require("react"));
var import_core3 = require("@distri/core");
function useAgent({
  agentId,
  autoCreateAgent = true,
  defaultExternalToolHandlers,
  defaultApprovalHandler
}) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agent, setAgent] = (0, import_react5.useState)(null);
  const [loading, setLoading] = (0, import_react5.useState)(false);
  const [error, setError] = (0, import_react5.useState)(null);
  const agentRef = (0, import_react5.useRef)(null);
  const initializeAgent = (0, import_react5.useCallback)(async () => {
    if (!client || !agentId || agentRef.current)
      return;
    try {
      setLoading(true);
      setError(null);
      const newAgent = await import_core3.Agent.create(agentId, client);
      agentRef.current = newAgent;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create agent"));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);
  import_react5.default.useEffect(() => {
    if (!clientLoading && !clientError && autoCreateAgent && client) {
      initializeAgent();
    }
  }, [clientLoading, clientError, autoCreateAgent, client, initializeAgent]);
  const invoke = (0, import_react5.useCallback)(async (input, config = {}) => {
    if (!agent) {
      throw new Error("Agent not initialized");
    }
    const finalConfig = {
      ...config,
      externalToolHandlers: config.externalToolHandlers || defaultExternalToolHandlers,
      approvalHandler: config.approvalHandler || defaultApprovalHandler
    };
    return agent.invoke(input, finalConfig);
  }, [agent, defaultExternalToolHandlers, defaultApprovalHandler]);
  const invokeWithHandlers = (0, import_react5.useCallback)(async (input, handlers, approvalHandler, config = {}) => {
    if (!agent) {
      throw new Error("Agent not initialized");
    }
    const result = await agent.invoke(input, {
      ...config,
      stream: false,
      externalToolHandlers: handlers || defaultExternalToolHandlers,
      approvalHandler: approvalHandler || defaultApprovalHandler
    });
    return result;
  }, [agent, defaultExternalToolHandlers, defaultApprovalHandler]);
  return {
    agent,
    loading: loading || clientLoading,
    error: error || clientError,
    invoke,
    invokeWithHandlers
  };
}
var createBuiltinToolHandlers = () => ({
  // File upload handler
  file_upload: async (toolCall) => {
    const input = JSON.parse(toolCall.input);
    console.log("File upload requested:", input);
    return { success: true, message: "File upload simulated" };
  },
  // Input request handler
  input_request: async (toolCall) => {
    const input = JSON.parse(toolCall.input);
    const userInput = prompt(input.prompt || "Please provide input:");
    return { input: userInput };
  },
  // Email send handler
  email_send: async (toolCall) => {
    const input = JSON.parse(toolCall.input);
    console.log("Email send requested:", input);
    return { success: true, message: "Email sent successfully" };
  }
});
var createBuiltinApprovalHandler = () => {
  return async (toolCalls, reason) => {
    const toolNames = toolCalls.map((tc) => tc.tool_name).join(", ");
    const message = reason ? `${reason}

Tools to execute: ${toolNames}

Do you approve?` : `Execute tools: ${toolNames}?`;
    return confirm(message);
  };
};

// src/index.ts
var import_core4 = require("@distri/core");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  APPROVAL_REQUEST_TOOL_NAME,
  Agent,
  DistriClient,
  DistriProvider,
  createBuiltinApprovalHandler,
  createBuiltinToolHandlers,
  useAgent,
  useAgents,
  useChat,
  useDistri,
  useDistriClient,
  useThreads
});
//# sourceMappingURL=index.js.map