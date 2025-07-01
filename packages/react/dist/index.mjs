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
  const [messages, setMessages] = useState3([]);
  const [isStreaming, setIsStreaming] = useState3(false);
  const abortControllerRef = useRef(null);
  const sendMessage = useCallback2(async (text, configuration) => {
    if (!client) {
      setError(new Error("Client not available"));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const message = DistriClient2.createMessage(messageId, text, "user");
      setMessages((prev) => [...prev, message]);
      const params = DistriClient2.createMessageParams(message, configuration);
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
  const sendMessageStream = useCallback2(async (text, configuration) => {
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
      const message = DistriClient2.createMessage(messageId, text, "user");
      setMessages((prev) => [...prev, message]);
      const params = DistriClient2.createMessageParams(message, {
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
  const getTask = useCallback2(async (taskId) => {
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
  const clearTask = useCallback2(() => {
    setTask(null);
    setError(null);
    setIsStreaming(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  const clearMessages = useCallback2(() => {
    setMessages([]);
  }, []);
  useEffect3(() => {
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
import { useState as useState4, useEffect as useEffect4, useCallback as useCallback3 } from "react";
function useThreads() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = useState4([]);
  const [loading, setLoading] = useState4(true);
  const [error, setError] = useState4(null);
  const fetchThreads = useCallback3(async () => {
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
  const createThread = useCallback3((agentId, title) => {
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
  const deleteThread = useCallback3(async (threadId) => {
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
  const updateThread = useCallback3(async (threadId) => {
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
  useEffect4(() => {
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
  const [messages, setMessages] = useState4([]);
  const [loading, setLoading] = useState4(false);
  const [error, setError] = useState4(null);
  const fetchMessages = useCallback3(async () => {
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
  useEffect4(() => {
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
export {
  DistriProvider,
  useAgents,
  useDistri,
  useDistriClient,
  useTask,
  useThreadMessages,
  useThreads
};
//# sourceMappingURL=index.mjs.map