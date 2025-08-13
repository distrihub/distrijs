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
  AppSidebar: () => AppSidebar,
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
  ChatInput: () => ChatInput,
  DebugRenderer: () => DebugRenderer,
  Dialog: () => DialogRoot,
  DialogContent: () => DialogContent,
  DialogHeader: () => DialogHeader,
  DialogTitle: () => DialogTitle,
  DialogTrigger: () => DialogTrigger,
  DistriProvider: () => DistriProvider,
  DropdownMenu: () => DropdownMenu,
  DropdownMenuCheckboxItem: () => DropdownMenuCheckboxItem,
  DropdownMenuContent: () => DropdownMenuContent,
  DropdownMenuGroup: () => DropdownMenuGroup,
  DropdownMenuItem: () => DropdownMenuItem,
  DropdownMenuLabel: () => DropdownMenuLabel,
  DropdownMenuPortal: () => DropdownMenuPortal,
  DropdownMenuRadioGroup: () => DropdownMenuRadioGroup,
  DropdownMenuRadioItem: () => DropdownMenuRadioItem,
  DropdownMenuSeparator: () => DropdownMenuSeparator,
  DropdownMenuShortcut: () => DropdownMenuShortcut,
  DropdownMenuSub: () => DropdownMenuSub,
  DropdownMenuSubContent: () => DropdownMenuSubContent,
  DropdownMenuSubTrigger: () => DropdownMenuSubTrigger,
  DropdownMenuTrigger: () => DropdownMenuTrigger,
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
  ToolCallRenderer: () => ToolCallRenderer,
  ToolMessageRenderer: () => ToolMessageRenderer,
  Tooltip: () => Tooltip,
  TooltipContent: () => TooltipContent,
  TooltipProvider: () => TooltipProvider,
  TooltipTrigger: () => TooltipTrigger,
  UserMessageRenderer: () => UserMessageRenderer,
  debugStreamEvents: () => debugStreamEvents,
  quickDebugMessage: () => quickDebugMessage,
  useAgent: () => useAgent,
  useAgentDefinitions: () => useAgentDefinitions,
  useChat: () => useChat,
  useChatMessages: () => useChatMessages,
  useDistri: () => useDistri,
  useDistriClient: () => useDistriClient,
  useSidebar: () => useSidebar,
  useTheme: () => useTheme,
  useThreads: () => useThreads,
  wrapFnToolAsUiTool: () => wrapFnToolAsUiTool,
  wrapTools: () => wrapTools
});
module.exports = __toCommonJS(index_exports);

// src/useChat.ts
var import_react6 = require("react");
var import_core2 = require("@distri/core");
var import_core3 = require("@distri/core");

// src/hooks/registerTools.tsx
var import_react5 = require("react");

// src/components/renderers/tools/ApprovalToolCall.tsx
var import_react = require("react");

// src/components/ui/button.tsx
var React = __toESM(require("react"), 1);

// src/lib/utils.ts
var import_clsx = require("clsx");
var import_tailwind_merge = require("tailwind-merge");
function cn(...inputs) {
  return (0, import_tailwind_merge.twMerge)((0, import_clsx.clsx)(inputs));
}

// src/components/ui/button.tsx
var import_jsx_runtime = require("react/jsx-runtime");
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
var Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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

// src/components/ui/checkbox.tsx
var React2 = __toESM(require("react"), 1);
var CheckboxPrimitive = __toESM(require("@radix-ui/react-checkbox"), 1);
var import_lucide_react = require("lucide-react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var Checkbox = React2.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      CheckboxPrimitive.Indicator,
      {
        className: cn("flex items-center justify-center text-current"),
        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react.Check, { className: "h-4 w-4" })
      }
    )
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// src/components/renderers/tools/ApprovalToolCall.tsx
var import_lucide_react2 = require("lucide-react");
var import_jsx_runtime3 = require("react/jsx-runtime");

// src/components/renderers/tools/ToastToolCall.tsx
var import_react2 = require("react");
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
  (0, import_react2.useEffect)(() => {
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
        tool_name: toolCall.tool_name,
        result: "Toast displayed successfully",
        success: true,
        error: void 0
      };
      completeTool(result);
    }, duration);
  }, [message, type, completeTool]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, {});
};

// src/components/renderers/tools/DefaultToolActions.tsx
var import_react3 = require("react");
var import_lucide_react3 = require("lucide-react");
var import_jsx_runtime5 = require("react/jsx-runtime");
var DefaultToolActions = ({
  toolCall,
  toolCallState,
  completeTool,
  tool
}) => {
  const [isProcessing, setIsProcessing] = (0, import_react3.useState)(false);
  const [hasExecuted, setHasExecuted] = (0, import_react3.useState)(false);
  const [dontAskAgain, setDontAskAgain] = (0, import_react3.useState)(false);
  const autoExecute = tool.autoExecute;
  const input = typeof toolCall.input === "string" ? JSON.parse(toolCall.input) : toolCall.input;
  const toolName = toolCall.tool_name;
  const isLiveStream = toolCallState?.isLiveStream || false;
  const getApprovalPreferences = () => {
    try {
      const stored = localStorage.getItem("distri-tool-preferences");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };
  const saveApprovalPreference = (toolName2, approved) => {
    try {
      const preferences = getApprovalPreferences();
      preferences[toolName2] = approved;
      localStorage.setItem("distri-tool-preferences", JSON.stringify(preferences));
    } catch {
    }
  };
  (0, import_react3.useEffect)(() => {
    if (!isLiveStream) return;
    const preferences = getApprovalPreferences();
    const autoApprove = preferences[toolName];
    if (autoApprove !== void 0 && !hasExecuted && !isProcessing) {
      if (autoApprove) {
        handleExecute();
      } else {
        handleCancel();
      }
    }
  }, [toolName, isLiveStream]);
  (0, import_react3.useEffect)(() => {
    if (!isLiveStream) return;
    const preferences = getApprovalPreferences();
    const hasPreference = preferences[toolName] !== void 0;
    if (autoExecute && !hasPreference && !hasExecuted && !isProcessing) {
      handleExecute();
    }
  }, [autoExecute, hasExecuted, isProcessing, toolName, isLiveStream]);
  const handleExecute = async () => {
    if (isProcessing || hasExecuted) return;
    if (dontAskAgain) {
      saveApprovalPreference(toolName, true);
    }
    setIsProcessing(true);
    setHasExecuted(true);
    try {
      const result = await tool.handler(toolCall.input);
      if (!tool.is_final) {
        const toolResult = {
          tool_call_id: toolCall.tool_call_id,
          tool_name: toolName,
          result: typeof result === "string" ? result : JSON.stringify(result),
          success: true,
          error: void 0
        };
        await completeTool(toolResult);
      } else {
        console.log("Tool is final, no action required");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const toolResult = {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolName,
        result: "Tool execution failed" + errorMessage,
        success: false,
        error: errorMessage
      };
      await completeTool(toolResult);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleCancel = () => {
    if (isProcessing || hasExecuted) return;
    if (dontAskAgain) {
      saveApprovalPreference(toolName, false);
    }
    setHasExecuted(true);
    const toolResult = {
      tool_call_id: toolCall.tool_call_id,
      tool_name: toolName,
      result: "Tool execution cancelled by user",
      success: false,
      error: "User cancelled the operation"
    };
    completeTool(toolResult);
  };
  if (hasExecuted && !isProcessing) {
    const wasSuccessful = !toolCallState?.error;
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "border rounded-lg p-4 bg-muted/50", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [
        wasSuccessful ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.CheckCircle, { className: "h-4 w-4 text-green-600" }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.XCircle, { className: "h-4 w-4 text-red-600" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "font-medium", children: wasSuccessful ? "Tool Executed Successfully" : "Tool Execution Failed" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "text-sm text-muted-foreground", children: [
        "Tool: ",
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { className: "bg-background px-1 rounded", children: toolName })
      ] }),
      toolCallState?.result && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "mt-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "text-xs text-muted-foreground mb-1", children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { className: "text-xs bg-background p-2 rounded border overflow-x-auto", children: typeof toolCallState.result === "string" ? toolCallState.result : JSON.stringify(toolCallState.result, null, 2) })
      ] }),
      toolCallState?.error && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "mt-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "text-xs text-destructive mb-1", children: "Error:" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "text-xs text-destructive bg-destructive/10 p-2 rounded border", children: toolCallState.error })
      ] })
    ] });
  }
  if (isProcessing) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "border rounded-lg p-4 bg-background", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.Loader2, { className: "h-4 w-4 text-primary animate-spin" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "font-medium", children: "Executing Tool..." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "text-sm text-muted-foreground", children: [
        "Running: ",
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { className: "bg-muted px-1 rounded", children: toolName })
      ] })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "border rounded-lg p-4 bg-background", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react3.Wrench, { className: "h-4 w-4 text-primary" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "font-medium", children: "Tool Action Required" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "mb-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "text-sm mb-2", children: [
        "Execute tool: ",
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { className: "bg-muted px-1 rounded", children: toolName })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "text-xs text-muted-foreground mb-1", children: "Input:" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { className: "text-xs bg-muted p-2 rounded border overflow-x-auto", children: JSON.stringify(input, null, 2) })
    ] }),
    !autoExecute && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "space-y-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          Checkbox,
          {
            id: "dont-ask-again-tool",
            checked: dontAskAgain,
            onCheckedChange: (checked) => setDontAskAgain(checked)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "label",
          {
            htmlFor: "dont-ask-again-tool",
            className: "text-sm text-muted-foreground cursor-pointer",
            children: [
              "Don't ask again for ",
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "font-mono text-xs", children: toolName })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          Button,
          {
            size: "sm",
            variant: "destructive",
            onClick: handleCancel,
            disabled: isProcessing,
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          Button,
          {
            size: "sm",
            onClick: handleExecute,
            disabled: isProcessing,
            children: "Confirm"
          }
        )
      ] })
    ] })
  ] });
};

// src/components/renderers/tools/MissingTool.tsx
var import_lucide_react4 = require("lucide-react");
var import_jsx_runtime6 = require("react/jsx-runtime");
var MissingTool = ({
  toolCall,
  completeTool
}) => {
  const input = typeof toolCall.input === "string" ? JSON.parse(toolCall.input) : toolCall.input;
  const toolName = toolCall.tool_name;
  const handleDismiss = () => {
    const toolResult = {
      tool_call_id: toolCall.tool_call_id,
      tool_name: toolName,
      result: `Tool '${toolName}' is not available`,
      success: false,
      error: `Tool '${toolName}' not found in external tools`
    };
    completeTool(toolResult);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "border rounded-lg p-4 bg-destructive/5 border-destructive/20", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.AlertTriangle, { className: "h-4 w-4 text-destructive" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "font-medium text-destructive", children: "Missing Tool" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "mb-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "text-sm text-destructive mb-2", children: [
        "Tool ",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("code", { className: "bg-destructive/10 px-1 rounded font-mono", children: toolName }),
        " not found"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-xs text-muted-foreground mb-2", children: "This tool is not available in the current agent definition or external tools." }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("details", { className: "mt-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("summary", { className: "text-xs text-muted-foreground cursor-pointer hover:text-foreground", children: "Show attempted input" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("pre", { className: "text-xs bg-muted p-2 rounded border mt-2 overflow-x-auto", children: JSON.stringify(input, null, 2) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "flex gap-2", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
      Button,
      {
        size: "sm",
        variant: "outline",
        onClick: handleDismiss,
        className: "border-destructive/20 text-destructive hover:bg-destructive/10",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react4.XCircle, { className: "h-3 w-3 mr-1" }),
          "Dismiss"
        ]
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "mt-3 p-2 bg-muted/50 rounded text-xs text-muted-foreground", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: "Tip:" }),
      " Make sure the tool is properly registered with the agent or included in the external tools array."
    ] })
  ] });
};

// src/stores/chatStateStore.ts
var import_zustand = require("zustand");
var import_core = require("@distri/core");

// src/utils/extractThought.ts
function extractThoughtContent(text) {
  if (!text) return null;
  const agentResponseRegex = /<agent_response[^>]*>([\s\S]*?)<\/agent_response>/gi;
  const agentResponseMatch = agentResponseRegex.exec(text);
  if (!agentResponseMatch) return null;
  const agentResponseContent = agentResponseMatch[1];
  const thoughtRegex = /<thought[^>]*>([\s\S]*?)<\/thought>/gi;
  const thoughtMatch = thoughtRegex.exec(agentResponseContent);
  if (!thoughtMatch) return null;
  return thoughtMatch[1].trim();
}

// src/stores/chatStateStore.ts
var import_react4 = __toESM(require("react"), 1);
var useChatStateStore = (0, import_zustand.create)((set, get) => ({
  isStreaming: false,
  isLoading: false,
  error: null,
  debug: false,
  tasks: /* @__PURE__ */ new Map(),
  plans: /* @__PURE__ */ new Map(),
  steps: /* @__PURE__ */ new Map(),
  toolCalls: /* @__PURE__ */ new Map(),
  currentRunId: void 0,
  currentTaskId: void 0,
  currentPlanId: void 0,
  streamingIndicator: void 0,
  currentThought: void 0,
  messages: [],
  // State actions
  setStreaming: (isStreaming) => {
    set({ isStreaming });
  },
  setLoading: (isLoading) => {
    set({ isLoading });
  },
  setError: (error) => {
    set({ error });
  },
  setDebug: (debug2) => {
    set({ debug: debug2 });
  },
  setStreamingIndicator: (indicator) => {
    set({ streamingIndicator: indicator });
  },
  setCurrentThought: (thought) => {
    set({ currentThought: thought });
  },
  triggerTools: () => {
    set({ isLoading: true });
    const pendingToolCalls = get().getPendingToolCalls();
    if (pendingToolCalls.length === 0) {
      set({ isLoading: false });
    }
  },
  addMessage: (message) => {
    const isDebugEnabled = get().debug;
    set((state) => {
      const messages = [...state.messages];
      if ((0, import_core.isDistriEvent)(message)) {
        const event = message;
        if (event.type === "text_message_start") {
          const messageId = event.data.message_id;
          const stepId = event.data.step_id;
          const role = event.data.role;
          const isFinal = event.data.is_final;
          const newDistriMessage = {
            id: messageId,
            role,
            parts: [{ type: "text", data: "" }],
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            step_id: stepId,
            is_final: isFinal
          };
          messages.push(newDistriMessage);
          if (stepId) {
            const existingStep = get().steps.get(stepId);
            if (existingStep) {
              get().updateStep(stepId, {
                // Keep the original title from step_started, just ensure it's running
                status: "running"
              });
            }
          }
        } else if (event.type === "text_message_content") {
          const messageId = event.data.message_id;
          const stepId = event.data.step_id;
          const delta = event.data.delta;
          const existingIndex = messages.findIndex(
            (m) => (0, import_core.isDistriMessage)(m) && m.id === messageId
          );
          if (existingIndex >= 0) {
            const existing = messages[existingIndex];
            let textPart = existing.parts.find((p) => p.type === "text");
            if (!textPart) {
              textPart = { type: "text", data: "" };
              existing.parts.push(textPart);
            }
            textPart.data += delta;
            const thoughtContent = extractThoughtContent(textPart.data);
            if (thoughtContent) {
              get().setCurrentThought(thoughtContent);
            }
            if (stepId) {
              const currentStep = get().steps.get(stepId);
              if (currentStep && currentStep.status === "running") {
                get().updateStep(stepId, {
                  title: `${currentStep.title || "Writing"} (${textPart.data.length} chars)`
                });
              }
            }
          } else {
            if (isDebugEnabled) {
              console.warn("\u274C Cannot find streaming message to append to:", messageId);
              console.log("\u{1F4CB} Available message IDs:", messages.filter(import_core.isDistriMessage).map((m) => m.id));
            }
          }
        } else if (event.type === "text_message_end") {
          const stepId = event.data.step_id;
          if (stepId) {
            const existingStep = get().steps.get(stepId);
            if (existingStep) {
              get().updateStep(stepId, {
                status: "completed",
                endTime: Date.now()
              });
            }
          }
          get().setCurrentThought(void 0);
        } else {
          const stateOnlyEvents = [
            "run_started",
            "run_finished",
            "run_error",
            "plan_started",
            "plan_finished",
            "step_started",
            "step_completed",
            "tool_calls",
            "tool_results"
          ];
          if (!stateOnlyEvents.includes(event.type)) {
            messages.push(message);
          }
        }
      } else {
        messages.push(message);
      }
      return { ...state, messages };
    });
  },
  resolveToolCalls: () => {
    const toolCalls = get().getPendingToolCalls();
    toolCalls.forEach((toolCall) => {
      get().initializeTool(toolCall);
    });
  },
  // State actions
  processMessage: (message, isFromStream = false) => {
    const timestamp = Date.now();
    const isDebugEnabled = get().debug;
    if (isDebugEnabled) {
      console.log("\u{1F527} Processing message:");
      console.log(message);
    }
    get().addMessage(message);
    if ((0, import_core.isDistriEvent)(message)) {
      const event = message;
      if (isDebugEnabled && ["run_started", "run_finished", "plan_started", "plan_finished", "text_message_start"].includes(event.type)) {
        console.log("\u{1F3EA} STORE BEFORE:", {
          eventType: event.type,
          streamingIndicator: get().streamingIndicator,
          isStreaming: get().isStreaming,
          currentTaskId: get().currentTaskId,
          currentPlanId: get().currentPlanId
        });
      }
      switch (message.type) {
        case "run_started":
          const runStartedEvent = event;
          const runId = runStartedEvent.data.runId;
          const taskId = runStartedEvent.data.taskId;
          if (isDebugEnabled) {
            console.log("\u{1F3EA} run_started with IDs:", { runId, taskId });
          }
          if (taskId) {
            get().updateTask(taskId, {
              id: taskId,
              runId,
              title: "Agent Run",
              status: "running",
              startTime: timestamp,
              metadata: event.data
            });
          }
          set({
            currentRunId: runId,
            currentTaskId: taskId
          });
          get().setStreamingIndicator("typing");
          set({ isStreaming: true });
          if (isDebugEnabled) {
            console.log("\u{1F3EA} STORE AFTER run_started:", {
              streamingIndicator: get().streamingIndicator,
              isStreaming: get().isStreaming,
              currentRunId: get().currentRunId,
              currentTaskId: get().currentTaskId
            });
          }
          break;
        case "run_finished":
          const runFinishedEvent = event;
          const finishedRunId = runFinishedEvent.data.runId;
          const finishedTaskId = runFinishedEvent.data.taskId;
          if (isDebugEnabled) {
            console.log("\u{1F3EA} run_finished with IDs:", { runId: finishedRunId, taskId: finishedTaskId });
          }
          if (finishedTaskId) {
            get().updateTask(finishedTaskId, {
              status: "completed",
              endTime: timestamp
            });
          }
          console.log("\u{1F527} Run finished - tool calls should already be resolved from tool_calls event");
          get().setStreamingIndicator(void 0);
          get().setCurrentThought(void 0);
          set({ isStreaming: false });
          break;
        case "run_error":
          console.log("\u{1F527} run_error");
          const errorTaskId = get().currentTaskId;
          if (errorTaskId) {
            get().updateTask(errorTaskId, {
              status: "failed",
              endTime: timestamp,
              error: message.data?.message || "Unknown error"
            });
          }
          console.log("\u{1F527} Run error - tool calls should already be resolved from tool_calls event");
          get().setStreamingIndicator(void 0);
          get().setCurrentThought(void 0);
          set({ isStreaming: false });
          break;
        case "plan_started":
          const planId = `plan_${Date.now()}`;
          const currentRunId = get().currentRunId;
          const currentTaskId = get().currentTaskId;
          if (isDebugEnabled) {
            console.log("\u{1F3EA} plan_started for run/task:", { currentRunId, currentTaskId });
          }
          get().updatePlan(planId, {
            id: planId,
            runId: currentRunId,
            // Link to the current run
            taskId: currentTaskId,
            // Link to the current task
            steps: [],
            status: "running",
            startTime: timestamp
          });
          set({ currentPlanId: planId });
          get().setStreamingIndicator("thinking");
          if (isDebugEnabled) {
            console.log("\u{1F3EA} STORE AFTER plan_started:", {
              streamingIndicator: get().streamingIndicator,
              currentPlanId: get().currentPlanId,
              currentRunId: get().currentRunId,
              currentTaskId: get().currentTaskId
            });
          }
          break;
        case "plan_finished":
          const currentPlanId = get().currentPlanId;
          if (currentPlanId) {
            const plan = get().getPlanById(currentPlanId);
            const thinkingDuration = plan?.startTime ? timestamp - plan.startTime : 0;
            get().updatePlan(currentPlanId, {
              status: "completed",
              endTime: timestamp,
              thinkingDuration
            });
          }
          get().setStreamingIndicator(void 0);
          get().setCurrentThought(void 0);
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
          break;
        case "tool_call_end":
          const finishedToolCallId = message.data.tool_call_id;
          if (finishedToolCallId) {
            get().updateTask(finishedToolCallId, {
              status: "completed",
              endTime: timestamp
            });
          }
          break;
        case "text_message_start":
          get().setStreamingIndicator("typing");
          if (isDebugEnabled) {
            console.log("\u{1F3EA} STORE AFTER text_message_start:", {
              streamingIndicator: get().streamingIndicator
            });
          }
          break;
        case "text_message_content":
          get().setStreamingIndicator(void 0);
          break;
        case "text_message_end":
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
          get().setStreamingIndicator("generating");
          break;
        case "step_completed":
          const completedStepId = message.data.step_id;
          get().updateStep(completedStepId, {
            status: "completed",
            endTime: timestamp
          });
          get().setStreamingIndicator(void 0);
          break;
        case "tool_calls":
          if (message.data.tool_calls && Array.isArray(message.data.tool_calls)) {
            console.log("\u{1F527} Processing tool_calls event:", message.data.tool_calls);
            message.data.tool_calls.forEach((toolCall) => {
              console.log("\u{1F527} Creating tool call:", toolCall.tool_name, toolCall.tool_call_id);
              get().initToolCall({
                tool_call_id: toolCall.tool_call_id,
                tool_name: toolCall.tool_name,
                input: toolCall.input
              }, timestamp, isFromStream);
            });
            console.log("\u{1F527} Tool calls after init:", Array.from(get().toolCalls.entries()));
            console.log("\u{1F527} Resolving tool calls immediately on tool_calls event");
            get().resolveToolCalls();
          }
          break;
        case "tool_results":
          if (message.data.results && Array.isArray(message.data.results)) {
            message.data.results.forEach((result) => {
              get().updateToolCallStatus(result.tool_call_id, {
                status: result.success !== false ? "completed" : "error",
                result: {
                  tool_call_id: result.tool_call_id,
                  tool_name: result.tool_name,
                  result: result.result,
                  error: result.error,
                  success: result.success !== false
                },
                error: result.error,
                endTime: timestamp
              });
            });
          }
          break;
        case "agent_handover":
          break;
        default:
          break;
      }
    }
    if ((0, import_core.isDistriArtifact)(message)) {
      switch (message.type) {
        case "plan":
          const planId = message.id;
          if (planId) {
            get().updatePlan(planId, {
              steps: message.steps,
              reasoning: message.reasoning,
              status: "completed",
              endTime: message.timestamp || timestamp
            });
            if (message.steps && Array.isArray(message.steps)) {
              message.steps.forEach((step) => {
                if (step.type === "action" && step.action && step.action.tool_name) {
                  const toolCall = {
                    tool_call_id: step.id || `tool_${Date.now()}`,
                    tool_name: step.action.tool_name,
                    input: step.action.input || {}
                  };
                  get().initToolCall(toolCall, message.timestamp || timestamp, isFromStream);
                }
              });
            }
          }
          get().setStreamingIndicator(void 0);
          break;
      }
    }
  },
  initToolCall: (toolCall, timestamp, isFromStream = false) => {
    set((state) => {
      const newState = { ...state };
      const distriTool = state.tools?.find((t) => t.name === toolCall.tool_name);
      newState.toolCalls.set(toolCall.tool_call_id, {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name || "Unknown Tool",
        input: toolCall.input || {},
        status: "pending",
        startTime: timestamp || Date.now(),
        isExternal: !!distriTool,
        isLiveStream: isFromStream
      });
      return newState;
    });
  },
  updateToolCallStatus: (toolCallId, status) => {
    set((state) => {
      const newState = { ...state };
      const existingToolCall = newState.toolCalls.get(toolCallId);
      if (existingToolCall) {
        newState.toolCalls.set(toolCallId, {
          ...existingToolCall,
          ...status,
          endTime: status.status === "completed" || status.status === "error" ? Date.now() : existingToolCall.endTime
        });
      }
      return newState;
    });
  },
  completeTool: async (toolCall, result) => {
    get().updateToolCallStatus(toolCall.tool_call_id, {
      status: result.success ? "completed" : "error",
      result,
      endTime: Date.now(),
      error: result.error || void 0
    });
    const state = get();
    const pendingExternalTools = Array.from(state.toolCalls.values()).filter(
      (tc) => tc.isExternal && (tc.status === "pending" || tc.status === "running")
    );
    if (pendingExternalTools.length === 0 && state.onAllToolsCompleted) {
      setTimeout(() => {
        state.onAllToolsCompleted?.();
      }, 0);
    }
  },
  initializeTool: (toolCall) => {
    const state = get();
    const distriTool = state.tools?.find((t) => t.name === toolCall.tool_name);
    const commonProps = {
      tool_name: toolCall.tool_name,
      input: toolCall.input,
      startTime: Date.now(),
      isExternal: true,
      status: "running"
    };
    const completeToolFn = (result) => {
      get().completeTool(toolCall, result);
    };
    const toolCallState = state.toolCalls.get(toolCall.tool_call_id);
    if (!distriTool) {
      console.log(`Tool ${toolCall.tool_name} not found in registered tools - creating MissingTool component`);
      const component2 = import_react4.default.createElement(MissingTool, {
        toolCall,
        toolCallState,
        completeTool: completeToolFn,
        tool: {
          name: toolCall.tool_name,
          type: "function",
          description: "Unknown tool",
          input_schema: {},
          autoExecute: false
        }
      });
      get().updateToolCallStatus(toolCall.tool_call_id, {
        ...commonProps,
        component: component2,
        status: "error",
        error: "Tool not found",
        endTime: Date.now()
      });
      return;
    }
    console.log("distriTool", distriTool);
    let component;
    if (distriTool?.type === "ui") {
      const uiTool = distriTool;
      component = uiTool.component({
        toolCall,
        toolCallState,
        completeTool: completeToolFn,
        tool: distriTool
      });
    } else if (distriTool?.type === "function") {
      let fnTool = distriTool;
      fnTool.autoExecute = fnTool.autoExecute === true;
      component = import_react4.default.createElement(DefaultToolActions, {
        toolCall,
        toolCallState: state.toolCalls.get(toolCall.tool_call_id),
        completeTool: completeToolFn,
        tool: fnTool
      });
    }
    get().updateToolCallStatus(toolCall.tool_call_id, {
      ...commonProps,
      component
    });
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
    return completedToolCalls.map((toolCallState) => ({
      tool_call_id: toolCallState.tool_call_id,
      tool_name: toolCallState.tool_name,
      result: toolCallState.result?.result,
      error: toolCallState.result?.error,
      success: toolCallState.result?.success
    }));
  },
  getToolCallById: (toolCallId) => {
    const state = get();
    return state.toolCalls.get(toolCallId) || null;
  },
  getPendingToolCalls: () => {
    const state = get();
    return Array.from(state.toolCalls.values()).filter(
      (toolCall) => toolCall.status === "pending"
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
      tasks: /* @__PURE__ */ new Map(),
      plans: /* @__PURE__ */ new Map(),
      steps: /* @__PURE__ */ new Map(),
      toolCalls: /* @__PURE__ */ new Map(),
      currentRunId: void 0,
      currentTaskId: void 0,
      currentPlanId: void 0,
      streamingIndicator: void 0,
      messages: [],
      isStreaming: false,
      isLoading: false,
      error: null
    });
  },
  // Helper to complete any running steps (for cleanup)
  completeRunningSteps: () => {
    const state = get();
    const now = Date.now();
    state.steps.forEach((step, stepId) => {
      if (step.status === "running") {
        get().updateStep(stepId, {
          status: "completed",
          endTime: now
        });
      }
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
    console.log("\u{1F527} Setting tools in store:", tools?.map((t) => ({ name: t.name, type: t.type })));
    set({ tools });
  },
  setWrapOptions: (wrapOptions) => {
    set({ wrapOptions });
  },
  setOnAllToolsCompleted: (callback) => {
    set({ onAllToolsCompleted: callback });
  }
}));

// src/hooks/registerTools.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
function registerTools({ agent, tools, wrapOptions = {} }) {
  const lastAgentIdRef = (0, import_react5.useRef)(null);
  const setWrapOptions = useChatStateStore((state) => state.setWrapOptions);
  (0, import_react5.useEffect)(() => {
    if (!agent || !tools || tools.length === 0) {
      return;
    }
    if (lastAgentIdRef.current === agent.id) {
      return;
    }
    setWrapOptions(wrapOptions);
    const toolsToRegister = [...defaultTools, ...tools];
    toolsToRegister.forEach((tool) => {
      agent.registerTool(tool);
      console.log(`\u2713 Registered tool: ${tool.name} (type: ${tool.type})`);
    });
    lastAgentIdRef.current = agent.id;
    console.log(`Successfully registered ${tools.length} tools with agent`);
  }, [agent?.id, tools, wrapOptions, setWrapOptions]);
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
      return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ToastToolCall, { ...props });
    }
  }
];

// src/useChat.ts
function useChat({
  threadId,
  onError,
  getMetadata,
  agent,
  tools,
  wrapOptions,
  initialMessages
}) {
  const abortControllerRef = (0, import_react6.useRef)(null);
  const onErrorRef = (0, import_react6.useRef)(onError);
  (0, import_react6.useEffect)(() => {
    onErrorRef.current = onError;
  }, [onError]);
  const getMetadataRef = (0, import_react6.useRef)(getMetadata);
  (0, import_react6.useEffect)(() => {
    getMetadataRef.current = getMetadata;
  }, [getMetadata]);
  const createInvokeContext = (0, import_react6.useCallback)(() => ({
    thread_id: threadId,
    run_id: void 0,
    getMetadata: getMetadataRef.current
  }), [threadId]);
  registerTools({ agent, tools, wrapOptions });
  const chatState = useChatStateStore();
  const isLoading = useChatStateStore((state) => state.isLoading);
  const isStreaming = useChatStateStore((state) => state.isStreaming);
  const {
    processMessage,
    clearAllStates,
    setError,
    setLoading,
    setStreaming,
    setAgent,
    setTools,
    getExternalToolResponses,
    hasPendingToolCalls
  } = chatState;
  (0, import_react6.useEffect)(() => {
    if (initialMessages) {
      chatState.clearAllStates();
      initialMessages.forEach((message) => chatState.processMessage(message, false));
      setTimeout(() => {
        chatState.completeRunningSteps();
        if (cleanupRef.current) {
          cleanupRef.current();
        }
      }, 100);
    }
  }, [initialMessages]);
  const addMessage = (0, import_react6.useCallback)((message) => {
    processMessage(message, false);
  }, [processMessage]);
  (0, import_react6.useEffect)(() => {
    if (agent) {
      setAgent(agent);
    }
    if (tools) {
      setTools(tools);
    }
  }, [agent, tools, setAgent, setTools]);
  const cleanupRef = (0, import_react6.useRef)();
  cleanupRef.current = () => {
    chatState.setStreamingIndicator(void 0);
    setStreaming(false);
    setLoading(false);
  };
  (0, import_react6.useEffect)(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (cleanupRef.current) {
        setTimeout(cleanupRef.current, 0);
      }
    };
  }, []);
  const agentIdRef = (0, import_react6.useRef)(void 0);
  (0, import_react6.useEffect)(() => {
    if (agent?.id !== agentIdRef.current) {
      clearAllStates();
      setError(null);
      agentIdRef.current = agent?.id;
    }
  }, [agent?.id, clearAllStates, setError]);
  const handleStreamEvent = (0, import_react6.useCallback)(
    (event) => {
      processMessage(event, true);
    },
    [processMessage]
  );
  const sendMessage = (0, import_react6.useCallback)(async (content) => {
    if (!agent) return;
    setLoading(true);
    setStreaming(true);
    setError(null);
    chatState.setStreamingIndicator(void 0);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      const parts = typeof content === "string" ? [{ type: "text", data: content }] : content;
      const distriMessage = import_core2.DistriClient.initDistriMessage("user", parts);
      processMessage(distriMessage, false);
      const context = createInvokeContext();
      const a2aMessage = (0, import_core3.convertDistriMessageToA2A)(distriMessage, context);
      const contextMetadata = await getMetadataRef.current?.() || {};
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
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setLoading(false);
      setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, setLoading, setStreaming, setError]);
  const sendMessageStream = (0, import_react6.useCallback)(async (content, role = "user") => {
    if (!agent) return;
    setLoading(true);
    setStreaming(true);
    setError(null);
    chatState.setStreamingIndicator(void 0);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      const parts = typeof content === "string" ? [{ type: "text", data: content }] : content;
      const distriMessage = import_core2.DistriClient.initDistriMessage(role, parts);
      processMessage(distriMessage, false);
      const context = createInvokeContext();
      const a2aMessage = (0, import_core3.convertDistriMessageToA2A)(distriMessage, context);
      const contextMetadata = await getMetadataRef.current?.() || {};
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
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      if (!hasPendingToolCalls()) {
        setLoading(false);
      }
      setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [agent, createInvokeContext, handleStreamEvent, threadId, setLoading, setStreaming, setError, hasPendingToolCalls]);
  const handleExternalToolResponses = (0, import_react6.useCallback)(async () => {
    setStreaming(true);
    const externalResponses = getExternalToolResponses();
    if (externalResponses.length > 0 && !isStreaming && !isLoading) {
      console.log("Sending external tool responses:", externalResponses);
      try {
        const toolResultParts = externalResponses.map((result) => ({
          type: "tool_result",
          data: {
            tool_call_id: result.tool_call_id,
            tool_name: result.tool_name,
            result: result.result,
            success: result.success,
            error: result.error
          }
        }));
        await sendMessageStream(toolResultParts, "user");
        chatState.clearToolResults();
      } catch (err) {
        console.error("Failed to send external tool responses:", err);
        setError(err instanceof Error ? err : new Error("Failed to send tool responses"));
      } finally {
        setStreaming(false);
      }
    }
  }, [chatState, sendMessageStream, getExternalToolResponses, setError, isStreaming, isLoading]);
  const handleExternalToolResponsesRef = (0, import_react6.useRef)(handleExternalToolResponses);
  (0, import_react6.useEffect)(() => {
    handleExternalToolResponsesRef.current = handleExternalToolResponses;
  }, [handleExternalToolResponses]);
  (0, import_react6.useEffect)(() => {
    const callback = async () => {
      if (handleExternalToolResponsesRef.current) {
        await handleExternalToolResponsesRef.current();
      }
    };
    chatState.setOnAllToolsCompleted(callback);
    return () => {
      chatState.setOnAllToolsCompleted(void 0);
    };
  }, []);
  const stopStreaming = (0, import_react6.useCallback)(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  const messages = useChatStateStore((state) => state.messages);
  return {
    isStreaming,
    messages,
    sendMessage,
    sendMessageStream,
    isLoading,
    error: chatState.error,
    hasPendingToolCalls,
    stopStreaming,
    addMessage
  };
}

// src/useAgent.ts
var import_react9 = __toESM(require("react"), 1);
var import_core5 = require("@distri/core");

// src/DistriProvider.tsx
var import_react8 = require("react");
var import_core4 = require("@distri/core");

// src/components/ThemeProvider.tsx
var import_react7 = require("react");
var import_jsx_runtime8 = require("react/jsx-runtime");
var initialState = {
  theme: "system",
  setTheme: () => null
};
var ThemeProviderContext = (0, import_react7.createContext)(initialState);
function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "distri-theme",
  ...props
}) {
  const [theme, setTheme] = (0, import_react7.useState)(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }
    return defaultTheme === "system" ? "dark" : defaultTheme;
  });
  (0, import_react7.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ThemeProviderContext.Provider, { ...props, value, children });
}
var useTheme = () => {
  const context = (0, import_react7.useContext)(ThemeProviderContext);
  if (context === void 0)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

// src/DistriProvider.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
var DistriContext = (0, import_react8.createContext)({
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
  const [client, setClient] = (0, import_react8.useState)(null);
  const [error, setError] = (0, import_react8.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react8.useState)(true);
  (0, import_react8.useEffect)(() => {
    let currentClient = null;
    try {
      debug(config, "[DistriProvider] Initializing client with config:", config);
      currentClient = new import_core4.DistriClient(config);
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
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ThemeProvider, { defaultTheme, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(DistriContext.Provider, { value: contextValue, children }) });
}
function useDistri() {
  const context = (0, import_react8.useContext)(DistriContext);
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
  agentIdOrDef
}) {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agent, setAgent] = (0, import_react9.useState)(null);
  const [loading, setLoading] = (0, import_react9.useState)(false);
  const [error, setError] = (0, import_react9.useState)(null);
  const agentRef = (0, import_react9.useRef)(null);
  const currentAgentIdRef = (0, import_react9.useRef)(null);
  const initializeAgent = (0, import_react9.useCallback)(async () => {
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
      const newAgent = await import_core5.Agent.create(agentIdOrDef, client);
      agentRef.current = newAgent;
      currentAgentIdRef.current = agentIdOrDef;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create agent"));
    } finally {
      setLoading(false);
    }
  }, [client, agentIdOrDef]);
  import_react9.default.useEffect(() => {
    if (!clientLoading && !clientError && client) {
      initializeAgent();
    }
  }, [clientLoading, clientError, client, agentIdOrDef, initializeAgent]);
  import_react9.default.useEffect(() => {
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
var import_react10 = require("react");
function useAgentDefinitions() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = (0, import_react10.useState)([]);
  const [loading, setLoading] = (0, import_react10.useState)(true);
  const [error, setError] = (0, import_react10.useState)(null);
  const fetchAgents = (0, import_react10.useCallback)(async () => {
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
  const getAgent = (0, import_react10.useCallback)(async (agentId) => {
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
  (0, import_react10.useEffect)(() => {
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

// src/useThreads.ts
var import_react11 = require("react");
function useThreads() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = (0, import_react11.useState)([]);
  const [loading, setLoading] = (0, import_react11.useState)(true);
  const [error, setError] = (0, import_react11.useState)(null);
  const fetchThreads = (0, import_react11.useCallback)(async () => {
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
  const fetchThread = (0, import_react11.useCallback)(async (threadId) => {
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
  const deleteThread = (0, import_react11.useCallback)(async (threadId) => {
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
  const updateThread = (0, import_react11.useCallback)(async (threadId, localId) => {
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
  (0, import_react11.useEffect)(() => {
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
  (0, import_react11.useEffect)(() => {
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
var import_react14 = require("react");

// src/components/ChatInput.tsx
var import_react12 = require("react");
var import_lucide_react5 = require("lucide-react");
var import_jsx_runtime10 = require("react/jsx-runtime");
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
  const textareaRef = (0, import_react12.useRef)(null);
  (0, import_react12.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: `relative flex min-h-14 w-full items-end ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "relative flex w-full flex-auto flex-col", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "relative mx-5 flex min-h-14 flex-auto rounded-lg border border-input bg-input items-start h-full", children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "absolute right-2 bottom-0 flex items-center h-full", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      "button",
      {
        onClick: isStreaming ? handleStop : handleSend,
        disabled: !hasContent && !isStreaming,
        className: `h-10 w-10 rounded-md transition-colors flex items-center justify-center ${isStreaming ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : hasContent && !disabled ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted"}`,
        children: isStreaming ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react5.Square, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react5.Send, { className: "h-5 w-5" })
      }
    ) })
  ] }) }) });
};

// src/components/renderers/MessageRenderer.tsx
var import_core7 = require("@distri/core");

// src/components/renderers/UserMessageRenderer.tsx
var import_lucide_react6 = require("lucide-react");

// src/components/ui/avatar.tsx
var React10 = __toESM(require("react"), 1);
var AvatarPrimitive = __toESM(require("@radix-ui/react-avatar"), 1);
var import_jsx_runtime11 = require("react/jsx-runtime");
var Avatar = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
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
var AvatarImage = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
  AvatarPrimitive.Image,
  {
    ref,
    className: cn("aspect-square h-full w-full", className),
    ...props
  }
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;
var AvatarFallback = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
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

// src/components/renderers/TextRenderer.tsx
var import_react_markdown = __toESM(require("react-markdown"), 1);
var import_react_syntax_highlighter = require("react-syntax-highlighter");
var import_prism = require("react-syntax-highlighter/dist/esm/styles/prism");
var import_remark_gfm = __toESM(require("remark-gfm"), 1);
var import_rehype_raw = __toESM(require("rehype-raw"), 1);
var import_jsx_runtime12 = require("react/jsx-runtime");
var TextRenderer = ({ content, className = "" }) => {
  const { text } = content;
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: `prose prose-sm max-w-none ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
    import_react_markdown.default,
    {
      rehypePlugins: [import_rehype_raw.default],
      remarkPlugins: [import_remark_gfm.default],
      remarkRehypeOptions: { passThrough: ["link"] },
      components: {
        code: ({ className: codeClassName, children }) => {
          const match = /language-(\w+)/.exec(codeClassName || "");
          const language = match ? match[1] : "";
          const isInline = !match;
          return !isInline && language ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
            import_react_syntax_highlighter.Prism,
            {
              style: import_prism.tomorrow,
              language,
              PreTag: "div",
              className: "!mt-0 !mb-0",
              children: String(children).replace(/\n$/, "")
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("code", { className: "bg-gray-100 px-1 py-0.5 rounded text-sm font-mono", children });
        },
        p: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "mb-2 last:mb-0", children }),
        ul: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("ul", { className: "list-disc list-inside mb-2", children }),
        ol: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("ol", { className: "list-decimal list-inside mb-2", children }),
        blockquote: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("blockquote", { className: "border-l-4 border-gray-300 pl-4 italic text-gray-600", children }),
        h1: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h1", { className: "text-lg font-bold mb-2", children }),
        h2: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h2", { className: "text-base font-bold mb-2", children }),
        h3: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h3", { className: "text-sm font-bold mb-1", children }),
        h4: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h4", { className: "text-sm font-semibold mb-1", children }),
        h5: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h5", { className: "text-xs font-semibold mb-1", children }),
        h6: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h6", { className: "text-xs font-semibold mb-1", children })
      },
      children: text
    }
  ) });
};
var TextRenderer_default = TextRenderer;

// src/components/renderers/utils.tsx
var import_jsx_runtime13 = require("react/jsx-runtime");
function extractContent(message) {
  let text = "";
  let hasMarkdown = false;
  let hasCode = false;
  let hasLinks = false;
  let hasImages = false;
  if ("parts" in message && Array.isArray(message.parts)) {
    const distriMessage = message;
    const textParts = distriMessage.parts?.filter((p) => p.type === "text" && p.data)?.map((p) => p.data)?.filter((text2) => text2 && text2.trim()) || [];
    text = textParts.join(" ").trim();
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
  const { text } = content;
  if (!text || !text.trim()) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(TextRenderer_default, { content });
}

// src/components/renderers/UserMessageRenderer.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
var UserMessageRenderer = ({
  message,
  className = "",
  avatar
}) => {
  const content = extractContent(message);
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: `flex items-start gap-4 py-6 ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Avatar, { className: "h-8 w-8 flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(AvatarFallback, { className: "bg-secondary text-secondary-foreground", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_lucide_react6.User, { className: "h-4 w-4" }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "w-full", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: renderTextContent(content) }) })
  ] });
};

// src/components/renderers/StreamingTextRenderer.tsx
var import_react13 = require("react");
var import_react_markdown2 = __toESM(require("react-markdown"), 1);
var import_react_syntax_highlighter2 = require("react-syntax-highlighter");
var import_prism2 = require("react-syntax-highlighter/dist/esm/styles/prism");
var import_remark_gfm2 = __toESM(require("remark-gfm"), 1);
var import_rehype_raw2 = __toESM(require("rehype-raw"), 1);
var import_jsx_runtime15 = require("react/jsx-runtime");
function processAgentResponseBlocks(text) {
  if (!text) return text;
  let processed = text;
  processed = processed.replace(/<agent_response[^>]*>\s*<\/agent_response>/gi, "");
  processed = processed.replace(/<agent_response[^>]*>\s*$/gi, "");
  processed = processed.replace(/^\s*<\/agent_response>/gi, "");
  const agentResponseRegex = /<agent_response[^>]*>([\s\S]*?)<\/agent_response>/gi;
  processed = processed.replace(agentResponseRegex, (_match, content) => {
    const thoughtMatches = content.match(/<thought[^>]*>([\s\S]*?)<\/thought>/gi);
    if (thoughtMatches) {
      const thoughtContent = thoughtMatches.map((thoughtMatch) => {
        const thoughtText = thoughtMatch.replace(/<\/?thought[^>]*>/gi, "").trim();
        if (thoughtText) {
          return `<thought>
${thoughtText}
</thought>`;
        }
        return "";
      }).filter(Boolean).join("\n\n");
      return thoughtContent;
    }
    return "";
  });
  processed = processed.replace(/<\/?agent_response[^>]*>/gi, "");
  processed = processed.replace(/\n\s*\n\s*\n/g, "\n\n").trim();
  return processed;
}
var StreamingTextRenderer = ({
  text,
  isStreaming = false,
  className = ""
}) => {
  const renderedContent = (0, import_react13.useMemo)(() => {
    const cleanedText = processAgentResponseBlocks(text);
    if (!cleanedText.trim()) {
      return null;
    }
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: `prose prose-sm max-w-none ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      import_react_markdown2.default,
      {
        rehypePlugins: [import_rehype_raw2.default],
        remarkPlugins: [import_remark_gfm2.default],
        remarkRehypeOptions: {
          passThrough: ["link"],
          allowDangerousHtml: true
        },
        components: {
          // Handle custom AI tags - cast to any to bypass TypeScript component restrictions
          thought: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { className: "inline-flex items-start gap-1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "text-muted-foreground", children: "\u{1F4AD}" }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "text-foreground", children })
          ] }),
          thinking: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "border-l-4 border-blue-400/30 pl-4 my-3 bg-blue-50/20 p-3 rounded-r-md", children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "text-sm text-blue-600 font-medium mb-1", children: "\u{1F914} Processing" }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "text-sm text-muted-foreground italic", children })
          ] }),
          action: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "border-l-4 border-green-400/30 pl-4 my-3 bg-green-50/20 p-3 rounded-r-md", children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "text-sm text-green-600 font-medium mb-1", children: "\u26A1 Action" }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "text-sm text-muted-foreground", children })
          ] }),
          code: ({ className: codeClassName, children }) => {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const language = match ? match[1] : "";
            const isInline = !match;
            return !isInline && language ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
              import_react_syntax_highlighter2.Prism,
              {
                style: import_prism2.tomorrow,
                language,
                PreTag: "div",
                className: "!mt-0 !mb-0 rounded-md",
                children: String(children).replace(/\n$/, "")
              }
            ) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("code", { className: "bg-muted px-2 py-1 rounded text-sm font-mono text-foreground", children });
          },
          p: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "mb-3 last:mb-0 leading-relaxed text-foreground", children }),
          ul: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("ul", { className: "list-disc list-inside mb-3 space-y-1 text-foreground", children }),
          ol: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("ol", { className: "list-decimal list-inside mb-3 space-y-1 text-foreground", children }),
          blockquote: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("blockquote", { className: "border-l-4 border-border pl-4 italic text-muted-foreground my-3", children }),
          h1: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("h1", { className: "text-xl font-bold mb-3 text-foreground", children }),
          h2: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("h2", { className: "text-lg font-bold mb-3 text-foreground", children }),
          h3: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("h3", { className: "text-base font-bold mb-2 text-foreground", children }),
          h4: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("h4", { className: "text-sm font-semibold mb-2 text-foreground", children }),
          h5: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("h5", { className: "text-sm font-semibold mb-1 text-foreground", children }),
          h6: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("h6", { className: "text-xs font-semibold mb-1 text-foreground", children }),
          strong: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("strong", { className: "font-semibold text-foreground", children }),
          em: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("em", { className: "italic text-foreground", children }),
          pre: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("pre", { className: "bg-muted border border-border rounded-md p-3 overflow-x-auto mb-3", children }),
          table: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "overflow-x-auto mb-3", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("table", { className: "min-w-full border-collapse border border-border", children }) }),
          th: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("th", { className: "border border-border px-3 py-2 bg-muted font-semibold text-left", children }),
          td: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("td", { className: "border border-border px-3 py-2", children }),
          a: ({ children, href }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
            "a",
            {
              href,
              className: "text-primary underline hover:no-underline",
              target: "_blank",
              rel: "noopener noreferrer",
              children
            }
          )
        },
        children: cleanedText
      }
    ) });
  }, [text, className]);
  if (!renderedContent) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "relative", children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "transition-all duration-200 ease-out", children: renderedContent }),
    isStreaming && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "inline-block w-0.5 h-4 bg-primary animate-pulse ml-1 transition-opacity duration-200" })
  ] });
};

// src/components/renderers/AssistantMessageRenderer.tsx
var import_jsx_runtime16 = require("react/jsx-runtime");
var AssistantMessageRenderer = ({
  message,
  className = ""
}) => {
  const steps = useChatStateStore((state) => state.steps);
  const content = extractContent(message);
  const stepId = message.step_id;
  const step = stepId ? steps.get(stepId) : null;
  const isStreaming = step?.status === "running";
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: `flex items-start gap-4 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "w-full", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
    StreamingTextRenderer,
    {
      text: content.text,
      isStreaming
    }
  ) }) });
};

// src/components/renderers/ToolMessageRenderer.tsx
var import_lucide_react7 = require("lucide-react");
var import_jsx_runtime17 = require("react/jsx-runtime");
var ToolMessageRenderer = ({
  message,
  className = "",
  avatar
}) => {
  const content = extractContent(message);
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: `flex items-start gap-4 py-6 ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Avatar, { className: "h-8 w-8 flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(AvatarFallback, { className: "bg-accent text-accent-foreground", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(import_lucide_react7.Wrench, { className: "h-4 w-4" }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "w-full", children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "text-sm font-medium text-foreground mb-3", children: "Tool Response" }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: renderTextContent(content) })
    ] })
  ] });
};

// src/components/renderers/PlanRenderer.tsx
var import_lucide_react8 = require("lucide-react");
var import_jsx_runtime18 = require("react/jsx-runtime");
var formatDuration = (milliseconds) => {
  const seconds = (milliseconds / 1e3).toFixed(2);
  return `${seconds}s`;
};
var StepRenderer = ({ step, index }) => {
  if (step.type === "thought") {
    const thoughtStep = step;
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "border border-border rounded-lg p-4 mb-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-medium", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react8.Eye, { className: "h-3 w-3" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("h4", { className: "font-medium text-foreground", children: "Thinking" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "text-sm text-muted-foreground pl-8", children: thoughtStep.message })
    ] });
  }
  if (step.type === "action") {
    const actionStep = step;
    const { action } = actionStep;
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "border border-border rounded-lg p-4 mb-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-medium", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react8.Zap, { className: "h-3 w-3" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("h4", { className: "font-medium text-foreground", children: action.tool_name ? `Using ${action.tool_name}` : "Action" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "pl-8 space-y-2", children: [
        action.tool_name && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "text-sm", children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "font-medium text-muted-foreground", children: "Tool:" }),
          " ",
          action.tool_name
        ] }),
        action.input && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "text-sm", children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "font-medium text-muted-foreground", children: "Input:" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("pre", { className: "mt-1 text-xs bg-muted p-2 rounded border overflow-x-auto", children: typeof action.input === "string" ? action.input : JSON.stringify(action.input, null, 2) })
        ] }),
        action.prompt && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "text-sm", children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "font-medium text-muted-foreground", children: "Prompt:" }),
          " ",
          action.prompt
        ] })
      ] })
    ] });
  }
  if (step.type === "code") {
    const codeStep = step;
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "border border-border rounded-lg p-4 mb-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "flex items-center justify-center w-6 h-6 bg-purple-500 text-white rounded-full text-xs font-medium", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react8.Code, { className: "h-3 w-3" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("h4", { className: "font-medium text-foreground", children: [
          "Code (",
          codeStep.language,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "pl-8", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("pre", { className: "text-xs bg-muted p-3 rounded border overflow-x-auto", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("code", { children: codeStep.code }) }) })
    ] });
  }
  if ("type" in step && step.type === "react_step") {
    const reactStep = step;
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "border border-border rounded-lg p-4 mb-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium", children: index + 1 }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("h4", { className: "font-medium text-foreground", children: "ReAct Step" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "pl-8 space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "text-sm", children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "font-medium text-muted-foreground", children: "Thought:" }),
          " ",
          reactStep.thought
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "text-sm", children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "font-medium text-muted-foreground", children: "Action:" }),
          " ",
          reactStep.action
        ] })
      ] })
    ] });
  }
  return null;
};
var PlanRenderer = ({
  message,
  className = ""
}) => {
  const plans = useChatStateStore((state) => state.plans);
  const planState = plans.get(message.id);
  const isPlan = message.type === "plan";
  if (!isPlan) return null;
  const plan = message;
  const thinkingDuration = planState?.thinkingDuration || 0;
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: `flex items-start gap-4 py-6 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "w-full", children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react8.Eye, { className: "h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { className: "text-sm text-muted-foreground font-medium", children: [
        "Thought for ",
        formatDuration(thinkingDuration)
      ] })
    ] }),
    plan.reasoning && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "mb-6", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "bg-muted/30 border border-border rounded-lg p-4", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: plan.reasoning }) }) }),
    plan.steps && plan.steps.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "space-y-4", children: plan.steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(StepRenderer, { step, index }, step.id || index)).filter(Boolean) })
  ] }) });
};

// src/components/renderers/StepRenderer.tsx
var import_lucide_react9 = require("lucide-react");
var import_jsx_runtime19 = require("react/jsx-runtime");
var StepRenderer2 = ({
  step,
  className = ""
}) => {
  const getStatusIcon = () => {
    switch (step.status) {
      case "running":
        return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_lucide_react9.Loader2, { className: "h-4 w-4 text-primary animate-spin" });
      case "completed":
        return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_lucide_react9.CheckCircle, { className: "h-4 w-4 text-primary" });
      case "failed":
        return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "h-4 w-4 text-destructive", children: "\u2717" });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_lucide_react9.Loader2, { className: "h-4 w-4 text-muted-foreground animate-spin" });
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
  return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: `py-6 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "p-4 bg-muted/50 rounded-lg border", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "flex items-center gap-3", children: [
    getStatusIcon(),
    /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "text-sm font-medium text-foreground", children: [
        "Step ",
        step.index + 1,
        ": ",
        step.title
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "text-xs text-muted-foreground", children: getStatusText() })
    ] })
  ] }) }) }) });
};

// src/components/renderers/ToolCallRenderer.tsx
var import_lucide_react10 = require("lucide-react");
var import_jsx_runtime20 = require("react/jsx-runtime");
var ToolCallRenderer = ({
  toolCall,
  isExpanded,
  onToggle,
  className = ""
}) => {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case "pending":
        return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_lucide_react10.Clock, { className: "h-3 w-3 text-muted-foreground" });
      case "running":
        return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_lucide_react10.Loader2, { className: "h-3 w-3 text-primary animate-spin" });
      case "completed":
        return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_lucide_react10.CheckCircle, { className: "h-3 w-3 text-primary" });
      case "error":
        return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_lucide_react10.XCircle, { className: "h-3 w-3 text-destructive" });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_lucide_react10.Clock, { className: "h-3 w-3 text-muted-foreground" });
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
  return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: `flex items-start gap-4 py-6 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "w-full", children: /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "border rounded-lg bg-background overflow-hidden", children: [
    /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "p-3 border-b border-border", children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
            "button",
            {
              onClick: onToggle,
              className: "p-1 hover:bg-muted rounded transition-colors",
              disabled: !canCollapse,
              children: canCollapse ? isExpanded ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_lucide_react10.ChevronDown, { className: "h-3 w-3 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_lucide_react10.ChevronRight, { className: "h-3 w-3 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "h-3 w-3" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_lucide_react10.Wrench, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: "text-sm font-medium text-foreground", children: toolCall.tool_name })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "flex items-center gap-2", children: [
          getStatusIcon(),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: "text-xs text-muted-foreground", children: getStatusText() })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "mt-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "text-xs text-muted-foreground mb-1", children: "Input:" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "text-xs font-mono bg-muted p-2 rounded border", children: JSON.stringify(toolCall.input, null, 2) })
      ] }),
      toolCall.component && /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "mt-3", children: toolCall.component })
    ] }),
    canCollapse && isExpanded && /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "p-3 bg-muted/30", children: [
      toolCall.error && /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "mb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "text-xs text-destructive font-medium mb-1", children: "Error:" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20", children: toolCall.error })
      ] }),
      toolCall.result && /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "text-xs text-muted-foreground font-medium mb-1", children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "text-xs font-mono bg-background p-2 rounded border", children: JSON.stringify(toolCall.result, null, 2) })
      ] })
    ] })
  ] }) }) });
};

// src/components/ui/badge.tsx
var import_class_variance_authority = require("class-variance-authority");
var import_jsx_runtime21 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: cn(badgeVariants({ variant }), className), ...props });
}

// src/components/ui/card.tsx
var React12 = __toESM(require("react"), 1);
var import_jsx_runtime22 = require("react/jsx-runtime");
var Card = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
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
var CardHeader = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
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
var CardDescription = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
  "p",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";

// src/components/renderers/ToolResultRenderer.tsx
var import_lucide_react11 = require("lucide-react");
var import_jsx_runtime23 = require("react/jsx-runtime");
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
      return /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_lucide_react11.CheckCircle, { className: "w-4 h-4 text-primary" });
    } else {
      return /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_lucide_react11.XCircle, { className: "w-4 h-4 text-destructive" });
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
  return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(Card, { className: `mb-4 ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(CardHeader, { className: "pb-3", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "flex items-center space-x-2", children: [
        getStatusIcon(),
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(CardTitle, { className: "text-sm font-medium", children: toolName }),
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(Badge, { variant: "secondary", className: getStatusColor(), children: success ? "Success" : "Failed" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "text-xs text-muted-foreground", children: [
        "ID: ",
        toolCallId
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(CardContent, { className: "pt-0 space-y-3", children: [
      result && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "text-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("strong", { children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-y-auto", children: typeof result === "string" ? result : JSON.stringify(result, null, 2) })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "text-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("strong", { children: "Error:" }),
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-destructive/10 p-2 rounded mt-1 text-destructive", children: error })
      ] }),
      onSendResponse && success && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "flex justify-end", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
        Button,
        {
          size: "sm",
          onClick: handleSendResponse,
          className: "flex items-center space-x-1",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_lucide_react11.Send, { className: "w-3 h-3" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { children: "Send Response" })
          ]
        }
      ) })
    ] })
  ] });
}

// src/components/renderers/DebugRenderer.tsx
var import_lucide_react12 = require("lucide-react");
var import_jsx_runtime24 = require("react/jsx-runtime");
var DebugRenderer = ({
  message,
  className = "",
  avatar
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: `flex items-start gap-4 py-3 px-2 ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(Avatar, { className: "h-8 w-8", children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(AvatarFallback, { className: "bg-muted text-muted-foreground", children: avatar || /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_lucide_react12.Bug, { className: "h-4 w-4" }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "w-full", children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "text-sm font-medium text-foreground mb-2", children: "Debug" }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("pre", { className: "text-xs bg-muted p-2 rounded border overflow-auto", children: JSON.stringify(message, null, 2) }) })
    ] })
  ] });
};

// src/components/renderers/StepBasedRenderer.tsx
var import_core6 = require("@distri/core");

// src/components/renderers/LoadingShimmer.tsx
var import_jsx_runtime25 = require("react/jsx-runtime");
var LoadingShimmer = ({
  text,
  className = ""
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { className: `relative ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("span", { className: "relative inline-block font-medium px-1 py-0.5 rounded overflow-hidden", children: [
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
        "span",
        {
          className: "relative z-10 flex items-center gap-1 text-start align-middle truncate",
          style: { opacity: 1 },
          children: text
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("span", { className: "absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%] animate-shimmer" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("style", { children: `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      ` })
  ] });
};

// src/components/renderers/StepBasedRenderer.tsx
var import_lucide_react13 = require("lucide-react");
var import_jsx_runtime26 = require("react/jsx-runtime");
var StepIndicator = ({ step }) => {
  const getStatusIcon = () => {
    switch (step.status) {
      case "running":
        return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { className: "animate-spin rounded-full h-3 w-3 border-b-2 border-primary" });
      case "completed":
        return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(import_lucide_react13.CheckCircle, { className: "h-3 w-3 text-green-500" });
      case "failed":
        return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(import_lucide_react13.AlertCircle, { className: "h-3 w-3 text-red-500" });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(import_lucide_react13.Clock, { className: "h-3 w-3 text-muted-foreground" });
    }
  };
  const getStatusText = () => {
    switch (step.status) {
      case "running":
        return step.title || "AI is writing...";
      case "completed":
        return null;
      // Don't show completed text, just the checkmark
      case "failed":
        return "Error occurred";
      default:
        return "Pending";
    }
  };
  const renderShimmerForRunning = () => {
    if (step.status !== "running") return null;
    const text = step.title || "AI is writing...";
    return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(LoadingShimmer, { text, className: "text-sm" });
  };
  const getDuration = () => {
    if (step.startTime) {
      const endTime = step.endTime || Date.now();
      const duration = (endTime - step.startTime) / 1e3;
      return duration < 1 ? "< 1s" : `${duration.toFixed(1)}s`;
    }
    return "";
  };
  if (step.status === "completed") {
    return /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "flex items-center gap-2 text-xs text-muted-foreground mb-1 opacity-60", children: [
      getStatusIcon(),
      /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "font-medium", children: step.title }),
      /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("span", { children: [
        "(",
        getDuration(),
        ")"
      ] })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "flex items-center gap-2 text-sm text-muted-foreground mb-3", children: [
    getStatusIcon(),
    step.status === "running" ? renderShimmerForRunning() : /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "font-medium", children: getStatusText() })
  ] });
};
var StepBasedRenderer = ({
  message
}) => {
  const steps = useChatStateStore((state) => state.steps);
  if (!(0, import_core6.isDistriMessage)(message)) {
    return null;
  }
  const distriMessage = message;
  const stepId = distriMessage.step_id;
  const step = stepId ? steps.get(stepId) : null;
  if (distriMessage.role === "user") {
    return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(UserMessageRenderer, { message: distriMessage });
  }
  if (distriMessage.role === "assistant") {
    return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { className: "flex items-start gap-4 py-6", children: /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "w-full", children: [
      step && /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(StepIndicator, { step }),
      /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { className: "transition-all duration-200 ease-in-out", children: /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(AssistantMessageRenderer, { message: distriMessage }) })
    ] }) });
  }
  return null;
};

// src/components/renderers/MessageRenderer.tsx
var import_jsx_runtime27 = require("react/jsx-runtime");
var RendererWrapper = ({
  children,
  className = ""
}) => /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: `max-w-3xl mx-auto w-full ${className}`, children });
function MessageRenderer({
  message,
  index,
  isExpanded = false,
  onToggle = () => {
  }
}) {
  const steps = useChatStateStore((state) => state.steps);
  const toolCalls = useChatStateStore((state) => state.toolCalls);
  if ((0, import_core7.isDistriMessage)(message)) {
    const distriMessage = message;
    const textContent = distriMessage.parts.filter((part) => part.type === "text").map((part) => part.data).join("").trim();
    if (!textContent) {
      return null;
    }
  }
  if ((0, import_core7.isDistriMessage)(message)) {
    const distriMessage = message;
    switch (distriMessage.role) {
      case "user":
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
          UserMessageRenderer,
          {
            message: distriMessage
          }
        ) }, `user-${index}`);
      case "assistant":
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
          StepBasedRenderer,
          {
            message: distriMessage
          }
        ) }, `assistant-${index}`);
      case "tool":
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
          ToolMessageRenderer,
          {
            message: distriMessage
          }
        ) }, `tool-${index}`);
      default:
        return null;
    }
  }
  if ((0, import_core7.isDistriEvent)(message)) {
    const event = message;
    switch (event.type) {
      case "run_started":
        return null;
      case "plan_started":
        return null;
      case "plan_finished":
        return null;
      case "plan_pruned":
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "p-3 bg-muted rounded border", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "text-sm text-muted-foreground", children: [
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
        const step = steps.get(stepId);
        if (step) {
          return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
            StepRenderer2,
            {
              step
            }
          ) }, `step-${stepId}`);
        }
        return null;
      case "step_completed":
        return null;
      case "tool_call_start":
        const toolCallStartId = event.data.tool_call_id;
        const toolCallStartState = toolCalls.get(toolCallStartId);
        if (toolCallStartState?.status === "running") {
          return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "flex items-center space-x-2 p-2 bg-muted rounded", children: [
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-primary" }),
            /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("span", { className: "text-sm", children: [
              "Calling tool: ",
              event.data?.tool_call_name || "unknown",
              " \u23F3"
            ] })
          ] }) }, `tool-call-start-${index}`);
        }
        return null;
      case "tool_call_end":
        return null;
      case "tool_call_result":
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "p-3 bg-primary/10 border border-primary/20 rounded", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "text-sm text-primary", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("strong", { children: "Tool result:" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("pre", { className: "mt-1 text-xs overflow-x-auto", children: event.data?.result || "No result" })
        ] }) }) }, `tool-call-result-${index}`);
      case "tool_rejected":
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "p-3 bg-destructive/10 border border-destructive/20 rounded", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "text-sm text-destructive", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("strong", { children: "Tool rejected:" }),
          " ",
          event.data?.reason || "Unknown reason"
        ] }) }) }, `tool-rejected-${index}`);
      case "agent_handover":
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "p-3 bg-muted rounded border", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "text-sm text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("strong", { children: "Handover to:" }),
          " ",
          event.data?.to_agent || "unknown agent"
        ] }) }) }, `handover-${index}`);
      case "feedback_received":
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "p-3 bg-muted rounded border", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "text-sm text-muted-foreground", children: [
          "You said: ",
          event.data?.feedback || ""
        ] }) }) }, `feedback-${index}`);
      case "run_finished":
        return null;
      case "run_error":
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { className: "py-6", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "p-3 bg-destructive/10 border border-destructive/20 rounded", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "text-sm text-destructive", children: [
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("strong", { children: "Error:" }),
            " ",
            event.data?.message || "Unknown error occurred"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("button", { className: "mt-2 text-xs text-destructive underline", children: "Retry" })
        ] }) }, `run-error-${index}`);
      default:
        return null;
    }
  }
  if ((0, import_core7.isDistriArtifact)(message)) {
    const artifact = message;
    switch (artifact.type) {
      case "plan":
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
          PlanRenderer,
          {
            message: artifact
          }
        ) }, `plan-${index}`);
      case "llm_response":
        if (artifact.content && artifact.content.length > 0) {
          return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
            AssistantMessageRenderer,
            {
              message: artifact
            }
          ) }, `assistant-${index}`);
        }
        if (artifact.tool_calls && Array.isArray(artifact.tool_calls)) {
          return artifact.tool_calls.map((toolCall, toolIndex) => {
            const toolCallState = toolCalls.get(toolCall.tool_call_id);
            if (!toolCallState) return null;
            const toolCallStartState = toolCalls.get(toolCall.tool_call_id);
            if (toolCallStartState?.component) {
              return toolCallStartState.component;
            } else if (toolCallStartState?.status === "pending") {
              return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
                ToolCallRenderer,
                {
                  toolCall: toolCallState,
                  isExpanded,
                  onToggle
                }
              ) }, `tool-call-${index}-${toolIndex}`);
            }
            return null;
          }).filter(Boolean);
        }
        return null;
      case "tool_results":
        if (artifact.results && Array.isArray(artifact.results)) {
          const toolResultsArtifact = artifact;
          return artifact.results.map((result, resultIndex) => {
            const success = result.success !== void 0 ? result.success : toolResultsArtifact.success ?? (result.status ? result.status === "completed" : true);
            const error = result.error !== void 0 ? result.error : toolResultsArtifact.success ? void 0 : toolResultsArtifact.reason;
            return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
              ToolResultRenderer,
              {
                toolCallId: result.tool_call_id,
                toolName: result.tool_name || "Unknown Tool",
                result: result.result,
                success,
                error: error || void 0
              }
            ) }, `tool-result-${index}-${resultIndex}`);
          });
        }
        return null;
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RendererWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
          DebugRenderer,
          {
            message: artifact
          }
        ) }, `artifact-${index}`);
        return null;
    }
  }
  return null;
}

// src/components/renderers/ThinkingRenderer.tsx
var import_lucide_react14 = require("lucide-react");
var import_jsx_runtime28 = require("react/jsx-runtime");
var ThinkingRenderer = ({
  indicator,
  className = "",
  thoughtText
}) => {
  const getThinkingComponent = () => {
    switch (indicator) {
      case "typing":
        return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "flex items-center gap-2 mb-3", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150" })
        ] }) });
      case "generating":
        return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "flex items-center gap-2 mb-3", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(LoadingShimmer, { text: "Generating response", className: "text-sm" }) });
      case "thinking":
        return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(import_lucide_react14.Sparkles, { className: "h-3 w-3 text-primary" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
            LoadingShimmer,
            {
              text: thoughtText || "Thinking...",
              className: "text-sm"
            }
          )
        ] });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(import_lucide_react14.Brain, { className: "h-3 w-3 text-muted-foreground" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
            LoadingShimmer,
            {
              text: thoughtText || "Thinking...",
              className: "text-sm"
            }
          )
        ] });
    }
  };
  const component = getThinkingComponent();
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: `flex items-start gap-3 py-6 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "w-full", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: component }) }) });
};

// src/components/renderers/TypingIndicator.tsx
var import_jsx_runtime29 = require("react/jsx-runtime");
var TypingIndicator = () => {
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "flex items-center gap-4 py-6", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "w-full", children: [
    /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center gap-2 text-sm text-muted-foreground mb-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "animate-spin rounded-full h-3 w-3 border-b-2 border-primary" }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { children: "AI is thinking..." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "flex items-center space-x-1 p-3 bg-muted/30 rounded-lg w-fit", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex space-x-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
        "div",
        {
          className: "h-2 w-2 bg-muted-foreground rounded-full animate-bounce",
          style: { animationDelay: "0ms" }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
        "div",
        {
          className: "h-2 w-2 bg-muted-foreground rounded-full animate-bounce",
          style: { animationDelay: "150ms" }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
        "div",
        {
          className: "h-2 w-2 bg-muted-foreground rounded-full animate-bounce",
          style: { animationDelay: "300ms" }
        }
      )
    ] }) })
  ] }) });
};

// src/components/Chat.tsx
var import_jsx_runtime30 = require("react/jsx-runtime");
var RendererWrapper2 = ({
  children,
  className = ""
}) => /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: `max-w-3xl mx-auto w-full ${className}`, children });
function Chat({
  threadId,
  agent,
  onMessage,
  onError,
  getMetadata,
  tools,
  wrapOptions,
  initialMessages,
  theme = "auto",
  debug: debug2 = false
}) {
  const [input, setInput] = (0, import_react14.useState)("");
  const [expandedTools, setExpandedTools] = (0, import_react14.useState)(/* @__PURE__ */ new Set());
  const messagesEndRef = (0, import_react14.useRef)(null);
  const {
    sendMessage,
    stopStreaming,
    isStreaming,
    isLoading,
    error,
    messages
  } = useChat({
    threadId,
    agent,
    onMessage,
    onError,
    getMetadata,
    tools,
    wrapOptions,
    initialMessages
  });
  const toolCalls = useChatStateStore((state) => state.toolCalls);
  const currentPlanId = useChatStateStore((state) => state.currentPlanId);
  const plans = useChatStateStore((state) => state.plans);
  const hasPendingToolCalls = useChatStateStore((state) => state.hasPendingToolCalls);
  const streamingIndicator = useChatStateStore((state) => state.streamingIndicator);
  const currentThought = useChatStateStore((state) => state.currentThought);
  const setDebug = useChatStateStore((state) => state.setDebug);
  (0, import_react14.useEffect)(() => {
    setDebug(debug2);
  }, [debug2, setDebug]);
  const currentPlan = currentPlanId ? plans.get(currentPlanId) || null : null;
  const pendingToolCalls = Array.from(toolCalls.values()).filter(
    (toolCall) => toolCall.status === "pending" || toolCall.status === "running"
  );
  const handleSendMessage = (0, import_react14.useCallback)(async (content) => {
    if (!content.trim()) return;
    setInput("");
    await sendMessage(content);
  }, [sendMessage]);
  const handleStopStreaming = (0, import_react14.useCallback)(() => {
    stopStreaming();
  }, [stopStreaming]);
  const toggleToolExpansion = (0, import_react14.useCallback)((toolId) => {
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
  (0, import_react14.useEffect)(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  (0, import_react14.useEffect)(() => {
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
      const renderedMessage = /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
        MessageRenderer,
        {
          message,
          index,
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
    const standaloneToolCalls = Array.from(toolCalls.values()).filter(
      (toolCall) => toolCall.status === "pending" || toolCall.status === "running"
    );
    if (standaloneToolCalls.length > 0) {
      console.log("\u{1F527} Found standalone tool calls:", standaloneToolCalls.length, standaloneToolCalls.map((tc) => ({ name: tc.tool_name, status: tc.status, hasComponent: !!tc.component })));
    }
    standaloneToolCalls.forEach((toolCall) => {
      if (toolCall.component) {
        elements.push(
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(RendererWrapper2, { children: toolCall.component }, `standalone-tool-${toolCall.tool_call_id}`)
        );
      } else {
        console.log("\u{1F527} Rendering standalone tool call with ToolCallRenderer:", toolCall.tool_name);
        elements.push(
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(RendererWrapper2, { children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
            ToolCallRenderer,
            {
              toolCall,
              isExpanded: expandedTools.has(toolCall.tool_call_id),
              onToggle: () => toggleToolExpansion(toolCall.tool_call_id)
            }
          ) }, `standalone-fallback-${toolCall.tool_call_id}`)
        );
      }
    });
    return elements;
  };
  const renderThinkingIndicator = () => {
    if (streamingIndicator === "typing") {
      return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(RendererWrapper2, { children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(TypingIndicator, {}) }, `typing-indicator`);
    } else if (streamingIndicator) {
      return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(RendererWrapper2, { children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
        ThinkingRenderer,
        {
          indicator: streamingIndicator,
          thoughtText: currentThought
        }
      ) }, `thinking-${streamingIndicator}`);
    }
    return null;
  };
  return /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: `flex flex-col h-full ${getThemeClasses()}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "flex-1 overflow-y-auto bg-background text-foreground", children: /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: "max-w-4xl mx-auto px-4 py-8", children: [
      renderMessages(),
      renderThinkingIndicator(),
      process.env.NODE_ENV === "development" && false,
      /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { ref: messagesEndRef })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "border-t border-border bg-background", children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "max-w-4xl mx-auto px-4 py-4", children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
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
    error && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "p-4 bg-destructive/10 border-l-4 border-destructive", children: /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: "text-destructive text-xs", children: [
      /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("strong", { children: "Error:" }),
      " ",
      error.message
    ] }) })
  ] });
}

// src/components/AgentList.tsx
var import_react15 = __toESM(require("react"), 1);
var import_lucide_react15 = require("lucide-react");
var import_jsx_runtime31 = require("react/jsx-runtime");

// src/components/AgentSelect.tsx
var import_lucide_react17 = require("lucide-react");

// src/components/ui/select.tsx
var React15 = __toESM(require("react"), 1);
var SelectPrimitive = __toESM(require("@radix-ui/react-select"), 1);
var import_lucide_react16 = require("lucide-react");
var import_jsx_runtime32 = require("react/jsx-runtime");
var Select = SelectPrimitive.Root;
var SelectGroup = SelectPrimitive.Group;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React15.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(
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
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_lucide_react16.ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_lucide_react16.ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_lucide_react16.ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React15.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(SelectPrimitive.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(
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
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(SelectScrollUpButton, {}),
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React15.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_lucide_react16.Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// src/components/AgentSelect.tsx
var import_jsx_runtime33 = require("react/jsx-runtime");
var AgentSelect = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  className = "",
  placeholder = "Select an agent...",
  disabled = false
}) => {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(Select, { value: selectedAgentId, onValueChange: onAgentSelect, disabled, children: [
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(SelectTrigger, { className: `w-full ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react17.Bot, { className: "h-4 w-4" }),
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(SelectValue, { placeholder, children: selectedAgent?.name || placeholder })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(SelectContent, { children: agents.map((agent) => /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(SelectItem, { value: agent.id, children: /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react17.Bot, { className: "h-4 w-4" }),
      /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("span", { className: "font-medium", children: agent.name }),
        agent.description && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("span", { className: "text-xs text-muted-foreground", children: agent.description })
      ] })
    ] }) }, agent.id)) })
  ] });
};

// src/components/AgentsPage.tsx
var import_jsx_runtime34 = require("react/jsx-runtime");

// src/components/AppSidebar.tsx
var import_react16 = require("react");
var import_lucide_react21 = require("lucide-react");

// src/components/ui/sidebar.tsx
var React19 = __toESM(require("react"), 1);
var import_react_slot = require("@radix-ui/react-slot");
var import_class_variance_authority3 = require("class-variance-authority");
var import_lucide_react19 = require("lucide-react");

// src/components/ui/separator.tsx
var React16 = __toESM(require("react"), 1);
var SeparatorPrimitive = __toESM(require("@radix-ui/react-separator"), 1);
var import_jsx_runtime35 = require("react/jsx-runtime");
var Separator2 = React16.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
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
var React17 = __toESM(require("react"), 1);
var SheetPrimitive = __toESM(require("@radix-ui/react-dialog"), 1);
var import_class_variance_authority2 = require("class-variance-authority");
var import_lucide_react18 = require("lucide-react");
var import_jsx_runtime36 = require("react/jsx-runtime");
var Sheet = SheetPrimitive.Root;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React17.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
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
var SheetContent = React17.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(SheetPortal, { children: [
  /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(SheetOverlay, {}),
  /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      ...props,
      children: [
        children,
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(import_lucide_react18.X, { className: "h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
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
}) => /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
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
var SheetTitle = React17.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React17.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// src/components/ui/skeleton.tsx
var import_jsx_runtime37 = require("react/jsx-runtime");
function Skeleton({
  className,
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
    "div",
    {
      className: cn("animate-pulse rounded-md bg-muted", className),
      ...props
    }
  );
}

// src/components/ui/tooltip.tsx
var React18 = __toESM(require("react"), 1);
var TooltipPrimitive = __toESM(require("@radix-ui/react-tooltip"), 1);
var import_jsx_runtime38 = require("react/jsx-runtime");
var TooltipProvider = TooltipPrimitive.Provider;
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = React18.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
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
var import_jsx_runtime39 = require("react/jsx-runtime");
var SIDEBAR_COOKIE_NAME = "sidebar:state";
var SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
var SIDEBAR_WIDTH = "16rem";
var SIDEBAR_WIDTH_MOBILE = "18rem";
var SIDEBAR_WIDTH_ICON = "3rem";
var SIDEBAR_KEYBOARD_SHORTCUT = "b";
var SidebarContext = React19.createContext(null);
function useSidebar() {
  const context = React19.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
var SidebarProvider = React19.forwardRef(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  const [_open, _setOpen] = React19.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React19.useCallback(
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
  const [openMobile, setOpenMobile] = React19.useState(false);
  const [isMobile, setIsMobile] = React19.useState(false);
  React19.useEffect(() => {
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
  React19.useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_COOKIE_NAME);
    if (savedState !== null) {
      setOpen(savedState === "true");
    }
  }, [setOpen]);
  React19.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);
  const toggleSidebar = React19.useCallback(() => {
    return isMobile ? setOpenMobile((open2) => !open2) : setOpen((open2) => !open2);
  }, [isMobile, setOpen, setOpenMobile]);
  const state = open ? "expanded" : "collapsed";
  const contextValue = React19.useMemo(
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
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(SidebarContext.Provider, { value: contextValue, children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(TooltipProvider, { delayDuration: 0, children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var Sidebar = React19.forwardRef(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (collapsible === "none") {
    return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
    return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(Sheet, { open: openMobile, onOpenChange: setOpenMobile, ...props, children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
      SheetContent,
      {
        "data-sidebar": "sidebar",
        "data-mobile": "true",
        className: "w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
        style: {
          "--sidebar-width": SIDEBAR_WIDTH_MOBILE
        },
        side,
        children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "flex h-full w-full flex-col", children })
      }
    ) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(
    "div",
    {
      ref,
      className: "group peer hidden md:block text-sidebar-foreground",
      "data-state": state,
      "data-collapsible": state === "collapsed" ? collapsible : "",
      "data-variant": variant,
      "data-side": side,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
            children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarTrigger = React19.forwardRef(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(import_lucide_react19.PanelLeft, {}),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { className: "sr-only", children: "Toggle Sidebar" })
      ]
    }
  );
});
SidebarTrigger.displayName = "SidebarTrigger";
var SidebarRail = React19.forwardRef(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarInset = React19.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarHeader = React19.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarFooter = React19.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarSeparator = React19.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarContent = React19.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarGroup = React19.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarGroupLabel = React19.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "div";
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarGroupAction = React19.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "button";
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarGroupContent = React19.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarMenu = React19.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarMenuItem = React19.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarMenuButton = React19.forwardRef(({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "button";
  const { isMobile, state } = useSidebar();
  const button = /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(Tooltip, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(TooltipTrigger, { asChild: true, children: button }),
    /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarMenuAction = React19.forwardRef(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "button";
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarMenuBadge = React19.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarMenuSkeleton = React19.forwardRef(({ className, showIcon = false, ...props }, ref) => {
  const width = React19.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(
    "div",
    {
      ref,
      "data-sidebar": "menu-skeleton",
      className: cn("rounded-md h-8 flex gap-2 px-2 items-center", className),
      ...props,
      children: [
        showIcon && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(Skeleton, { className: "size-4 rounded-md", "data-sidebar": "menu-skeleton-icon" }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarMenuSub = React19.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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
var SidebarMenuSubItem = React19.forwardRef(({ ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("li", { ref, ...props });
});
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
var SidebarMenuSubButton = React19.forwardRef(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "a";
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
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

// src/components/ui/input.tsx
var React20 = __toESM(require("react"), 1);
var import_jsx_runtime40 = require("react/jsx-runtime");
var Input = React20.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
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
var React21 = __toESM(require("react"), 1);
var import_jsx_runtime41 = require("react/jsx-runtime");
var Dialog = React21.createContext({});
var DialogRoot = ({ open, onOpenChange, children }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(Dialog.Provider, { value: { open, onOpenChange }, children });
};
var DialogTrigger = React21.forwardRef(({ className, children, ...props }, ref) => {
  const context = React21.useContext(Dialog);
  return /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
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
var DialogContent = React21.forwardRef(({ className, children, ...props }, ref) => {
  const context = React21.useContext(Dialog);
  if (!context.open) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm", children: /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
          "button",
          {
            className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            onClick: () => context.onOpenChange?.(false),
            children: /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("path", { d: "m18 6-12 12" }),
                  /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("path", { d: "m6 6 12 12" })
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
var DialogHeader = React21.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
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
var DialogTitle = React21.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
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
var React22 = __toESM(require("react"), 1);
var import_jsx_runtime42 = require("react/jsx-runtime");
var Textarea = React22.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(
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

// src/components/ui/dropdown-menu.tsx
var React23 = __toESM(require("react"), 1);
var DropdownMenuPrimitive = __toESM(require("@radix-ui/react-dropdown-menu"), 1);
var import_lucide_react20 = require("lucide-react");
var import_jsx_runtime43 = require("react/jsx-runtime");
var DropdownMenu = DropdownMenuPrimitive.Root;
var DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
var DropdownMenuGroup = DropdownMenuPrimitive.Group;
var DropdownMenuPortal = DropdownMenuPrimitive.Portal;
var DropdownMenuSub = DropdownMenuPrimitive.Sub;
var DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
var DropdownMenuSubTrigger = React23.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_lucide_react20.ChevronRight, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
var DropdownMenuSubContent = React23.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
var DropdownMenuContent = React23.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
var DropdownMenuItem = React23.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
var DropdownMenuCheckboxItem = React23.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_lucide_react20.Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
var DropdownMenuRadioItem = React23.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_lucide_react20.Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
var DropdownMenuLabel = React23.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
var DropdownMenuSeparator = React23.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
  DropdownMenuPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
var DropdownMenuShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
    "span",
    {
      className: cn("ml-auto text-xs tracking-widest opacity-60", className),
      ...props
    }
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// src/components/AppSidebar.tsx
var import_jsx_runtime44 = require("react/jsx-runtime");
var ThreadItem = ({
  thread,
  isActive,
  onClick,
  onDelete,
  onRename
}) => {
  const [isEditing, setIsEditing] = (0, import_react16.useState)(false);
  const [editTitle, setEditTitle] = (0, import_react16.useState)(thread.title || "New Chat");
  const [showMenu, setShowMenu] = (0, import_react16.useState)(false);
  const handleRename = (0, import_react16.useCallback)(() => {
    if (editTitle.trim() && editTitle !== thread.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  }, [editTitle, thread.title, onRename]);
  const handleKeyPress = (0, import_react16.useCallback)((e) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditTitle(thread.title || "New Chat");
      setIsEditing(false);
    }
  }, [handleRename, thread.title]);
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(SidebarMenuItem, { className: "mb-3", children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarMenuButton, { asChild: true, isActive, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { onClick, children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(
      Input,
      {
        value: editTitle,
        onChange: (e) => setEditTitle(e.target.value),
        onBlur: handleRename,
        onKeyPress: handleKeyPress,
        className: "flex-1 text-sm bg-transparent border-none outline-none",
        autoFocus: true,
        onClick: (e) => e.stopPropagation()
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { className: "flex-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("p", { className: "text-sm font-medium truncate leading-tight", children: thread.title || "New Chat" }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("p", { className: "text-xs text-muted-foreground truncate leading-tight mt-0.5", children: thread.last_message || "No messages yet" })
    ] }) }) }),
    !isEditing && /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(DropdownMenu, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarMenuAction, { onClick: (e) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
      }, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(import_lucide_react21.MoreHorizontal, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(DropdownMenuContent, { className: "w-[--radix-popper-anchor-width]", children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(
          DropdownMenuItem,
          {
            onClick: (e) => {
              e.stopPropagation();
              setIsEditing(true);
              setShowMenu(false);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(import_lucide_react21.Edit3, { className: "h-3 w-3" }),
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { children: "Rename" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(
          DropdownMenuItem,
          {
            onClick: (e) => {
              e.stopPropagation();
              onDelete();
              setShowMenu(false);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(import_lucide_react21.Trash2, { className: "h-3 w-3" }),
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { children: "Delete" })
            ]
          }
        )
      ] })
    ] })
  ] });
};
function AppSidebar({
  selectedThreadId,
  currentPage,
  onNewChat,
  onThreadSelect,
  onThreadDelete,
  onThreadRename,
  onLogoClick,
  onPageChange
}) {
  const { threads, loading: threadsLoading, refetch } = useThreads();
  const { theme, setTheme } = useTheme();
  const { open } = useSidebar();
  const handleRefresh = (0, import_react16.useCallback)(() => {
    refetch();
  }, [refetch]);
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(Sidebar, { collapsible: "icon", variant: "floating", children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarMenu, { children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(SidebarMenuItem, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(
        SidebarMenuButton,
        {
          onClick: onLogoClick,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(import_lucide_react21.Bot, {}),
            "Distri"
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(
        SidebarMenuAction,
        {
          onClick: () => setTheme(theme === "light" ? "dark" : "light"),
          title: "Toggle theme",
          className: "absolute right-0 top-0",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("svg", { className: "h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("circle", { cx: "12", cy: "12", r: "5" }),
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("path", { d: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("svg", { className: "absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" }) })
          ]
        }
      )
    ] }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarSeparator, {}),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(SidebarContent, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(SidebarGroup, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarGroupLabel, { children: "Actions" }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarGroupContent, { children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(SidebarMenu, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarMenuItem, { className: "mb-1", children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(
            SidebarMenuButton,
            {
              isActive: currentPage === "chat",
              onClick: () => {
                onPageChange("chat");
                onNewChat();
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(import_lucide_react21.Edit2, { className: "h-4 w-4" }),
                "New Chat"
              ]
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarMenuItem, { className: "mb-1", children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(
            SidebarMenuButton,
            {
              isActive: currentPage === "agents",
              onClick: () => onPageChange("agents"),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(import_lucide_react21.Users, { className: "h-4 w-4" }),
                "Agents"
              ]
            }
          ) })
        ] }) })
      ] }),
      open && /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(SidebarGroup, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarGroupLabel, { children: "Conversations" }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarGroupContent, { children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarMenu, { children: threadsLoading ? /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(SidebarMenuItem, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(import_lucide_react21.Loader2, { className: "h-4 w-4 animate-spin" }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { children: "Loading threads..." })
        ] }) : threads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarMenuItem, { children: "No conversations yet" }) : threads.map((thread) => /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(
          ThreadItem,
          {
            thread,
            isActive: thread.id === selectedThreadId,
            onClick: () => onThreadSelect(thread.id),
            onDelete: () => onThreadDelete(thread.id),
            onRename: (newTitle) => onThreadRename(thread.id, newTitle)
          },
          thread.id
        )) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(
          SidebarGroupAction,
          {
            onClick: handleRefresh,
            disabled: threadsLoading,
            title: "Refresh conversations",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(import_lucide_react21.RefreshCw, { className: `${threadsLoading ? "animate-spin" : ""}` }),
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { className: "sr-only", children: "Refresh conversations" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarMenu, { children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SidebarMenuItem, { children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(
      SidebarMenuButton,
      {
        onClick: () => window.open("https://github.com/your-repo/distri", "_blank"),
        title: "GitHub",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(import_lucide_react21.Github, {}),
          "Distri"
        ]
      }
    ) }) }) })
  ] });
}

// src/components/TaskExecutionRenderer.tsx
var import_react17 = require("react");
var import_core8 = require("@distri/core");
var import_lucide_react22 = require("lucide-react");
var import_jsx_runtime45 = require("react/jsx-runtime");
var TaskExecutionRenderer = ({
  events,
  className = ""
}) => {
  const steps = (0, import_react17.useMemo)(() => {
    const stepMap = /* @__PURE__ */ new Map();
    const stepOrder = [];
    events.forEach((event) => {
      if ((0, import_core8.isDistriMessage)(event)) {
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
        return /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(import_lucide_react22.CheckCircle, { className: "w-4 h-4 text-green-600" });
      case "error":
        return /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(import_lucide_react22.AlertCircle, { className: "w-4 h-4 text-red-600" });
      case "running":
        return /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(import_lucide_react22.Loader2, { className: "w-4 h-4 text-blue-600 animate-spin" });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(import_lucide_react22.Clock, { className: "w-4 h-4 text-gray-400" });
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
  return /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("div", { className: `space-y-3 ${className}`, children: steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(Card, { className: "border-l-4 border-l-blue-200", children: [
    /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(CardHeader, { className: "pb-2", children: /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "flex items-center gap-2", children: [
        getStepIcon(step),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(CardTitle, { className: "text-sm font-medium", children: step.title })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(Badge, { className: getStepBadgeColor(step), children: step.status })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(CardContent, { className: "pt-0", children: [
      step.toolCall && /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("div", { className: "text-xs text-gray-600", children: "Input:" }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("pre", { className: "text-xs bg-gray-50 p-2 rounded overflow-x-auto", children: formatToolInput(step.toolCall.input) })
      ] }),
      step.toolResult && /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "space-y-2 mt-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("div", { className: "text-xs text-gray-600", children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("div", { className: "text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto", children: formatToolResult(step.toolResult.result) })
      ] }),
      step.content && step.type === "message" && /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "text-sm whitespace-pre-wrap", children: [
        step.content,
        step.status === "running" && /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("span", { className: "inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1" })
      ] })
    ] })
  ] }, step.id)) });
};

// src/components/ThemeToggle.tsx
var import_react18 = __toESM(require("react"), 1);
var import_lucide_react23 = require("lucide-react");
var import_jsx_runtime46 = require("react/jsx-runtime");
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dropdownRef = import_react18.default.useRef(null);
  return /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("div", { className: "relative", ref: dropdownRef, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(
    "button",
    {
      onClick: () => setTheme(theme === "light" ? "dark" : "light"),
      className: "flex items-center justify-center w-9 h-9 rounded-md border bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react23.Sun, { className: "h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" }),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react23.Moon, { className: "absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" }),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("span", { className: "sr-only", children: "Toggle theme" })
      ]
    }
  ) });
}

// src/components/Toast.tsx
var import_react19 = require("react");
var import_lucide_react24 = require("lucide-react");
var import_jsx_runtime47 = require("react/jsx-runtime");

// src/hooks/useChatMessages.ts
var import_react20 = require("react");

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
        data: {
          runId: statusUpdate.runId,
          taskId: statusUpdate.taskId
        }
      };
    case "run_finished":
      return {
        type: "run_finished",
        data: {
          runId: statusUpdate.runId,
          taskId: statusUpdate.taskId
        }
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
    case "tool_calls":
      return {
        type: "tool_calls",
        data: {
          tool_calls: metadata.tool_calls || []
        }
      };
    case "tool_results":
      return {
        type: "tool_results",
        data: {
          results: metadata.results || []
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
  if (data.type === "plan") {
    const planResult = {
      id: data.id || artifact.artifactId,
      type: "plan",
      timestamp: data.timestamp || data.created_at || Date.now(),
      reasoning: data.reasoning || "",
      steps: data.steps || []
    };
    return planResult;
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
  if (event.artifactId && event.parts) {
    return convertA2AArtifactToDistri(event);
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
  return null;
}
function convertA2APartToDistri(a2aPart) {
  switch (a2aPart.kind) {
    case "text":
      return { type: "text", data: a2aPart.text };
    case "file":
      if ("uri" in a2aPart.file) {
        return { type: "image", data: { mime_type: a2aPart.file.mimeType, url: a2aPart.file.uri } };
      } else {
        return { type: "image", data: { mime_type: a2aPart.file.mimeType, data: a2aPart.file.bytes } };
      }
    case "data":
      switch (a2aPart.data.part_type) {
        case "tool_call":
          return { type: "tool_call", data: a2aPart.data };
        case "tool_result":
          return { type: "tool_result", data: a2aPart.data };
        default:
          return { type: "data", data: a2aPart.data };
      }
    default:
      return { type: "text", data: JSON.stringify(a2aPart) };
  }
}

// src/hooks/useChatMessages.ts
function useChatMessages({
  initialMessages = [],
  agent,
  threadId,
  onError
} = {}) {
  const onErrorRef = (0, import_react20.useRef)(onError);
  (0, import_react20.useEffect)(() => {
    onErrorRef.current = onError;
  }, [onError]);
  const [messages, setMessages] = (0, import_react20.useState)(initialMessages);
  const [isLoading, setIsLoading] = (0, import_react20.useState)(false);
  const [error, setError] = (0, import_react20.useState)(null);
  (0, import_react20.useEffect)(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);
  const addMessage = (0, import_react20.useCallback)((message) => {
    setMessages((prev) => {
      return [...prev, message];
    });
  }, []);
  const clearMessages = (0, import_react20.useCallback)(() => {
    setMessages([]);
  }, []);
  const fetchMessages = (0, import_react20.useCallback)(async () => {
    if (!agent || !threadId) return;
    try {
      setIsLoading(true);
      setError(null);
      const a2aMessages = await agent.getThreadMessages(threadId);
      const distriMessages = a2aMessages.map(decodeA2AStreamEvent).filter(Boolean);
      setMessages(distriMessages);
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Failed to fetch messages");
      setError(error2);
      onErrorRef.current?.(error2);
    } finally {
      setIsLoading(false);
    }
  }, [agent, threadId]);
  (0, import_react20.useEffect)(() => {
    if (threadId && agent && !initialMessages?.length) {
      fetchMessages();
    }
  }, [threadId, agent?.id, initialMessages?.length, fetchMessages]);
  return {
    messages,
    addMessage,
    clearMessages,
    fetchMessages,
    isLoading,
    error
  };
}

// src/utils/toolWrapper.ts
var import_react21 = __toESM(require("react"), 1);
function wrapFnToolAsUiTool(fnTool, options = {}) {
  const { autoExecute = false } = options;
  return {
    name: fnTool.name,
    type: "ui",
    description: fnTool.description,
    input_schema: fnTool.input_schema,
    component: (props) => {
      return import_react21.default.createElement(DefaultToolActions, {
        ...props,
        tool: { ...fnTool, autoExecute: fnTool.autoExecute || autoExecute }
      });
    }
  };
}
function wrapTools(tools, options = {}) {
  return tools.map((tool) => {
    if (tool.type === "function") {
      return wrapFnToolAsUiTool(tool, options);
    }
    return tool;
  });
}

// src/utils/debugStream.ts
var import_core9 = require("@distri/core");
async function debugStreamEvents(agent, message, options = {}) {
  const {
    logEvents = true,
    logMessages = true,
    logTiming = true,
    onEvent
  } = options;
  console.log("\u{1F9EA} Starting stream debug for message:", message);
  const startTime = Date.now();
  let eventCount = 0;
  const events = [];
  try {
    const userMessage = {
      messageId: "debug-msg-" + Date.now(),
      role: "user",
      parts: [{ kind: "text", text: message }],
      kind: "message",
      contextId: "debug-context",
      taskId: "debug-task"
    };
    console.log("\u{1F4E4} Sending message to agent...");
    const stream = await agent.invokeStream({
      message: userMessage,
      metadata: {}
    });
    console.log("\u{1F4E1} Stream started, listening for events...");
    for await (const event of stream) {
      eventCount++;
      const eventTime = Date.now() - startTime;
      events.push(event);
      if (logEvents) {
        console.log(`
\u{1F4E5} Event ${eventCount} (${eventTime}ms):`, {
          type: event.type || "message",
          id: event.id || "no-id",
          role: event.role || "no-role",
          isEvent: (0, import_core9.isDistriEvent)(event),
          isMessage: (0, import_core9.isDistriMessage)(event),
          isArtifact: (0, import_core9.isDistriArtifact)(event)
        });
      }
      if ((0, import_core9.isDistriEvent)(event)) {
        const distriEvent = event;
        if (logEvents) {
          console.log(`   \u{1F50D} Event data:`, distriEvent.data);
        }
        if (distriEvent.type === "text_message_start") {
          console.log(`   \u{1F680} Started streaming message: ${distriEvent.data.message_id}`);
        } else if (distriEvent.type === "text_message_content") {
          const data = distriEvent.data;
          console.log(`   \u{1F4DD} Content delta: "${data.delta}" (${data.delta?.length} chars)`);
        } else if (distriEvent.type === "text_message_end") {
          console.log(`   \u{1F3C1} Finished streaming message: ${distriEvent.data.message_id}`);
        } else if (distriEvent.type === "tool_calls") {
          const data = distriEvent.data;
          console.log(`   \u{1F527} Tool calls: ${data.tool_calls?.length} tools`);
          data.tool_calls?.forEach((tool, i) => {
            console.log(`      ${i + 1}. ${tool.tool_name} (${tool.tool_call_id})`);
          });
        } else if (distriEvent.type === "tool_results") {
          const data = distriEvent.data;
          console.log(`   \u2705 Tool results: ${data.results?.length} results`);
          data.results?.forEach((result, i) => {
            console.log(`      ${i + 1}. ${result.tool_name}: ${result.success ? "success" : "failed"}`);
          });
        }
      } else if ((0, import_core9.isDistriMessage)(event)) {
        const distriMessage = event;
        if (logMessages) {
          const textContent = distriMessage.parts?.filter((p) => p.type === "text")?.map((p) => p.data)?.join(" ") || "";
          console.log(`   \u{1F4AC} Message: ${distriMessage.role} - "${textContent.substring(0, 100)}${textContent.length > 100 ? "..." : ""}"`);
        }
      }
      onEvent?.(event, eventCount);
    }
    const totalTime = Date.now() - startTime;
    if (logTiming) {
      console.log(`
\u23F1\uFE0F  Stream completed in ${totalTime}ms`);
      console.log(`\u{1F4CA} Total events: ${eventCount}`);
    }
    const analysis = analyzeEvents(events);
    console.log("\n\u{1F4C8} Event Analysis:");
    console.log("   Event types:", analysis.eventTypes);
    console.log("   Messages:", analysis.messageCount);
    console.log("   Streaming events:", analysis.streamingEvents);
    console.log("   Tool events:", analysis.toolEvents);
    if (analysis.issues.length > 0) {
      console.log("\n\u26A0\uFE0F  Potential issues:");
      analysis.issues.forEach((issue) => console.log(`   - ${issue}`));
    }
    return {
      events,
      eventCount,
      totalTime,
      analysis
    };
  } catch (error) {
    console.error("\u274C Stream debug failed:", error);
    throw error;
  }
}
function analyzeEvents(events) {
  const eventTypes = {};
  let messageCount = 0;
  const streamingEvents = [];
  const toolEvents = [];
  const issues = [];
  const streamingMessages = /* @__PURE__ */ new Map();
  events.forEach((event) => {
    if ((0, import_core9.isDistriEvent)(event)) {
      const type = event.type;
      eventTypes[type] = (eventTypes[type] || 0) + 1;
      if (type.startsWith("text_message_")) {
        streamingEvents.push(event);
        const messageId = event.data.message_id;
        if (!streamingMessages.has(messageId)) {
          streamingMessages.set(messageId, { content: 0 });
        }
        const msgData = streamingMessages.get(messageId);
        if (type === "text_message_start") {
          msgData.start = true;
        } else if (type === "text_message_content") {
          msgData.content++;
        } else if (type === "text_message_end") {
          msgData.end = true;
        }
      }
      if (type.includes("tool")) {
        toolEvents.push(event);
      }
    } else if ((0, import_core9.isDistriMessage)(event)) {
      messageCount++;
    }
  });
  streamingMessages.forEach((data, messageId) => {
    if (data.start && !data.end) {
      issues.push(`Streaming message ${messageId} started but never ended`);
    }
    if (!data.start && data.content > 0) {
      issues.push(`Streaming message ${messageId} has content but no start event`);
    }
    if (data.content === 0 && data.start) {
      issues.push(`Streaming message ${messageId} started but has no content events`);
    }
  });
  return {
    eventTypes,
    messageCount,
    streamingEvents: streamingEvents.length,
    toolEvents: toolEvents.length,
    streamingMessages: Object.fromEntries(streamingMessages),
    issues
  };
}
async function quickDebugMessage(agent, message) {
  return debugStreamEvents(agent, message, {
    logEvents: true,
    logMessages: true,
    logTiming: true
  });
}

// src/components/renderers/ArtifactRenderer.tsx
var import_jsx_runtime48 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: `flex items-start gap-4 py-3 px-2 ${className}`, children: [
    avatar && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "flex-shrink-0", children: avatar }),
    /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "w-full", children: [
      /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "text-sm font-medium text-foreground mb-2", children: "Assistant" }),
      content.text && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "prose prose-sm max-w-none text-foreground mb-3", children: renderTextContent(content) }),
      llmArtifact.tool_calls && llmArtifact.tool_calls.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "space-y-2", children: llmArtifact.tool_calls.map((toolCall, index) => /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "border rounded-lg p-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("span", { className: "text-sm font-medium", children: toolCall.tool_name }),
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("span", { className: "text-xs text-primary", children: "Success" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "text-sm text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("strong", { children: "Input:" }),
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1", children: JSON.stringify(toolCall.input, null, 2) })
        ] })
      ] }, toolCall.tool_call_id || index)) })
    ] })
  ] });
}
function renderToolResults(toolResultsArtifact, _chatState, className, avatar) {
  return /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: `flex items-start gap-4 py-3 px-2 ${className}`, children: [
    avatar && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "flex-shrink-0", children: avatar }),
    /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "w-full", children: [
      /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "text-sm font-medium text-foreground mb-2", children: "Tool Results" }),
      /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "prose prose-sm max-w-none text-foreground mb-3", children: /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("p", { children: [
        "Tool execution completed with ",
        toolResultsArtifact.results.length,
        " result(s)."
      ] }) }),
      toolResultsArtifact.results.map((result, index) => /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "border rounded-lg p-3 mb-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("span", { className: "text-sm font-medium", children: result.tool_name }),
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("span", { className: "text-xs text-primary", children: "Success" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "text-sm text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("strong", { children: "Result:" }),
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-y-auto", children: typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2) })
        ] })
      ] }, result.tool_call_id || index))
    ] })
  ] });
}
function renderGenericArtifact(genericArtifact, _chatState, className, avatar) {
  return /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: `flex items-start gap-4 py-3 px-2 ${className}`, children: [
    avatar && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "flex-shrink-0", children: avatar }),
    /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "w-full", children: [
      /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "text-sm font-medium text-foreground mb-2", children: "Artifact" }),
      /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "prose prose-sm max-w-none text-foreground", children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-muted p-2 rounded", children: JSON.stringify(genericArtifact, null, 2) }) })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentSelect,
  AppSidebar,
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
  ChatInput,
  DebugRenderer,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DistriProvider,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
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
  ToolCallRenderer,
  ToolMessageRenderer,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UserMessageRenderer,
  debugStreamEvents,
  quickDebugMessage,
  useAgent,
  useAgentDefinitions,
  useChat,
  useChatMessages,
  useDistri,
  useDistriClient,
  useSidebar,
  useTheme,
  useThreads,
  wrapFnToolAsUiTool,
  wrapTools
});
