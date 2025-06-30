// src/DistriProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { DistriClient } from "@distri/core";
import { jsx } from "react/jsx-runtime";
var DistriContext = createContext({
  client: null,
  error: null,
  isLoading: true
});
function DistriProvider({ config, children }) {
  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let currentClient = null;
    try {
      console.log("[DistriProvider] Initializing client with config:", config);
      currentClient = new DistriClient(config);
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
  return /* @__PURE__ */ jsx(DistriContext.Provider, { value: contextValue, children });
}
function useDistri() {
  const context = useContext(DistriContext);
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
import { useState as useState2, useEffect as useEffect2, useCallback } from "react";
function useAgents() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = useState2([]);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2(null);
  const fetchAgents = useCallback(async () => {
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
  const getAgent = useCallback(async (agentId) => {
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
  useEffect2(() => {
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
import { useState as useState3, useEffect as useEffect3, useCallback as useCallback2, useRef } from "react";
import {
  DistriClient as DistriClient2
} from "@distri/core";
function useTask({ agentId, autoSubscribe = true }) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [task, setTask] = useState3(null);
  const [loading, setLoading] = useState3(false);
  const [error, setError] = useState3(null);
  const [streamingText, setStreamingText] = useState3("");
  const [isStreaming, setIsStreaming] = useState3(false);
  const eventSourceRef = useRef(null);
  const createTask = useCallback2(async (message, configuration) => {
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
  const sendMessage = useCallback2(async (text, configuration) => {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const message = DistriClient2.createMessage(messageId, text, "user");
    await createTask(message, configuration);
  }, [createTask]);
  const getTask = useCallback2(async (taskId) => {
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
  const clearTask = useCallback2(() => {
    setTask(null);
    setStreamingText("");
    setIsStreaming(false);
    setError(null);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);
  const subscribeToAgent = useCallback2(() => {
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
          setTask((prev) => prev ? { ...prev, status: event.status } : null);
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
  useEffect3(() => {
    if (autoSubscribe && agentId && client && !clientLoading) {
      const cleanup = subscribeToAgent();
      return cleanup;
    }
  }, [autoSubscribe, agentId, client, clientLoading, subscribeToAgent]);
  useEffect3(() => {
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
export {
  DistriProvider,
  useAgents,
  useDistri,
  useDistriClient,
  useTask
};
//# sourceMappingURL=index.mjs.map