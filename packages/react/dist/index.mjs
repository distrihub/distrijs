// src/DistriProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { DistriClient } from "@distri/core";
import { jsx } from "react/jsx-runtime";
var DistriContext = createContext({
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
  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
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

// src/useChat.ts
import { useState as useState3, useEffect as useEffect3, useCallback as useCallback2, useRef } from "react";
import {
  DistriClient as DistriClient2
} from "@distri/core";
function useChat({ agentId, contextId }) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [loading, setLoading] = useState3(false);
  const [error, setError] = useState3(null);
  const [messages, setMessages] = useState3([]);
  const [isStreaming, setIsStreaming] = useState3(false);
  const abortControllerRef = useRef(null);
  const fetchMessages = useCallback2(async () => {
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
  useEffect3(() => {
    if (!clientLoading && !clientError && contextId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [clientLoading, clientError, contextId, fetchMessages]);
  const sendMessage = useCallback2(async (input, configuration) => {
    if (!client) {
      setError(new Error("Client not available"));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const userMessage = DistriClient2.initMessage(input, "user", contextId);
      setMessages((prev) => [...prev, userMessage]);
      const params = DistriClient2.initMessageParams(userMessage, configuration);
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
  const sendMessageStream = useCallback2(async (input, configuration) => {
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
      const userMessage = DistriClient2.initMessage(input, "user", contextId);
      setMessages((prev) => [...prev, userMessage]);
      const params = DistriClient2.initMessageParams(userMessage, {
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
  const abort = useCallback2(() => {
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
  const fetchThread = useCallback3(async (threadId) => {
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
  const deleteThread = useCallback3(async (threadId) => {
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
  const updateThread = useCallback3(async (threadId, localId) => {
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
    deleteThread,
    fetchThread,
    updateThread
  };
}
export {
  DistriProvider,
  useAgents,
  useChat,
  useDistri,
  useDistriClient,
  useThreads
};
//# sourceMappingURL=index.mjs.map