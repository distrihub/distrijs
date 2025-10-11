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
  ImageRenderer: () => ImageRenderer,
  Input: () => Input,
  LoadingShimmer: () => LoadingShimmer,
  MessageRenderer: () => MessageRenderer,
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
  StepBasedRenderer: () => StepBasedRenderer,
  StreamingTextRenderer: () => StreamingTextRenderer,
  Textarea: () => Textarea,
  ThemeProvider: () => ThemeProvider,
  ThemeToggle: () => ThemeToggle,
  ThinkingRenderer: () => ThinkingRenderer,
  ToolResultRenderer: () => ToolResultRenderer,
  Tooltip: () => Tooltip,
  TooltipContent: () => TooltipContent,
  TooltipProvider: () => TooltipProvider,
  TooltipTrigger: () => TooltipTrigger,
  TypingIndicator: () => TypingIndicator,
  UserMessageRenderer: () => UserMessageRenderer,
  VoiceInput: () => VoiceInput,
  extractContent: () => extractContent,
  useAgent: () => useAgent,
  useAgentDefinitions: () => useAgentDefinitions,
  useChat: () => useChat,
  useChatMessages: () => useChatMessages,
  useChatStateStore: () => useChatStateStore,
  useDistri: () => useDistri,
  useDistriClient: () => useDistriClient,
  useSidebar: () => useSidebar,
  useSpeechToText: () => useSpeechToText,
  useTheme: () => useTheme,
  useThreads: () => useThreads,
  useTts: () => useTts,
  wrapFnToolAsUiTool: () => wrapFnToolAsUiTool,
  wrapTools: () => wrapTools
});
module.exports = __toCommonJS(index_exports);

// src/useChat.ts
var import_react3 = require("react");
var import_core3 = require("@distri/core");
var import_core4 = require("@distri/core");

// src/stores/chatStateStore.ts
var import_zustand = require("zustand");
var import_core2 = require("@distri/core");

// src/components/renderers/tools/DefaultToolActions.tsx
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

// src/components/renderers/tools/DefaultToolActions.tsx
var import_lucide_react2 = require("lucide-react");
var import_core = require("@distri/core");
var import_jsx_runtime3 = require("react/jsx-runtime");
var DefaultToolActions = ({
  toolCall,
  toolCallState,
  completeTool,
  tool
}) => {
  const [isProcessing, setIsProcessing] = (0, import_react.useState)(false);
  const [hasExecuted, setHasExecuted] = (0, import_react.useState)(false);
  const [dontAskAgain, setDontAskAgain] = (0, import_react.useState)(false);
  const autoExecute = tool.autoExecute;
  const input = toolCall.input;
  const toolName = toolCall.tool_name;
  const isLiveStream = toolCallState?.isLiveStream || false;
  const hasTriggeredRef = (0, import_react.useRef)(false);
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
  (0, import_react.useEffect)(() => {
    if (!isLiveStream) return;
    const preferences = getApprovalPreferences();
    const autoApprove = preferences[toolName];
    if (autoApprove === void 0) return;
    if (hasExecuted || isProcessing) return;
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    if (autoApprove) {
      handleExecute();
    } else {
      handleCancel();
    }
  }, [toolName, isLiveStream]);
  (0, import_react.useEffect)(() => {
    if (!isLiveStream) return;
    const preferences = getApprovalPreferences();
    const hasPreference = preferences[toolName] !== void 0;
    if (!autoExecute || hasPreference || hasExecuted || isProcessing) {
      return;
    }
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    handleExecute();
  }, [autoExecute, hasExecuted, isProcessing, toolName, isLiveStream]);
  const handleExecute = async () => {
    if (isProcessing || hasExecuted) return;
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
    }
    if (dontAskAgain) {
      saveApprovalPreference(toolName, true);
    }
    setIsProcessing(true);
    setHasExecuted(true);
    try {
      const result = await tool.handler(toolCall.input);
      if (!tool.is_final) {
        const toolResult = (0, import_core.createSuccessfulToolResult)(
          toolCall.tool_call_id,
          toolName,
          typeof result === "string" ? result : JSON.stringify(result)
        );
        await completeTool(toolResult);
      } else {
        console.log("Tool is final, no action required");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const toolResult = (0, import_core.createFailedToolResult)(
        toolCall.tool_call_id,
        toolName,
        errorMessage,
        "Tool execution failed"
      );
      await completeTool(toolResult);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleCancel = () => {
    if (isProcessing || hasExecuted) return;
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
    }
    if (dontAskAgain) {
      saveApprovalPreference(toolName, false);
    }
    setHasExecuted(true);
    const toolResult = (0, import_core.createFailedToolResult)(
      toolCall.tool_call_id,
      toolName,
      "User cancelled the operation",
      "Tool execution cancelled by user"
    );
    completeTool(toolResult);
  };
  if (hasExecuted && !isProcessing) {
    const wasSuccessful = !toolCallState?.error;
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "border rounded-lg p-4 bg-muted/50", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [
        wasSuccessful ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.CheckCircle, { className: "h-4 w-4 text-green-600" }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.XCircle, { className: "h-4 w-4 text-red-600" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "font-medium", children: wasSuccessful ? "Tool Executed Successfully" : "Tool Execution Failed" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "text-sm text-muted-foreground", children: [
        "Tool: ",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { className: "bg-background px-1 rounded", children: toolName })
      ] }),
      toolCallState?.result && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mt-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-xs text-muted-foreground mb-1", children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("pre", { className: "text-xs bg-background p-2 rounded border overflow-x-auto", children: typeof toolCallState.result === "string" ? toolCallState.result : JSON.stringify(toolCallState.result, null, 2) })
      ] }),
      toolCallState?.error && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mt-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-xs text-destructive mb-1", children: "Error:" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-xs text-destructive bg-destructive/10 p-2 rounded border", children: toolCallState.error })
      ] })
    ] });
  }
  if (isProcessing) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "border rounded-lg p-4 bg-background", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.Wrench, { className: "h-4 w-4 text-primary" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "font-medium", children: "Tool Action Required" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mb-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "text-sm mb-2", children: [
        "Execute tool: ",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { className: "bg-muted px-1 rounded", children: toolName })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "text-xs text-muted-foreground mb-1", children: "Input:" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("pre", { className: "text-xs bg-muted p-2 rounded border overflow-x-auto", children: JSON.stringify(input, null, 2) })
    ] }),
    !autoExecute && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "space-y-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          Checkbox,
          {
            id: "dont-ask-again-tool",
            checked: dontAskAgain,
            onCheckedChange: (checked) => setDontAskAgain(checked)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "label",
          {
            htmlFor: "dont-ask-again-tool",
            className: "text-sm text-muted-foreground cursor-pointer",
            children: [
              "Don't ask again for ",
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "font-mono text-xs", children: toolName })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          Button,
          {
            size: "sm",
            variant: "destructive",
            onClick: handleCancel,
            disabled: isProcessing,
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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

// src/stores/chatStateStore.ts
var import_react2 = __toESM(require("react"), 1);
var completingToolCallIds = /* @__PURE__ */ new Set();
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
  tools: {
    tools: [],
    agent_tools: /* @__PURE__ */ new Map()
  },
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
  getToolByName: (toolName) => {
    const state = get();
    let externalTool = state.externalTools?.find((t) => t.name === toolName) || state.agent?.getDefinition?.()?.tools?.find((t) => t.name === toolName);
    let backendTool = state.agent?.getDefinition?.()?.tools?.find((t) => t.name === toolName);
    if (externalTool) {
      return { ...externalTool, executionType: "external" };
    } else if (backendTool) {
      return { ...backendTool, executionType: "backend" };
    }
    return void 0;
  },
  addMessage: (message) => {
    set((state) => {
      if ((0, import_core2.isDistriEvent)(message)) {
        const event = message;
        if (event.type === "text_message_start") {
          const messageId = event.data.message_id;
          const stepId = event.data.step_id;
          const role = event.data.role;
          const isFinal = event.data.is_final;
          const newDistriMessage = {
            id: messageId,
            role,
            parts: [{ part_type: "text", data: "" }],
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            step_id: stepId,
            is_final: isFinal
          };
          const messages = [...state.messages, newDistriMessage];
          if (stepId) {
            const existingStep = get().steps.get(stepId);
            if (existingStep) {
              get().updateStep(stepId, {
                // Keep the original title from step_started, just ensure it's running
                status: "running"
              });
            }
          }
          return { ...state, messages };
        } else if (event.type === "text_message_content") {
          const messageId = event.data.message_id;
          const delta = event.data.delta;
          const existingIndex = state.messages.findIndex(
            (m) => (0, import_core2.isDistriMessage)(m) && m.id === messageId
          );
          if (existingIndex >= 0) {
            const existingMessage = state.messages[existingIndex];
            let textPart = existingMessage.parts.find((p) => p.part_type === "text");
            textPart = { part_type: "text", data: delta };
            const updatedMessage = {
              ...existingMessage,
              parts: [...existingMessage.parts, textPart]
            };
            const messages = state.messages.map(
              (msg, idx) => idx === existingIndex ? updatedMessage : msg
            );
            return { ...state, messages };
          } else {
            console.log("\u{1F527} text message content sent without existing message. This should not happen.", message);
            return state;
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
          return state;
        } else {
          const stateOnlyEvents = [
            "run_started",
            "run_finished",
            "run_error",
            "plan_started",
            "plan_finished",
            "step_started",
            "step_completed",
            "tool_results"
          ];
          if (!stateOnlyEvents.includes(event.type)) {
            const messages = [...state.messages, message];
            return { ...state, messages };
          }
          return state;
        }
      } else {
        const messages = [...state.messages, message];
        return { ...state, messages };
      }
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
    if ((0, import_core2.isDistriEvent)(message)) {
      const event = message;
      if (isDebugEnabled && message.type !== "text_message_content") {
        console.log("\u{1F3EA} EVENT:", message);
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
          const shouldUpdateTaskId = !get().currentTaskId;
          set({
            currentRunId: runId,
            currentTaskId: shouldUpdateTaskId ? taskId : get().currentTaskId
          });
          get().setStreamingIndicator("typing");
          set({ isStreaming: true });
          break;
        case "run_finished":
          const runFinishedEvent = event;
          const finishedTaskId = runFinishedEvent.data.taskId;
          if (finishedTaskId) {
            get().updateTask(finishedTaskId, {
              status: "completed",
              endTime: timestamp
            });
          }
          set({ isStreaming: false, isLoading: false });
          get().setStreamingIndicator(void 0);
          get().setCurrentThought(void 0);
          break;
        case "run_error":
          const runErrorEvent = event;
          const errorTaskId = runErrorEvent.data.code ? "subtask" : get().currentTaskId;
          const currentMainTaskIdForError = get().currentTaskId;
          if (errorTaskId) {
            get().updateTask(errorTaskId, {
              status: "failed",
              endTime: timestamp,
              error: runErrorEvent.data.message || "Unknown error"
            });
          }
          if (errorTaskId === currentMainTaskIdForError) {
            console.log("\u{1F6D1} Stopping streaming - main task errored");
            get().setStreamingIndicator(void 0);
            get().setCurrentThought(void 0);
            set({ isStreaming: false, isLoading: false });
          } else {
            console.log("\u{1F4DD} Sub-task errored, continuing stream");
          }
          break;
        case "plan_started":
          const planId = `plan_${Date.now()}`;
          const currentRunId = get().currentRunId;
          const currentTaskId = get().currentTaskId;
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
          break;
        case "tool_execution_start":
          const toolExecutionStartEvent = event;
          if (get().getToolCallById(toolExecutionStartEvent.data.tool_call_id)) {
            get().updateToolCallStatus(toolExecutionStartEvent.data.tool_call_id, {
              status: "running",
              startTime: timestamp
            });
          } else {
            get().toolCalls.set(toolExecutionStartEvent.data.tool_call_id, {
              tool_call_id: toolExecutionStartEvent.data.tool_call_id,
              tool_name: toolExecutionStartEvent.data.tool_call_name,
              input: toolExecutionStartEvent.data.input,
              status: "running",
              startTime: timestamp,
              isExternal: false,
              isLiveStream: isFromStream
            });
          }
          break;
        case "tool_execution_end":
          const toolExecutionEndEvent = event;
          const finishedToolCallId = toolExecutionEndEvent.data.tool_call_id;
          if (finishedToolCallId) {
            get().updateToolCallStatus(finishedToolCallId, {
              status: "completed",
              endTime: timestamp
            });
          }
          break;
        case "text_message_start":
          break;
        case "text_message_content":
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
          break;
        case "step_completed":
          const completedStepId = message.data.step_id;
          get().updateStep(completedStepId, {
            status: "completed",
            endTime: timestamp
          });
          break;
        case "tool_calls":
          if (message.data.tool_calls && Array.isArray(message.data.tool_calls)) {
            message.data.tool_calls.forEach(async (toolCall) => {
              if (get().toolCalls.has(toolCall.tool_call_id)) {
                console.log("\u{1F501} Ignoring duplicate tool_call event", toolCall.tool_call_id);
                return;
              }
              get().initToolCall({
                tool_call_id: toolCall.tool_call_id,
                tool_name: toolCall.tool_name,
                input: toolCall.input
              }, timestamp, isFromStream);
            });
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
                  parts: [{
                    part_type: "data",
                    data: {
                      result: result.result,
                      error: result.error,
                      success: result.success !== false
                    }
                  }]
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
  },
  initToolCall: (toolCall, timestamp, isFromStream = false) => {
    const externalTools = get().externalTools || [];
    const externalTool = externalTools.find((t) => t.name === toolCall.tool_name);
    const existingToolCall = get().toolCalls.get(toolCall.tool_call_id);
    if (existingToolCall) {
      console.log("\u{1F501} initToolCall skipped duplicate", toolCall.tool_call_id);
      return;
    }
    set((state) => {
      const newState = { ...state };
      newState.toolCalls.set(toolCall.tool_call_id, {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name || "Unknown Tool",
        input: toolCall.input || {},
        status: "pending",
        startTime: timestamp || Date.now(),
        isExternal: !!externalTool,
        isLiveStream: isFromStream
      });
      return newState;
    });
    if (externalTool) {
      console.log("\u{1F527} Tool found:", {
        externalTool,
        toolName: toolCall.tool_name
      });
      get().executeTool(toolCall, externalTool);
    } else {
      console.log("\u{1F527} Tool not external:", {
        toolName: toolCall.tool_name
      });
    }
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
    console.log("completeTool", toolCall, result);
    if (completingToolCallIds.has(toolCall.tool_call_id)) {
      console.warn(`Skipping duplicate completeTool for ${toolCall.tool_call_id}`);
      return;
    }
    completingToolCallIds.add(toolCall.tool_call_id);
    const state = get();
    const agent = state.agent;
    if (!agent) {
      console.error("\u274C Agent not found");
      completingToolCallIds.delete(toolCall.tool_call_id);
      return;
    }
    console.log("state.toolCalls", state.toolCalls);
    try {
      console.log(`\u{1F527} Executing external function tool: ${toolCall.tool_name}`);
      console.log(`\u2705 Tool ${toolCall.tool_name} executed successfully:`, result);
      await agent.completeTool(result);
      console.log(`\u2705 Tool completion sent to agent via API`);
    } catch (error) {
      console.error(`\u274C Error executing tool ${toolCall.tool_name}:`, error);
    } finally {
      completingToolCallIds.delete(toolCall.tool_call_id);
    }
  },
  executeTool: (toolCall, distriTool) => {
    try {
      const commonProps = {
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        startTime: Date.now(),
        isExternal: !!distriTool,
        // Only mark as external if it's actually an external tool
        status: "running"
      };
      const completeToolFn = (result) => {
        try {
          get().completeTool(toolCall, result);
        } catch (error) {
          console.error(`\u274C Error completing tool ${toolCall.tool_name}:`, error);
          get().updateToolCallStatus(toolCall.tool_call_id, {
            status: "error",
            error: error instanceof Error ? error.message : "Tool completion failed",
            endTime: Date.now()
          });
        }
      };
      const toolCallState = get().toolCalls.get(toolCall.tool_call_id);
      console.log("distriTool", distriTool);
      let component;
      try {
        if (distriTool?.type === "ui") {
          const uiTool = distriTool;
          component = uiTool.component({
            toolCall,
            toolCallState,
            completeTool: completeToolFn,
            tool: distriTool
          });
        } else if (distriTool?.type === "function") {
          const fnTool = distriTool;
          fnTool.autoExecute = fnTool.autoExecute === true;
          const error = validateToolCallInput(toolCall);
          if (error) {
            completeToolFn({
              tool_call_id: toolCall.tool_call_id,
              tool_name: toolCall.tool_name,
              parts: [{ part_type: "data", data: { result: null, error, success: false } }]
            });
            return;
          }
          component = import_react2.default.createElement(DefaultToolActions, {
            toolCall,
            toolCallState: get().toolCalls.get(toolCall.tool_call_id),
            completeTool: completeToolFn,
            tool: fnTool
          });
        }
      } catch (componentError) {
        console.error(`\u274C Error creating component for tool ${toolCall.tool_name}:`, componentError);
        component = import_react2.default.createElement("div", {
          className: "text-red-500 p-2 border border-red-200 rounded bg-red-50"
        }, `Error loading tool: ${componentError instanceof Error ? componentError.message : "Unknown component error"}`);
        get().updateToolCallStatus(toolCall.tool_call_id, {
          ...commonProps,
          status: "error",
          error: `Component creation failed: ${componentError instanceof Error ? componentError.message : "Unknown error"}`,
          component,
          endTime: Date.now()
        });
        return;
      }
      get().updateToolCallStatus(toolCall.tool_call_id, {
        ...commonProps,
        component
      });
    } catch (error) {
      console.error(`\u274C Critical error in executeTool for ${toolCall.tool_name}:`, error);
      get().updateToolCallStatus(toolCall.tool_call_id, {
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        status: "error",
        error: `Tool execution failed: ${error instanceof Error ? error.message : "Critical error"}`,
        startTime: Date.now(),
        endTime: Date.now(),
        isExternal: true,
        component: import_react2.default.createElement("div", {
          className: "text-red-500 p-2 border border-red-200 rounded bg-red-50"
        }, `Critical tool error: ${error instanceof Error ? error.message : "Unknown error"}`)
      });
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
          toolCall.resultSent = true;
        }
      });
      return newState;
    });
  },
  getExternalToolResponses: () => {
    const state = get();
    const completedToolCalls = Array.from(state.toolCalls.values()).filter(
      (toolCall) => (toolCall.status === "completed" || toolCall.status === "error") && toolCall.isExternal && toolCall.result !== void 0 && // Only return if there's actually a result
      !toolCall.resultSent
      // **FIX**: Don't return results that were already sent
    );
    return completedToolCalls.map((toolCallState) => ({
      tool_call_id: toolCallState.tool_call_id,
      tool_name: toolCallState.tool_name,
      parts: toolCallState.result?.parts || [{
        type: "data",
        data: { result: null, error: "No result", success: false }
      }]
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
  // Reset streaming and thinking states when streaming is stopped
  resetStreamingStates: () => {
    console.log("\u{1F504} Resetting streaming states");
    set({
      isStreaming: false,
      streamingIndicator: void 0,
      currentThought: void 0
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
  getAllExternalTools: () => {
    const state = get();
    return state.externalTools || [];
  },
  // Setup
  setAgent: (agent) => {
    set({ agent });
  },
  setExternalTools: (tools) => {
    set({ externalTools: tools });
  },
  setWrapOptions: (wrapOptions) => {
    set({ wrapOptions });
  }
}));
var validateToolCallInput = (toolCall) => {
  const notValidJson = "Input is not a valid JSON string or object";
  if (typeof toolCall.input === "string") {
    try {
      JSON.parse(toolCall.input);
      return null;
    } catch {
      return notValidJson;
    }
  }
  return typeof toolCall.input === "object" ? null : notValidJson;
};

// src/useChat.ts
function useChat({
  threadId,
  onError,
  getMetadata,
  agent,
  externalTools,
  beforeSendMessage,
  initialMessages
}) {
  const abortControllerRef = (0, import_react3.useRef)(null);
  const onErrorRef = (0, import_react3.useRef)(onError);
  (0, import_react3.useEffect)(() => {
    onErrorRef.current = onError;
  }, [onError]);
  const getMetadataRef = (0, import_react3.useRef)(getMetadata);
  (0, import_react3.useEffect)(() => {
    getMetadataRef.current = getMetadata;
  }, [getMetadata]);
  (0, import_react3.useEffect)(() => {
    if (externalTools && externalTools.length > 0) {
      chatState.setExternalTools(externalTools);
    }
  }, [externalTools]);
  const chatState = useChatStateStore();
  const createInvokeContext = (0, import_react3.useCallback)(() => ({
    thread_id: threadId,
    run_id: chatState.currentRunId,
    task_id: chatState.currentTaskId,
    getMetadata: getMetadataRef.current
  }), [threadId, chatState.currentRunId, chatState.currentTaskId]);
  const isLoading = useChatStateStore((state) => state.isLoading);
  const isStreaming = useChatStateStore((state) => state.isStreaming);
  const {
    processMessage,
    clearAllStates,
    setError,
    setLoading,
    setStreaming,
    setAgent,
    hasPendingToolCalls
  } = chatState;
  (0, import_react3.useEffect)(() => {
    if (initialMessages) {
      chatState.clearAllStates();
      initialMessages.forEach((message) => chatState.processMessage(message, false));
    }
  }, [initialMessages]);
  const addMessage = (0, import_react3.useCallback)((message) => {
    processMessage(message, false);
  }, [processMessage]);
  (0, import_react3.useEffect)(() => {
    if (agent) {
      setAgent(agent);
    }
  }, [agent, setAgent]);
  const cleanupRef = (0, import_react3.useRef)();
  cleanupRef.current = () => {
    chatState.setStreamingIndicator(void 0);
    setStreaming(false);
    setLoading(false);
  };
  (0, import_react3.useEffect)(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (cleanupRef.current) {
        setTimeout(cleanupRef.current, 0);
      }
    };
  }, []);
  const agentIdRef = (0, import_react3.useRef)(void 0);
  (0, import_react3.useEffect)(() => {
    if (agent?.id !== agentIdRef.current) {
      clearAllStates();
      setError(null);
      agentIdRef.current = agent?.id;
    }
  }, [agent?.id, clearAllStates, setError]);
  const handleStreamEvent = (0, import_react3.useCallback)(
    (event) => {
      processMessage(event, true);
    },
    [processMessage]
  );
  const sendMessage = (0, import_react3.useCallback)(async (content) => {
    if (!agent) return;
    setLoading(true);
    setStreaming(true);
    setError(null);
    chatState.setStreamingIndicator("typing");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      const parts = typeof content === "string" ? [{ part_type: "text", data: content }] : content;
      let distriMessage = import_core3.DistriClient.initDistriMessage("user", parts);
      processMessage(distriMessage, false);
      if (beforeSendMessage) {
        distriMessage = await beforeSendMessage(distriMessage);
      }
      const context = createInvokeContext();
      const a2aMessage = (0, import_core4.convertDistriMessageToA2A)(distriMessage, context);
      const contextMetadata = await getMetadataRef.current?.() || {};
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: {
          ...contextMetadata,
          task_id: chatState.currentTaskId
        }
      }, externalTools);
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        handleStreamEvent(event);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        chatState.setStreamingIndicator(void 0);
        setStreaming(false);
        setLoading(false);
        return;
      }
      const error = err instanceof Error ? err : new Error("Failed to send message");
      setError(error);
      onErrorRef.current?.(error);
      chatState.setStreamingIndicator(void 0);
      setStreaming(false);
      setLoading(false);
    } finally {
      console.log("\u{1F9F9} [useChat sendMessage] Finally block - cleaning up streaming state");
      setLoading(false);
      setStreaming(false);
      abortControllerRef.current = null;
      console.log("\u2705 [useChat sendMessage] Streaming cleanup completed");
    }
  }, [agent, createInvokeContext, handleStreamEvent, setLoading, setStreaming, setError]);
  const sendMessageStream = (0, import_react3.useCallback)(async (content, role = "user") => {
    if (!agent) return;
    setLoading(true);
    setStreaming(true);
    setError(null);
    chatState.setStreamingIndicator("typing");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      const parts = typeof content === "string" ? [{ part_type: "text", data: content }] : content;
      const distriMessage = import_core3.DistriClient.initDistriMessage(role, parts);
      processMessage(distriMessage, false);
      const context = createInvokeContext();
      const a2aMessage = (0, import_core4.convertDistriMessageToA2A)(distriMessage, context);
      const contextMetadata = await getMetadataRef.current?.() || {};
      const stream = await agent.invokeStream({
        message: a2aMessage,
        metadata: {
          ...contextMetadata,
          task_id: chatState.currentTaskId
        }
      });
      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        handleStreamEvent(event);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        chatState.setStreamingIndicator(void 0);
        setStreaming(false);
        setLoading(false);
        return;
      }
      const error = err instanceof Error ? err : new Error("Failed to send message");
      setError(error);
      onErrorRef.current?.(error);
      chatState.setStreamingIndicator(void 0);
      setStreaming(false);
      setLoading(false);
    } finally {
      console.log("\u{1F9F9} [useChat sendMessageStream] Finally block - cleaning up streaming state");
      console.log("\u{1F6D1} [useChat sendMessageStream] Backend stream ended - force stopping all streaming indicators");
      chatState.setStreamingIndicator(void 0);
      setLoading(false);
      setStreaming(false);
      abortControllerRef.current = null;
      console.log("\u2705 [useChat sendMessageStream] Streaming cleanup completed");
    }
  }, [agent, createInvokeContext, handleStreamEvent, threadId, setLoading, setStreaming, setError, hasPendingToolCalls]);
  const stopStreaming = (0, import_react3.useCallback)(() => {
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
var import_react6 = __toESM(require("react"), 1);
var import_core6 = require("@distri/core");

// src/DistriProvider.tsx
var import_react5 = require("react");
var import_core5 = require("@distri/core");

// src/components/ThemeProvider.tsx
var import_react4 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var initialState = {
  theme: "system",
  setTheme: () => null
};
var ThemeProviderContext = (0, import_react4.createContext)(initialState);
function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "distri-theme",
  ...props
}) {
  const [theme, setTheme] = (0, import_react4.useState)(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }
    return defaultTheme === "system" ? "dark" : defaultTheme;
  });
  (0, import_react4.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ThemeProviderContext.Provider, { ...props, value, children });
}
var useTheme = () => {
  const context = (0, import_react4.useContext)(ThemeProviderContext);
  if (context === void 0)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

// src/DistriProvider.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var DistriContext = (0, import_react5.createContext)({
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
  const [client, setClient] = (0, import_react5.useState)(null);
  const [error, setError] = (0, import_react5.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react5.useState)(true);
  (0, import_react5.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ThemeProvider, { defaultTheme, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(DistriContext.Provider, { value: contextValue, children }) });
}
function useDistri() {
  const context = (0, import_react5.useContext)(DistriContext);
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
  const [agent, setAgent] = (0, import_react6.useState)(null);
  const [loading, setLoading] = (0, import_react6.useState)(false);
  const [error, setError] = (0, import_react6.useState)(null);
  const agentRef = (0, import_react6.useRef)(null);
  const currentAgentIdRef = (0, import_react6.useRef)(null);
  const currentClientRef = (0, import_react6.useRef)(null);
  const initializeAgent = (0, import_react6.useCallback)(async () => {
    if (!client || !agentIdOrDef) return;
    if (currentAgentIdRef.current === agentIdOrDef && agentRef.current && currentClientRef.current === client) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      if (currentAgentIdRef.current !== agentIdOrDef || currentClientRef.current !== client) {
        agentRef.current = null;
        setAgent(null);
      }
      const newAgent = await import_core6.Agent.create(agentIdOrDef, client);
      agentRef.current = newAgent;
      currentAgentIdRef.current = agentIdOrDef;
      currentClientRef.current = client;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create agent"));
    } finally {
      setLoading(false);
    }
  }, [client, agentIdOrDef]);
  import_react6.default.useEffect(() => {
    if (!clientLoading && !clientError && client) {
      initializeAgent();
    }
  }, [clientLoading, clientError, client, agentIdOrDef, initializeAgent]);
  import_react6.default.useEffect(() => {
    if (currentAgentIdRef.current !== agentIdOrDef) {
      agentRef.current = null;
      setAgent(null);
      currentAgentIdRef.current = null;
    }
  }, [agentIdOrDef]);
  import_react6.default.useEffect(() => {
    if (currentClientRef.current !== client) {
      agentRef.current = null;
      setAgent(null);
      currentClientRef.current = null;
    }
  }, [client]);
  return {
    // Agent information
    agent,
    // State management
    loading: loading || clientLoading,
    error: error || clientError
  };
}

// src/useAgentDefinitions.ts
var import_react7 = require("react");
function useAgentDefinitions() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = (0, import_react7.useState)([]);
  const [loading, setLoading] = (0, import_react7.useState)(true);
  const [error, setError] = (0, import_react7.useState)(null);
  const fetchAgents = (0, import_react7.useCallback)(async () => {
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
  const getAgent = (0, import_react7.useCallback)(async (agentId) => {
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
  (0, import_react7.useEffect)(() => {
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
var import_react8 = require("react");
function useThreads() {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [threads, setThreads] = (0, import_react8.useState)([]);
  const [loading, setLoading] = (0, import_react8.useState)(true);
  const [error, setError] = (0, import_react8.useState)(null);
  const fetchThreads = (0, import_react8.useCallback)(async () => {
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
  const fetchThread = (0, import_react8.useCallback)(async (threadId) => {
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
  const deleteThread = (0, import_react8.useCallback)(async (threadId) => {
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
  const updateThread = (0, import_react8.useCallback)(async (threadId, localId) => {
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
  (0, import_react8.useEffect)(() => {
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
  (0, import_react8.useEffect)(() => {
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
var import_react15 = require("react");

// src/components/ChatInput.tsx
var import_react11 = require("react");
var import_lucide_react4 = require("lucide-react");

// src/components/VoiceInput.tsx
var import_react10 = require("react");
var import_lucide_react3 = require("lucide-react");
var import_react_speech_recognition = __toESM(require("react-speech-recognition"), 1);

// src/hooks/useSpeechToText.ts
var import_react9 = require("react");
var useSpeechToText = () => {
  const { client } = useDistri();
  const [isTranscribing, setIsTranscribing] = (0, import_react9.useState)(false);
  const [isStreaming, setIsStreaming] = (0, import_react9.useState)(false);
  const streamingConnectionRef = (0, import_react9.useRef)(null);
  const transcribe = (0, import_react9.useCallback)(async (audioBlob, config = {}) => {
    if (!client) {
      throw new Error("DistriClient not initialized");
    }
    if (isTranscribing) {
      throw new Error("Transcription already in progress");
    }
    setIsTranscribing(true);
    try {
      const result = await client.transcribe(audioBlob, config);
      return result;
    } finally {
      setIsTranscribing(false);
    }
  }, [client, isTranscribing]);
  const startStreamingTranscription = (0, import_react9.useCallback)(async (options = {}) => {
    if (!client) {
      throw new Error("DistriClient not initialized");
    }
    if (isStreaming) {
      throw new Error("Streaming transcription already in progress");
    }
    setIsStreaming(true);
    const enhancedOptions = {
      ...options,
      onStart: () => {
        console.log("\u{1F3A4} Streaming transcription started");
        options.onStart?.();
      },
      onEnd: () => {
        console.log("\u{1F3A4} Streaming transcription ended");
        setIsStreaming(false);
        streamingConnectionRef.current = null;
        options.onEnd?.();
      },
      onError: (error) => {
        console.error("\u{1F3A4} Streaming transcription error:", error);
        setIsStreaming(false);
        streamingConnectionRef.current = null;
        options.onError?.(error);
      },
      onTranscript: (text, isFinal) => {
        console.log("\u{1F3A4} Transcript:", { text, isFinal });
        options.onTranscript?.(text, isFinal);
      }
    };
    try {
      const connection = await client.streamingTranscription(enhancedOptions);
      streamingConnectionRef.current = connection;
      return connection;
    } catch (error) {
      setIsStreaming(false);
      streamingConnectionRef.current = null;
      throw error;
    }
  }, [client, isStreaming]);
  const stopStreamingTranscription = (0, import_react9.useCallback)(() => {
    if (streamingConnectionRef.current) {
      console.log("\u{1F3A4} Stopping streaming transcription");
      streamingConnectionRef.current.stop();
      streamingConnectionRef.current.close();
      streamingConnectionRef.current = null;
    }
    setIsStreaming(false);
  }, []);
  const sendAudio = (0, import_react9.useCallback)((audioData) => {
    if (streamingConnectionRef.current) {
      streamingConnectionRef.current.sendAudio(audioData);
    } else {
      console.warn("\u{1F3A4} No active streaming connection to send audio to");
    }
  }, []);
  const sendText = (0, import_react9.useCallback)((text) => {
    if (streamingConnectionRef.current) {
      streamingConnectionRef.current.sendText(text);
    } else {
      console.warn("\u{1F3A4} No active streaming connection to send text to");
    }
  }, []);
  return {
    // Single transcription
    transcribe,
    isTranscribing,
    // Streaming transcription
    startStreamingTranscription,
    stopStreamingTranscription,
    sendAudio,
    sendText,
    isStreaming
  };
};

// src/components/VoiceInput.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
var VoiceInput = ({
  onTranscript,
  onError,
  className = "",
  disabled = false,
  language = "en-US",
  interimResults = true,
  useBrowserSpeechRecognition = true
}) => {
  const [isListening, setIsListening] = (0, import_react10.useState)(false);
  const [showModal, setShowModal] = (0, import_react10.useState)(false);
  const [interimTranscript, setInterimTranscript] = (0, import_react10.useState)("");
  const [mediaRecorder, setMediaRecorder] = (0, import_react10.useState)(null);
  const {
    transcript,
    interimTranscript: browserInterimTranscript,
    finalTranscript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition
  } = (0, import_react_speech_recognition.useSpeechRecognition)();
  const speechToText = useSpeechToText();
  const useBrowser = useBrowserSpeechRecognition && browserSupportsSpeechRecognition;
  const canUseBackend = !useBrowser && speechToText;
  (0, import_react10.useEffect)(() => {
    if (finalTranscript && finalTranscript.trim()) {
      onTranscript(finalTranscript.trim());
      resetTranscript();
      setShowModal(false);
      setIsListening(false);
    }
  }, [finalTranscript, onTranscript, resetTranscript]);
  (0, import_react10.useEffect)(() => {
    if (useBrowser) {
      setInterimTranscript(browserInterimTranscript || transcript);
    }
  }, [browserInterimTranscript, transcript, useBrowser]);
  const startListening = (0, import_react10.useCallback)(async () => {
    if (disabled) return;
    setShowModal(true);
    setIsListening(true);
    setInterimTranscript("");
    if (useBrowser) {
      try {
        await import_react_speech_recognition.default.startListening({
          continuous: true,
          language,
          interimResults
        });
      } catch (error) {
        console.error("Speech recognition error:", error);
        onError?.("Failed to start speech recognition");
        setShowModal(false);
        setIsListening(false);
      }
    } else if (canUseBackend) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        setMediaRecorder(recorder);
        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: "audio/webm" });
          try {
            if (!speechToText) {
              throw new Error("No DistriClient available for transcription");
            }
            setInterimTranscript("Processing...");
            const transcript2 = await speechToText.transcribe(audioBlob, { model: "whisper-1" });
            if (transcript2.trim()) {
              onTranscript(transcript2.trim());
            }
            setShowModal(false);
            setIsListening(false);
            setInterimTranscript("");
          } catch (error) {
            console.error("Backend transcription error:", error);
            onError?.(`Transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            setShowModal(false);
            setIsListening(false);
            setInterimTranscript("");
          } finally {
            stream.getTracks().forEach((track) => track.stop());
            setMediaRecorder(null);
          }
        };
        recorder.start();
        const timeoutId = setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }, 3e4);
        recorder._timeout = timeoutId;
      } catch (error) {
        console.error("Microphone access error:", error);
        onError?.("Failed to access microphone");
        setShowModal(false);
        setIsListening(false);
      }
    } else {
      onError?.("Speech recognition is not available. Please provide a DistriClient for backend transcription.");
      setShowModal(false);
      setIsListening(false);
    }
  }, [disabled, useBrowser, canUseBackend, language, interimResults, onError]);
  const stopListening = (0, import_react10.useCallback)(() => {
    if (useBrowser) {
      import_react_speech_recognition.default.stopListening();
    } else if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      if (mediaRecorder._timeout) {
        clearTimeout(mediaRecorder._timeout);
      }
    }
    if (interimTranscript.trim() && interimTranscript !== "Processing...") {
      onTranscript(interimTranscript.trim());
    }
    setShowModal(false);
    setIsListening(false);
    setInterimTranscript("");
    resetTranscript();
  }, [useBrowser, mediaRecorder, interimTranscript, onTranscript, resetTranscript]);
  const handleCancel = (0, import_react10.useCallback)(() => {
    if (useBrowser) {
      import_react_speech_recognition.default.stopListening();
    } else if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      if (mediaRecorder._timeout) {
        clearTimeout(mediaRecorder._timeout);
      }
    }
    setShowModal(false);
    setIsListening(false);
    setInterimTranscript("");
    resetTranscript();
  }, [useBrowser, mediaRecorder, resetTranscript]);
  (0, import_react10.useEffect)(() => {
    let timeoutId;
    if (isListening && !listening && interimTranscript.trim()) {
      timeoutId = setTimeout(() => {
        stopListening();
      }, 1e3);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isListening, listening, interimTranscript, stopListening]);
  const isActive = isListening || listening;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "button",
      {
        onClick: isActive ? stopListening : startListening,
        disabled: disabled || (speechToText?.isTranscribing ?? false),
        className: `h-10 w-10 rounded-md transition-colors flex items-center justify-center ${isActive ? "bg-blue-600 hover:bg-blue-700 text-white animate-pulse" : "hover:bg-muted text-muted-foreground"} ${className}`,
        title: isActive ? "Click to stop recording" : useBrowser ? "Click to speak" : canUseBackend ? "Click to record for transcription" : "Speech recognition not available",
        children: speechToText?.isTranscribing ?? false ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react3.Loader2, { className: "h-5 w-5 animate-spin" }) : isActive ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react3.MicOff, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react3.Mic, { className: "h-5 w-5" })
      }
    ),
    showModal && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "bg-background border border-border rounded-lg p-8 max-w-md w-full mx-4 text-center", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "mb-6", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: `w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${listening ? "bg-blue-600 animate-pulse shadow-lg shadow-blue-600/30" : "bg-muted"}`, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react3.Mic, { className: "h-10 w-10 text-white" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: "text-lg font-semibold mb-2", children: listening ? "Listening..." : useBrowser ? "Click to start speaking" : "Recording for transcription..." }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "min-h-[60px] p-3 bg-muted rounded-lg text-left", children: interimTranscript ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "text-sm", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: listening ? "text-muted-foreground" : "text-foreground", children: interimTranscript }),
          listening && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "animate-pulse", children: "|" })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-sm text-muted-foreground italic", children: "Start speaking..." }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex gap-3 justify-center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "button",
          {
            onClick: handleCancel,
            className: "px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors",
            children: "Cancel"
          }
        ),
        !listening && interimTranscript.trim() && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "button",
          {
            onClick: stopListening,
            className: "px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors",
            children: "Send"
          }
        ),
        !listening && !interimTranscript.trim() && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "button",
          {
            onClick: startListening,
            className: "px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors",
            children: "Start Listening"
          }
        ),
        !useBrowser && isListening && mediaRecorder && mediaRecorder.state === "recording" && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "button",
          {
            onClick: stopListening,
            className: "px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors",
            children: "Stop Recording"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-xs text-muted-foreground mt-4", children: useBrowser ? "Speak naturally. The system will automatically detect when you're finished." : "Speak clearly. Click 'Send' when finished or wait for automatic processing." })
    ] }) })
  ] });
};

// src/components/ChatInput.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var ChatInput = ({
  value,
  onChange,
  onSend,
  onStop,
  placeholder = "Type your message...",
  disabled = false,
  isStreaming = false,
  className = "",
  attachedImages = [],
  onRemoveImage,
  onAddImages,
  voiceEnabled = false,
  onVoiceRecord,
  onStartStreamingVoice,
  isStreamingVoice = false,
  useSpeechRecognition: useSpeechRecognition2 = false,
  onSpeechTranscript
}) => {
  const textareaRef = (0, import_react11.useRef)(null);
  const fileInputRef = (0, import_react11.useRef)(null);
  const mediaRecorderRef = (0, import_react11.useRef)(null);
  const [isRecording, setIsRecording] = (0, import_react11.useState)(false);
  const [recordingTime, setRecordingTime] = (0, import_react11.useState)(0);
  (0, import_react11.useEffect)(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);
  const convertFileToBase64 = (0, import_react11.useCallback)((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64Data = reader.result.split(",")[1];
          resolve(base64Data);
        } else {
          reject(new Error("Failed to read file as base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);
  const handleFileSelect = (0, import_react11.useCallback)((e) => {
    const files = e.target.files;
    if (files && files.length > 0 && onAddImages) {
      onAddImages(files);
    }
    e.target.value = "";
  }, [onAddImages]);
  const startRecording = (0, import_react11.useCallback)(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        if (onVoiceRecord) {
          onVoiceRecord(audioBlob);
        }
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      const timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1e3);
      mediaRecorder._timer = timer;
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [onVoiceRecord]);
  const stopRecording = (0, import_react11.useCallback)(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current._timer) {
        clearInterval(mediaRecorderRef.current._timer);
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  }, [isRecording]);
  const handleVoiceToggle = (0, import_react11.useCallback)(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);
  const handleSpeechTranscript = (0, import_react11.useCallback)((transcript) => {
    onChange(transcript);
    onSpeechTranscript?.(transcript);
  }, [onChange, onSpeechTranscript]);
  const handleSend = (0, import_react11.useCallback)(async () => {
    if (!value.trim() && attachedImages.length === 0 || disabled || isStreaming) {
      return;
    }
    try {
      if (attachedImages.length > 0) {
        const parts = [];
        if (value.trim()) {
          parts.push({ part_type: "text", data: value.trim() });
        }
        for (const image of attachedImages) {
          const base64Data = await convertFileToBase64(image.file);
          parts.push({
            part_type: "image",
            data: {
              mime_type: image.file.type,
              data: base64Data,
              name: image.name
            }
          });
        }
        onSend(parts);
      } else {
        onSend(value);
      }
      onChange("");
    } catch (error) {
      console.error("Error processing images:", error);
    }
  }, [value, attachedImages, disabled, isStreaming, onSend, onChange, convertFileToBase64]);
  const handleStop = () => {
    console.log("handleStop called:", { isStreaming, onStop: !!onStop });
    if (isStreaming && onStop) {
      onStop();
    }
  };
  const hasContent = value.trim().length > 0 || attachedImages.length > 0;
  const isDisabled = disabled;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: `relative w-full ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex flex-col w-full", children: [
    attachedImages.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "flex flex-wrap gap-2 mb-2 mx-3 sm:mx-5", children: attachedImages.map((image) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "relative group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "img",
        {
          src: image.preview,
          alt: image.name,
          className: "w-16 h-16 object-cover rounded-lg border border-border"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "button",
        {
          onClick: () => onRemoveImage?.(image.id),
          className: "absolute -top-1 -right-1 w-5 h-5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
          children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react4.X, { className: "w-3 h-3" })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate", children: image.name })
    ] }, image.id)) }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "mx-3 sm:mx-5 rounded-2xl border border-input bg-input p-2", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-end gap-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "textarea",
        {
          ref: textareaRef,
          value,
          onChange: (e) => onChange(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if ((value.trim() || attachedImages.length > 0) && !disabled && !isStreaming) {
                handleSend();
              }
            }
          },
          placeholder: attachedImages.length > 0 ? "Add a message..." : placeholder,
          disabled: isDisabled,
          rows: 1,
          className: "flex-1 resize-none bg-transparent outline-none border-none leading-6 text-sm text-foreground placeholder:text-muted-foreground max-h-[40dvh] overflow-auto px-2 py-2"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center gap-1 shrink-0", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "button",
          {
            onClick: () => fileInputRef.current?.click(),
            disabled: isDisabled,
            className: "h-10 w-10 rounded-md hover:bg-muted text-muted-foreground flex items-center justify-center",
            title: "Attach image",
            children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react4.ImageIcon, { className: "h-5 w-5" })
          }
        ),
        useSpeechRecognition2 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          VoiceInput,
          {
            onTranscript: handleSpeechTranscript,
            disabled: isDisabled || isStreaming,
            onError: (error) => console.error("Voice input error:", error),
            useBrowserSpeechRecognition: true,
            language: "en-US",
            interimResults: true
          }
        ),
        voiceEnabled && !useSpeechRecognition2 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "button",
            {
              onClick: handleVoiceToggle,
              disabled: isDisabled || isStreaming || isStreamingVoice,
              className: `h-10 w-10 rounded-md flex items-center justify-center ${isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "hover:bg-muted text-muted-foreground"}`,
              title: isRecording ? `Recording... ${recordingTime}s` : "Record voice message",
              children: isRecording ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react4.MicOff, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react4.Mic, { className: "h-5 w-5" })
            }
          ),
          onStartStreamingVoice && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "button",
            {
              onClick: onStartStreamingVoice,
              disabled: isDisabled || isStreaming || isRecording,
              className: `h-10 w-10 rounded-md flex items-center justify-center ${isStreamingVoice ? "bg-blue-600 text-white animate-pulse" : "hover:bg-muted text-muted-foreground"}`,
              title: isStreamingVoice ? "Streaming voice conversation active" : "Start streaming voice conversation",
              children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react4.Radio, { className: "h-5 w-5" })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "button",
          {
            onClick: isStreaming ? handleStop : handleSend,
            disabled: isStreaming ? false : !hasContent || isDisabled,
            className: `h-10 w-10 rounded-full flex items-center justify-center ${isStreaming ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : hasContent && !disabled ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground"}`,
            title: isStreaming ? "Stop" : "Send",
            children: isStreaming ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react4.Square, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react4.Send, { className: "h-5 w-5" })
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: "image/*",
        multiple: true,
        className: "hidden",
        onChange: handleFileSelect
      }
    )
  ] }) });
};

// src/components/renderers/MessageRenderer.tsx
var import_core8 = require("@distri/core");

// src/components/renderers/utils.tsx
function extractContent(message) {
  let text = "";
  let hasMarkdown = false;
  let hasCode = false;
  let hasLinks = false;
  let hasImages = false;
  let imageParts = [];
  if ("parts" in message && Array.isArray(message.parts)) {
    const distriMessage = message;
    const textParts = distriMessage.parts?.filter((p) => p.part_type === "text" && p.data)?.map((p) => p.data)?.filter((text2) => text2 && text2.trim()) || [];
    text = textParts.join(" ").trim();
    imageParts = distriMessage.parts?.filter((p) => p.part_type === "image") || [];
    hasMarkdown = /[*_`#[\]()>]/.test(text);
    hasCode = /```|`/.test(text);
    hasLinks = /\[.*?\]\(.*?\)|https?:\/\/[^\s]+/.test(text);
    hasImages = /!\[.*?\]\(.*?\)/.test(text) || imageParts.length > 0;
  } else {
    text = JSON.stringify(message, null, 2);
  }
  return {
    text,
    hasMarkdown,
    hasCode,
    hasLinks,
    hasImages,
    imageParts,
    rawContent: message
  };
}

// src/components/renderers/ImageRenderer.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var ImageRenderer = ({
  imageParts,
  className = ""
}) => {
  if (!imageParts || imageParts.length === 0) {
    return null;
  }
  const getImageSrc = (imageData) => {
    if ("data" in imageData) {
      return `data:${imageData.mime_type};base64,${imageData.data}`;
    } else {
      return imageData.url;
    }
  };
  const getImageAlt = (imageData) => {
    return imageData.name || "Attached image";
  };
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: `flex flex-wrap gap-3 mt-3 ${className}`, children: imageParts.map((imagePart, index) => {
    const src = getImageSrc(imagePart.data);
    const alt = getImageAlt(imagePart.data);
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "relative group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "img",
        {
          src,
          alt,
          className: "max-w-sm max-h-64 rounded-lg border border-border object-cover shadow-sm hover:shadow-md transition-shadow cursor-pointer",
          onClick: () => {
            window.open(src, "_blank");
          }
        }
      ),
      imagePart.data.name && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity", children: imagePart.data.name })
    ] }, index);
  }) });
};

// src/components/renderers/TextRenderer.tsx
var import_react_markdown = __toESM(require("react-markdown"), 1);
var import_react_syntax_highlighter = require("react-syntax-highlighter");
var import_prism = require("react-syntax-highlighter/dist/esm/styles/prism");
var import_remark_gfm = __toESM(require("remark-gfm"), 1);
var import_rehype_raw = __toESM(require("rehype-raw"), 1);
var import_jsx_runtime9 = require("react/jsx-runtime");
var TextRenderer = ({ content, className = "" }) => {
  const { text } = content;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: `prose prose-sm max-w-none overflow-hidden break-words ${className}`, style: { wordBreak: "break-word", overflowWrap: "break-word" }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
          return !isInline && language ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "w-full max-w-full overflow-hidden", style: { maxWidth: "100%" }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            import_react_syntax_highlighter.Prism,
            {
              style: import_prism.tomorrow,
              language,
              PreTag: "div",
              className: "!mt-0 !mb-0 text-sm",
              wrapLongLines: true,
              customStyle: {
                wordBreak: "break-all",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap",
                maxWidth: "100%",
                width: "100%",
                overflow: "hidden"
              },
              children: String(children).replace(/\n$/, "")
            }
          ) }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("code", { className: "bg-gray-100 px-1 py-0.5 rounded text-sm font-mono", children });
        },
        p: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mb-2 last:mb-0", children }),
        ul: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("ul", { className: "list-disc list-inside mb-2", children }),
        ol: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("ol", { className: "list-decimal list-inside mb-2", children }),
        blockquote: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("blockquote", { className: "border-l-4 border-gray-300 pl-4 italic text-gray-600", children }),
        h1: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h1", { className: "text-lg font-bold mb-2", children }),
        h2: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h2", { className: "text-base font-bold mb-2", children }),
        h3: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-sm font-bold mb-1", children }),
        h4: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h4", { className: "text-sm font-semibold mb-1", children }),
        h5: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h5", { className: "text-xs font-semibold mb-1", children }),
        h6: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h6", { className: "text-xs font-semibold mb-1", children })
      },
      children: text
    }
  ) });
};
var TextRenderer_default = TextRenderer;

// src/components/renderers/UserMessageRenderer.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
var UserMessageRenderer = ({
  message,
  className = ""
}) => {
  const content = extractContent(message);
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: `py-3 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "flex justify-end", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "max-w-[80%] bg-muted/60 text-foreground rounded-2xl px-4 py-3 border", children: [
    content.text && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(TextRenderer_default, { content }),
    content.imageParts && content.imageParts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ImageRenderer, { imageParts: content.imageParts })
  ] }) }) });
};

// src/components/renderers/StepBasedRenderer.tsx
var import_core7 = require("@distri/core");

// src/components/renderers/StreamingTextRenderer.tsx
var import_react12 = require("react");
var import_react_markdown2 = __toESM(require("react-markdown"), 1);
var import_react_syntax_highlighter2 = require("react-syntax-highlighter");
var import_prism2 = require("react-syntax-highlighter/dist/esm/styles/prism");
var import_remark_gfm2 = __toESM(require("remark-gfm"), 1);
var import_rehype_raw2 = __toESM(require("rehype-raw"), 1);
var import_jsx_runtime11 = require("react/jsx-runtime");
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
  const renderedContent = (0, import_react12.useMemo)(() => {
    const cleanedText = processAgentResponseBlocks(text);
    if (!cleanedText.trim()) {
      return null;
    }
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: `prose prose-sm max-w-none overflow-hidden break-words ${className}`, style: { wordBreak: "break-word", overflowWrap: "break-word" }, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
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
          thought: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "inline-flex items-start gap-1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "text-muted-foreground", children: "\u{1F4AD}" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "text-foreground", children })
          ] }),
          thinking: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "border-l-4 border-blue-400/30 pl-4 my-3 bg-blue-50/20 p-3 rounded-r-md", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "text-sm text-blue-600 font-medium mb-1", children: "\u{1F914} Processing" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "text-sm text-muted-foreground italic", children })
          ] }),
          action: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "border-l-4 border-green-400/30 pl-4 my-3 bg-green-50/20 p-3 rounded-r-md", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "text-sm text-green-600 font-medium mb-1", children: "\u26A1 Action" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "text-sm text-muted-foreground", children })
          ] }),
          code: ({ className: codeClassName, children }) => {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const language = match ? match[1] : "";
            const isInline = !match;
            return !isInline && language ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "w-full max-w-full overflow-hidden", style: { maxWidth: "100%" }, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              import_react_syntax_highlighter2.Prism,
              {
                style: import_prism2.tomorrow,
                language,
                PreTag: "div",
                className: "!mt-0 !mb-0 rounded-md text-sm",
                wrapLongLines: true,
                customStyle: {
                  wordBreak: "break-all",
                  overflowWrap: "break-word",
                  whiteSpace: "pre-wrap",
                  maxWidth: "100%",
                  width: "100%",
                  overflow: "hidden"
                },
                children: String(children).replace(/\n$/, "")
              }
            ) }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("code", { className: "bg-muted px-2 py-1 rounded text-sm font-mono text-foreground", children });
          },
          p: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "mb-4 last:mb-0 leading-relaxed text-foreground", children }),
          ul: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("ul", { className: "list-disc list-inside mb-4 space-y-1 text-foreground", children }),
          ol: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("ol", { className: "list-decimal list-inside mb-4 space-y-1 text-foreground", children }),
          blockquote: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("blockquote", { className: "border-l-4 border-border pl-4 italic text-muted-foreground my-3", children }),
          h1: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h1", { className: "text-xl font-bold mb-4 text-foreground", children }),
          h2: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { className: "text-lg font-bold mb-4 text-foreground", children }),
          h3: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { className: "text-base font-bold mb-4 text-foreground", children }),
          h4: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h4", { className: "text-sm font-semibold mb-4 text-foreground", children }),
          h5: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h5", { className: "text-sm font-semibold mb-1 text-foreground", children }),
          h6: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h6", { className: "text-xs font-semibold mb-1 text-foreground", children }),
          strong: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { className: "font-semibold text-foreground", children }),
          em: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("em", { className: "italic text-foreground", children }),
          pre: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("pre", { className: "w-full bg-muted border border-border rounded-md p-3 overflow-x-auto break-words whitespace-pre-wrap mb-4 block", children }),
          table: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "overflow-x-auto mb-4", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("table", { className: "min-w-full border-collapse border border-border", children }) }),
          th: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("th", { className: "border border-border px-3 py-2 bg-muted font-semibold text-left", children }),
          td: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("td", { className: "border border-border px-3 py-2", children }),
          a: ({ children, href }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "relative", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "transition-all duration-200 ease-out", children: renderedContent }),
    isStreaming && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "inline-block w-0.5 h-4 bg-primary animate-pulse ml-1 transition-opacity duration-200" })
  ] });
};

// src/components/renderers/AssistantMessageRenderer.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
var AssistantMessageRenderer = ({
  message,
  className = ""
}) => {
  const steps = useChatStateStore((state) => state.steps);
  const content = extractContent(message);
  const stepId = message.step_id;
  const step = stepId ? steps.get(stepId) : null;
  const isStreaming = step?.status === "running";
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: `${className} w-full`, children: [
    content.text && (isStreaming ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      StreamingTextRenderer,
      {
        text: content.text,
        isStreaming
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(TextRenderer_default, { content })),
    content.imageParts && content.imageParts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ImageRenderer, { imageParts: content.imageParts })
  ] });
};

// src/components/renderers/ThinkingRenderer.tsx
var import_jsx_runtime13 = require("react/jsx-runtime");
var LoadingShimmer = ({ text, className }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: `w-full ${className || ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "font-medium text-shimmer", children: text }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("style", { children: `
          @keyframes shimmer {
            0% { background-position: -150% 0; }
            100% { background-position: 150% 0; }
          }
          .text-shimmer {
            background: linear-gradient(90deg, hsl(var(--muted-foreground)) 0%, hsl(var(--primary)) 50%, hsl(var(--muted-foreground)) 100%);
            background-size: 150% 100%;
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 2s ease-in-out infinite;
          }
        ` })
  ] });
};
var ThinkingRenderer = ({
  className = ""
}) => {
  const component = LoadingShimmer({ text: "Thinking..." });
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: `flex items-start gap-3 py-3 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "w-full", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: component }) }) });
};

// src/components/renderers/StepBasedRenderer.tsx
var import_lucide_react5 = require("lucide-react");
var import_jsx_runtime14 = require("react/jsx-runtime");
var StepIndicator = ({ step }) => {
  const getStatusIcon = () => {
    switch (step.status) {
      case "running":
        return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "animate-spin rounded-full h-3 w-3 border-b-2 border-primary" });
      case "completed":
        return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_lucide_react5.CheckCircle, { className: "h-3 w-3 text-green-500" });
      case "failed":
        return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_lucide_react5.AlertCircle, { className: "h-3 w-3 text-red-500" });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_lucide_react5.Clock, { className: "h-3 w-3 text-muted-foreground" });
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
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(LoadingShimmer, { text, className: "text-sm" });
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
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "flex items-center gap-2 text-xs text-muted-foreground mb-1 opacity-60", children: [
      getStatusIcon(),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "font-medium", children: step.title }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("span", { children: [
        "(",
        getDuration(),
        ")"
      ] })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "flex items-center gap-2 text-sm text-muted-foreground mb-3", children: [
    getStatusIcon(),
    step.status === "running" ? renderShimmerForRunning() : /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "font-medium", children: getStatusText() })
  ] });
};
var StepBasedRenderer = ({
  message
}) => {
  const steps = useChatStateStore((state) => state.steps);
  if (!(0, import_core7.isDistriMessage)(message)) {
    return null;
  }
  const distriMessage = message;
  const stepId = distriMessage.step_id;
  const step = stepId ? steps.get(stepId) : null;
  if (distriMessage.role === "user") {
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(UserMessageRenderer, { message: distriMessage });
  }
  if (distriMessage.role === "assistant") {
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "flex items-start gap-4", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "w-full", children: [
      step && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(StepIndicator, { step }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "transition-all duration-200 ease-in-out", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(AssistantMessageRenderer, { message: distriMessage }) })
    ] }) });
  }
  return null;
};

// src/components/renderers/ToolExecutionRenderer.tsx
var import_react13 = require("react");
var import_lucide_react6 = require("lucide-react");
var import_jsx_runtime15 = require("react/jsx-runtime");
var getFriendlyToolMessage = (toolName, input) => {
  switch (toolName) {
    case "search":
      return `Searching "${input?.query || "unknown query"}"`;
    case "call_search_agent":
      return `Searching`;
    case "read_values":
      return `Reading values`;
    case "get_sheet_info":
      return `Getting sheet info`;
    case "get_context_pack":
      return `Understanding the spreadsheet`;
    case "write_values":
      return `Updating values`;
    case "clear_values":
      return `Clearing values`;
    case "merge_cells":
      return `Merging cells`;
    case "call_blink_ops_agent":
      return `Planning sheet updates`;
    case "apply_blink_ops":
      return `Applying sheet updates`;
    case "final":
      return `Finalizing`;
    default:
      return `Executing ${toolName}`;
  }
};
var ToolExecutionRenderer = ({
  event,
  toolCallStates
}) => {
  const toolCalls = event.data?.tool_calls || [];
  if (toolCalls.length === 0) {
    console.log("\u{1F527} No tool calls found in event data or metadata");
    return null;
  }
  const renderResultData = (toolCallState) => {
    if (!toolCallState?.result) {
      return "No result available";
    }
    const dataPart = toolCallState.result.parts?.find((part) => part?.part_type === "data");
    if (dataPart && "data" in dataPart) {
      return JSON.stringify(dataPart.data, null, 2);
    }
    return JSON.stringify(toolCallState.result, null, 2);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_jsx_runtime15.Fragment, { children: toolCalls.map((toolCall) => {
    const ToolCallCard = () => {
      const [isExpanded, setIsExpanded] = (0, import_react13.useState)(false);
      const [activeTab, setActiveTab] = (0, import_react13.useState)("output");
      const toolCallState = toolCallStates.get(toolCall.tool_call_id);
      const friendlyMessage = getFriendlyToolMessage(toolCall.tool_name, toolCall.input);
      const executionTime = toolCallState?.endTime && toolCallState?.startTime ? toolCallState?.endTime - toolCallState?.startTime : void 0;
      const renderTabs = () => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "mt-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "flex items-center gap-2 mb-2", children: ["output", "input"].map((tab) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
          "button",
          {
            onClick: () => setActiveTab(tab),
            className: `text-xs px-2 py-1 rounded border transition-colors ${activeTab === tab ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`,
            children: tab === "output" ? "Output" : "Input"
          },
          tab
        )) }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("pre", { className: "text-xs text-muted-foreground whitespace-pre-wrap overflow-auto break-words border border-muted rounded-md p-3", children: activeTab === "input" ? JSON.stringify(toolCall.input, null, 2) : renderResultData(toolCallState) }),
        toolCallState?.error && activeTab === "output" && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "mt-2 text-xs text-destructive", children: [
          "Error: ",
          toolCallState.error
        ] })
      ] });
      if (toolCallState?.status === "pending" || toolCallState?.status === "running") {
        return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(LoadingShimmer, { text: friendlyMessage }) }, `${toolCall.tool_call_id}-executing mb-2`);
      }
      if (toolCallState?.status === "completed") {
        const time = executionTime || 0;
        return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "mb-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "flex items-center justify-between text-sm text-muted-foreground", children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react6.CheckCircle, { className: "w-4 h-4 text-green-600" }),
              /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { children: [
                friendlyMessage,
                " completed",
                time > 100 && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { className: "text-xs ml-1", children: [
                  "(",
                  (time / 1e3).toFixed(1),
                  "s)"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
              "button",
              {
                onClick: () => setIsExpanded(!isExpanded),
                className: "flex items-center gap-1 text-xs hover:text-foreground transition-colors",
                children: [
                  isExpanded ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react6.ChevronDown, { className: "w-3 h-3" }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react6.ChevronRight, { className: "w-3 h-3" }),
                  "View details"
                ]
              }
            )
          ] }),
          isExpanded && renderTabs()
        ] }, `${toolCall.tool_call_id}-completed`);
      }
      if (toolCallState?.status === "error") {
        return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "mb-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "flex items-center gap-2 text-sm text-destructive mb-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react6.XCircle, { className: "w-4 h-4" }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { children: [
              friendlyMessage,
              " failed",
              toolCallState.error && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { className: "text-xs ml-1 text-muted-foreground", children: [
                "- ",
                toolCallState.error
              ] })
            ] })
          ] }),
          renderTabs()
        ] }, `${toolCall.tool_call_id}-error`);
      }
      if (toolCallState) {
        return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react6.Clock, { className: "w-4 h-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { children: [
            friendlyMessage,
            " (",
            toolCallState.status,
            ")"
          ] })
        ] }, `${toolCall.tool_call_id}-unknown`);
      }
      return null;
    };
    if (toolCall.tool_name === "final") {
      return null;
    }
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(ToolCallCard, {}, toolCall.tool_call_id);
  }) });
};

// src/components/renderers/MessageRenderer.tsx
var import_jsx_runtime16 = require("react/jsx-runtime");
var RendererWrapper = ({
  children,
  className = ""
}) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: `w-full px-4 overflow-hidden ${className}`, style: { maxWidth: "100%", wordBreak: "break-word" }, children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "w-full max-w-4xl mx-auto overflow-hidden", style: { maxWidth: "min(100%, 56rem)", wordBreak: "break-word" }, children }) });
function MessageRenderer({
  message,
  index
}) {
  const toolCallsState = useChatStateStore((state) => state.toolCalls);
  if ((0, import_core8.isDistriMessage)(message)) {
    const distriMessage = message;
    const textContent = distriMessage.parts.filter((part) => part.part_type === "text").map((part) => part.data).join("").trim();
    const imageParts = distriMessage.parts.filter((part) => part.part_type === "image");
    if (!textContent && imageParts.length === 0) {
      return null;
    }
  }
  if ((0, import_core8.isDistriMessage)(message)) {
    const distriMessage = message;
    switch (distriMessage.role) {
      case "user":
        return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(RendererWrapper, { className: "distri-user-message", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          UserMessageRenderer,
          {
            message: distriMessage
          }
        ) }, `user-${index}`);
      case "assistant":
        return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(RendererWrapper, { className: "distri-assistant-message", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          StepBasedRenderer,
          {
            message: distriMessage
          }
        ) }, `assistant-${index}`);
      default:
        return null;
    }
  }
  if ((0, import_core8.isDistriEvent)(message)) {
    const event = message;
    switch (event.type) {
      case "run_started":
        return null;
      case "plan_started":
        return null;
      case "plan_finished":
        return null;
      case "text_message_start":
        return null;
      case "text_message_content":
        return null;
      case "text_message_end":
        return null;
      case "step_started": {
        return null;
      }
      case "step_completed":
        return null;
      case "tool_calls":
        if (toolCallsState.size === 0) {
          return null;
        }
        return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(RendererWrapper, { className: "distri-tool-execution-start", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          ToolExecutionRenderer,
          {
            event,
            toolCallStates: toolCallsState
          }
        ) }, `tool-execution-start-${index}`);
      case "tool_results":
        return null;
      case "agent_handover":
        return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(RendererWrapper, { className: "distri-handover", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "p-3 bg-muted rounded border", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "text-sm text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: "Handover to:" }),
          " ",
          event.data?.to_agent || "unknown agent"
        ] }) }) }, `handover-${index}`);
      case "run_finished":
        return null;
      case "run_error":
        return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(RendererWrapper, { className: "distri-run-error", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "p-3 bg-destructive/10 border border-destructive/20 rounded", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "text-sm text-destructive", children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: "Error:" }),
            " ",
            event.data?.message || "Unknown error occurred"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { className: "mt-2 text-xs text-destructive underline", children: "Retry" })
        ] }) }, `run-error-${index}`);
      default:
        return null;
    }
  }
  return null;
}

// src/components/renderers/TypingIndicator.tsx
var import_jsx_runtime17 = require("react/jsx-runtime");
var TypingIndicator = () => {
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "flex items-center gap-4 py-3", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "w-full", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "flex items-center space-x-1 p-3 bg-muted/30 rounded-lg w-fit", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "flex space-x-1", children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
      "div",
      {
        className: "h-2 w-2 bg-muted-foreground rounded-full animate-bounce",
        style: { animationDelay: "0ms" }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
      "div",
      {
        className: "h-2 w-2 bg-muted-foreground rounded-full animate-bounce",
        style: { animationDelay: "150ms" }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
      "div",
      {
        className: "h-2 w-2 bg-muted-foreground rounded-full animate-bounce",
        style: { animationDelay: "300ms" }
      }
    )
  ] }) }) }) });
};

// src/components/ui/select.tsx
var React11 = __toESM(require("react"), 1);
var SelectPrimitive = __toESM(require("@radix-ui/react-select"), 1);
var import_lucide_react7 = require("lucide-react");
var import_jsx_runtime18 = require("react/jsx-runtime");
var Select = SelectPrimitive.Root;
var SelectGroup = SelectPrimitive.Group;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React11.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
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
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react7.ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react7.ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react7.ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React11.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(SelectPrimitive.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
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
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(SelectScrollUpButton, {}),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React11.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_lucide_react7.Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// src/hooks/useTts.ts
var import_react14 = require("react");
var useTts = (config = {}) => {
  const baseUrl = config.baseUrl || "http://localhost:8080/api/v1";
  const [isSynthesizing, setIsSynthesizing] = (0, import_react14.useState)(false);
  const wsRef = (0, import_react14.useRef)(null);
  const audioContextRef = (0, import_react14.useRef)(null);
  const synthesize = (0, import_react14.useCallback)(async (request) => {
    const response = await fetch(`${baseUrl}/tts/synthesize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.apiKey && { Authorization: `Bearer ${config.apiKey}` }
      },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `TTS request failed: ${response.status}`);
    }
    return response.blob();
  }, [baseUrl, config.apiKey]);
  const getAvailableVoices = (0, import_react14.useCallback)(async () => {
    const response = await fetch(`${baseUrl}/tts/voices`, {
      headers: {
        ...config.apiKey && { Authorization: `Bearer ${config.apiKey}` }
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to get voices: ${response.status}`);
    }
    return response.json();
  }, [baseUrl, config.apiKey]);
  const playAudio = (0, import_react14.useCallback)((audioBlob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error("Audio playback failed"));
      };
      audio.play().catch(reject);
    });
  }, []);
  const streamingPlayAudio = (0, import_react14.useCallback)((audioChunks) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const audioContext = audioContextRef.current;
    return new Promise(async (resolve, reject) => {
      try {
        const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedArray = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunks) {
          combinedArray.set(chunk, offset);
          offset += chunk.length;
        }
        const audioBuffer = await audioContext.decodeAudioData(combinedArray.buffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => resolve();
        source.start();
      } catch (error) {
        reject(new Error(`Audio playback failed: ${error}`));
      }
    });
  }, []);
  const startStreamingTts = (0, import_react14.useCallback)((options = {}) => {
    if (isSynthesizing) {
      throw new Error("Streaming TTS already in progress");
    }
    const wsUrl = baseUrl.replace("http://", "ws://").replace("https://", "wss://") + "/voice/stream";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setIsSynthesizing(true);
    ws.onopen = () => {
      const configMessage = {
        type: "start_session"
      };
      ws.send(JSON.stringify(configMessage));
      if (options.voice || options.speed) {
        const configUpdate = {
          type: "config",
          voice: options.voice
        };
        ws.send(JSON.stringify(configUpdate));
      }
      options.onStart?.();
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "audio_chunk":
            if (data.data) {
              const audioData = new Uint8Array(data.data);
              options.onAudioChunk?.(audioData);
            }
            break;
          case "text_chunk":
            options.onTextChunk?.(data.text || "", data.is_final || false);
            break;
          case "session_started":
            break;
          case "session_ended":
            break;
          case "error":
            options.onError?.(new Error(data.message || "WebSocket error"));
            break;
        }
      } catch (error) {
        options.onError?.(new Error("Failed to parse WebSocket message"));
      }
    };
    ws.onerror = () => {
      options.onError?.(new Error("WebSocket connection error"));
    };
    ws.onclose = () => {
      setIsSynthesizing(false);
      options.onEnd?.();
    };
    return {
      sendText: (text) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "text_chunk", text }));
        }
      },
      stop: () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "end_session" }));
        }
        ws.close();
      }
    };
  }, [isSynthesizing, baseUrl]);
  const stopStreamingTts = (0, import_react14.useCallback)(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsSynthesizing(false);
    }
  }, []);
  return {
    synthesize,
    getAvailableVoices,
    playAudio,
    streamingPlayAudio,
    startStreamingTts,
    stopStreamingTts,
    isSynthesizing
  };
};

// src/components/Chat.tsx
var import_jsx_runtime19 = require("react/jsx-runtime");
var RendererWrapper2 = ({
  children,
  className = ""
}) => /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: `max-w-3xl mx-auto w-full ${className}`, children });
var Chat = (0, import_react15.forwardRef)(function Chat2({
  threadId,
  agent,
  onMessage,
  onError,
  getMetadata,
  externalTools,
  executionOptions,
  initialMessages,
  theme = "auto",
  models,
  selectedModelId,
  beforeSendMessage,
  onModelChange,
  onChatInstanceReady,
  onChatStateChange,
  voiceEnabled = false,
  useSpeechRecognition: useSpeechRecognition2 = false,
  ttsConfig
}, ref) {
  const [input, setInput] = (0, import_react15.useState)("");
  const [expandedTools, setExpandedTools] = (0, import_react15.useState)(/* @__PURE__ */ new Set());
  const messagesEndRef = (0, import_react15.useRef)(null);
  const [pendingMessage, setPendingMessage] = (0, import_react15.useState)(null);
  const [attachedImages, setAttachedImages] = (0, import_react15.useState)([]);
  const [isDragOver, setIsDragOver] = (0, import_react15.useState)(false);
  const speechToText = useSpeechToText();
  const tts = useTts();
  const [isStreamingVoice, setIsStreamingVoice] = (0, import_react15.useState)(false);
  const [streamingTranscript, setStreamingTranscript] = (0, import_react15.useState)("");
  const [audioChunks, setAudioChunks] = (0, import_react15.useState)([]);
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
    externalTools,
    executionOptions,
    initialMessages,
    beforeSendMessage
  });
  const toolCalls = useChatStateStore((state) => state.toolCalls);
  const hasPendingToolCalls = useChatStateStore((state) => state.hasPendingToolCalls);
  const streamingIndicator = useChatStateStore((state) => state.streamingIndicator);
  const currentThought = useChatStateStore((state) => state.currentThought);
  const currentState = useChatStateStore((state) => state);
  (0, import_react15.useEffect)(() => {
    if (onChatStateChange) {
      onChatStateChange(currentState);
    }
  }, [currentState, onChatStateChange]);
  const addImages = (0, import_react15.useCallback)(async (files) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    for (const file of imageFiles) {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 11);
      const preview = URL.createObjectURL(file);
      const newImage = {
        id,
        file,
        preview,
        name: file.name
      };
      setAttachedImages((prev) => [...prev, newImage]);
    }
  }, []);
  const removeImage = (0, import_react15.useCallback)((id) => {
    setAttachedImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);
  const handleDragOver = (0, import_react15.useCallback)((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = (0, import_react15.useCallback)((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);
  const handleDrop = (0, import_react15.useCallback)((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addImages(files);
    }
  }, [addImages]);
  const contentToParts = (0, import_react15.useCallback)((content) => {
    if (typeof content === "string") {
      return [{ part_type: "text", data: content }];
    }
    return content;
  }, []);
  const handleSendMessage = (0, import_react15.useCallback)(async (initialContent) => {
    let content = initialContent;
    if (typeof content === "string" && !content.trim()) return;
    if (Array.isArray(content) && content.length === 0) return;
    setInput("");
    setAttachedImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.preview));
      return [];
    });
    if (isStreaming) {
      const newParts = contentToParts(content);
      setPendingMessage((prev) => prev ? [...prev, ...newParts] : newParts);
    } else {
      await sendMessage(content);
    }
  }, [sendMessage, beforeSendMessage, isStreaming, contentToParts]);
  const handleStopStreaming = (0, import_react15.useCallback)(() => {
    console.log("handleStopStreaming called, about to call stopStreaming()");
    stopStreaming();
    useChatStateStore.getState().resetStreamingStates();
  }, [stopStreaming]);
  const handleTriggerTool = (0, import_react15.useCallback)(async (toolName, input2) => {
    const toolCallId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const toolCall = {
      tool_call_id: toolCallId,
      tool_name: toolName,
      input: input2
    };
    const chatState = useChatStateStore.getState();
    const tool = chatState.getToolByName(toolName);
    if (tool) {
      chatState.executeTool(toolCall, tool);
    } else {
      console.error("Tool not found:", toolName);
    }
  }, [handleSendMessage]);
  const handleVoiceRecord = (0, import_react15.useCallback)(async (audioBlob) => {
    try {
      if (!voiceEnabled || !speechToText) {
        console.error("Voice recording not properly configured - missing speechToText");
        return;
      }
      const transcription = await speechToText.transcribe(audioBlob, { model: "whisper-1" });
      if (transcription.trim()) {
        setInput(transcription);
        await handleSendMessage(transcription);
      }
    } catch (error2) {
      console.error("Voice transcription failed:", error2);
      if (onError) {
        onError(error2);
      }
    }
  }, [voiceEnabled, speechToText, handleSendMessage, onError]);
  const startStreamingVoice = (0, import_react15.useCallback)(async () => {
    if (!voiceEnabled || isStreamingVoice || !speechToText) {
      console.error("Cannot start streaming voice - missing requirements");
      return;
    }
    setIsStreamingVoice(true);
    setStreamingTranscript("");
    setAudioChunks([]);
    try {
      await speechToText.startStreamingTranscription({
        onTranscript: (text, isFinal) => {
          setStreamingTranscript(text);
          if (isFinal && text.trim()) {
            handleSendMessage(text);
            setStreamingTranscript("");
          }
        },
        onError: (error2) => {
          console.error("Streaming transcription error:", error2);
          if (onError) onError(error2);
          setIsStreamingVoice(false);
        },
        onEnd: () => {
          setIsStreamingVoice(false);
        }
      });
      tts.startStreamingTts({
        voice: ttsConfig?.voice || "alloy",
        speed: ttsConfig?.speed || 1,
        onAudioChunk: (audioData) => {
          setAudioChunks((prev) => [...prev, audioData]);
        },
        onTextChunk: (text, _isFinal) => {
          console.log("AI speaking:", text);
        },
        onError: (error2) => {
          console.error("Streaming TTS error:", error2);
          if (onError) onError(error2);
        },
        onEnd: () => {
          if (audioChunks.length > 0) {
            tts.streamingPlayAudio(audioChunks).catch(console.error);
          }
          setAudioChunks([]);
        }
      });
    } catch (error2) {
      console.error("Failed to start streaming voice:", error2);
      if (onError) onError(error2);
      setIsStreamingVoice(false);
    }
  }, [voiceEnabled, isStreamingVoice, speechToText, tts, ttsConfig, handleSendMessage, onError, audioChunks]);
  const stopStreamingVoice = (0, import_react15.useCallback)(() => {
    if (!isStreamingVoice) return;
    if (speechToText) {
      speechToText.stopStreamingTranscription();
    }
    tts.stopStreamingTts();
    setIsStreamingVoice(false);
    setStreamingTranscript("");
    setAudioChunks([]);
  }, [isStreamingVoice, speechToText, tts]);
  const handleSpeechTranscript = (0, import_react15.useCallback)(async (transcript) => {
    if (transcript.trim()) {
      await handleSendMessage(transcript);
    }
  }, [handleSendMessage]);
  (0, import_react15.useEffect)(() => {
    const sendPendingMessage = async () => {
      if (!isStreaming && pendingMessage && pendingMessage.length > 0) {
        console.log("Streaming ended, sending pending message parts:", pendingMessage);
        const messageToSend = [...pendingMessage];
        setPendingMessage(null);
        try {
          await sendMessage(messageToSend);
        } catch (error2) {
          console.error("Failed to send pending message:", error2);
        }
      }
    };
    sendPendingMessage();
  }, [isStreaming, pendingMessage, sendMessage]);
  (0, import_react15.useEffect)(() => {
    if (!voiceEnabled || !ttsConfig || isStreamingVoice) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && "role" in lastMessage && lastMessage.role === "assistant" && "content" in lastMessage && typeof lastMessage.content === "string") {
      tts.synthesize({
        text: lastMessage.content,
        model: ttsConfig.model || "openai",
        voice: ttsConfig.voice,
        speed: ttsConfig.speed
      }).then((audioBlob) => tts.playAudio(audioBlob)).catch((error2) => console.error("TTS playback failed:", error2));
    }
  }, [messages, voiceEnabled, ttsConfig, tts, isStreamingVoice]);
  const chatInstance = (0, import_react15.useMemo)(() => ({
    sendMessage: handleSendMessage,
    stopStreaming: handleStopStreaming,
    triggerTool: handleTriggerTool,
    isStreaming,
    isLoading,
    // Streaming voice capabilities - only available with speechToText
    startStreamingVoice: voiceEnabled && speechToText ? startStreamingVoice : void 0,
    stopStreamingVoice: voiceEnabled && speechToText ? stopStreamingVoice : void 0,
    isStreamingVoice: voiceEnabled && speechToText ? isStreamingVoice : void 0,
    streamingTranscript: voiceEnabled && speechToText ? streamingTranscript : void 0
  }), [handleSendMessage, handleStopStreaming, handleTriggerTool, isStreaming, isLoading, voiceEnabled, speechToText, startStreamingVoice, stopStreamingVoice, isStreamingVoice, streamingTranscript]);
  (0, import_react15.useImperativeHandle)(ref, () => chatInstance, [chatInstance]);
  (0, import_react15.useEffect)(() => {
    if (onChatInstanceReady) {
      onChatInstanceReady(chatInstance);
    }
  }, [onChatInstanceReady, chatInstance]);
  const toggleToolExpansion = (0, import_react15.useCallback)((toolId) => {
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
  (0, import_react15.useEffect)(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  (0, import_react15.useEffect)(() => {
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
  }, [toolCalls, expandedTools]);
  const getThemeClasses = () => {
    if (theme === "dark") return "dark";
    if (theme === "light") return "light";
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
  const renderExternalToolCalls = () => {
    const elements = [];
    const externalToolCalls = Array.from(toolCalls.values()).filter(
      (toolCall) => (toolCall.status === "pending" || toolCall.status === "running") && toolCall.isExternal && toolCall.component
    );
    externalToolCalls.forEach((toolCall) => {
      elements.push(
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(RendererWrapper2, { children: toolCall.component }, `external-tool-${toolCall.tool_call_id}`)
      );
    });
    return elements;
  };
  const renderThinkingIndicator = () => {
    if (streamingIndicator === "typing") {
      return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(RendererWrapper2, { className: "distri-typing-indicator", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(TypingIndicator, {}) }, `typing-indicator`);
    } else if (streamingIndicator) {
      return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(RendererWrapper2, { className: "distri-thinking-indicator", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
        ThinkingRenderer,
        {
          indicator: streamingIndicator,
          thoughtText: currentThought
        }
      ) }, `thinking-${streamingIndicator}`);
    }
    return null;
  };
  const renderPendingMessage = () => {
    if (!pendingMessage || pendingMessage.length === 0) return null;
    const partCount = pendingMessage.length;
    return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(RendererWrapper2, { children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-r-lg", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "flex items-start", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "w-2 h-2 bg-yellow-400 rounded-full animate-pulse mt-2" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "ml-3 flex-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("h3", { className: "text-sm font-medium text-yellow-800 dark:text-yellow-200", children: [
          "Message queued (",
          partCount,
          " part",
          partCount > 1 ? "s" : "",
          ")"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "mt-2", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "text-sm text-yellow-700 dark:text-yellow-300 bg-white dark:bg-gray-800 p-2 rounded border", children: pendingMessage.map((part, partIndex) => {
          if (part.part_type === "text") {
            return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "block mb-1", children: part.data }, partIndex);
          } else if (part.part_type === "image" && typeof part.data === "object" && part.data !== null && "name" in part.data) {
            return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("span", { className: "inline-block text-xs text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2 mb-1", children: [
              "\u{1F4F7} ",
              part.data.name
            ] }, partIndex);
          }
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("span", { className: "inline-block text-xs text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2 mb-1", children: [
            "[",
            part.part_type,
            "]"
          ] }, partIndex);
        }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { className: "mt-2 text-xs text-yellow-600 dark:text-yellow-400", children: "Will be sent automatically when AI response is complete" })
      ] })
    ] }) }) }, "pending-message");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
    "div",
    {
      className: `flex flex-col h-full ${getThemeClasses()} relative`,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      children: [
        isDragOver && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-primary border-dashed", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "text-primary font-medium text-lg", children: "Drop images anywhere to upload" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "flex-1 overflow-y-auto bg-background text-foreground", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "max-w-4xl mx-auto px-2 py-4 text-sm", children: [
          error && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "p-4 bg-destructive/10 border-l-4 border-destructive", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "text-destructive text-xs", children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: "Error:" }),
            " ",
            error.message
          ] }) }),
          renderMessages(),
          renderExternalToolCalls(),
          renderThinkingIndicator(),
          renderPendingMessage(),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { ref: messagesEndRef })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("footer", { className: "\n  sticky bottom-0 inset-x-0 z-30\n  border-t border-border\n  bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60\n  pb-[env(safe-area-inset-bottom)]\n", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "max-w-4xl mx-auto w-full px-4 py-3 sm:py-4 space-y-3", children: [
          models && models.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "text-sm text-muted-foreground shrink-0", children: "Model:" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(Select, { value: selectedModelId, onValueChange: onModelChange, children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(SelectTrigger, { className: "w-64 max-w-full", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(SelectValue, { placeholder: "Select a model" }) }),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(SelectContent, { children: models.map((model) => /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(SelectItem, { value: model.id, children: model.name }, model.id)) })
            ] })
          ] }),
          voiceEnabled && speechToText && (isStreamingVoice || streamingTranscript) && /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "p-3 bg-muted/50 border border-muted rounded-lg", children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "w-2 h-2 rounded-full bg-red-500 animate-pulse" }),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "text-sm font-medium text-muted-foreground", children: isStreamingVoice ? "Listening\u2026" : "Processing\u2026" }),
              isStreamingVoice && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
                "button",
                {
                  onClick: stopStreamingVoice,
                  className: "ml-auto text-xs px-2 py-1 bg-destructive text-destructive-foreground rounded",
                  children: "Stop"
                }
              )
            ] }),
            streamingTranscript && /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("p", { className: "mt-2 text-sm text-foreground font-mono break-words", children: [
              "\u201C",
              streamingTranscript,
              "\u201D"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
            ChatInput,
            {
              value: input,
              onChange: setInput,
              onSend: handleSendMessage,
              onStop: handleStopStreaming,
              placeholder: isStreamingVoice ? "Voice mode active\u2026" : isStreaming ? "Message will be queued\u2026" : "Type your message\u2026",
              disabled: isLoading || hasPendingToolCalls() || isStreamingVoice,
              isStreaming,
              attachedImages,
              onRemoveImage: removeImage,
              onAddImages: addImages,
              voiceEnabled: voiceEnabled && !!speechToText,
              onVoiceRecord: handleVoiceRecord,
              onStartStreamingVoice: voiceEnabled && speechToText ? startStreamingVoice : void 0,
              isStreamingVoice,
              useSpeechRecognition: useSpeechRecognition2,
              onSpeechTranscript: handleSpeechTranscript,
              className: "w-full"
            }
          )
        ] }) })
      ]
    }
  );
});

// src/components/AgentList.tsx
var import_react16 = __toESM(require("react"), 1);
var import_lucide_react8 = require("lucide-react");
var import_jsx_runtime20 = require("react/jsx-runtime");

// src/components/AgentSelect.tsx
var import_lucide_react9 = require("lucide-react");
var import_jsx_runtime21 = require("react/jsx-runtime");
var AgentSelect = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  className = "",
  placeholder = "Select an agent...",
  disabled = false
}) => {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  return /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(Select, { value: selectedAgentId, onValueChange: onAgentSelect, disabled, children: [
    /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(SelectTrigger, { className: `w-full ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(import_lucide_react9.Bot, { className: "h-4 w-4" }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(SelectValue, { placeholder, children: selectedAgent?.name || placeholder })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(SelectContent, { children: agents.map((agent) => /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(SelectItem, { value: agent.id, children: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(import_lucide_react9.Bot, { className: "h-4 w-4" }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "font-medium", children: agent.name }),
        agent.description && /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "text-xs text-muted-foreground", children: agent.description })
      ] })
    ] }) }, agent.id)) })
  ] });
};

// src/components/AgentsPage.tsx
var import_jsx_runtime22 = require("react/jsx-runtime");

// src/components/AppSidebar.tsx
var import_react17 = require("react");
var import_lucide_react13 = require("lucide-react");

// src/components/ui/sidebar.tsx
var React17 = __toESM(require("react"), 1);
var import_react_slot = require("@radix-ui/react-slot");
var import_class_variance_authority2 = require("class-variance-authority");
var import_lucide_react11 = require("lucide-react");

// src/components/ui/separator.tsx
var React14 = __toESM(require("react"), 1);
var SeparatorPrimitive = __toESM(require("@radix-ui/react-separator"), 1);
var import_jsx_runtime23 = require("react/jsx-runtime");
var Separator2 = React14.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
var React15 = __toESM(require("react"), 1);
var SheetPrimitive = __toESM(require("@radix-ui/react-dialog"), 1);
var import_class_variance_authority = require("class-variance-authority");
var import_lucide_react10 = require("lucide-react");
var import_jsx_runtime24 = require("react/jsx-runtime");
var Sheet = SheetPrimitive.Root;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
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
var sheetVariants = (0, import_class_variance_authority.cva)(
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
var SheetContent = React15.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(SheetPortal, { children: [
  /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SheetOverlay, {}),
  /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      ...props,
      children: [
        children,
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_lucide_react10.X, { className: "h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
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
}) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
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
var SheetTitle = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// src/components/ui/skeleton.tsx
var import_jsx_runtime25 = require("react/jsx-runtime");
function Skeleton({
  className,
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
    "div",
    {
      className: cn("animate-pulse rounded-md bg-muted", className),
      ...props
    }
  );
}

// src/components/ui/tooltip.tsx
var React16 = __toESM(require("react"), 1);
var TooltipPrimitive = __toESM(require("@radix-ui/react-tooltip"), 1);
var import_jsx_runtime26 = require("react/jsx-runtime");
var TooltipProvider = TooltipPrimitive.Provider;
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = React16.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
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
var import_jsx_runtime27 = require("react/jsx-runtime");
var SIDEBAR_COOKIE_NAME = "sidebar:state";
var SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
var SIDEBAR_WIDTH = "16rem";
var SIDEBAR_WIDTH_MOBILE = "18rem";
var SIDEBAR_WIDTH_ICON = "3rem";
var SIDEBAR_KEYBOARD_SHORTCUT = "b";
var SidebarContext = React17.createContext(null);
function useSidebar() {
  const context = React17.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
var SidebarProvider = React17.forwardRef(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  const [_open, _setOpen] = React17.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React17.useCallback(
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
  const [openMobile, setOpenMobile] = React17.useState(false);
  const [isMobile, setIsMobile] = React17.useState(false);
  React17.useEffect(() => {
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
  React17.useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_COOKIE_NAME);
    if (savedState !== null) {
      setOpen(savedState === "true");
    }
  }, [setOpen]);
  React17.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);
  const toggleSidebar = React17.useCallback(() => {
    return isMobile ? setOpenMobile((open2) => !open2) : setOpen((open2) => !open2);
  }, [isMobile, setOpen, setOpenMobile]);
  const state = open ? "expanded" : "collapsed";
  const contextValue = React17.useMemo(
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
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(SidebarContext.Provider, { value: contextValue, children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(TooltipProvider, { delayDuration: 0, children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var Sidebar = React17.forwardRef(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (collapsible === "none") {
    return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
    return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(Sheet, { open: openMobile, onOpenChange: setOpenMobile, ...props, children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
      SheetContent,
      {
        "data-sidebar": "sidebar",
        "data-mobile": "true",
        className: "w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
        style: {
          "--sidebar-width": SIDEBAR_WIDTH_MOBILE
        },
        side,
        children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "flex h-full w-full flex-col", children })
      }
    ) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(
    "div",
    {
      ref,
      className: "group peer hidden md:block text-sidebar-foreground",
      "data-state": state,
      "data-collapsible": state === "collapsed" ? collapsible : "",
      "data-variant": variant,
      "data-side": side,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
            children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarTrigger = React17.forwardRef(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_lucide_react11.PanelLeft, {}),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "sr-only", children: "Toggle Sidebar" })
      ]
    }
  );
});
SidebarTrigger.displayName = "SidebarTrigger";
var SidebarRail = React17.forwardRef(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarInset = React17.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarHeader = React17.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarFooter = React17.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarSeparator = React17.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarContent = React17.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarGroup = React17.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarGroupLabel = React17.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "div";
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarGroupAction = React17.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "button";
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarGroupContent = React17.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarMenu = React17.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarMenuItem = React17.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var sidebarMenuButtonVariants = (0, import_class_variance_authority2.cva)(
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
var SidebarMenuButton = React17.forwardRef(({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "button";
  const { isMobile, state } = useSidebar();
  const button = /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(Tooltip, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(TooltipTrigger, { asChild: true, children: button }),
    /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarMenuAction = React17.forwardRef(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "button";
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarMenuBadge = React17.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarMenuSkeleton = React17.forwardRef(({ className, showIcon = false, ...props }, ref) => {
  const width = React17.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(
    "div",
    {
      ref,
      "data-sidebar": "menu-skeleton",
      className: cn("rounded-md h-8 flex gap-2 px-2 items-center", className),
      ...props,
      children: [
        showIcon && /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(Skeleton, { className: "size-4 rounded-md", "data-sidebar": "menu-skeleton-icon" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarMenuSub = React17.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var SidebarMenuSubItem = React17.forwardRef(({ ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("li", { ref, ...props });
});
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
var SidebarMenuSubButton = React17.forwardRef(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? import_react_slot.Slot : "a";
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
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
var React18 = __toESM(require("react"), 1);
var import_jsx_runtime28 = require("react/jsx-runtime");
var Input = React18.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
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

// src/components/ui/card.tsx
var React19 = __toESM(require("react"), 1);
var import_jsx_runtime29 = require("react/jsx-runtime");
var Card = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
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
var CardHeader = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
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
var CardDescription = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
  "p",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React19.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";

// src/components/ui/badge.tsx
var import_class_variance_authority3 = require("class-variance-authority");
var import_jsx_runtime30 = require("react/jsx-runtime");
var badgeVariants = (0, import_class_variance_authority3.cva)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: cn(badgeVariants({ variant }), className), ...props });
}

// src/components/ui/dialog.tsx
var React20 = __toESM(require("react"), 1);
var import_jsx_runtime31 = require("react/jsx-runtime");
var Dialog = React20.createContext({});
var DialogRoot = ({ open, onOpenChange, children }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(Dialog.Provider, { value: { open, onOpenChange }, children });
};
var DialogTrigger = React20.forwardRef(({ className, children, ...props }, ref) => {
  const context = React20.useContext(Dialog);
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
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
var DialogContent = React20.forwardRef(({ className, children, ...props }, ref) => {
  const context = React20.useContext(Dialog);
  if (!context.open) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm", children: /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
          "button",
          {
            className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            onClick: () => context.onOpenChange?.(false),
            children: /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("path", { d: "m18 6-12 12" }),
                  /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("path", { d: "m6 6 12 12" })
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
var DialogHeader = React20.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
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
var DialogTitle = React20.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
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
var React21 = __toESM(require("react"), 1);
var import_jsx_runtime32 = require("react/jsx-runtime");
var Textarea = React21.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
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
var React22 = __toESM(require("react"), 1);
var DropdownMenuPrimitive = __toESM(require("@radix-ui/react-dropdown-menu"), 1);
var import_lucide_react12 = require("lucide-react");
var import_jsx_runtime33 = require("react/jsx-runtime");
var DropdownMenu = DropdownMenuPrimitive.Root;
var DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
var DropdownMenuGroup = DropdownMenuPrimitive.Group;
var DropdownMenuPortal = DropdownMenuPrimitive.Portal;
var DropdownMenuSub = DropdownMenuPrimitive.Sub;
var DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
var DropdownMenuSubTrigger = React22.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(
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
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react12.ChevronRight, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
var DropdownMenuSubContent = React22.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
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
var DropdownMenuContent = React22.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
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
var DropdownMenuItem = React22.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
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
var DropdownMenuCheckboxItem = React22.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(
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
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react12.Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
var DropdownMenuRadioItem = React22.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_lucide_react12.Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
var DropdownMenuLabel = React22.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
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
var DropdownMenuSeparator = React22.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
    "span",
    {
      className: cn("ml-auto text-xs tracking-widest opacity-60", className),
      ...props
    }
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// src/components/AppSidebar.tsx
var import_jsx_runtime34 = require("react/jsx-runtime");
var ThreadItem = ({
  thread,
  isActive,
  onClick,
  onDelete,
  onRename
}) => {
  const [isEditing, setIsEditing] = (0, import_react17.useState)(false);
  const [editTitle, setEditTitle] = (0, import_react17.useState)(thread.title || "New Chat");
  const [showMenu, setShowMenu] = (0, import_react17.useState)(false);
  const handleRename = (0, import_react17.useCallback)(() => {
    if (editTitle.trim() && editTitle !== thread.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  }, [editTitle, thread.title, onRename]);
  const handleKeyPress = (0, import_react17.useCallback)((e) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditTitle(thread.title || "New Chat");
      setIsEditing(false);
    }
  }, [handleRename, thread.title]);
  return /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(SidebarMenuItem, { className: "mb-3", children: [
    /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarMenuButton, { asChild: true, isActive, children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("div", { onClick, children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
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
    ) : /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("div", { className: "flex-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { className: "text-sm font-medium truncate leading-tight", children: thread.title || "New Chat" }),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { className: "text-xs text-muted-foreground truncate leading-tight mt-0.5", children: thread.last_message || "No messages yet" })
    ] }) }) }),
    !isEditing && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(DropdownMenu, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarMenuAction, { onClick: (e) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
      }, children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_lucide_react13.MoreHorizontal, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(DropdownMenuContent, { className: "w-[--radix-popper-anchor-width]", children: [
        /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(
          DropdownMenuItem,
          {
            onClick: (e) => {
              e.stopPropagation();
              setIsEditing(true);
              setShowMenu(false);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_lucide_react13.Edit3, { className: "h-3 w-3" }),
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("span", { children: "Rename" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(
          DropdownMenuItem,
          {
            onClick: (e) => {
              e.stopPropagation();
              onDelete();
              setShowMenu(false);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_lucide_react13.Trash2, { className: "h-3 w-3" }),
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("span", { children: "Delete" })
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
  const handleRefresh = (0, import_react17.useCallback)(() => {
    refetch();
  }, [refetch]);
  return /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(Sidebar, { collapsible: "icon", variant: "floating", children: [
    /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarMenu, { children: /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(SidebarMenuItem, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(
        SidebarMenuButton,
        {
          onClick: onLogoClick,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_lucide_react13.Bot, {}),
            "Distri"
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(
        SidebarMenuAction,
        {
          onClick: () => setTheme(theme === "light" ? "dark" : "light"),
          title: "Toggle theme",
          className: "absolute right-0 top-0",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("svg", { className: "h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("circle", { cx: "12", cy: "12", r: "5" }),
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("path", { d: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("svg", { className: "absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" }) })
          ]
        }
      )
    ] }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarSeparator, {}),
    /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(SidebarContent, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(SidebarGroup, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarGroupLabel, { children: "Actions" }),
        /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarGroupContent, { children: /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(SidebarMenu, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarMenuItem, { className: "mb-1", children: /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(
            SidebarMenuButton,
            {
              isActive: currentPage === "chat",
              onClick: () => {
                onPageChange("chat");
                onNewChat();
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_lucide_react13.Edit2, { className: "h-4 w-4" }),
                "New Chat"
              ]
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarMenuItem, { className: "mb-1", children: /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(
            SidebarMenuButton,
            {
              isActive: currentPage === "agents",
              onClick: () => onPageChange("agents"),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_lucide_react13.Users, { className: "h-4 w-4" }),
                "Agents"
              ]
            }
          ) })
        ] }) })
      ] }),
      open && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(SidebarGroup, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarGroupLabel, { children: "Conversations" }),
        /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarGroupContent, { children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarMenu, { children: threadsLoading ? /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(SidebarMenuItem, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_lucide_react13.Loader2, { className: "h-4 w-4 animate-spin" }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("span", { children: "Loading threads..." })
        ] }) : threads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarMenuItem, { children: "No conversations yet" }) : threads.map((thread) => /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(
          SidebarGroupAction,
          {
            onClick: handleRefresh,
            disabled: threadsLoading,
            title: "Refresh conversations",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_lucide_react13.RefreshCw, { className: `${threadsLoading ? "animate-spin" : ""}` }),
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("span", { className: "sr-only", children: "Refresh conversations" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarMenu, { children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(SidebarMenuItem, { children: /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(
      SidebarMenuButton,
      {
        onClick: () => window.open("https://github.com/your-repo/distri", "_blank"),
        title: "GitHub",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_lucide_react13.Github, {}),
          "Distri"
        ]
      }
    ) }) }) })
  ] });
}

// src/components/ThemeToggle.tsx
var import_react18 = __toESM(require("react"), 1);
var import_lucide_react14 = require("lucide-react");
var import_jsx_runtime35 = require("react/jsx-runtime");
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dropdownRef = import_react18.default.useRef(null);
  return /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("div", { className: "relative", ref: dropdownRef, children: /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(
    "button",
    {
      onClick: () => setTheme(theme === "light" ? "dark" : "light"),
      className: "flex items-center justify-center w-9 h-9 rounded-md border bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(import_lucide_react14.Sun, { className: "h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" }),
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(import_lucide_react14.Moon, { className: "absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" }),
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("span", { className: "sr-only", children: "Toggle theme" })
      ]
    }
  ) });
}

// src/components/Toast.tsx
var import_react19 = require("react");
var import_lucide_react15 = require("lucide-react");
var import_jsx_runtime36 = require("react/jsx-runtime");

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
    case "run_started": {
      const runStartedResult = {
        type: "run_started",
        data: {
          runId: statusUpdate.runId,
          taskId: statusUpdate.taskId
        }
      };
      return runStartedResult;
    }
    case "run_error": {
      const runErrorResult = {
        type: "run_error",
        data: {
          message: statusUpdate.error,
          code: statusUpdate.code
        }
      };
      return runErrorResult;
    }
    case "run_finished": {
      const runFinishedResult = {
        type: "run_finished",
        data: {
          runId: statusUpdate.runId,
          taskId: statusUpdate.taskId
        }
      };
      return runFinishedResult;
    }
    case "plan_started": {
      const planStartedResult = {
        type: "plan_started",
        data: {
          initial_plan: metadata.initial_plan
        }
      };
      return planStartedResult;
    }
    case "plan_finished": {
      const planFinishedResult = {
        type: "plan_finished",
        data: {
          total_steps: metadata.total_steps
        }
      };
      return planFinishedResult;
    }
    case "step_started": {
      const stepStartedResult = {
        type: "step_started",
        data: {
          step_id: metadata.step_id,
          step_title: metadata.step_title || "Processing",
          step_index: metadata.step_index || 0
        }
      };
      return stepStartedResult;
    }
    case "step_completed": {
      const stepCompletedResult = {
        type: "step_completed",
        data: {
          step_id: metadata.step_id,
          step_title: metadata.step_title || "Processing",
          step_index: metadata.step_index || 0
        }
      };
      return stepCompletedResult;
    }
    case "tool_execution_start": {
      const toolStartResult = {
        type: "tool_execution_start",
        data: {
          tool_call_id: metadata.tool_call_id,
          tool_call_name: metadata.tool_call_name || "Tool",
          parent_message_id: statusUpdate.taskId
        }
      };
      return toolStartResult;
    }
    case "tool_execution_end": {
      const toolEndResult = {
        type: "tool_execution_end",
        data: {
          tool_call_id: metadata.tool_call_id
        }
      };
      return toolEndResult;
    }
    case "text_message_start": {
      const textStartResult = {
        type: "text_message_start",
        data: {
          message_id: metadata.message_id,
          step_id: metadata.step_id || "",
          role: metadata.role === "assistant" ? "assistant" : "user"
        }
      };
      return textStartResult;
    }
    case "text_message_content": {
      const textContentResult = {
        type: "text_message_content",
        data: {
          message_id: metadata.message_id,
          step_id: metadata.step_id || "",
          delta: metadata.delta || ""
        }
      };
      return textContentResult;
    }
    case "text_message_end": {
      const textEndResult = {
        type: "text_message_end",
        data: {
          message_id: metadata.message_id,
          step_id: metadata.step_id || ""
        }
      };
      return textEndResult;
    }
    case "tool_calls": {
      const toolCallsResult = {
        type: "tool_calls",
        data: {
          tool_calls: metadata.tool_calls || []
        }
      };
      return toolCallsResult;
    }
    case "tool_results": {
      const toolResultsResult = {
        type: "tool_results",
        data: {
          results: metadata.results || []
        }
      };
      return toolResultsResult;
    }
    default: {
      console.warn(`Unhandled status update metadata type: ${metadata.type}`, metadata);
      const defaultResult = {
        type: "run_started",
        data: {
          runId: statusUpdate.runId,
          taskId: statusUpdate.taskId
        }
      };
      return defaultResult;
    }
  }
}
function decodeA2AStreamEvent(event) {
  if (event.kind === "message") {
    return convertA2AMessageToDistri(event);
  }
  if (event.kind === "status-update") {
    return convertA2AStatusUpdateToDistri(event);
  }
  return null;
}
function convertA2APartToDistri(a2aPart) {
  switch (a2aPart.kind) {
    case "text":
      return { part_type: "text", data: a2aPart.text };
    case "file":
      if ("uri" in a2aPart.file) {
        const fileUrl = { mime_type: a2aPart.file.mimeType || "application/octet-stream", url: a2aPart.file.uri || "" };
        return { part_type: "image", data: fileUrl };
      } else {
        const fileBytes = { mime_type: a2aPart.file.mimeType || "application/octet-stream", data: a2aPart.file.bytes || "" };
        return { part_type: "image", data: fileBytes };
      }
    case "data":
      switch (a2aPart.data.part_type) {
        case "tool_call":
          return { part_type: "tool_call", data: a2aPart.data };
        case "tool_result":
          return { part_type: "tool_result", data: a2aPart.data };
        default:
          return { part_type: "data", data: a2aPart.data };
      }
    default:
      return { part_type: "text", data: JSON.stringify(a2aPart) };
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
    parameters: fnTool.parameters,
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

// src/components/renderers/ToolResultRenderer.tsx
var import_lucide_react16 = require("lucide-react");
var import_jsx_runtime37 = require("react/jsx-runtime");
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
      return /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(import_lucide_react16.CheckCircle, { className: "w-4 h-4 text-primary" });
    } else {
      return /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(import_lucide_react16.XCircle, { className: "w-4 h-4 text-destructive" });
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
  return /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(Card, { className: `mb-4 ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(CardHeader, { className: "pb-3", children: /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "flex items-center space-x-2", children: [
        getStatusIcon(),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(CardTitle, { className: "text-sm font-medium", children: toolName }),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(Badge, { variant: "secondary", className: getStatusColor(), children: success ? "Success" : "Failed" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "text-xs text-muted-foreground", children: [
        "ID: ",
        toolCallId
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(CardContent, { className: "pt-0 space-y-3", children: [
      result && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "text-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("strong", { children: "Result:" }),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-auto break-words", children: typeof result === "string" ? result : JSON.stringify(result, null, 2) })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "text-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("strong", { children: "Error:" }),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("pre", { className: "whitespace-pre-wrap text-xs bg-destructive/10 p-2 rounded mt-1 text-destructive overflow-auto break-words", children: error })
      ] }),
      onSendResponse && success && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("div", { className: "flex justify-end", children: /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(
        Button,
        {
          size: "sm",
          onClick: handleSendResponse,
          className: "flex items-center space-x-1",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(import_lucide_react16.Send, { className: "w-3 h-3" }),
            /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("span", { children: "Send Response" })
          ]
        }
      ) })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentSelect,
  AppSidebar,
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
  ImageRenderer,
  Input,
  LoadingShimmer,
  MessageRenderer,
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
  StepBasedRenderer,
  StreamingTextRenderer,
  Textarea,
  ThemeProvider,
  ThemeToggle,
  ThinkingRenderer,
  ToolResultRenderer,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TypingIndicator,
  UserMessageRenderer,
  VoiceInput,
  extractContent,
  useAgent,
  useAgentDefinitions,
  useChat,
  useChatMessages,
  useChatStateStore,
  useDistri,
  useDistriClient,
  useSidebar,
  useSpeechToText,
  useTheme,
  useThreads,
  useTts,
  wrapFnToolAsUiTool,
  wrapTools
});
