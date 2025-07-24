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
  ChatProvider: () => ChatProvider,
  DistriProvider: () => DistriProvider,
  ExternalToolManager: () => ExternalToolManager_default,
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
  getThemeClasses: () => getThemeClasses,
  initializeBuiltinHandlers: () => initializeBuiltinHandlers,
  processExternalToolCalls: () => processExternalToolCalls,
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
  const abortControllerRef = (0, import_react4.useRef)(null);
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

// src/components/Chat.tsx
var import_react10 = require("react");
var import_lucide_react3 = require("lucide-react");

// src/components/ChatContext.tsx
var import_react7 = __toESM(require("react"));
var import_jsx_runtime2 = require("react/jsx-runtime");
var defaultConfig = {
  theme: "chatgpt",
  showDebugMessages: false,
  enableCodeHighlighting: true,
  enableMarkdown: true,
  maxMessageWidth: "80%",
  borderRadius: "2xl",
  spacing: "4"
};
var ChatContext = (0, import_react7.createContext)(null);
function ChatProvider({ children, config: initialConfig }) {
  const [config, setConfig] = import_react7.default.useState({
    ...defaultConfig,
    ...initialConfig
  });
  const updateConfig = import_react7.default.useCallback((updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChatContext.Provider, { value: { config, updateConfig }, children });
}
function useChatConfig() {
  const context = (0, import_react7.useContext)(ChatContext);
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
var import_react9 = __toESM(require("react"));
var import_lucide_react2 = require("lucide-react");

// src/components/MessageRenderer.tsx
var import_react8 = __toESM(require("react"));
var import_react_markdown = __toESM(require("react-markdown"));
var import_react_syntax_highlighter = require("react-syntax-highlighter");
var import_prism = require("react-syntax-highlighter/dist/esm/styles/prism");
var import_lucide_react = require("lucide-react");
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

// src/components/Chat.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var ChatInput = ({ value, onChange, onSend, disabled, isStreaming, placeholder = "Type a message..." }) => {
  const handleKeyPress = (0, import_react10.useCallback)((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "border-t border-gray-700 bg-gray-900 p-4", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "flex gap-3 items-end", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex-1 relative flex gap-2 items-center", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "button",
      {
        onClick: onSend,
        disabled: !value.trim() || disabled,
        className: "absolute right-3 h-12 w-12 bottom-3 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center",
        children: isStreaming ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.Square, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.Send, { className: "h-4 w-4" })
      }
    )
  ] }) }) }) });
};
var DebugToggle = ({ showDebug, onToggle }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
    "button",
    {
      onClick: onToggle,
      className: "flex items-center gap-2 px-3 py-1 text-sm border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors text-white",
      children: [
        showDebug ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.Eye, { className: "h-4 w-4" }),
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
  const [input, setInput] = (0, import_react10.useState)("");
  const messagesEndRef = (0, import_react10.useRef)(null);
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
  (0, import_react10.useEffect)(() => {
    if (tools && onExternalToolCall) {
      console.warn("Legacy tools prop detected. Consider migrating to the new useTools hook for better performance.");
    }
  }, [tools, onExternalToolCall]);
  const extractTextFromMessage = (0, import_react10.useCallback)((message) => {
    if (!message?.parts || !Array.isArray(message.parts)) {
      return "";
    }
    return message.parts.filter((part) => part?.kind === "text" && part?.text).map((part) => part.text).join("") || "";
  }, []);
  const shouldDisplayMessage = (0, import_react10.useCallback)((message) => {
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
      return config.showDebugMessages;
    }
    return false;
  }, [extractTextFromMessage, config.showDebugMessages]);
  const scrollToBottom = (0, import_react10.useCallback)(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  (0, import_react10.useEffect)(() => {
    if (threadId && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, threadId, scrollToBottom]);
  const sendMessage = (0, import_react10.useCallback)(async () => {
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
  const renderedMessages = (0, import_react10.useMemo)(() => {
    return messages.filter(shouldDisplayMessage).map((message, index) => {
      const timestamp = new Date(message.timestamp || Date.now());
      const messageText = extractTextFromMessage(message);
      const isUser = message.role === "user";
      if (isUser) {
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          PlanMessageComponent,
          {
            content: messageText || message.metadata?.plan || "Planning...",
            duration: message.metadata?.duration,
            timestamp
          },
          message.messageId || `plan-${index}`
        );
      }
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
  }, [messages, shouldDisplayMessage, extractTextFromMessage, isStreaming, UserMessageComponent, AssistantMessageComponent, AssistantWithToolCallsComponent, PlanMessageComponent]);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex flex-col bg-gray-900 text-white", style: { height }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "flex-shrink-0 border-b border-gray-700 bg-gray-900 p-4", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "max-w-4xl mx-auto flex items-center justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { children: agent && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: "text-lg font-semibold text-white", children: agent.name }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "text-sm text-gray-400", children: agent.description })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          DebugToggle,
          {
            showDebug: config.showDebugMessages,
            onToggle: () => updateConfig({ showDebugMessages: !config.showDebugMessages })
          }
        ),
        (loading || isStreaming) && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center text-blue-400", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.Loader2, { className: "h-4 w-4 animate-spin mr-2" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "text-sm", children: "Processing..." })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex-1 overflow-y-auto bg-gray-900", children: [
      error && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "max-w-4xl mx-auto px-4 py-4", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "bg-red-900 border border-red-700 rounded-lg p-4", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "text-red-200", children: [
        "Error: ",
        error.message
      ] }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "min-h-full", children: messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "text-center max-w-2xl mx-auto px-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.Bot, { className: "h-8 w-8 text-white" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h1", { className: "text-2xl font-semibold text-white mb-2", children: agent?.name || "Assistant" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "text-gray-400 text-lg mb-8", children: agent?.description || "How can I help you today?" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "text-sm text-gray-500", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: "Start a conversation by typing a message below." }) })
      ] }) }) : renderedMessages }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { ref: messagesEndRef })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChatProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChatContent, { ...props }) });
};

// src/components/ExternalToolManager.tsx
var import_react13 = require("react");
var import_lucide_react6 = require("lucide-react");

// src/components/Toast.tsx
var import_react11 = require("react");
var import_lucide_react4 = require("lucide-react");
var import_jsx_runtime6 = require("react/jsx-runtime");
var Toast = ({
  message,
  type = "info",
  duration = 3e3,
  onClose
}) => {
  const [isVisible, setIsVisible] = (0, import_react11.useState)(true);
  (0, import_react11.useEffect)(() => {
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
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.CheckCircle, { className: "w-5 h-5 text-green-500" });
      case "error":
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.XCircle, { className: "w-5 h-5 text-red-500" });
      case "warning":
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.AlertTriangle, { className: "w-5 h-5 text-yellow-500" });
      case "info":
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.Info, { className: "w-5 h-5 text-blue-500" });
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
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: `fixed top-4 right-4 z-50 max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-start p-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "flex-shrink-0", children: getIcon() }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "ml-3 flex-1", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-sm font-medium text-gray-900", children: message }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "ml-4 flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "button",
      {
        onClick: () => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        },
        className: "inline-flex text-gray-400 hover:text-gray-600 focus:outline-none",
        children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.X, { className: "w-4 h-4" })
      }
    ) })
  ] }) });
};
var Toast_default = Toast;

// src/components/ApprovalDialog.tsx
var import_react12 = require("react");
var import_lucide_react5 = require("lucide-react");
var import_jsx_runtime7 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full mx-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center p-4 border-b border-gray-200", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react5.AlertTriangle, { className: "w-6 h-6 text-yellow-500 mr-3" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h3", { className: "text-lg font-semibold text-gray-900", children: "Tool Execution Approval" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "p-4", children: [
      reason && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "mb-4", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "text-sm text-gray-700", children: reason }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "mb-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "Tools to execute:" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "space-y-2", children: toolCalls.map((toolCall) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "flex items-center p-2 bg-gray-50 rounded", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "text-sm font-medium text-gray-900", children: toolCall.tool_name }),
          toolCall.input && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "text-xs text-gray-600 mt-1", children: typeof toolCall.input === "string" ? toolCall.input : JSON.stringify(toolCall.input) })
        ] }) }, toolCall.tool_call_id)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex space-x-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "button",
          {
            onClick: handleApprove,
            className: "flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react5.CheckCircle, { className: "w-4 h-4 mr-2" }),
              "Approve"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "button",
          {
            onClick: handleDeny,
            className: "flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react5.XCircle, { className: "w-4 h-4 mr-2" }),
              "Deny"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
var import_jsx_runtime8 = require("react/jsx-runtime");
var ExternalToolManager = ({
  toolCalls,
  onToolComplete,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = (0, import_react13.useState)(false);
  const [toasts, setToasts] = (0, import_react13.useState)([]);
  const [approvalDialog, setApprovalDialog] = (0, import_react13.useState)(null);
  const [processingResults, setProcessingResults] = (0, import_react13.useState)([]);
  (0, import_react13.useEffect)(() => {
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
  (0, import_react13.useEffect)(() => {
    if (toolCalls.length > 0 && !isProcessing) {
      processToolCalls();
    }
  }, [toolCalls]);
  const processToolCalls = (0, import_react13.useCallback)(async () => {
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
  const handleApprovalDialogResponse = (0, import_react13.useCallback)((approved) => {
    if (approvalDialog) {
      approvalDialog.resolve(approved);
      setApprovalDialog(null);
    }
  }, [approvalDialog]);
  const handleApprovalDialogCancel = (0, import_react13.useCallback)(() => {
    if (approvalDialog) {
      approvalDialog.resolve(false);
      setApprovalDialog(null);
    }
  }, [approvalDialog]);
  const removeToast = (0, import_react13.useCallback)((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  if (toolCalls.length === 0)
    return null;
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "my-4 p-4 border border-blue-200 bg-blue-50 rounded-lg", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react6.Loader2, { className: `w-5 h-5 text-blue-600 ${isProcessing ? "animate-spin" : ""}` }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "font-semibold text-blue-800", children: isProcessing ? "Processing External Tools..." : "External Tools Completed" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "button",
          {
            onClick: onCancel,
            className: "flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react6.X, { className: "w-4 h-4" }),
              "Cancel"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "space-y-2", children: toolCalls.map((toolCall) => {
        const result = processingResults.find((r) => r.tool_call_id === toolCall.tool_call_id);
        const status = result ? result.success ? "completed" : "error" : isProcessing ? "processing" : "pending";
        return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between p-2 bg-white rounded border", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "font-medium", children: toolCall.tool_name }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: `text-sm ${status === "completed" ? "text-green-600" : status === "error" ? "text-red-600" : status === "processing" ? "text-blue-600" : "text-gray-500"}`, children: status })
          ] }),
          result && !result.success && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "text-xs text-red-600", children: result.error })
        ] }, toolCall.tool_call_id);
      }) }),
      processingResults.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "mt-3 p-2 bg-gray-100 rounded", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "text-sm text-gray-700", children: [
        processingResults.filter((r) => r.success).length,
        " of ",
        processingResults.length,
        " tools completed successfully"
      ] }) })
    ] }),
    approvalDialog && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      ApprovalDialog_default,
      {
        toolCalls: approvalDialog.toolCalls,
        reason: approvalDialog.reason,
        onApprove: () => handleApprovalDialogResponse(true),
        onDeny: () => handleApprovalDialogResponse(false),
        onCancel: handleApprovalDialogCancel
      }
    ),
    toasts.map((toast) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
  ChatProvider,
  DistriProvider,
  ExternalToolManager,
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
  getThemeClasses,
  initializeBuiltinHandlers,
  processExternalToolCalls,
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