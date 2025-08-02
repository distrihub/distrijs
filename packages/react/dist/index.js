"use client";

// src/DistriProvider.tsx
import { createContext as createContext2, useContext as useContext2, useEffect as useEffect2, useState as useState2 } from "react";
import { DistriClient } from "@distri/core";

// src/components/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { jsx } from "react/jsx-runtime";
var initialState = {
  theme: "system",
  setTheme: () => null
};
var ThemeProviderContext = createContext(initialState);
function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "distri-theme",
  ...props
}) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }
    return defaultTheme === "system" ? "dark" : defaultTheme;
  });
  useEffect(() => {
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
  return /* @__PURE__ */ jsx(ThemeProviderContext.Provider, { ...props, value, children });
}
var useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === void 0)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

// src/DistriProvider.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var DistriContext = createContext2({
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
  const [client, setClient] = useState2(null);
  const [error, setError] = useState2(null);
  const [isLoading, setIsLoading] = useState2(true);
  useEffect2(() => {
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
  return /* @__PURE__ */ jsx2(ThemeProvider, { defaultTheme, children: /* @__PURE__ */ jsx2(DistriContext.Provider, { value: contextValue, children }) });
}
function useDistri() {
  const context = useContext2(DistriContext);
  if (!context) {
    throw new Error("useDistri must be used within a DistriProvider");
  }
  return context;
}

// src/useAgent.ts
import React2, { useState as useState3, useCallback, useRef } from "react";
import {
  Agent
} from "@distri/core";
function useAgent({
  agentIdOrDef
}) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agent, setAgent] = useState3(null);
  const [loading, setLoading] = useState3(false);
  const [error, setError] = useState3(null);
  const agentRef = useRef(null);
  const currentAgentIdRef = useRef(null);
  const initializeAgent = useCallback(async () => {
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
      const newAgent = await Agent.create(agentIdOrDef, client);
      agentRef.current = newAgent;
      currentAgentIdRef.current = agentIdOrDef;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create agent"));
    } finally {
      setLoading(false);
    }
  }, [client, agentIdOrDef]);
  React2.useEffect(() => {
    if (!clientLoading && !clientError && client) {
      initializeAgent();
    }
  }, [clientLoading, clientError, client, agentIdOrDef, initializeAgent]);
  React2.useEffect(() => {
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
import { useState as useState4, useEffect as useEffect3, useCallback as useCallback2 } from "react";
function useAgentDefinitions() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = useState4([]);
  const [loading, setLoading] = useState4(true);
  const [error, setError] = useState4(null);
  const fetchAgents = useCallback2(async () => {
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
  useEffect3(() => {
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
import { useState as useState7, useCallback as useCallback4, useEffect as useEffect6, useRef as useRef3 } from "react";
import { DistriClient as DistriClient2 } from "@distri/core";
import {
  convertDistriMessageToA2A
} from "@distri/core";

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
import { useEffect as useEffect5, useRef as useRef2 } from "react";

// src/components/toolcalls/ApprovalToolCall.tsx
import { useState as useState5 } from "react";

// src/components/ui/button.tsx
import * as React3 from "react";

// src/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/components/ui/button.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
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
    return /* @__PURE__ */ jsx3(
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
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { jsx as jsx4, jsxs } from "react/jsx-runtime";
var ApprovalToolCall = ({
  toolCall,
  completeTool
}) => {
  const [isProcessing, setIsProcessing] = useState5(false);
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
    return /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-4 bg-muted/50", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        result.approved ? /* @__PURE__ */ jsx4(CheckCircle, { className: "h-4 w-4 text-green-600" }) : /* @__PURE__ */ jsx4(XCircle, { className: "h-4 w-4 text-red-600" }),
        /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
          "Approval ",
          result.approved ? "Granted" : "Denied"
        ] })
      ] }),
      /* @__PURE__ */ jsx4("p", { className: "text-sm text-muted-foreground", children: reason })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-4 bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx4(AlertTriangle, { className: "h-4 w-4 text-amber-500" }),
      /* @__PURE__ */ jsx4("span", { className: "font-medium", children: "Approval Required" })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "text-sm mb-4", children: reason }),
    toolCallsToApprove.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx4("p", { className: "text-xs text-muted-foreground mb-2", children: "Tool calls requiring approval:" }),
      /* @__PURE__ */ jsx4("div", { className: "space-y-1", children: toolCallsToApprove.map((tc, index) => /* @__PURE__ */ jsx4("div", { className: "text-xs bg-muted p-2 rounded", children: /* @__PURE__ */ jsx4("span", { className: "font-mono", children: tc.tool_name }) }, index)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx4(
        Button,
        {
          size: "sm",
          variant: "destructive",
          onClick: () => handleResponse(false),
          disabled: isProcessing,
          children: "Deny"
        }
      ),
      /* @__PURE__ */ jsx4(
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
import { useEffect as useEffect4 } from "react";
import { toast } from "sonner";
import { Fragment, jsx as jsx5 } from "react/jsx-runtime";
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
      method = toast.success;
      break;
    case "error":
      method = toast.error;
      break;
    case "warning":
      method = toast.warning;
      break;
    default:
      method = toast.info;
  }
  ;
  let duration = 500;
  useEffect4(() => {
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
  return /* @__PURE__ */ jsx5(Fragment, {});
};

// src/hooks/registerTools.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function registerTools({ agent, tools }) {
  const lastAgentIdRef = useRef2(null);
  useEffect5(() => {
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
      return /* @__PURE__ */ jsx6(ToastToolCall, { ...props });
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

// src/hooks/useToolCallState.ts
import { useState as useState6, useCallback as useCallback3 } from "react";
function useToolCallState(options) {
  const [toolCallStates, setToolCallStates] = useState6(/* @__PURE__ */ new Map());
  const { onAllToolsCompleted, agent, tools } = options;
  const executeTool = async (tool, toolCall) => {
    if (!tool) {
      console.error(`Tool ${toolCall.tool_name} not found`);
      return;
    }
    let component;
    if (tool.type === "ui") {
      component = tool.component({
        toolCall,
        toolCallState: toolCallStates.get(toolCall.tool_call_id),
        completeTool: (result) => {
          updateToolCallStatus(toolCall.tool_call_id, {
            status: "completed",
            result,
            completedAt: /* @__PURE__ */ new Date()
          });
        }
      });
      updateToolCallStatus(toolCall.tool_call_id, {
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        component,
        status: "running",
        startedAt: /* @__PURE__ */ new Date()
      });
    } else {
      try {
        const result = await tool.handler(toolCall.input);
        console.log("result", result);
        updateToolCallStatus(toolCall.tool_call_id, {
          status: "completed",
          result: JSON.stringify(result),
          completedAt: /* @__PURE__ */ new Date()
        });
      } catch (error) {
        updateToolCallStatus(toolCall.tool_call_id, {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
          completedAt: /* @__PURE__ */ new Date()
        });
      }
    }
  };
  const initToolCall = useCallback3((toolCall) => {
    const tool = agent?.getTools().find((t) => t.name === toolCall.tool_name);
    setToolCallStates((prev) => {
      const newStates = new Map(prev);
      const state = {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        status: "pending",
        startedAt: /* @__PURE__ */ new Date()
      };
      newStates.set(toolCall.tool_call_id, state);
      return newStates;
    });
    if (tool) {
      executeTool(tool, toolCall);
    } else {
      console.log(agent?.getTools());
    }
  }, []);
  const updateToolCallStatus = useCallback3((toolCallId, updates) => {
    setToolCallStates((prev) => {
      const newStates = new Map(prev);
      const currentState = newStates.get(toolCallId);
      if (currentState) {
        newStates.set(toolCallId, {
          ...currentState,
          ...updates
        });
      }
      if (tools) {
        const pendingToolCalls = getPendingToolCalls();
        if (pendingToolCalls.length === 0 && onAllToolsCompleted) {
          const externalCalls = Array.from(newStates.values()).filter((state) => state.status === "completed" || state.status === "error" && tools.find((tool) => tool.name === state.tool_name)).map((state) => ({
            tool_call_id: state.tool_call_id,
            result: state.result,
            success: state.status === "completed",
            error: state.error
          }));
          if (externalCalls.length > 0) {
            onAllToolsCompleted(externalCalls);
          }
        }
      }
      return newStates;
    });
  }, [tools]);
  const getToolCallState = useCallback3((toolCallId) => {
    return toolCallStates.get(toolCallId);
  }, [toolCallStates]);
  const hasPendingToolCalls = useCallback3(() => {
    return getPendingToolCalls().length > 0;
  }, [toolCallStates]);
  const getPendingToolCalls = useCallback3(() => {
    const pendingIds = Array.from(toolCallStates.entries()).filter(([_, state]) => state.status === "pending" || state.status === "running" && tools?.find((tool) => tool.name === state.tool_name)).map(([id, _]) => id);
    return Array.from(toolCallStates.values()).filter((state) => pendingIds.includes(state.tool_call_id));
  }, [toolCallStates, tools]);
  const clearAll = useCallback3(() => {
    setToolCallStates(/* @__PURE__ */ new Map());
  }, []);
  const clearToolResults = useCallback3(() => {
    toolCallStates.forEach((state) => {
      state.result = void 0;
      state.error = void 0;
    });
  }, []);
  return {
    toolCallStates,
    initToolCall,
    updateToolCallStatus,
    getToolCallState,
    hasPendingToolCalls,
    getPendingToolCalls,
    clearAll,
    clearToolResults
  };
}

// src/stores/chatStateStore.ts
import { create } from "zustand";
import { isDistriEvent, isDistriArtifact as isDistriArtifact2 } from "@distri/core";
var useChatStateStore = create((set, get) => ({
  tasks: /* @__PURE__ */ new Map(),
  plans: /* @__PURE__ */ new Map(),
  toolCalls: /* @__PURE__ */ new Map(),
  currentTaskId: void 0,
  currentPlanId: void 0,
  processMessage: (message) => {
    const timestamp = Date.now();
    if (isDistriEvent(message)) {
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
    if (isDistriArtifact2(message)) {
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
                  status: message.success ? "completed" : "failed",
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
  initToolCall: (toolCall, timestamp) => {
    set((state) => {
      const newState = { ...state };
      newState.toolCalls.set(toolCall.tool_call_id, {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name || "Unknown Tool",
        input: toolCall.input || {},
        status: "pending",
        startTime: timestamp || Date.now()
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
          endTime: status2.status === "completed" || status2.status === "failed" ? Date.now() : existingToolCall.endTime
        });
      }
      return newState;
    });
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
      (toolCall) => toolCall.status === "completed" || toolCall.status === "failed"
    );
  },
  clearAllStates: () => {
    set({
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
  const [messages, setMessages] = useState7([]);
  const [isLoading, setIsLoading] = useState7(false);
  const [isStreaming, setIsStreaming] = useState7(false);
  const [error, setError] = useState7(null);
  const abortControllerRef = useRef3(null);
  const createInvokeContext = useCallback4(() => ({
    thread_id: threadId,
    run_id: void 0,
    getMetadata
  }), [threadId, getMetadata]);
  registerTools({ agent, tools });
  const toolStateHandler = useToolCallState({
    agent,
    tools,
    onAllToolsCompleted: (toolResults) => {
      sendToolResultsToAgent(toolResults);
    }
  });
  const chatState = useChatStateStore.getState();
  useEffect6(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  const agentIdRef = useRef3(void 0);
  useEffect6(() => {
    if (agent?.id !== agentIdRef.current) {
      setMessages([]);
      toolStateHandler.clearAll();
      chatState.clearAllStates();
      setError(null);
      agentIdRef.current = agent?.id;
    }
  }, [agent?.id, toolStateHandler, chatState]);
  const clearMessages = useCallback4(() => {
    setMessages([]);
    toolStateHandler.clearAll();
    chatState.clearAllStates();
  }, [toolStateHandler, chatState]);
  const fetchMessages = useCallback4(async () => {
    if (!agent) return;
    try {
      const a2aMessages = await agent.getThreadMessages(threadId);
      const distriMessages = a2aMessages.map(decodeA2AStreamEvent).filter(Boolean);
      setMessages(distriMessages);
      distriMessages.forEach((message) => {
        chatState.processMessage(message);
      });
      onMessagesUpdate?.();
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Failed to fetch messages");
      setError(error2);
      onError?.(error2);
    }
  }, [threadId, agent?.id, onError, onMessagesUpdate, chatState]);
  useEffect6(() => {
    if (threadId) {
      fetchMessages();
    }
  }, [threadId, agent?.id]);
  const handleStreamEvent = useCallback4((event) => {
    chatState.processMessage(event);
    setMessages((prev) => {
      if (isDistriMessage(event)) {
        const distriMessage = event;
        const existingMessageIndex = prev.findIndex((msg) => isDistriMessage(msg) && msg.id && msg.id === distriMessage.id);
        if (existingMessageIndex >= 0) {
          const updatedMessages = [...prev];
          const existingMessage = updatedMessages[existingMessageIndex];
          const mergedParts = [...existingMessage.parts, ...distriMessage.parts];
          updatedMessages[existingMessageIndex] = {
            ...existingMessage,
            parts: mergedParts
          };
          return updatedMessages;
        } else {
          return [...prev, distriMessage];
        }
      } else if (isDistriArtifact(event)) {
        const artifact = event;
        const existingArtifactIndex = prev.findIndex((msg) => isDistriArtifact(msg) && msg.id && msg.id === artifact.id);
        if (existingArtifactIndex >= 0) {
          const updatedMessages = [...prev];
          updatedMessages[existingArtifactIndex] = artifact;
          return updatedMessages;
        } else {
          return [...prev, artifact];
        }
      } else {
        return [...prev, event];
      }
    });
    if (isDistriArtifact(event)) {
      const artifact = event;
      if (artifact.type === "llm_response") {
        const llmArtifact = artifact;
        if (llmArtifact.tool_calls && Array.isArray(llmArtifact.tool_calls)) {
          llmArtifact.tool_calls.forEach((toolCall) => {
            toolStateHandler.initToolCall(toolCall);
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
            toolStateHandler.updateToolCallStatus(
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
          toolStateHandler.initToolCall(toolCall);
        });
      }
      const toolResultParts = distriMessage.parts.filter((part) => part.type === "tool_result");
      if (toolResultParts.length > 0) {
        const newToolResults = toolResultParts.map((part) => part.tool_result);
        newToolResults.forEach((toolResult) => {
          toolStateHandler.updateToolCallStatus(
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
  }, [onMessage, agent, toolStateHandler, chatState]);
  const sendMessage = useCallback4(async (content) => {
    if (!agent) return;
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      const parts = typeof content === "string" ? [{ type: "text", text: content }] : content;
      const distriMessage = DistriClient2.initDistriMessage("user", parts);
      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);
      setMessages((prev) => [...prev, distriMessage]);
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
      const error2 = err instanceof Error ? err : new Error("Failed to send message");
      setError(error2);
      onError?.(error2);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, onError]);
  const sendMessageStream = useCallback4(async (content, role = "user") => {
    if (!agent) return;
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      const parts = typeof content === "string" ? [{ type: "text", text: content }] : content;
      const distriMessage = DistriClient2.initDistriMessage(role, parts);
      const context = createInvokeContext();
      const a2aMessage = convertDistriMessageToA2A(distriMessage, context);
      setMessages((prev) => [...prev, distriMessage]);
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
      const error2 = err instanceof Error ? err : new Error("Failed to send message");
      setError(error2);
      onError?.(error2);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, onError, threadId]);
  const sendToolResultsToAgent = useCallback4(async (toolResults) => {
    if (agent && toolResults.length > 0) {
      console.log("Sending tool results via streaming:", toolResults);
      try {
        const toolResultParts = toolResults.map((result) => ({
          type: "tool_result",
          tool_result: result
        }));
        await sendMessageStream(toolResultParts, "tool");
        toolStateHandler.clearToolResults();
      } catch (err) {
        console.error("Failed to send tool results:", err);
        setError(err instanceof Error ? err : new Error("Failed to send tool results"));
      }
    }
  }, [sendMessageStream, toolStateHandler]);
  const stopStreaming = useCallback4(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  return {
    messages,
    isStreaming,
    sendMessage,
    sendMessageStream,
    isLoading,
    error,
    clearMessages,
    agent: agent || void 0,
    toolCallStates: toolStateHandler.toolCallStates,
    hasPendingToolCalls: toolStateHandler.hasPendingToolCalls,
    stopStreaming,
    // Chat state management
    chatState,
    // Expose tool state for debugging
    toolStateHandler
  };
}

// src/useThreads.ts
import { useState as useState8, useEffect as useEffect7, useCallback as useCallback5 } from "react";
function useThreads() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = useState8([]);
  const [loading, setLoading] = useState8(true);
  const [error, setError] = useState8(null);
  const fetchThreads = useCallback5(async () => {
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
  const fetchThread = useCallback5(async (threadId) => {
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
  const deleteThread = useCallback5(async (threadId) => {
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
  const updateThread = useCallback5(async (threadId, localId) => {
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
  useEffect7(() => {
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
  useEffect7(() => {
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
import { useState as useState13, useCallback as useCallback7, useRef as useRef5, useEffect as useEffect10 } from "react";
import { isDistriMessage as isDistriMessage4, isDistriArtifact as isDistriArtifact3 } from "@distri/core";

// src/components/ChatInput.tsx
import { useRef as useRef4, useEffect as useEffect8 } from "react";
import { Send, Square } from "lucide-react";
import { jsx as jsx7, jsxs as jsxs2 } from "react/jsx-runtime";
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
  const textareaRef = useRef4(null);
  useEffect8(() => {
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
  return /* @__PURE__ */ jsx7("div", { className: `relative flex min-h-14 w-full items-end ${className}`, children: /* @__PURE__ */ jsx7("div", { className: "relative flex w-full flex-auto flex-col", children: /* @__PURE__ */ jsxs2("div", { className: "relative mx-5 flex min-h-14 flex-auto rounded-lg border border-input bg-input items-start h-full", children: [
    /* @__PURE__ */ jsx7(
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
    /* @__PURE__ */ jsx7("div", { className: "absolute right-2 bottom-0 flex items-center h-full", children: /* @__PURE__ */ jsx7(
      "button",
      {
        onClick: isStreaming ? handleStop : handleSend,
        disabled: !hasContent && !isStreaming,
        className: `h-10 w-10 rounded-md transition-colors flex items-center justify-center ${isStreaming ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : hasContent && !disabled ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted"}`,
        children: isStreaming ? /* @__PURE__ */ jsx7(Square, { className: "h-5 w-5" }) : /* @__PURE__ */ jsx7(Send, { className: "h-5 w-5" })
      }
    ) })
  ] }) }) });
};

// src/components/renderers/TaskRenderer.tsx
import { useState as useState9 } from "react";

// src/components/ui/badge.tsx
import { cva } from "class-variance-authority";
import { jsx as jsx8 } from "react/jsx-runtime";
var badgeVariants = cva(
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
  return /* @__PURE__ */ jsx8("div", { className: cn(badgeVariants({ variant }), className), ...props });
}

// src/components/ui/card.tsx
import * as React7 from "react";
import { jsx as jsx9 } from "react/jsx-runtime";
var Card = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx9(
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
var CardHeader = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx9(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx9(
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
var CardDescription = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx9(
  "p",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx9("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx9(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";

// src/components/renderers/TaskRenderer.tsx
import { ChevronDown, ChevronRight, Loader2, CheckCircle as CheckCircle3, XCircle as XCircle3, Clock as Clock2 } from "lucide-react";

// src/components/toolcalls/ToolCallRenderer.tsx
import { Clock, CheckCircle as CheckCircle2, XCircle as XCircle2, Play } from "lucide-react";
import { jsx as jsx10, jsxs as jsxs3 } from "react/jsx-runtime";
function ToolCallRenderer({ toolCall, toolCallState }) {
  const getStatusIcon = () => {
    if (!toolCallState) {
      return /* @__PURE__ */ jsx10(Clock, { className: "w-4 h-4 text-yellow-500" });
    }
    switch (toolCallState.status) {
      case "completed":
        return /* @__PURE__ */ jsx10(CheckCircle2, { className: "w-4 h-4 text-green-500" });
      case "error":
        return /* @__PURE__ */ jsx10(XCircle2, { className: "w-4 h-4 text-red-500" });
      case "running":
        return /* @__PURE__ */ jsx10(Play, { className: "w-4 h-4 text-blue-500" });
      default:
        return /* @__PURE__ */ jsx10(Clock, { className: "w-4 h-4 text-yellow-500" });
    }
  };
  const getStatusText = () => {
    if (!toolCallState) {
      return "Pending";
    }
    switch (toolCallState.status) {
      case "completed":
        return "Completed";
      case "error":
        return "Failed";
      case "running":
        return "Running";
      default:
        return "Pending";
    }
  };
  const getStatusColor = () => {
    if (!toolCallState) {
      return "bg-yellow-100 text-yellow-800";
    }
    switch (toolCallState.status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };
  return /* @__PURE__ */ jsxs3(Card, { className: "mb-2", children: [
    /* @__PURE__ */ jsx10(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs3("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs3("div", { className: "flex items-center space-x-2", children: [
        getStatusIcon(),
        /* @__PURE__ */ jsx10(CardTitle, { className: "text-sm font-medium", children: toolCall.tool_name }),
        /* @__PURE__ */ jsx10(Badge, { variant: "secondary", className: getStatusColor(), children: getStatusText() })
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: "text-xs text-gray-500", children: [
        "ID: ",
        toolCall.tool_call_id
      ] })
    ] }) }),
    /* @__PURE__ */ jsx10(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsxs3("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs3("div", { className: "text-sm", children: [
        /* @__PURE__ */ jsx10("strong", { children: "Input:" }),
        /* @__PURE__ */ jsx10("pre", { className: "whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1", children: typeof toolCall.input === "string" ? toolCall.input : JSON.stringify(toolCall.input, null, 2) })
      ] }),
      toolCallState?.result && /* @__PURE__ */ jsxs3("div", { className: "text-sm", children: [
        /* @__PURE__ */ jsx10("strong", { children: "Result:" }),
        /* @__PURE__ */ jsx10("pre", { className: "whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1", children: typeof toolCallState.result === "string" ? toolCallState.result : JSON.stringify(toolCallState.result, null, 2) })
      ] }),
      toolCallState?.error && /* @__PURE__ */ jsxs3("div", { className: "text-sm", children: [
        /* @__PURE__ */ jsx10("strong", { children: "Error:" }),
        /* @__PURE__ */ jsx10("pre", { className: "whitespace-pre-wrap text-xs bg-red-50 p-2 rounded mt-1 text-red-600", children: toolCallState.error })
      ] })
    ] }) })
  ] });
}

// src/components/renderers/TaskRenderer.tsx
import { jsx as jsx11, jsxs as jsxs4 } from "react/jsx-runtime";
function TaskRenderer({ task, toolCallStates, className = "", onToolResult }) {
  const [isExpanded, setIsExpanded] = useState9(false);
  const getStatusIcon = () => {
    switch (task.status) {
      case "running":
        return /* @__PURE__ */ jsx11(Loader2, { className: "w-4 h-4 animate-spin text-blue-500" });
      case "completed":
        return /* @__PURE__ */ jsx11(CheckCircle3, { className: "w-4 h-4 text-green-500" });
      case "failed":
        return /* @__PURE__ */ jsx11(XCircle3, { className: "w-4 h-4 text-red-500" });
      default:
        return /* @__PURE__ */ jsx11(Clock2, { className: "w-4 h-4 text-gray-500" });
    }
  };
  const getStatusColor = () => {
    switch (task.status) {
      case "running":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const hasDetails = task.toolCalls && task.toolCalls.length > 0 || task.results && task.results.length > 0 || task.error;
  return /* @__PURE__ */ jsxs4(Card, { className: `mb-4 ${className}`, children: [
    /* @__PURE__ */ jsx11(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs4("div", { className: "flex items-center space-x-2", children: [
        getStatusIcon(),
        /* @__PURE__ */ jsx11(CardTitle, { className: "text-sm font-medium", children: task.title }),
        /* @__PURE__ */ jsx11(Badge, { variant: "secondary", className: getStatusColor(), children: task.status }),
        hasDetails && /* @__PURE__ */ jsx11(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => setIsExpanded(!isExpanded),
            className: "p-1 h-6 w-6",
            children: isExpanded ? /* @__PURE__ */ jsx11(ChevronDown, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx11(ChevronRight, { className: "w-4 h-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx11("div", { className: "text-xs text-gray-500", children: task.startTime && new Date(task.startTime).toLocaleTimeString() })
    ] }) }),
    isExpanded && hasDetails && /* @__PURE__ */ jsxs4(CardContent, { className: "pt-0 space-y-4", children: [
      task.toolCalls && task.toolCalls.length > 0 && /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx11("h4", { className: "text-sm font-medium mb-2", children: "Tool Calls" }),
        /* @__PURE__ */ jsx11("div", { className: "space-y-2", children: task.toolCalls.map((toolCall, index) => /* @__PURE__ */ jsx11(
          ToolCallRenderer,
          {
            toolCall,
            toolCallState: toolCallStates.get(toolCall.tool_call_id)
          },
          toolCall.tool_call_id || index
        )) })
      ] }),
      task.results && task.results.length > 0 && /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx11("h4", { className: "text-sm font-medium mb-2", children: "Results" }),
        /* @__PURE__ */ jsx11("div", { className: "space-y-2", children: task.results.map((result, index) => /* @__PURE__ */ jsxs4("div", { className: "border rounded-lg p-3", children: [
          /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsx11("span", { className: "text-sm font-medium", children: result.tool_name }),
            /* @__PURE__ */ jsx11(Badge, { variant: "default", className: "text-xs", children: "Success" })
          ] }),
          /* @__PURE__ */ jsxs4("div", { className: "text-sm text-gray-600", children: [
            /* @__PURE__ */ jsx11("strong", { children: "Result:" }),
            /* @__PURE__ */ jsx11("pre", { className: "whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto", children: typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2) })
          ] })
        ] }, result.tool_call_id || index)) })
      ] }),
      task.error && /* @__PURE__ */ jsx11("div", { className: "p-2 bg-red-50 border border-red-200 rounded", children: /* @__PURE__ */ jsx11("span", { className: "text-xs text-red-600", children: task.error }) })
    ] })
  ] });
}

// src/components/renderers/ToolResultRenderer.tsx
import { CheckCircle as CheckCircle4, XCircle as XCircle4, Send as Send2 } from "lucide-react";
import { jsx as jsx12, jsxs as jsxs5 } from "react/jsx-runtime";

// src/components/Components.tsx
import React22, { useState as useState12 } from "react";
import { User, Bot as Bot3, Settings, Clock as Clock5, CheckCircle as CheckCircle7, XCircle as XCircle5, Brain, Wrench, ChevronDown as ChevronDown3, ChevronRight as ChevronRight2, Loader2 as Loader23 } from "lucide-react";

// src/components/ThemeToggle.tsx
import React9 from "react";
import { Moon, Sun } from "lucide-react";
import { jsx as jsx13, jsxs as jsxs6 } from "react/jsx-runtime";
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dropdownRef = React9.useRef(null);
  return /* @__PURE__ */ jsx13("div", { className: "relative", ref: dropdownRef, children: /* @__PURE__ */ jsxs6(
    "button",
    {
      onClick: () => setTheme(theme === "light" ? "dark" : "light"),
      className: "flex items-center justify-center w-9 h-9 rounded-md border bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
      children: [
        /* @__PURE__ */ jsx13(Sun, { className: "h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" }),
        /* @__PURE__ */ jsx13(Moon, { className: "absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" }),
        /* @__PURE__ */ jsx13("span", { className: "sr-only", children: "Toggle theme" })
      ]
    }
  ) });
}

// src/components/AgentList.tsx
import React10 from "react";
import { RefreshCw, Play as Play2, Bot } from "lucide-react";
import { jsx as jsx14, jsxs as jsxs7 } from "react/jsx-runtime";

// src/components/AgentSelect.tsx
import { Bot as Bot2 } from "lucide-react";

// src/components/ui/select.tsx
import * as React11 from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown as ChevronDown2, ChevronUp } from "lucide-react";
import { jsx as jsx15, jsxs as jsxs8 } from "react/jsx-runtime";
var Select = SelectPrimitive.Root;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React11.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs8(
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
      /* @__PURE__ */ jsx15(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx15(ChevronDown2, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx15(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx15(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx15(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx15(ChevronDown2, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React11.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx15(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs8(
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
      /* @__PURE__ */ jsx15(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx15(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx15(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx15(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React11.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs8(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx15("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx15(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx15(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx15(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx15(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// src/components/AgentSelect.tsx
import { jsx as jsx16, jsxs as jsxs9 } from "react/jsx-runtime";
var AgentSelect = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  className = "",
  placeholder = "Select an agent...",
  disabled = false
}) => {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  return /* @__PURE__ */ jsxs9(Select, { value: selectedAgentId, onValueChange: onAgentSelect, disabled, children: [
    /* @__PURE__ */ jsx16(SelectTrigger, { className: `w-full ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, children: /* @__PURE__ */ jsxs9("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx16(Bot2, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx16(SelectValue, { placeholder, children: selectedAgent?.name || placeholder })
    ] }) }),
    /* @__PURE__ */ jsx16(SelectContent, { children: agents.map((agent) => /* @__PURE__ */ jsx16(SelectItem, { value: agent.id, children: /* @__PURE__ */ jsxs9("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx16(Bot2, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs9("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx16("span", { className: "font-medium", children: agent.name }),
        agent.description && /* @__PURE__ */ jsx16("span", { className: "text-xs text-muted-foreground", children: agent.description })
      ] })
    ] }) }, agent.id)) })
  ] });
};

// src/components/AgentsPage.tsx
import { jsx as jsx17, jsxs as jsxs10 } from "react/jsx-runtime";

// src/components/ExecutionSteps.tsx
import React12 from "react";
import { CheckCircle as CheckCircle5, Clock as Clock3, AlertCircle, Play as Play3 } from "lucide-react";
import { jsx as jsx18, jsxs as jsxs11 } from "react/jsx-runtime";
var ExecutionSteps = ({ messages, className = "" }) => {
  const steps = React12.useMemo(() => {
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
        return /* @__PURE__ */ jsx18(CheckCircle5, { className: "w-4 h-4 text-green-600" });
      case "error":
        return /* @__PURE__ */ jsx18(AlertCircle, { className: "w-4 h-4 text-red-600" });
      case "running":
        return /* @__PURE__ */ jsx18(Clock3, { className: "w-4 h-4 text-blue-600 animate-pulse" });
      default:
        return /* @__PURE__ */ jsx18(Play3, { className: "w-4 h-4 text-gray-400" });
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
  return /* @__PURE__ */ jsx18("div", { className: `space-y-3 ${className}`, children: steps.map((step) => /* @__PURE__ */ jsxs11(Card, { className: "border-l-4 border-l-blue-200", children: [
    /* @__PURE__ */ jsx18(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs11("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs11("div", { className: "flex items-center gap-2", children: [
        getStepIcon(step),
        /* @__PURE__ */ jsx18(CardTitle, { className: "text-sm font-medium", children: step.type === "tool_call" && step.tool_call ? `${step.tool_call.tool_name}` : step.type === "response" ? "Final Response" : "Tool Result" })
      ] }),
      /* @__PURE__ */ jsx18(Badge, { className: getStepBadgeColor(step), children: step.status })
    ] }) }),
    /* @__PURE__ */ jsxs11(CardContent, { className: "pt-0", children: [
      step.type === "tool_call" && step.tool_call && /* @__PURE__ */ jsxs11("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx18("div", { className: "text-xs text-gray-600", children: "Input:" }),
        /* @__PURE__ */ jsx18("pre", { className: "text-xs bg-gray-50 p-2 rounded overflow-x-auto", children: formatToolInput(step.tool_call.input) })
      ] }),
      step.tool_result && /* @__PURE__ */ jsxs11("div", { className: "space-y-2 mt-2", children: [
        /* @__PURE__ */ jsx18("div", { className: "text-xs text-gray-600", children: "Result:" }),
        /* @__PURE__ */ jsx18("div", { className: "text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto", children: formatToolResult(step.tool_result.result) })
      ] }),
      step.type === "response" && step.content && /* @__PURE__ */ jsx18("div", { className: "text-sm", children: step.content })
    ] })
  ] }, step.id)) });
};

// src/components/TaskExecutionRenderer.tsx
import { useMemo } from "react";
import { isDistriMessage as isDistriMessage2 } from "@distri/core";
import { CheckCircle as CheckCircle6, Clock as Clock4, AlertCircle as AlertCircle2, Loader2 as Loader22 } from "lucide-react";
import { jsx as jsx19, jsxs as jsxs12 } from "react/jsx-runtime";

// src/components/ChatContext.tsx
import { createContext as createContext3, useContext as useContext3, useState as useState10 } from "react";
import { jsx as jsx20 } from "react/jsx-runtime";
var ChatContext = createContext3(void 0);

// src/components/ui/input.tsx
import * as React15 from "react";
import { jsx as jsx21 } from "react/jsx-runtime";
var Input = React15.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx21(
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
import * as React16 from "react";
import { jsx as jsx22, jsxs as jsxs13 } from "react/jsx-runtime";
var Dialog = React16.createContext({});
var DialogTrigger = React16.forwardRef(({ className, children, ...props }, ref) => {
  const context = React16.useContext(Dialog);
  return /* @__PURE__ */ jsx22(
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
  return /* @__PURE__ */ jsx22("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm", children: /* @__PURE__ */ jsxs13(
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
        /* @__PURE__ */ jsx22(
          "button",
          {
            className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            onClick: () => context.onOpenChange?.(false),
            children: /* @__PURE__ */ jsxs13(
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
                  /* @__PURE__ */ jsx22("path", { d: "m18 6-12 12" }),
                  /* @__PURE__ */ jsx22("path", { d: "m6 6 12 12" })
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
var DialogHeader = React16.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx22(
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
var DialogTitle = React16.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx22(
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
import * as React17 from "react";
import { jsx as jsx23 } from "react/jsx-runtime";
var Textarea = React17.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx23(
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
import * as React21 from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva as cva3 } from "class-variance-authority";
import { PanelLeft } from "lucide-react";

// src/components/ui/separator.tsx
import * as React18 from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { jsx as jsx24 } from "react/jsx-runtime";
var Separator2 = React18.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsx24(
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
import * as React19 from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva as cva2 } from "class-variance-authority";
import { X } from "lucide-react";
import { jsx as jsx25, jsxs as jsxs14 } from "react/jsx-runtime";
var Sheet = SheetPrimitive.Root;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx25(
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
var sheetVariants = cva2(
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
var SheetContent = React19.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs14(SheetPortal, { children: [
  /* @__PURE__ */ jsx25(SheetOverlay, {}),
  /* @__PURE__ */ jsxs14(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs14(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ jsx25(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx25("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx25(
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
}) => /* @__PURE__ */ jsx25(
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
var SheetTitle = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx25(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx25(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// src/components/ui/skeleton.tsx
import { jsx as jsx26 } from "react/jsx-runtime";
function Skeleton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx26(
    "div",
    {
      className: cn("animate-pulse rounded-md bg-muted", className),
      ...props
    }
  );
}

// src/components/ui/tooltip.tsx
import * as React20 from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { jsx as jsx27 } from "react/jsx-runtime";
var TooltipProvider = TooltipPrimitive.Provider;
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = React20.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx27(
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
import { jsx as jsx28, jsxs as jsxs15 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx28(SidebarContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx28(TooltipProvider, { delayDuration: 0, children: /* @__PURE__ */ jsx28(
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
    return /* @__PURE__ */ jsx28(
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
    return /* @__PURE__ */ jsx28(Sheet, { open: openMobile, onOpenChange: setOpenMobile, ...props, children: /* @__PURE__ */ jsx28(
      SheetContent,
      {
        "data-sidebar": "sidebar",
        "data-mobile": "true",
        className: "w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
        style: {
          "--sidebar-width": SIDEBAR_WIDTH_MOBILE
        },
        side,
        children: /* @__PURE__ */ jsx28("div", { className: "flex h-full w-full flex-col", children })
      }
    ) });
  }
  return /* @__PURE__ */ jsxs15(
    "div",
    {
      ref,
      className: "group peer hidden md:block text-sidebar-foreground",
      "data-state": state,
      "data-collapsible": state === "collapsed" ? collapsible : "",
      "data-variant": variant,
      "data-side": side,
      children: [
        /* @__PURE__ */ jsx28(
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
        /* @__PURE__ */ jsx28(
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
            children: /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsxs15(
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
        /* @__PURE__ */ jsx28(PanelLeft, {}),
        /* @__PURE__ */ jsx28("span", { className: "sr-only", children: "Toggle Sidebar" })
      ]
    }
  );
});
SidebarTrigger.displayName = "SidebarTrigger";
var SidebarRail = React21.forwardRef(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsx28(
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
  const Comp = asChild ? Slot : "div";
  return /* @__PURE__ */ jsx28(
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
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsx28(
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
var sidebarMenuButtonVariants = cva3(
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
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();
  const button = /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsxs15(Tooltip, { children: [
    /* @__PURE__ */ jsx28(TooltipTrigger, { asChild: true, children: button }),
    /* @__PURE__ */ jsx28(
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
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsxs15(
    "div",
    {
      ref,
      "data-sidebar": "menu-skeleton",
      className: cn("rounded-md h-8 flex gap-2 px-2 items-center", className),
      ...props,
      children: [
        showIcon && /* @__PURE__ */ jsx28(Skeleton, { className: "size-4 rounded-md", "data-sidebar": "menu-skeleton-icon" }),
        /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsx28(
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
  return /* @__PURE__ */ jsx28("li", { ref, ...props });
});
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
var SidebarMenuSubButton = React21.forwardRef(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return /* @__PURE__ */ jsx28(
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
import { Fragment as Fragment2, jsx as jsx29, jsxs as jsxs16 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx29("div", { className: `flex ${justifyClass} w-full ${bgClass} ${className}`, children: /* @__PURE__ */ jsx29("div", { className: "w-full max-w-4xl mx-auto", children }) });
};
var UserMessage = ({
  content,
  message,
  timestamp,
  className = "",
  avatar
}) => {
  return /* @__PURE__ */ jsx29(MessageContainer, { align: "center", className, backgroundColor: "#343541", children: /* @__PURE__ */ jsxs16("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx29("div", { className: "distri-avatar distri-avatar-user", children: avatar || /* @__PURE__ */ jsx29(User, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs16("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx29("div", { className: "text-sm font-medium text-foreground mb-2", children: "You" }),
      /* @__PURE__ */ jsx29("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx29(
        MessageRenderer_default,
        {
          content,
          message,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx29("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
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
  return /* @__PURE__ */ jsx29(MessageContainer, { align: "center", className, backgroundColor: "#444654", children: /* @__PURE__ */ jsxs16("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx29("div", { className: "distri-avatar distri-avatar-assistant", children: avatar || /* @__PURE__ */ jsx29(Bot3, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs16("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs16("div", { className: "text-sm font-medium text-foreground mb-2 flex items-center gap-2", children: [
        name,
        isStreaming && /* @__PURE__ */ jsxs16("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx29("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse" }),
          /* @__PURE__ */ jsx29("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ jsx29("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      /* @__PURE__ */ jsx29("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx29(
        MessageRenderer_default,
        {
          content,
          message,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx29("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
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
  const [expandedTools, setExpandedTools] = useState12(/* @__PURE__ */ new Set());
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
  React22.useEffect(() => {
    const newExpanded = new Set(expandedTools);
    toolCallStates.forEach((toolCallState) => {
      if (toolCallState.status === "running" || toolCallState.status === "error" || toolCallState.status === "user_action_required") {
        newExpanded.add(toolCallState.tool_call_id);
      }
    });
    setExpandedTools(newExpanded);
  }, [toolCallStates]);
  return /* @__PURE__ */ jsx29(MessageContainer, { align: "center", className, backgroundColor: "#444654", children: /* @__PURE__ */ jsxs16("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx29("div", { className: "distri-avatar distri-avatar-assistant", children: avatar || /* @__PURE__ */ jsx29(Bot3, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs16("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs16("div", { className: "text-sm font-medium text-foreground mb-2 flex items-center gap-2", children: [
        name,
        isStreaming && /* @__PURE__ */ jsxs16("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx29("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse" }),
          /* @__PURE__ */ jsx29("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ jsx29("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      /* @__PURE__ */ jsx29("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx29(
        MessageRenderer_default,
        {
          content,
          message,
          className: "text-foreground"
        }
      ) }),
      toolCallStates.length > 0 && /* @__PURE__ */ jsxs16("div", { className: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsx29("div", { className: "text-sm font-medium text-foreground", children: "Tool Calls" }),
        toolCallStates.map((toolCallState, index) => {
          const isExpanded = expandedTools.has(toolCallState.tool_call_id);
          const hasResult = toolCallState?.result !== void 0;
          const hasError = toolCallState?.error !== void 0;
          const canCollapse = hasResult || hasError || toolCallState?.status === "completed" || toolCallState?.status === "error";
          return /* @__PURE__ */ jsxs16("div", { className: "border rounded-lg bg-background overflow-hidden", children: [
            /* @__PURE__ */ jsxs16("div", { className: "p-3 border-b border-border", children: [
              /* @__PURE__ */ jsxs16("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs16("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx29(
                    "button",
                    {
                      onClick: () => toggleToolExpansion(toolCallState.tool_call_id),
                      className: "p-1 hover:bg-muted rounded transition-colors",
                      disabled: !canCollapse,
                      children: canCollapse ? isExpanded ? /* @__PURE__ */ jsx29(ChevronDown3, { className: "h-3 w-3 text-muted-foreground" }) : /* @__PURE__ */ jsx29(ChevronRight2, { className: "h-3 w-3 text-muted-foreground" }) : /* @__PURE__ */ jsx29("div", { className: "h-3 w-3" })
                    }
                  ),
                  /* @__PURE__ */ jsx29(Wrench, { className: "h-4 w-4 text-green-500" }),
                  /* @__PURE__ */ jsx29("span", { className: "text-sm font-medium text-foreground", children: toolCallState?.tool_name })
                ] }),
                /* @__PURE__ */ jsxs16("div", { className: "flex items-center gap-2", children: [
                  toolCallState?.status === "pending" && /* @__PURE__ */ jsxs16("div", { className: "flex items-center gap-1 text-xs text-yellow-600", children: [
                    /* @__PURE__ */ jsx29(Clock5, { className: "h-3 w-3" }),
                    "Pending"
                  ] }),
                  toolCallState?.status === "running" && /* @__PURE__ */ jsxs16("div", { className: "flex items-center gap-1 text-xs text-blue-600", children: [
                    /* @__PURE__ */ jsx29(Loader23, { className: "h-3 w-3 animate-spin" }),
                    "Running"
                  ] }),
                  toolCallState?.status === "completed" && /* @__PURE__ */ jsxs16("div", { className: "flex items-center gap-1 text-xs text-green-600", children: [
                    /* @__PURE__ */ jsx29(CheckCircle7, { className: "h-3 w-3" }),
                    "Completed"
                  ] }),
                  toolCallState?.status === "error" && /* @__PURE__ */ jsxs16("div", { className: "flex items-center gap-1 text-xs text-red-600", children: [
                    /* @__PURE__ */ jsx29(XCircle5, { className: "h-3 w-3" }),
                    "Failed"
                  ] }),
                  toolCallState?.status === "user_action_required" && /* @__PURE__ */ jsxs16("div", { className: "flex items-center gap-1 text-xs text-orange-600", children: [
                    /* @__PURE__ */ jsx29(Wrench, { className: "h-3 w-3" }),
                    "User Action Required"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs16("div", { className: "mt-2", children: [
                /* @__PURE__ */ jsx29("div", { className: "text-xs text-muted-foreground mb-1", children: "Input:" }),
                /* @__PURE__ */ jsx29("div", { className: "text-xs font-mono bg-muted p-2 rounded border", children: JSON.stringify(toolCallState?.input, null, 2) })
              ] }),
              /* @__PURE__ */ jsx29("div", { className: "mt-3", children: !!toolCallState?.component && toolCallState.component })
            ] }),
            canCollapse && isExpanded && /* @__PURE__ */ jsx29("div", { className: "p-3 bg-muted/30", children: ToolResultRenderer2 ? /* @__PURE__ */ jsx29(
              ToolResultRenderer2,
              {
                toolCallId: toolCallState.tool_call_id,
                toolName: toolCallState.tool_name,
                result: toolCallState.result,
                success: toolCallState.status === "completed",
                error: toolCallState.error,
                onSendResponse: onToolResult
              }
            ) : /* @__PURE__ */ jsxs16(Fragment2, { children: [
              hasError && /* @__PURE__ */ jsxs16("div", { className: "mb-3", children: [
                /* @__PURE__ */ jsx29("div", { className: "text-xs text-red-600 font-medium mb-1", children: "Error:" }),
                /* @__PURE__ */ jsx29("div", { className: "text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200", children: toolCallState?.error })
              ] }),
              hasResult && /* @__PURE__ */ jsxs16("div", { children: [
                /* @__PURE__ */ jsx29("div", { className: "text-xs text-muted-foreground font-medium mb-1", children: "Result:" }),
                /* @__PURE__ */ jsx29("div", { className: "text-xs font-mono bg-background p-2 rounded border", children: JSON.stringify(toolCallState?.result, null, 2) })
              ] })
            ] }) })
          ] }, index);
        })
      ] }),
      timestamp && /* @__PURE__ */ jsx29("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
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
  return /* @__PURE__ */ jsx29(MessageContainer, { align: "center", className, backgroundColor: "#40414f", children: /* @__PURE__ */ jsxs16("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx29("div", { className: "distri-avatar distri-avatar-plan", children: avatar || /* @__PURE__ */ jsx29(Brain, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs16("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx29("div", { className: "text-sm font-medium text-foreground mb-2", children: "Plan" }),
      /* @__PURE__ */ jsx29("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx29(
        MessageRenderer_default,
        {
          content: plan,
          message,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx29("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var DebugMessage = ({
  message,
  className = "",
  timestamp
}) => {
  return /* @__PURE__ */ jsx29(MessageContainer, { align: "center", className, backgroundColor: "#343541", children: /* @__PURE__ */ jsxs16("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx29("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx29(
      MessageRenderer_default,
      {
        content: JSON.stringify(message),
        className: "text-foreground"
      }
    ) }),
    timestamp && /* @__PURE__ */ jsx29("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
  ] }) });
};

// src/components/renderers/ArtifactRenderer.tsx
import { jsx as jsx30, jsxs as jsxs17 } from "react/jsx-runtime";
function ArtifactRenderer({ artifact, toolCallStates }) {
  switch (artifact.type) {
    case "llm_response":
      return renderLLMResponse(artifact, toolCallStates);
    case "tool_results":
      return renderToolResults(artifact);
    case "artifact":
      return renderGenericArtifact(artifact);
    default:
      return null;
  }
}
function renderLLMResponse(llmArtifact, toolCallStates) {
  const toolCallStatesArray = Array.from(toolCallStates.values()).filter(Boolean);
  return /* @__PURE__ */ jsxs17("div", { className: "space-y-2", children: [
    llmArtifact.content && /* @__PURE__ */ jsx30("div", { className: "prose prose-sm max-w-none", children: /* @__PURE__ */ jsx30("p", { children: llmArtifact.content }) }),
    llmArtifact.tool_calls && llmArtifact.tool_calls.length > 0 && /* @__PURE__ */ jsx30(
      AssistantWithToolCalls2,
      {
        message: {
          id: llmArtifact.id,
          role: "assistant",
          parts: llmArtifact.tool_calls.map((toolCall) => ({
            type: "tool_call",
            tool_call: toolCall
          }))
        },
        toolCallStates: toolCallStatesArray,
        timestamp: new Date(llmArtifact.timestamp),
        isStreaming: false
      }
    )
  ] });
}
function renderToolResults(toolResultsArtifact) {
  return /* @__PURE__ */ jsxs17("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx30("div", { className: "prose prose-sm max-w-none", children: /* @__PURE__ */ jsxs17("p", { children: [
      "Tool execution completed with ",
      toolResultsArtifact.results.length,
      " result(s)."
    ] }) }),
    toolResultsArtifact.results.map((result, index) => /* @__PURE__ */ jsxs17("div", { className: "border rounded-lg p-3", children: [
      /* @__PURE__ */ jsxs17("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsx30("span", { className: "text-sm font-medium", children: result.tool_name }),
        /* @__PURE__ */ jsx30("span", { className: "text-xs text-green-600", children: "Success" })
      ] }),
      /* @__PURE__ */ jsxs17("div", { className: "text-sm text-gray-600", children: [
        /* @__PURE__ */ jsx30("strong", { children: "Result:" }),
        /* @__PURE__ */ jsx30("pre", { className: "whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto", children: typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2) })
      ] })
    ] }, result.tool_call_id || index))
  ] });
}
function renderGenericArtifact(genericArtifact) {
  return /* @__PURE__ */ jsxs17("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx30("div", { className: "prose prose-sm max-w-none", children: /* @__PURE__ */ jsxs17("p", { children: [
      "Artifact processed: ",
      genericArtifact.name
    ] }) }),
    /* @__PURE__ */ jsx30("div", { className: "border rounded-lg p-3", children: /* @__PURE__ */ jsxs17("div", { className: "text-sm", children: [
      /* @__PURE__ */ jsx30("strong", { children: "Data:" }),
      /* @__PURE__ */ jsx30("pre", { className: "whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto", children: JSON.stringify(genericArtifact.data, null, 2) })
    ] }) })
  ] });
}

// src/components/renderers/PlanRenderer.tsx
import { jsx as jsx31, jsxs as jsxs18 } from "react/jsx-runtime";
function PlanRenderer({ plan }) {
  return /* @__PURE__ */ jsxs18("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx31("div", { className: "prose prose-sm max-w-none", children: /* @__PURE__ */ jsxs18("p", { children: [
      "Planning phase completed with ",
      plan.steps.length,
      " step(s)."
    ] }) }),
    /* @__PURE__ */ jsx31(
      PlanMessage,
      {
        message: {
          id: plan.id,
          role: "assistant",
          parts: []
        },
        plan: plan.steps.join("\n"),
        timestamp: new Date(plan.timestamp)
      }
    )
  ] });
}

// src/components/renderers/MessageRenderer.tsx
import React23, { useMemo as useMemo3 } from "react";
import { Copy, Check as Check2, Brain as Brain2, Wrench as Wrench2, FileText } from "lucide-react";
import { isDistriMessage as isDistriMessage3 } from "@distri/core";
import { Fragment as Fragment3, jsx as jsx32, jsxs as jsxs19 } from "react/jsx-runtime";
var CodeBlock = ({ code, language = "text", className = "" }) => {
  const [copied, setCopied] = React23.useState(false);
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  return /* @__PURE__ */ jsxs19("div", { className: `relative my-4 ${className}`, children: [
    /* @__PURE__ */ jsxs19("div", { className: "flex justify-between items-center bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-md border-b", children: [
      /* @__PURE__ */ jsx32("span", { className: "text-sm text-gray-600 dark:text-gray-300 font-mono", children: language || "text" }),
      /* @__PURE__ */ jsx32(
        "button",
        {
          onClick: copyToClipboard,
          className: "flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors",
          children: copied ? /* @__PURE__ */ jsxs19(Fragment3, { children: [
            /* @__PURE__ */ jsx32(Check2, { className: "w-4 h-4" }),
            "Copied"
          ] }) : /* @__PURE__ */ jsxs19(Fragment3, { children: [
            /* @__PURE__ */ jsx32(Copy, { className: "w-4 h-4" }),
            "Copy"
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsx32("div", { className: "bg-gray-50 dark:bg-gray-900 rounded-b-md overflow-hidden", children: /* @__PURE__ */ jsx32("pre", { className: "p-4 overflow-x-auto text-sm", children: /* @__PURE__ */ jsx32("code", { className: "font-mono whitespace-pre-wrap break-words", children: code }) }) })
  ] });
};
var PartRenderer = ({ part }) => {
  switch (part.type) {
    case "text":
      return /* @__PURE__ */ jsx32("div", { className: "whitespace-pre-wrap break-words text-foreground", children: part.text });
    case "tool_call":
      return /* @__PURE__ */ jsxs19("div", { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-2", children: [
        /* @__PURE__ */ jsxs19("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx32(Wrench2, { className: "w-4 h-4 text-blue-600" }),
          /* @__PURE__ */ jsxs19("span", { className: "font-medium text-blue-800 dark:text-blue-200", children: [
            "Tool Call: ",
            part.tool_call.tool_name
          ] })
        ] }),
        /* @__PURE__ */ jsxs19("div", { className: "text-sm text-gray-600 dark:text-gray-300", children: [
          /* @__PURE__ */ jsx32("strong", { children: "Input:" }),
          /* @__PURE__ */ jsx32("pre", { className: "mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto", children: JSON.stringify(part.tool_call.input, null, 2) })
        ] })
      ] });
    case "tool_result":
      return /* @__PURE__ */ jsxs19("div", { className: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 my-2", children: [
        /* @__PURE__ */ jsxs19("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx32(Check2, { className: "w-4 h-4 text-green-600" }),
          /* @__PURE__ */ jsx32("span", { className: "font-medium text-green-800 dark:text-green-200", children: "Tool Result" })
        ] }),
        /* @__PURE__ */ jsx32("div", { className: "text-sm text-gray-600 dark:text-gray-300", children: /* @__PURE__ */ jsx32("pre", { className: "bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto", children: typeof part.tool_result.result === "string" ? part.tool_result.result : JSON.stringify(part.tool_result.result, null, 2) }) })
      ] });
    case "plan":
      return /* @__PURE__ */ jsxs19("div", { className: "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 my-2", children: [
        /* @__PURE__ */ jsxs19("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx32(Brain2, { className: "w-4 h-4 text-purple-600" }),
          /* @__PURE__ */ jsx32("span", { className: "font-medium text-purple-800 dark:text-purple-200", children: "Plan" })
        ] }),
        /* @__PURE__ */ jsx32("div", { className: "text-sm whitespace-pre-wrap", children: part.plan })
      ] });
    case "code_observation":
      return /* @__PURE__ */ jsxs19("div", { className: "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-2", children: [
        /* @__PURE__ */ jsxs19("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx32(FileText, { className: "w-4 h-4 text-yellow-600" }),
          /* @__PURE__ */ jsx32("span", { className: "font-medium text-yellow-800 dark:text-yellow-200", children: "Code Observation" })
        ] }),
        part.thought && /* @__PURE__ */ jsxs19("div", { className: "text-sm text-gray-600 dark:text-gray-300 mb-2", children: [
          /* @__PURE__ */ jsx32("strong", { children: "Thought:" }),
          " ",
          part.thought
        ] }),
        /* @__PURE__ */ jsx32(CodeBlock, { code: part.code, language: "text" })
      ] });
    case "image_url":
      return /* @__PURE__ */ jsx32("div", { className: "my-2", children: /* @__PURE__ */ jsx32(
        "img",
        {
          src: part.image.url,
          alt: part.image.name || "Image",
          className: "max-w-full h-auto rounded-lg border"
        }
      ) });
    case "image_bytes":
      return /* @__PURE__ */ jsx32("div", { className: "my-2", children: /* @__PURE__ */ jsx32(
        "img",
        {
          src: `data:${part.image.mime_type};base64,${part.image.data}`,
          alt: part.image.name || "Image",
          className: "max-w-full h-auto rounded-lg border"
        }
      ) });
    default:
      return /* @__PURE__ */ jsx32("div", { className: "bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm", children: /* @__PURE__ */ jsx32("pre", { children: JSON.stringify(part, null, 2) }) });
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
  const isExecutionSequence = useMemo3(() => {
    if (!messages || messages.length <= 1) return false;
    return messages.some(
      (msg) => isDistriMessage3(msg) && msg.parts.some((part) => part.type === "tool_call" || part.type === "tool_result")
    );
  }, [messages]);
  if (isExecutionSequence && messages) {
    const distriMessages = messages.filter(isDistriMessage3);
    return /* @__PURE__ */ jsx32("div", { className: `space-y-4 ${className}`, children: /* @__PURE__ */ jsx32(ExecutionSteps, { messages: distriMessages }) });
  }
  if (message && isDistriMessage3(message)) {
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
    return /* @__PURE__ */ jsx32("div", { className: `space-y-2 ${className}`, children: groupedParts.map((group, groupIndex) => {
      if (group.length > 1 && group.every((part) => part.type === "text")) {
        const concatenatedText = group.map((part) => part.type === "text" ? part.text : "").join("");
        return /* @__PURE__ */ jsx32(
          MessageRenderer,
          {
            content: concatenatedText,
            className
          },
          groupIndex
        );
      } else {
        const part = group[0];
        return /* @__PURE__ */ jsx32(PartRenderer, { part }, groupIndex);
      }
    }) });
  } else if (message) {
    return /* @__PURE__ */ jsx32("div", { className: `whitespace-pre-wrap break-words text-foreground ${className}`, children: JSON.stringify(message, null, 2) });
  } else if (!message && content) {
    return /* @__PURE__ */ jsx32("div", { className: `whitespace-pre-wrap break-words text-foreground ${className}`, children: content });
  }
  return null;
};
var MessageRenderer_default = MessageRenderer;

// src/components/Chat.tsx
import { ChevronDown as ChevronDown4, ChevronRight as ChevronRight3, Loader2 as Loader24, CheckCircle as CheckCircle8, XCircle as XCircle6, Clock as Clock6 } from "lucide-react";
import { jsx as jsx33, jsxs as jsxs20 } from "react/jsx-runtime";
function Planning() {
  return /* @__PURE__ */ jsxs20("div", { className: "flex items-start space-x-2 mb-4", children: [
    /* @__PURE__ */ jsx33("div", { className: "w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-1", children: /* @__PURE__ */ jsx33(Loader24, { className: "w-3 h-3 text-yellow-600 animate-spin" }) }),
    /* @__PURE__ */ jsx33("div", { className: "flex-1", children: /* @__PURE__ */ jsx33("p", { className: "text-sm text-gray-600", children: "Planning..." }) })
  ] });
}
function ToolExecution({
  toolCall,
  isExpanded,
  onToggle
}) {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case "running":
        return /* @__PURE__ */ jsx33(Loader24, { className: "w-4 h-4 animate-spin text-blue-500" });
      case "completed":
        return /* @__PURE__ */ jsx33(CheckCircle8, { className: "w-4 h-4 text-green-500" });
      case "failed":
        return /* @__PURE__ */ jsx33(XCircle6, { className: "w-4 h-4 text-red-500" });
      default:
        return /* @__PURE__ */ jsx33(Clock6, { className: "w-4 h-4 text-gray-500" });
    }
  };
  const getStatusText = () => {
    switch (toolCall.status) {
      case "running":
        return "Running";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Pending";
    }
  };
  return /* @__PURE__ */ jsxs20("div", { className: "mb-4", children: [
    /* @__PURE__ */ jsxs20("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [
      /* @__PURE__ */ jsxs20("div", { className: "flex items-center space-x-2", children: [
        getStatusIcon(),
        /* @__PURE__ */ jsx33("span", { className: "text-sm font-medium", children: toolCall.tool_name }),
        /* @__PURE__ */ jsx33(Badge, { variant: "secondary", className: "text-xs", children: getStatusText() })
      ] }),
      (toolCall.result || toolCall.error) && /* @__PURE__ */ jsx33(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: onToggle,
          className: "p-1 h-6 w-6",
          children: isExpanded ? /* @__PURE__ */ jsx33(ChevronDown4, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx33(ChevronRight3, { className: "w-4 h-4" })
        }
      )
    ] }),
    isExpanded && (toolCall.result || toolCall.error) && /* @__PURE__ */ jsx33(Card, { className: "mt-2", children: /* @__PURE__ */ jsx33(CardContent, { className: "p-3", children: toolCall.error ? /* @__PURE__ */ jsxs20("div", { className: "text-sm text-red-600", children: [
      /* @__PURE__ */ jsx33("strong", { children: "Error:" }),
      " ",
      toolCall.error
    ] }) : /* @__PURE__ */ jsxs20("div", { className: "text-sm", children: [
      /* @__PURE__ */ jsx33("strong", { children: "Result:" }),
      /* @__PURE__ */ jsx33("pre", { className: "whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto", children: typeof toolCall.result === "string" ? toolCall.result : JSON.stringify(toolCall.result, null, 2) })
    ] }) }) })
  ] });
}
function StreamingMessage({ content, isStreaming }) {
  return /* @__PURE__ */ jsxs20("div", { className: "flex items-start space-x-2 mb-4", children: [
    /* @__PURE__ */ jsx33("div", { className: "w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1", children: /* @__PURE__ */ jsx33("div", { className: "w-3 h-3 text-green-600", children: "A" }) }),
    /* @__PURE__ */ jsx33("div", { className: "flex-1", children: /* @__PURE__ */ jsxs20("div", { className: "prose prose-sm max-w-none", children: [
      /* @__PURE__ */ jsx33("p", { children: content }),
      isStreaming && /* @__PURE__ */ jsx33("span", { className: "inline-block w-2 h-4 bg-green-500 animate-pulse ml-1" })
    ] }) })
  ] });
}
function Chat({
  threadId,
  agent,
  onMessage,
  onError,
  getMetadata,
  onMessagesUpdate,
  tools,
  TaskRenderer: CustomTaskRenderer,
  ArtifactRenderer: CustomArtifactRenderer,
  PlanRenderer: CustomPlanRenderer,
  MessageRenderer: CustomMessageRenderer,
  ToolCallRenderer: CustomToolCallRenderer,
  onToolResult,
  theme = "auto"
}) {
  const [input, setInput] = useState13("");
  const [expandedTools, setExpandedTools] = useState13(/* @__PURE__ */ new Set());
  const messagesEndRef = useRef5(null);
  const {
    messages,
    isStreaming,
    sendMessage,
    isLoading,
    error,
    hasPendingToolCalls,
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
  const handleSendMessage = useCallback7(async (content) => {
    if (!content.trim()) return;
    setInput("");
    await sendMessage(content);
  }, [sendMessage]);
  const handleStopStreaming = useCallback7(() => {
    stopStreaming();
  }, [stopStreaming]);
  const toggleToolExpansion = useCallback7((toolId) => {
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
  useEffect10(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const currentTask = chatState.getCurrentTask();
  const currentPlan = chatState.getCurrentPlan();
  const currentTasks = chatState.getCurrentTasks();
  const pendingToolCalls = chatState.getPendingToolCalls();
  const completedToolCalls = chatState.getCompletedToolCalls();
  const TaskRendererComponent = CustomTaskRenderer || TaskRenderer;
  const ArtifactRendererComponent = CustomArtifactRenderer || ArtifactRenderer;
  const PlanRendererComponent = CustomPlanRenderer || PlanRenderer;
  const MessageRendererComponent = CustomMessageRenderer || MessageRenderer_default;
  const ToolCallRendererComponent = CustomToolCallRenderer || ToolExecution;
  const renderMessages = () => {
    const elements = [];
    messages.forEach((message, index) => {
      if (isDistriMessage4(message)) {
        const distriMessage = message;
        if (distriMessage.role === "user") {
          elements.push(
            /* @__PURE__ */ jsxs20("div", { className: "flex items-start space-x-2 mb-4", children: [
              /* @__PURE__ */ jsx33("div", { className: "w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1", children: /* @__PURE__ */ jsx33("div", { className: "w-3 h-3 text-blue-600", children: "U" }) }),
              /* @__PURE__ */ jsx33("div", { className: "flex-1", children: /* @__PURE__ */ jsx33("p", { className: "text-sm", children: distriMessage.parts.find((p) => p.type === "text")?.text || "User message" }) })
            ] }, `user-${index}`)
          );
        }
        if (distriMessage.role === "assistant") {
          elements.push(
            /* @__PURE__ */ jsx33(
              MessageRendererComponent,
              {
                message: distriMessage
              },
              `message-${index}`
            )
          );
        }
      }
      if (isDistriArtifact3(message)) {
        elements.push(
          /* @__PURE__ */ jsx33(
            ArtifactRendererComponent,
            {
              artifact: message,
              toolCallStates: chatState.toolCalls
            },
            `artifact-${index}`
          )
        );
      }
    });
    if (currentPlan?.status === "running") {
      elements.push(/* @__PURE__ */ jsx33(Planning, {}, "planning"));
    }
    if (currentPlan?.status === "completed" && currentPlan.steps.length > 0) {
      elements.push(
        /* @__PURE__ */ jsx33("div", { className: "mb-4", children: /* @__PURE__ */ jsx33(
          PlanRendererComponent,
          {
            plan: {
              type: "plan",
              timestamp: Date.now(),
              steps: currentPlan.steps,
              id: currentPlan.id
            }
          }
        ) }, "plan")
      );
    }
    pendingToolCalls.forEach((toolCall) => {
      elements.push(
        /* @__PURE__ */ jsx33(
          ToolCallRendererComponent,
          {
            toolCall,
            isExpanded: expandedTools.has(toolCall.tool_call_id),
            onToggle: () => toggleToolExpansion(toolCall.tool_call_id)
          },
          `tool-${toolCall.tool_call_id}`
        )
      );
    });
    completedToolCalls.forEach((toolCall) => {
      elements.push(
        /* @__PURE__ */ jsx33(
          ToolCallRendererComponent,
          {
            toolCall,
            isExpanded: expandedTools.has(toolCall.tool_call_id),
            onToggle: () => toggleToolExpansion(toolCall.tool_call_id)
          },
          `tool-${toolCall.tool_call_id}`
        )
      );
    });
    currentTasks.forEach((task) => {
      if (TaskRendererComponent) {
        elements.push(
          /* @__PURE__ */ jsx33(
            TaskRendererComponent,
            {
              task,
              toolCallStates: chatState.toolCalls,
              onToolResult
            },
            `task-${task.id}`
          )
        );
      }
    });
    if (isStreaming) {
      const lastMessage = messages[messages.length - 1];
      if (isDistriMessage4(lastMessage)) {
        const textContent = lastMessage.parts.filter((p) => p.type === "text").map((p) => p.text).join("");
        if (textContent) {
          elements.push(
            /* @__PURE__ */ jsx33(
              StreamingMessage,
              {
                content: textContent,
                isStreaming: true
              },
              "streaming"
            )
          );
        }
      }
    }
    return elements;
  };
  return /* @__PURE__ */ jsxs20("div", { className: `flex flex-col h-full ${theme === "dark" ? "dark" : ""}`, children: [
    /* @__PURE__ */ jsxs20("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [
      renderMessages(),
      process.env.NODE_ENV === "development" && /* @__PURE__ */ jsxs20("div", { className: "mt-8 p-4 bg-gray-100 rounded-lg text-xs", children: [
        /* @__PURE__ */ jsx33("h4", { className: "font-bold mb-2", children: "Debug Info:" }),
        /* @__PURE__ */ jsxs20("div", { children: [
          "Current Run: ",
          currentTask?.id || "None"
        ] }),
        /* @__PURE__ */ jsxs20("div", { children: [
          "Current Plan: ",
          currentPlan?.id || "None"
        ] }),
        /* @__PURE__ */ jsxs20("div", { children: [
          "Tasks: ",
          currentTasks.length
        ] }),
        /* @__PURE__ */ jsxs20("div", { children: [
          "Pending Tool Calls: ",
          pendingToolCalls.length
        ] }),
        /* @__PURE__ */ jsxs20("div", { children: [
          "Completed Tool Calls: ",
          completedToolCalls.length
        ] }),
        /* @__PURE__ */ jsxs20("div", { children: [
          "Total Tool Calls: ",
          chatState.toolCalls.size
        ] }),
        /* @__PURE__ */ jsxs20("div", { children: [
          "Messages: ",
          messages.length
        ] })
      ] }),
      /* @__PURE__ */ jsx33("div", { ref: messagesEndRef })
    ] }),
    /* @__PURE__ */ jsx33("div", { className: "border-t p-4", children: /* @__PURE__ */ jsx33(
      ChatInput,
      {
        value: input,
        onChange: setInput,
        onSend: () => handleSendMessage(input),
        onStop: handleStopStreaming,
        placeholder: "Type your message...",
        disabled: isLoading || hasPendingToolCalls(),
        isStreaming
      }
    ) }),
    error && /* @__PURE__ */ jsx33("div", { className: "p-4 bg-red-50 border-l-4 border-red-400", children: /* @__PURE__ */ jsxs20("div", { className: "text-red-700", children: [
      /* @__PURE__ */ jsx33("strong", { children: "Error:" }),
      " ",
      error.message
    ] }) })
  ] });
}

// src/utils/messageUtils.ts
import { isDistriMessage as isDistriMessage5, isDistriArtifact as isDistriArtifact4 } from "@distri/core";
var extractTextFromMessage = (message) => {
  if (isDistriMessage5(message)) {
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
  if (isDistriArtifact4(message)) {
    return true;
  }
  if (isDistriMessage5(message)) {
    const textContent = extractTextFromMessage(message);
    if (textContent.trim()) return true;
  }
  return showDebugMessages;
};
export {
  AgentSelect,
  ApprovalToolCall,
  AssistantMessage,
  AssistantWithToolCalls2 as AssistantWithToolCalls,
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
  useThreads,
  useToolCallState
};
