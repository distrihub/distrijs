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
  AgentList: () => AgentList_default,
  AgentSelect: () => AgentSelect,
  AgentsPage: () => AgentsPage_default,
  ApprovalToolCall: () => ApprovalToolCall,
  ArtifactRenderer: () => ArtifactRenderer,
  AssistantMessageRenderer: () => AssistantMessageRenderer,
  Badge: () => Badge,
  Button: () => Button,
  Card: () => Card,
  CardContent: () => CardContent,
  CardDescription: () => CardDescription,
  CardFooter: () => CardFooter,
  CardHeader: () => CardHeader,
  CardTitle: () => CardTitle,
  Chat: () => Chat,
  DebugRenderer: () => DebugRenderer,
  Dialog: () => DialogRoot,
  DialogContent: () => DialogContent,
  DialogHeader: () => DialogHeader,
  DialogTitle: () => DialogTitle,
  DialogTrigger: () => DialogTrigger,
  DistriProvider: () => DistriProvider,
  ExecutionSteps: () => ExecutionSteps,
  Input: () => Input,
  PlanRenderer: () => PlanRenderer,
  Select: () => Select,
  SelectContent: () => SelectContent,
  SelectGroup: () => SelectGroup,
  SelectItem: () => SelectItem,
  SelectLabel: () => SelectLabel,
  SelectScrollDownButton: () => SelectScrollDownButton,
  SelectScrollUpButton: () => SelectScrollUpButton,
  SelectSeparator: () => SelectSeparator,
  SelectTrigger: () => SelectTrigger,
  SelectValue: () => SelectValue,
  Separator: () => Separator2,
  Sheet: () => Sheet,
  SheetContent: () => SheetContent,
  SheetDescription: () => SheetDescription,
  SheetFooter: () => SheetFooter,
  SheetHeader: () => SheetHeader,
  SheetTitle: () => SheetTitle,
  Sidebar: () => Sidebar,
  SidebarContent: () => SidebarContent,
  SidebarFooter: () => SidebarFooter,
  SidebarGroup: () => SidebarGroup,
  SidebarGroupAction: () => SidebarGroupAction,
  SidebarGroupContent: () => SidebarGroupContent,
  SidebarGroupLabel: () => SidebarGroupLabel,
  SidebarHeader: () => SidebarHeader,
  SidebarInset: () => SidebarInset,
  SidebarMenu: () => SidebarMenu,
  SidebarMenuAction: () => SidebarMenuAction,
  SidebarMenuBadge: () => SidebarMenuBadge,
  SidebarMenuButton: () => SidebarMenuButton,
  SidebarMenuItem: () => SidebarMenuItem,
  SidebarMenuSkeleton: () => SidebarMenuSkeleton,
  SidebarMenuSub: () => SidebarMenuSub,
  SidebarMenuSubButton: () => SidebarMenuSubButton,
  SidebarMenuSubItem: () => SidebarMenuSubItem,
  SidebarProvider: () => SidebarProvider,
  SidebarRail: () => SidebarRail,
  SidebarSeparator: () => SidebarSeparator,
  SidebarTrigger: () => SidebarTrigger,
  Skeleton: () => Skeleton,
  TaskExecutionRenderer: () => TaskExecutionRenderer,
  Textarea: () => Textarea,
  ThemeProvider: () => ThemeProvider,
  ThemeToggle: () => ThemeToggle,
  ThinkingRenderer: () => ThinkingRenderer,
  ToastToolCall: () => ToastToolCall,
  ToolCallRenderer: () => ToolCallRenderer,
  ToolMessageRenderer: () => ToolMessageRenderer,
  Tooltip: () => Tooltip,
  TooltipContent: () => TooltipContent,
  TooltipProvider: () => TooltipProvider,
  TooltipTrigger: () => TooltipTrigger,
  UserMessageRenderer: () => UserMessageRenderer,
  extractTextFromMessage: () => extractTextFromMessage,
  shouldDisplayMessage: () => shouldDisplayMessage,
  useAgent: () => useAgent,
  useAgentDefinitions: () => useAgentDefinitions,
  useChat: () => useChat,
  useChatConfig: () => useChatConfig,
  useChatStateStore: () => useChatStateStore,
  useSidebar: () => useSidebar,
  useTheme: () => useTheme,
  useThreads: () => useThreads
});
module.exports = __toCommonJS(index_exports);

// src/components/Chat.tsx
var import_react7 = require("react");

// src/components/ChatInput.tsx
var import_react = require("react");
var import_lucide_react = require("lucide-react");
var import_jsx_runtime = require("react/jsx-runtime");
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
  const textareaRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `relative flex min-h-14 w-full items-end ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "relative flex w-full flex-auto flex-col", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "relative mx-5 flex min-h-14 flex-auto rounded-lg border border-input bg-input items-start h-full", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute right-2 bottom-0 flex items-center h-full", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        onClick: isStreaming ? handleStop : handleSend,
        disabled: !hasContent && !isStreaming,
        className: `h-10 w-10 rounded-md transition-colors flex items-center justify-center ${isStreaming ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : hasContent && !disabled ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted"}`,
        children: isStreaming ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Square, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Send, { className: "h-5 w-5" })
      }
    ) })
  ] }) }) });
};

// src/useChat.ts
var import_react5 = require("react");
var import_core2 = require("@distri/core");
var import_core3 = require("@distri/core");

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
        type: "step_started",
        data: {
          step_id: metadata.step_id,
          step_title: metadata.step_title || "Processing",
          step_index: metadata.step_index || 0
        }
      };
    case "step_completed":
      return {
        type: "step_completed",
        data: {
          step_id: metadata.step_id,
          step_title: metadata.step_title || "Processing",
          step_index: metadata.step_index || 0
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
function isDistriEvent(event) {
  return "type" in event && "data" in event;
}
function isDistriArtifact(event) {
  return "type" in event && "timestamp" in event && "id" in event;
}

// src/hooks/registerTools.tsx
var import_react4 = require("react");

// src/components/toolcalls/ApprovalToolCall.tsx
var import_react2 = require("react");

// src/components/ui/button.tsx
var React2 = __toESM(require("react"), 1);

// src/lib/utils.ts
var import_clsx = require("clsx");
var import_tailwind_merge = require("tailwind-merge");
function cn(...inputs) {
  return (0, import_tailwind_merge.twMerge)((0, import_clsx.clsx)(inputs));
}

// src/components/ui/button.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
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
var Button = React2.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
var import_lucide_react2 = require("lucide-react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var ApprovalToolCall = ({
  toolCall,
  completeTool
}) => {
  const [isProcessing, setIsProcessing] = (0, import_react2.useState)(false);
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
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "border rounded-lg p-4 bg-muted/50", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [
        result.approved ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.CheckCircle, { className: "h-4 w-4 text-green-600" }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.XCircle, { className: "h-4 w-4 text-red-600" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "font-medium", children: [
          "Approval ",
          result.approved ? "Granted" : "Denied"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-sm text-muted-foreground", children: reason })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "border rounded-lg p-4 bg-background", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.AlertTriangle, { className: "h-4 w-4 text-amber-500" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "font-medium", children: "Approval Required" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-sm mb-4", children: reason }),
    toolCallsToApprove.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mb-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-xs text-muted-foreground mb-2", children: "Tool calls requiring approval:" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "space-y-1", children: toolCallsToApprove.map((tc, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "text-xs bg-muted p-2 rounded", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "font-mono", children: tc.tool_name }) }, index)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        Button,
        {
          size: "sm",
          variant: "destructive",
          onClick: () => handleResponse(false),
          disabled: isProcessing,
          children: "Deny"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
var import_react3 = require("react");
var import_sonner = require("sonner");
var import_jsx_runtime4 = require("react/jsx-runtime");
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
  (0, import_react3.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, {});
};

// src/hooks/registerTools.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
function registerTools({ agent, tools }) {
  const lastAgentIdRef = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
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
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ToastToolCall, { ...props });
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
var import_core = require("@distri/core");
var useChatStateStore = (0, import_zustand.create)((set, get) => ({
  messages: [],
  isStreaming: false,
  isLoading: false,
  error: null,
  tasks: /* @__PURE__ */ new Map(),
  plans: /* @__PURE__ */ new Map(),
  steps: /* @__PURE__ */ new Map(),
  toolCalls: /* @__PURE__ */ new Map(),
  currentTaskId: void 0,
  currentPlanId: void 0,
  streamingIndicator: void 0,
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
  setStreamingIndicator: (indicator) => {
    set({ streamingIndicator: indicator });
  },
  appendToMessage: (messageId, role, delta) => {
    set((state) => {
      const newState = { ...state };
      const index = newState.messages.findIndex(
        (m) => (0, import_core.isDistriMessage)(m) && m.id === messageId
      );
      if (index >= 0) {
        const existing = newState.messages[index];
        let textPart = existing.parts.find((p) => p.type === "text");
        if (!textPart) {
          textPart = { type: "text", text: "" };
          existing.parts.push(textPart);
        }
        textPart.text += delta;
      } else {
        const newMessage = {
          id: messageId,
          role,
          parts: delta ? [{ type: "text", text: delta }] : []
        };
        newState.messages.push(newMessage);
      }
      return newState;
    });
  },
  // State actions
  processMessage: (message) => {
    const timestamp = Date.now();
    if ((0, import_core.isDistriEvent)(message)) {
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
          get().setStreamingIndicator("agent_starting");
          break;
        case "run_finished":
          const currentTaskId = get().currentTaskId;
          if (currentTaskId) {
            get().updateTask(currentTaskId, {
              status: "completed",
              endTime: timestamp
            });
          }
          get().setStreamingIndicator(void 0);
          set({ isLoading: false });
          break;
        case "run_error":
          const errorTaskId = get().currentTaskId;
          if (errorTaskId) {
            get().updateTask(errorTaskId, {
              status: "failed",
              endTime: timestamp,
              error: message.data?.message || "Unknown error"
            });
          }
          get().setStreamingIndicator(void 0);
          set({ isLoading: false, isStreaming: false });
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
          get().setStreamingIndicator("planning");
          console.log("Set streamingIndicator to planning");
          set({ isStreaming: false });
          break;
        case "plan_finished":
          const currentPlanId = get().currentPlanId;
          if (currentPlanId) {
            get().updatePlan(currentPlanId, {
              status: "completed",
              endTime: timestamp
            });
          }
          get().setStreamingIndicator(void 0);
          set({ isLoading: false });
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
          set({ isStreaming: false });
          break;
        case "tool_call_end":
          const finishedTaskId = message.data.tool_call_id;
          if (finishedTaskId) {
            get().updateTask(finishedTaskId, {
              status: "completed",
              endTime: timestamp
            });
          }
          const pendingToolCalls = get().getPendingToolCalls();
          if (pendingToolCalls.length === 0) {
            set({ isLoading: false });
          }
          break;
        case "text_message_start":
          get().appendToMessage(message.data.message_id, message.data.role, "");
          set({ isStreaming: true });
          break;
        case "text_message_content":
          get().appendToMessage(message.data.message_id, "assistant", message.data.delta);
          get().setStreamingIndicator(void 0);
          break;
        case "text_message_end":
          set({ isStreaming: false });
          break;
        case "step_started":
          const stepId = message.data.step_id;
          get().updateStep(stepId, {
            id: stepId,
            title: message.data.step_title,
            index: message.data.step_index,
            status: "running",
            startTime: timestamp
          });
          break;
        case "step_completed":
          const completedStepId = message.data.step_id;
          get().updateStep(completedStepId, {
            status: "completed",
            endTime: timestamp
          });
          break;
        case "agent_handover":
          break;
        default:
          break;
      }
    }
    if ((0, import_core.isDistriArtifact)(message)) {
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
          set({ isStreaming: false });
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
          const pendingToolCalls = get().getPendingToolCalls();
          if (pendingToolCalls.length === 0) {
            set({ isLoading: false });
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
      steps: /* @__PURE__ */ new Map(),
      toolCalls: /* @__PURE__ */ new Map(),
      currentTaskId: void 0,
      currentPlanId: void 0,
      streamingIndicator: void 0
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
    const task = state.tasks.get(state.currentTaskId);
    return task || null;
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
      const taskToUpdate = existingTask || { id: taskId };
      newState.tasks.set(taskId, { ...taskToUpdate, ...updates });
      return newState;
    });
  },
  updatePlan: (planId, updates) => {
    set((state) => {
      const newState = { ...state };
      const existingPlan = newState.plans.get(planId) || { id: planId, steps: [], status: "pending" };
      newState.plans.set(planId, { ...existingPlan, ...updates });
      return newState;
    });
  },
  updateStep: (stepId, updates) => {
    set((state) => {
      const newState = { ...state };
      const existingStep = newState.steps.get(stepId);
      if (existingStep) {
        newState.steps.set(stepId, { ...existingStep, ...updates });
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
  tools,
  overrideChatState,
  messageFilter
}) {
  const abortControllerRef = (0, import_react5.useRef)(null);
  const createInvokeContext = (0, import_react5.useCallback)(() => ({
    thread_id: threadId,
    run_id: void 0,
    getMetadata
  }), [threadId, getMetadata]);
  registerTools({ agent, tools });
  const chatState = overrideChatState || useChatStateStore.getState();
  (0, import_react5.useEffect)(() => {
    if (agent) {
      chatState.setAgent(agent);
    }
    if (tools) {
      chatState.setTools(tools);
    }
  }, [agent, tools, chatState]);
  (0, import_react5.useEffect)(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  const agentIdRef = (0, import_react5.useRef)(void 0);
  const messageFilterRef = (0, import_react5.useRef)(void 0);
  const allMessagesRef = (0, import_react5.useRef)([]);
  const reapplyFilter = (0, import_react5.useCallback)(() => {
    const filteredMessages = allMessagesRef.current.filter(messageFilter || (() => true));
    chatState.clearMessages();
    chatState.clearAllStates();
    chatState.setError(null);
    filteredMessages.forEach((message) => {
      chatState.addMessage(message);
      chatState.processMessage(message);
    });
  }, [chatState, messageFilter]);
  (0, import_react5.useEffect)(() => {
    if (agent?.id !== agentIdRef.current) {
      allMessagesRef.current = [];
      chatState.clearMessages();
      chatState.clearAllStates();
      chatState.setError(null);
      agentIdRef.current = agent?.id;
    }
    if (messageFilter !== messageFilterRef.current) {
      messageFilterRef.current = messageFilter;
      reapplyFilter();
    }
  }, [agent?.id, chatState, messageFilter, reapplyFilter]);
  const addMessages = (0, import_react5.useCallback)((messages) => {
    allMessagesRef.current = [...allMessagesRef.current, ...messages];
    const filteredMessages = messages.filter(messageFilter || (() => true));
    filteredMessages.forEach((message) => {
      chatState.addMessage(message);
      chatState.processMessage(message);
    });
  }, [chatState, messageFilter]);
  const fetchMessages = (0, import_react5.useCallback)(async () => {
    if (!agent) return;
    try {
      chatState.setLoading(true);
      const a2aMessages = await agent.getThreadMessages(threadId);
      const distriMessages = a2aMessages.map(decodeA2AStreamEvent).filter(Boolean);
      allMessagesRef.current = distriMessages;
      chatState.clearMessages();
      addMessages(distriMessages);
      onMessagesUpdate?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch messages");
      chatState.setError(error);
      onError?.(error);
    } finally {
      chatState.setLoading(false);
    }
  }, [threadId, agent?.id, onError, onMessagesUpdate, chatState, addMessages]);
  (0, import_react5.useEffect)(() => {
    if (threadId) {
      fetchMessages();
    }
  }, [threadId, agent?.id]);
  const handleStreamEvent = (0, import_react5.useCallback)((event) => {
    allMessagesRef.current = [...allMessagesRef.current, event];
    if (!messageFilter || messageFilter(event, allMessagesRef.current.length - 1)) {
      if (isDistriEvent(event) && (event.type === "text_message_start" || event.type === "text_message_content" || event.type === "text_message_end")) {
        chatState.processMessage(event);
      } else {
        chatState.addMessage(event);
        chatState.processMessage(event);
      }
    }
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
  }, [onMessage, agent, chatState, messageFilter]);
  const sendMessage = (0, import_react5.useCallback)(async (content) => {
    if (!agent) return;
    chatState.setLoading(true);
    chatState.setStreaming(true);
    chatState.setError(null);
    chatState.setStreamingIndicator(void 0);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      const parts = typeof content === "string" ? [{ type: "text", text: content }] : content;
      const distriMessage = import_core2.DistriClient.initDistriMessage("user", parts);
      const context = createInvokeContext();
      const a2aMessage = (0, import_core3.convertDistriMessageToA2A)(distriMessage, context);
      allMessagesRef.current = [...allMessagesRef.current, distriMessage];
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
  const sendMessageStream = (0, import_react5.useCallback)(async (content, role = "user") => {
    if (!agent) return;
    chatState.setLoading(true);
    chatState.setStreaming(true);
    chatState.setError(null);
    chatState.setStreamingIndicator(void 0);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      const parts = typeof content === "string" ? [{ type: "text", text: content }] : content;
      const distriMessage = import_core2.DistriClient.initDistriMessage(role, parts);
      const context = createInvokeContext();
      const a2aMessage = (0, import_core3.convertDistriMessageToA2A)(distriMessage, context);
      allMessagesRef.current = [...allMessagesRef.current, distriMessage];
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
      if (!chatState.hasPendingToolCalls()) {
        chatState.setLoading(false);
      }
      chatState.setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, onError, threadId]);
  const handleExternalToolResponses = (0, import_react5.useCallback)(async () => {
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
  (0, import_react5.useEffect)(() => {
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
  const stopStreaming = (0, import_react5.useCallback)(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  const clearMessages = (0, import_react5.useCallback)(() => {
    allMessagesRef.current = [];
    chatState.clearMessages();
    chatState.setStreamingIndicator(void 0);
  }, [chatState]);
  return {
    messages: allMessagesRef.current,
    isStreaming: chatState.isStreaming,
    sendMessage,
    sendMessageStream,
    isLoading: chatState.isLoading,
    error: chatState.error,
    clearMessages,
    agent: agent || void 0,
    hasPendingToolCalls: chatState.hasPendingToolCalls,
    stopStreaming
  };
}

// src/components/renderers/MessageRenderer.tsx
var import_core4 = require("@distri/core");

// src/components/renderers/UserMessageRenderer.tsx
var import_lucide_react3 = require("lucide-react");

// src/components/ui/avatar.tsx
var React5 = __toESM(require("react"), 1);
var AvatarPrimitive = __toESM(require("@radix-ui/react-avatar"), 1);
var import_jsx_runtime6 = require("react/jsx-runtime");
var Avatar = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
  AvatarPrimitive.Root,
  {
    ref,
    className: cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    ),
    ...props
  }
));
Avatar.displayName = AvatarPrimitive.Root.displayName;
var AvatarImage = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
  AvatarPrimitive.Image,
  {
    ref,
    className: cn("aspect-square h-full w-full", className),
    ...props
  }
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;
var AvatarFallback = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
  AvatarPrimitive.Fallback,
  {
    ref,
    className: cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    ),
    ...props
  }
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// src/components/renderers/utils.ts
var import_react6 = __toESM(require("react"), 1);
function extractContent(message) {
  let text = "";
  let hasMarkdown = false;
  let hasCode = false;
  let hasLinks = false;
  let hasImages = false;
  if ("parts" in message && Array.isArray(message.parts)) {
    const distriMessage = message;
    text = distriMessage.parts?.filter((p) => p.type === "text")?.map((p) => p.text)?.join("") || "";
    hasMarkdown = /[*_`#\[\]()>]/.test(text);
    hasCode = /```|`/.test(text);
    hasLinks = /\[.*?\]\(.*?\)|https?:\/\/[^\s]+/.test(text);
    hasImages = /!\[.*?\]\(.*?\)/.test(text);
  } else if ("type" in message) {
    const artifact = message;
    if (artifact.type === "plan") {
      text = JSON.stringify(artifact, null, 2);
    } else {
      text = JSON.stringify(artifact, null, 2);
    }
  } else {
    text = JSON.stringify(message, null, 2);
  }
  return {
    text,
    hasMarkdown,
    hasCode,
    hasLinks,
    hasImages,
    rawContent: message
  };
}
function renderTextContent(content) {
  const { text, hasMarkdown, hasCode, hasLinks, hasImages } = content;
  if (!text) return null;
  if (hasMarkdown || hasCode || hasLinks || hasImages) {
    return import_react6.default.createElement("pre", { className: "whitespace-pre-wrap text-sm" }, text);
  }
  return import_react6.default.createElement("p", { className: "text-sm leading-relaxed" }, text);
}

// src/components/renderers/UserMessageRenderer.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var UserMessageRenderer = ({
  message,
  chatState: _chatState,
  className = "",
  avatar
}) => {
  const content = extractContent(message);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: `flex items-start items-centergap-4 py-6 ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Avatar, { className: "h-8 w-8 flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AvatarFallback, { className: "bg-secondary text-secondary-foreground", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react3.User, { className: "h-4 w-4" }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "flex-1 min-w-0 max-w-3xl", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: renderTextContent(content) }) })
  ] });
};

// src/components/renderers/AssistantMessageRenderer.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var AssistantMessageRenderer = ({
  message,
  chatState,
  className = ""
}) => {
  const content = extractContent(message);
  const isStreaming = chatState?.isStreaming || false;
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: `flex items-start gap-4 py-6 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex-1 min-w-0 max-w-3xl", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "text-sm font-medium text-foreground mb-3 flex items-center gap-2", children: isStreaming && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150" })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: renderTextContent(content) })
  ] }) });
};

// src/components/renderers/ToolMessageRenderer.tsx
var import_lucide_react4 = require("lucide-react");
var import_jsx_runtime9 = require("react/jsx-runtime");
var ToolMessageRenderer = ({
  message,
  chatState: _chatState,
  className = "",
  avatar
}) => {
  const content = extractContent(message);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: `flex items-start gap-4 py-6 ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Avatar, { className: "h-8 w-8 flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(AvatarFallback, { className: "bg-accent text-accent-foreground", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react4.Wrench, { className: "h-4 w-4" }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex-1 min-w-0 max-w-3xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "text-sm font-medium text-foreground mb-3", children: "Tool Response" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: renderTextContent(content) })
    ] })
  ] });
};

// src/components/renderers/PlanRenderer.tsx
var import_lucide_react5 = require("lucide-react");
var import_jsx_runtime10 = require("react/jsx-runtime");
var PlanRenderer = ({
  message,
  chatState: _chatState,
  className = "",
  avatar
}) => {
  const content = extractContent(message);
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: `flex items-start gap-4 py-6 ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Avatar, { className: "h-8 w-8 flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(AvatarFallback, { className: "bg-primary/10 text-primary", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react5.Brain, { className: "h-4 w-4" }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex-1 min-w-0 max-w-3xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "text-sm font-medium text-foreground mb-3", children: "Plan" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: renderTextContent(content) })
    ] })
  ] });
};

// src/components/renderers/StepRenderer.tsx
var import_lucide_react6 = require("lucide-react");
var import_jsx_runtime11 = require("react/jsx-runtime");
var StepRenderer = ({
  step,
  className = ""
}) => {
  const getStatusIcon = () => {
    switch (step.status) {
      case "running":
        return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_lucide_react6.Loader2, { className: "h-4 w-4 text-primary animate-spin" });
      case "completed":
        return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_lucide_react6.CheckCircle, { className: "h-4 w-4 text-primary" });
      case "failed":
        return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "h-4 w-4 text-destructive", children: "\u2717" });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_lucide_react6.Loader2, { className: "h-4 w-4 text-muted-foreground animate-spin" });
    }
  };
  const getStatusText = () => {
    switch (step.status) {
      case "running":
        return "Running...";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: `py-6 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "max-w-3xl mx-auto p-4 bg-muted/50 rounded-lg border", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "flex items-center gap-3", children: [
    getStatusIcon(),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "text-sm font-medium text-foreground", children: [
        "Step ",
        step.index + 1,
        ": ",
        step.title
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "text-xs text-muted-foreground", children: getStatusText() })
    ] })
  ] }) }) }) });
};

// src/components/renderers/ToolCallRenderer.tsx
var import_lucide_react7 = require("lucide-react");
var import_jsx_runtime12 = require("react/jsx-runtime");
var ToolCallRenderer = ({
  toolCall,
  chatState: _chatState,
  isExpanded,
  onToggle,
  className = ""
}) => {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case "pending":
        return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_lucide_react7.Clock, { className: "h-3 w-3 text-muted-foreground" });
      case "running":
        return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_lucide_react7.Loader2, { className: "h-3 w-3 text-primary animate-spin" });
      case "completed":
        return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_lucide_react7.CheckCircle, { className: "h-3 w-3 text-primary" });
      case "error":
        return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_lucide_react7.XCircle, { className: "h-3 w-3 text-destructive" });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_lucide_react7.Clock, { className: "h-3 w-3 text-muted-foreground" });
    }
  };
  const getStatusText = () => {
    switch (toolCall.status) {
      case "pending":
        return "Pending";
      case "running":
        return "Running";
      case "completed":
        return "Completed";
      case "error":
        return "Failed";
      default:
        return "Unknown";
    }
  };
  const canCollapse = toolCall.result !== void 0 || toolCall.error !== void 0 || toolCall.status === "completed" || toolCall.status === "error";
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: `flex items-start gap-4 py-6 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "flex-1 min-w-0 max-w-3xl", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "border rounded-lg bg-background overflow-hidden", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "p-3 border-b border-border", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
            "button",
            {
              onClick: onToggle,
              className: "p-1 hover:bg-muted rounded transition-colors",
              disabled: !canCollapse,
              children: canCollapse ? isExpanded ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_lucide_react7.ChevronDown, { className: "h-3 w-3 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_lucide_react7.ChevronRight, { className: "h-3 w-3 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "h-3 w-3" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_lucide_react7.Wrench, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "text-sm font-medium text-foreground", children: toolCall.tool_name })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center gap-2", children: [
          getStatusIcon(),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "text-xs text-muted-foreground", children: getStatusText() })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "mt-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "text-xs text-muted-foreground mb-1", children: "Input:" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "text-xs font-mono bg-muted p-2 rounded border", children: JSON.stringify(toolCall.input, null, 2) })
      ] }),
      toolCall.component && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "mt-3", children: toolCall.component })
    ] }),
    canCollapse && isExpanded && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "p-3 bg-muted/30", children: [
      toolCall.error && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "mb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "text-xs text-destructive font-medium mb-1", children: "Error:" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20", children: toolCall.error })
      ] }),
      toolCall.result && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "text-xs text-muted-foreground font-medium mb-1", children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "text-xs font-mono bg-background p-2 rounded border", children: JSON.stringify(toolCall.result, null, 2) })
      ] })
    ] })
  ] }) }) });
};

// src/components/ui/badge.tsx
var import_class_variance_authority = require("class-variance-authority");
var import_jsx_runtime13 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: cn(badgeVariants({ variant }), className), ...props });
}

// src/components/ui/card.tsx
var React7 = __toESM(require("react"), 1);
var import_jsx_runtime14 = require("react/jsx-runtime");
var Card = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
var CardHeader = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
var CardDescription = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
  "p",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";

// src/components/renderers/ToolResultRenderer.tsx
var import_lucide_react8 = require("lucide-react");
var import_jsx_runtime15 = require("react/jsx-runtime");
function ToolResultRenderer({
  toolCallId,
  toolName,
  result,
  success,
  error,
  onSendResponse,
  className = ""
}) {
  const getStatusIcon = () => {
    if (success) {
      return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react8.CheckCircle, { className: "w-4 h-4 text-primary" });
    } else {
      return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react8.XCircle, { className: "w-4 h-4 text-destructive" });
    }
  };
  const getStatusColor = () => {
    if (success) {
      return "bg-primary/10 text-primary";
    } else {
      return "bg-destructive/10 text-destructive";
    }
  };
  const handleSendResponse = () => {
    if (onSendResponse) {
      onSendResponse(toolCallId, result);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(Card, { className: `mb-4 ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(CardHeader, { className: "pb-3", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "flex items-center space-x-2", children: [
        getStatusIcon(),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(CardTitle, { className: "text-sm font-medium", children: toolName }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Badge, { variant: "secondary", className: getStatusColor(), children: success ? "Success" : "Failed" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "text-xs text-muted-foreground", children: [
        "ID: ",
        toolCallId
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(CardContent, { className: "pt-0 space-y-3", children: [
      result && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "text-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("strong", { children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-y-auto", children: typeof result === "string" ? result : JSON.stringify(result, null, 2) })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "text-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("strong", { children: "Error:" }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-destructive/10 p-2 rounded mt-1 text-destructive", children: error })
      ] }),
      onSendResponse && success && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "flex justify-end", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
        Button,
        {
          size: "sm",
          onClick: handleSendResponse,
          className: "flex items-center space-x-1",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react8.Send, { className: "w-3 h-3" }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: "Send Response" })
          ]
        }
      ) })
    ] })
  ] });
}

// src/components/renderers/DebugRenderer.tsx
var import_lucide_react9 = require("lucide-react");
var import_jsx_runtime16 = require("react/jsx-runtime");
var DebugRenderer = ({
  message,
  chatState: _chatState,
  className = "",
  avatar
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: `flex items-start gap-4 py-3 px-2 ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Avatar, { className: "h-8 w-8", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(AvatarFallback, { className: "bg-muted text-muted-foreground", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_lucide_react9.Bug, { className: "h-4 w-4" }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "text-sm font-medium text-foreground mb-2", children: "Debug" }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("pre", { className: "text-xs bg-muted p-2 rounded border overflow-auto", children: JSON.stringify(message, null, 2) }) })
    ] })
  ] });
};

// src/components/renderers/MessageRenderer.tsx
var import_jsx_runtime17 = require("react/jsx-runtime");
function MessageRenderer({
  message,
  index,
  chatState,
  isExpanded = false,
  onToggle = () => {
  }
}) {
  if ((0, import_core4.isDistriMessage)(message)) {
    const distriMessage = message;
    const textContent = distriMessage.parts.filter((part) => part.type === "text").map((part) => part.text).join("").trim();
    if (!textContent) {
      return null;
    }
  }
  if ((0, import_core4.isDistriMessage)(message)) {
    const distriMessage = message;
    switch (distriMessage.role) {
      case "user":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
          UserMessageRenderer,
          {
            message: distriMessage,
            chatState
          },
          `user-${index}`
        );
      case "assistant":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
          AssistantMessageRenderer,
          {
            message: distriMessage,
            chatState
          },
          `assistant-${index}`
        );
      case "tool":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
          ToolMessageRenderer,
          {
            message: distriMessage,
            chatState
          },
          `tool-${index}`
        );
      default:
        return null;
    }
  }
  if ((0, import_core4.isDistriEvent)(message)) {
    const event = message;
    switch (event.type) {
      case "run_started":
        return null;
      case "plan_started":
        return null;
      case "plan_finished":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "max-w-3xl mx-auto p-3 bg-primary/10 border border-primary/20 rounded", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "text-sm text-primary", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("strong", { children: "Plan ready:" }),
          " ",
          event.data?.total_steps || 0,
          " steps"
        ] }) }) }, `plan-finished-${index}`);
      case "plan_pruned":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "max-w-3xl mx-auto p-3 bg-muted rounded border", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "text-sm text-muted-foreground", children: [
          "Removed steps: ",
          event.data?.removed_steps || "0"
        ] }) }) }, `plan-pruned-${index}`);
      case "text_message_start":
        return null;
      case "text_message_content":
        return null;
      case "text_message_end":
        return null;
      case "step_started":
        const stepId = event.data.step_id;
        const step = chatState.steps.get(stepId);
        if (step) {
          return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
            StepRenderer,
            {
              step
            },
            `step-${stepId}`
          );
        }
        return null;
      case "step_completed":
        const completedStepId = event.data.step_id;
        const completedStep = chatState.steps.get(completedStepId);
        if (completedStep) {
          return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
            StepRenderer,
            {
              step: completedStep
            },
            `step-${completedStepId}`
          );
        }
        return null;
      case "tool_call_start":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "max-w-3xl mx-auto flex items-center space-x-2 p-2 bg-muted rounded", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-primary" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("span", { className: "text-sm", children: [
            "Calling tool: ",
            event.data?.tool_call_name || "unknown",
            " \u23F3"
          ] })
        ] }) }, `tool-call-start-${index}`);
      case "tool_call_end":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "max-w-3xl mx-auto flex items-center space-x-2 p-2 bg-muted rounded", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "text-primary", children: "\u2705" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "text-sm", children: "Tool complete" })
        ] }) }, `tool-call-end-${index}`);
      case "tool_call_result":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "max-w-3xl mx-auto p-3 bg-primary/10 border border-primary/20 rounded", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "text-sm text-primary", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("strong", { children: "Tool result:" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("pre", { className: "mt-1 text-xs overflow-x-auto", children: event.data?.result || "No result" })
        ] }) }) }, `tool-call-result-${index}`);
      case "tool_rejected":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "max-w-3xl mx-auto p-3 bg-destructive/10 border border-destructive/20 rounded", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "text-sm text-destructive", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("strong", { children: "Tool rejected:" }),
          " ",
          event.data?.reason || "Unknown reason"
        ] }) }) }, `tool-rejected-${index}`);
      case "agent_handover":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "max-w-3xl mx-auto p-3 bg-muted rounded border", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "text-sm text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("strong", { children: "Handover to:" }),
          " ",
          event.data?.to_agent || "unknown agent"
        ] }) }) }, `handover-${index}`);
      case "feedback_received":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "max-w-3xl mx-auto p-3 bg-muted rounded border", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "text-sm text-muted-foreground", children: [
          "You said: ",
          event.data?.feedback || ""
        ] }) }) }, `feedback-${index}`);
      case "run_finished":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "max-w-3xl mx-auto flex items-center space-x-2 p-2 bg-primary/10 rounded", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "text-primary", children: "\u2705" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "text-sm font-medium", children: "Done" })
        ] }) }, `run-finished-${index}`);
      case "run_error":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "max-w-3xl mx-auto p-3 bg-destructive/10 border border-destructive/20 rounded", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "text-sm text-destructive", children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("strong", { children: "Error:" }),
            " ",
            event.data?.message || "Unknown error occurred"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { className: "mt-2 text-xs text-destructive underline", children: "Retry" })
        ] }) }, `run-error-${index}`);
      default:
        if (process.env.NODE_ENV === "development") {
          return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
            DebugRenderer,
            {
              message: event,
              chatState
            },
            `event-${index}`
          );
        }
        return null;
    }
  }
  if ((0, import_core4.isDistriArtifact)(message)) {
    const artifact = message;
    switch (artifact.type) {
      case "plan":
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
          PlanRenderer,
          {
            message: artifact,
            chatState
          },
          `plan-${index}`
        );
      case "llm_response":
        if (artifact.tool_calls && Array.isArray(artifact.tool_calls)) {
          return artifact.tool_calls.map((toolCall, toolIndex) => {
            const toolCallState = chatState.getToolCallById(toolCall.tool_call_id);
            if (!toolCallState) return null;
            return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
              ToolCallRenderer,
              {
                toolCall: toolCallState,
                chatState,
                isExpanded,
                onToggle
              },
              `tool-call-${index}-${toolIndex}`
            );
          }).filter(Boolean);
        }
        return null;
      case "tool_results":
        if (artifact.results && Array.isArray(artifact.results)) {
          const toolResultsArtifact = artifact;
          return artifact.results.map((result, resultIndex) => {
            const success = result.success !== void 0 ? result.success : toolResultsArtifact.success ?? (result.status ? result.status === "completed" : true);
            const error = result.error !== void 0 ? result.error : toolResultsArtifact.success ? void 0 : toolResultsArtifact.reason;
            return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
              ToolResultRenderer,
              {
                toolCallId: result.tool_call_id,
                toolName: result.tool_name || "Unknown Tool",
                result: result.result,
                success,
                error
              },
              `tool-result-${index}-${resultIndex}`
            );
          });
        }
        return null;
      default:
        if (process.env.NODE_ENV === "development") {
          return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
            DebugRenderer,
            {
              message: artifact,
              chatState
            },
            `artifact-${index}`
          );
        }
        return null;
    }
  }
  return null;
}

// src/components/renderers/ThinkingRenderer.tsx
var import_lucide_react10 = require("lucide-react");
var import_jsx_runtime18 = require("react/jsx-runtime");
var ThinkingRenderer = ({
  indicator,
  className = "",
  name = "Assistant"
}) => {
  const getIconAndText = () => {
    switch (indicator) {
      case "agent_starting":
        return {
          icon: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react10.Loader2, { className: "h-4 w-4 text-muted-foreground animate-spin" }),
          text: null
        };
      case "planning":
        return {
          icon: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react10.Sparkles, { className: "h-4 w-4 text-primary" }),
          text: "Planning\u2026"
        };
      case "generating_response":
        return {
          icon: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react10.Loader2, { className: "h-4 w-4 text-primary animate-spin" }),
          text: null
        };
      default:
        return {
          icon: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react10.Brain, { className: "h-4 w-4 text-muted-foreground" }),
          text: "Thinking\u2026"
        };
    }
  };
  const { icon, text } = getIconAndText();
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: `flex items-start gap-4 py-6 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "flex-1 min-w-0 max-w-3xl", children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "text-sm font-medium text-foreground mb-3", children: name }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
      icon,
      text && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { children: text })
    ] })
  ] }) });
};

// src/components/Chat.tsx
var import_jsx_runtime19 = require("react/jsx-runtime");
function Chat({
  threadId,
  agent,
  onMessage,
  onError,
  getMetadata,
  onMessagesUpdate,
  tools,
  messageFilter,
  overrideChatState,
  theme = "auto"
}) {
  const [input, setInput] = (0, import_react7.useState)("");
  const [expandedTools, setExpandedTools] = (0, import_react7.useState)(/* @__PURE__ */ new Set());
  const messagesEndRef = (0, import_react7.useRef)(null);
  const {
    sendMessage,
    stopStreaming
  } = useChat({
    threadId,
    agent,
    onMessage,
    onError,
    getMetadata,
    onMessagesUpdate,
    messageFilter,
    tools,
    overrideChatState
  });
  const chatState = overrideChatState || useChatStateStore.getState();
  const messages = useChatStateStore((state) => state.messages);
  const isStreaming = useChatStateStore((state) => state.isStreaming);
  const isLoading = useChatStateStore((state) => state.isLoading);
  const error = useChatStateStore((state) => state.error);
  const toolCalls = useChatStateStore((state) => state.toolCalls);
  const currentPlanId = useChatStateStore((state) => state.currentPlanId);
  const plans = useChatStateStore((state) => state.plans);
  const hasPendingToolCalls = useChatStateStore((state) => state.hasPendingToolCalls);
  const streamingIndicator = useChatStateStore((state) => state.streamingIndicator);
  const currentPlan = currentPlanId ? plans.get(currentPlanId) || null : null;
  const pendingToolCalls = Array.from(toolCalls.values()).filter(
    (toolCall) => toolCall.status === "pending" || toolCall.status === "running"
  );
  const handleSendMessage = (0, import_react7.useCallback)(async (content) => {
    if (!content.trim()) return;
    setInput("");
    await sendMessage(content);
  }, [sendMessage]);
  const handleStopStreaming = (0, import_react7.useCallback)(() => {
    stopStreaming();
  }, [stopStreaming]);
  const toggleToolExpansion = (0, import_react7.useCallback)((toolId) => {
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
  (0, import_react7.useEffect)(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  (0, import_react7.useEffect)(() => {
    const newExpanded = new Set(expandedTools);
    let hasChanges = false;
    toolCalls.forEach((toolCall) => {
      if (toolCall.status === "running" || toolCall.status === "error" || toolCall.status === "user_action_required") {
        if (!newExpanded.has(toolCall.tool_call_id)) {
          newExpanded.add(toolCall.tool_call_id);
          hasChanges = true;
        }
      }
    });
    if (hasChanges) {
      setExpandedTools(newExpanded);
    }
  }, [toolCalls]);
  const getThemeClasses = () => {
    if (theme === "dark") return "dark";
    if (theme === "light") return "";
    return "";
  };
  const renderMessages = () => {
    const elements = [];
    messages.forEach((message, index) => {
      const renderedMessage = /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
        MessageRenderer,
        {
          message,
          index,
          chatState,
          isExpanded: expandedTools.has(message.id || `message-${index}`),
          onToggle: () => {
            const messageId = message.id || `message-${index}`;
            toggleToolExpansion(messageId);
          }
        },
        `message-${index}`
      );
      if (renderedMessage !== null) {
        elements.push(renderedMessage);
      }
    });
    return elements;
  };
  const renderThinkingIndicator = () => {
    if (streamingIndicator) {
      console.log("Rendering thinking indicator:", streamingIndicator);
      return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
        ThinkingRenderer,
        {
          indicator: streamingIndicator
        },
        `thinking-${streamingIndicator}`
      );
    }
    return null;
  };
  return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: `flex flex-col h-full ${getThemeClasses()}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "flex-1 overflow-y-auto bg-background text-foreground", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "max-w-4xl mx-auto px-4 py-8", children: [
      renderMessages(),
      renderThinkingIndicator(),
      process.env.NODE_ENV === "development" && false,
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { ref: messagesEndRef })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "border-t border-border bg-background", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "max-w-4xl mx-auto px-4 py-4", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
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
    ) }) }),
    error && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "p-4 bg-destructive/10 border-l-4 border-destructive", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "text-destructive text-xs", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: "Error:" }),
      " ",
      error.message
    ] }) })
  ] });
}

// src/DistriProvider.tsx
var import_react9 = require("react");
var import_core5 = require("@distri/core");

// src/components/ThemeProvider.tsx
var import_react8 = require("react");
var import_jsx_runtime20 = require("react/jsx-runtime");
var initialState = {
  theme: "system",
  setTheme: () => null
};
var ThemeProviderContext = (0, import_react8.createContext)(initialState);
function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "distri-theme",
  ...props
}) {
  const [theme, setTheme] = (0, import_react8.useState)(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }
    return defaultTheme === "system" ? "dark" : defaultTheme;
  });
  (0, import_react8.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(ThemeProviderContext.Provider, { ...props, value, children });
}
var useTheme = () => {
  const context = (0, import_react8.useContext)(ThemeProviderContext);
  if (context === void 0)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

// src/DistriProvider.tsx
var import_jsx_runtime21 = require("react/jsx-runtime");
var DistriContext = (0, import_react9.createContext)({
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
  const [client, setClient] = (0, import_react9.useState)(null);
  const [error, setError] = (0, import_react9.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react9.useState)(true);
  (0, import_react9.useEffect)(() => {
    let currentClient = null;
    try {
      debug(config, "[DistriProvider] Initializing client with config:", config);
      currentClient = new import_core5.DistriClient(config);
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
  return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(ThemeProvider, { defaultTheme, children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(DistriContext.Provider, { value: contextValue, children }) });
}
function useDistri() {
  const context = (0, import_react9.useContext)(DistriContext);
  if (!context) {
    throw new Error("useDistri must be used within a DistriProvider");
  }
  return context;
}

// src/components/ThemeToggle.tsx
var import_react10 = __toESM(require("react"), 1);
var import_lucide_react11 = require("lucide-react");
var import_jsx_runtime22 = require("react/jsx-runtime");
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dropdownRef = import_react10.default.useRef(null);
  return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "relative", ref: dropdownRef, children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
    "button",
    {
      onClick: () => setTheme(theme === "light" ? "dark" : "light"),
      className: "flex items-center justify-center w-9 h-9 rounded-md border bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_lucide_react11.Sun, { className: "h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_lucide_react11.Moon, { className: "absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "sr-only", children: "Toggle theme" })
      ]
    }
  ) });
}

// src/components/AgentList.tsx
var import_react11 = __toESM(require("react"), 1);
var import_lucide_react12 = require("lucide-react");
var import_jsx_runtime23 = require("react/jsx-runtime");
var AgentList = ({ agents, onRefresh, onStartChat }) => {
  const [refreshing, setRefreshing] = import_react11.default.useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "", children: [
    /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "flex items-center justify-between p-6 border-b border-border", children: [
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("h2", { className: "text-xl font-semibold text-foreground", children: "Available Agents" }),
      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
        "button",
        {
          onClick: handleRefresh,
          disabled: refreshing,
          className: "flex items-center space-x-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_lucide_react12.RefreshCw, { className: `h-4 w-4 ${refreshing ? "animate-spin" : ""}` }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { children: "Refresh" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "p-6", children: agents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_lucide_react12.Bot, { className: "h-16 w-16 text-muted-foreground mx-auto mb-4" }),
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { className: "text-muted-foreground text-lg", children: "No agents available" }),
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { className: "text-sm text-muted-foreground mt-2", children: "Check your server connection" })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: agents.map((agent) => /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
      "div",
      {
        className: "bg-card border border-border rounded-xl p-6 hover:border-border/80 hover:bg-card/80 transition-all duration-200",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "flex items-start justify-between mb-4", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "flex items-center space-x-3", children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "w-12 h-12 bg-primary rounded-full flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_lucide_react12.Bot, { className: "h-6 w-6 text-primary-foreground" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("h3", { className: "font-semibold text-foreground text-lg", children: agent.name }),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "flex items-center space-x-1", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { className: "text-xs text-muted-foreground capitalize", children: agent.version ? `v${agent.version}` : "Latest" }) })
            ] })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { className: "text-sm text-muted-foreground mb-6 line-clamp-3", children: agent.description || "No description available" }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "text-xs text-muted-foreground", children: agent.version && `Version ${agent.version}` }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "flex items-center space-x-2", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
              "button",
              {
                onClick: () => onStartChat(agent),
                className: "flex items-center space-x-1 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_lucide_react12.Play, { className: "h-3 w-3" }),
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { children: "Chat" })
                ]
              }
            ) })
          ] })
        ]
      },
      agent.name
    )) }) })
  ] });
};
var AgentList_default = AgentList;

// src/components/AgentSelect.tsx
var import_lucide_react14 = require("lucide-react");

// src/components/ui/select.tsx
var React12 = __toESM(require("react"), 1);
var SelectPrimitive = __toESM(require("@radix-ui/react-select"), 1);
var import_lucide_react13 = require("lucide-react");
var import_jsx_runtime24 = require("react/jsx-runtime");
var Select = SelectPrimitive.Root;
var SelectGroup = SelectPrimitive.Group;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React12.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
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
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_lucide_react13.ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_lucide_react13.ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_lucide_react13.ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React12.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SelectPrimitive.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
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
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SelectScrollUpButton, {}),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React12.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_lucide_react13.Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// src/components/AgentSelect.tsx
var import_jsx_runtime25 = require("react/jsx-runtime");
var AgentSelect = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  className = "",
  placeholder = "Select an agent...",
  disabled = false
}) => {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  return /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(Select, { value: selectedAgentId, onValueChange: onAgentSelect, disabled, children: [
    /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(SelectTrigger, { className: `w-full ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(import_lucide_react14.Bot, { className: "h-4 w-4" }),
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(SelectValue, { placeholder, children: selectedAgent?.name || placeholder })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(SelectContent, { children: agents.map((agent) => /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(SelectItem, { value: agent.id, children: /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(import_lucide_react14.Bot, { className: "h-4 w-4" }),
      /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("span", { className: "font-medium", children: agent.name }),
        agent.description && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("span", { className: "text-xs text-muted-foreground", children: agent.description })
      ] })
    ] }) }, agent.id)) })
  ] });
};

// src/useAgentDefinitions.ts
var import_react12 = require("react");
function useAgentDefinitions() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = (0, import_react12.useState)([]);
  const [loading, setLoading] = (0, import_react12.useState)(true);
  const [error, setError] = (0, import_react12.useState)(null);
  const fetchAgents = (0, import_react12.useCallback)(async () => {
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
  const getAgent = (0, import_react12.useCallback)(async (agentId) => {
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
  (0, import_react12.useEffect)(() => {
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

// src/components/AgentsPage.tsx
var import_jsx_runtime26 = require("react/jsx-runtime");
var AgentsPage = ({ onStartChat }) => {
  const { agents, loading, refetch } = useAgentDefinitions();
  const handleRefresh = async () => {
    await refetch();
  };
  const handleStartChat = (agent) => {
    onStartChat?.(agent);
  };
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { className: "h-full bg-background flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" }),
      /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "text-foreground", children: "Loading agents..." })
    ] }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { className: "h-full bg-background overflow-auto", children: /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "container mx-auto p-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("h1", { className: "text-3xl font-bold text-foreground mb-6", children: "Agents" }),
    /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
      AgentList_default,
      {
        agents,
        onRefresh: handleRefresh,
        onStartChat: handleStartChat
      }
    )
  ] }) });
};
var AgentsPage_default = AgentsPage;

// src/components/ExecutionSteps.tsx
var import_react13 = __toESM(require("react"), 1);
var import_lucide_react15 = require("lucide-react");
var import_jsx_runtime27 = require("react/jsx-runtime");
var ExecutionSteps = ({ messages, className = "" }) => {
  const steps = import_react13.default.useMemo(() => {
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
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_lucide_react15.CheckCircle, { className: "w-4 h-4 text-green-600" });
      case "error":
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_lucide_react15.AlertCircle, { className: "w-4 h-4 text-red-600" });
      case "running":
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_lucide_react15.Clock, { className: "w-4 h-4 text-blue-600 animate-pulse" });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_lucide_react15.Play, { className: "w-4 h-4 text-gray-400" });
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
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: `space-y-3 ${className}`, children: steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(Card, { className: "border-l-4 border-l-blue-200", children: [
    /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(CardHeader, { className: "pb-2", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "flex items-center gap-2", children: [
        getStepIcon(step),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(CardTitle, { className: "text-sm font-medium", children: step.type === "tool_call" && step.tool_call ? `${step.tool_call.tool_name}` : step.type === "response" ? "Final Response" : "Tool Result" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(Badge, { className: getStepBadgeColor(step), children: step.status })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(CardContent, { className: "pt-0", children: [
      step.type === "tool_call" && step.tool_call && /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "text-xs text-gray-600", children: "Input:" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("pre", { className: "text-xs bg-gray-50 p-2 rounded overflow-x-auto", children: formatToolInput(step.tool_call.input) })
      ] }),
      step.tool_result && /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "space-y-2 mt-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "text-xs text-gray-600", children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto", children: formatToolResult(step.tool_result.result) })
      ] }),
      step.type === "response" && step.content && /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "text-sm", children: step.content })
    ] })
  ] }, step.id)) });
};

// src/components/TaskExecutionRenderer.tsx
var import_react14 = require("react");
var import_core6 = require("@distri/core");
var import_lucide_react16 = require("lucide-react");
var import_jsx_runtime28 = require("react/jsx-runtime");
var TaskExecutionRenderer = ({
  events,
  className = ""
}) => {
  const steps = (0, import_react14.useMemo)(() => {
    const stepMap = /* @__PURE__ */ new Map();
    const stepOrder = [];
    events.forEach((event) => {
      if ((0, import_core6.isDistriMessage)(event)) {
        const message = event;
        const stepId = `message_${message.id}`;
        if (!stepMap.has(stepId)) {
          stepOrder.push(stepId);
        }
        stepMap.set(stepId, {
          id: stepId,
          type: "message",
          title: "Response",
          status: "completed",
          content: message.parts.filter((part) => part.type === "text").map((part) => part.text).join("\n")
        });
        message.parts.forEach((part) => {
          if (part.type === "tool_call") {
            const toolCall = part.tool_call;
            const toolStepId = `tool_${toolCall.tool_call_id}`;
            if (!stepMap.has(toolStepId)) {
              stepOrder.push(toolStepId);
            }
            stepMap.set(toolStepId, {
              id: toolStepId,
              type: "tool",
              title: `${toolCall.tool_name}`,
              status: "completed",
              toolCall
            });
          } else if (part.type === "tool_result") {
            const toolResult = part.tool_result;
            const toolStepId = `tool_${toolResult.tool_call_id}`;
            const existingStep = stepMap.get(toolStepId);
            if (existingStep) {
              existingStep.toolResult = toolResult;
              existingStep.status = toolResult.success ? "completed" : "error";
            }
          }
        });
      } else {
        const distriEvent = event;
        switch (distriEvent.type) {
          case "run_started":
            const runStepId = "run_start";
            if (!stepMap.has(runStepId)) {
              stepOrder.push(runStepId);
            }
            stepMap.set(runStepId, {
              id: runStepId,
              type: "step",
              title: "Starting task execution",
              status: "completed"
            });
            break;
          case "plan_started":
            const planStartId = "plan_start";
            if (!stepMap.has(planStartId)) {
              stepOrder.push(planStartId);
            }
            stepMap.set(planStartId, {
              id: planStartId,
              type: "step",
              title: "Planning task execution",
              status: "running"
            });
            break;
          case "plan_finished":
            const planFinishId = "plan_start";
            const planStep = stepMap.get(planFinishId);
            if (planStep) {
              planStep.status = "completed";
              const planData = distriEvent.data;
              if (planData.total_steps) {
                planStep.title = `Plan completed (${planData.total_steps} steps)`;
              }
            }
            break;
          case "tool_call_start":
            const startData = distriEvent.data;
            const toolStartId = `tool_${startData.tool_call_id}`;
            if (!stepMap.has(toolStartId)) {
              stepOrder.push(toolStartId);
            }
            stepMap.set(toolStartId, {
              id: toolStartId,
              type: startData.is_external ? "tool" : "step",
              title: startData.tool_call_name || "Processing",
              status: "running"
            });
            break;
          case "tool_call_end":
            const endData = distriEvent.data;
            const toolEndId = `tool_${endData.tool_call_id}`;
            const existingStep = stepMap.get(toolEndId);
            if (existingStep) {
              existingStep.status = "completed";
            }
            break;
          case "tool_call_result":
            const resultData = distriEvent.data;
            const toolResultId = `tool_${resultData.tool_call_id}`;
            const resultStep = stepMap.get(toolResultId);
            if (resultStep) {
              resultStep.toolResult = {
                tool_call_id: resultData.tool_call_id,
                result: resultData.result,
                success: true
              };
              resultStep.status = "completed";
            }
            break;
          case "task_artifact":
            const artifactData = distriEvent.data;
            const artifactId = `artifact_${artifactData.artifact_id}`;
            if (!stepMap.has(artifactId)) {
              stepOrder.push(artifactId);
            }
            stepMap.set(artifactId, {
              id: artifactId,
              type: "step",
              title: `Task ${artifactData.artifact_type}`,
              status: "completed",
              content: artifactData.resolution ? JSON.stringify(artifactData.resolution, null, 2) : "Artifact generated"
            });
            break;
          case "text_message_start":
            const msgStartData = distriEvent.data;
            const msgStartId = `message_${msgStartData.message_id}`;
            if (!stepMap.has(msgStartId)) {
              stepOrder.push(msgStartId);
            }
            stepMap.set(msgStartId, {
              id: msgStartId,
              type: "message",
              title: "Generating response",
              status: "running",
              content: ""
            });
            break;
          case "text_message_content":
            const msgContentData = distriEvent.data;
            const msgContentId = `message_${msgContentData.message_id}`;
            const msgStep = stepMap.get(msgContentId);
            if (msgStep) {
              msgStep.content = (msgStep.content || "") + msgContentData.delta;
            }
            break;
          case "text_message_end":
            const msgEndData = distriEvent.data;
            const msgEndId = `message_${msgEndData.message_id}`;
            const msgEndStep = stepMap.get(msgEndId);
            if (msgEndStep) {
              msgEndStep.status = "completed";
            }
            break;
          case "run_finished":
            stepMap.forEach((step) => {
              if (step.status === "running") {
                step.status = "completed";
              }
            });
            break;
          default:
            console.warn("Unhandled event type:", distriEvent.type, distriEvent);
            break;
        }
      }
    });
    return stepOrder.map((id) => stepMap.get(id)).filter(Boolean);
  }, [events]);
  const getStepIcon = (step) => {
    switch (step.status) {
      case "completed":
        return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(import_lucide_react16.CheckCircle, { className: "w-4 h-4 text-green-600" });
      case "error":
        return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(import_lucide_react16.AlertCircle, { className: "w-4 h-4 text-red-600" });
      case "running":
        return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(import_lucide_react16.Loader2, { className: "w-4 h-4 text-blue-600 animate-spin" });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(import_lucide_react16.Clock, { className: "w-4 h-4 text-gray-400" });
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
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: `space-y-3 ${className}`, children: steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(Card, { className: "border-l-4 border-l-blue-200", children: [
    /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(CardHeader, { className: "pb-2", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "flex items-center gap-2", children: [
        getStepIcon(step),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(CardTitle, { className: "text-sm font-medium", children: step.title })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Badge, { className: getStepBadgeColor(step), children: step.status })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(CardContent, { className: "pt-0", children: [
      step.toolCall && /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "text-xs text-gray-600", children: "Input:" }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("pre", { className: "text-xs bg-gray-50 p-2 rounded overflow-x-auto", children: formatToolInput(step.toolCall.input) })
      ] }),
      step.toolResult && /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "space-y-2 mt-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "text-xs text-gray-600", children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto", children: formatToolResult(step.toolResult.result) })
      ] }),
      step.content && step.type === "message" && /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "text-sm whitespace-pre-wrap", children: [
        step.content,
        step.status === "running" && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("span", { className: "inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1" })
      ] })
    ] })
  ] }, step.id)) });
};

// src/components/renderers/ArtifactRenderer.tsx
var import_jsx_runtime29 = require("react/jsx-runtime");
function ArtifactRenderer({ message, chatState: _chatState, className = "", avatar }) {
  switch (message.type) {
    case "llm_response":
      return renderLLMResponse(message, _chatState, className, avatar);
    case "tool_results":
      return renderToolResults(message, _chatState, className, avatar);
    case "artifact":
      return renderGenericArtifact(message, _chatState, className, avatar);
    default:
      return null;
  }
}
function renderLLMResponse(llmArtifact, _chatState, className, avatar) {
  const content = extractContent(llmArtifact);
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: `flex items-start gap-4 py-3 px-2 ${className}`, children: [
    avatar && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "flex-shrink-0", children: avatar }),
    /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-sm font-medium text-foreground mb-2", children: "Assistant" }),
      content.text && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "prose prose-sm max-w-none text-foreground mb-3", children: renderTextContent(content) }),
      llmArtifact.tool_calls && llmArtifact.tool_calls.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "space-y-2", children: llmArtifact.tool_calls.map((toolCall, index) => /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "border rounded-lg p-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { className: "text-sm font-medium", children: toolCall.tool_name }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { className: "text-xs text-primary", children: "Success" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "text-sm text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("strong", { children: "Input:" }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1", children: JSON.stringify(toolCall.input, null, 2) })
        ] })
      ] }, toolCall.tool_call_id || index)) })
    ] })
  ] });
}
function renderToolResults(toolResultsArtifact, _chatState, className, avatar) {
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: `flex items-start gap-4 py-3 px-2 ${className}`, children: [
    avatar && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "flex-shrink-0", children: avatar }),
    /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-sm font-medium text-foreground mb-2", children: "Tool Results" }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "prose prose-sm max-w-none text-foreground mb-3", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("p", { children: [
        "Tool execution completed with ",
        toolResultsArtifact.results.length,
        " result(s)."
      ] }) }),
      toolResultsArtifact.results.map((result, index) => /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "border rounded-lg p-3 mb-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { className: "text-sm font-medium", children: result.tool_name }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { className: "text-xs text-primary", children: "Success" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "text-sm text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("strong", { children: "Result:" }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-y-auto", children: typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2) })
        ] })
      ] }, result.tool_call_id || index))
    ] })
  ] });
}
function renderGenericArtifact(genericArtifact, _chatState, className, avatar) {
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: `flex items-start gap-4 py-3 px-2 ${className}`, children: [
    avatar && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "flex-shrink-0", children: avatar }),
    /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-sm font-medium text-foreground mb-2", children: "Artifact" }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "prose prose-sm max-w-none text-foreground mb-3", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("p", { children: [
        "Artifact processed: ",
        genericArtifact.name
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "border rounded-lg p-3", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "text-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("strong", { children: "Data:" }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-y-auto", children: JSON.stringify(genericArtifact.data, null, 2) })
      ] }) })
    ] })
  ] });
}

// src/useAgent.ts
var import_react15 = __toESM(require("react"), 1);
var import_core7 = require("@distri/core");
function useAgent({
  agentIdOrDef
}) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agent, setAgent] = (0, import_react15.useState)(null);
  const [loading, setLoading] = (0, import_react15.useState)(false);
  const [error, setError] = (0, import_react15.useState)(null);
  const agentRef = (0, import_react15.useRef)(null);
  const currentAgentIdRef = (0, import_react15.useRef)(null);
  const initializeAgent = (0, import_react15.useCallback)(async () => {
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
      const newAgent = await import_core7.Agent.create(agentIdOrDef, client);
      agentRef.current = newAgent;
      currentAgentIdRef.current = agentIdOrDef;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create agent"));
    } finally {
      setLoading(false);
    }
  }, [client, agentIdOrDef]);
  import_react15.default.useEffect(() => {
    if (!clientLoading && !clientError && client) {
      initializeAgent();
    }
  }, [clientLoading, clientError, client, agentIdOrDef, initializeAgent]);
  import_react15.default.useEffect(() => {
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

// src/useThreads.ts
var import_react16 = require("react");
function useThreads() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = (0, import_react16.useState)([]);
  const [loading, setLoading] = (0, import_react16.useState)(true);
  const [error, setError] = (0, import_react16.useState)(null);
  const fetchThreads = (0, import_react16.useCallback)(async () => {
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
  const fetchThread = (0, import_react16.useCallback)(async (threadId) => {
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
  const deleteThread = (0, import_react16.useCallback)(async (threadId) => {
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
  const updateThread = (0, import_react16.useCallback)(async (threadId, localId) => {
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
  (0, import_react16.useEffect)(() => {
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
  (0, import_react16.useEffect)(() => {
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

// src/components/ChatContext.tsx
var import_react17 = require("react");
var import_jsx_runtime30 = require("react/jsx-runtime");
var ChatContext = (0, import_react17.createContext)(void 0);
var useChatConfig = () => {
  const context = (0, import_react17.useContext)(ChatContext);
  if (!context) {
    throw new Error("useChatConfig must be used within a ChatProvider");
  }
  return context;
};

// src/components/ui/input.tsx
var React17 = __toESM(require("react"), 1);
var import_jsx_runtime31 = require("react/jsx-runtime");
var Input = React17.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
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
var React18 = __toESM(require("react"), 1);
var import_jsx_runtime32 = require("react/jsx-runtime");
var Dialog = React18.createContext({});
var DialogRoot = ({ open, onOpenChange, children }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(Dialog.Provider, { value: { open, onOpenChange }, children });
};
var DialogTrigger = React18.forwardRef(({ className, children, ...props }, ref) => {
  const context = React18.useContext(Dialog);
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
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
var DialogContent = React18.forwardRef(({ className, children, ...props }, ref) => {
  const context = React18.useContext(Dialog);
  if (!context.open) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
          "button",
          {
            className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            onClick: () => context.onOpenChange?.(false),
            children: /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("path", { d: "m18 6-12 12" }),
                  /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("path", { d: "m6 6 12 12" })
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
var DialogHeader = React18.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
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
var DialogTitle = React18.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
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
var React19 = __toESM(require("react"), 1);
var import_jsx_runtime33 = require("react/jsx-runtime");
var Textarea = React19.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
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
var React23 = __toESM(require("react"), 1);
var import_react_slot = require("@radix-ui/react-slot");
var import_class_variance_authority3 = require("class-variance-authority");
var import_lucide_react18 = require("lucide-react");

// src/components/ui/separator.tsx
var React20 = __toESM(require("react"), 1);
var SeparatorPrimitive = __toESM(require("@radix-ui/react-separator"), 1);
var import_jsx_runtime34 = require("react/jsx-runtime");
var Separator2 = React20.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
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
var React21 = __toESM(require("react"), 1);
var SheetPrimitive = __toESM(require("@radix-ui/react-dialog"), 1);
var import_class_variance_authority2 = require("class-variance-authority");
var import_lucide_react17 = require("lucide-react");
var import_jsx_runtime35 = require("react/jsx-runtime");
var Sheet = SheetPrimitive.Root;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React21.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
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
var SheetContent = React21.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(SheetPortal, { children: [
  /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(SheetOverlay, {}),
  /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      ...props,
      children: [
        children,
        /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(import_lucide_react17.X, { className: "h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
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
}) => /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
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
var SheetTitle = React21.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React21.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// src/components/ui/skeleton.tsx
var import_jsx_runtime36 = require("react/jsx-runtime");
function Skeleton({
  className,
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
    "div",
    {
      className: cn("animate-pulse rounded-md bg-muted", className),
      ...props
    }
  );
}

// src/components/ui/tooltip.tsx
var React22 = __toESM(require("react"), 1);
var TooltipPrimitive = __toESM(require("@radix-ui/react-tooltip"), 1);
var import_jsx_runtime37 = require("react/jsx-runtime");
var TooltipProvider = TooltipPrimitive.Provider;
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = React22.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
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
var import_jsx_runtime38 = require("react/jsx-runtime");
var SIDEBAR_COOKIE_NAME = "sidebar:state";
var SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
var SIDEBAR_WIDTH = "16rem";
var SIDEBAR_WIDTH_MOBILE = "18rem";
var SIDEBAR_WIDTH_ICON = "3rem";
var SIDEBAR_KEYBOARD_SHORTCUT = "b";
var SidebarContext = React23.createContext(null);
function useSidebar() {
  const context = React23.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
var SidebarProvider = React23.forwardRef(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  const [_open, _setOpen] = React23.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React23.useCallback(
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
  const [openMobile, setOpenMobile] = React23.useState(false);
  const [isMobile, setIsMobile] = React23.useState(false);
  React23.useEffect(() => {
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
  React23.useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_COOKIE_NAME);
    if (savedState !== null) {
      setOpen(savedState === "true");
    }
  }, [setOpen]);
  React23.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);
  const toggleSidebar = React23.useCallback(() => {
    return isMobile ? setOpenMobile((open2) => !open2) : setOpen((open2) => !open2);
  }, [isMobile, setOpen, setOpenMobile]);
  const state = open ? "expanded" : "collapsed";
  const contextValue = React23.useMemo(
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
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(SidebarContext.Provider, { value: contextValue, children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TooltipProvider, { delayDuration: 0, children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var Sidebar = React23.forwardRef(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (collapsible === "none") {
    return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
    return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Sheet, { open: openMobile, onOpenChange: setOpenMobile, ...props, children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
      SheetContent,
      {
        "data-sidebar": "sidebar",
        "data-mobile": "true",
        className: "w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
        style: {
          "--sidebar-width": SIDEBAR_WIDTH_MOBILE
        },
        side,
        children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("div", { className: "flex h-full w-full flex-col", children })
      }
    ) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(
    "div",
    {
      ref,
      className: "group peer hidden md:block text-sidebar-foreground",
      "data-state": state,
      "data-collapsible": state === "collapsed" ? collapsible : "",
      "data-variant": variant,
      "data-side": side,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
            children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarTrigger = React23.forwardRef(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(import_lucide_react18.PanelLeft, {}),
        /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("span", { className: "sr-only", children: "Toggle Sidebar" })
      ]
    }
  );
});
SidebarTrigger.displayName = "SidebarTrigger";
var SidebarRail = React23.forwardRef(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarInset = React23.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarHeader = React23.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarFooter = React23.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarSeparator = React23.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarContent = React23.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarGroup = React23.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarGroupLabel = React23.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "div";
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarGroupAction = React23.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "button";
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarGroupContent = React23.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarMenu = React23.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarMenuItem = React23.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarMenuButton = React23.forwardRef(({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "button";
  const { isMobile, state } = useSidebar();
  const button = /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(Tooltip, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TooltipTrigger, { asChild: true, children: button }),
    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarMenuAction = React23.forwardRef(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "button";
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarMenuBadge = React23.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarMenuSkeleton = React23.forwardRef(({ className, showIcon = false, ...props }, ref) => {
  const width = React23.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(
    "div",
    {
      ref,
      "data-sidebar": "menu-skeleton",
      className: cn("rounded-md h-8 flex gap-2 px-2 items-center", className),
      ...props,
      children: [
        showIcon && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Skeleton, { className: "size-4 rounded-md", "data-sidebar": "menu-skeleton-icon" }),
        /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarMenuSub = React23.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var SidebarMenuSubItem = React23.forwardRef(({ ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("li", { ref, ...props });
});
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
var SidebarMenuSubButton = React23.forwardRef(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "a";
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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

// src/utils/messageUtils.ts
var import_core8 = require("@distri/core");
var extractTextFromMessage = (message) => {
  if ((0, import_core8.isDistriMessage)(message)) {
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
  if ((0, import_core8.isDistriArtifact)(message)) {
    return true;
  }
  if ((0, import_core8.isDistriMessage)(message)) {
    const textContent = extractTextFromMessage(message);
    if (textContent.trim()) return true;
  }
  return showDebugMessages;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentList,
  AgentSelect,
  AgentsPage,
  ApprovalToolCall,
  ArtifactRenderer,
  AssistantMessageRenderer,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Chat,
  DebugRenderer,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DistriProvider,
  ExecutionSteps,
  Input,
  PlanRenderer,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  Skeleton,
  TaskExecutionRenderer,
  Textarea,
  ThemeProvider,
  ThemeToggle,
  ThinkingRenderer,
  ToastToolCall,
  ToolCallRenderer,
  ToolMessageRenderer,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UserMessageRenderer,
  extractTextFromMessage,
  shouldDisplayMessage,
  useAgent,
  useAgentDefinitions,
  useChat,
  useChatConfig,
  useChatStateStore,
  useSidebar,
  useTheme,
  useThreads
});
