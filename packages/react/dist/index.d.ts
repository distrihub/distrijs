import * as react_jsx_runtime from 'react/jsx-runtime';
import { DistriEvent, DistriMessage, DistriArtifact, DistriClientConfig, AgentDefinition, DistriFnTool, DistriBaseTool, ToolCall, ToolResult, Agent as Agent$1, DistriPart, DistriThread, DistriStreamEvent } from '@distri/core';
import * as React$1 from 'react';
import React__default, { ReactNode } from 'react';
import * as zustand from 'zustand';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
import * as _radix_ui_react_separator from '@radix-ui/react-separator';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import * as SelectPrimitive from '@radix-ui/react-select';

interface ChatProps {
    threadId: string;
    agent?: any;
    onMessage?: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
    onError?: (error: Error) => void;
    getMetadata?: () => Promise<any>;
    onMessagesUpdate?: () => void;
    tools?: any[];
    messageFilter?: (message: DistriEvent | DistriMessage | DistriArtifact, idx: number) => boolean;
    overrideChatState?: any;
    theme?: 'light' | 'dark' | 'auto';
}
declare function Chat({ threadId, agent, onMessage, onError, getMetadata, onMessagesUpdate, tools, messageFilter, overrideChatState, theme, }: ChatProps): react_jsx_runtime.JSX.Element;

interface DistriProviderProps {
    config: DistriClientConfig;
    children: ReactNode;
    defaultTheme?: 'dark' | 'light' | 'system';
}
declare function DistriProvider({ config, children, defaultTheme }: DistriProviderProps): react_jsx_runtime.JSX.Element;

type Theme = 'dark' | 'light' | 'system';
interface ThemeProviderProps {
    children: React__default.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}
interface ThemeProviderState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}
declare function ThemeProvider({ children, defaultTheme, storageKey, ...props }: ThemeProviderProps): react_jsx_runtime.JSX.Element;
declare const useTheme: () => ThemeProviderState;

declare function ThemeToggle(): react_jsx_runtime.JSX.Element;

interface AgentListProps {
    agents: AgentDefinition[];
    onRefresh: () => Promise<void>;
    onStartChat: (agent: AgentDefinition) => void;
}
declare const AgentList: React__default.FC<AgentListProps>;

interface Agent {
    id: string;
    name: string;
    description?: string;
}
interface AgentSelectProps {
    agents: Agent[];
    selectedAgentId?: string;
    onAgentSelect: (agentId: string) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}
declare const AgentSelect: React__default.FC<AgentSelectProps>;

declare const AgentsPage: React__default.FC<{
    onStartChat?: (agent: AgentDefinition) => void;
}>;

interface ExecutionStepsProps {
    messages: DistriMessage[];
    className?: string;
}
declare const ExecutionSteps: React__default.FC<ExecutionStepsProps>;

interface TaskExecutionRendererProps {
    events: (DistriMessage | DistriEvent)[];
    className?: string;
}
declare const TaskExecutionRenderer: React__default.FC<TaskExecutionRendererProps>;

interface UserMessageRendererProps {
    message: DistriMessage;
    chatState: any;
    className?: string;
    avatar?: React__default.ReactNode;
}
declare const UserMessageRenderer: React__default.FC<UserMessageRendererProps>;

interface AssistantMessageRendererProps {
    message: DistriMessage;
    chatState: any;
    className?: string;
    avatar?: React__default.ReactNode;
    name?: string;
}
declare const AssistantMessageRenderer: React__default.FC<AssistantMessageRendererProps>;

interface ThinkingRendererProps {
    event: DistriEvent;
    className?: string;
    avatar?: React__default.ReactNode;
    name?: string;
}
declare const ThinkingRenderer: React__default.FC<ThinkingRendererProps>;

type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
interface ToolCallState$1 {
    tool_call_id: string;
    status: ToolCallStatus;
    tool_name: string;
    input: any;
    result?: any;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
    component?: React.ReactNode;
}
type DistriAnyTool = DistriFnTool | DistriUiTool;
interface DistriUiTool extends DistriBaseTool {
    type: 'ui';
    component: (props: UiToolProps) => React.ReactNode;
}
type UiToolProps = {
    toolCall: ToolCall;
    toolCallState?: ToolCallState$1;
    completeTool: (result: ToolResult) => void;
};

interface ToolCallRendererProps {
    toolCall: ToolCallState$1;
    chatState: any;
    isExpanded: boolean;
    onToggle: () => void;
    className?: string;
    avatar?: React__default.ReactNode;
    name?: string;
}
declare const ToolCallRenderer: React__default.FC<ToolCallRendererProps>;

interface PlanRendererProps {
    message: DistriArtifact;
    chatState: any;
    className?: string;
    avatar?: React__default.ReactNode;
}
declare const PlanRenderer: React__default.FC<PlanRendererProps>;

interface ToolMessageRendererProps {
    message: DistriMessage;
    chatState: any;
    className?: string;
    avatar?: React__default.ReactNode;
}
declare const ToolMessageRenderer: React__default.FC<ToolMessageRendererProps>;

interface DebugRendererProps {
    message: DistriEvent | DistriArtifact;
    chatState: any;
    className?: string;
    avatar?: React__default.ReactNode;
}
declare const DebugRenderer: React__default.FC<DebugRendererProps>;

interface ArtifactRendererProps {
    message: DistriArtifact;
    chatState: any;
    className?: string;
    avatar?: React__default.ReactNode;
}
declare function ArtifactRenderer({ message, chatState: _chatState, className, avatar }: ArtifactRendererProps): react_jsx_runtime.JSX.Element | null;

interface TaskState$1 {
    id: string;
    runId?: string;
    planId?: string;
    title: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
    toolCalls?: any[];
    results?: any[];
    error?: string;
    metadata?: any;
}
interface PlanState$1 {
    id: string;
    runId?: string;
    steps: string[];
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
}
interface ToolCallState {
    tool_call_id: string;
    tool_name: string;
    step_title?: string;
    input: any;
    status: ToolCallStatus;
    result?: any;
    error?: string;
    startTime?: number;
    endTime?: number;
    component?: React.ReactNode;
    startedAt?: Date;
    completedAt?: Date;
    isExternal?: boolean;
}
interface ChatState {
    messages: (DistriEvent | DistriMessage | DistriArtifact)[];
    isStreaming: boolean;
    isLoading: boolean;
    error: Error | null;
    tasks: Map<string, TaskState$1>;
    plans: Map<string, PlanState$1>;
    toolCalls: Map<string, ToolCallState>;
    currentTaskId?: string;
    currentPlanId?: string;
    agent?: Agent$1;
    tools?: DistriAnyTool[];
    onAllToolsCompleted?: (toolResults: ToolResult[]) => void;
}
interface ChatStateStore extends ChatState {
    addMessage: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
    clearMessages: () => void;
    setStreaming: (isStreaming: boolean) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: Error | null) => void;
    processMessage: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
    clearAllStates: () => void;
    clearTask: (taskId: string) => void;
    initToolCall: (toolCall: ToolCall, timestamp?: number, isExternal?: boolean, stepTitle?: string) => void;
    updateToolCallStatus: (toolCallId: string, status: Partial<ToolCallState>) => void;
    getToolCallById: (toolCallId: string) => ToolCallState | null;
    getPendingToolCalls: () => ToolCallState[];
    getCompletedToolCalls: () => ToolCallState[];
    executeTool: (toolCall: ToolCall) => Promise<void>;
    hasPendingToolCalls: () => boolean;
    clearToolResults: () => void;
    getExternalToolResponses: () => ToolResult[];
    getCurrentTask: () => TaskState$1 | null;
    getCurrentPlan: () => PlanState$1 | null;
    getCurrentTasks: () => TaskState$1[];
    getTaskById: (taskId: string) => TaskState$1 | null;
    getPlanById: (planId: string) => PlanState$1 | null;
    updateTask: (taskId: string, updates: Partial<TaskState$1>) => void;
    updatePlan: (planId: string, updates: Partial<PlanState$1>) => void;
    setAgent: (agent: Agent$1) => void;
    setTools: (tools: DistriAnyTool[]) => void;
    setOnAllToolsCompleted: (callback: (toolResults: ToolResult[]) => void) => void;
}
declare const useChatStateStore: zustand.UseBoundStore<zustand.StoreApi<ChatStateStore>>;

interface UseChatOptions {
    threadId: string;
    agent?: Agent$1;
    onMessage?: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
    onError?: (error: Error) => void;
    getMetadata?: () => Promise<any>;
    onMessagesUpdate?: () => void;
    messageFilter?: (message: DistriEvent | DistriMessage | DistriArtifact, idx: number) => boolean;
    tools?: DistriAnyTool[];
    overrideChatState?: ChatStateStore;
}
interface UseChatReturn {
    messages: (DistriEvent | DistriMessage | DistriArtifact)[];
    isStreaming: boolean;
    sendMessage: (content: string | DistriPart[]) => Promise<void>;
    sendMessageStream: (content: string | DistriPart[]) => Promise<void>;
    isLoading: boolean;
    error: Error | null;
    clearMessages: () => void;
    agent: Agent$1 | undefined;
    hasPendingToolCalls: () => boolean;
    stopStreaming: () => void;
}
declare function useChat({ threadId, onMessage, onError, getMetadata, onMessagesUpdate, agent, tools, overrideChatState, messageFilter, }: UseChatOptions): UseChatReturn;

interface UseAgentOptions {
    agentIdOrDef: string | AgentDefinition;
}
interface UseAgentResult {
    agent: Agent$1 | null;
    loading: boolean;
    error: Error | null;
}
/**
 * useAgent is for agent configuration and invocation.
 * For chat UIs, use useChat instead.
 */
declare function useAgent({ agentIdOrDef, }: UseAgentOptions): UseAgentResult;

interface UseAgentsResult {
    agents: AgentDefinition[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    getAgent: (agentId: string) => Promise<AgentDefinition>;
}
declare function useAgentDefinitions(): UseAgentsResult;

interface UseThreadsResult {
    threads: DistriThread[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    deleteThread: (threadId: string) => Promise<void>;
    fetchThread: (threadId: string) => Promise<DistriThread>;
    updateThread: (threadId: string, localId?: string) => Promise<void>;
}
declare function useThreads(): UseThreadsResult;

interface PlanState {
    id: string;
    steps: string[];
    status: 'pending' | 'running' | 'completed' | 'failed';
}
interface TaskState {
    id: string;
    title: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
}
interface RunState {
    id: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
}
interface ChatContextType {
    planState: PlanState | null;
    taskState: TaskState | null;
    runState: RunState | null;
    setPlanState: (state: PlanState | null) => void;
    setTaskState: (state: TaskState | null) => void;
    setRunState: (state: RunState | null) => void;
    clearAllStates: () => void;
}
declare const useChatConfig: () => ChatContextType;

declare const buttonVariants: {
    variant: {
        default: string;
        destructive: string;
        outline: string;
        secondary: string;
        ghost: string;
        link: string;
    };
    size: {
        default: string;
        sm: string;
        lg: string;
        icon: string;
    };
};
interface ButtonProps extends React$1.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof buttonVariants.variant;
    size?: keyof typeof buttonVariants.size;
}
declare const Button: React$1.ForwardRefExoticComponent<ButtonProps & React$1.RefAttributes<HTMLButtonElement>>;

interface InputProps extends React$1.InputHTMLAttributes<HTMLInputElement> {
}
declare const Input: React$1.ForwardRefExoticComponent<InputProps & React$1.RefAttributes<HTMLInputElement>>;

declare const Card: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLDivElement> & React$1.RefAttributes<HTMLDivElement>>;
declare const CardHeader: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLDivElement> & React$1.RefAttributes<HTMLDivElement>>;
declare const CardTitle: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLHeadingElement> & React$1.RefAttributes<HTMLParagraphElement>>;
declare const CardDescription: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLParagraphElement> & React$1.RefAttributes<HTMLParagraphElement>>;
declare const CardContent: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLDivElement> & React$1.RefAttributes<HTMLDivElement>>;
declare const CardFooter: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLDivElement> & React$1.RefAttributes<HTMLDivElement>>;

declare const badgeVariants: (props?: ({
    variant?: "default" | "destructive" | "outline" | "secondary" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface BadgeProps extends React$1.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
}
declare function Badge({ className, variant, ...props }: BadgeProps): react_jsx_runtime.JSX.Element;

interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React$1.ReactNode;
}
declare const DialogRoot: React$1.FC<DialogProps>;
declare const DialogTrigger: React$1.ForwardRefExoticComponent<React$1.ButtonHTMLAttributes<HTMLButtonElement> & React$1.RefAttributes<HTMLButtonElement>>;
declare const DialogContent: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLDivElement> & React$1.RefAttributes<HTMLDivElement>>;
declare const DialogHeader: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLDivElement> & React$1.RefAttributes<HTMLDivElement>>;
declare const DialogTitle: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLHeadingElement> & React$1.RefAttributes<HTMLHeadingElement>>;

interface TextareaProps extends React$1.TextareaHTMLAttributes<HTMLTextAreaElement> {
}
declare const Textarea: React$1.ForwardRefExoticComponent<TextareaProps & React$1.RefAttributes<HTMLTextAreaElement>>;

declare const TooltipProvider: React$1.FC<TooltipPrimitive.TooltipProviderProps>;
declare const Tooltip: React$1.FC<TooltipPrimitive.TooltipProps>;
declare const TooltipTrigger: React$1.ForwardRefExoticComponent<TooltipPrimitive.TooltipTriggerProps & React$1.RefAttributes<HTMLButtonElement>>;
declare const TooltipContent: React$1.ForwardRefExoticComponent<Omit<TooltipPrimitive.TooltipContentProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;

type SidebarContext = {
    state: "expanded" | "collapsed";
    open: boolean;
    setOpen: (open: boolean) => void;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    isMobile: boolean;
    toggleSidebar: () => void;
};
declare const SidebarContext: React$1.Context<SidebarContext | null>;
declare function useSidebar(): SidebarContext;
declare const SidebarProvider: React$1.ForwardRefExoticComponent<Omit<React$1.ClassAttributes<HTMLDivElement> & React$1.HTMLAttributes<HTMLDivElement> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const Sidebar: React$1.ForwardRefExoticComponent<Omit<React$1.ClassAttributes<HTMLDivElement> & React$1.HTMLAttributes<HTMLDivElement> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
}, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SidebarTrigger: React$1.ForwardRefExoticComponent<Omit<ButtonProps & React$1.RefAttributes<HTMLButtonElement>, "ref"> & React$1.RefAttributes<HTMLButtonElement>>;
declare const SidebarRail: React$1.ForwardRefExoticComponent<Omit<React$1.DetailedHTMLProps<React$1.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "ref"> & React$1.RefAttributes<HTMLButtonElement>>;
declare const SidebarInset: React$1.ForwardRefExoticComponent<Omit<React$1.DetailedHTMLProps<React$1.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SidebarHeader: React$1.ForwardRefExoticComponent<Omit<React$1.DetailedHTMLProps<React$1.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SidebarFooter: React$1.ForwardRefExoticComponent<Omit<React$1.DetailedHTMLProps<React$1.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SidebarSeparator: React$1.ForwardRefExoticComponent<Omit<Omit<_radix_ui_react_separator.SeparatorProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SidebarContent: React$1.ForwardRefExoticComponent<Omit<React$1.DetailedHTMLProps<React$1.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SidebarGroup: React$1.ForwardRefExoticComponent<Omit<React$1.DetailedHTMLProps<React$1.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SidebarGroupLabel: React$1.ForwardRefExoticComponent<Omit<React$1.ClassAttributes<HTMLDivElement> & React$1.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
}, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SidebarGroupAction: React$1.ForwardRefExoticComponent<Omit<React$1.ClassAttributes<HTMLButtonElement> & React$1.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
}, "ref"> & React$1.RefAttributes<HTMLButtonElement>>;
declare const SidebarGroupContent: React$1.ForwardRefExoticComponent<Omit<React$1.DetailedHTMLProps<React$1.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SidebarMenu: React$1.ForwardRefExoticComponent<Omit<React$1.DetailedHTMLProps<React$1.HTMLAttributes<HTMLUListElement>, HTMLUListElement>, "ref"> & React$1.RefAttributes<HTMLUListElement>>;
declare const SidebarMenuItem: React$1.ForwardRefExoticComponent<Omit<React$1.DetailedHTMLProps<React$1.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>, "ref"> & React$1.RefAttributes<HTMLLIElement>>;
declare const SidebarMenuButton: React$1.ForwardRefExoticComponent<Omit<React$1.ClassAttributes<HTMLButtonElement> & React$1.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React$1.ComponentProps<typeof TooltipContent>;
} & VariantProps<(props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string>, "ref"> & React$1.RefAttributes<HTMLButtonElement>>;
declare const SidebarMenuAction: React$1.ForwardRefExoticComponent<Omit<React$1.ClassAttributes<HTMLButtonElement> & React$1.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    showOnHover?: boolean;
}, "ref"> & React$1.RefAttributes<HTMLButtonElement>>;
declare const SidebarMenuBadge: React$1.ForwardRefExoticComponent<Omit<React$1.DetailedHTMLProps<React$1.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SidebarMenuSkeleton: React$1.ForwardRefExoticComponent<Omit<React$1.ClassAttributes<HTMLDivElement> & React$1.HTMLAttributes<HTMLDivElement> & {
    showIcon?: boolean;
}, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SidebarMenuSub: React$1.ForwardRefExoticComponent<Omit<React$1.DetailedHTMLProps<React$1.HTMLAttributes<HTMLUListElement>, HTMLUListElement>, "ref"> & React$1.RefAttributes<HTMLUListElement>>;
declare const SidebarMenuSubItem: React$1.ForwardRefExoticComponent<Omit<React$1.DetailedHTMLProps<React$1.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>, "ref"> & React$1.RefAttributes<HTMLLIElement>>;
declare const SidebarMenuSubButton: React$1.ForwardRefExoticComponent<Omit<React$1.ClassAttributes<HTMLAnchorElement> & React$1.AnchorHTMLAttributes<HTMLAnchorElement> & {
    asChild?: boolean;
    size?: "sm" | "md";
    isActive?: boolean;
}, "ref"> & React$1.RefAttributes<HTMLAnchorElement>>;

declare const Separator: React$1.ForwardRefExoticComponent<Omit<_radix_ui_react_separator.SeparatorProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;

declare const Sheet: React$1.FC<SheetPrimitive.DialogProps>;
declare const sheetVariants: (props?: ({
    side?: "top" | "right" | "bottom" | "left" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SheetContentProps extends React$1.ComponentProps<typeof SheetPrimitive.Content>, VariantProps<typeof sheetVariants> {
}
declare const SheetContent: React$1.ForwardRefExoticComponent<Omit<SheetContentProps, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SheetHeader: {
    ({ className, ...props }: React$1.HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const SheetFooter: {
    ({ className, ...props }: React$1.HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const SheetTitle: React$1.ForwardRefExoticComponent<Omit<SheetPrimitive.DialogTitleProps & React$1.RefAttributes<HTMLHeadingElement>, "ref"> & React$1.RefAttributes<HTMLHeadingElement>>;
declare const SheetDescription: React$1.ForwardRefExoticComponent<Omit<SheetPrimitive.DialogDescriptionProps & React$1.RefAttributes<HTMLParagraphElement>, "ref"> & React$1.RefAttributes<HTMLParagraphElement>>;

declare function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;

declare const Select: React$1.FC<SelectPrimitive.SelectProps>;
declare const SelectGroup: React$1.ForwardRefExoticComponent<SelectPrimitive.SelectGroupProps & React$1.RefAttributes<HTMLDivElement>>;
declare const SelectValue: React$1.ForwardRefExoticComponent<SelectPrimitive.SelectValueProps & React$1.RefAttributes<HTMLSpanElement>>;
declare const SelectTrigger: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectTriggerProps & React$1.RefAttributes<HTMLButtonElement>, "ref"> & React$1.RefAttributes<HTMLButtonElement>>;
declare const SelectScrollUpButton: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectScrollUpButtonProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SelectScrollDownButton: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectScrollDownButtonProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SelectContent: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectContentProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SelectLabel: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectLabelProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SelectItem: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectItemProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SelectSeparator: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectSeparatorProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;

declare const ApprovalToolCall: React__default.FC<UiToolProps>;

declare const ToastToolCall: React__default.FC<UiToolProps>;

/**
 * Utility function to extract text content from message parts
 */
declare const extractTextFromMessage: (message: DistriStreamEvent) => string;
/**
 * Utility function to determine if a message should be displayed
 * Can be used by builders when creating custom chat components
 */
declare const shouldDisplayMessage: (message: DistriStreamEvent, showDebugMessages?: boolean) => boolean;

export { AgentList, AgentSelect, AgentsPage, ApprovalToolCall, ArtifactRenderer, AssistantMessageRenderer, Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Chat, type ChatProps, DebugRenderer, DialogRoot as Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, type DistriAnyTool, DistriProvider, ExecutionSteps, Input, PlanRenderer, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, Separator, Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, Skeleton, TaskExecutionRenderer, Textarea, ThemeProvider, ThemeToggle, ThinkingRenderer, ToastToolCall, ToolCallRenderer, ToolMessageRenderer, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, UserMessageRenderer, extractTextFromMessage, shouldDisplayMessage, useAgent, useAgentDefinitions, useChat, useChatConfig, useChatStateStore, useSidebar, useTheme, useThreads };
