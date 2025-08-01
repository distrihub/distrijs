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
  agentId,
  autoCreateAgent = true
}) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agent, setAgent] = useState3(null);
  const [loading, setLoading] = useState3(false);
  const [error, setError] = useState3(null);
  const agentRef = useRef(null);
  const currentAgentIdRef = useRef(null);
  const initializeAgent = useCallback(async () => {
    if (!client || !agentId)
      return;
    if (currentAgentIdRef.current === agentId && agentRef.current) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      if (currentAgentIdRef.current !== agentId) {
        agentRef.current = null;
        setAgent(null);
      }
      const newAgent = await Agent.create(agentId, client);
      agentRef.current = newAgent;
      currentAgentIdRef.current = agentId;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create agent"));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);
  React2.useEffect(() => {
    if (!clientLoading && !clientError && autoCreateAgent && client) {
      initializeAgent();
    }
  }, [clientLoading, clientError, autoCreateAgent, client, agentId, initializeAgent]);
  React2.useEffect(() => {
    if (currentAgentIdRef.current !== agentId) {
      agentRef.current = null;
      setAgent(null);
      currentAgentIdRef.current = null;
    }
  }, [agentId]);
  return {
    // Agent information
    agent,
    // State management
    loading: loading || clientLoading,
    error: error || clientError
  };
}

// src/useAgents.ts
import { useState as useState4, useEffect as useEffect3, useCallback as useCallback2 } from "react";
function useAgents() {
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
  useEffect3(() => {
    if (clientLoading) {
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
import { useState as useState7, useCallback as useCallback4, useEffect as useEffect6, useRef as useRef3 } from "react";
import {
  DistriClient as DistriClient2,
  isDistriMessage,
  isDistriEvent,
  convertDistriMessageToA2A,
  decodeA2AStreamEvent
} from "@distri/core";

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
    if (isProcessing || status === "completed")
      return;
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
import { Fragment, jsx as jsx5 } from "react/jsx-runtime";
var toast = {
  success: (msg, _options) => console.log(msg),
  error: (msg, _options) => console.log(msg),
  warning: (msg, _options) => console.log(msg),
  info: (msg, _options) => console.log(msg)
};
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
  const { onAllToolsCompleted, agent } = options;
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
      if (Array.from(newStates.values()).filter((state) => state.status === "pending" || state.status === "running").length === 0 && onAllToolsCompleted) {
        onAllToolsCompleted(Array.from(newStates.values()).map((state) => ({
          tool_call_id: state.tool_call_id,
          result: state.result,
          success: state.status === "completed",
          error: state.error
        })));
      }
      return newStates;
    });
  }, []);
  const getToolCallState = useCallback3((toolCallId) => {
    return toolCallStates.get(toolCallId);
  }, [toolCallStates]);
  const hasPendingToolCalls = useCallback3(() => {
    return Array.from(toolCallStates.values()).some(
      (state) => state.status === "pending" || state.status === "running"
    );
  }, [toolCallStates]);
  const getPendingToolCalls = useCallback3(() => {
    const pendingIds = Array.from(toolCallStates.entries()).filter(([_, state]) => state.status === "pending" || state.status === "running").map(([id, _]) => id);
    return Array.from(toolCallStates.values()).filter((state) => pendingIds.includes(state.tool_call_id));
  }, [toolCallStates]);
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
  const [executionEvents, setExecutionEvents] = useState7([]);
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
    onAllToolsCompleted: (toolResults) => {
      sendToolResultsToAgent(toolResults);
    }
  });
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
      setError(null);
      agentIdRef.current = agent?.id;
    }
  }, [agent?.id, toolStateHandler]);
  const clearMessages = useCallback4(() => {
    setMessages([]);
    toolStateHandler.clearAll();
  }, [toolStateHandler]);
  const fetchMessages = useCallback4(async () => {
    if (!agent)
      return;
    try {
      const a2aMessages = await agent.getThreadMessages(threadId);
      const distriMessages = a2aMessages.map(decodeA2AStreamEvent);
      setMessages(distriMessages);
      const execEvents = distriMessages.filter(isDistriEvent).filter(isExecutionEvent);
      setExecutionEvents(execEvents);
      onMessagesUpdate?.();
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Failed to fetch messages");
      setError(error2);
      onError?.(error2);
    }
  }, [threadId, agent?.id, onError, onMessagesUpdate]);
  useEffect6(() => {
    if (threadId) {
      fetchMessages();
    }
  }, [threadId, agent?.id]);
  const handleStreamEvent = useCallback4((event) => {
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
      } else if (isDistriEvent(event)) {
        const distriEvent = event;
        if (isExecutionEvent(distriEvent)) {
          setExecutionEvents((prevEvents) => [...prevEvents, distriEvent]);
        }
        return [...prev, event];
      } else {
        return [...prev, event];
      }
    });
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
  }, [toolStateHandler, onMessage]);
  const isExecutionEvent = (event) => {
    return [
      "run_started",
      "run_finished",
      "plan_started",
      "plan_finished",
      "step_started",
      "step_completed",
      "tool_execution_start",
      "tool_execution_end",
      "tool_rejected"
    ].includes(event.type);
  };
  const sendMessage = useCallback4(async (content) => {
    if (!agent)
      return;
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
    if (!agent)
      return;
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
    executionEvents,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    sendMessageStream,
    toolCallStates: toolStateHandler.toolCallStates,
    clearMessages,
    stopStreaming
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
    if (!client)
      return;
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

// src/components/EmbeddableChat.tsx
import { useState as useState11, useMemo as useMemo2, useRef as useRef5, useEffect as useEffect9 } from "react";
import {
  isDistriMessage as isDistriMessage4
} from "@distri/core";

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

// src/utils/messageUtils.ts
import { isDistriMessage as isDistriMessage2 } from "@distri/core";
var extractTextFromMessage = (message) => {
  if (isDistriMessage2(message)) {
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
  if (!message)
    return false;
  if (isDistriMessage2(message)) {
    if (message.role === "user") {
      const textContent2 = extractTextFromMessage(message);
      return textContent2.trim().length > 0;
    }
    const textContent = extractTextFromMessage(message);
    if (textContent.trim())
      return true;
  }
  return showDebugMessages;
};

// src/components/Components.tsx
import React9, { useState as useState9 } from "react";
import { User, Bot, Settings, Clock, CheckCircle as CheckCircle2, XCircle as XCircle2, Brain as Brain2, Wrench as Wrench2, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

// src/components/MessageRenderer.tsx
import React8, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Brain, Wrench, FileText } from "lucide-react";

// src/components/ChatContext.tsx
import React7, { createContext as createContext3, useContext as useContext3 } from "react";
import { jsx as jsx8 } from "react/jsx-runtime";
var defaultConfig = {
  theme: "auto",
  showDebug: false,
  autoScroll: true,
  showTimestamps: true,
  enableMarkdown: true,
  enableCodeHighlighting: true
};
var ChatContext = createContext3(null);
var useChatConfig = () => {
  const context = useContext3(ChatContext);
  if (!context) {
    return {
      config: defaultConfig,
      updateConfig: () => {
      }
    };
  }
  return context;
};

// src/components/MessageRenderer.tsx
import { isDistriMessage as isDistriMessage3 } from "@distri/core";
import { jsx as jsx9, jsxs as jsxs3 } from "react/jsx-runtime";
var CodeBlock = ({ language, children, inline = false }) => {
  const [copied, setCopied] = React8.useState(false);
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
    return /* @__PURE__ */ jsx9("code", { className: "px-1.5 py-0.5 rounded text-sm font-mono bg-muted text-foreground", children });
  }
  const lineCount = children.split("\n").length;
  const shouldShowLineNumbers = lineCount > 4;
  return /* @__PURE__ */ jsxs3("div", { className: "relative group", children: [
    /* @__PURE__ */ jsx9("div", { className: "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx9(
      "button",
      {
        onClick: handleCopy,
        className: "p-2 rounded-md bg-muted hover:bg-muted/80",
        title: "Copy code",
        children: copied ? /* @__PURE__ */ jsx9(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx9(Copy, { className: "h-4 w-4" })
      }
    ) }),
    /* @__PURE__ */ jsx9("div", { className: "relative", children: /* @__PURE__ */ jsx9(
      SyntaxHighlighter,
      {
        style: oneLight,
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
          background: "hsl(var(--muted))",
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
var CodeObservationComponent = ({ thought, code }) => {
  return /* @__PURE__ */ jsxs3("div", { className: "border rounded-lg p-4 my-4 border-border bg-muted/50", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx9(Brain, { className: "h-4 w-4 text-blue-500" }),
      /* @__PURE__ */ jsx9("span", { className: "text-sm font-medium text-blue-600", children: "Code Observation" })
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "mb-3", children: [
      /* @__PURE__ */ jsx9("div", { className: "text-sm text-muted-foreground mb-2", children: "Thought:" }),
      /* @__PURE__ */ jsx9("div", { className: "text-sm text-foreground", children: thought })
    ] }),
    /* @__PURE__ */ jsxs3("div", { children: [
      /* @__PURE__ */ jsx9("div", { className: "text-sm text-muted-foreground mb-2", children: "Code:" }),
      /* @__PURE__ */ jsx9(CodeBlock, { language: "javascript", children: code })
    ] })
  ] });
};
var ToolCallComponent = ({ toolCall }) => {
  return /* @__PURE__ */ jsxs3("div", { className: "border rounded-lg p-4 my-4 border-border bg-muted/50", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx9(Wrench, { className: "h-4 w-4 text-green-500" }),
      /* @__PURE__ */ jsx9("span", { className: "text-sm font-medium text-green-600", children: "Tool Call" })
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsx9("span", { className: "text-sm text-muted-foreground", children: "Tool:" }),
        /* @__PURE__ */ jsx9("span", { className: "ml-2 text-sm font-mono text-foreground", children: toolCall.tool_name })
      ] }),
      /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsx9("span", { className: "text-sm text-muted-foreground", children: "Input:" }),
        /* @__PURE__ */ jsx9("div", { className: "mt-1", children: /* @__PURE__ */ jsx9(CodeBlock, { language: "json", children: JSON.stringify(toolCall.input, null, 2) }) })
      ] })
    ] })
  ] });
};
var ToolResultComponent = ({ toolResult }) => {
  return /* @__PURE__ */ jsxs3("div", { className: "border rounded-lg p-4 my-4 border-border bg-muted/50", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx9(FileText, { className: "h-4 w-4 text-purple-500" }),
      /* @__PURE__ */ jsx9("span", { className: "text-sm font-medium text-purple-600", children: "Tool Result" }),
      /* @__PURE__ */ jsx9("span", { className: `text-xs px-2 py-1 rounded ${toolResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`, children: toolResult.success ? "Success" : "Error" })
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "space-y-2", children: [
      toolResult.error && /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsx9("span", { className: "text-sm text-destructive", children: "Error:" }),
        /* @__PURE__ */ jsx9("div", { className: "mt-1 text-sm text-destructive", children: toolResult.error })
      ] }),
      /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsx9("span", { className: "text-sm text-muted-foreground", children: "Result:" }),
        /* @__PURE__ */ jsx9("div", { className: "mt-1", children: /* @__PURE__ */ jsx9(CodeBlock, { language: "json", children: JSON.stringify(toolResult.result, null, 2) }) })
      ] })
    ] })
  ] });
};
var PlanComponent = ({ plan }) => {
  return /* @__PURE__ */ jsxs3("div", { className: "border rounded-lg p-4 my-4 border-border bg-muted/50", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx9(Brain, { className: "h-4 w-4 text-orange-500" }),
      /* @__PURE__ */ jsx9("span", { className: "text-sm font-medium text-orange-600", children: "Plan" })
    ] }),
    /* @__PURE__ */ jsx9("div", { className: "text-sm text-foreground", children: plan })
  ] });
};
var PartRenderer = ({ part }) => {
  switch (part.type) {
    case "text":
      return /* @__PURE__ */ jsx9("div", { className: "whitespace-pre-wrap break-words text-foreground", children: part.text });
    case "code_observation":
      return /* @__PURE__ */ jsx9(CodeObservationComponent, { thought: part.thought, code: part.code });
    case "tool_call":
      return /* @__PURE__ */ jsx9(ToolCallComponent, { toolCall: part.tool_call });
    case "tool_result":
      return /* @__PURE__ */ jsx9(ToolResultComponent, { toolResult: part.tool_result });
    case "plan":
      return /* @__PURE__ */ jsx9(PlanComponent, { plan: part.plan });
    case "image_url":
      return /* @__PURE__ */ jsx9("div", { className: "my-4", children: /* @__PURE__ */ jsx9(
        "img",
        {
          src: part.image.url,
          alt: part.image.name || "Image",
          className: "max-w-full rounded-lg"
        }
      ) });
    case "image_bytes":
      return /* @__PURE__ */ jsx9("div", { className: "my-4", children: /* @__PURE__ */ jsx9(
        "img",
        {
          src: `data:${part.image.mime_type};base64,${part.image.data}`,
          alt: part.image.name || "Image",
          className: "max-w-full rounded-lg"
        }
      ) });
    case "data":
      return /* @__PURE__ */ jsx9("div", { className: "my-4", children: /* @__PURE__ */ jsx9(CodeBlock, { language: "json", children: JSON.stringify(part.data, null, 2) }) });
    default:
      return null;
  }
};
var MessageRenderer = ({
  content,
  message,
  className = "",
  metadata: _metadata
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
    return /* @__PURE__ */ jsx9("div", { className: `space-y-2 ${className}`, children: groupedParts.map((group, groupIndex) => {
      if (group.length > 1 && group.every((part) => part.type === "text")) {
        const concatenatedText = group.map((part) => part.type === "text" ? part.text : "").join("");
        return /* @__PURE__ */ jsx9("div", { className: "whitespace-pre-wrap break-words text-foreground", children: concatenatedText }, groupIndex);
      } else {
        return /* @__PURE__ */ jsx9(PartRenderer, { part: group[0] }, groupIndex);
      }
    }) });
  }
  if (!content)
    return null;
  const hasMarkdownSyntax = useMemo(() => {
    if (!config.enableMarkdown)
      return false;
    const markdownPatterns = [
      /^#{1, 6}\s+/m,
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
  const looksLikeCode = useMemo(() => {
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
      /^\s*<html|<head|<body|<div /,
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
      /[{ }[\]()]/g,
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
  const detectLanguage = useMemo(() => {
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
    return /* @__PURE__ */ jsx9(
      CodeBlock,
      {
        language: detectLanguage,
        children: content
      }
    );
  }
  if (!hasMarkdownSyntax) {
    return /* @__PURE__ */ jsx9("div", { className: `whitespace-pre-wrap break-words text-foreground ${className}`, children: content });
  }
  return /* @__PURE__ */ jsx9("div", { className: `prose prose-sm max-w-none prose-foreground ${className} break-words`, children: /* @__PURE__ */ jsx9(
    ReactMarkdown,
    {
      components: {
        code({ className: className2, children }) {
          const match = /language-(\w+)/.exec(className2 || "");
          const language = match ? match[1] : "";
          return /* @__PURE__ */ jsx9(
            CodeBlock,
            {
              language,
              inline: true,
              children: String(children).replace(/\n$/, "")
            }
          );
        },
        // Enhanced blockquote styling
        blockquote({ children }) {
          return /* @__PURE__ */ jsx9("blockquote", { className: "border-l-4 pl-4 py-2 italic my-4 rounded-r border-primary text-primary bg-primary/10", children });
        },
        // Enhanced table styling with overflow handling
        table({ children }) {
          return /* @__PURE__ */ jsx9("div", { className: "overflow-x-auto my-4", children: /* @__PURE__ */ jsx9("table", { className: "min-w-full border-collapse rounded-lg overflow-hidden border-border", children }) });
        },
        th({ children }) {
          return /* @__PURE__ */ jsx9("th", { className: "border px-4 py-2 font-semibold text-left border-border bg-muted", children });
        },
        td({ children }) {
          return /* @__PURE__ */ jsx9("td", { className: "border px-4 py-2 border-border", children });
        }
      },
      children: content
    }
  ) });
};
var MessageRenderer_default = MessageRenderer;

// src/components/Components.tsx
import { jsx as jsx10, jsxs as jsxs4 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx10("div", { className: `flex ${justifyClass} w-full ${bgClass} ${className}`, children: /* @__PURE__ */ jsx10("div", { className: "w-full max-w-4xl mx-auto", children }) });
};
var UserMessage = ({
  content,
  message,
  timestamp,
  className = "",
  avatar
}) => {
  return /* @__PURE__ */ jsx10(MessageContainer, { align: "center", className, backgroundColor: "#343541", children: /* @__PURE__ */ jsxs4("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx10("div", { className: "distri-avatar distri-avatar-user", children: avatar || /* @__PURE__ */ jsx10(User, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs4("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx10("div", { className: "text-sm font-medium text-foreground mb-2", children: "You" }),
      /* @__PURE__ */ jsx10("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx10(
        MessageRenderer_default,
        {
          content,
          message,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx10("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
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
  return /* @__PURE__ */ jsx10(MessageContainer, { align: "center", className, backgroundColor: "#444654", children: /* @__PURE__ */ jsxs4("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx10("div", { className: "distri-avatar distri-avatar-assistant", children: avatar || /* @__PURE__ */ jsx10(Bot, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs4("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs4("div", { className: "text-sm font-medium text-foreground mb-2 flex items-center gap-2", children: [
        name,
        isStreaming && /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx10("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse" }),
          /* @__PURE__ */ jsx10("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ jsx10("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      /* @__PURE__ */ jsx10("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx10(
        MessageRenderer_default,
        {
          content,
          message,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx10("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var AssistantWithToolCalls = ({
  content,
  message,
  toolCallStates,
  timestamp,
  isStreaming = false,
  className = "",
  avatar,
  name = "Assistant"
}) => {
  const [expandedTools, setExpandedTools] = useState9(/* @__PURE__ */ new Set());
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
  React9.useEffect(() => {
    const newExpanded = new Set(expandedTools);
    toolCallStates.forEach((toolCallState) => {
      if (toolCallState.status === "running" || toolCallState.status === "error" || toolCallState.status === "user_action_required") {
        newExpanded.add(toolCallState.tool_call_id);
      }
    });
    setExpandedTools(newExpanded);
  }, [toolCallStates]);
  return /* @__PURE__ */ jsx10(MessageContainer, { align: "center", className, backgroundColor: "#444654", children: /* @__PURE__ */ jsxs4("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx10("div", { className: "distri-avatar distri-avatar-assistant", children: avatar || /* @__PURE__ */ jsx10(Bot, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs4("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs4("div", { className: "text-sm font-medium text-foreground mb-2 flex items-center gap-2", children: [
        name,
        isStreaming && /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx10("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse" }),
          /* @__PURE__ */ jsx10("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ jsx10("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150" })
        ] })
      ] }),
      /* @__PURE__ */ jsx10("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx10(
        MessageRenderer_default,
        {
          content,
          message,
          className: "text-foreground"
        }
      ) }),
      toolCallStates.length > 0 && /* @__PURE__ */ jsxs4("div", { className: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsx10("div", { className: "text-sm font-medium text-foreground", children: "Tool Calls" }),
        toolCallStates.map((toolCallState, index) => {
          const isExpanded = expandedTools.has(toolCallState.tool_call_id);
          const hasResult = toolCallState?.result !== void 0;
          const hasError = toolCallState?.error !== void 0;
          const canCollapse = hasResult || hasError || toolCallState?.status === "completed" || toolCallState?.status === "error";
          return /* @__PURE__ */ jsxs4("div", { className: "border rounded-lg bg-background overflow-hidden", children: [
            /* @__PURE__ */ jsxs4("div", { className: "p-3 border-b border-border", children: [
              /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx10(
                    "button",
                    {
                      onClick: () => toggleToolExpansion(toolCallState.tool_call_id),
                      className: "p-1 hover:bg-muted rounded transition-colors",
                      disabled: !canCollapse,
                      children: canCollapse ? isExpanded ? /* @__PURE__ */ jsx10(ChevronDown, { className: "h-3 w-3 text-muted-foreground" }) : /* @__PURE__ */ jsx10(ChevronRight, { className: "h-3 w-3 text-muted-foreground" }) : /* @__PURE__ */ jsx10("div", { className: "h-3 w-3" })
                    }
                  ),
                  /* @__PURE__ */ jsx10(Wrench2, { className: "h-4 w-4 text-green-500" }),
                  /* @__PURE__ */ jsx10("span", { className: "text-sm font-medium text-foreground", children: toolCallState?.tool_name })
                ] }),
                /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2", children: [
                  toolCallState?.status === "pending" && /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-1 text-xs text-yellow-600", children: [
                    /* @__PURE__ */ jsx10(Clock, { className: "h-3 w-3" }),
                    "Pending"
                  ] }),
                  toolCallState?.status === "running" && /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-1 text-xs text-blue-600", children: [
                    /* @__PURE__ */ jsx10(Loader2, { className: "h-3 w-3 animate-spin" }),
                    "Running"
                  ] }),
                  toolCallState?.status === "completed" && /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-1 text-xs text-green-600", children: [
                    /* @__PURE__ */ jsx10(CheckCircle2, { className: "h-3 w-3" }),
                    "Completed"
                  ] }),
                  toolCallState?.status === "error" && /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-1 text-xs text-red-600", children: [
                    /* @__PURE__ */ jsx10(XCircle2, { className: "h-3 w-3" }),
                    "Failed"
                  ] }),
                  toolCallState?.status === "user_action_required" && /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-1 text-xs text-orange-600", children: [
                    /* @__PURE__ */ jsx10(Wrench2, { className: "h-3 w-3" }),
                    "User Action Required"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs4("div", { className: "mt-2", children: [
                /* @__PURE__ */ jsx10("div", { className: "text-xs text-muted-foreground mb-1", children: "Input:" }),
                /* @__PURE__ */ jsx10("div", { className: "text-xs font-mono bg-muted p-2 rounded border", children: JSON.stringify(toolCallState?.input, null, 2) })
              ] }),
              /* @__PURE__ */ jsx10("div", { className: "mt-3", children: !!toolCallState?.component && toolCallState.component })
            ] }),
            canCollapse && isExpanded && /* @__PURE__ */ jsxs4("div", { className: "p-3 bg-muted/30", children: [
              hasError && /* @__PURE__ */ jsxs4("div", { className: "mb-3", children: [
                /* @__PURE__ */ jsx10("div", { className: "text-xs text-red-600 font-medium mb-1", children: "Error:" }),
                /* @__PURE__ */ jsx10("div", { className: "text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200", children: toolCallState?.error })
              ] }),
              hasResult && /* @__PURE__ */ jsxs4("div", { children: [
                /* @__PURE__ */ jsx10("div", { className: "text-xs text-muted-foreground font-medium mb-1", children: "Result:" }),
                /* @__PURE__ */ jsx10("div", { className: "text-xs font-mono bg-background p-2 rounded border", children: JSON.stringify(toolCallState?.result, null, 2) })
              ] })
            ] })
          ] }, index);
        })
      ] }),
      timestamp && /* @__PURE__ */ jsx10("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
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
  return /* @__PURE__ */ jsx10(MessageContainer, { align: "center", className, backgroundColor: "#40414f", children: /* @__PURE__ */ jsxs4("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx10("div", { className: "distri-avatar distri-avatar-plan", children: avatar || /* @__PURE__ */ jsx10(Brain2, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs4("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx10("div", { className: "text-sm font-medium text-foreground mb-2", children: "Plan" }),
      /* @__PURE__ */ jsx10("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx10(
        MessageRenderer_default,
        {
          content: plan,
          message,
          className: "text-foreground"
        }
      ) }),
      timestamp && /* @__PURE__ */ jsx10("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
    ] })
  ] }) });
};
var DebugMessage = ({
  message,
  className = "",
  timestamp
}) => {
  return /* @__PURE__ */ jsx10(MessageContainer, { align: "center", className, backgroundColor: "#343541", children: /* @__PURE__ */ jsxs4("div", { className: "flex items-start gap-4 py-3 px-2", children: [
    /* @__PURE__ */ jsx10("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ jsx10(
      MessageRenderer_default,
      {
        content: JSON.stringify(message),
        className: "text-foreground"
      }
    ) }),
    timestamp && /* @__PURE__ */ jsx10("div", { className: "text-xs text-muted-foreground mt-2", children: timestamp.toLocaleTimeString() })
  ] }) });
};

// src/components/ExecutionSteps.tsx
import React10, { useState as useState10 } from "react";
import { ChevronRight as ChevronRight2, CheckCircle as CheckCircle3, XCircle as XCircle3, Clock as Clock2, Play } from "lucide-react";
import { jsx as jsx11, jsxs as jsxs5 } from "react/jsx-runtime";
var StepStatusIcon = ({ status: status2 }) => {
  switch (status2) {
    case "pending":
      return /* @__PURE__ */ jsx11(Clock2, { className: "w-4 h-4 text-muted-foreground" });
    case "running":
      return /* @__PURE__ */ jsx11(Play, { className: "w-4 h-4 text-blue-500 animate-pulse" });
    case "completed":
      return /* @__PURE__ */ jsx11(CheckCircle3, { className: "w-4 h-4 text-green-500" });
    case "failed":
      return /* @__PURE__ */ jsx11(XCircle3, { className: "w-4 h-4 text-red-500" });
    default:
      return /* @__PURE__ */ jsx11(Clock2, { className: "w-4 h-4 text-muted-foreground" });
  }
};
var StepItem = ({ step, isActive, onToggleExpanded }) => {
  return /* @__PURE__ */ jsxs5("div", { className: `border-l-2 pl-4 pb-4 transition-all duration-200 ${isActive ? "border-blue-500" : "border-border"}`, children: [
    /* @__PURE__ */ jsx11(
      "div",
      {
        className: "flex items-start gap-3 cursor-pointer group",
        onClick: onToggleExpanded,
        children: /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2 flex-1", children: [
          /* @__PURE__ */ jsx11(StepStatusIcon, { status: step.status }),
          /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx11(ChevronRight2, { className: "w-3 h-3 text-muted-foreground" }),
            /* @__PURE__ */ jsxs5("span", { className: "text-sm font-medium", children: [
              "Step ",
              step.index + 1
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxs5("div", { className: "mt-2 pl-6", children: [
      /* @__PURE__ */ jsxs5("p", { className: `text-sm transition-all duration-200 ${isActive ? "text-foreground" : "text-muted-foreground"}`, children: [
        "Step ",
        step.id
      ] }),
      step.status === "running" && /* @__PURE__ */ jsxs5("div", { className: "mt-2 flex items-center gap-2 text-xs text-blue-600", children: [
        /* @__PURE__ */ jsx11("div", { className: "w-2 h-2 bg-blue-500 rounded-full animate-pulse" }),
        "Executing..."
      ] })
    ] })
  ] });
};
var ExecutionSteps = ({
  steps,
  currentStepId,
  isPlanning = false,
  planDescription,
  className = ""
}) => {
  const [expandedSteps, setExpandedSteps] = useState10(/* @__PURE__ */ new Set());
  const toggleExpanded = (stepId) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };
  if (isPlanning) {
    return /* @__PURE__ */ jsx11("div", { className: `space-y-3 ${className}`, children: /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800", children: [
      /* @__PURE__ */ jsx11("div", { className: "w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" }),
      /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx11("div", { className: "text-sm font-medium text-blue-700 dark:text-blue-300", children: "Planning steps..." }),
        planDescription && /* @__PURE__ */ jsx11("div", { className: "text-xs text-blue-600 dark:text-blue-400 mt-1", children: planDescription })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsx11("div", { className: `space-y-1 ${className}`, children: steps.map((step) => /* @__PURE__ */ jsx11(
    StepItem,
    {
      step,
      isActive: step.id === currentStepId,
      isExpanded: expandedSteps.has(step.id),
      onToggleExpanded: () => toggleExpanded(step.id)
    },
    step.id
  )) });
};
var ExecutionTracker = ({
  events,
  className = ""
}) => {
  const [steps, setSteps] = useState10([]);
  const [isPlanning, setIsPlanning] = useState10(false);
  const [currentStepId, setCurrentStepId] = useState10();
  React10.useEffect(() => {
    let newSteps = [...steps];
    let planning = isPlanning;
    let currentStep = currentStepId;
    for (const event of events) {
      switch (event.type) {
        case "plan_started":
          planning = true;
          break;
        case "plan_finished":
          planning = false;
          break;
        case "step_started":
          const startedEvent = event;
          currentStep = startedEvent.data.step_id;
          const existingIndex = newSteps.findIndex((s) => s.id === startedEvent.data.step_id);
          if (existingIndex >= 0) {
            newSteps[existingIndex] = {
              ...newSteps[existingIndex],
              status: "running",
              started_at: (/* @__PURE__ */ new Date()).toISOString()
            };
          } else {
            newSteps.push({
              id: startedEvent.data.step_id,
              index: startedEvent.data.step_index,
              status: "running",
              started_at: (/* @__PURE__ */ new Date()).toISOString()
            });
          }
          break;
        case "step_completed":
          const completedEvent = event;
          const stepIndex = newSteps.findIndex((s) => s.id === completedEvent.data.step_id);
          if (stepIndex >= 0) {
            newSteps[stepIndex] = {
              ...newSteps[stepIndex],
              status: completedEvent.data.success ? "completed" : "failed",
              success: completedEvent.data.success,
              completed_at: (/* @__PURE__ */ new Date()).toISOString()
            };
          }
          break;
      }
    }
    setSteps(newSteps);
    setIsPlanning(planning);
    setCurrentStepId(currentStep);
  }, [events]);
  if (!isPlanning && steps.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsxs5("div", { className: `p-4 rounded-lg border bg-card ${className}`, children: [
    /* @__PURE__ */ jsx11("div", { className: "mb-3", children: /* @__PURE__ */ jsx11("h3", { className: "text-sm font-semibold text-foreground", children: "Execution Plan" }) }),
    /* @__PURE__ */ jsx11(
      ExecutionSteps,
      {
        steps,
        currentStepId,
        isPlanning
      }
    )
  ] });
};

// src/components/EmbeddableChat.tsx
import { jsx as jsx12, jsxs as jsxs6 } from "react/jsx-runtime";
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
var EmbeddableChat = ({
  threadId = generateUUID(),
  agent,
  className = "",
  style = {},
  getMetadata,
  tools,
  // availableAgents = [],
  UserMessageComponent = UserMessage,
  AssistantMessageComponent = AssistantMessage,
  AssistantWithToolCallsComponent = AssistantWithToolCalls,
  PlanMessageComponent = PlanMessage,
  theme = "dark",
  showDebug = false,
  // showAgentSelector = true,
  placeholder = "Type your message...",
  // disableAgentSelection = false,
  // onAgentSelect,
  onResponse: _onResponse,
  onMessagesUpdate
}) => {
  const [input, setInput] = useState11("");
  const messagesEndRef = useRef5(null);
  const {
    messages,
    executionEvents,
    isLoading,
    isStreaming,
    error,
    sendMessage: sendChatMessage,
    toolCallStates,
    stopStreaming
  } = useChat({
    threadId,
    agent: agent || void 0,
    tools,
    getMetadata,
    onMessagesUpdate
  });
  useEffect9(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  const sendMessage = async () => {
    if (!input.trim() || isLoading)
      return;
    const messageText = input.trim();
    setInput("");
    try {
      await sendChatMessage(messageText);
    } catch (err) {
      console.error("Failed to send message:", err);
      setInput(messageText);
    }
  };
  const getMessageType = (message) => {
    if (message.parts.some((part) => part.type === "tool_call")) {
      return "assistant_with_tools";
    }
    if (message.parts.some((part) => part.type === "plan")) {
      return "plan";
    }
    return message.role;
  };
  const renderedMessages = useMemo2(() => {
    return messages.filter((msg) => shouldDisplayMessage(msg, showDebug)).map((message, index) => {
      const messageContent = extractTextFromMessage(message);
      const key = `message-${index}`;
      const timestamp = message.created_at ? new Date(message.created_at) : void 0;
      if (isDistriMessage4(message)) {
        switch (getMessageType(message)) {
          case "user":
            return /* @__PURE__ */ jsx12(
              UserMessageComponent,
              {
                message,
                timestamp
              },
              key
            );
          case "assistant":
            return /* @__PURE__ */ jsx12(
              AssistantMessageComponent,
              {
                name: agent?.name,
                avatar: agent?.iconUrl ? /* @__PURE__ */ jsx12("img", { src: agent.iconUrl, alt: agent.name, className: "w-6 h-6 rounded-full" }) : /* @__PURE__ */ jsx12("div", { className: "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs", children: agent?.name?.charAt(0).toUpperCase() || "A" }),
                message,
                timestamp,
                isStreaming: isStreaming && index === messages.length - 1
              },
              key
            );
          case "assistant_with_tools":
            const states = (message.parts || []).filter((part) => part.tool_call).map((part) => {
              const toolCallState = toolCallStates.get(part.tool_call.tool_call_id);
              return toolCallState;
            }).filter(Boolean);
            return /* @__PURE__ */ jsx12(
              AssistantWithToolCallsComponent,
              {
                message,
                toolCallStates: states,
                timestamp,
                isStreaming: isStreaming && index === messages.length - 1
              },
              key
            );
          case "plan":
            return /* @__PURE__ */ jsx12(
              PlanMessageComponent,
              {
                message,
                plan: messageContent,
                timestamp
              },
              key
            );
          case "debug":
            return /* @__PURE__ */ jsx12(
              DebugMessage,
              {
                message,
                timestamp
              },
              key
            );
          default:
            return null;
        }
      } else {
        return null;
      }
    }).filter(Boolean);
  }, [
    messages,
    showDebug,
    UserMessageComponent,
    AssistantMessageComponent,
    AssistantWithToolCallsComponent,
    PlanMessageComponent,
    toolCallStates,
    isStreaming
  ]);
  return /* @__PURE__ */ jsxs6(
    "div",
    {
      className: `distri-chat ${className} flex flex-col h-full border rounded-lg overflow-hidden ${theme === "dark" ? "dark" : ""}`,
      style,
      children: [
        /* @__PURE__ */ jsxs6("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [
          renderedMessages,
          executionEvents.length > 0 && /* @__PURE__ */ jsx12(
            ExecutionTracker,
            {
              events: executionEvents,
              className: "mt-4"
            }
          ),
          error && /* @__PURE__ */ jsxs6("div", { className: "text-red-500 text-sm p-3 bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800", children: [
            "Error: ",
            error.message
          ] }),
          /* @__PURE__ */ jsx12("div", { ref: messagesEndRef })
        ] }),
        /* @__PURE__ */ jsx12("div", { className: "border-t p-4", children: /* @__PURE__ */ jsx12(
          ChatInput,
          {
            value: input,
            onChange: setInput,
            onSend: sendMessage,
            onStop: stopStreaming,
            placeholder,
            disabled: isLoading,
            isStreaming
          }
        ) })
      ]
    }
  );
};

// src/components/FullChat.tsx
import { useState as useState12, useRef as useRef6, useEffect as useEffect10, useMemo as useMemo3 } from "react";
import { MessageSquare } from "lucide-react";
import { isDistriMessage as isDistriMessage5 } from "@distri/core";

// src/components/AgentSelect.tsx
import { Bot as Bot2 } from "lucide-react";

// src/components/ui/select.tsx
import * as React12 from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check as Check2, ChevronDown as ChevronDown2, ChevronUp } from "lucide-react";
import { jsx as jsx13, jsxs as jsxs7 } from "react/jsx-runtime";
var Select = SelectPrimitive.Root;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React12.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs7(
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
      /* @__PURE__ */ jsx13(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx13(ChevronDown2, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx13(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx13(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx13(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx13(ChevronDown2, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React12.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx13(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs7(
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
      /* @__PURE__ */ jsx13(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx13(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx13(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx13(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React12.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs7(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx13("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx13(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx13(Check2, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx13(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx13(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// src/components/AgentSelect.tsx
import { jsx as jsx14, jsxs as jsxs8 } from "react/jsx-runtime";
var AgentSelect = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  className = "",
  placeholder = "Select an agent...",
  disabled = false
}) => {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  return /* @__PURE__ */ jsxs8(Select, { value: selectedAgentId, onValueChange: onAgentSelect, disabled, children: [
    /* @__PURE__ */ jsx14(SelectTrigger, { className: `w-full ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, children: /* @__PURE__ */ jsxs8("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx14(Bot2, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx14(SelectValue, { placeholder, children: selectedAgent?.name || placeholder })
    ] }) }),
    /* @__PURE__ */ jsx14(SelectContent, { children: agents.map((agent) => /* @__PURE__ */ jsx14(SelectItem, { value: agent.id, children: /* @__PURE__ */ jsxs8("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx14(Bot2, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs8("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx14("span", { className: "font-medium", children: agent.name }),
        agent.description && /* @__PURE__ */ jsx14("span", { className: "text-xs text-muted-foreground", children: agent.description })
      ] })
    ] }) }, agent.id)) })
  ] });
};

// src/components/ui/sonner.tsx
import { useTheme as useTheme2 } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { jsx as jsx15 } from "react/jsx-runtime";
var Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme2();
  return /* @__PURE__ */ jsx15(
    Sonner,
    {
      theme,
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};

// src/components/FullChat.tsx
import { jsx as jsx16, jsxs as jsxs9 } from "react/jsx-runtime";
var FullChat = ({
  agent,
  threadId,
  className = "",
  style = {},
  getMetadata,
  tools,
  availableAgents = [],
  UserMessageComponent = UserMessage,
  AssistantMessageComponent = AssistantMessage,
  AssistantWithToolCallsComponent = AssistantWithToolCalls,
  PlanMessageComponent = PlanMessage,
  theme = "dark",
  showDebug = false,
  showAgentSelector = true,
  placeholder = "Type your message...",
  disableAgentSelection = false,
  onAgentSelect,
  onResponse: _onResponse,
  onMessagesUpdate
}) => {
  const [input, setInput] = useState12("");
  const messagesEndRef = useRef6(null);
  const {
    messages,
    executionEvents,
    isLoading,
    isStreaming,
    error,
    sendMessage: sendChatMessage,
    toolCallStates,
    stopStreaming
  } = useChat({
    threadId,
    agent: agent || void 0,
    tools,
    getMetadata,
    onMessagesUpdate
  });
  useEffect10(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  const sendMessage = async () => {
    if (!input.trim() || isLoading)
      return;
    const messageText = input.trim();
    setInput("");
    try {
      await sendChatMessage(messageText);
    } catch (err) {
      console.error("Failed to send message:", err);
      setInput(messageText);
    }
  };
  const getMessageType = (message) => {
    if (message.parts.some((part) => part.type === "tool_call")) {
      return "assistant_with_tools";
    }
    if (message.parts.some((part) => part.type === "plan")) {
      return "plan";
    }
    return message.role;
  };
  const renderedMessages = useMemo3(() => {
    return messages.filter((msg) => shouldDisplayMessage(msg, showDebug)).map((message, index) => {
      const messageContent = extractTextFromMessage(message);
      const key = `message-${index}`;
      const timestamp = message.created_at ? new Date(message.created_at) : void 0;
      if (isDistriMessage5(message)) {
        switch (getMessageType(message)) {
          case "user":
            return /* @__PURE__ */ jsx16(
              UserMessageComponent,
              {
                message,
                timestamp
              },
              key
            );
          case "assistant":
            return /* @__PURE__ */ jsx16(
              AssistantMessageComponent,
              {
                name: agent?.name,
                avatar: agent?.iconUrl ? /* @__PURE__ */ jsx16("img", { src: agent.iconUrl, alt: agent.name, className: "w-6 h-6 rounded-full" }) : /* @__PURE__ */ jsx16("div", { className: "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs", children: agent?.name?.charAt(0).toUpperCase() || "A" }),
                message,
                timestamp,
                isStreaming: isStreaming && index === messages.length - 1
              },
              key
            );
          case "assistant_with_tools":
            const states = (message.parts || []).filter((part) => part.tool_call).map((part) => {
              const toolCallState = toolCallStates.get(part.tool_call.tool_call_id);
              return toolCallState;
            }).filter(Boolean);
            return /* @__PURE__ */ jsx16(
              AssistantWithToolCallsComponent,
              {
                message,
                toolCallStates: states,
                timestamp,
                isStreaming: isStreaming && index === messages.length - 1
              },
              key
            );
          case "plan":
            return /* @__PURE__ */ jsx16(
              PlanMessageComponent,
              {
                message,
                plan: messageContent,
                timestamp
              },
              key
            );
          case "debug":
            return /* @__PURE__ */ jsx16(
              DebugMessage,
              {
                message,
                timestamp
              },
              key
            );
          default:
            return null;
        }
      } else {
        return null;
      }
    }).filter(Boolean);
  }, [
    messages,
    showDebug,
    UserMessageComponent,
    AssistantMessageComponent,
    AssistantWithToolCallsComponent,
    PlanMessageComponent,
    toolCallStates,
    isStreaming
  ]);
  return /* @__PURE__ */ jsxs9(
    "div",
    {
      className: `distri-chat ${className} ${theme === "dark" ? "dark" : "light"} w-full bg-background text-foreground flex flex-col relative`,
      style: {
        ...style
      },
      children: [
        /* @__PURE__ */ jsx16("div", { className: "pt-6 px-6 bg-background flex-shrink-0 z-10", children: showAgentSelector && availableAgents && availableAgents.length > 0 && /* @__PURE__ */ jsx16("div", { className: "mb-6", children: /* @__PURE__ */ jsx16(
          AgentSelect,
          {
            agents: availableAgents,
            selectedAgentId: agent?.id,
            onAgentSelect: (agentId) => onAgentSelect?.(agentId),
            className: "w-full",
            disabled: disableAgentSelection || messages.length > 0
          }
        ) }) }),
        /* @__PURE__ */ jsx16(Toaster, {}),
        /* @__PURE__ */ jsx16("div", { className: "flex-1 relative min-h-0", children: /* @__PURE__ */ jsxs9("div", { className: "absolute inset-0 flex flex-col", children: [
          /* @__PURE__ */ jsx16("div", { className: "flex-1 overflow-y-auto distri-scroll bg-background", children: /* @__PURE__ */ jsxs9("div", { className: "mx-auto", style: { maxWidth: "var(--thread-content-max-width)" }, children: [
            messages.length === 0 ? /* @__PURE__ */ jsx16("div", { className: "h-full flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsxs9("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx16(MessageSquare, { className: "h-16 w-16 text-muted-foreground mx-auto mb-4" }),
              /* @__PURE__ */ jsx16("h3", { className: "text-lg font-medium text-foreground mb-2", children: "Start a conversation" }),
              /* @__PURE__ */ jsx16("p", { className: "text-muted-foreground max-w-sm", children: placeholder || "Type your message below to begin chatting." })
            ] }) }) : /* @__PURE__ */ jsxs9("div", { className: "space-y-0 pt-4", children: [
              renderedMessages,
              executionEvents.length > 0 && /* @__PURE__ */ jsx16("div", { className: "px-6 py-4", children: /* @__PURE__ */ jsx16(
                ExecutionTracker,
                {
                  events: executionEvents
                }
              ) })
            ] }),
            isLoading && /* @__PURE__ */ jsxs9("div", { className: "px-6 py-4 flex items-center space-x-2 bg-muted rounded-lg mt-4", children: [
              /* @__PURE__ */ jsx16("div", { className: "h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" }),
              /* @__PURE__ */ jsx16("span", { className: "text-muted-foreground text-sm", children: "Thinking..." })
            ] }),
            error && /* @__PURE__ */ jsx16("div", { className: "px-6 py-4 bg-destructive/20 border border-destructive/20 rounded-lg mt-4", children: /* @__PURE__ */ jsxs9("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx16("div", { className: "h-4 w-4 rounded-full bg-destructive" }),
              /* @__PURE__ */ jsx16("span", { className: "text-destructive text-sm", children: error.message || String(error) })
            ] }) }),
            /* @__PURE__ */ jsx16("div", { ref: messagesEndRef })
          ] }) }),
          /* @__PURE__ */ jsx16("div", { className: "absolute bottom-0 left-0 right-0 bg-background py-4", children: /* @__PURE__ */ jsx16("div", { className: "mx-auto", style: { maxWidth: "var(--thread-content-max-width)" }, children: /* @__PURE__ */ jsx16(
            ChatInput,
            {
              value: input,
              onChange: setInput,
              onSend: sendMessage,
              onStop: stopStreaming,
              placeholder,
              disabled: isLoading,
              isStreaming,
              className: "w-full"
            }
          ) }) })
        ] }) }),
        /* @__PURE__ */ jsx16(Toaster, {})
      ]
    }
  );
};

// src/components/ThemeToggle.tsx
import React14 from "react";
import { Moon, Sun } from "lucide-react";
import { jsx as jsx17, jsxs as jsxs10 } from "react/jsx-runtime";
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dropdownRef = React14.useRef(null);
  return /* @__PURE__ */ jsx17("div", { className: "relative", ref: dropdownRef, children: /* @__PURE__ */ jsxs10(
    "button",
    {
      onClick: () => setTheme(theme === "light" ? "dark" : "light"),
      className: "flex items-center justify-center w-9 h-9 rounded-md border bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
      children: [
        /* @__PURE__ */ jsx17(Sun, { className: "h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" }),
        /* @__PURE__ */ jsx17(Moon, { className: "absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" }),
        /* @__PURE__ */ jsx17("span", { className: "sr-only", children: "Toggle theme" })
      ]
    }
  ) });
}
export {
  AgentSelect,
  ApprovalToolCall,
  AssistantMessage,
  AssistantWithToolCalls,
  ChatInput,
  DebugMessage,
  DistriProvider,
  EmbeddableChat,
  ExecutionSteps,
  ExecutionTracker,
  FullChat,
  PlanMessage,
  ThemeProvider,
  ThemeToggle,
  ToastToolCall,
  UserMessage,
  extractTextFromMessage,
  registerTools,
  shouldDisplayMessage,
  useAgent,
  useAgents,
  useChat,
  useTheme,
  useThreads,
  useToolCallState
};
