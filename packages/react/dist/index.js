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
  ApprovalDialog: () => ApprovalDialog_default,
  AssistantMessage: () => AssistantMessage,
  AssistantWithToolCalls: () => AssistantWithToolCalls,
  Chat: () => Chat,
  ChatContainer: () => ChatContainer,
  ChatProvider: () => ChatProvider,
  DistriProvider: () => DistriProvider,
  EmbeddableChat: () => EmbeddableChat,
  ExternalToolManager: () => ExternalToolManager_default,
  FullChat: () => FullChat,
  MessageContainer: () => MessageContainer,
  MessageRenderer: () => MessageRenderer_default,
  PlanMessage: () => PlanMessage,
  Toast: () => Toast_default,
  Tool: () => Tool,
  UserMessage: () => UserMessage,
  clearPendingToolCalls: () => clearPendingToolCalls,
  createBuiltinToolHandlers: () => createBuiltinToolHandlers,
  createBuiltinTools: () => createBuiltinTools,
  createTool: () => createTool,
  extractTextFromMessage: () => extractTextFromMessage,
  formatTimestamp: () => formatTimestamp,
  getMessageType: () => getMessageType,
  getThemeClasses: () => getThemeClasses,
  initializeBuiltinHandlers: () => initializeBuiltinHandlers,
  processExternalToolCalls: () => processExternalToolCalls,
  scrollToBottom: () => scrollToBottom,
  shouldDisplayMessage: () => shouldDisplayMessage,
  useAgent: () => useAgent,
  useAgents: () => useAgents,
  useChat: () => useChat,
  useChatConfig: () => useChatConfig,
  useDistri: () => useDistri,
  useDistriClient: () => useDistriClient,
  useThreads: () => useThreads,
  useTools: () => useTools
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

// src/useAgent.ts
var import_react2 = __toESM(require("react"));
var import_core2 = require("@distri/core");
function useAgent({
  agentId,
  autoCreateAgent = true
}) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agent, setAgent] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  const agentRef = (0, import_react2.useRef)(null);
  const initializeAgent = (0, import_react2.useCallback)(async () => {
    if (!client || !agentId || agentRef.current)
      return;
    try {
      setLoading(true);
      setError(null);
      const newAgent = await import_core2.Agent.create(agentId, client);
      agentRef.current = newAgent;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create agent"));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);
  import_react2.default.useEffect(() => {
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
var import_react3 = require("react");
function useAgents() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = (0, import_react3.useState)([]);
  const [loading, setLoading] = (0, import_react3.useState)(true);
  const [error, setError] = (0, import_react3.useState)(null);
  const fetchAgents = (0, import_react3.useCallback)(async () => {
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
  const getAgent = (0, import_react3.useCallback)(async (agentId) => {
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
  (0, import_react3.useEffect)(() => {
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
var import_react4 = require("react");
var import_core3 = require("@distri/core");
function useChat({
  agentId,
  threadId,
  agent: providedAgent,
  metadata
}) {
  const { agent: internalAgent } = useAgent({
    agentId
  });
  const agent = providedAgent && typeof providedAgent.getThreadMessages === "function" ? providedAgent : internalAgent;
  const [messages, setMessages] = (0, import_react4.useState)([]);
  const [loading, setLoading] = (0, import_react4.useState)(false);
  const [error, setError] = (0, import_react4.useState)(null);
  const [isStreaming, setIsStreaming] = (0, import_react4.useState)(false);
  const abortControllerRef = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    setMessages([]);
    setError(null);
  }, [threadId]);
  const invokeConfig = (0, import_react4.useMemo)(() => {
    return {
      contextId: threadId,
      configuration: {
        acceptedOutputModes: ["text/plain"],
        blocking: false
      },
      metadata
    };
  }, [threadId, metadata]);
  const fetchMessages = (0, import_react4.useCallback)(async () => {
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
  (0, import_react4.useEffect)(() => {
    fetchMessages();
  }, [fetchMessages]);
  const handleToolCalls = (0, import_react4.useCallback)(async (toolCalls) => {
    if (!agent)
      return;
    const results = [];
    for (const toolCall of toolCalls) {
      const result = await agent.executeTool(toolCall);
      results.push(result);
    }
    if (results.length > 0) {
      const responseMessage = import_core3.DistriClient.initMessage([], "user", {
        contextId: threadId,
        metadata: {
          type: "tool_responses",
          results
        }
      });
      const params = import_core3.DistriClient.initMessageParams(
        responseMessage,
        invokeConfig.configuration,
        responseMessage.metadata
      );
      try {
        const stream = await agent.invokeStream(params);
        for await (const event of stream) {
          if (abortControllerRef.current?.signal.aborted)
            break;
          await handleStreamEvent(event);
        }
      } catch (err) {
        console.error("Error continuing conversation with tool results:", err);
      }
    }
  }, [agent, threadId, invokeConfig.configuration]);
  const handleStreamEvent = (0, import_react4.useCallback)(async (event) => {
    if (event.kind === "message") {
      const message = event;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.messageId === message.messageId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], parts: [...updated[idx].parts, ...message.parts] };
          return updated;
        } else {
          return [...prev, message];
        }
      });
      if (message.metadata?.type === "assistant_response" && message.metadata.tool_calls) {
        const toolCalls = message.metadata.tool_calls;
        await handleToolCalls(toolCalls);
      }
    } else if (event.kind === "status-update") {
      console.debug("Task status update:", event);
    }
  }, [handleToolCalls]);
  const sendMessage = (0, import_react4.useCallback)(async (input, metadata2) => {
    if (!agent)
      return;
    const userMessage = import_core3.DistriClient.initMessage(input, "user", { contextId: threadId, metadata: metadata2 });
    setMessages((prev) => [...prev, userMessage]);
    const params = import_core3.DistriClient.initMessageParams(userMessage, invokeConfig.configuration, metadata2);
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
  }, [agent, threadId, invokeConfig.configuration]);
  const sendMessageStream = (0, import_react4.useCallback)(async (input, metadata2) => {
    if (!agent)
      return;
    const userMessage = import_core3.DistriClient.initMessage(input, "user", { contextId: threadId, metadata: metadata2 });
    setMessages((prev) => [...prev, userMessage]);
    const params = import_core3.DistriClient.initMessageParams(userMessage, invokeConfig.configuration, metadata2);
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
        await handleStreamEvent(event);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError")
        return;
      setError(err instanceof Error ? err : new Error("Failed to stream message"));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [agent, threadId, invokeConfig.configuration, handleStreamEvent]);
  const clearMessages = (0, import_react4.useCallback)(() => {
    setMessages([]);
  }, []);
  const refreshMessages = (0, import_react4.useCallback)(async () => {
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
    agent: agent ? agent : null
  };
}

// src/useThreads.ts
var import_react5 = require("react");
function useThreads() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = (0, import_react5.useState)([]);
  const [loading, setLoading] = (0, import_react5.useState)(true);
  const [error, setError] = (0, import_react5.useState)(null);
  const fetchThreads = (0, import_react5.useCallback)(async () => {
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
  const fetchThread = (0, import_react5.useCallback)(async (threadId) => {
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
  const deleteThread = (0, import_react5.useCallback)(async (threadId) => {
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
  const updateThread = (0, import_react5.useCallback)(async (threadId, localId) => {
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
  (0, import_react5.useEffect)(() => {
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

// src/useTools.ts
var import_react6 = require("react");
function useTools({ agent }) {
  const toolsRef = (0, import_react6.useRef)(/* @__PURE__ */ new Set());
  const addTool = (0, import_react6.useCallback)((tool) => {
    if (!agent) {
      console.warn("Cannot add tool: no agent provided");
      return;
    }
    agent.addTool(tool);
    toolsRef.current.add(tool.name);
  }, [agent]);
  const addTools = (0, import_react6.useCallback)((tools) => {
    if (!agent) {
      console.warn("Cannot add tools: no agent provided");
      return;
    }
    tools.forEach((tool) => {
      agent.addTool(tool);
      toolsRef.current.add(tool.name);
    });
  }, [agent]);
  const removeTool = (0, import_react6.useCallback)((toolName) => {
    if (!agent) {
      console.warn("Cannot remove tool: no agent provided");
      return;
    }
    agent.removeTool(toolName);
    toolsRef.current.delete(toolName);
  }, [agent]);
  const executeTool = (0, import_react6.useCallback)(async (toolCall) => {
    if (!agent) {
      return {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: "No agent provided"
      };
    }
    return agent.executeTool(toolCall);
  }, [agent]);
  const getTools = (0, import_react6.useCallback)(() => {
    if (!agent)
      return [];
    return agent.getTools();
  }, [agent]);
  const hasTool = (0, import_react6.useCallback)((toolName) => {
    if (!agent)
      return false;
    return agent.hasTool(toolName);
  }, [agent]);
  return {
    addTool,
    addTools,
    removeTool,
    executeTool,
    getTools,
    hasTool
  };
}
var createTool = (name, description, parameters, handler) => ({
  name,
  description,
  parameters,
  handler
});
var createBuiltinTools = () => ({
  /**
   * Confirmation tool for user approval
   */
  confirm: createTool(
    "confirm",
    "Ask user for confirmation",
    {
      type: "object",
      properties: {
        message: { type: "string", description: "Message to show to user" },
        defaultValue: { type: "boolean", description: "Default value if user doesnt respond" }
      },
      required: ["message"]
    },
    async (input) => {
      const result = confirm(input.message);
      return { confirmed: result };
    }
  ),
  /**
   * Input request tool
   */
  input: createTool(
    "input",
    "Request text input from user",
    {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Prompt to show to user" },
        placeholder: { type: "string", description: "Placeholder text" }
      },
      required: ["prompt"]
    },
    async (input) => {
      const result = prompt(input.prompt, input.placeholder);
      return { input: result };
    }
  ),
  /**
   * Notification tool
   */
  notify: createTool(
    "notify",
    "Show notification to user",
    {
      type: "object",
      properties: {
        message: { type: "string", description: "Notification message" },
        type: { type: "string", enum: ["info", "success", "warning", "error"], description: "Notification type" }
      },
      required: ["message"]
    },
    async (input) => {
      console.log(`[${input.type || "info"}] ${input.message}`);
      return { notified: true };
    }
  )
});

// src/components/EmbeddableChat.tsx
var import_react10 = require("react");
var import_lucide_react3 = require("lucide-react");

// src/components/MessageComponents.tsx
var import_react9 = __toESM(require("react"));
var import_lucide_react2 = require("lucide-react");

// src/components/MessageRenderer.tsx
var import_react8 = __toESM(require("react"));
var import_react_markdown = __toESM(require("react-markdown"));
var import_react_syntax_highlighter = require("react-syntax-highlighter");
var import_prism = require("react-syntax-highlighter/dist/esm/styles/prism");
var import_lucide_react = require("lucide-react");

// src/components/ChatContext.tsx
var import_react7 = __toESM(require("react"));
var import_jsx_runtime2 = require("react/jsx-runtime");
var defaultConfig = {
  theme: "auto",
  showDebug: false,
  autoScroll: true,
  showTimestamps: true,
  enableMarkdown: true,
  enableCodeHighlighting: true
};
var ChatContext = (0, import_react7.createContext)(null);
var ChatProvider = ({
  children,
  config: initialConfig = {}
}) => {
  const [config, setConfig] = import_react7.default.useState({
    ...defaultConfig,
    ...initialConfig
  });
  const updateConfig = import_react7.default.useCallback((updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);
  const value = {
    config,
    updateConfig
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChatContext.Provider, { value, children });
};
var useChatConfig = () => {
  const context = (0, import_react7.useContext)(ChatContext);
  if (!context) {
    return {
      config: defaultConfig,
      updateConfig: () => {
      }
    };
  }
  return context;
};
var getThemeClasses = (theme) => {
  switch (theme) {
    case "dark":
      return "dark";
    case "light":
      return "";
    case "auto":
    default:
      return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "";
  }
};

// src/components/MessageRenderer.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var CodeBlock = ({ language, children, inline = false, isDark = false }) => {
  const [copied, setCopied] = import_react8.default.useState(false);
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
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { className: `px-1.5 py-0.5 rounded text-sm font-mono ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`, children });
  }
  const lineCount = children.split("\n").length;
  const shouldShowLineNumbers = lineCount > 4;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "relative my-4 rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center justify-between bg-gray-50 border-b border-gray-200 px-3 py-2 text-sm", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react.Code2, { className: "h-4 w-4 text-gray-500" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "font-medium text-gray-700", children: normalizedLanguage === "text" ? "Code" : normalizedLanguage.toUpperCase() }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "text-gray-500 text-xs", children: [
          lineCount,
          " ",
          lineCount === 1 ? "line" : "lines"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          onClick: handleCopy,
          className: "flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800",
          title: "Copy code",
          children: copied ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react.Check, { className: "h-3 w-3" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-xs", children: "Copied!" })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react.Copy, { className: "h-3 w-3" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-xs", children: "Copy" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "relative", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      import_react_syntax_highlighter.Prism,
      {
        style: isDark ? import_prism.vscDarkPlus : import_prism.oneLight,
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
  className = ""
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
  const hasMarkdownSyntax = (0, import_react8.useMemo)(() => {
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
  const looksLikeCode = (0, import_react8.useMemo)(() => {
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
  const detectLanguage = (0, import_react8.useMemo)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      CodeBlock,
      {
        language: detectLanguage,
        isDark,
        children: content
      }
    );
  }
  if (!hasMarkdownSyntax) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: `whitespace-pre-wrap break-words ${className}`, children: content });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: `prose prose-sm max-w-none ${isDark ? "prose-invert" : ""} ${className} break-words`, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    import_react_markdown.default,
    {
      components: {
        code({ className: className2, children }) {
          const match = /language-(\w+)/.exec(className2 || "");
          const language = match ? match[1] : "";
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("blockquote", { className: `border-l-4 pl-4 py-2 italic my-4 rounded-r ${isDark ? "border-blue-400 text-blue-200 bg-blue-900/20" : "border-blue-500 text-blue-700 bg-blue-50"}`, children });
        },
        // Enhanced table styling with overflow handling
        table({ children }) {
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "overflow-x-auto my-4", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("table", { className: `min-w-full border-collapse rounded-lg overflow-hidden ${isDark ? "border-gray-600" : "border-gray-300"}`, children }) });
        },
        th({ children }) {
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { className: `border px-4 py-2 font-semibold text-left ${isDark ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-gray-100"}`, children });
        },
        td({ children }) {
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: `border px-4 py-2 ${isDark ? "border-gray-600" : "border-gray-300"}`, children });
        }
      },
      children: content
    }
  ) });
};
var MessageRenderer_default = MessageRenderer;

// src/components/MessageComponents.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var MessageContainer = ({ children, align, className = "" }) => {
  const justifyClass = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: `flex ${justifyClass} w-full ${className} mb-4`, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-full max-w-4xl mx-auto px-4", children }) });
};
var PlanMessage = ({
  content,
  duration,
  timestamp,
  className = ""
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(MessageContainer, { align: "center", className: `bg-gray-800 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-start gap-4 py-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-600", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react2.Brain, { className: "h-4 w-4 text-white" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "text-sm font-medium text-white mb-1 flex items-center gap-2", children: [
        "Thought",
        duration ? ` for ${duration}s` : ""
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "prose prose-sm max-w-none prose-invert", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        MessageRenderer_default,
        {
          content,
          className: "text-white"
        }
      ) }),
      timestamp && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-xs text-gray-400 mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var UserMessage = ({
  content,
  timestamp,
  className = "",
  avatar
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(MessageContainer, { align: "center", className, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-start gap-4 py-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-600", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react2.User, { className: "h-4 w-4 text-white" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-sm font-medium text-white mb-1", children: "You" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "prose prose-sm max-w-none prose-invert", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        MessageRenderer_default,
        {
          content,
          className: "text-white"
        }
      ) }),
      timestamp && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-xs text-gray-400 mt-2", children: timestamp.toLocaleTimeString() })
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
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(MessageContainer, { align: "center", className: `bg-gray-800 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-start gap-4 py-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-600", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react2.Bot, { className: "h-4 w-4 text-white" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "text-sm font-medium text-white mb-1 flex items-center gap-2", children: [
        "Assistant",
        isStreaming && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-1 text-xs text-gray-400", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "prose prose-sm max-w-none prose-invert", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        MessageRenderer_default,
        {
          content,
          className: "text-white",
          metadata
        }
      ) }),
      timestamp && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-xs text-gray-400 mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var Tool = ({
  toolCall,
  status = "pending",
  result,
  error
}) => {
  const [isExpanded, setIsExpanded] = import_react9.default.useState(true);
  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react2.Clock, { className: "h-4 w-4 text-gray-400" });
      case "running":
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react2.Settings, { className: "h-4 w-4 text-blue-500 animate-spin" });
      case "completed":
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react2.CheckCircle, { className: "h-4 w-4 text-green-500" });
      case "error":
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react2.XCircle, { className: "h-4 w-4 text-red-500" });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react2.Clock, { className: "h-4 w-4 text-gray-400" });
    }
  };
  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "border-gray-600 bg-gray-800";
      case "running":
        return "border-blue-600 bg-blue-900";
      case "completed":
        return "border-green-600 bg-green-900";
      case "error":
        return "border-red-600 bg-red-900";
      default:
        return "border-gray-600 bg-gray-800";
    }
  };
  const toolName = "tool_name" in toolCall ? toolCall.tool_name : toolCall.tool_name;
  const toolId = "tool_call_id" in toolCall ? toolCall.tool_call_id : toolCall.tool_call_id;
  const input = "input" in toolCall ? toolCall.input : toolCall.args;
  const shouldShowExpand = input || result || error;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `border rounded-lg ${getStatusColor()}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "div",
      {
        className: "flex items-center gap-2 p-4 cursor-pointer hover:bg-gray-700 transition-colors",
        onClick: () => setIsExpanded(!isExpanded),
        children: [
          getStatusIcon(),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "font-medium text-sm text-white flex-1", children: toolName }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-xs text-gray-400 font-mono", children: toolId }),
          shouldShowExpand && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "text-gray-400 hover:text-white transition-colors", children: isExpanded ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }) })
        ]
      }
    ),
    isExpanded && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "px-4 pb-4 space-y-3", children: [
      input && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-xs font-medium text-gray-300 mb-1", children: "Input:" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-sm bg-gray-700 rounded border border-gray-600 p-2 font-mono text-white", children: typeof input === "string" ? input : JSON.stringify(input, null, 2) })
      ] }),
      result && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-xs font-medium text-gray-300 mb-1", children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-sm bg-gray-700 rounded border border-gray-600 p-2 font-mono text-white", children: typeof result === "string" ? result : JSON.stringify(result, null, 2) })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-xs font-medium text-red-400 mb-1", children: "Error:" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-sm bg-red-900 rounded border border-red-700 p-2 text-red-200", children: error })
      ] })
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
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(MessageContainer, { align: "center", className: `bg-gray-800 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-start gap-4 py-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-600", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react2.Bot, { className: "h-4 w-4 text-white" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "text-sm font-medium text-white mb-1 flex items-center gap-2", children: [
        "Assistant",
        isStreaming && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-1 text-xs text-gray-400", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      content && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "prose prose-sm max-w-none mb-4 prose-invert", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        MessageRenderer_default,
        {
          content,
          className: "text-white",
          metadata
        }
      ) }),
      toolCalls.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "space-y-3", children: toolCalls.map((toolCallProps, index) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Tool, { ...toolCallProps }, index)) }),
      timestamp && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-xs text-gray-400 mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};

// src/utils/messageUtils.ts
var extractTextFromMessage = (message) => {
  if (!message?.parts || !Array.isArray(message.parts)) {
    return "";
  }
  return message.parts.filter((part) => part?.kind === "text" && part?.text).map((part) => part.text).join("") || "";
};
var shouldDisplayMessage = (message, showDebugMessages = false) => {
  if (!message)
    return false;
  if (message.role === "user") {
    const textContent2 = extractTextFromMessage(message);
    return textContent2.trim().length > 0;
  }
  const textContent = extractTextFromMessage(message);
  if (textContent.trim())
    return true;
  if (message.metadata?.type === "assistant_response" && message.metadata.tool_calls) {
    return true;
  }
  if (message.metadata?.type === "plan" || message.metadata?.plan) {
    return true;
  }
  if (message.metadata?.type && message.metadata.type !== "assistant_response") {
    return showDebugMessages;
  }
  return false;
};
var getMessageType = (message) => {
  if (message.role === "user")
    return "user";
  if (message.metadata?.type === "assistant_response" && message.metadata.tool_calls) {
    return "assistant_with_tools";
  }
  if (message.metadata?.type === "plan" || message.metadata?.plan) {
    return "plan";
  }
  if (message.role === "assistant")
    return "assistant";
  return "system";
};
var formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
var scrollToBottom = (element, _behavior = "smooth") => {
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
};

// src/components/EmbeddableChat.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var EmbeddableChat = ({
  agentId,
  threadId = "default",
  agent,
  metadata,
  height = 500,
  placeholder = "Type your message...",
  className = "",
  UserMessageComponent = UserMessage,
  AssistantMessageComponent = AssistantMessage,
  AssistantWithToolCallsComponent = AssistantWithToolCalls,
  PlanMessageComponent = PlanMessage,
  theme = "dark",
  showDebug = false,
  onMessageSent,
  onResponse: _onResponse
  // Currently unused but reserved for future response handling
}) => {
  const [input, setInput] = (0, import_react10.useState)("");
  const messagesEndRef = (0, import_react10.useRef)(null);
  const messagesContainerRef = (0, import_react10.useRef)(null);
  const {
    messages,
    loading,
    error,
    isStreaming,
    sendMessageStream
  } = useChat({
    agentId,
    threadId,
    agent,
    metadata
  });
  const scrollToBottom2 = (0, import_react10.useCallback)(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);
  (0, import_react10.useEffect)(() => {
    if (messages.length > 0) {
      scrollToBottom2();
    }
  }, [messages, scrollToBottom2]);
  const sendMessage = (0, import_react10.useCallback)(async () => {
    if (!input.trim() || loading || isStreaming)
      return;
    const messageText = input.trim();
    setInput("");
    onMessageSent?.(messageText);
    try {
      await sendMessageStream(messageText);
    } catch (error2) {
      console.error("Failed to send message:", error2);
      setInput(messageText);
    }
  }, [input, loading, isStreaming, sendMessageStream, onMessageSent]);
  const handleKeyPress = (0, import_react10.useCallback)((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);
  const renderedMessages = (0, import_react10.useMemo)(() => {
    return messages.filter((message) => shouldDisplayMessage(message, showDebug)).map((message, index) => {
      const timestamp = new Date(message.timestamp || Date.now());
      const messageText = extractTextFromMessage(message);
      const messageType = getMessageType(message);
      const key = message.messageId || `${messageType}-${index}`;
      switch (messageType) {
        case "user":
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            UserMessageComponent,
            {
              content: messageText,
              timestamp
            },
            key
          );
        case "assistant_with_tools":
          const toolCallsProps = message.metadata.tool_calls?.map((toolCall) => ({
            toolCall,
            status: "completed",
            result: "Tool executed successfully",
            error: null
          })) || [];
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            AssistantWithToolCallsComponent,
            {
              content: messageText,
              toolCalls: toolCallsProps,
              timestamp,
              isStreaming: isStreaming && index === messages.length - 1,
              metadata: message.metadata
            },
            key
          );
        case "plan":
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            PlanMessageComponent,
            {
              content: messageText || message.metadata?.plan || "Planning...",
              duration: message.metadata?.duration,
              timestamp
            },
            key
          );
        case "assistant":
        default:
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            AssistantMessageComponent,
            {
              content: messageText || "Empty message",
              timestamp,
              isStreaming: isStreaming && index === messages.length - 1,
              metadata: message.metadata
            },
            key
          );
      }
    });
  }, [
    messages,
    showDebug,
    isStreaming,
    UserMessageComponent,
    AssistantMessageComponent,
    AssistantWithToolCallsComponent,
    PlanMessageComponent
  ]);
  const themeClass = theme === "auto" ? "" : theme;
  const containerHeight = typeof height === "number" ? `${height}px` : height;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "div",
    {
      className: `distri-chat ${themeClass} ${className}`,
      style: { height: containerHeight },
      children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "distri-chat-container", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "div",
          {
            ref: messagesContainerRef,
            className: "flex-1 overflow-y-auto distri-scroll p-4 space-y-4",
            children: [
              error && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-lg", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "text-red-600 dark:text-red-400 text-sm", children: [
                "Error: ",
                error.message
              ] }) }),
              messages.length === 0 && !loading && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "flex-1 flex items-center justify-center py-12", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "text-center max-w-sm", children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.Send, { className: "h-6 w-6 text-blue-600 dark:text-blue-400" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { className: "text-lg font-medium text-gray-900 dark:text-gray-100 mb-2", children: "Start a conversation" }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Send a message to begin chatting with the AI assistant." })
              ] }) }),
              renderedMessages,
              (loading || isStreaming) && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center space-x-2 text-gray-500 dark:text-gray-400 p-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.Loader2, { className: "h-4 w-4 animate-spin" }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "text-sm", children: "AI is thinking..." })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { ref: messagesEndRef })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "border-t border-gray-200 dark:border-gray-700 p-4", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "flex items-center space-x-2", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex-1 relative", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "textarea",
            {
              value: input,
              onChange: (e) => setInput(e.target.value),
              onKeyPress: handleKeyPress,
              placeholder,
              rows: 1,
              className: "distri-input w-full resize-none px-4 py-3 pr-12 text-sm min-h-[52px] max-h-32",
              disabled: loading || isStreaming,
              style: {
                minHeight: "52px",
                maxHeight: "128px"
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "button",
            {
              onClick: sendMessage,
              disabled: !input.trim() || loading || isStreaming,
              className: "absolute right-2 top-1/2 transform -translate-y-1/2 p-2 distri-button-primary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity",
              children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.Send, { className: "h-4 w-4" })
            }
          )
        ] }) }) })
      ] })
    }
  );
};

// src/components/FullChat.tsx
var import_react11 = require("react");
var import_lucide_react4 = require("lucide-react");
var import_jsx_runtime6 = require("react/jsx-runtime");
var ThreadItem = ({
  thread,
  isActive,
  onClick,
  onDelete,
  onRename
}) => {
  const [isEditing, setIsEditing] = (0, import_react11.useState)(false);
  const [editTitle, setEditTitle] = (0, import_react11.useState)(thread.title || "New Chat");
  const [showMenu, setShowMenu] = (0, import_react11.useState)(false);
  const handleRename = (0, import_react11.useCallback)(() => {
    if (editTitle.trim() && editTitle !== thread.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  }, [editTitle, thread.title, onRename]);
  const handleKeyPress = (0, import_react11.useCallback)((e) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditTitle(thread.title || "New Chat");
      setIsEditing(false);
    }
  }, [handleRename, thread.title]);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    "div",
    {
      className: `group relative p-3 rounded-lg cursor-pointer transition-colors ${isActive ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`,
      onClick,
      children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center space-x-3 flex-1 min-w-0", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.MessageSquare, { className: `h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : "text-white/60"}` }),
          isEditing ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "input",
            {
              value: editTitle,
              onChange: (e) => setEditTitle(e.target.value),
              onBlur: handleRename,
              onKeyPress: handleKeyPress,
              className: "flex-1 text-sm bg-transparent border-none outline-none text-white",
              autoFocus: true,
              onClick: (e) => e.stopPropagation()
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: `text-sm font-medium truncate ${isActive ? "text-white" : "text-white/90"}`, children: thread.title || "New Chat" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-xs text-white/60 truncate", children: thread.last_message || "No messages yet" })
          ] })
        ] }),
        !isEditing && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "relative", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              },
              className: "opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity",
              children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.MoreHorizontal, { className: "h-4 w-4 text-white/60" })
            }
          ),
          showMenu && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "absolute right-0 top-6 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setShowMenu(false);
                },
                className: "w-full text-left px-3 py-2 text-sm hover:bg-gray-700 text-white flex items-center space-x-2 rounded-t-lg",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.Edit3, { className: "h-3 w-3" }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "Rename" })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                },
                className: "w-full text-left px-3 py-2 text-sm hover:bg-gray-700 text-red-400 flex items-center space-x-2 rounded-b-lg",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.Trash2, { className: "h-3 w-3" }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "Delete" })
                ]
              }
            )
          ] })
        ] })
      ] })
    }
  );
};
var FullChat = ({
  agentId,
  agent,
  metadata,
  className = "",
  availableAgents = [],
  UserMessageComponent,
  AssistantMessageComponent,
  AssistantWithToolCallsComponent,
  PlanMessageComponent,
  theme = "dark",
  showDebug = false,
  showSidebar = true,
  sidebarWidth = 280,
  currentPage = "chat",
  onPageChange,
  onAgentSelect,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
  onLogoClick
}) => {
  const [selectedThreadId, setSelectedThreadId] = (0, import_react11.useState)("default");
  const { threads, loading: threadsLoading, refetch: refetchThreads } = useThreads();
  const handleNewChat = (0, import_react11.useCallback)(() => {
    const newThreadId = `thread-${Date.now()}`;
    setSelectedThreadId(newThreadId);
    onThreadCreate?.(newThreadId);
  }, [onThreadCreate]);
  const handleThreadSelect = (0, import_react11.useCallback)((threadId) => {
    setSelectedThreadId(threadId);
    onThreadSelect?.(threadId);
  }, [onThreadSelect]);
  const handleThreadDelete = (0, import_react11.useCallback)((threadId) => {
    if (threadId === selectedThreadId) {
      const remainingThreads = threads.filter((t) => t.id !== threadId);
      if (remainingThreads.length > 0) {
        setSelectedThreadId(remainingThreads[0].id);
      } else {
        handleNewChat();
      }
    }
    onThreadDelete?.(threadId);
    refetchThreads();
  }, [selectedThreadId, threads, handleNewChat, onThreadDelete, refetchThreads]);
  const handleThreadRename = (0, import_react11.useCallback)((threadId, newTitle) => {
    console.log("Rename thread", threadId, "to", newTitle);
    refetchThreads();
  }, [refetchThreads]);
  const themeClass = theme === "auto" ? "" : theme;
  const sidebarStyle = {
    width: showSidebar ? `${sidebarWidth}px` : "0px"
  };
  const mainStyle = {
    marginLeft: showSidebar ? `${sidebarWidth}px` : "0px"
  };
  const currentAgent = availableAgents.find((a) => a.id === agentId);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: `distri-chat ${themeClass} ${className} h-full flex bg-gray-900`, children: [
    showSidebar && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
      "div",
      {
        className: "fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-800 flex flex-col",
        style: sidebarStyle,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "p-4", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
            "button",
            {
              onClick: onLogoClick,
              className: "flex items-center space-x-2 text-white hover:bg-white/10 rounded-lg p-2 transition-colors w-full",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.Bot, { className: "h-6 w-6" }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "font-semibold", children: "Distri" })
              ]
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "px-4 pb-4", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
            "button",
            {
              onClick: handleNewChat,
              className: "w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.Plus, { className: "h-4 w-4" }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-sm font-medium", children: "New Chat" })
              ]
            }
          ) }),
          availableAgents.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "px-4 pb-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-xs text-white/60 mb-2 px-2", children: "Agent" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "select",
              {
                value: agentId,
                onChange: (e) => onAgentSelect?.(e.target.value),
                className: "w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                children: availableAgents.map((agent2) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: agent2.id, children: agent2.name }, agent2.id))
              }
            ),
            currentAgent?.description && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-xs text-white/50 mt-1 px-2", children: currentAgent.description })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "px-4 pb-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-xs text-white/60 mb-2 px-2", children: "Navigation" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "space-y-1", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
                "button",
                {
                  onClick: () => onPageChange?.("chat"),
                  className: `w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentPage === "chat" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.MessageSquare, { className: "h-4 w-4" }),
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "Chat" })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
                "button",
                {
                  onClick: () => onPageChange?.("agents"),
                  className: `w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentPage === "agents" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.Users, { className: "h-4 w-4" }),
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "Agents" })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
                "button",
                {
                  onClick: () => onPageChange?.("tasks"),
                  className: `w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentPage === "tasks" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.BarChart3, { className: "h-4 w-4" }),
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "Tasks" })
                  ]
                }
              )
            ] })
          ] }),
          currentPage === "chat" && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex-1 overflow-y-auto px-4 space-y-2 distri-scroll", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-xs text-white/60 mb-2 px-2", children: "Conversations" }),
            threadsLoading ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-center py-8", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-sm text-white/60", children: "Loading threads..." }) }) : threads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "text-center py-8", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.MessageSquare, { className: "h-8 w-8 text-white/30 mx-auto mb-2" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-sm text-white/60", children: "No conversations yet" })
            ] }) : threads.map((thread) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              ThreadItem,
              {
                thread,
                isActive: thread.id === selectedThreadId,
                onClick: () => handleThreadSelect(thread.id),
                onDelete: () => handleThreadDelete(thread.id),
                onRename: (newTitle) => handleThreadRename(thread.id, newTitle)
              },
              thread.id
            ))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "p-4 border-t border-gray-800", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { className: "w-full flex items-center space-x-3 px-3 py-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.Settings, { className: "h-4 w-4" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-sm", children: "Settings" })
          ] }) })
        ]
      }
    ),
    currentPage === "chat" && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "flex-1", style: mainStyle, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      EmbeddableChat,
      {
        agentId,
        threadId: selectedThreadId,
        agent,
        metadata,
        height: "100vh",
        UserMessageComponent,
        AssistantMessageComponent,
        AssistantWithToolCallsComponent,
        PlanMessageComponent,
        theme,
        showDebug,
        placeholder: "Type your message..."
      }
    ) })
  ] });
};

// src/components/ChatContainer.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var ChatContainer = ({
  variant = "embedded",
  height = 500,
  theme = "auto",
  showDebug = false,
  placeholder = "Type your message...",
  ...props
}) => {
  if (variant === "full") {
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      FullChat,
      {
        ...props,
        theme,
        showDebug
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    EmbeddableChat,
    {
      ...props,
      height,
      theme,
      showDebug,
      placeholder
    }
  );
};

// src/components/ApprovalDialog.tsx
var import_react12 = require("react");
var import_lucide_react5 = require("lucide-react");
var import_jsx_runtime8 = require("react/jsx-runtime");
var ApprovalDialog = ({
  toolCalls,
  reason,
  onApprove,
  onDeny,
  onCancel
}) => {
  const [isVisible, setIsVisible] = (0, import_react12.useState)(true);
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
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full mx-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center p-4 border-b border-gray-200", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react5.AlertTriangle, { className: "w-6 h-6 text-yellow-500 mr-3" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-lg font-semibold text-gray-900", children: "Tool Execution Approval" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "p-4", children: [
      reason && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "mb-4", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm text-gray-700", children: reason }) }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "Tools to execute:" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "space-y-2", children: toolCalls.map((toolCall) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "flex items-center p-2 bg-gray-50 rounded", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm font-medium text-gray-900", children: toolCall.tool_name }),
          toolCall.input && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xs text-gray-600 mt-1", children: typeof toolCall.input === "string" ? toolCall.input : JSON.stringify(toolCall.input) })
        ] }) }, toolCall.tool_call_id)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex space-x-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "button",
          {
            onClick: handleApprove,
            className: "flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react5.CheckCircle, { className: "w-4 h-4 mr-2" }),
              "Approve"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "button",
          {
            onClick: handleDeny,
            className: "flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react5.XCircle, { className: "w-4 h-4 mr-2" }),
              "Deny"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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

// src/components/Toast.tsx
var import_react13 = require("react");
var import_lucide_react6 = require("lucide-react");
var import_jsx_runtime9 = require("react/jsx-runtime");
var Toast = ({
  message,
  type = "info",
  duration = 3e3,
  onClose
}) => {
  const [isVisible, setIsVisible] = (0, import_react13.useState)(true);
  (0, import_react13.useEffect)(() => {
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
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react6.CheckCircle, { className: "w-5 h-5 text-green-500" });
      case "error":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react6.XCircle, { className: "w-5 h-5 text-red-500" });
      case "warning":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react6.AlertTriangle, { className: "w-5 h-5 text-yellow-500" });
      case "info":
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react6.Info, { className: "w-5 h-5 text-blue-500" });
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
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: `fixed top-4 right-4 z-50 max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-start p-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex-shrink-0", children: getIcon() }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "ml-3 flex-1", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm font-medium text-gray-900", children: message }) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "ml-4 flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "button",
      {
        onClick: () => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        },
        className: "inline-flex text-gray-400 hover:text-gray-600 focus:outline-none",
        children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react6.X, { className: "w-4 h-4" })
      }
    ) })
  ] }) });
};
var Toast_default = Toast;

// src/components/Chat.tsx
var import_react14 = require("react");
var import_lucide_react7 = require("lucide-react");
var import_jsx_runtime10 = require("react/jsx-runtime");
var ChatInput = ({ value, onChange, onSend, disabled, isStreaming, placeholder = "Type a message..." }) => {
  const handleKeyPress = (0, import_react14.useCallback)((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "border-t border-gray-700 bg-gray-900 p-4", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "flex gap-3 items-end", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex-1 relative flex gap-2 items-center", children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      "textarea",
      {
        value,
        onChange: (e) => onChange(e.target.value),
        onKeyPress: handleKeyPress,
        placeholder,
        rows: 1,
        className: "w-full resize-none rounded-xl border border-gray-600 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400",
        style: { minHeight: "52px", maxHeight: "200px" },
        disabled
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      "button",
      {
        onClick: onSend,
        disabled: !value.trim() || disabled,
        className: "absolute right-3 h-12 w-12 bottom-3 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center",
        children: isStreaming ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react7.Square, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react7.Send, { className: "h-4 w-4" })
      }
    )
  ] }) }) }) });
};
var DebugToggle = ({ showDebug, onToggle }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    "button",
    {
      onClick: onToggle,
      className: "flex items-center gap-2 px-3 py-1 text-sm border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors text-white",
      children: [
        showDebug ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react7.EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react7.Eye, { className: "h-4 w-4" }),
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
  placeholder = "Type a message...",
  UserMessageComponent = UserMessage,
  AssistantMessageComponent = AssistantMessage,
  AssistantWithToolCallsComponent = AssistantWithToolCalls,
  PlanMessageComponent = PlanMessage,
  onExternalToolCall
}) => {
  const [input, setInput] = (0, import_react14.useState)("");
  const messagesEndRef = (0, import_react14.useRef)(null);
  const { config, updateConfig } = useChatConfig();
  const {
    messages,
    loading,
    error,
    isStreaming,
    sendMessageStream
  } = useChat({
    agentId,
    threadId,
    agent,
    metadata
  });
  (0, import_react14.useEffect)(() => {
    if (tools && onExternalToolCall) {
      console.warn("Legacy tools prop detected. Consider migrating to the new useTools hook for better performance.");
    }
  }, [tools, onExternalToolCall]);
  const extractTextFromMessage2 = (0, import_react14.useCallback)((message) => {
    if (!message?.parts || !Array.isArray(message.parts)) {
      return "";
    }
    return message.parts.filter((part) => part?.kind === "text" && part?.text).map((part) => part.text).join("") || "";
  }, []);
  const shouldDisplayMessage2 = (0, import_react14.useCallback)((message) => {
    if (!message)
      return false;
    if (message.role === "user") {
      const textContent2 = extractTextFromMessage2(message);
      return textContent2.trim().length > 0;
    }
    const textContent = extractTextFromMessage2(message);
    if (textContent.trim())
      return true;
    if (message.metadata?.type === "assistant_response" && message.metadata.tool_calls) {
      return true;
    }
    if (message.metadata?.type === "plan" || message.metadata?.plan) {
      return true;
    }
    if (message.metadata?.type && message.metadata.type !== "assistant_response") {
      return config.showDebug;
    }
    return false;
  }, [extractTextFromMessage2, config.showDebug]);
  const scrollToBottom2 = (0, import_react14.useCallback)(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  (0, import_react14.useEffect)(() => {
    if (threadId && messages.length > 0) {
      scrollToBottom2();
    }
  }, [messages, threadId, scrollToBottom2]);
  const sendMessage = (0, import_react14.useCallback)(async () => {
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
  const renderedMessages = (0, import_react14.useMemo)(() => {
    return messages.filter(shouldDisplayMessage2).map((message, index) => {
      const timestamp = new Date(message.timestamp || Date.now());
      const messageText = extractTextFromMessage2(message);
      const isUser = message.role === "user";
      if (isUser) {
        return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          UserMessageComponent,
          {
            content: messageText,
            timestamp
          },
          message.messageId || `user-${index}`
        );
      }
      if (message.metadata?.type === "assistant_response" && message.metadata.tool_calls) {
        const toolCallsProps = message.metadata.tool_calls.map((toolCall) => ({
          toolCall,
          status: "completed",
          // Tools are executed immediately now
          result: "Tool executed successfully",
          error: null
        }));
        return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          AssistantWithToolCallsComponent,
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
      if (message.metadata?.type === "plan" || message.metadata?.plan) {
        return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          PlanMessageComponent,
          {
            content: messageText || message.metadata?.plan || "Planning...",
            duration: message.metadata?.duration,
            timestamp
          },
          message.messageId || `plan-${index}`
        );
      }
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        AssistantMessageComponent,
        {
          content: messageText || "Empty message",
          timestamp,
          isStreaming: isStreaming && index === messages.length - 1,
          metadata: message.metadata
        },
        message.messageId || `assistant-${index}`
      );
    });
  }, [messages, shouldDisplayMessage2, extractTextFromMessage2, isStreaming, UserMessageComponent, AssistantMessageComponent, AssistantWithToolCallsComponent, PlanMessageComponent]);
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-col bg-gray-900 text-white", style: { height }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "flex-shrink-0 border-b border-gray-700 bg-gray-900 p-4", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "max-w-4xl mx-auto flex items-center justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { children: agent && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h2", { className: "text-lg font-semibold text-white", children: agent.name }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "text-sm text-gray-400", children: agent.description })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          DebugToggle,
          {
            showDebug: config.showDebug,
            onToggle: () => updateConfig({ showDebug: !config.showDebug })
          }
        ),
        (loading || isStreaming) && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-center text-blue-400", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react7.Loader2, { className: "h-4 w-4 animate-spin mr-2" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "text-sm", children: "Processing..." })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex-1 overflow-y-auto bg-gray-900", children: [
      error && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "max-w-4xl mx-auto px-4 py-4", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "bg-red-900 border border-red-700 rounded-lg p-4", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: "text-red-200", children: [
        "Error: ",
        error.message
      ] }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "min-h-full", children: messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "text-center max-w-2xl mx-auto px-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react7.Bot, { className: "h-8 w-8 text-white" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h1", { className: "text-2xl font-semibold text-white mb-2", children: agent?.name || "Assistant" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "text-gray-400 text-lg mb-8", children: agent?.description || "How can I help you today?" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "text-sm text-gray-500", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: "Start a conversation by typing a message below." }) })
      ] }) }) : renderedMessages }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { ref: messagesEndRef })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      ChatInput,
      {
        value: input,
        onChange: setInput,
        onSend: sendMessage,
        disabled: loading,
        isStreaming,
        placeholder
      }
    )
  ] });
};
var Chat = (props) => {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ChatProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ChatContent, { ...props }) });
};

// src/components/ExternalToolManager.tsx
var import_react15 = require("react");
var import_lucide_react8 = require("lucide-react");

// src/builtinHandlers.ts
var import_core4 = require("@distri/core");
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
  [import_core4.APPROVAL_REQUEST_TOOL_NAME]: async (toolCall, onToolComplete) => {
    try {
      const input = typeof toolCall.input === "string" ? JSON.parse(toolCall.input) : toolCall.input;
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
      await onToolComplete(toolCall.tool_call_id, result);
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
      await onToolComplete(toolCall.tool_call_id, result);
      return null;
    }
  },
  // Toast handler - shows a toast and returns success
  toast: async (toolCall, onToolComplete) => {
    try {
      const input = typeof toolCall.input === "string" ? JSON.parse(toolCall.input) : toolCall.input;
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
      await onToolComplete(toolCall.tool_call_id, result);
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
      await onToolComplete(toolCall.tool_call_id, result);
      return null;
    }
  },
  // Input request handler - shows prompt
  input_request: async (toolCall, onToolComplete) => {
    try {
      const input = typeof toolCall.input === "string" ? JSON.parse(toolCall.input) : toolCall.input;
      const prompt2 = input.prompt || "Please provide input:";
      const defaultValue = input.default || "";
      const userInput = window.prompt(prompt2, defaultValue);
      if (userInput === null) {
        const result2 = {
          tool_call_id: toolCall.tool_call_id,
          result: null,
          success: false,
          error: "User cancelled input"
        };
        await onToolComplete(toolCall.tool_call_id, result2);
        return null;
      }
      const result = {
        tool_call_id: toolCall.tool_call_id,
        result: { input: userInput },
        success: true
      };
      await onToolComplete(toolCall.tool_call_id, result);
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
      await onToolComplete(toolCall.tool_call_id, result);
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
      const singleToolComplete = async (_toolCallId, result) => {
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
var import_jsx_runtime11 = require("react/jsx-runtime");
var ExternalToolManager = ({
  toolCalls,
  onToolComplete,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = (0, import_react15.useState)(false);
  const [toasts, setToasts] = (0, import_react15.useState)([]);
  const [approvalDialog, setApprovalDialog] = (0, import_react15.useState)(null);
  const [processingResults, setProcessingResults] = (0, import_react15.useState)([]);
  (0, import_react15.useEffect)(() => {
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
  (0, import_react15.useEffect)(() => {
    if (toolCalls.length > 0 && !isProcessing) {
      processToolCalls();
    }
  }, [toolCalls]);
  const processToolCalls = (0, import_react15.useCallback)(async () => {
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
  const handleApprovalDialogResponse = (0, import_react15.useCallback)((approved) => {
    if (approvalDialog) {
      approvalDialog.resolve(approved);
      setApprovalDialog(null);
    }
  }, [approvalDialog]);
  const handleApprovalDialogCancel = (0, import_react15.useCallback)(() => {
    if (approvalDialog) {
      approvalDialog.resolve(false);
      setApprovalDialog(null);
    }
  }, [approvalDialog]);
  const removeToast = (0, import_react15.useCallback)((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  if (toolCalls.length === 0)
    return null;
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "my-4 p-4 border border-blue-200 bg-blue-50 rounded-lg", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_lucide_react8.Loader2, { className: `w-5 h-5 text-blue-600 ${isProcessing ? "animate-spin" : ""}` }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "font-semibold text-blue-800", children: isProcessing ? "Processing External Tools..." : "External Tools Completed" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
          "button",
          {
            onClick: onCancel,
            className: "flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_lucide_react8.X, { className: "w-4 h-4" }),
              "Cancel"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "space-y-2", children: toolCalls.map((toolCall) => {
        const result = processingResults.find((r) => r.tool_call_id === toolCall.tool_call_id);
        const status = result ? result.success ? "completed" : "error" : isProcessing ? "processing" : "pending";
        return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "flex items-center justify-between p-2 bg-white rounded border", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "font-medium", children: toolCall.tool_name }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: `text-sm ${status === "completed" ? "text-green-600" : status === "error" ? "text-red-600" : status === "processing" ? "text-blue-600" : "text-gray-500"}`, children: status })
          ] }),
          result && !result.success && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "text-xs text-red-600", children: result.error })
        ] }, toolCall.tool_call_id);
      }) }),
      processingResults.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "mt-3 p-2 bg-gray-100 rounded", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { className: "text-sm text-gray-700", children: [
        processingResults.filter((r) => r.success).length,
        " of ",
        processingResults.length,
        " tools completed successfully"
      ] }) })
    ] }),
    approvalDialog && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      ApprovalDialog_default,
      {
        toolCalls: approvalDialog.toolCalls,
        reason: approvalDialog.reason,
        onApprove: () => handleApprovalDialogResponse(true),
        onDeny: () => handleApprovalDialogResponse(false),
        onCancel: handleApprovalDialogCancel
      }
    ),
    toasts.map((toast) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApprovalDialog,
  AssistantMessage,
  AssistantWithToolCalls,
  Chat,
  ChatContainer,
  ChatProvider,
  DistriProvider,
  EmbeddableChat,
  ExternalToolManager,
  FullChat,
  MessageContainer,
  MessageRenderer,
  PlanMessage,
  Toast,
  Tool,
  UserMessage,
  clearPendingToolCalls,
  createBuiltinToolHandlers,
  createBuiltinTools,
  createTool,
  extractTextFromMessage,
  formatTimestamp,
  getMessageType,
  getThemeClasses,
  initializeBuiltinHandlers,
  processExternalToolCalls,
  scrollToBottom,
  shouldDisplayMessage,
  useAgent,
  useAgents,
  useChat,
  useChatConfig,
  useDistri,
  useDistriClient,
  useThreads,
  useTools
});
//# sourceMappingURL=index.js.map