import { ToolResult, DistriFnTool, DistriBaseTool, ToolCall, Agent as Agent$1, DistriChatMessage, ToolsConfig, DistriPart, AgentDefinition, DistriThread, DistriMessage, DistriEvent, DistriClientConfig, DistriClient, DistriArtifact, ImagePart } from '@distri/core';
import * as React$1 from 'react';
import React__default, { ReactNode } from 'react';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
import * as _radix_ui_react_separator from '@radix-ui/react-separator';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

type StreamingIndicator = 'typing' | 'thinking' | 'generating';
interface ThinkingRendererProps {
    indicator: StreamingIndicator;
    className?: string;
    avatar?: React__default.ReactNode;
    name?: string;
    thoughtText?: string;
}
declare const ThinkingRenderer: React__default.FC<ThinkingRendererProps>;

interface StepState {
    id: string;
    title: string;
    index: number;
    status: 'running' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
}
interface ToolCallState {
    tool_call_id: string;
    tool_name: string;
    input: Record<string, unknown>;
    status: ToolCallStatus;
    result?: ToolResult;
    error?: string;
    startTime?: number;
    endTime?: number;
    component?: React__default.ReactNode;
    isExternal?: boolean;
    isLiveStream?: boolean;
}

type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
type DistriAnyTool = DistriFnTool | DistriUiTool;
interface DistriUiTool extends DistriBaseTool {
    type: 'ui';
    component: (props: UiToolProps) => React.ReactNode;
}
type UiToolProps = {
    toolCall: ToolCall;
    toolCallState?: ToolCallState;
    completeTool: (result: ToolResult) => void;
    tool: DistriBaseTool;
};

interface WrapToolOptions {
    autoExecute?: boolean;
}
/**
 * Wraps a DistriFnTool as a DistriUiTool with DefaultToolActions component
 */
declare function wrapFnToolAsUiTool(fnTool: DistriFnTool, options?: WrapToolOptions): DistriUiTool;
/**
 * Automatically wraps an array of tools, converting DistriFnTools to DistriUiTools
 */
declare function wrapTools(tools: (DistriFnTool | DistriUiTool)[], options?: WrapToolOptions): DistriUiTool[];

interface UseChatOptions {
    threadId: string;
    agent?: Agent$1;
    onMessage?: (message: DistriChatMessage) => void;
    onError?: (error: Error) => void;
    getMetadata?: () => Promise<Record<string, unknown>>;
    tools?: ToolsConfig;
    wrapOptions?: WrapToolOptions;
    initialMessages?: (DistriChatMessage)[];
}
interface UseChatReturn {
    messages: (DistriChatMessage)[];
    isStreaming: boolean;
    sendMessage: (content: string | DistriPart[]) => Promise<void>;
    sendMessageStream: (content: string | DistriPart[]) => Promise<void>;
    isLoading: boolean;
    error: Error | null;
    hasPendingToolCalls: () => boolean;
    stopStreaming: () => void;
    addMessage: (message: DistriChatMessage) => void;
}
declare function useChat({ threadId, onError, getMetadata, agent, tools, wrapOptions, initialMessages, }: UseChatOptions): UseChatReturn;

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
interface UseThreadMessagesOptions {
    threadId: string | null;
}

interface ModelOption {
    id: string;
    name: string;
}
interface ChatProps {
    threadId: string;
    agent?: any;
    onMessage?: (message: DistriChatMessage) => void;
    beforeSendMessage?: (content: string | DistriPart[]) => Promise<string | DistriPart[]>;
    onError?: (error: Error) => void;
    getMetadata?: () => Promise<any>;
    tools?: ToolsConfig;
    wrapOptions?: WrapToolOptions;
    initialMessages?: (DistriChatMessage)[];
    theme?: 'light' | 'dark' | 'auto';
    models?: ModelOption[];
    selectedModelId?: string;
    onModelChange?: (modelId: string) => void;
}
declare function Chat({ threadId, agent, onMessage, onError, getMetadata, tools, wrapOptions, initialMessages, theme, models, selectedModelId, beforeSendMessage, onModelChange, }: ChatProps): react_jsx_runtime.JSX.Element;

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

interface AppSidebarProps {
    selectedThreadId: string;
    currentPage: 'chat' | 'agents';
    onNewChat: () => void;
    onThreadSelect: (threadId: string) => void;
    onThreadDelete: (threadId: string) => void;
    onThreadRename: (threadId: string, newTitle: string) => void;
    onLogoClick?: () => void;
    onPageChange: (page: 'chat' | 'agents') => void;
}
declare function AppSidebar({ selectedThreadId, currentPage, onNewChat, onThreadSelect, onThreadDelete, onThreadRename, onLogoClick, onPageChange, }: AppSidebarProps): react_jsx_runtime.JSX.Element;

interface AttachedImage {
    id: string;
    file: File;
    preview: string;
    name: string;
}
interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: (content: string | DistriPart[]) => void;
    onStop?: () => void;
    placeholder?: string;
    disabled?: boolean;
    isStreaming?: boolean;
    className?: string;
}
declare const ChatInput: React__default.FC<ChatInputProps>;

interface TaskExecutionRendererProps {
    events: (DistriMessage | DistriEvent)[];
    className?: string;
}
declare const TaskExecutionRenderer: React__default.FC<TaskExecutionRendererProps>;

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

interface DistriContextValue {
    client: DistriClient | null;
    error: Error | null;
    isLoading: boolean;
}
interface DistriProviderProps {
    config: DistriClientConfig;
    children: ReactNode;
    defaultTheme?: 'dark' | 'light' | 'system';
}
declare function DistriProvider({ config, children, defaultTheme }: DistriProviderProps): react_jsx_runtime.JSX.Element;
declare function useDistri(): DistriContextValue;
declare function useDistriClient(): DistriClient;

interface UseChatMessagesOptions {
    initialMessages?: DistriChatMessage[];
    agent?: Agent$1;
    threadId?: string;
    onError?: (error: Error) => void;
}
interface UseChatMessagesReturn {
    messages: DistriChatMessage[];
    addMessage: (message: DistriChatMessage) => void;
    clearMessages: () => void;
    fetchMessages: () => Promise<void>;
    isLoading: boolean;
    error: Error | null;
}
declare function useChatMessages({ initialMessages, agent, threadId, onError, }?: UseChatMessagesOptions): UseChatMessagesReturn;

interface StreamDebugOptions {
    logEvents?: boolean;
    logMessages?: boolean;
    logTiming?: boolean;
    onEvent?: (event: DistriChatMessage, index: number) => void;
}
declare function debugStreamEvents(agent: Agent$1, message: string, options?: StreamDebugOptions): Promise<{
    events: DistriChatMessage[];
    eventCount: number;
    totalTime: number;
    analysis: {
        eventTypes: Record<string, number>;
        messageCount: number;
        streamingEvents: number;
        toolEvents: number;
        streamingMessages: {
            [k: string]: {
                start?: boolean;
                content: number;
                end?: boolean;
            };
        };
        issues: string[];
    };
}>;
declare function quickDebugMessage(agent: Agent$1, message: string): Promise<{
    events: DistriChatMessage[];
    eventCount: number;
    totalTime: number;
    analysis: {
        eventTypes: Record<string, number>;
        messageCount: number;
        streamingEvents: number;
        toolEvents: number;
        streamingMessages: {
            [k: string]: {
                start?: boolean;
                content: number;
                end?: boolean;
            };
        };
        issues: string[];
    };
}>;

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

declare const DropdownMenu: React$1.FC<DropdownMenuPrimitive.DropdownMenuProps>;
declare const DropdownMenuTrigger: React$1.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuTriggerProps & React$1.RefAttributes<HTMLButtonElement>>;
declare const DropdownMenuGroup: React$1.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuGroupProps & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuPortal: React$1.FC<DropdownMenuPrimitive.DropdownMenuPortalProps>;
declare const DropdownMenuSub: React$1.FC<DropdownMenuPrimitive.DropdownMenuSubProps>;
declare const DropdownMenuRadioGroup: React$1.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuRadioGroupProps & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSubTrigger: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSubTriggerProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSubContent: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSubContentProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuContent: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuContentProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuItem: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuItemProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuCheckboxItem: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuCheckboxItemProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuRadioItem: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuRadioItemProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuLabel: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuLabelProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSeparator: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSeparatorProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuShortcut: {
    ({ className, ...props }: React$1.HTMLAttributes<HTMLSpanElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};

interface ArtifactRendererProps {
    message: DistriArtifact;
    chatState: Record<string, unknown>;
    className?: string;
    avatar?: React__default.ReactNode;
}
declare function ArtifactRenderer({ message, chatState: _chatState, className, avatar }: ArtifactRendererProps): react_jsx_runtime.JSX.Element | null;

interface AssistantMessageRendererProps {
    message: DistriMessage | DistriArtifact;
    className?: string;
    avatar?: React__default.ReactNode;
    name?: string;
}
declare const AssistantMessageRenderer: React__default.NamedExoticComponent<AssistantMessageRendererProps>;

interface DebugRendererProps {
    message: DistriEvent | DistriArtifact;
    className?: string;
    avatar?: React__default.ReactNode;
}
declare const DebugRenderer: React__default.FC<DebugRendererProps>;

interface ImageRendererProps {
    imageParts: ImagePart[];
    className?: string;
}
declare const ImageRenderer: React__default.FC<ImageRendererProps>;

interface LoadingShimmerProps {
    text: string;
    className?: string;
}
declare const LoadingShimmer: React__default.FC<LoadingShimmerProps>;

interface MessageRendererProps {
    message: DistriChatMessage;
    index: number;
    isExpanded?: boolean;
    onToggle?: () => void;
}
declare function MessageRendererBase({ message, index, isExpanded, onToggle }: MessageRendererProps): React__default.ReactNode;
declare const MessageRenderer: React__default.MemoExoticComponent<typeof MessageRendererBase>;

interface PlanRendererProps {
    message: DistriArtifact;
    className?: string;
    avatar?: React__default.ReactNode;
}
declare const PlanRenderer: React__default.FC<PlanRendererProps>;

interface StepBasedRendererProps {
    message: DistriMessage;
}
declare const StepBasedRenderer: React__default.FC<StepBasedRendererProps>;

interface StepRendererProps {
    step: StepState;
    className?: string;
}
declare const StepRenderer: React__default.FC<StepRendererProps>;

interface StreamingTextRendererProps {
    text: string;
    isStreaming?: boolean;
    className?: string;
}
declare const StreamingTextRenderer: React__default.NamedExoticComponent<StreamingTextRendererProps>;

interface ExtractedContent {
    text: string;
    hasMarkdown: boolean;
    hasCode: boolean;
    hasLinks: boolean;
    hasImages: boolean;
    imageParts: ImagePart[];
    rawContent: DistriMessage | DistriEvent | DistriArtifact;
}
declare function extractContent(message: DistriMessage | DistriEvent | DistriArtifact): ExtractedContent;
declare function renderTextContent(content: ExtractedContent): React__default.ReactNode;

interface ToolCallRendererProps {
    toolCall: ToolCallState;
    isExpanded: boolean;
    onToggle: () => void;
    className?: string;
    avatar?: React__default.ReactNode;
    name?: string;
}
declare const ToolCallRenderer: React__default.FC<ToolCallRendererProps>;

interface ToolMessageRendererProps {
    message: DistriMessage;
    className?: string;
    avatar?: React__default.ReactNode;
}
declare const ToolMessageRenderer: React__default.FC<ToolMessageRendererProps>;

interface ToolResultRendererProps {
    toolCallId: string;
    toolName: string;
    result: string | number | boolean | null | object;
    success: boolean;
    error?: string;
    onSendResponse?: (toolCallId: string, response: string | number | boolean | null | object) => void;
    className?: string;
}
declare function ToolResultRenderer({ toolCallId, toolName, result, success, error, onSendResponse, className }: ToolResultRendererProps): react_jsx_runtime.JSX.Element;

declare const TypingIndicator: React__default.FC;

interface UserMessageRendererProps {
    message: DistriMessage;
    className?: string;
    avatar?: React__default.ReactNode;
}
declare const UserMessageRenderer: React__default.FC<UserMessageRendererProps>;

export { AgentSelect, AppSidebar, ArtifactRenderer, type ArtifactRendererProps, AssistantMessageRenderer, type AssistantMessageRendererProps, type AttachedImage, Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Chat, ChatInput, type ChatInputProps, type ChatProps, DebugRenderer, type DebugRendererProps, DialogRoot as Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, type DistriAnyTool, DistriProvider, type DistriUiTool, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, type ExtractedContent, ImageRenderer, type ImageRendererProps, Input, LoadingShimmer, MessageRenderer, type MessageRendererProps, type ModelOption, PlanRenderer, type PlanRendererProps, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, Separator, Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, Skeleton, StepBasedRenderer, type StepBasedRendererProps, StepRenderer, type StepRendererProps, type StreamDebugOptions, type StreamingIndicator, StreamingTextRenderer, TaskExecutionRenderer, Textarea, ThemeProvider, ThemeToggle, ThinkingRenderer, type ThinkingRendererProps, ToolCallRenderer, type ToolCallRendererProps, type ToolCallStatus, ToolMessageRenderer, type ToolMessageRendererProps, ToolResultRenderer, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TypingIndicator, type UiToolProps, type UseAgentOptions, type UseAgentResult, type UseAgentsResult, type UseChatMessagesOptions, type UseChatMessagesReturn, type UseChatOptions, type UseChatReturn, type UseThreadMessagesOptions, type UseThreadsResult, UserMessageRenderer, type UserMessageRendererProps, type WrapToolOptions, debugStreamEvents, extractContent, quickDebugMessage, renderTextContent, useAgent, useAgentDefinitions, useChat, useChatMessages, useDistri, useDistriClient, useSidebar, useTheme, useThreads, wrapFnToolAsUiTool, wrapTools };
