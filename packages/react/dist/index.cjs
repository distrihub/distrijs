"use client";
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
var index_exports = {};
__export(index_exports, {
  AgentSelect: () => AgentSelect,
  ApprovalToolCall: () => ApprovalToolCall,
  AssistantMessage: () => AssistantMessage,
  AssistantWithToolCalls: () => AssistantWithToolCalls2,
  Chat: () => Chat,
  ChatInput: () => ChatInput,
  DebugMessage: () => DebugMessage,
  DistriProvider: () => DistriProvider,
  PlanMessage: () => PlanMessage,
  ThemeProvider: () => ThemeProvider,
  ThemeToggle: () => ThemeToggle,
  ToastToolCall: () => ToastToolCall,
  UserMessage: () => UserMessage,
  extractTextFromMessage: () => extractTextFromMessage,
  registerTools: () => registerTools,
  shouldDisplayMessage: () => shouldDisplayMessage,
  useAgent: () => useAgent,
  useAgentDefinitions: () => useAgentDefinitions,
  useChat: () => useChat,
  useDistri: () => useDistri,
  useTheme: () => useTheme,
  useThreads: () => useThreads
});
module.exports = __toCommonJS(index_exports);

// src/DistriProvider.tsx
var import_react2 = require("react");
var import_core = require("@distri/core");

// src/components/ThemeProvider.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var initialState = {
  theme: "system",
  setTheme: () => null
};
var ThemeProviderContext = (0, import_react.createContext)(initialState);
function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "distri-theme",
  ...props
}) {
  const [theme, setTheme] = (0, import_react.useState)(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }
    return defaultTheme === "system" ? "dark" : defaultTheme;
  });
  (0, import_react.useEffect)(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "chatgpt");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(theme);
  }, [theme]);
  const value = {
    theme,
    setTheme: (theme2) => {
      localStorage.setItem(storageKey, theme2);
      setTheme(theme2);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeProviderContext.Provider, { ...props, value, children });
}
var useTheme = () => {
  const context = (0, import_react.useContext)(ThemeProviderContext);
  if (context === void 0)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

// src/DistriProvider.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var DistriContext = (0, import_react2.createContext)({
  client: null,
  error: null,
  isLoading: true
});
var debug = (config, ...args) => {
  if (config.debug) {
    console.log("[DistriProvider]", ...args);
  }
};
function DistriProvider({ config, children, defaultTheme = "dark" }) {
  const [client, setClient] = (0, import_react2.useState)(null);
  const [error, setError] = (0, import_react2.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react2.useState)(true);
  (0, import_react2.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ThemeProvider, { defaultTheme, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DistriContext.Provider, { value: contextValue, children }) });
}
function useDistri() {
  const context = (0, import_react2.useContext)(DistriContext);
  if (!context) {
    throw new Error("useDistri must be used within a DistriProvider");
  }
  return context;
}

// src/useAgent.ts
var import_react3 = __toESM(require("react"), 1);
var import_core2 = require("@distri/core");
function useAgent({
  agentIdOrDef
}) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agent, setAgent] = (0, import_react3.useState)(null);
  const [loading, setLoading] = (0, import_react3.useState)(false);
  const [error, setError] = (0, import_react3.useState)(null);
  const agentRef = (0, import_react3.useRef)(null);
  const currentAgentIdRef = (0, import_react3.useRef)(null);
  const initializeAgent = (0, import_react3.useCallback)(async () => {
    if (!client || !agentIdOrDef) return;
    if (currentAgentIdRef.current === agentIdOrDef && agentRef.current) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      if (currentAgentIdRef.current !== agentIdOrDef) {
        agentRef.current = null;
        setAgent(null);
      }
      const newAgent = await import_core2.Agent.create(agentIdOrDef, client);
      agentRef.current = newAgent;
      currentAgentIdRef.current = agentIdOrDef;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create agent"));
    } finally {
      setLoading(false);
    }
  }, [client, agentIdOrDef]);
  import_react3.default.useEffect(() => {
    if (!clientLoading && !clientError && client) {
      initializeAgent();
    }
  }, [clientLoading, clientError, client, agentIdOrDef, initializeAgent]);
  import_react3.default.useEffect(() => {
    if (currentAgentIdRef.current !== agentIdOrDef) {
      agentRef.current = null;
      setAgent(null);
      currentAgentIdRef.current = null;
    }
  }, [agentIdOrDef]);
  return {
    // Agent information
    agent,
    // State management
    loading: loading || clientLoading,
    error: error || clientError
  };
}

// src/useAgentDefinitions.ts
var import_react4 = require("react");
function useAgentDefinitions() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = (0, import_react4.useState)([]);
  const [loading, setLoading] = (0, import_react4.useState)(true);
  const [error, setError] = (0, import_react4.useState)(null);
  const fetchAgents = (0, import_react4.useCallback)(async () => {
    if (!client) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedAgents = await client.getAgents();
      setAgents(fetchedAgents);
    } catch (err) {
      console.error("[useAgentDefinitions] Failed to fetch agents:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch agents"));
    } finally {
      setLoading(false);
    }
  }, [client]);
  const getAgent = (0, import_react4.useCallback)(async (agentId) => {
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
  (0, import_react4.useEffect)(() => {
    if (clientLoading) {
      setLoading(true);
      return;
    }
    if (clientError) {
      console.error("[useAgentDefinitions] Client error:", clientError);
      setError(clientError);
      setLoading(false);
      return;
    }
    if (client) {
      fetchAgents();
    } else {
      console.log("[useAgentDefinitions] No client available");
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
var import_react8 = require("react");
var import_core4 = require("@distri/core");
var import_core5 = require("@distri/core");

// ../core/src/encoder.ts
function convertA2AMessageToDistri(a2aMessage) {
  const role = a2aMessage.role === "agent" ? "assistant" : "user";
  return {
    id: a2aMessage.messageId,
    role,
    parts: a2aMessage.parts.map(convertA2APartToDistri),
    created_at: a2aMessage.createdAt
  };
}
function convertA2AStatusUpdateToDistri(statusUpdate) {
  if (!statusUpdate.metadata || !statusUpdate.metadata.type) {
    return null;
  }
  const metadata = statusUpdate.metadata;
  switch (metadata.type) {
    case "run_started":
      return {
        type: "run_started",
        data: {}
      };
    case "run_finished":
      return {
        type: "run_finished",
        data: {}
      };
    case "plan_started":
      return {
        type: "plan_started",
        data: {
          initial_plan: metadata.initial_plan
        }
      };
    case "plan_finished":
      return {
        type: "plan_finished",
        data: {
          total_steps: metadata.total_steps
        }
      };
    case "step_started":
      return {
        type: "tool_call_start",
        data: {
          tool_call_id: metadata.step_id,
          tool_call_name: metadata.step_title || "Processing",
          parent_message_id: statusUpdate.taskId,
          is_external: false
        }
      };
    case "step_completed":
      return {
        type: "tool_call_end",
        data: {
          tool_call_id: metadata.step_id
        }
      };
    case "tool_execution_start":
      return {
        type: "tool_call_start",
        data: {
          tool_call_id: metadata.tool_call_id,
          tool_call_name: metadata.tool_call_name || "Tool",
          parent_message_id: statusUpdate.taskId,
          is_external: true
        }
      };
    case "tool_execution_end":
      return {
        type: "tool_call_end",
        data: {
          tool_call_id: metadata.tool_call_id
        }
      };
    case "text_message_start":
      return {
        type: "text_message_start",
        data: {
          message_id: metadata.message_id,
          role: metadata.role === "assistant" ? "assistant" : "user"
        }
      };
    case "text_message_content":
      return {
        type: "text_message_content",
        data: {
          message_id: metadata.message_id,
          delta: metadata.delta || ""
        }
      };
    case "text_message_end":
      return {
        type: "text_message_end",
        data: {
          message_id: metadata.message_id
        }
      };
    default:
      console.warn(`Unhandled status update metadata type: ${metadata.type}`, metadata);
      return {
        type: "run_started",
        data: { metadata }
      };
  }
}
function convertA2AArtifactToDistri(artifact) {
  if (!artifact || !artifact.parts || !Array.isArray(artifact.parts)) {
    return null;
  }
  const part = artifact.parts[0];
  if (!part || part.kind !== "data" || !part.data) {
    return null;
  }
  const data = part.data;
  if (data.type === "llm_response") {
    const executionResult2 = {
      id: data.id || artifact.artifactId,
      type: "llm_response",
      timestamp: data.timestamp || data.created_at || Date.now(),
      content: data.content || "",
      tool_calls: data.tool_calls || [],
      step_id: data.step_id,
      success: data.success,
      rejected: data.rejected,
      reason: data.reason
    };
    return executionResult2;
  }
  if (data.type === "tool_results") {
    const executionResult2 = {
      id: data.id || artifact.artifactId,
      type: "tool_results",
      timestamp: data.timestamp || data.created_at || Date.now(),
      results: data.results || [],
      step_id: data.step_id,
      success: data.success,
      rejected: data.rejected,
      reason: data.reason
    };
    return executionResult2;
  }
  const executionResult = {
    id: artifact.artifactId,
    type: "artifact",
    timestamp: Date.now(),
    data,
    artifactId: artifact.artifactId,
    name: artifact.name || "",
    description: artifact.description || null
  };
  return executionResult;
}
function decodeA2AStreamEvent(event) {
  if (event.jsonrpc && event.result) {
    return decodeA2AStreamEvent(event.result);
  }
  if (event.kind === "message") {
    return convertA2AMessageToDistri(event);
  }
  if (event.kind === "status-update") {
    return convertA2AStatusUpdateToDistri(event);
  }
  if (event.kind === "artifact-update") {
    return convertA2AArtifactToDistri(event);
  }
  if (event.artifactId && event.parts) {
    return convertA2AArtifactToDistri(event);
  }
  return null;
}
function convertA2APartToDistri(a2aPart) {
  switch (a2aPart.kind) {
    case "text":
      return { type: "text", text: a2aPart.text };
    case "file":
      if ("uri" in a2aPart.file) {
        return { type: "image_url", image: { mime_type: a2aPart.file.mimeType, url: a2aPart.file.uri } };
      } else {
        return { type: "image_bytes", image: { mime_type: a2aPart.file.mimeType, data: a2aPart.file.bytes } };
      }
    case "data":
      switch (a2aPart.data.part_type) {
        case "tool_call":
          return { type: "tool_call", tool_call: a2aPart.data };
        case "tool_result":
          return { type: "tool_result", tool_result: a2aPart.data };
        case "code_observation":
          return { type: "code_observation", thought: a2aPart.data.thought, code: a2aPart.data.code };
        case "plan":
          return { type: "plan", plan: a2aPart.data.plan };
        default:
          return { type: "data", data: a2aPart.data };
      }
    default:
      return { type: "text", text: JSON.stringify(a2aPart) };
  }
}

// ../core/src/types.ts
function isDistriMessage(event) {
  return "id" in event && "role" in event && "parts" in event;
}
function isDistriArtifact(event) {
  return "type" in event && "timestamp" in event && "id" in event;
}

// src/hooks/registerTools.tsx
var import_react7 = require("react");

// src/components/toolcalls/ApprovalToolCall.tsx
var import_react5 = require("react");

// src/components/ui/button.tsx
var React3 = __toESM(require("react"), 1);

// src/lib/utils.ts
var import_clsx = require("clsx");
var import_tailwind_merge = require("tailwind-merge");
function cn(...inputs) {
  return (0, import_tailwind_merge.twMerge)((0, import_clsx.clsx)(inputs));
}

// src/components/ui/button.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline"
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10"
  }
};
var Button = React3.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "button",
      {
        className: cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";

// src/components/toolcalls/ApprovalToolCall.tsx
var import_lucide_react = require("lucide-react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var ApprovalToolCall = ({
  toolCall,
  completeTool
}) => {
  const [isProcessing, setIsProcessing] = (0, import_react5.useState)(false);
  const input = typeof toolCall.input === "string" ? JSON.parse(toolCall.input) : toolCall.input;
  const reason = input.reason || "Approval required";
  const toolCallsToApprove = input.tool_calls || [];
  const handleResponse = async (approved) => {
    if (isProcessing || status === "completed") return;
    setIsProcessing(true);
    const result = {
      tool_call_id: toolCall.tool_call_id,
      result: `${toolCall.tool_name} ${approved ? "approved" : "denied"} by user`,
      success: true,
      error: void 0
    };
    completeTool(result);
  };
  if (status === "completed") {
    const result = input.result || {};
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "border rounded-lg p-4 bg-muted/50", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [
        result.approved ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react.CheckCircle, { className: "h-4 w-4 text-green-600" }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react.XCircle, { className: "h-4 w-4 text-red-600" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "font-medium", children: [
          "Approval ",
          result.approved ? "Granted" : "Denied"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-sm text-muted-foreground", children: reason })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "border rounded-lg p-4 bg-background", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react.AlertTriangle, { className: "h-4 w-4 text-amber-500" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "font-medium", children: "Approval Required" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-sm mb-4", children: reason }),
    toolCallsToApprove.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "mb-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-xs text-muted-foreground mb-2", children: "Tool calls requiring approval:" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "space-y-1", children: toolCallsToApprove.map((tc, index) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-xs bg-muted p-2 rounded", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "font-mono", children: tc.tool_name }) }, index)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        Button,
        {
          size: "sm",
          variant: "destructive",
          onClick: () => handleResponse(false),
          disabled: isProcessing,
          children: "Deny"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        Button,
        {
          size: "sm",
          onClick: () => handleResponse(true),
          disabled: isProcessing,
          children: "Approve"
        }
      )
    ] })
  ] });
};

// src/components/toolcalls/ToastToolCall.tsx
var import_react6 = require("react");
var import_sonner = require("sonner");
var import_jsx_runtime5 = require("react/jsx-runtime");
var ToastToolCall = ({
  toolCall,
  completeTool
}) => {
  const input = typeof toolCall.input === "string" ? JSON.parse(toolCall.input) : toolCall.input;
  const message = input.message || "Toast message";
  const type = input.type || "info";
  let method;
  switch (type) {
    case "success":
      method = import_sonner.toast.success;
      break;
    case "error":
      method = import_sonner.toast.error;
      break;
    case "warning":
      method = import_sonner.toast.warning;
      break;
    default:
      method = import_sonner.toast.info;
  }
  ;
  let duration = 500;
  (0, import_react6.useEffect)(() => {
    method(message, {
      duration: duration * 2,
      position: "top-right",
      className: "bg-background text-foreground border border-border",
      style: {
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
        border: "1px solid var(--border)"
      }
    });
    setTimeout(() => {
      const result = {
        tool_call_id: toolCall.tool_call_id,
        result: "Toast displayed successfully",
        success: true,
        error: void 0
      };
      completeTool(result);
    }, duration);
  }, [message, type, completeTool]);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_jsx_runtime5.Fragment, {});
};

// src/hooks/registerTools.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function registerTools({ agent, tools }) {
  const lastAgentIdRef = (0, import_react7.useRef)(null);
  (0, import_react7.useEffect)(() => {
    if (!agent || !tools || tools.length === 0) {
      return;
    }
    if (lastAgentIdRef.current === agent.id) {
      return;
    }
    [...defaultTools, ...tools].forEach((tool) => {
      agent.registerTool(tool);
      console.log(`\u2713 Registered tool: ${tool.name}`);
    });
    lastAgentIdRef.current = agent.id;
    console.log(`Successfully registered ${tools.length} tools with agent`);
  }, [agent?.id, tools]);
}
var defaultTools = [
  {
    name: "toast",
    type: "ui",
    description: "Show a toast message",
    input_schema: {
      type: "object",
      properties: {
        message: { type: "string" },
        type: { type: "string", enum: ["success", "error", "warning", "info"] }
      }
    },
    component: (props) => {
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ToastToolCall, { ...props });
    }
  }
  // {
  //   name: 'approval_request',
  //   type: 'ui',
  //   description: 'Request approval from the user',
  //   parameters: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string' }
  //     }
  //   },
  //   component: (props: UiToolProps) => { return (<ApprovalToolCall {...props} />) },
  // }
];

// src/stores/chatStateStore.ts
var import_zustand = require("zustand");
var import_core3 = require("@distri/core");
var useChatStateStore = (0, import_zustand.create)((set, get) => ({
  messages: [],
  isStreaming: false,
  isLoading: false,
  error: null,
  tasks: /* @__PURE__ */ new Map(),
  plans: /* @__PURE__ */ new Map(),
  toolCalls: /* @__PURE__ */ new Map(),
  currentTaskId: void 0,
  currentPlanId: void 0,
  // Message actions
  addMessage: (message) => {
    set((state) => {
      const newState = { ...state };
      newState.messages.push(message);
      return newState;
    });
  },
  clearMessages: () => {
    set({ messages: [] });
  },
  setStreaming: (isStreaming) => {
    set({ isStreaming });
  },
  setLoading: (isLoading) => {
    set({ isLoading });
  },
  setError: (error) => {
    set({ error });
  },
  // State actions
  processMessage: (message) => {
    const timestamp = Date.now();
    if ((0, import_core3.isDistriEvent)(message)) {
      switch (message.type) {
        case "run_started":
          const taskId = `task_${Date.now()}`;
          get().updateTask(taskId, {
            id: taskId,
            title: "Agent Run",
            status: "running",
            startTime: timestamp,
            metadata: message.data
          });
          set({ currentTaskId: taskId });
          break;
        case "run_finished":
          const currentTaskId = get().currentTaskId;
          if (currentTaskId) {
            get().updateTask(currentTaskId, {
              status: "completed",
              endTime: timestamp
            });
          }
          break;
        case "plan_started":
          const planId = `plan_${Date.now()}`;
          get().updatePlan(planId, {
            id: planId,
            runId: get().currentTaskId,
            steps: [],
            status: "running",
            startTime: timestamp
          });
          set({ currentPlanId: planId });
          break;
        case "plan_finished":
          const currentPlanId = get().currentPlanId;
          if (currentPlanId) {
            get().updatePlan(currentPlanId, {
              status: "completed",
              endTime: timestamp
            });
          }
          break;
        case "tool_call_start":
          const toolTaskId = message.data.tool_call_id;
          const existingTask = get().getTaskById(toolTaskId);
          if (existingTask) {
            get().updateTask(toolTaskId, {
              status: "running",
              startTime: timestamp
            });
          } else {
            get().updateTask(toolTaskId, {
              id: toolTaskId,
              runId: get().currentTaskId,
              planId: get().currentPlanId,
              title: message.data.tool_call_name || "Processing",
              status: "running",
              startTime: timestamp
            });
          }
          break;
        case "tool_call_end":
          const finishedTaskId = message.data.tool_call_id;
          if (finishedTaskId) {
            get().updateTask(finishedTaskId, {
              status: "completed",
              endTime: timestamp
            });
          }
          break;
      }
    }
    if ((0, import_core3.isDistriArtifact)(message)) {
      switch (message.type) {
        case "llm_response":
          const taskId = message.step_id || message.id;
          if (taskId) {
            get().updateTask(taskId, {
              toolCalls: message.tool_calls || [],
              status: message.success ? "completed" : "failed",
              error: message.reason || void 0
            });
            if (message.tool_calls && Array.isArray(message.tool_calls)) {
              message.tool_calls.forEach((toolCall) => {
                get().initToolCall({
                  tool_call_id: toolCall.tool_call_id,
                  tool_name: toolCall.tool_name || "Unknown Tool",
                  input: toolCall.input || {}
                }, message.timestamp || timestamp);
              });
            }
          }
          break;
        case "tool_results":
          const resultsTaskId = message.step_id || message.id;
          if (resultsTaskId) {
            get().updateTask(resultsTaskId, {
              results: message.results || [],
              status: message.success ? "completed" : "failed",
              error: message.reason || void 0
            });
            if (message.results && Array.isArray(message.results)) {
              message.results.forEach((result) => {
                get().updateToolCallStatus(result.tool_call_id, {
                  status: message.success ? "completed" : "error",
                  result: result.result,
                  error: message.reason || void 0,
                  endTime: message.timestamp || timestamp
                });
              });
            }
          }
          break;
        case "plan":
          const planId = message.id;
          if (planId) {
            get().updatePlan(planId, {
              steps: message.steps,
              status: "completed",
              endTime: message.timestamp || timestamp
            });
          }
          break;
      }
    }
  },
  initToolCall: (toolCall, timestamp, isExternal, stepTitle) => {
    set((state) => {
      const newState = { ...state };
      let toolIsExternal = isExternal;
      if (toolIsExternal === void 0) {
        const distriTool = state.tools?.find((t) => t.name === toolCall.tool_name);
        toolIsExternal = !!distriTool;
      }
      newState.toolCalls.set(toolCall.tool_call_id, {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name || "Unknown Tool",
        step_title: stepTitle,
        input: toolCall.input || {},
        status: "pending",
        startTime: timestamp || Date.now(),
        isExternal: toolIsExternal
      });
      return newState;
    });
  },
  updateToolCallStatus: (toolCallId, status2) => {
    set((state) => {
      const newState = { ...state };
      const existingToolCall = newState.toolCalls.get(toolCallId);
      if (existingToolCall) {
        newState.toolCalls.set(toolCallId, {
          ...existingToolCall,
          ...status2,
          endTime: status2.status === "completed" || status2.status === "error" ? Date.now() : existingToolCall.endTime
        });
      }
      return newState;
    });
  },
  executeTool: async (toolCall) => {
    const state = get();
    const distriTool = state.tools?.find((t) => t.name === toolCall.tool_name);
    if (!distriTool) {
      console.log(`Tool ${toolCall.tool_name} not found in registered tools - skipping execution`);
      get().updateToolCallStatus(toolCall.tool_call_id, {
        isExternal: false,
        status: "pending",
        startedAt: /* @__PURE__ */ new Date()
      });
      return;
    }
    if (distriTool?.type === "ui") {
      const uiTool = distriTool;
      const component = uiTool.component({
        toolCall,
        toolCallState: state.toolCalls.get(toolCall.tool_call_id),
        completeTool: (result) => {
          get().updateToolCallStatus(toolCall.tool_call_id, {
            status: "completed",
            result,
            completedAt: /* @__PURE__ */ new Date(),
            isExternal: true
            // UI tools are external
          });
        }
      });
      get().updateToolCallStatus(toolCall.tool_call_id, {
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        component,
        status: "running",
        startedAt: /* @__PURE__ */ new Date(),
        isExternal: true
        // UI tools are external
      });
    } else {
      try {
        const result = await distriTool.handler(toolCall.input);
        get().updateToolCallStatus(toolCall.tool_call_id, {
          status: "completed",
          result: JSON.stringify(result),
          completedAt: /* @__PURE__ */ new Date(),
          isExternal: true
          // Function tools are external
        });
      } catch (error) {
        get().updateToolCallStatus(toolCall.tool_call_id, {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
          completedAt: /* @__PURE__ */ new Date(),
          isExternal: true
          // Function tools are external
        });
      }
    }
  },
  hasPendingToolCalls: () => {
    const state = get();
    return Array.from(state.toolCalls.values()).some(
      (toolCall) => toolCall.status === "pending" || toolCall.status === "running"
    );
  },
  clearToolResults: () => {
    set((state) => {
      const newState = { ...state };
      newState.toolCalls.forEach((toolCall) => {
        if (toolCall.status === "completed" || toolCall.status === "error") {
          newState.toolCalls.delete(toolCall.tool_call_id);
        }
      });
      return newState;
    });
  },
  getExternalToolResponses: () => {
    const state = get();
    const completedToolCalls = Array.from(state.toolCalls.values()).filter(
      (toolCall) => (toolCall.status === "completed" || toolCall.status === "error") && toolCall.isExternal && toolCall.result !== void 0
      // Only return if there's actually a result
    );
    return completedToolCalls.map((toolCall) => ({
      tool_call_id: toolCall.tool_call_id,
      tool_name: toolCall.tool_name,
      result: toolCall.result,
      success: toolCall.status === "completed",
      error: toolCall.error
    }));
  },
  getToolCallById: (toolCallId) => {
    const state = get();
    return state.toolCalls.get(toolCallId) || null;
  },
  getPendingToolCalls: () => {
    const state = get();
    return Array.from(state.toolCalls.values()).filter(
      (toolCall) => toolCall.status === "pending" || toolCall.status === "running"
    );
  },
  getCompletedToolCalls: () => {
    const state = get();
    return Array.from(state.toolCalls.values()).filter(
      (toolCall) => toolCall.status === "completed" || toolCall.status === "error"
    );
  },
  clearAllStates: () => {
    set({
      messages: [],
      tasks: /* @__PURE__ */ new Map(),
      plans: /* @__PURE__ */ new Map(),
      toolCalls: /* @__PURE__ */ new Map(),
      currentTaskId: void 0,
      currentPlanId: void 0
    });
  },
  clearTask: (taskId) => {
    set((state) => {
      const newState = { ...state };
      newState.tasks.delete(taskId);
      for (const [planId, plan] of newState.plans) {
        if (plan.runId === taskId) {
          newState.plans.delete(planId);
        }
      }
      return newState;
    });
  },
  getCurrentTask: () => {
    const state = get();
    if (!state.currentTaskId) return null;
    return state.tasks.get(state.currentTaskId) || null;
  },
  getCurrentPlan: () => {
    const state = get();
    if (!state.currentPlanId) return null;
    return state.plans.get(state.currentPlanId) || null;
  },
  getCurrentTasks: () => {
    const state = get();
    return Array.from(state.tasks.values());
  },
  getTaskById: (taskId) => {
    const state = get();
    return state.tasks.get(taskId) || null;
  },
  getPlanById: (planId) => {
    const state = get();
    return state.plans.get(planId) || null;
  },
  updateTask: (taskId, updates) => {
    set((state) => {
      const newState = { ...state };
      const existingTask = newState.tasks.get(taskId);
      if (existingTask) {
        newState.tasks.set(taskId, { ...existingTask, ...updates });
      }
      return newState;
    });
  },
  updatePlan: (planId, updates) => {
    set((state) => {
      const newState = { ...state };
      const existingPlan = newState.plans.get(planId);
      if (existingPlan) {
        newState.plans.set(planId, { ...existingPlan, ...updates });
      }
      return newState;
    });
  },
  // Setup
  setAgent: (agent) => {
    set({ agent });
  },
  setTools: (tools) => {
    set({ tools });
  },
  setOnAllToolsCompleted: (callback) => {
    set({ onAllToolsCompleted: callback });
  }
}));

// src/useChat.ts
function useChat({
  threadId,
  onMessage,
  onError,
  getMetadata,
  onMessagesUpdate,
  agent,
  tools
}) {
  const abortControllerRef = (0, import_react8.useRef)(null);
  const createInvokeContext = (0, import_react8.useCallback)(() => ({
    thread_id: threadId,
    run_id: void 0,
    getMetadata
  }), [threadId, getMetadata]);
  registerTools({ agent, tools });
  const chatState = useChatStateStore.getState();
  (0, import_react8.useEffect)(() => {
    if (agent) {
      chatState.setAgent(agent);
    }
    if (tools) {
      chatState.setTools(tools);
    }
  }, [agent, tools, chatState]);
  (0, import_react8.useEffect)(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  const agentIdRef = (0, import_react8.useRef)(void 0);
  (0, import_react8.useEffect)(() => {
    if (agent?.id !== agentIdRef.current) {
      chatState.clearMessages();
      chatState.clearAllStates();
      chatState.setError(null);
      agentIdRef.current = agent?.id;
    }
  }, [agent?.id, chatState]);
  const fetchMessages = (0, import_react8.useCallback)(async () => {
    if (!agent) return;
    try {
      chatState.setLoading(true);
      const a2aMessages = await agent.getThreadMessages(threadId);
      const distriMessages = a2aMessages.map(decodeA2AStreamEvent).filter(Boolean);
      chatState.clearMessages();
      distriMessages.forEach((message) => {
        chatState.addMessage(message);
        chatState.processMessage(message);
      });
      onMessagesUpdate?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch messages");
      chatState.setError(error);
      onError?.(error);
    } finally {
      chatState.setLoading(false);
    }
  }, [threadId, agent?.id, onError, onMessagesUpdate, chatState]);
  (0, import_react8.useEffect)(() => {
    if (threadId) {
      fetchMessages();
    }
  }, [threadId, agent?.id]);
  const handleStreamEvent = (0, import_react8.useCallback)((event) => {
    chatState.addMessage(event);
    chatState.processMessage(event);
    if (isDistriArtifact(event)) {
      const artifact = event;
      if (artifact.type === "llm_response") {
        const llmArtifact = artifact;
        if (llmArtifact.tool_calls && Array.isArray(llmArtifact.tool_calls)) {
          llmArtifact.tool_calls.forEach((toolCall) => {
            const distriTool = chatState.tools?.find((t) => t.name === toolCall.tool_name);
            const isExternal = !!distriTool;
            const stepTitle = llmArtifact.step_id || toolCall.tool_name;
            chatState.initToolCall(toolCall, llmArtifact.timestamp, isExternal, stepTitle);
          });
        }
      } else if (artifact.type === "tool_results") {
        const toolResultsArtifact = artifact;
        if (toolResultsArtifact.results && Array.isArray(toolResultsArtifact.results)) {
          toolResultsArtifact.results.forEach((result) => {
            let parsedResult = result.result;
            if (typeof parsedResult === "string") {
              try {
                parsedResult = JSON.parse(parsedResult);
              } catch {
              }
            }
            chatState.updateToolCallStatus(
              result.tool_call_id,
              {
                status: toolResultsArtifact.success ? "completed" : "error",
                result: parsedResult,
                error: toolResultsArtifact.reason || void 0,
                completedAt: new Date(toolResultsArtifact.timestamp)
              }
            );
          });
        }
      }
    }
    if (isDistriMessage(event)) {
      const distriMessage = event;
      const toolCallParts = distriMessage.parts.filter((part) => part.type === "tool_call");
      if (toolCallParts.length > 0) {
        const newToolCalls = toolCallParts.map((part) => part.tool_call);
        newToolCalls.forEach((toolCall) => {
          const distriTool = chatState.tools?.find((t) => t.name === toolCall.tool_name);
          const isExternal = !!distriTool;
          const stepTitle = toolCall.tool_name;
          chatState.initToolCall(toolCall, void 0, isExternal, stepTitle);
        });
      }
      const toolResultParts = distriMessage.parts.filter((part) => part.type === "tool_result");
      if (toolResultParts.length > 0) {
        const newToolResults = toolResultParts.map((part) => part.tool_result);
        newToolResults.forEach((toolResult) => {
          chatState.updateToolCallStatus(
            toolResult.tool_call_id,
            {
              status: toolResult.success ? "completed" : "error",
              result: toolResult.result,
              error: toolResult.error,
              completedAt: /* @__PURE__ */ new Date()
            }
          );
        });
      }
    }
    onMessage?.(event);
  }, [onMessage, agent, chatState]);
  const sendMessage = (0, import_react8.useCallback)(async (content) => {
    if (!agent) return;
    chatState.setLoading(true);
    chatState.setStreaming(true);
    chatState.setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      const parts = typeof content === "string" ? [{ type: "text", text: content }] : content;
      const distriMessage = import_core4.DistriClient.initDistriMessage("user", parts);
      const context = createInvokeContext();
      const a2aMessage = (0, import_core5.convertDistriMessageToA2A)(distriMessage, context);
      chatState.addMessage(distriMessage);
      const contextMetadata = await getMetadata?.() || {};
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: contextMetadata
      });
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        handleStreamEvent(event);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const error = err instanceof Error ? err : new Error("Failed to send message");
      chatState.setError(error);
      onError?.(error);
    } finally {
      chatState.setLoading(false);
      chatState.setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, onError]);
  const sendMessageStream = (0, import_react8.useCallback)(async (content, role = "user") => {
    if (!agent) return;
    chatState.setLoading(true);
    chatState.setStreaming(true);
    chatState.setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      const parts = typeof content === "string" ? [{ type: "text", text: content }] : content;
      const distriMessage = import_core4.DistriClient.initDistriMessage(role, parts);
      const context = createInvokeContext();
      const a2aMessage = (0, import_core5.convertDistriMessageToA2A)(distriMessage, context);
      chatState.addMessage(distriMessage);
      const contextMetadata = await getMetadata?.() || {};
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: { ...contextMetadata }
      });
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        handleStreamEvent(event);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const error = err instanceof Error ? err : new Error("Failed to send message");
      chatState.setError(error);
      onError?.(error);
    } finally {
      chatState.setLoading(false);
      chatState.setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, onError, threadId]);
  const handleExternalToolResponses = (0, import_react8.useCallback)(async () => {
    const externalResponses = chatState.getExternalToolResponses();
    if (externalResponses.length > 0 && !chatState.isStreaming && !chatState.isLoading) {
      console.log("Sending external tool responses:", externalResponses);
      try {
        const toolResultParts = externalResponses.map((result) => ({
          type: "tool_result",
          tool_result: {
            tool_call_id: result.tool_call_id,
            result: result.result,
            success: result.success,
            error: result.error
          }
        }));
        await sendMessageStream(toolResultParts, "tool");
        chatState.clearToolResults();
      } catch (err) {
        console.error("Failed to send external tool responses:", err);
        chatState.setError(err instanceof Error ? err : new Error("Failed to send tool responses"));
      }
    }
  }, [chatState, sendMessageStream]);
  (0, import_react8.useEffect)(() => {
    const interval = setInterval(() => {
      const externalResponses = chatState.getExternalToolResponses();
      if (externalResponses.length > 0 && !chatState.isStreaming && !chatState.isLoading) {
        const hasExternalToolResponses = externalResponses.some((response) => {
          const toolCall = chatState.getToolCallById(response.tool_call_id);
          return toolCall && toolCall.isExternal && toolCall.status === "completed";
        });
        if (hasExternalToolResponses) {
          handleExternalToolResponses();
        }
      }
    }, 1e3);
    return () => clearInterval(interval);
  }, [chatState, handleExternalToolResponses]);
  const stopStreaming = (0, import_react8.useCallback)(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  return {
    messages: chatState.messages,
    isStreaming: chatState.isStreaming,
    sendMessage,
    sendMessageStream,
    isLoading: chatState.isLoading,
    error: chatState.error,
    clearMessages: chatState.clearMessages,
    agent: agent || void 0,
    hasPendingToolCalls: chatState.hasPendingToolCalls,
    stopStreaming,
    // Chat state management
    chatState
  };
}

// src/useThreads.ts
var import_react9 = require("react");
function useThreads() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = (0, import_react9.useState)([]);
  const [loading, setLoading] = (0, import_react9.useState)(true);
  const [error, setError] = (0, import_react9.useState)(null);
  const fetchThreads = (0, import_react9.useCallback)(async () => {
    if (!client) {
      console.error("[useThreads] Client not available");
      setError(new Error("Client not available"));
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedThreads = await client.getThreads();
      setThreads(fetchedThreads);
    } catch (err) {
      console.error("[useThreads] Failed to fetch threads:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch threads"));
    } finally {
      setLoading(false);
    }
  }, [client]);
  const fetchThread = (0, import_react9.useCallback)(async (threadId) => {
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
  const deleteThread = (0, import_react9.useCallback)(async (threadId) => {
    if (!client) {
      throw new Error("Client not available");
    }
    try {
      const response = await fetch(`${client.baseUrl}/threads/${threadId}`, {
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
  const updateThread = (0, import_react9.useCallback)(async (threadId, localId) => {
    if (!client) {
      return;
    }
    try {
      const response = await fetch(`${client.baseUrl}/threads/${threadId}`);
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
  (0, import_react9.useEffect)(() => {
    if (clientLoading) {
      setLoading(true);
      return;
    }
    if (clientError) {
      setError(clientError);
      setLoading(false);
      return;
    }
    if (client) {
      fetchThreads();
    } else {
      setLoading(false);
    }
  }, [clientLoading, clientError, client, fetchThreads]);
  (0, import_react9.useEffect)(() => {
    if (!client) return;
    const interval = setInterval(() => {
      fetchThreads();
    }, 3e4);
    return () => clearInterval(interval);
  }, [client, fetchThreads]);
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
var import_react19 = require("react");
var import_core8 = require("@distri/core");

// src/components/ChatInput.tsx
var import_react10 = require("react");
var import_lucide_react2 = require("lucide-react");
var import_jsx_runtime7 = require("react/jsx-runtime");
var ChatInput = ({
  value,
  onChange,
  onSend,
  onStop,
  placeholder = "Type your message...",
  disabled = false,
  isStreaming = false,
  className = ""
}) => {
  const textareaRef = (0, import_react10.useRef)(null);
  (0, import_react10.useEffect)(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isStreaming) {
        onSend();
      }
    }
  };
  const handleSend = () => {
    if (value.trim() && !disabled && !isStreaming) {
      onSend();
    }
  };
  const handleStop = () => {
    if (isStreaming && onStop) {
      onStop();
    }
  };
  const hasContent = value.trim().length > 0;
  const isDisabled = disabled || isStreaming;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: `relative flex min-h-14 w-full items-end ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "relative flex w-full flex-auto flex-col", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "relative mx-5 flex min-h-14 flex-auto rounded-lg border border-input bg-input items-start h-full", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "textarea",
      {
        ref: textareaRef,
        value,
        onChange: (e) => onChange(e.target.value),
        onKeyPress: handleKeyPress,
        placeholder,
        disabled: isDisabled,
        rows: 1,
        className: "max-h-[25dvh] flex-1 resize-none border-none outline-none bg-transparent placeholder:text-muted-foreground focus:ring-0 overflow-auto text-sm p-4 pr-20 text-foreground min-h-[52px] max-h-[120px]"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "absolute right-2 bottom-0 flex items-center h-full", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "button",
      {
        onClick: isStreaming ? handleStop : handleSend,
        disabled: !hasContent && !isStreaming,
        className: `h-10 w-10 rounded-md transition-colors flex items-center justify-center ${isStreaming ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : hasContent && !disabled ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted"}`,
        children: isStreaming ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react2.Square, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react2.Send, { className: "h-5 w-5" })
      }
    ) })
  ] }) }) });
};

// src/components/renderers/TaskRenderer.tsx
var import_react11 = require("react");

// src/components/ui/badge.tsx
var import_class_variance_authority = require("class-variance-authority");
var import_jsx_runtime8 = require("react/jsx-runtime");
var badgeVariants = (0, import_class_variance_authority.cva)(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: cn(badgeVariants({ variant }), className), ...props });
}

// src/components/ui/card.tsx
var React7 = __toESM(require("react"), 1);
var import_jsx_runtime9 = require("react/jsx-runtime");
var Card = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
  "div",
  {
    ref,
    className: cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    ),
    ...props
  }
));
Card.displayName = "Card";
var CardHeader = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
  "h3",
  {
    ref,
    className: cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
var CardDescription = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
  "p",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";

// src/components/renderers/TaskRenderer.tsx
var import_lucide_react4 = require("lucide-react");

// src/components/toolcalls/ToolCallRenderer.tsx
var import_lucide_react3 = require("lucide-react");
var import_jsx_runtime10 = require("react/jsx-runtime");

// src/components/renderers/TaskRenderer.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");

// src/components/renderers/ToolResultRenderer.tsx
var import_lucide_react5 = require("lucide-react");
var import_jsx_runtime12 = require("react/jsx-runtime");

// src/components/Components.tsx
var import_react17 = __toESM(require("react"), 1);
var import_lucide_react14 = require("lucide-react");

// src/components/ThemeToggle.tsx
var import_react12 = __toESM(require("react"), 1);
var import_lucide_react6 = require("lucide-react");
var import_jsx_runtime13 = require("react/jsx-runtime");
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dropdownRef = import_react12.default.useRef(null);
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "relative", ref: dropdownRef, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
    "button",
    {
      onClick: () => setTheme(theme === "light" ? "dark" : "light"),
      className: "flex items-center justify-center w-9 h-9 rounded-md border bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_lucide_react6.Sun, { className: "h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_lucide_react6.Moon, { className: "absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "sr-only", children: "Toggle theme" })
      ]
    }
  ) });
}

// src/components/AgentList.tsx
var import_react13 = __toESM(require("react"), 1);
var import_lucide_react7 = require("lucide-react");
var import_jsx_runtime14 = require("react/jsx-runtime");

// src/components/AgentSelect.tsx
var import_lucide_react9 = require("lucide-react");

// src/components/ui/select.tsx
var React11 = __toESM(require("react"), 1);
var SelectPrimitive = __toESM(require("@radix-ui/react-select"), 1);
var import_lucide_react8 = require("lucide-react");
var import_jsx_runtime15 = require("react/jsx-runtime");
var Select = SelectPrimitive.Root;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React11.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
  SelectPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react8.ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react8.ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react8.ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React11.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(SelectPrimitive.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
  SelectPrimitive.Content,
  {
    ref,
    className: cn(
      "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(SelectScrollUpButton, {}),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React11.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react8.Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// src/components/AgentSelect.tsx
var import_jsx_runtime16 = require("react/jsx-runtime");
var AgentSelect = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  className = "",
  placeholder = "Select an agent...",
  disabled = false
}) => {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(Select, { value: selectedAgentId, onValueChange: onAgentSelect, disabled, children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(SelectTrigger, { className: `w-full ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_lucide_react9.Bot, { className: "h-4 w-4" }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(SelectValue, { placeholder, children: selectedAgent?.name || placeholder })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(SelectContent, { children: agents.map((agent) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(SelectItem, { value: agent.id, children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_lucide_react9.Bot, { className: "h-4 w-4" }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "font-medium", children: agent.name }),
        agent.description && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "text-xs text-muted-foreground", children: agent.description })
      ] })
    ] }) }, agent.id)) })
  ] });
};

// src/components/AgentsPage.tsx
var import_jsx_runtime17 = require("react/jsx-runtime");

// src/components/ExecutionSteps.tsx
var import_react14 = __toESM(require("react"), 1);
var import_lucide_react10 = require("lucide-react");
var import_jsx_runtime18 = require("react/jsx-runtime");
var ExecutionSteps = ({ messages, className = "" }) => {
  const steps = import_react14.default.useMemo(() => {
    const stepsMap = /* @__PURE__ */ new Map();
    const allSteps = [];
    messages.forEach((message) => {
      message.parts.forEach((part) => {
        if (part.type === "tool_call") {
          const toolCall = part.tool_call;
          const step = {
            id: toolCall.tool_call_id,
            type: "tool_call",
            tool_call: toolCall,
            status: "running",
            timestamp: message.created_at
          };
          stepsMap.set(toolCall.tool_call_id, step);
          allSteps.push(step);
        } else if (part.type === "tool_result") {
          const toolResult = part.tool_result;
          const existingStep = stepsMap.get(toolResult.tool_call_id);
          if (existingStep) {
            existingStep.tool_result = toolResult;
            existingStep.status = toolResult.success ? "completed" : "error";
          } else {
            const step = {
              id: toolResult.tool_call_id,
              type: "tool_result",
              tool_result: toolResult,
              status: toolResult.success ? "completed" : "error",
              timestamp: message.created_at
            };
            allSteps.push(step);
          }
        } else if (part.type === "text" && part.text.trim()) {
          const step = {
            id: `response_${message.id}`,
            type: "response",
            content: part.text,
            status: "completed",
            timestamp: message.created_at
          };
          allSteps.push(step);
        }
      });
    });
    return allSteps;
  }, [messages]);
  const getStepIcon = (step) => {
    switch (step.status) {
      case "completed":
        return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react10.CheckCircle, { className: "w-4 h-4 text-green-600" });
      case "error":
        return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react10.AlertCircle, { className: "w-4 h-4 text-red-600" });
      case "running":
        return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react10.Clock, { className: "w-4 h-4 text-blue-600 animate-pulse" });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react10.Play, { className: "w-4 h-4 text-gray-400" });
    }
  };
  const getStepBadgeColor = (step) => {
    switch (step.status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const formatToolInput = (input) => {
    if (typeof input === "string") return input;
    return JSON.stringify(input, null, 2);
  };
  const formatToolResult = (result) => {
    if (typeof result === "string") return result;
    if (typeof result === "object") {
      try {
        const parsed = typeof result === "string" ? JSON.parse(result) : result;
        if (parsed.answer) return parsed.answer;
        if (parsed.results && Array.isArray(parsed.results)) {
          return parsed.results.map((r) => r.title || r.content || JSON.stringify(r)).join("\n");
        }
        return JSON.stringify(parsed, null, 2);
      } catch {
        return JSON.stringify(result, null, 2);
      }
    }
    return String(result);
  };
  if (steps.length === 0) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: `space-y-3 ${className}`, children: steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(Card, { className: "border-l-4 border-l-blue-200", children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(CardHeader, { className: "pb-2", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "flex items-center gap-2", children: [
        getStepIcon(step),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(CardTitle, { className: "text-sm font-medium", children: step.type === "tool_call" && step.tool_call ? `${step.tool_call.tool_name}` : step.type === "response" ? "Final Response" : "Tool Result" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Badge, { className: getStepBadgeColor(step), children: step.status })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(CardContent, { className: "pt-0", children: [
      step.type === "tool_call" && step.tool_call && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "text-xs text-gray-600", children: "Input:" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("pre", { className: "text-xs bg-gray-50 p-2 rounded overflow-x-auto", children: formatToolInput(step.tool_call.input) })
      ] }),
      step.tool_result && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "space-y-2 mt-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "text-xs text-gray-600", children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto", children: formatToolResult(step.tool_result.result) })
      ] }),
      step.type === "response" && step.content && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "text-sm", children: step.content })
    ] })
  ] }, step.id)) });
};

// src/components/TaskExecutionRenderer.tsx
var import_react15 = require("react");
var import_core6 = require("@distri/core");
var import_lucide_react11 = require("lucide-react");
var import_jsx_runtime19 = require("react/jsx-runtime");

// src/components/ChatContext.tsx
var import_react16 = require("react");
var import_jsx_runtime20 = require("react/jsx-runtime");
var ChatContext = (0, import_react16.createContext)(void 0);

// src/components/ui/input.tsx
var React15 = __toESM(require("react"), 1);
var import_jsx_runtime21 = require("react/jsx-runtime");
var Input = React15.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
      "input",
      {
        type,
        className: cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";

// src/components/ui/dialog.tsx
var React16 = __toESM(require("react"), 1);
var import_jsx_runtime22 = require("react/jsx-runtime");
var Dialog = React16.createContext({});
var DialogTrigger = React16.forwardRef(({ className, children, ...props }, ref) => {
  const context = React16.useContext(Dialog);
  return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
    "button",
    {
      ref,
      className: cn(className),
      onClick: () => context.onOpenChange?.(true),
      ...props,
      children
    }
  );
});
DialogTrigger.displayName = "DialogTrigger";
var DialogContent = React16.forwardRef(({ className, children, ...props }, ref) => {
  const context = React16.useContext(Dialog);
  if (!context.open) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
    "div",
    {
      ref,
      className: cn(
        "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
          "button",
          {
            className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            onClick: () => context.onOpenChange?.(false),
            children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
              "svg",
              {
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: "h-4 w-4",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("path", { d: "m18 6-12 12" }),
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("path", { d: "m6 6 12 12" })
                ]
              }
            )
          }
        )
      ]
    }
  ) });
});
DialogContent.displayName = "DialogContent";
var DialogHeader = React16.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
  "div",
  {
    ref,
    className: cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    ),
    ...props
  }
));
DialogHeader.displayName = "DialogHeader";
var DialogTitle = React16.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
  "h3",
  {
    ref,
    className: cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = "DialogTitle";

// src/components/ui/textarea.tsx
var React17 = __toESM(require("react"), 1);
var import_jsx_runtime23 = require("react/jsx-runtime");
var Textarea = React17.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
      "textarea",
      {
        className: cn(
          "flex min-h-[80px] w-full rounded-md border-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";

// src/components/ui/sidebar.tsx
var React21 = __toESM(require("react"), 1);
var import_react_slot = require("@radix-ui/react-slot");
var import_class_variance_authority3 = require("class-variance-authority");
var import_lucide_react13 = require("lucide-react");

// src/components/ui/separator.tsx
var React18 = __toESM(require("react"), 1);
var SeparatorPrimitive = __toESM(require("@radix-ui/react-separator"), 1);
var import_jsx_runtime24 = require("react/jsx-runtime");
var Separator2 = React18.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
    SeparatorPrimitive.Root,
    {
      ref,
      decorative,
      orientation,
      className: cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      ),
      ...props
    }
  )
);
Separator2.displayName = SeparatorPrimitive.Root.displayName;

// src/components/ui/sheet.tsx
var React19 = __toESM(require("react"), 1);
var SheetPrimitive = __toESM(require("@radix-ui/react-dialog"), 1);
var import_class_variance_authority2 = require("class-variance-authority");
var import_lucide_react12 = require("lucide-react");
var import_jsx_runtime25 = require("react/jsx-runtime");
var Sheet = SheetPrimitive.Root;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
  SheetPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
var sheetVariants = (0, import_class_variance_authority2.cva)(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
var SheetContent = React19.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(SheetPortal, { children: [
  /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(SheetOverlay, {}),
  /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      ...props,
      children: [
        children,
        /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(import_lucide_react12.X, { className: "h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
  "div",
  {
    className: cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    ),
    ...props
  }
);
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
SheetFooter.displayName = "SheetFooter";
var SheetTitle = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// src/components/ui/skeleton.tsx
var import_jsx_runtime26 = require("react/jsx-runtime");
function Skeleton({
  className,
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
    "div",
    {
      className: cn("animate-pulse rounded-md bg-muted", className),
      ...props
    }
  );
}

// src/components/ui/tooltip.tsx
var React20 = __toESM(require("react"), 1);
var TooltipPrimitive = __toESM(require("@radix-ui/react-tooltip"), 1);
var import_jsx_runtime27 = require("react/jsx-runtime");
var TooltipProvider = TooltipPrimitive.Provider;
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = React20.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// src/components/ui/sidebar.tsx
var import_jsx_runtime28 = require("react/jsx-runtime");
var SIDEBAR_COOKIE_NAME = "sidebar:state";
var SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
var SIDEBAR_WIDTH = "16rem";
var SIDEBAR_WIDTH_MOBILE = "18rem";
var SIDEBAR_WIDTH_ICON = "3rem";
var SIDEBAR_KEYBOARD_SHORTCUT = "b";
var SidebarContext = React21.createContext(null);
function useSidebar() {
  const context = React21.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
var SidebarProvider = React21.forwardRef(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  const [_open, _setOpen] = React21.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React21.useCallback(
    (value) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );
  const [openMobile, setOpenMobile] = React21.useState(false);
  const [isMobile, setIsMobile] = React21.useState(false);
  React21.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && open) {
        setOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setOpen, open]);
  React21.useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_COOKIE_NAME);
    if (savedState !== null) {
      setOpen(savedState === "true");
    }
  }, [setOpen]);
  React21.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);
  const toggleSidebar = React21.useCallback(() => {
    return isMobile ? setOpenMobile((open2) => !open2) : setOpen((open2) => !open2);
  }, [isMobile, setOpen, setOpenMobile]);
  const state = open ? "expanded" : "collapsed";
  const contextValue = React21.useMemo(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SidebarContext.Provider, { value: contextValue, children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(TooltipProvider, { delayDuration: 0, children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    "div",
    {
      style: {
        "--sidebar-width": SIDEBAR_WIDTH,
        "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
        ...style
      },
      className: cn(
        "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
        className
      ),
      ref,
      ...props,
      children
    }
  ) }) });
});
SidebarProvider.displayName = "SidebarProvider";
var Sidebar = React21.forwardRef(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (collapsible === "none") {
    return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
      "div",
      {
        className: cn(
          "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
          className
        ),
        ref,
        ...props,
        children
      }
    );
  }
  if (isMobile) {
    return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Sheet, { open: openMobile, onOpenChange: setOpenMobile, ...props, children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
      SheetContent,
      {
        "data-sidebar": "sidebar",
        "data-mobile": "true",
        className: "w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
        style: {
          "--sidebar-width": SIDEBAR_WIDTH_MOBILE
        },
        side,
        children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "flex h-full w-full flex-col", children })
      }
    ) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(
    "div",
    {
      ref,
      className: "group peer hidden md:block text-sidebar-foreground",
      "data-state": state,
      "data-collapsible": state === "collapsed" ? collapsible : "",
      "data-variant": variant,
      "data-side": side,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
          "div",
          {
            className: cn(
              "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
              "group-data-[collapsible=offcanvas]:w-0",
              "group-data-[side=right]:rotate-180",
              variant === "floating" || variant === "inset" ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]" : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
            )
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
          "div",
          {
            className: cn(
              "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
              side === "left" ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]" : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
              // Adjust the padding for floating and inset variants.
              variant === "floating" || variant === "inset" ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]" : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
              className
            ),
            ...props,
            children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
              "div",
              {
                "data-sidebar": "sidebar",
                className: "flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow",
                children
              }
            )
          }
        )
      ]
    }
  );
});
Sidebar.displayName = "Sidebar";
var SidebarTrigger = React21.forwardRef(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(
    Button,
    {
      ref,
      "data-sidebar": "trigger",
      variant: "ghost",
      size: "icon",
      className: cn("h-7 w-7", className),
      onClick: (event) => {
        onClick?.(event);
        toggleSidebar();
      },
      ...props,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(import_lucide_react13.PanelLeft, {}),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("span", { className: "sr-only", children: "Toggle Sidebar" })
      ]
    }
  );
});
SidebarTrigger.displayName = "SidebarTrigger";
var SidebarRail = React21.forwardRef(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    "button",
    {
      ref,
      "data-sidebar": "rail",
      "aria-label": "Toggle Sidebar",
      tabIndex: -1,
      onClick: toggleSidebar,
      title: "Toggle Sidebar",
      className: cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] after:-translate-x-1/2 after:bg-sidebar-border hover:after:bg-sidebar-accent-foreground group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      ),
      ...props
    }
  );
});
SidebarRail.displayName = "SidebarRail";
var SidebarInset = React21.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    "main",
    {
      ref,
      className: cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      ),
      ...props
    }
  );
});
SidebarInset.displayName = "SidebarInset";
var SidebarHeader = React21.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    "div",
    {
      ref,
      "data-sidebar": "header",
      className: cn("flex flex-col gap-2 p-2", className),
      ...props
    }
  );
});
SidebarHeader.displayName = "SidebarHeader";
var SidebarFooter = React21.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    "div",
    {
      ref,
      "data-sidebar": "footer",
      className: cn("flex flex-col gap-2 p-2", className),
      ...props
    }
  );
});
SidebarFooter.displayName = "SidebarFooter";
var SidebarSeparator = React21.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    Separator2,
    {
      ref,
      "data-sidebar": "separator",
      className: cn("mx-2 w-auto bg-sidebar-border", className),
      ...props
    }
  );
});
SidebarSeparator.displayName = "SidebarSeparator";
var SidebarContent = React21.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    "div",
    {
      ref,
      "data-sidebar": "content",
      className: cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      ),
      ...props
    }
  );
});
SidebarContent.displayName = "SidebarContent";
var SidebarGroup = React21.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    "div",
    {
      ref,
      "data-sidebar": "group",
      className: cn("relative flex w-full min-w-0 flex-col p-2", className),
      ...props
    }
  );
});
SidebarGroup.displayName = "SidebarGroup";
var SidebarGroupLabel = React21.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "div";
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    Comp,
    {
      ref,
      "data-sidebar": "group-label",
      className: cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      ),
      ...props
    }
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";
var SidebarGroupAction = React21.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "button";
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    Comp,
    {
      ref,
      "data-sidebar": "group-action",
      className: cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";
var SidebarGroupContent = React21.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    "div",
    {
      ref,
      "data-sidebar": "group-content",
      className: cn("w-full text-sm", className),
      ...props
    }
  );
});
SidebarGroupContent.displayName = "SidebarGroupContent";
var SidebarMenu = React21.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    "ul",
    {
      ref,
      "data-sidebar": "menu",
      className: cn("flex w-full min-w-0 flex-col gap-1", className),
      ...props
    }
  );
});
SidebarMenu.displayName = "SidebarMenu";
var SidebarMenuItem = React21.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    "li",
    {
      ref,
      "data-sidebar": "menu-item",
      className: cn("group/menu-item relative", className),
      ...props
    }
  );
});
SidebarMenuItem.displayName = "SidebarMenuItem";
var sidebarMenuButtonVariants = (0, import_class_variance_authority3.cva)(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline: "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]"
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!size-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
var SidebarMenuButton = React21.forwardRef(({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "button";
  const { isMobile, state } = useSidebar();
  const button = /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    Comp,
    {
      ref,
      "data-sidebar": "menu-button",
      "data-size": size,
      "data-active": isActive,
      className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      ...props
    }
  );
  if (!tooltip) {
    return button;
  }
  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip
    };
  }
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(Tooltip, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(TooltipTrigger, { asChild: true, children: button }),
    /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
      TooltipContent,
      {
        side: "right",
        align: "center",
        hidden: state !== "collapsed" || isMobile,
        ...tooltip
      }
    )
  ] });
});
SidebarMenuButton.displayName = "SidebarMenuButton";
var SidebarMenuAction = React21.forwardRef(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "button";
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    Comp,
    {
      ref,
      "data-sidebar": "menu-action",
      className: cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover && "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      ),
      ...props
    }
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";
var SidebarMenuBadge = React21.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    "div",
    {
      ref,
      "data-sidebar": "menu-badge",
      className: cn(
        "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  );
});
SidebarMenuBadge.displayName = "SidebarMenuBadge";
var SidebarMenuSkeleton = React21.forwardRef(({ className, showIcon = false, ...props }, ref) => {
  const width = React21.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(
    "div",
    {
      ref,
      "data-sidebar": "menu-skeleton",
      className: cn("rounded-md h-8 flex gap-2 px-2 items-center", className),
      ...props,
      children: [
        showIcon && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Skeleton, { className: "size-4 rounded-md", "data-sidebar": "menu-skeleton-icon" }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
          Skeleton,
          {
            className: "h-4 flex-1 max-w-[--skeleton-width]",
            "data-sidebar": "menu-skeleton-text",
            style: {
              "--skeleton-width": width
            }
          }
        )
      ]
    }
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";
var SidebarMenuSub = React21.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    "ul",
    {
      ref,
      "data-sidebar": "menu-sub",
      className: cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  );
});
SidebarMenuSub.displayName = "SidebarMenuSub";
var SidebarMenuSubItem = React21.forwardRef(({ ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("li", { ref, ...props });
});
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
var SidebarMenuSubButton = React21.forwardRef(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "a";
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
    Comp,
    {
      ref,
      "data-sidebar": "menu-sub-button",
      "data-size": size,
      "data-active": isActive,
      className: cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-foreground/50",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

// src/components/Components.tsx
var import_jsx_runtime29 = require("react/jsx-runtime");
var MessageContainer = ({ children, align = "left", className = "", backgroundColor }) => {
  const justifyClass = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  const getBgClass = (color) => {
    switch (color) {
      case "#343541":
        return "bg-background";
      case "#444654":
        return "bg-muted";
      case "#40414f":
        return "bg-background";
      default:
        return "";
    }
  };
  const bgClass = backgroundColor ? getBgClass(backgroundColor) : "";
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: `flex ${justifyClass} w-full ${bgClass} ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "w-full max-w-4xl mx-auto", children }) });
};
var UserMessage = ({
  content,
  message,
  timestamp,
  className = "",
  avatar
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(MessageContainer, { align: "center", className, backgroundColor: "#343541", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "distri-avatar distri-avatar-user", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react14.User, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-sm font-medium text-foreground mb-2", children: "You" }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
        MessageRenderer_default,
        {
          content,
          message,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var AssistantMessage = ({
  content,
  message,
  timestamp,
  isStreaming = false,
  metadata: _metadata,
  className = "",
  avatar,
  name = "Assistant"
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(MessageContainer, { align: "center", className, backgroundColor: "#444654", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "distri-avatar distri-avatar-assistant", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react14.Bot, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "text-sm font-medium text-foreground mb-2 flex items-center gap-2", children: [
        name,
        isStreaming && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse" }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
        MessageRenderer_default,
        {
          content,
          message,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var AssistantWithToolCalls2 = ({
  content,
  message,
  toolCallStates,
  timestamp,
  isStreaming = false,
  className = "",
  avatar,
  name = "Assistant",
  ToolResultRenderer: ToolResultRenderer2,
  onToolResult
}) => {
  const [expandedTools, setExpandedTools] = (0, import_react17.useState)(/* @__PURE__ */ new Set());
  const toggleToolExpansion = (toolCallId) => {
    setExpandedTools((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toolCallId)) {
        newSet.delete(toolCallId);
      } else {
        newSet.add(toolCallId);
      }
      return newSet;
    });
  };
  import_react17.default.useEffect(() => {
    const newExpanded = new Set(expandedTools);
    toolCallStates.forEach((toolCallState) => {
      if (toolCallState.status === "running" || toolCallState.status === "error" || toolCallState.status === "user_action_required") {
        newExpanded.add(toolCallState.tool_call_id);
      }
    });
    setExpandedTools(newExpanded);
  }, [toolCallStates]);
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(MessageContainer, { align: "center", className, backgroundColor: "#444654", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "distri-avatar distri-avatar-assistant", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react14.Bot, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "text-sm font-medium text-foreground mb-2 flex items-center gap-2", children: [
        name,
        isStreaming && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse" }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
        MessageRenderer_default,
        {
          content,
          message,
          className: "text-foreground"
        }
      ) }),
      toolCallStates.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "mt-4 space-y-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-sm font-medium text-foreground", children: "Tool Calls" }),
        toolCallStates.map((toolCallState, index) => {
          const isExpanded = expandedTools.has(toolCallState.tool_call_id);
          const hasResult = toolCallState?.result !== void 0;
          const hasError = toolCallState?.error !== void 0;
          const canCollapse = hasResult || hasError || toolCallState?.status === "completed" || toolCallState?.status === "error";
          return /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "border rounded-lg bg-background overflow-hidden", children: [
            /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "p-3 border-b border-border", children: [
              /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
                    "button",
                    {
                      onClick: () => toggleToolExpansion(toolCallState.tool_call_id),
                      className: "p-1 hover:bg-muted rounded transition-colors",
                      disabled: !canCollapse,
                      children: canCollapse ? isExpanded ? /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react14.ChevronDown, { className: "h-3 w-3 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react14.ChevronRight, { className: "h-3 w-3 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "h-3 w-3" })
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react14.Wrench, { className: "h-4 w-4 text-green-500" }),
                  /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { className: "text-sm font-medium text-foreground", children: toolCallState?.tool_name })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center gap-2", children: [
                  toolCallState?.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center gap-1 text-xs text-yellow-600", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react14.Clock, { className: "h-3 w-3" }),
                    "Pending"
                  ] }),
                  toolCallState?.status === "running" && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center gap-1 text-xs text-blue-600", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react14.Loader2, { className: "h-3 w-3 animate-spin" }),
                    "Running"
                  ] }),
                  toolCallState?.status === "completed" && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center gap-1 text-xs text-green-600", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react14.CheckCircle, { className: "h-3 w-3" }),
                    "Completed"
                  ] }),
                  toolCallState?.status === "error" && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center gap-1 text-xs text-red-600", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react14.XCircle, { className: "h-3 w-3" }),
                    "Failed"
                  ] }),
                  toolCallState?.status === "user_action_required" && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center gap-1 text-xs text-orange-600", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react14.Wrench, { className: "h-3 w-3" }),
                    "User Action Required"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "mt-2", children: [
                /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-xs text-muted-foreground mb-1", children: "Input:" }),
                /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-xs font-mono bg-muted p-2 rounded border", children: JSON.stringify(toolCallState?.input, null, 2) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "mt-3", children: !!toolCallState?.component && toolCallState.component })
            ] }),
            canCollapse && isExpanded && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "p-3 bg-muted/30", children: ToolResultRenderer2 ? /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
              ToolResultRenderer2,
              {
                toolCallId: toolCallState.tool_call_id,
                toolName: toolCallState.tool_name,
                result: toolCallState.result,
                success: toolCallState.status === "completed",
                error: toolCallState.error,
                onSendResponse: onToolResult
              }
            ) : /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)(import_jsx_runtime29.Fragment, { children: [
              hasError && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "mb-3", children: [
                /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-xs text-red-600 font-medium mb-1", children: "Error:" }),
                /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200", children: toolCallState?.error })
              ] }),
              hasResult && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-xs text-muted-foreground font-medium mb-1", children: "Result:" }),
                /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-xs font-mono bg-background p-2 rounded border", children: JSON.stringify(toolCallState?.result, null, 2) })
              ] })
            ] }) })
          ] }, index);
        })
      ] }),
      timestamp && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var PlanMessage = ({
  message,
  plan,
  timestamp,
  className = "",
  avatar
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(MessageContainer, { align: "center", className, backgroundColor: "#40414f", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "distri-avatar distri-avatar-plan", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react14.Brain, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-sm font-medium text-foreground mb-2", children: "Plan" }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
        MessageRenderer_default,
        {
          content: plan,
          message,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var DebugMessage = ({
  message,
  className = "",
  timestamp
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(MessageContainer, { align: "center", className, backgroundColor: "#343541", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
      MessageRenderer_default,
      {
        content: JSON.stringify(message),
        className: "text-foreground"
      }
    ) }),
    timestamp && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
  ] }) });
};

// src/components/renderers/ArtifactRenderer.tsx
var import_jsx_runtime30 = require("react/jsx-runtime");

// src/components/renderers/PlanRenderer.tsx
var import_jsx_runtime31 = require("react/jsx-runtime");

// src/components/renderers/MessageRenderer.tsx
var import_react18 = __toESM(require("react"), 1);
var import_lucide_react15 = require("lucide-react");
var import_core7 = require("@distri/core");
var import_jsx_runtime32 = require("react/jsx-runtime");
var CodeBlock = ({ code, language = "text", className = "" }) => {
  const [copied, setCopied] = import_react18.default.useState(false);
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: `relative my-3 ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "flex justify-between items-center bg-muted px-3 py-1.5 rounded-t-md border-b text-xs", children: [
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("span", { className: "text-muted-foreground font-mono", children: language || "text" }),
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
        "button",
        {
          onClick: copyToClipboard,
          className: "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors",
          children: copied ? /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_lucide_react15.Check, { className: "w-3 h-3" }),
            "Copied"
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_lucide_react15.Copy, { className: "w-3 h-3" }),
            "Copy"
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "bg-muted/50 rounded-b-md overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("pre", { className: "p-3 overflow-x-auto text-xs", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("code", { className: "font-mono whitespace-pre-wrap break-words", children: code }) }) })
  ] });
};
var PartRenderer = ({ part }) => {
  switch (part.type) {
    case "text":
      return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "whitespace-pre-wrap break-words text-foreground text-sm leading-relaxed", children: part.text });
    case "tool_call":
      return /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-md p-3 my-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_lucide_react15.Wrench, { className: "w-3 h-3 text-blue-500" }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("span", { className: "font-medium text-blue-600 text-xs", children: [
            "Tool Call: ",
            part.tool_call.tool_name
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "text-xs text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("strong", { children: "Input:" }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("pre", { className: "mt-1 bg-muted p-2 rounded text-xs overflow-x-auto", children: JSON.stringify(part.tool_call.input, null, 2) })
        ] })
      ] });
    case "tool_result":
      return /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "bg-green-500/10 border border-green-500/20 rounded-md p-3 my-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_lucide_react15.Check, { className: "w-3 h-3 text-green-500" }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("span", { className: "font-medium text-green-600 text-xs", children: "Tool Result" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "text-xs text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("strong", { children: "Result:" }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("pre", { className: "mt-1 bg-muted p-2 rounded text-xs overflow-x-auto", children: JSON.stringify(part.tool_result.result, null, 2) })
        ] })
      ] });
    case "plan":
      return /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "bg-purple-500/10 border border-purple-500/20 rounded-md p-3 my-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_lucide_react15.Brain, { className: "w-3 h-3 text-purple-500" }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("span", { className: "font-medium text-purple-600 text-xs", children: "Plan" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "text-xs whitespace-pre-wrap text-muted-foreground", children: part.plan })
      ] });
    case "code_observation":
      return /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 my-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_lucide_react15.FileText, { className: "w-3 h-3 text-yellow-500" }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("span", { className: "font-medium text-yellow-600 text-xs", children: "Code Observation" })
        ] }),
        part.thought && /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "text-xs text-muted-foreground mb-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("strong", { children: "Thought:" }),
          " ",
          part.thought
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(CodeBlock, { code: part.code, language: "text" })
      ] });
    case "image_url":
      return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "my-2", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
        "img",
        {
          src: part.image.url,
          alt: part.image.name || "Image",
          className: "max-w-full h-auto rounded-md border"
        }
      ) });
    case "image_bytes":
      return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "my-2", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
        "img",
        {
          src: `data:${part.image.mime_type};base64,${part.image.data}`,
          alt: part.image.name || "Image",
          className: "max-w-full h-auto rounded-md border"
        }
      ) });
    default:
      return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "bg-muted p-2 rounded text-xs", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("pre", { className: "text-muted-foreground", children: JSON.stringify(part, null, 2) }) });
  }
};
var MessageRenderer = ({
  content,
  message,
  className = "",
  metadata: _metadata,
  messages
  // Add this prop to detect execution sequences
}) => {
  const isExecutionSequence = (0, import_react18.useMemo)(() => {
    if (!messages || messages.length <= 1) return false;
    return messages.some(
      (msg) => (0, import_core7.isDistriMessage)(msg) && msg.parts.some((part) => part.type === "tool_call" || part.type === "tool_result")
    );
  }, [messages]);
  if (isExecutionSequence && messages) {
    const distriMessages = messages.filter(import_core7.isDistriMessage);
    return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: `space-y-4 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(ExecutionSteps, { messages: distriMessages }) });
  }
  if (message && (0, import_core7.isDistriMessage)(message)) {
    const hasToolCalls = message.parts.some((part) => part.type === "tool_call");
    const filteredParts = hasToolCalls ? message.parts.filter((part) => part.type !== "tool_result") : message.parts;
    const groupedParts = [];
    let currentTextGroup = [];
    for (const part of filteredParts) {
      if (part.type === "text") {
        currentTextGroup.push(part);
      } else {
        if (currentTextGroup.length > 0) {
          groupedParts.push([...currentTextGroup]);
          currentTextGroup = [];
        }
        groupedParts.push([part]);
      }
    }
    if (currentTextGroup.length > 0) {
      groupedParts.push(currentTextGroup);
    }
    return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: `space-y-2 ${className}`, children: groupedParts.map((group, groupIndex) => {
      if (group.length > 1 && group.every((part) => part.type === "text")) {
        const concatenatedText = group.map((part) => part.type === "text" ? part.text : "").join("");
        return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
          MessageRenderer,
          {
            content: concatenatedText,
            className
          },
          groupIndex
        );
      } else {
        const part = group[0];
        return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(PartRenderer, { part }, groupIndex);
      }
    }) });
  } else if (message) {
    return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: `whitespace-pre-wrap break-words text-foreground ${className}`, children: JSON.stringify(message, null, 2) });
  } else if (!message && content) {
    return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: `whitespace-pre-wrap break-words text-foreground ${className}`, children: content });
  }
  return null;
};
var MessageRenderer_default = MessageRenderer;

// src/components/Chat.tsx
var import_lucide_react16 = require("lucide-react");
var import_jsx_runtime33 = require("react/jsx-runtime");
function Planning() {
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "flex items-center justify-between p-2 bg-muted/30 rounded-md text-xs text-muted-foreground mb-4", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "flex items-center space-x-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "w-3 h-3 rounded-full bg-blue-500/20 flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react16.Loader2, { className: "w-2 h-2 text-blue-500 animate-spin" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("span", { children: "Planning..." })
  ] }) });
}
function ToolExecution({
  toolCall,
  isExpanded,
  onToggle
}) {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case "running":
        return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react16.Loader2, { className: "w-3 h-3 animate-spin text-blue-500" });
      case "completed":
        return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react16.CheckCircle, { className: "w-3 h-3 text-green-500" });
      case "error":
        return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react16.XCircle, { className: "w-3 h-3 text-red-500" });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react16.Clock, { className: "w-3 h-3 text-muted-foreground" });
    }
  };
  const getStatusText = () => {
    switch (toolCall.status) {
      case "running":
        return "Running";
      case "completed":
        return "Completed";
      case "error":
        return "Failed";
      default:
        return "Pending";
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "mb-3", children: [
    /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "flex items-center justify-between p-2 bg-muted/50 rounded-md text-xs", children: [
      /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "flex items-center space-x-2", children: [
        getStatusIcon(),
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("span", { className: "font-medium", children: toolCall.step_title || toolCall.tool_name }),
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(Badge, { variant: "secondary", className: "text-xs px-1 py-0 h-4", children: getStatusText() })
      ] }),
      (toolCall.result || toolCall.error || toolCall.input) && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          },
          className: "p-1 h-5 w-5 text-xs",
          children: isExpanded ? /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react16.ChevronDown, { className: "w-3 h-3" }) : /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react16.ChevronRight, { className: "w-3 h-3" })
        }
      )
    ] }),
    isExpanded && (toolCall.result || toolCall.error || toolCall.input) && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(Card, { className: "mt-2", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(CardContent, { className: "p-2 space-y-2", children: [
      toolCall.input && /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "text-xs", children: [
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("strong", { className: "text-muted-foreground", children: "Arguments:" }),
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-y-auto", children: typeof toolCall.input === "string" ? toolCall.input : JSON.stringify(toolCall.input, null, 2) })
      ] }),
      toolCall.error ? /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "text-xs text-destructive", children: [
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("strong", { children: "Error:" }),
        " ",
        toolCall.error
      ] }) : toolCall.result && /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "text-xs", children: [
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("strong", { className: "text-muted-foreground", children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-y-auto", children: typeof toolCall.result === "string" ? toolCall.result : JSON.stringify(toolCall.result, null, 2) })
      ] })
    ] }) })
  ] });
}
function StreamingMessage({ content, isStreaming }) {
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "flex items-center space-x-2 mb-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "w-2.5 h-2.5 text-green-500 font-bold text-xs", children: "A" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "flex-1", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "prose prose-sm max-w-none dark:prose-invert", children: [
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("p", { className: "text-sm leading-relaxed", children: content }),
      isStreaming && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("span", { className: "inline-block w-1 h-3 bg-green-500 animate-pulse ml-1" })
    ] }) })
  ] });
}
function GeneratingStatus({ onStop }) {
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "flex items-center justify-between p-2 bg-muted/30 rounded-md text-xs text-muted-foreground mb-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "w-3 h-3 rounded-full bg-blue-500/20 flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react16.Loader2, { className: "w-2 h-2 text-blue-500 animate-spin" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("span", { children: "Generating" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: onStop,
        className: "p-1 h-5 text-xs text-muted-foreground hover:text-foreground",
        children: "Stop"
      }
    )
  ] });
}
function useChatState() {
  const messages = useChatStateStore((state) => state.messages);
  const isStreaming = useChatStateStore((state) => state.isStreaming);
  const isLoading = useChatStateStore((state) => state.isLoading);
  const error = useChatStateStore((state) => state.error);
  const toolCalls = useChatStateStore((state) => state.toolCalls);
  const currentTaskId = useChatStateStore((state) => state.currentTaskId);
  const currentPlanId = useChatStateStore((state) => state.currentPlanId);
  const tasks = useChatStateStore((state) => state.tasks);
  const plans = useChatStateStore((state) => state.plans);
  const currentTask = currentTaskId ? tasks.get(currentTaskId) || null : null;
  const currentPlan = currentPlanId ? plans.get(currentPlanId) || null : null;
  const pendingToolCalls = Array.from(toolCalls.values()).filter(
    (toolCall) => toolCall.status === "pending" || toolCall.status === "running"
  );
  const completedToolCalls = Array.from(toolCalls.values()).filter(
    (toolCall) => toolCall.status === "completed" || toolCall.status === "error"
  );
  const hasPendingToolCalls = pendingToolCalls.length > 0;
  return {
    messages,
    isStreaming,
    isLoading,
    error,
    currentTask,
    currentPlan,
    pendingToolCalls,
    completedToolCalls,
    hasPendingToolCalls
  };
}
function Chat({
  threadId,
  agent,
  onMessage,
  onError,
  getMetadata,
  onMessagesUpdate,
  tools,
  MessageRenderer: CustomMessageRenderer,
  theme = "auto"
}) {
  const [input, setInput] = (0, import_react19.useState)("");
  const [expandedTools, setExpandedTools] = (0, import_react19.useState)(/* @__PURE__ */ new Set());
  const messagesEndRef = (0, import_react19.useRef)(null);
  const {
    sendMessage,
    stopStreaming,
    chatState
  } = useChat({
    threadId,
    agent,
    onMessage,
    onError,
    getMetadata,
    onMessagesUpdate,
    tools
  });
  const {
    messages,
    isStreaming,
    isLoading,
    error,
    currentTask,
    currentPlan,
    pendingToolCalls,
    completedToolCalls,
    hasPendingToolCalls
  } = useChatState();
  const handleSendMessage = (0, import_react19.useCallback)(async (content) => {
    if (!content.trim()) return;
    setInput("");
    await sendMessage(content);
  }, [sendMessage]);
  const handleStopStreaming = (0, import_react19.useCallback)(() => {
    stopStreaming();
  }, [stopStreaming]);
  const toggleToolExpansion = (0, import_react19.useCallback)((toolId) => {
    setExpandedTools((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
      } else {
        newSet.add(toolId);
      }
      return newSet;
    });
  }, []);
  (0, import_react19.useEffect)(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const MessageRendererComponent = CustomMessageRenderer || MessageRenderer_default;
  const getThemeClasses = () => {
    if (theme === "dark") return "dark";
    if (theme === "light") return "";
    return "";
  };
  const renderMessages = () => {
    const elements = [];
    messages.forEach((message, index) => {
      if ((0, import_core8.isDistriMessage)(message)) {
        const distriMessage = message;
        if (distriMessage.role === "user") {
          elements.push(
            /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "flex items-center space-x-2 mb-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "w-2.5 h-2.5 text-blue-500 font-bold text-xs", children: "U" }) }),
              /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "flex-1", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("p", { className: "text-sm leading-relaxed", children: distriMessage.parts.find((p) => p.type === "text")?.text || "User message" }) })
            ] }, `user-${index}`)
          );
        }
        if (distriMessage.role === "assistant") {
          elements.push(
            /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "max-w-3xl w-full", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
              MessageRendererComponent,
              {
                message: distriMessage
              }
            ) }) }, `message-${index}`)
          );
        }
      }
    });
    if (currentPlan?.status === "running") {
      elements.push(/* @__PURE__ */ (0, import_jsx_runtime33.jsx)(Planning, {}, "planning"));
    }
    const allToolCalls = [...pendingToolCalls, ...completedToolCalls];
    allToolCalls.forEach((toolCall) => {
      elements.push(
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "flex justify-center mb-3", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "max-w-3xl w-full", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
          ToolExecution,
          {
            toolCall,
            isExpanded: expandedTools.has(toolCall.tool_call_id),
            onToggle: () => toggleToolExpansion(toolCall.tool_call_id)
          }
        ) }) }, `tool-${toolCall.tool_call_id}`)
      );
    });
    if (isStreaming) {
      const lastMessage = messages[messages.length - 1];
      if ((0, import_core8.isDistriMessage)(lastMessage)) {
        const textContent = lastMessage.parts.filter((p) => p.type === "text").map((p) => p.text).join("");
        if (textContent) {
          elements.push(
            /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "max-w-3xl w-full", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
              StreamingMessage,
              {
                content: textContent,
                isStreaming: true
              }
            ) }) }, "streaming")
          );
        }
      }
    }
    return elements;
  };
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: `flex flex-col h-full ${getThemeClasses()}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "flex-1 overflow-y-auto p-4 space-y-3 bg-background text-foreground", children: [
      renderMessages(),
      isStreaming && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(GeneratingStatus, { onStop: handleStopStreaming }),
      process.env.NODE_ENV === "development" && false,
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { ref: messagesEndRef })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "border-t border-border p-4 bg-background", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
      ChatInput,
      {
        value: input,
        onChange: setInput,
        onSend: () => handleSendMessage(input),
        onStop: handleStopStreaming,
        placeholder: "Type your message...",
        disabled: isLoading || hasPendingToolCalls,
        isStreaming
      }
    ) }),
    error && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "p-4 bg-destructive/10 border-l-4 border-destructive", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "text-destructive text-xs", children: [
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("strong", { children: "Error:" }),
      " ",
      error.message
    ] }) })
  ] });
}

// src/utils/messageUtils.ts
var import_core9 = require("@distri/core");
var extractTextFromMessage = (message) => {
  if ((0, import_core9.isDistriMessage)(message)) {
    if (!message?.parts || !Array.isArray(message.parts)) {
      return "";
    }
    const textParts = message.parts.filter((part) => part?.type === "text" && part?.text).map((part) => part.text);
    return textParts.join("") || "";
  } else {
    return JSON.stringify(message);
  }
};
var shouldDisplayMessage = (message, showDebugMessages = false) => {
  if (!message) return false;
  if ((0, import_core9.isDistriArtifact)(message)) {
    return true;
  }
  if ((0, import_core9.isDistriMessage)(message)) {
    const textContent = extractTextFromMessage(message);
    if (textContent.trim()) return true;
  }
  return showDebugMessages;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentSelect,
  ApprovalToolCall,
  AssistantMessage,
  AssistantWithToolCalls,
  Chat,
  ChatInput,
  DebugMessage,
  DistriProvider,
  PlanMessage,
  ThemeProvider,
  ThemeToggle,
  ToastToolCall,
  UserMessage,
  extractTextFromMessage,
  registerTools,
  shouldDisplayMessage,
  useAgent,
  useAgentDefinitions,
  useChat,
  useDistri,
  useTheme,
  useThreads
});
