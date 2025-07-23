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

// src/useAgents.ts
import { useState as useState3, useEffect as useEffect2, useCallback as useCallback2 } from "react";
function useAgents() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = useState3([]);
  const [loading, setLoading] = useState3(true);
  const [error, setError] = useState3(null);
  const fetchAgents = useCallback2(async () => {
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
  const getAgent = useCallback2(async (agentId) => {
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
import { useState as useState4, useEffect as useEffect3, useCallback as useCallback3, useRef as useRef2, useMemo } from "react";
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
  const [messages, setMessages] = useState4([]);
  const [loading, setLoading] = useState4(false);
  const [error, setError] = useState4(null);
  const [isStreaming, setIsStreaming] = useState4(false);
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
  const [toolCallStatus, setToolCallStatus] = useState4({});
  const [toolHandlerResults, setToolHandlerResults] = useState4({});
  const abortControllerRef = useRef2(null);
  const fetchMessages = useCallback3(async () => {
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
  useEffect3(() => {
    fetchMessages();
  }, [agent, threadId]);
  const updateToolCallStatus = useCallback3((toolCallId, updates) => {
    setToolCallStatus((prev) => ({
      ...prev,
      [toolCallId]: {
        ...prev[toolCallId],
        ...updates
      }
    }));
  }, []);
  const initializeToolCallStatus = useCallback3((event) => {
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
  const cancelToolExecution = useCallback3(() => {
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
  const sendMessage = useCallback3(async (input, metadata2) => {
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
  const sendMessageStream = useCallback3(async (input, metadata2) => {
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
  const clearMessages = useCallback3(() => {
    setMessages([]);
    setToolCallStatus({});
    setToolHandlerResults({});
  }, []);
  const refreshMessages = useCallback3(async () => {
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

// src/components/Chat.tsx
import { useState as useState9, useRef as useRef3, useEffect as useEffect7, useCallback as useCallback6, useMemo as useMemo3 } from "react";
import { Send, Loader2 as Loader22, Square, Eye, EyeOff } from "lucide-react";
import { useChat as useChat2 } from "@distri/core";

// src/components/ChatContext.tsx
import React2, { createContext as createContext2, useContext as useContext2 } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var defaultConfig = {
  theme: "chatgpt",
  showDebugMessages: false,
  enableCodeHighlighting: true,
  enableMarkdown: true,
  maxMessageWidth: "80%",
  borderRadius: "2xl",
  spacing: "4"
};
var ChatContext = createContext2(null);
function ChatProvider({ children, config: initialConfig }) {
  const [config, setConfig] = React2.useState({
    ...defaultConfig,
    ...initialConfig
  });
  const updateConfig = React2.useCallback((updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);
  return /* @__PURE__ */ jsx2(ChatContext.Provider, { value: { config, updateConfig }, children });
}
function useChatConfig() {
  const context = useContext2(ChatContext);
  if (!context) {
    throw new Error("useChatConfig must be used within a ChatProvider");
  }
  return context;
}
var getThemeClasses = (theme) => {
  switch (theme) {
    case "dark":
      return {
        background: "bg-gray-900",
        surface: "bg-gray-800",
        text: "text-gray-100",
        textSecondary: "text-gray-400",
        border: "border-gray-700",
        userBubble: "bg-blue-600 text-white",
        assistantBubble: "bg-gray-700 text-gray-100",
        avatar: {
          user: "bg-blue-600",
          assistant: "bg-gray-600"
        }
      };
    case "light":
      return {
        background: "bg-white",
        surface: "bg-gray-50",
        text: "text-gray-900",
        textSecondary: "text-gray-600",
        border: "border-gray-200",
        userBubble: "bg-blue-500 text-white",
        assistantBubble: "bg-gray-100 text-gray-900",
        avatar: {
          user: "bg-blue-500",
          assistant: "bg-gray-300"
        }
      };
    case "chatgpt":
    default:
      return {
        background: "bg-white",
        surface: "bg-gray-50/50",
        text: "text-gray-900",
        textSecondary: "text-gray-600",
        border: "border-gray-200",
        userBubble: "bg-gray-900 text-white",
        assistantBubble: "bg-white text-gray-900 border border-gray-200",
        avatar: {
          user: "bg-gray-900",
          assistant: "bg-green-600"
        }
      };
  }
};

// src/components/MessageComponents.tsx
import { User, Bot, Settings, Clock, CheckCircle, XCircle } from "lucide-react";

// src/components/MessageRenderer.tsx
import React3, { useMemo as useMemo2 } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Code2 } from "lucide-react";
import { Fragment, jsx as jsx3, jsxs } from "react/jsx-runtime";
var CodeBlock = ({ language, children, inline = false, isDark = false }) => {
  const [copied, setCopied] = React3.useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  const normalizeLanguage = (lang) => {
    if (!lang)
      return "text";
    const langMap = {
      "js": "javascript",
      "ts": "typescript",
      "jsx": "javascript",
      "tsx": "typescript",
      "py": "python",
      "rb": "ruby",
      "sh": "bash",
      "shell": "bash",
      "yml": "yaml",
      "md": "markdown",
      "json5": "json",
      "dockerfile": "docker",
      "rs": "rust",
      "go": "go",
      "php": "php",
      "cpp": "cpp",
      "cxx": "cpp",
      "cc": "cpp",
      "c++": "cpp",
      "cs": "csharp",
      "kt": "kotlin",
      "swift": "swift",
      "scala": "scala",
      "clj": "clojure",
      "cljs": "clojure",
      "r": "r",
      "matlab": "matlab",
      "sql": "sql",
      "psql": "sql",
      "mysql": "sql",
      "sqlite": "sql"
    };
    const normalized = lang.toLowerCase();
    return langMap[normalized] || normalized;
  };
  const normalizedLanguage = normalizeLanguage(language);
  if (inline) {
    return /* @__PURE__ */ jsx3("code", { className: `px-1.5 py-0.5 rounded text-sm font-mono ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`, children });
  }
  const lineCount = children.split("\n").length;
  const shouldShowLineNumbers = lineCount > 4;
  return /* @__PURE__ */ jsxs("div", { className: "relative my-4 rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-gray-50 border-b border-gray-200 px-3 py-2 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx3(Code2, { className: "h-4 w-4 text-gray-500" }),
        /* @__PURE__ */ jsx3("span", { className: "font-medium text-gray-700", children: normalizedLanguage === "text" ? "Code" : normalizedLanguage.toUpperCase() }),
        /* @__PURE__ */ jsxs("span", { className: "text-gray-500 text-xs", children: [
          lineCount,
          " ",
          lineCount === 1 ? "line" : "lines"
        ] })
      ] }),
      /* @__PURE__ */ jsx3(
        "button",
        {
          onClick: handleCopy,
          className: "flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800",
          title: "Copy code",
          children: copied ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx3(Check, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsx3("span", { className: "text-xs", children: "Copied!" })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx3(Copy, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsx3("span", { className: "text-xs", children: "Copy" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsx3("div", { className: "relative", children: /* @__PURE__ */ jsx3(
      SyntaxHighlighter,
      {
        style: isDark ? vscDarkPlus : oneLight,
        language: normalizedLanguage,
        PreTag: "div",
        showLineNumbers: shouldShowLineNumbers,
        wrapLines: true,
        wrapLongLines: true,
        lineNumberStyle: {
          minWidth: "2.5em",
          paddingRight: "1em",
          color: "#9CA3AF",
          fontSize: "0.75rem",
          userSelect: "none"
        },
        customStyle: {
          margin: 0,
          padding: "0.75rem",
          background: isDark ? "#1e1e1e" : "#fafafa",
          fontSize: "0.875rem",
          lineHeight: "1.5",
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          overflowX: "auto",
          maxWidth: "100%"
        },
        codeTagProps: {
          style: {
            fontSize: "0.875rem",
            fontFamily: "inherit"
          }
        },
        children: children.replace(/\n$/, "")
      }
    ) })
  ] });
};
var MessageRenderer = ({
  content,
  className = "",
  metadata
}) => {
  let config;
  try {
    const chatConfig = useChatConfig();
    config = chatConfig.config;
  } catch {
    config = {
      enableMarkdown: true,
      enableCodeHighlighting: true,
      theme: "chatgpt"
    };
  }
  const isDark = className.includes("text-white");
  const hasMarkdownSyntax = useMemo2(() => {
    if (!config.enableMarkdown)
      return false;
    const markdownPatterns = [
      /^#{1,6}\s+/m,
      // Headers
      /\*\*.*?\*\*/g,
      // Bold
      /\*.*?\*/g,
      // Italic  
      /`.*?`/g,
      // Inline code
      /```[\s\S]*?```/g,
      // Code blocks
      /^\s*[-*+]\s+/m,
      // Lists
      /^\s*\d+\.\s+/m,
      // Numbered lists
      /^\s*>\s+/m,
      // Blockquotes
      /\[.*?\]\(.*?\)/g,
      // Links
      /!\[.*?\]\(.*?\)/g,
      // Images
      /^\|.*\|/m
      // Tables
    ];
    return markdownPatterns.some((pattern) => pattern.test(content));
  }, [content, config.enableMarkdown]);
  const looksLikeCode = useMemo2(() => {
    if (!config.enableCodeHighlighting)
      return false;
    if (hasMarkdownSyntax)
      return false;
    const lines = content.split("\n");
    const totalLines = lines.length;
    if (totalLines === 1 && content.length < 50) {
      return false;
    }
    const explicitCodePatterns = [
      /^#!\//,
      // Shebang
      /^\s*(function|const|let|var)\s+\w+\s*[=\(]/,
      // JS/TS function/variable declarations
      /^\s*(class|interface)\s+\w+/,
      // Class/interface declarations
      /^\s*(import|export)\s+/,
      // Import/export statements
      /^\s*(def|class)\s+\w+/,
      // Python def/class
      /^\s*(public|private|protected)\s+(class|interface|static)/,
      // Java/C# declarations
      /^\s*<\?php/,
      // PHP opening tag
      /^\s*<html|<head|<body|<div/,
      // HTML tags
      /^\s*\{[\s]*"[\w"]+"\s*:/,
      // JSON objects (key-value pairs)
      /^\s*SELECT\s+.*\s+FROM\s+/i,
      // SQL SELECT statements
      /^\s*\/\*[\s\S]*\*\//,
      // Block comments
      /^[ \t]*\/\/\s*\w+/,
      // Line comments (with actual content)
      /;\s*$/
      // Lines ending with semicolons
    ];
    const hasExplicitCode = explicitCodePatterns.some((pattern) => pattern.test(content));
    if (!hasExplicitCode)
      return false;
    const structuralPatterns = [
      /[{}[\]()]/g,
      // Brackets and braces
      /^\s{2,}/m,
      // Indentation
      /=>/g,
      // Arrow functions
      /[;:]/g
      // Semicolons or colons
    ];
    const structureCount = structuralPatterns.reduce((count, pattern) => {
      const matches = content.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
    return structureCount >= 3;
  }, [content, hasMarkdownSyntax, config.enableCodeHighlighting]);
  const detectLanguage = useMemo2(() => {
    if (/\b(function|const|let|var|=>|console\.log)\b/.test(content))
      return "javascript";
    if (/\b(interface|type|as\s+\w+)\b/.test(content))
      return "typescript";
    if (/\b(def|import|from|print|if\s+\w+:)\b/.test(content))
      return "python";
    if (/\b(public\s+class|static\s+void|System\.out)\b/.test(content))
      return "java";
    if (/\b(fn|let\s+mut|impl|match)\b/.test(content))
      return "rust";
    if (/\b(func|package|import|fmt\.)\b/.test(content))
      return "go";
    if (/SELECT.*FROM|INSERT.*INTO|UPDATE.*SET/i.test(content))
      return "sql";
    if (/<[^>]+>.*<\/[^>]+>/.test(content))
      return "html";
    if (/\{[^}]*:[^}]*\}/.test(content))
      return "json";
    if (/^#!\/bin\/(bash|sh)/.test(content))
      return "bash";
    if (/\$\w+|echo\s+/.test(content))
      return "bash";
    return "text";
  }, [content]);
  if (looksLikeCode) {
    return /* @__PURE__ */ jsx3(
      CodeBlock,
      {
        language: detectLanguage,
        isDark,
        children: content
      }
    );
  }
  if (!hasMarkdownSyntax) {
    return /* @__PURE__ */ jsx3("div", { className: `whitespace-pre-wrap break-words ${className}`, children: content });
  }
  return /* @__PURE__ */ jsx3("div", { className: `prose prose-sm max-w-none ${isDark ? "prose-invert" : ""} ${className} break-words`, children: /* @__PURE__ */ jsx3(
    ReactMarkdown,
    {
      components: {
        code({ className: className2, children }) {
          const match = /language-(\w+)/.exec(className2 || "");
          const language = match ? match[1] : "";
          return /* @__PURE__ */ jsx3(
            CodeBlock,
            {
              language,
              inline: true,
              isDark,
              children: String(children).replace(/\n$/, "")
            }
          );
        },
        // Enhanced blockquote styling
        blockquote({ children }) {
          return /* @__PURE__ */ jsx3("blockquote", { className: `border-l-4 pl-4 py-2 italic my-4 rounded-r ${isDark ? "border-blue-400 text-blue-200 bg-blue-900/20" : "border-blue-500 text-blue-700 bg-blue-50"}`, children });
        },
        // Enhanced table styling with overflow handling
        table({ children }) {
          return /* @__PURE__ */ jsx3("div", { className: "overflow-x-auto my-4", children: /* @__PURE__ */ jsx3("table", { className: `min-w-full border-collapse rounded-lg overflow-hidden ${isDark ? "border-gray-600" : "border-gray-300"}`, children }) });
        },
        th({ children }) {
          return /* @__PURE__ */ jsx3("th", { className: `border px-4 py-2 font-semibold text-left ${isDark ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-gray-100"}`, children });
        },
        td({ children }) {
          return /* @__PURE__ */ jsx3("td", { className: `border px-4 py-2 ${isDark ? "border-gray-600" : "border-gray-300"}`, children });
        }
      },
      children: content
    }
  ) });
};
var MessageRenderer_default = MessageRenderer;

// src/components/MessageComponents.tsx
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
var MessageContainer = ({ children, align, className = "" }) => {
  const justifyClass = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return /* @__PURE__ */ jsx4("div", { className: `flex ${justifyClass} w-full ${className}`, children: /* @__PURE__ */ jsx4("div", { className: "w-full max-w-4xl mx-auto px-4", children }) });
};
var UserMessage = ({
  content,
  timestamp,
  className = "",
  avatar
}) => {
  const { config } = useChatConfig();
  const theme = getThemeClasses(config.theme);
  return /* @__PURE__ */ jsx4(MessageContainer, { align: "center", className, children: /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-4 py-6", children: [
    /* @__PURE__ */ jsx4("div", { className: `flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme.avatar.user}`, children: avatar || /* @__PURE__ */ jsx4(User, { className: "h-4 w-4 text-white" }) }),
    /* @__PURE__ */ jsxs2("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx4("div", { className: "text-sm font-medium text-gray-900 mb-1", children: "You" }),
      /* @__PURE__ */ jsx4("div", { className: "prose prose-sm max-w-none", children: /* @__PURE__ */ jsx4(
        MessageRenderer_default,
        {
          content,
          className: "text-gray-900"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx4("div", { className: "text-xs text-gray-400 mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var AssistantMessage = ({
  content,
  timestamp,
  isStreaming = false,
  metadata,
  className = "",
  avatar
}) => {
  const { config } = useChatConfig();
  const theme = getThemeClasses(config.theme);
  return /* @__PURE__ */ jsx4(MessageContainer, { align: "center", className: `${theme.surface} ${className}`, children: /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-4 py-6", children: [
    /* @__PURE__ */ jsx4("div", { className: `flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme.avatar.assistant}`, children: avatar || /* @__PURE__ */ jsx4(Bot, { className: "h-4 w-4 text-white" }) }),
    /* @__PURE__ */ jsxs2("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs2("div", { className: "text-sm font-medium text-gray-900 mb-1 flex items-center gap-2", children: [
        "Assistant",
        isStreaming && /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1 text-xs text-gray-500", children: [
          /* @__PURE__ */ jsx4("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse" }),
          /* @__PURE__ */ jsx4("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ jsx4("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      /* @__PURE__ */ jsx4("div", { className: "prose prose-sm max-w-none", children: /* @__PURE__ */ jsx4(
        MessageRenderer_default,
        {
          content,
          className: "text-gray-900",
          metadata
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx4("div", { className: "text-xs text-gray-400 mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var Tool = ({
  toolCall,
  status = "pending",
  result,
  error
}) => {
  const { config } = useChatConfig();
  const theme = getThemeClasses(config.theme);
  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return /* @__PURE__ */ jsx4(Clock, { className: "h-4 w-4 text-gray-400" });
      case "running":
        return /* @__PURE__ */ jsx4(Settings, { className: "h-4 w-4 text-blue-500 animate-spin" });
      case "completed":
        return /* @__PURE__ */ jsx4(CheckCircle, { className: "h-4 w-4 text-green-500" });
      case "error":
        return /* @__PURE__ */ jsx4(XCircle, { className: "h-4 w-4 text-red-500" });
      default:
        return /* @__PURE__ */ jsx4(Clock, { className: "h-4 w-4 text-gray-400" });
    }
  };
  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "border-gray-200 bg-gray-50";
      case "running":
        return "border-blue-200 bg-blue-50";
      case "completed":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };
  const toolName = "tool_name" in toolCall ? toolCall.tool_name : toolCall.tool_name;
  const toolId = "tool_call_id" in toolCall ? toolCall.tool_call_id : toolCall.tool_call_id;
  const input = "input" in toolCall ? toolCall.input : toolCall.args;
  return /* @__PURE__ */ jsxs2("div", { className: `border rounded-lg p-4 ${getStatusColor()}`, children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2 mb-2", children: [
      getStatusIcon(),
      /* @__PURE__ */ jsx4("span", { className: "font-medium text-sm", children: toolName }),
      /* @__PURE__ */ jsx4("span", { className: "text-xs text-gray-500 font-mono", children: toolId })
    ] }),
    input && /* @__PURE__ */ jsxs2("div", { className: "mb-2", children: [
      /* @__PURE__ */ jsx4("div", { className: "text-xs font-medium text-gray-600 mb-1", children: "Input:" }),
      /* @__PURE__ */ jsx4("div", { className: "text-sm bg-white rounded border p-2 font-mono text-gray-800", children: typeof input === "string" ? input : JSON.stringify(input, null, 2) })
    ] }),
    result && /* @__PURE__ */ jsxs2("div", { className: "mb-2", children: [
      /* @__PURE__ */ jsx4("div", { className: "text-xs font-medium text-gray-600 mb-1", children: "Result:" }),
      /* @__PURE__ */ jsx4("div", { className: "text-sm bg-white rounded border p-2 font-mono text-gray-800", children: typeof result === "string" ? result : JSON.stringify(result, null, 2) })
    ] }),
    error && /* @__PURE__ */ jsxs2("div", { className: "mb-2", children: [
      /* @__PURE__ */ jsx4("div", { className: "text-xs font-medium text-red-600 mb-1", children: "Error:" }),
      /* @__PURE__ */ jsx4("div", { className: "text-sm bg-red-50 rounded border border-red-200 p-2 text-red-800", children: error })
    ] })
  ] });
};
var AssistantWithToolCalls = ({
  content,
  toolCalls,
  timestamp,
  isStreaming = false,
  metadata,
  className = "",
  avatar
}) => {
  const { config } = useChatConfig();
  const theme = getThemeClasses(config.theme);
  return /* @__PURE__ */ jsx4(MessageContainer, { align: "center", className: `${theme.surface} ${className}`, children: /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-4 py-6", children: [
    /* @__PURE__ */ jsx4("div", { className: `flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme.avatar.assistant}`, children: avatar || /* @__PURE__ */ jsx4(Bot, { className: "h-4 w-4 text-white" }) }),
    /* @__PURE__ */ jsxs2("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs2("div", { className: "text-sm font-medium text-gray-900 mb-1 flex items-center gap-2", children: [
        "Assistant",
        isStreaming && /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1 text-xs text-gray-500", children: [
          /* @__PURE__ */ jsx4("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse" }),
          /* @__PURE__ */ jsx4("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ jsx4("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      content && /* @__PURE__ */ jsx4("div", { className: "prose prose-sm max-w-none mb-4", children: /* @__PURE__ */ jsx4(
        MessageRenderer_default,
        {
          content,
          className: "text-gray-900",
          metadata
        }
      ) }),
      toolCalls.length > 0 && /* @__PURE__ */ jsx4("div", { className: "space-y-3", children: toolCalls.map((toolCallProps, index) => /* @__PURE__ */ jsx4(Tool, { ...toolCallProps }, index)) }),
      timestamp && /* @__PURE__ */ jsx4("div", { className: "text-xs text-gray-400 mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};

// src/components/ExternalToolManager.tsx
import { useState as useState8, useCallback as useCallback5, useEffect as useEffect6 } from "react";
import { X as X2, Loader2 } from "lucide-react";

// src/components/Toast.tsx
import { useState as useState6, useEffect as useEffect5 } from "react";
import { CheckCircle as CheckCircle2, XCircle as XCircle2, AlertTriangle, Info, X } from "lucide-react";
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
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
        return /* @__PURE__ */ jsx5(CheckCircle2, { className: "w-5 h-5 text-green-500" });
      case "error":
        return /* @__PURE__ */ jsx5(XCircle2, { className: "w-5 h-5 text-red-500" });
      case "warning":
        return /* @__PURE__ */ jsx5(AlertTriangle, { className: "w-5 h-5 text-yellow-500" });
      case "info":
      default:
        return /* @__PURE__ */ jsx5(Info, { className: "w-5 h-5 text-blue-500" });
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
  return /* @__PURE__ */ jsx5("div", { className: `fixed top-4 right-4 z-50 max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`, children: /* @__PURE__ */ jsxs3("div", { className: "flex items-start p-4", children: [
    /* @__PURE__ */ jsx5("div", { className: "flex-shrink-0", children: getIcon() }),
    /* @__PURE__ */ jsx5("div", { className: "ml-3 flex-1", children: /* @__PURE__ */ jsx5("p", { className: "text-sm font-medium text-gray-900", children: message }) }),
    /* @__PURE__ */ jsx5("div", { className: "ml-4 flex-shrink-0", children: /* @__PURE__ */ jsx5(
      "button",
      {
        onClick: () => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        },
        className: "inline-flex text-gray-400 hover:text-gray-600 focus:outline-none",
        children: /* @__PURE__ */ jsx5(X, { className: "w-4 h-4" })
      }
    ) })
  ] }) });
};
var Toast_default = Toast;

// src/components/ApprovalDialog.tsx
import { useState as useState7 } from "react";
import { AlertTriangle as AlertTriangle2, CheckCircle as CheckCircle3, XCircle as XCircle3 } from "lucide-react";
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx6("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50", children: /* @__PURE__ */ jsxs4("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full mx-4", children: [
    /* @__PURE__ */ jsxs4("div", { className: "flex items-center p-4 border-b border-gray-200", children: [
      /* @__PURE__ */ jsx6(AlertTriangle2, { className: "w-6 h-6 text-yellow-500 mr-3" }),
      /* @__PURE__ */ jsx6("h3", { className: "text-lg font-semibold text-gray-900", children: "Tool Execution Approval" })
    ] }),
    /* @__PURE__ */ jsxs4("div", { className: "p-4", children: [
      reason && /* @__PURE__ */ jsx6("div", { className: "mb-4", children: /* @__PURE__ */ jsx6("p", { className: "text-sm text-gray-700", children: reason }) }),
      /* @__PURE__ */ jsxs4("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx6("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "Tools to execute:" }),
        /* @__PURE__ */ jsx6("div", { className: "space-y-2", children: toolCalls.map((toolCall) => /* @__PURE__ */ jsx6("div", { className: "flex items-center p-2 bg-gray-50 rounded", children: /* @__PURE__ */ jsxs4("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx6("p", { className: "text-sm font-medium text-gray-900", children: toolCall.tool_name }),
          toolCall.input && /* @__PURE__ */ jsx6("p", { className: "text-xs text-gray-600 mt-1", children: typeof toolCall.input === "string" ? toolCall.input : JSON.stringify(toolCall.input) })
        ] }) }, toolCall.tool_call_id)) })
      ] }),
      /* @__PURE__ */ jsxs4("div", { className: "flex space-x-3", children: [
        /* @__PURE__ */ jsxs4(
          "button",
          {
            onClick: handleApprove,
            className: "flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors",
            children: [
              /* @__PURE__ */ jsx6(CheckCircle3, { className: "w-4 h-4 mr-2" }),
              "Approve"
            ]
          }
        ),
        /* @__PURE__ */ jsxs4(
          "button",
          {
            onClick: handleDeny,
            className: "flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors",
            children: [
              /* @__PURE__ */ jsx6(XCircle3, { className: "w-4 h-4 mr-2" }),
              "Deny"
            ]
          }
        ),
        /* @__PURE__ */ jsx6(
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
import { Fragment as Fragment2, jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs5(Fragment2, { children: [
    /* @__PURE__ */ jsxs5("div", { className: "my-4 p-4 border border-blue-200 bg-blue-50 rounded-lg", children: [
      /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx7(Loader2, { className: `w-5 h-5 text-blue-600 ${isProcessing ? "animate-spin" : ""}` }),
          /* @__PURE__ */ jsx7("span", { className: "font-semibold text-blue-800", children: isProcessing ? "Processing External Tools..." : "External Tools Completed" })
        ] }),
        /* @__PURE__ */ jsxs5(
          "button",
          {
            onClick: onCancel,
            className: "flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors",
            children: [
              /* @__PURE__ */ jsx7(X2, { className: "w-4 h-4" }),
              "Cancel"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx7("div", { className: "space-y-2", children: toolCalls.map((toolCall) => {
        const result = processingResults.find((r) => r.tool_call_id === toolCall.tool_call_id);
        const status = result ? result.success ? "completed" : "error" : isProcessing ? "processing" : "pending";
        return /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between p-2 bg-white rounded border", children: [
          /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx7("span", { className: "font-medium", children: toolCall.tool_name }),
            /* @__PURE__ */ jsx7("span", { className: `text-sm ${status === "completed" ? "text-green-600" : status === "error" ? "text-red-600" : status === "processing" ? "text-blue-600" : "text-gray-500"}`, children: status })
          ] }),
          result && !result.success && /* @__PURE__ */ jsx7("span", { className: "text-xs text-red-600", children: result.error })
        ] }, toolCall.tool_call_id);
      }) }),
      processingResults.length > 0 && /* @__PURE__ */ jsx7("div", { className: "mt-3 p-2 bg-gray-100 rounded", children: /* @__PURE__ */ jsxs5("p", { className: "text-sm text-gray-700", children: [
        processingResults.filter((r) => r.success).length,
        " of ",
        processingResults.length,
        " tools completed successfully"
      ] }) })
    ] }),
    approvalDialog && /* @__PURE__ */ jsx7(
      ApprovalDialog_default,
      {
        toolCalls: approvalDialog.toolCalls,
        reason: approvalDialog.reason,
        onApprove: () => handleApprovalDialogResponse(true),
        onDeny: () => handleApprovalDialogResponse(false),
        onCancel: handleApprovalDialogCancel
      }
    ),
    toasts.map((toast) => /* @__PURE__ */ jsx7(
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

// src/components/Chat.tsx
import { Fragment as Fragment3, jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
var ChatInput = ({ value, onChange, onSend, disabled, isStreaming, placeholder = "Type a message..." }) => {
  const { config } = useChatConfig();
  const theme = getThemeClasses(config.theme);
  const handleKeyPress = useCallback6((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);
  return /* @__PURE__ */ jsx8("div", { className: `border-t ${theme.border} ${theme.background} p-4`, children: /* @__PURE__ */ jsx8("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ jsx8("div", { className: "flex gap-3 items-end", children: /* @__PURE__ */ jsxs6("div", { className: "flex-1 relative", children: [
    /* @__PURE__ */ jsx8(
      "textarea",
      {
        value,
        onChange: (e) => onChange(e.target.value),
        onKeyPress: handleKeyPress,
        placeholder,
        rows: 1,
        className: `w-full resize-none rounded-xl border ${theme.border} px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme.background} ${theme.text} placeholder:${theme.textSecondary}`,
        style: { minHeight: "52px", maxHeight: "200px" },
        disabled
      }
    ),
    /* @__PURE__ */ jsx8(
      "button",
      {
        onClick: onSend,
        disabled: !value.trim() || disabled,
        className: "absolute right-2 bottom-2 p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center",
        children: isStreaming ? /* @__PURE__ */ jsx8(Square, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx8(Send, { className: "h-4 w-4" })
      }
    )
  ] }) }) }) });
};
var DebugToggle = ({ showDebug, onToggle }) => {
  return /* @__PURE__ */ jsxs6(
    "button",
    {
      onClick: onToggle,
      className: "flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",
      children: [
        showDebug ? /* @__PURE__ */ jsx8(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx8(Eye, { className: "h-4 w-4" }),
        "Debug"
      ]
    }
  );
};
var ChatContent = ({
  agentId,
  threadId,
  agent,
  tools,
  metadata,
  height = "600px",
  onThreadUpdate,
  className = ""
}) => {
  const [input, setInput] = useState9("");
  const messagesEndRef = useRef3(null);
  const { config, updateConfig } = useChatConfig();
  const theme = getThemeClasses(config.theme);
  const {
    messages,
    loading,
    error,
    isStreaming,
    sendMessageStream,
    cancelToolExecution,
    toolCallStatus,
    toolHandlerResults
  } = useChat2({
    agentId,
    threadId,
    agent,
    tools,
    metadata
  });
  const extractTextFromMessage = useCallback6((message) => {
    if (!message?.parts || !Array.isArray(message.parts)) {
      return "";
    }
    return message.parts.filter((part) => part?.kind === "text" && part?.text).map((part) => part.text).join("") || "";
  }, []);
  const shouldDisplayMessage = useCallback6((message) => {
    if (!message)
      return false;
    if (message.role === "user")
      return true;
    const textContent = extractTextFromMessage(message);
    if (textContent.trim())
      return true;
    if (message.metadata?.type === "assistant_response" && message.metadata.tool_calls) {
      return config.showDebugMessages || message.metadata.tool_calls.some(
        (tc) => toolCallStatus[tc.tool_call_id]?.status === "completed"
      );
    }
    if (message.metadata?.type) {
      return config.showDebugMessages;
    }
    return false;
  }, [extractTextFromMessage, config.showDebugMessages, toolCallStatus]);
  const scrollToBottom = useCallback6(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect7(() => {
    if (threadId && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, threadId, scrollToBottom]);
  const sendMessage = useCallback6(async () => {
    if (!input.trim() || loading || isStreaming)
      return;
    const messageText = input.trim();
    setInput("");
    try {
      await sendMessageStream(messageText);
      onThreadUpdate?.(threadId);
    } catch (error2) {
      console.error("Failed to send message:", error2);
      setInput(messageText);
    }
  }, [input, loading, isStreaming, sendMessageStream, onThreadUpdate, threadId]);
  const renderedMessages = useMemo3(() => {
    return messages.filter(shouldDisplayMessage).map((message, index) => {
      const timestamp = new Date(message.timestamp || Date.now());
      const messageText = extractTextFromMessage(message);
      const isUser = message.role === "user";
      if (isUser) {
        return /* @__PURE__ */ jsx8(
          UserMessage,
          {
            content: messageText,
            timestamp
          },
          message.messageId || `user-${index}`
        );
      }
      if (message.metadata?.type === "assistant_response" && message.metadata.tool_calls) {
        const toolCallsProps = message.metadata.tool_calls.map((toolCall) => {
          const status = toolCallStatus[toolCall.tool_call_id];
          return {
            toolCall,
            status: status?.status || "pending",
            result: status?.result,
            error: status?.error
          };
        });
        return /* @__PURE__ */ jsx8(
          AssistantWithToolCalls,
          {
            content: messageText,
            toolCalls: toolCallsProps,
            timestamp,
            isStreaming: isStreaming && index === messages.length - 1,
            metadata: message.metadata
          },
          message.messageId || `assistant-tools-${index}`
        );
      }
      return /* @__PURE__ */ jsx8(
        AssistantMessage,
        {
          content: messageText || "Empty message",
          timestamp,
          isStreaming: isStreaming && index === messages.length - 1,
          metadata: message.metadata
        },
        message.messageId || `assistant-${index}`
      );
    });
  }, [messages, shouldDisplayMessage, extractTextFromMessage, toolCallStatus, isStreaming]);
  return /* @__PURE__ */ jsxs6("div", { className: `flex flex-col ${theme.background} ${className}`, style: { height }, children: [
    /* @__PURE__ */ jsx8("div", { className: `flex-shrink-0 border-b ${theme.border} ${theme.background} p-4`, children: /* @__PURE__ */ jsxs6("div", { className: "max-w-4xl mx-auto flex items-center justify-between", children: [
      /* @__PURE__ */ jsx8("div", { children: agent && /* @__PURE__ */ jsxs6(Fragment3, { children: [
        /* @__PURE__ */ jsx8("h2", { className: `text-lg font-semibold ${theme.text}`, children: agent.name }),
        /* @__PURE__ */ jsx8("p", { className: `text-sm ${theme.textSecondary}`, children: agent.description })
      ] }) }),
      /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx8(
          DebugToggle,
          {
            showDebug: config.showDebugMessages,
            onToggle: () => updateConfig({ showDebugMessages: !config.showDebugMessages })
          }
        ),
        (loading || isStreaming) && /* @__PURE__ */ jsxs6("div", { className: "flex items-center text-blue-600", children: [
          /* @__PURE__ */ jsx8(Loader22, { className: "h-4 w-4 animate-spin mr-2" }),
          /* @__PURE__ */ jsx8("span", { className: "text-sm", children: "Processing..." })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs6("div", { className: `flex-1 overflow-y-auto ${theme.background}`, children: [
      error && /* @__PURE__ */ jsx8("div", { className: "max-w-4xl mx-auto px-4 py-4", children: /* @__PURE__ */ jsx8("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: /* @__PURE__ */ jsxs6("p", { className: "text-red-700", children: [
        "Error: ",
        error.message
      ] }) }) }),
      /* @__PURE__ */ jsx8("div", { className: "min-h-full", children: renderedMessages }),
      /* @__PURE__ */ jsx8("div", { ref: messagesEndRef })
    ] }),
    Object.keys(toolHandlerResults).length > 0 && /* @__PURE__ */ jsx8("div", { className: "flex-shrink-0 border-t border-gray-200 bg-gray-50 p-4", children: /* @__PURE__ */ jsx8("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ jsx8(
      ExternalToolManager_default,
      {
        toolCalls: Object.values(toolHandlerResults),
        onToolComplete: async (results) => {
          onThreadUpdate?.(threadId);
        },
        onCancel: cancelToolExecution
      }
    ) }) }),
    /* @__PURE__ */ jsx8(
      ChatInput,
      {
        value: input,
        onChange: setInput,
        onSend: sendMessage,
        disabled: loading,
        isStreaming
      }
    )
  ] });
};
var Chat = (props) => {
  return /* @__PURE__ */ jsx8(ChatProvider, { children: /* @__PURE__ */ jsx8(ChatContent, { ...props }) });
};
var Chat_default = Chat;
export {
  ApprovalDialog_default as ApprovalDialog,
  AssistantMessage,
  AssistantWithToolCalls,
  Chat_default as Chat,
  ChatProvider,
  DistriProvider,
  ExternalToolManager_default as ExternalToolManager,
  MessageContainer,
  MessageRenderer_default as MessageRenderer,
  Toast_default as Toast,
  Tool,
  UserMessage,
  clearPendingToolCalls,
  createBuiltinToolHandlers,
  getThemeClasses,
  initializeBuiltinHandlers,
  processExternalToolCalls,
  useAgent,
  useAgents,
  useChat,
  useChatConfig,
  useDistri,
  useDistriClient,
  useThreads
};
//# sourceMappingURL=index.mjs.map