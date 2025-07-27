import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React$1 from 'react';
import React__default, { ReactNode } from 'react';
import { AgentSkill, Message, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, Task, MessageSendParams, Part } from '@a2a-js/sdk/client';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
import * as _radix_ui_react_separator from '@radix-ui/react-separator';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ClassValue } from 'clsx';

type Role = 'user' | 'system' | 'assistant';
interface RunStartedEvent {
    type: 'run_started';
    data: {};
}
interface RunFinishedEvent {
    type: 'run_finished';
    data: {};
}
interface RunErrorEvent {
    type: 'run_error';
    data: {
        message: string;
        code?: string;
    };
}
interface TextMessageStartEvent {
    type: 'text_message_start';
    data: {
        message_id: string;
        role: Role;
    };
}
interface TextMessageContentEvent {
    type: 'text_message_content';
    data: {
        message_id: string;
        delta: string;
    };
}
interface TextMessageEndEvent {
    type: 'text_message_end';
    data: {
        message_id: string;
    };
}
interface ToolCallStartEvent {
    type: 'tool_call_start';
    data: {
        tool_call_id: string;
        tool_call_name: string;
        parent_message_id?: string;
        is_external?: boolean;
    };
}
interface ToolCallArgsEvent {
    type: 'tool_call_args';
    data: {
        tool_call_id: string;
        delta: string;
    };
}
interface ToolCallEndEvent {
    type: 'tool_call_end';
    data: {
        tool_call_id: string;
    };
}
interface ToolCallResultEvent {
    type: 'tool_call_result';
    data: {
        tool_call_id: string;
        result: string;
    };
}
interface AgentHandoverEvent {
    type: 'agent_handover';
    data: {
        from_agent: string;
        to_agent: string;
        reason?: string;
    };
}
type DistriEvent = RunStartedEvent | RunFinishedEvent | RunErrorEvent | TextMessageStartEvent | TextMessageContentEvent | TextMessageEndEvent | ToolCallStartEvent | ToolCallArgsEvent | ToolCallEndEvent | ToolCallResultEvent | AgentHandoverEvent;

/**
 * Message roles supported by Distri
 */
type MessageRole = 'system' | 'assistant' | 'user' | 'tool';
/**
 * Distri-specific message structure with parts
 */
interface DistriMessage {
    id: string;
    role: MessageRole;
    parts: DistriPart[];
    created_at?: string;
}
type DistriStreamEvent = DistriMessage | DistriEvent;
/**
 * Context required for constructing A2A messages from DistriMessage
 */
interface InvokeContext {
    thread_id: string;
    run_id?: string;
    metadata?: any;
}
/**
 * Distri message parts - equivalent to Rust enum Part
 */
type TextPart = {
    type: 'text';
    text: string;
};
type CodeObservationPart = {
    type: 'code_observation';
    thought: string;
    code: string;
};
type ImageUrlPart = {
    type: 'image_url';
    image: FileUrl;
};
type ImageBytesPart = {
    type: 'image_bytes';
    image: FileBytes;
};
type ImagePart = ImageUrlPart | ImageBytesPart;
type DataPart = {
    type: 'data';
    data: any;
};
type ToolCallPart = {
    type: 'tool_call';
    tool_call: ToolCall;
};
type ToolResultPart = {
    type: 'tool_result';
    tool_result: ToolResult;
};
type PlanPart = {
    type: 'plan';
    plan: string;
};
type DistriPart = TextPart | CodeObservationPart | ImagePart | DataPart | ToolCallPart | ToolResultPart | PlanPart;
/**
 * File type for images
 */
interface FileBytes {
    mime_type: string;
    data: string;
    name?: string;
}
interface FileUrl {
    mime_type: string;
    url: string;
    name?: string;
}
/**
 * Tool definition interface following AG-UI pattern
 */
interface DistriBaseTool {
    name: string;
    type: 'function' | 'ui';
    description: string;
    input_schema: object;
}
interface DistriFnTool extends DistriBaseTool {
    type: 'function';
    handler: ToolHandler;
    onToolComplete?: (toolCallId: string, toolResult: ToolResult) => void;
}
/**
 * Tool handler function
 */
interface ToolHandler {
    (input: any): Promise<string | number | boolean | null | object>;
}
/**
 * Tool call from agent
 */
interface ToolCall {
    tool_call_id: string;
    tool_name: string;
    input: any;
}
/**
 * Tool result for responding to tool calls
 */
interface ToolResult {
    tool_call_id: string;
    result: string | number | boolean | null;
    success: boolean;
    error?: string;
}
/**
 * Distri-specific Agent type that wraps A2A AgentCard
 */
interface DistriAgent {
    /** The name of the agent. */
    name: string;
    id: string;
    /** A brief description of the agent's purpose. */
    description?: string;
    /** The version of the agent. */
    version?: string;
    /** The system prompt for the agent, if any. */
    system_prompt?: string | null;
    /** A list of MCP server definitions associated with the agent. */
    mcp_servers?: McpDefinition[];
    /** Settings related to the model used by the agent. */
    model_settings?: ModelSettings;
    /** The size of the history to maintain for the agent. */
    history_size?: number;
    /** The planning configuration for the agent, if any. */
    plan?: any;
    /** A2A-specific fields */
    icon_url?: string;
    max_iterations?: number;
    skills?: AgentSkill[];
    /** List of sub-agents that this agent can transfer control to */
    sub_agents?: string[];
}
interface McpDefinition {
    /** The filter applied to the tools in this MCP definition. */
    filter?: string[];
    /** The name of the MCP server. */
    name: string;
    /** The type of the MCP server (Tool or Agent). */
    type?: McpServerType;
}
interface ModelSettings {
    model: string;
    temperature: number;
    max_tokens: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
    max_iterations: number;
    provider: ModelProvider;
    /** Additional parameters for the agent, if any. */
    parameters?: any;
    /** The format of the response, if specified. */
    response_format?: any;
}
type McpServerType = 'tool' | 'agent';
type ModelProvider = 'openai' | 'aigateway';
/**
 * Distri Thread type for conversation management
 */
interface DistriThread {
    id: string;
    title: string;
    agent_id: string;
    agent_name: string;
    updated_at: string;
    message_count: number;
    last_message?: string;
}
/**
 * Distri Client Configuration
 */
interface DistriClientConfig {
    baseUrl: string;
    apiVersion?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    debug?: boolean;
    headers?: Record<string, string>;
    interceptor?: (init?: RequestInit) => Promise<RequestInit | undefined>;
}
type A2AStreamEventData = Message | TaskStatusUpdateEvent | TaskArtifactUpdateEvent | Task;

/**
 * Enhanced Distri Client that wraps A2AClient and adds Distri-specific features
 */
declare class DistriClient {
    private config;
    private agentClients;
    constructor(config: DistriClientConfig);
    /**
     * Get all available agents from the Distri server
     */
    getAgents(): Promise<DistriAgent[]>;
    /**
     * Get specific agent by ID
     */
    getAgent(agentId: string): Promise<DistriAgent>;
    /**
     * Get or create A2AClient for an agent
     */
    private getA2AClient;
    /**
     * Send a message to an agent
     */
    sendMessage(agentId: string, params: MessageSendParams): Promise<Message | Task>;
    /**
     * Send a streaming message to an agent
     */
    sendMessageStream(agentId: string, params: MessageSendParams): AsyncGenerator<A2AStreamEventData>;
    /**
     * Get task details
     */
    getTask(agentId: string, taskId: string): Promise<Task>;
    /**
     * Cancel a task
     */
    cancelTask(agentId: string, taskId: string): Promise<void>;
    /**
     * Get threads from Distri server
     */
    getThreads(): Promise<DistriThread[]>;
    getThread(threadId: string): Promise<DistriThread>;
    /**
     * Get thread messages
     */
    getThreadMessages(threadId: string): Promise<Message[]>;
    /**
     * Get messages from a thread as DistriMessage format
     */
    getThreadMessagesAsDistri(threadId: string): Promise<DistriMessage[]>;
    /**
     * Send a DistriMessage to a thread
     */
    sendDistriMessage(threadId: string, message: DistriMessage, context: InvokeContext): Promise<void>;
    /**
     * Get the base URL for making direct requests
     */
    get baseUrl(): string;
    /**
     * Enhanced fetch with retry logic
     */
    private fetchAbsolute;
    /**
     * Enhanced fetch with retry logic
     */
    private fetch;
    /**
     * Delay utility
     */
    private delay;
    /**
     * Debug logging
     */
    private debug;
    /**
     * Helper method to create A2A messages
     */
    static initMessage(parts: Part[] | string, role: "agent" | "user" | undefined, message: Omit<Partial<Message>, 'parts' | 'role' | 'kind'>): Message;
    /**
     * Create a DistriMessage instance
     */
    static initDistriMessage(role: DistriMessage['role'], parts: DistriPart[], id?: string, created_at?: string): DistriMessage;
    /**
     * Helper method to create message send parameters
     */
    static initMessageParams(message: Message, configuration?: MessageSendParams['configuration'], metadata?: any): MessageSendParams;
    /**
     * Create MessageSendParams from a DistriMessage using InvokeContext
     */
    static initDistriMessageParams(message: DistriMessage, context: InvokeContext): MessageSendParams;
}

/**
 * Enhanced Agent class with simple tool system following AG-UI pattern
 */
declare class Agent$1 {
    private client;
    private agentDefinition;
    private tools;
    constructor(agentDefinition: DistriAgent, client: DistriClient);
    /**
     * Add a tool to the agent (AG-UI style)
     */
    registerTool(tool: DistriBaseTool): void;
    /**
     * Add multiple tools at once
     */
    registerTools(tools: DistriBaseTool[]): void;
    /**
     * Remove a tool
     */
    unregisterTool(toolName: string): void;
    /**
     * Get all registered tools
     */
    getTools(): DistriBaseTool[];
    /**
     * Check if a tool is registered
     */
    hasTool(toolName: string): boolean;
    /**
     * Get agent information
     */
    get id(): string;
    get name(): string;
    get description(): string | undefined;
    get iconUrl(): string | undefined;
    /**
     * Fetch messages for a thread (public method for useChat)
     */
    getThreadMessages(threadId: string): Promise<Message[]>;
    /**
     * Direct (non-streaming) invoke
     */
    invoke(params: MessageSendParams): Promise<Message>;
    /**
     * Streaming invoke
     */
    invokeStream(params: MessageSendParams): Promise<AsyncGenerator<DistriEvent | DistriMessage>>;
    /**
     * Enhance message params with tool definitions
     */
    private enhanceParamsWithTools;
    /**
     * Create an agent instance from an agent ID
     */
    static create(agentId: string, client: DistriClient): Promise<Agent$1>;
    /**
     * List all available agents
     */
    static list(client: DistriClient): Promise<Agent$1[]>;
}

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

interface UseAgentOptions {
    agentId: string;
    agent?: Agent$1;
    autoCreateAgent?: boolean;
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
declare function useAgent({ agentId, autoCreateAgent, }: UseAgentOptions): UseAgentResult;

interface UseAgentsResult {
    agents: DistriAgent[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    getAgent: (agentId: string) => Promise<DistriAgent>;
}
declare function useAgents(): UseAgentsResult;

type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
interface ToolCallState {
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
    toolCallState?: ToolCallState;
    completeTool: (result: ToolResult) => void;
};

interface UseChatOptions {
    threadId: string;
    agent?: Agent$1;
    onMessage?: (message: DistriStreamEvent) => void;
    onError?: (error: Error) => void;
    metadata?: any;
    onMessagesUpdate?: () => void;
    tools?: DistriAnyTool[];
}
interface UseChatReturn {
    messages: DistriStreamEvent[];
    isStreaming: boolean;
    sendMessage: (content: string | DistriPart[]) => Promise<void>;
    sendMessageStream: (content: string | DistriPart[]) => Promise<void>;
    isLoading: boolean;
    error: Error | null;
    clearMessages: () => void;
    agent: Agent$1 | undefined;
    toolCallStates: Map<string, ToolCallState>;
    hasPendingToolCalls: () => boolean;
    stopStreaming: () => void;
}
declare function useChat({ threadId, onMessage, onError, metadata, onMessagesUpdate, agent, tools, }: UseChatOptions): UseChatReturn;

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

interface UseToolsOptions {
    agent?: Agent$1;
    tools?: DistriAnyTool[];
}
declare function registerTools({ agent, tools }: UseToolsOptions): void;

interface UseToolCallStateOptions {
    onAllToolsCompleted?: (toolResults: ToolResult[]) => void;
    agent?: Agent$1;
}
interface UseToolCallStateReturn {
    toolCallStates: Map<string, ToolCallState>;
    initToolCall: (toolCall: ToolCall) => void;
    updateToolCallStatus: (toolCallId: string, updates: Partial<ToolCallState>) => void;
    getToolCallState: (toolCallId: string) => ToolCallState | undefined;
    hasPendingToolCalls: () => boolean;
    getPendingToolCalls: () => ToolCallState[];
    clearAll: () => void;
    clearToolResults: () => void;
}
declare function useToolCallState(options: UseToolCallStateOptions): UseToolCallStateReturn;

interface FullChatProps {
    agentId: string;
    agent?: Agent$1;
    metadata?: any;
    className?: string;
    availableAgents?: Array<{
        id: string;
        name: string;
        description?: string;
    }>;
    UserMessageComponent?: React__default.ComponentType<any>;
    AssistantMessageComponent?: React__default.ComponentType<any>;
    AssistantWithToolCallsComponent?: React__default.ComponentType<any>;
    PlanMessageComponent?: React__default.ComponentType<any>;
    theme?: 'light' | 'dark' | 'auto';
    showDebug?: boolean;
    onAgentSelect?: (agentId: string) => void;
    onThreadSelect?: (threadId: string) => void;
    onThreadCreate?: (threadId: string) => void;
    onThreadDelete?: (threadId: string) => void;
    onLogoClick?: () => void;
}
declare const FullChat: React__default.FC<FullChatProps>;

interface EmbeddableChatProps {
    agent: Agent$1;
    threadId?: string;
    height?: string;
    className?: string;
    style?: React__default.CSSProperties;
    metadata?: any;
    tools?: DistriAnyTool[];
    availableAgents?: Array<{
        id: string;
        name: string;
        description?: string;
    }>;
    UserMessageComponent?: React__default.ComponentType<any>;
    AssistantMessageComponent?: React__default.ComponentType<any>;
    AssistantWithToolCallsComponent?: React__default.ComponentType<any>;
    PlanMessageComponent?: React__default.ComponentType<any>;
    theme?: 'light' | 'dark' | 'auto';
    showDebug?: boolean;
    showAgentSelector?: boolean;
    placeholder?: string;
    disableAgentSelection?: boolean;
    onAgentSelect?: (agentId: string) => void;
    onResponse?: (message: any) => void;
    onMessagesUpdate?: () => void;
}
declare const EmbeddableChat: React__default.FC<EmbeddableChatProps>;

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

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onStop?: () => void;
    placeholder?: string;
    disabled?: boolean;
    isStreaming?: boolean;
    className?: string;
}
declare const ChatInput: React__default.FC<ChatInputProps>;

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

interface BaseMessageProps {
    content?: string;
    message?: DistriMessage;
    timestamp?: Date;
    className?: string;
    avatar?: React__default.ReactNode;
    name?: string;
}
interface UserMessageProps extends BaseMessageProps {
    content?: string;
}
interface AssistantMessageProps extends BaseMessageProps {
    content?: string;
    message?: DistriMessage;
    isStreaming?: boolean;
    metadata?: any;
    name?: string;
}
interface AssistantWithToolCallsProps extends BaseMessageProps {
    content?: string;
    message?: DistriMessage;
    toolCallStates: ToolCallState[];
    timestamp?: Date;
    isStreaming?: boolean;
}
interface PlanMessageProps extends BaseMessageProps {
    message?: DistriMessage;
    plan: string;
    timestamp?: Date;
}
interface DebugMessageProps extends BaseMessageProps {
    className?: string;
}
declare const UserMessage: React__default.FC<UserMessageProps>;
declare const AssistantMessage: React__default.FC<AssistantMessageProps>;
declare const AssistantWithToolCalls: React__default.FC<AssistantWithToolCallsProps>;
declare const PlanMessage: React__default.FC<PlanMessageProps>;
declare const DebugMessage: React__default.FC<DebugMessageProps>;

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
    side?: "bottom" | "left" | "right" | "top" | null | undefined;
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

declare function cn(...inputs: ClassValue[]): string;

export { AgentSelect, ApprovalToolCall, AssistantMessage, AssistantWithToolCalls, Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, ChatInput, DebugMessage, DialogRoot as Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, type DistriAnyTool, DistriProvider, EmbeddableChat, FullChat, Input, PlanMessage, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, Separator, Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, Skeleton, Textarea, ThemeProvider, ThemeToggle, ToastToolCall, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, UserMessage, cn, extractTextFromMessage, registerTools, shouldDisplayMessage, useAgent, useAgents, useChat, useDistri, useSidebar, useTheme, useThreads, useToolCallState };
