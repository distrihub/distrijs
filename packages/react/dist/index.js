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
  DistriProvider: () => DistriProvider,
  useAgents: () => useAgents,
  useDistri: () => useDistri,
  useDistriClient: () => useDistriClient,
  useTask: () => useTask,
  useThreadMessages: () => useThreadMessages,
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
function DistriProvider({ config, children }) {
  const [client, setClient] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react.useState)(true);
  (0, import_react.useEffect)(() => {
    let currentClient = null;
    try {
      console.log("[DistriProvider] Initializing client with config:", config);
      currentClient = new import_core.DistriClient(config);
      setClient(currentClient);
      setError(null);
      setIsLoading(false);
      console.log("[DistriProvider] Client initialized successfully");
    } catch (err) {
      console.error("[DistriProvider] Failed to initialize client:", err);
      const error2 = err instanceof Error ? err : new Error("Failed to initialize client");
      setError(error2);
      setClient(null);
      setIsLoading(false);
    }
    return () => {
      console.log("[DistriProvider] Cleaning up client");
      if (currentClient) {
        currentClient.disconnect();
      }
    };
  }, [config.baseUrl, config.apiVersion, config.debug]);
  const contextValue = {
    client,
    error,
    isLoading
  };
  if (error) {
    console.error("[DistriProvider] Rendering error state:", error.message);
  }
  if (isLoading) {
    console.log("[DistriProvider] Rendering loading state");
  }
  if (client) {
    console.log("[DistriProvider] Rendering with client available");
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

// src/useTask.ts
var import_react3 = require("react");
var import_core2 = require("@distri/core");
function useTask({ agentId, autoSubscribe = true }) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [task, setTask] = (0, import_react3.useState)(null);
  const [loading, setLoading] = (0, import_react3.useState)(false);
  const [error, setError] = (0, import_react3.useState)(null);
  const [messages, setMessages] = (0, import_react3.useState)([]);
  const [isStreaming, setIsStreaming] = (0, import_react3.useState)(false);
  const abortControllerRef = (0, import_react3.useRef)(null);
  const sendMessage = (0, import_react3.useCallback)(async (text, configuration) => {
    if (!client) {
      setError(new Error("Client not available"));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const message = import_core2.DistriClient.createMessage(messageId, text, "user");
      setMessages((prev) => [...prev, message]);
      const params = import_core2.DistriClient.createMessageParams(message, configuration);
      const result = await client.sendMessage(agentId, params);
      if (result.kind === "task") {
        setTask(result);
      } else if (result.kind === "message") {
        setMessages((prev) => [...prev, result]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to send message"));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);
  const sendMessageStream = (0, import_react3.useCallback)(async (text, configuration) => {
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
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const message = import_core2.DistriClient.createMessage(messageId, text, "user");
      setMessages((prev) => [...prev, message]);
      const params = import_core2.DistriClient.createMessageParams(message, {
        blocking: false,
        acceptedOutputModes: ["text/plain"],
        ...configuration
      });
      const stream = client.sendMessageStream(agentId, params);
      let currentMessage = null;
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        if (event.kind === "task") {
          setTask(event);
        } else if (event.kind === "status-update") {
          const statusEvent = event;
          if (statusEvent.status.message) {
            currentMessage = statusEvent.status.message;
            setMessages((prev) => {
              const existing = prev.find((m) => m.messageId === currentMessage.messageId);
              if (existing) {
                return prev.map((m) => m.messageId === currentMessage.messageId ? currentMessage : m);
              } else {
                return [...prev, currentMessage];
              }
            });
          }
          if (statusEvent.final) {
            setIsStreaming(false);
            break;
          }
        } else if (event.kind === "artifact-update") {
          const artifactEvent = event;
          console.log("Artifact update:", artifactEvent);
        } else if (event.kind === "message") {
          const messageEvent = event;
          setMessages((prev) => {
            const existing = prev.find((m) => m.messageId === messageEvent.messageId);
            if (existing) {
              return prev.map((m) => m.messageId === messageEvent.messageId ? messageEvent : m);
            } else {
              return [...prev, messageEvent];
            }
          });
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err : new Error("Failed to stream message"));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [client, agentId]);
  const getTask = (0, import_react3.useCallback)(async (taskId) => {
    if (!client) {
      setError(new Error("Client not available"));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedTask = await client.getTask(agentId, taskId);
      setTask(fetchedTask);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch task"));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);
  const clearTask = (0, import_react3.useCallback)(() => {
    setTask(null);
    setError(null);
    setIsStreaming(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
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
  return {
    task,
    loading: loading || clientLoading,
    error: error || clientError,
    messages,
    isStreaming,
    sendMessage,
    sendMessageStream,
    getTask,
    clearTask,
    clearMessages
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
  const createThread = (0, import_react4.useCallback)((agentId, title) => {
    const newThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      agent_id: agentId,
      agent_name: agentId,
      // Will be updated when we have agent info
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      message_count: 0,
      last_message: void 0
    };
    setThreads((prev) => [newThread, ...prev]);
    return newThread;
  }, []);
  const deleteThread = (0, import_react4.useCallback)(async (threadId) => {
    if (!client) {
      throw new Error("Client not available");
    }
    try {
      const response = await fetch(`${client.baseUrl}/api/v1/threads/${threadId}`, {
        method: "DELETE"
      });
      setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
    } catch (err) {
      setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
      console.warn("Failed to delete thread from server, but removed locally:", err);
    }
  }, [client]);
  const updateThread = (0, import_react4.useCallback)(async (threadId) => {
    if (!client) {
      return;
    }
    try {
      const response = await fetch(`${client.baseUrl}/api/v1/threads/${threadId}`);
      if (response.ok) {
        const updatedThread = await response.json();
        setThreads(
          (prev) => prev.map(
            (thread) => thread.id === threadId ? updatedThread : thread
          )
        );
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
    createThread,
    deleteThread,
    updateThread
  };
}
function useThreadMessages({ threadId }) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [messages, setMessages] = (0, import_react4.useState)([]);
  const [loading, setLoading] = (0, import_react4.useState)(false);
  const [error, setError] = (0, import_react4.useState)(null);
  const fetchMessages = (0, import_react4.useCallback)(async () => {
    if (!client || !threadId) {
      setMessages([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedMessages = await client.getThreadMessages(threadId);
      setMessages(fetchedMessages);
    } catch (err) {
      console.error("[useThreadMessages] Failed to fetch messages:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch messages"));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [client, threadId]);
  (0, import_react4.useEffect)(() => {
    if (!clientLoading && !clientError && threadId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [clientLoading, clientError, threadId, fetchMessages]);
  return {
    messages,
    loading: loading || clientLoading,
    error: error || clientError,
    refetch: fetchMessages
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DistriProvider,
  useAgents,
  useDistri,
  useDistriClient,
  useTask,
  useThreadMessages,
  useThreads
});
//# sourceMappingURL=index.js.map