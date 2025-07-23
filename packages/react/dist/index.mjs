// src/useChat.ts
import { useState as useState3, useEffect as useEffect2, useCallback as useCallback2, useRef as useRef2, useMemo } from "react";

// src/useAgent.ts
import React, { useState as useState2, useCallback, useRef } from "react";
import {
  Agent
} from "@distri/core";

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

// src/useAgent.ts
function useAgent({
  agentId,
  autoCreateAgent = true
}) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agent, setAgent] = useState2(null);
  const [loading, setLoading] = useState2(false);
  const [error, setError] = useState2(null);
  const agentRef = useRef(null);
  const initializeAgent = useCallback(async () => {
    if (!client || !agentId || agentRef.current)
      return;
    try {
      setLoading(true);
      setError(null);
      const newAgent = await Agent.create(agentId, client);
      agentRef.current = newAgent;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create agent"));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);
  React.useEffect(() => {
    if (!clientLoading && !clientError && autoCreateAgent && client) {
      initializeAgent();
    }
  }, [clientLoading, clientError, autoCreateAgent, client, initializeAgent]);
  return {
    // Agent information
    agent,
    // State management
    loading: loading || clientLoading,
    error: error || clientError
  };
}

// src/useChat.ts
import {
  DistriClient as DistriClient2
} from "@distri/core";
function useChat({
  agentId,
  threadId,
  agent: providedAgent,
  tools,
  metadata
}) {
  const { agent: internalAgent } = useAgent({
    agentId
  });
  const agent = providedAgent || internalAgent;
  const [messages, setMessages] = useState3([]);
  const [loading, setLoading] = useState3(false);
  const [error, setError] = useState3(null);
  const [isStreaming, setIsStreaming] = useState3(false);
  const invokeConfig = useMemo(() => {
    return {
      tools,
      contextId: threadId,
      configuration: {
        acceptedOutputModes: ["text/plain"],
        blocking: false
      },
      metadata
    };
  }, [tools]);
  const [toolCallStatus, setToolCallStatus] = useState3({});
  const [toolHandlerResults, setToolHandlerResults] = useState3({});
  const abortControllerRef = useRef2(null);
  const fetchMessages = useCallback2(async () => {
    if (!agent || !threadId) {
      setMessages([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedMessages = await agent.getThreadMessages(threadId);
      setMessages(fetchedMessages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch messages"));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [agent, threadId]);
  useEffect2(() => {
    fetchMessages();
  }, [agent, threadId]);
  const updateToolCallStatus = useCallback2((toolCallId, updates) => {
    setToolCallStatus((prev) => ({
      ...prev,
      [toolCallId]: {
        ...prev[toolCallId],
        ...updates
      }
    }));
  }, []);
  const initializeToolCallStatus = useCallback2((event) => {
    const toolCall = event.data;
    setToolCallStatus((prev) => ({
      ...prev,
      [toolCall.tool_call_id]: {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_call_name,
        status: "running",
        input: "",
        result: null,
        error: null
      }
    }));
  }, []);
  const cancelToolExecution = useCallback2(() => {
    setToolHandlerResults({});
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  const onToolComplete = async (toolCallId, result) => {
    setToolHandlerResults((prev) => ({
      ...prev,
      [toolCallId]: {
        tool_call_id: toolCallId,
        result: result.result,
        success: result.success,
        error: result.error || null
      }
    }));
    let completed = true;
    for (const toolCallId2 in toolHandlerResults) {
      if (!toolHandlerResults[toolCallId2]) {
        completed = false;
        break;
      }
    }
    if (completed) {
      sendToolResponses(invokeConfig);
    }
  };
  const sendMessage = useCallback2(async (input, metadata2) => {
    if (!agent)
      return;
    const userMessage = DistriClient2.initMessage(input, "user", { contextId: threadId, metadata: metadata2 });
    setMessages((prev) => [...prev, userMessage]);
    const params = DistriClient2.initMessageParams(userMessage, invokeConfig.configuration, metadata2);
    try {
      setLoading(true);
      setError(null);
      const result = await agent.invoke(params);
      if (result && "message" in result && result.message) {
        setMessages((prev) => [...prev, result.message]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to send message"));
    } finally {
      setLoading(false);
    }
  }, [agent, threadId]);
  const handleToolCalls = async (toolcalls, config) => {
    for (const toolCall of toolcalls) {
      await handleToolCall(toolCall, config);
    }
  };
  const handleToolCall = async (toolCall, invokeConfig2) => {
    if (!invokeConfig2.tools || !invokeConfig2.tools[toolCall.tool_name]) {
      throw new Error(`No handler found for external tool: ${toolCall.tool_name}`);
    }
    const result = await invokeConfig2.tools[toolCall.tool_name](toolCall, onToolComplete);
    return result;
  };
  const sendToolResponses = async (invokeConfig2) => {
    const responseMessage = DistriClient2.initMessage([], "user", { contextId: invokeConfig2.contextId });
    let results = [];
    for (const toolCallId in toolHandlerResults) {
      results.push({
        tool_call_id: toolCallId,
        result: toolHandlerResults[toolCallId].result,
        success: toolHandlerResults[toolCallId].success,
        error: toolHandlerResults[toolCallId].error || void 0
      });
    }
    const metadata2 = {
      type: "tool_responses",
      results
    };
    await sendMessage(responseMessage.parts, metadata2);
  };
  const handleMessageEvent = async (event) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.messageId === event.messageId);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], parts: [...updated[idx].parts, ...event.parts] };
        return updated;
      } else {
        return [...prev, event];
      }
    });
    if (event.metadata?.type === "assistant_response" && event.metadata.tool_calls) {
      console.log("tool calls", event.metadata.tool_calls);
      let toolCalls = event.metadata.tool_calls;
      await handleToolCalls(toolCalls, invokeConfig);
    }
  };
  const handleTaskStatusUpdateEvent = async (task_event) => {
    let event = task_event.metadata;
    if (event.type === "tool_call_start") {
      let tool_call_start = event;
      initializeToolCallStatus(tool_call_start);
    } else if (event.type === "tool_call_args") {
      let tool_call_args = event;
      updateToolCallStatus(tool_call_args.data.tool_call_id, {
        input: tool_call_args.data.delta
      });
    } else if (event.type === "tool_call_end") {
      let tool_call_end = event;
      updateToolCallStatus(tool_call_end.data.tool_call_id, {
        status: "completed"
      });
    } else if (event.type === "tool_call_result") {
      let tool_call_result = event;
      updateToolCallStatus(tool_call_result.data.tool_call_id, {
        status: "completed",
        result: tool_call_result.data.result,
        error: null
      });
    }
  };
  const sendMessageStream = useCallback2(async (input, metadata2) => {
    if (!agent)
      return;
    const userMessage = DistriClient2.initMessage(input, "user", { contextId: threadId, metadata: metadata2 });
    setMessages((prev) => [...prev, userMessage]);
    const params = DistriClient2.initMessageParams(userMessage, invokeConfig.configuration, metadata2);
    try {
      setLoading(true);
      setIsStreaming(true);
      setError(null);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const stream = await agent.invokeStream(params);
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted)
          break;
        if (event.kind === "message") {
          await handleMessageEvent(event);
        } else if (event.kind === "task-status-update") {
          await handleTaskStatusUpdateEvent(event);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError")
        return;
      setError(err instanceof Error ? err : new Error("Failed to stream message"));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [agent, threadId, initializeToolCallStatus, updateToolCallStatus]);
  const clearMessages = useCallback2(() => {
    setMessages([]);
    setToolCallStatus({});
    setToolHandlerResults({});
  }, []);
  const refreshMessages = useCallback2(async () => {
    await fetchMessages();
  }, [fetchMessages]);
  return {
    messages,
    loading,
    error,
    isStreaming,
    sendMessage,
    sendMessageStream,
    refreshMessages,
    clearMessages,
    agent: agent ? agent : null,
    // Tool call state - updated during streaming
    toolCallStatus,
    toolHandlerResults,
    cancelToolExecution
  };
}

// src/useAgents.ts
import { useState as useState4, useEffect as useEffect3, useCallback as useCallback3 } from "react";
function useAgents() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = useState4([]);
  const [loading, setLoading] = useState4(true);
  const [error, setError] = useState4(null);
  const fetchAgents = useCallback3(async () => {
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
  const getAgent = useCallback3(async (agentId) => {
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

// src/useThreads.ts
import { useState as useState5, useEffect as useEffect4, useCallback as useCallback4 } from "react";
function useThreads() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = useState5([]);
  const [loading, setLoading] = useState5(true);
  const [error, setError] = useState5(null);
  const fetchThreads = useCallback4(async () => {
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
  const fetchThread = useCallback4(async (threadId) => {
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
  const deleteThread = useCallback4(async (threadId) => {
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
  const updateThread = useCallback4(async (threadId, localId) => {
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

// src/components/Toast.tsx
import { useState as useState6, useEffect as useEffect5 } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var Toast = ({
  message,
  type = "info",
  duration = 3e3,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState6(true);
  useEffect5(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  const getIcon = () => {
    switch (type) {
      case "success":
        return /* @__PURE__ */ jsx2(CheckCircle, { className: "w-5 h-5 text-green-500" });
      case "error":
        return /* @__PURE__ */ jsx2(XCircle, { className: "w-5 h-5 text-red-500" });
      case "warning":
        return /* @__PURE__ */ jsx2(AlertTriangle, { className: "w-5 h-5 text-yellow-500" });
      case "info":
      default:
        return /* @__PURE__ */ jsx2(Info, { className: "w-5 h-5 text-blue-500" });
    }
  };
  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };
  if (!isVisible)
    return null;
  return /* @__PURE__ */ jsx2("div", { className: `fixed top-4 right-4 z-50 max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-start p-4", children: [
    /* @__PURE__ */ jsx2("div", { className: "flex-shrink-0", children: getIcon() }),
    /* @__PURE__ */ jsx2("div", { className: "ml-3 flex-1", children: /* @__PURE__ */ jsx2("p", { className: "text-sm font-medium text-gray-900", children: message }) }),
    /* @__PURE__ */ jsx2("div", { className: "ml-4 flex-shrink-0", children: /* @__PURE__ */ jsx2(
      "button",
      {
        onClick: () => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        },
        className: "inline-flex text-gray-400 hover:text-gray-600 focus:outline-none",
        children: /* @__PURE__ */ jsx2(X, { className: "w-4 h-4" })
      }
    ) })
  ] }) });
};
var Toast_default = Toast;

// src/components/ApprovalDialog.tsx
import { useState as useState7 } from "react";
import { AlertTriangle as AlertTriangle2, CheckCircle as CheckCircle2, XCircle as XCircle2 } from "lucide-react";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var ApprovalDialog = ({
  toolCalls,
  reason,
  onApprove,
  onDeny,
  onCancel
}) => {
  const [isVisible, setIsVisible] = useState7(true);
  if (!isVisible)
    return null;
  const handleApprove = () => {
    setIsVisible(false);
    onApprove();
  };
  const handleDeny = () => {
    setIsVisible(false);
    onDeny();
  };
  const handleCancel = () => {
    setIsVisible(false);
    onCancel();
  };
  return /* @__PURE__ */ jsx3("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50", children: /* @__PURE__ */ jsxs2("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full mx-4", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center p-4 border-b border-gray-200", children: [
      /* @__PURE__ */ jsx3(AlertTriangle2, { className: "w-6 h-6 text-yellow-500 mr-3" }),
      /* @__PURE__ */ jsx3("h3", { className: "text-lg font-semibold text-gray-900", children: "Tool Execution Approval" })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "p-4", children: [
      reason && /* @__PURE__ */ jsx3("div", { className: "mb-4", children: /* @__PURE__ */ jsx3("p", { className: "text-sm text-gray-700", children: reason }) }),
      /* @__PURE__ */ jsxs2("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx3("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "Tools to execute:" }),
        /* @__PURE__ */ jsx3("div", { className: "space-y-2", children: toolCalls.map((toolCall) => /* @__PURE__ */ jsx3("div", { className: "flex items-center p-2 bg-gray-50 rounded", children: /* @__PURE__ */ jsxs2("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx3("p", { className: "text-sm font-medium text-gray-900", children: toolCall.tool_name }),
          toolCall.input && /* @__PURE__ */ jsx3("p", { className: "text-xs text-gray-600 mt-1", children: typeof toolCall.input === "string" ? toolCall.input : JSON.stringify(toolCall.input) })
        ] }) }, toolCall.tool_call_id)) })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "flex space-x-3", children: [
        /* @__PURE__ */ jsxs2(
          "button",
          {
            onClick: handleApprove,
            className: "flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors",
            children: [
              /* @__PURE__ */ jsx3(CheckCircle2, { className: "w-4 h-4 mr-2" }),
              "Approve"
            ]
          }
        ),
        /* @__PURE__ */ jsxs2(
          "button",
          {
            onClick: handleDeny,
            className: "flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors",
            children: [
              /* @__PURE__ */ jsx3(XCircle2, { className: "w-4 h-4 mr-2" }),
              "Deny"
            ]
          }
        ),
        /* @__PURE__ */ jsx3(
          "button",
          {
            onClick: handleCancel,
            className: "px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors",
            children: "Cancel"
          }
        )
      ] })
    ] })
  ] }) });
};
var ApprovalDialog_default = ApprovalDialog;

// src/components/ExternalToolManager.tsx
import { useState as useState8, useCallback as useCallback5, useEffect as useEffect6 } from "react";
import { X as X2, Loader2 } from "lucide-react";

// src/builtinHandlers.ts
import { APPROVAL_REQUEST_TOOL_NAME } from "@distri/core";
var pendingToolCalls = /* @__PURE__ */ new Map();
var showToast = null;
var showApprovalDialog = null;
var initializeBuiltinHandlers = (callbacks) => {
  showToast = callbacks.showToast;
  showApprovalDialog = callbacks.showApprovalDialog;
};
var clearPendingToolCalls = () => {
  pendingToolCalls.clear();
};
var createBuiltinToolHandlers = () => ({
  // Approval request handler - opens a dialog
  [APPROVAL_REQUEST_TOOL_NAME]: async (toolCall, onToolComplete) => {
    try {
      const input = JSON.parse(toolCall.input);
      const toolCallsToApprove = input.tool_calls || [];
      const reason = input.reason;
      if (!showApprovalDialog) {
        console.warn("Approval dialog not initialized");
        return null;
      }
      const approved = await showApprovalDialog(toolCallsToApprove, reason);
      const result = {
        tool_call_id: toolCall.tool_call_id,
        result: { approved, reason: approved ? "Approved by user" : "Denied by user" },
        success: true
      };
      await onToolComplete(result);
      return {
        approved,
        reason: approved ? "Approved by user" : "Denied by user",
        tool_calls: toolCallsToApprove
      };
    } catch (error) {
      console.error("Error in approval request handler:", error);
      const result = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
      await onToolComplete(result);
      return null;
    }
  },
  // Toast handler - shows a toast and returns success
  toast: async (toolCall, onToolComplete) => {
    try {
      const input = JSON.parse(toolCall.input);
      const message = input.message || "Toast message";
      const type = input.type || "info";
      if (!showToast) {
        console.warn("Toast not initialized");
        return null;
      }
      showToast(message, type);
      const result = {
        tool_call_id: toolCall.tool_call_id,
        result: { success: true, message: "Toast displayed successfully" },
        success: true
      };
      await onToolComplete(result);
      return {
        success: true,
        message: "Toast displayed successfully"
      };
    } catch (error) {
      console.error("Error in toast handler:", error);
      const result = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
      await onToolComplete(result);
      return null;
    }
  },
  // Input request handler - shows prompt
  input_request: async (toolCall, onToolComplete) => {
    try {
      const input = JSON.parse(toolCall.input);
      const prompt = input.prompt || "Please provide input:";
      const defaultValue = input.default || "";
      const userInput = window.prompt(prompt, defaultValue);
      if (userInput === null) {
        const result2 = {
          tool_call_id: toolCall.tool_call_id,
          result: null,
          success: false,
          error: "User cancelled input"
        };
        await onToolComplete(result2);
        return null;
      }
      const result = {
        tool_call_id: toolCall.tool_call_id,
        result: { input: userInput },
        success: true
      };
      await onToolComplete(result);
      return {
        input: userInput
      };
    } catch (error) {
      console.error("Error in input request handler:", error);
      const result = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
      await onToolComplete(result);
      return null;
    }
  }
});
var processExternalToolCalls = async (toolCalls, handlers, onToolComplete) => {
  const results = [];
  for (const toolCall of toolCalls) {
    const handler = handlers[toolCall.tool_name];
    if (!handler) {
      const result = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: `No handler found for tool: ${toolCall.tool_name}`
      };
      results.push(result);
      continue;
    }
    try {
      const singleToolComplete = async (result) => {
        results.push(result);
        await onToolComplete([...results]);
      };
      await handler(toolCall, singleToolComplete);
    } catch (error) {
      console.error(`Error executing tool ${toolCall.tool_name}:`, error);
      const result = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
      results.push(result);
      await onToolComplete([...results]);
    }
  }
};

// src/components/ExternalToolManager.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var ExternalToolManager = ({
  toolCalls,
  onToolComplete,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState8(false);
  const [toasts, setToasts] = useState8([]);
  const [approvalDialog, setApprovalDialog] = useState8(null);
  const [processingResults, setProcessingResults] = useState8([]);
  useEffect6(() => {
    initializeBuiltinHandlers({
      onToolComplete: (results) => {
        setProcessingResults((prev) => [...prev, ...results]);
        onToolComplete(results);
      },
      onCancel: () => {
        clearPendingToolCalls();
        onCancel();
      },
      showToast: (message, type = "info") => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
      },
      showApprovalDialog: (toolCalls2, reason) => {
        return new Promise((resolve) => {
          setApprovalDialog({ toolCalls: toolCalls2, reason, resolve });
        });
      }
    });
  }, [onToolComplete, onCancel]);
  useEffect6(() => {
    if (toolCalls.length > 0 && !isProcessing) {
      processToolCalls();
    }
  }, [toolCalls]);
  const processToolCalls = useCallback5(async () => {
    if (toolCalls.length === 0)
      return;
    setIsProcessing(true);
    setProcessingResults([]);
    try {
      const handlers = createBuiltinToolHandlers();
      const localOnToolComplete = async (results) => {
        setProcessingResults((prev) => [...prev, ...results]);
        onToolComplete(results);
      };
      await processExternalToolCalls(toolCalls, handlers, localOnToolComplete);
    } catch (error) {
      console.error("Error processing tool calls:", error);
      const errorResults = toolCalls.map((toolCall) => ({
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }));
      setProcessingResults(errorResults);
      onToolComplete(errorResults);
    } finally {
      setIsProcessing(false);
    }
  }, [toolCalls, onToolComplete]);
  const handleApprovalDialogResponse = useCallback5((approved) => {
    if (approvalDialog) {
      approvalDialog.resolve(approved);
      setApprovalDialog(null);
    }
  }, [approvalDialog]);
  const handleApprovalDialogCancel = useCallback5(() => {
    if (approvalDialog) {
      approvalDialog.resolve(false);
      setApprovalDialog(null);
    }
  }, [approvalDialog]);
  const removeToast = useCallback5((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  if (toolCalls.length === 0)
    return null;
  return /* @__PURE__ */ jsxs3(Fragment, { children: [
    /* @__PURE__ */ jsxs3("div", { className: "my-4 p-4 border border-blue-200 bg-blue-50 rounded-lg", children: [
      /* @__PURE__ */ jsxs3("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx4(Loader2, { className: `w-5 h-5 text-blue-600 ${isProcessing ? "animate-spin" : ""}` }),
          /* @__PURE__ */ jsx4("span", { className: "font-semibold text-blue-800", children: isProcessing ? "Processing External Tools..." : "External Tools Completed" })
        ] }),
        /* @__PURE__ */ jsxs3(
          "button",
          {
            onClick: onCancel,
            className: "flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors",
            children: [
              /* @__PURE__ */ jsx4(X2, { className: "w-4 h-4" }),
              "Cancel"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx4("div", { className: "space-y-2", children: toolCalls.map((toolCall) => {
        const result = processingResults.find((r) => r.tool_call_id === toolCall.tool_call_id);
        const status = result ? result.success ? "completed" : "error" : isProcessing ? "processing" : "pending";
        return /* @__PURE__ */ jsxs3("div", { className: "flex items-center justify-between p-2 bg-white rounded border", children: [
          /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx4("span", { className: "font-medium", children: toolCall.tool_name }),
            /* @__PURE__ */ jsx4("span", { className: `text-sm ${status === "completed" ? "text-green-600" : status === "error" ? "text-red-600" : status === "processing" ? "text-blue-600" : "text-gray-500"}`, children: status })
          ] }),
          result && !result.success && /* @__PURE__ */ jsx4("span", { className: "text-xs text-red-600", children: result.error })
        ] }, toolCall.tool_call_id);
      }) }),
      processingResults.length > 0 && /* @__PURE__ */ jsx4("div", { className: "mt-3 p-2 bg-gray-100 rounded", children: /* @__PURE__ */ jsxs3("p", { className: "text-sm text-gray-700", children: [
        processingResults.filter((r) => r.success).length,
        " of ",
        processingResults.length,
        " tools completed successfully"
      ] }) })
    ] }),
    approvalDialog && /* @__PURE__ */ jsx4(
      ApprovalDialog_default,
      {
        toolCalls: approvalDialog.toolCalls,
        reason: approvalDialog.reason,
        onApprove: () => handleApprovalDialogResponse(true),
        onDeny: () => handleApprovalDialogResponse(false),
        onCancel: handleApprovalDialogCancel
      }
    ),
    toasts.map((toast) => /* @__PURE__ */ jsx4(
      Toast_default,
      {
        message: toast.message,
        type: toast.type,
        onClose: () => removeToast(toast.id)
      },
      toast.id
    ))
  ] });
};
var ExternalToolManager_default = ExternalToolManager;

// src/utils/toolCallUtils.ts
var extractExternalToolCalls = (messages) => {
  const externalToolCalls = [];
  messages.forEach((message) => {
    const meta = message.metadata;
    if (meta && meta.type === "assistant_response" && meta.tool_calls && Array.isArray(meta.tool_calls)) {
      meta.tool_calls.forEach((toolCall) => {
        const existingToolCall = externalToolCalls.find((tc) => tc.tool_call_id === toolCall.tool_call_id);
        if (!existingToolCall) {
          externalToolCalls.push(toolCall);
        }
      });
    }
  });
  return externalToolCalls;
};

// src/index.ts
import {
  DistriClient as DistriClient3,
  APPROVAL_REQUEST_TOOL_NAME as APPROVAL_REQUEST_TOOL_NAME2,
  Agent as Agent2
} from "@distri/core";
export {
  APPROVAL_REQUEST_TOOL_NAME2 as APPROVAL_REQUEST_TOOL_NAME,
  Agent2 as Agent,
  ApprovalDialog_default as ApprovalDialog,
  DistriClient3 as DistriClient,
  DistriProvider,
  ExternalToolManager_default as ExternalToolManager,
  Toast_default as Toast,
  clearPendingToolCalls,
  createBuiltinToolHandlers,
  extractExternalToolCalls,
  initializeBuiltinHandlers,
  processExternalToolCalls,
  useAgent,
  useAgents,
  useChat,
  useDistri,
  useDistriClient,
  useThreads
};
//# sourceMappingURL=index.mjs.map