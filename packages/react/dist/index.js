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
  useTask: () => useTask
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
  const getAgent = (0, import_react2.useCallback)(async (agentUrl) => {
    if (!client) {
      throw new Error("Client not available");
    }
    try {
      const agent = await client.getAgent(agentUrl);
      setAgents((prev) => prev.map((a) => a.url === agentUrl ? agent : a));
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
  const [streamingText, setStreamingText] = (0, import_react3.useState)("");
  const [isStreaming, setIsStreaming] = (0, import_react3.useState)(false);
  const eventSourceRef = (0, import_react3.useRef)(null);
  const createTask = (0, import_react3.useCallback)(async (message, configuration) => {
    if (!client) {
      setError(new Error("Client not available"));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setStreamingText("");
      setIsStreaming(true);
      const request = {
        agentId,
        message,
        configuration
      };
      const response = await client.createTask(request);
      const fullTask = await client.getTask(response.taskId);
      setTask(fullTask);
      if (autoSubscribe) {
        subscribeToAgent();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create task"));
      setIsStreaming(false);
    } finally {
      setLoading(false);
    }
  }, [client, agentId, autoSubscribe]);
  const sendMessage = (0, import_react3.useCallback)(async (text, configuration) => {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const message = import_core2.DistriClient.createMessage(messageId, text, "user");
    await createTask(message, configuration);
  }, [createTask]);
  const getTask = (0, import_react3.useCallback)(async (taskId) => {
    if (!client) {
      setError(new Error("Client not available"));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedTask = await client.getTask(taskId);
      setTask(fetchedTask);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch task"));
    } finally {
      setLoading(false);
    }
  }, [client]);
  const clearTask = (0, import_react3.useCallback)(() => {
    setTask(null);
    setStreamingText("");
    setIsStreaming(false);
    setError(null);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);
  const subscribeToAgent = (0, import_react3.useCallback)(() => {
    if (!client || eventSourceRef.current) {
      return;
    }
    try {
      const eventSource = client.subscribeToAgent(agentId);
      eventSourceRef.current = eventSource;
      const handleTextDelta = (event) => {
        if (task && event.task_id === task.id) {
          setStreamingText((prev) => prev + event.delta);
        }
      };
      const handleTaskStatusChanged = (event) => {
        if (task && event.task_id === task.id) {
          const newStatus = {
            state: event.status,
            // Type assertion for the status
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
          setTask((prev) => prev ? { ...prev, status: newStatus } : null);
          if (event.status === "completed" || event.status === "failed" || event.status === "canceled") {
            setIsStreaming(false);
          }
        }
      };
      const handleTaskCompleted = (event) => {
        if (task && event.task_id === task.id) {
          setIsStreaming(false);
          getTask(event.task_id);
        }
      };
      const handleTaskError = (event) => {
        if (task && event.task_id === task.id) {
          setError(new Error(event.error));
          setIsStreaming(false);
        }
      };
      client.on("text_delta", handleTextDelta);
      client.on("task_status_changed", handleTaskStatusChanged);
      client.on("task_completed", handleTaskCompleted);
      client.on("task_error", handleTaskError);
      const cleanup = () => {
        client.off("text_delta", handleTextDelta);
        client.off("task_status_changed", handleTaskStatusChanged);
        client.off("task_completed", handleTaskCompleted);
        client.off("task_error", handleTaskError);
      };
      return cleanup;
    } catch (err) {
      console.warn("Failed to subscribe to agent events:", err);
    }
  }, [client, agentId, task, getTask]);
  (0, import_react3.useEffect)(() => {
    if (autoSubscribe && agentId && client && !clientLoading) {
      const cleanup = subscribeToAgent();
      return cleanup;
    }
  }, [autoSubscribe, agentId, client, clientLoading, subscribeToAgent]);
  (0, import_react3.useEffect)(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);
  return {
    task,
    loading: loading || clientLoading,
    error: error || clientError,
    streamingText,
    isStreaming,
    sendMessage,
    createTask,
    getTask,
    clearTask
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DistriProvider,
  useAgents,
  useDistri,
  useDistriClient,
  useTask
});
//# sourceMappingURL=index.js.map