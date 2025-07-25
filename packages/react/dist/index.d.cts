import { AgentSkill, Message, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, Task, MessageSendParams, Part } from '@a2a-js/sdk/client';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';
import React__default, { ReactNode } from 'react';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
import { ClassValue } from 'clsx';

/**
 * Tool definition interface following AG-UI pattern
 */
interface DistriTool {
    name: string;
    description: string;
    parameters: any;
    handler: ToolHandler;
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
    result: any;
    success: boolean;
    error?: string;
}
/**
 * Tool handler function
 */
interface ToolHandler {
    (input: any): Promise<any> | any;
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
    /** Tool approval configuration */
    tool_approval?: ApprovalMode;
}
interface McpDefinition {
    /** The filter applied to the tools in this MCP definition. */
    filter?: string[];
    /** The name of the MCP server. */
    name: string;
    /** The type of the MCP server (Tool or Agent). */
    type?: McpServerType;
}
/**
 * Mode for tool approval requirements
 */
type ApprovalMode = {
    type: 'none';
} | {
    type: 'all';
} | {
    type: 'filter';
    tools: string[];
};
/**
 * Message metadata types for tool responses and content
 */
type MessageMetadata = {
    type: 'tool_response';
    tool_call_id: string;
    result: any;
} | {
    type: 'assistant_response';
    tool_calls: ToolCall[];
} | {
    type: 'plan';
    plan: string;
} | {
    type: 'tool_responses';
    results: ToolResult[];
};
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
     * Helper method to create message send parameters
     */
    static initMessageParams(message: Message, configuration?: MessageSendParams['configuration'], metadata?: any): MessageSendParams;
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
     * Initialize built-in tools
     */
    private initializeBuiltinTools;
    /**
     * Add a tool to the agent (AG-UI style)
     */
    addTool(tool: DistriTool): void;
    /**
     * Add multiple tools at once
     */
    addTools(tools: DistriTool[]): void;
    /**
     * Remove a tool
     */
    removeTool(toolName: string): void;
    /**
     * Get all registered tools
     */
    getTools(): string[];
    /**
     * Check if a tool is registered
     */
    hasTool(toolName: string): boolean;
    /**
     * Execute a tool call
     */
    executeTool(toolCall: ToolCall): Promise<ToolResult>;
    /**
     * Get tool definitions for context metadata
     */
    getToolDefinitions(): Record<string, any>;
    /**
     * Get agent information
     */
    get id(): string;
    get name(): string;
    get description(): string | undefined;
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
    invokeStream(params: MessageSendParams): Promise<AsyncGenerator<A2AStreamEventData>>;
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

interface UseAgentOptions {
    agentId: string;
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

interface UseChatOptions {
    agentId: string;
    threadId: string;
    agent?: Agent$1;
    metadata?: any;
}
interface UseChatResult {
    messages: Message[];
    loading: boolean;
    error: Error | null;
    isStreaming: boolean;
    sendMessage: (input: string | Part[], metadata?: MessageMetadata) => Promise<void>;
    sendMessageStream: (input: string | Part[], metadata?: MessageMetadata) => Promise<void>;
    refreshMessages: () => Promise<void>;
    clearMessages: () => void;
    agent: Agent$1 | null;
}
/**
 * useChat is the main hook for chat UIs with simplified tool handling.
 * Tools are now registered directly on the agent using agent.addTool() or useTools hook.
 */
declare function useChat({ agentId, threadId, agent: providedAgent, metadata, }: UseChatOptions): UseChatResult;

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
    agent?: Agent$1 | null;
}
interface UseToolsResult {
    addTool: (tool: DistriTool) => void;
    addTools: (tools: DistriTool[]) => void;
    removeTool: (toolName: string) => void;
    executeTool: (toolCall: ToolCall) => Promise<ToolResult>;
    getTools: () => string[];
    hasTool: (toolName: string) => boolean;
}
/**
 * Hook for managing tools in an agent
 * Follows AG-UI pattern for tool registration
 */
declare function useTools({ agent }: UseToolsOptions): UseToolsResult;
/**
 * Utility function to create common tool definitions
 */
declare const createTool: (name: string, description: string, parameters: any, handler: (input: any) => Promise<any> | any) => DistriTool;
/**
 * Built-in tool definitions
 */
declare const createBuiltinTools: () => {
    /**
     * Confirmation tool for user approval
     */
    confirm: DistriTool;
    /**
     * Input request tool
     */
    input: DistriTool;
    /**
     * Notification tool
     */
    notify: DistriTool;
};

interface DistriProviderProps {
    config: DistriClientConfig;
    children: ReactNode;
    defaultTheme?: 'dark' | 'light' | 'system';
}
declare function DistriProvider({ config, children, defaultTheme }: DistriProviderProps): react_jsx_runtime.JSX.Element;

interface ChatContainerProps {
    agentId: string;
    agent?: Agent$1;
    metadata?: any;
    variant?: 'embedded' | 'full';
    height?: string | number;
    className?: string;
    threadId?: string;
    showSidebar?: boolean;
    sidebarWidth?: number;
    theme?: 'light' | 'dark' | 'auto';
    placeholder?: string;
    showDebug?: boolean;
    UserMessageComponent?: React__default.ComponentType<any>;
    AssistantMessageComponent?: React__default.ComponentType<any>;
    AssistantWithToolCallsComponent?: React__default.ComponentType<any>;
    PlanMessageComponent?: React__default.ComponentType<any>;
    onMessageSent?: (message: string) => void;
    onResponse?: (response: any) => void;
    onThreadSelect?: (threadId: string) => void;
    onThreadCreate?: (threadId: string) => void;
    onThreadDelete?: (threadId: string) => void;
}
/**
 * ChatContainer - A ready-to-use chat component for Distri agents
 *
 * This is the main component developers should use. It provides:
 * - Embedded variant: Simple chat interface for embedding in existing UIs
 * - Full variant: Complete chat application with threads sidebar
 * - Theme support: Light/dark/auto themes compatible with shadcn/ui
 * - Tool support: Automatic tool execution with visual feedback
 * - Customization: Override any message component
 *
 * @example
 * ```tsx
 * // Simple embedded chat
 * <ChatContainer agentId="my-agent" variant="embedded" height={400} />
 *
 * // Full chat with threads
 * <ChatContainer agentId="my-agent" variant="full" />
 *
 * // With custom components
 * <ChatContainer
 *   agentId="my-agent"
 *   UserMessageComponent={CustomUserMessage}
 *   theme="dark"
 * />
 * ```
 */
declare const ChatContainer: React__default.FC<ChatContainerProps>;

interface ChatProps {
    agentId: string;
    threadId: string;
    agent?: Agent$1;
    tools?: Record<string, any>;
    metadata?: any;
    height?: string;
    onThreadUpdate?: (threadId: string) => void;
    className?: string;
    placeholder?: string;
    UserMessageComponent?: React__default.ComponentType<any>;
    AssistantMessageComponent?: React__default.ComponentType<any>;
    AssistantWithToolCallsComponent?: React__default.ComponentType<any>;
    PlanMessageComponent?: React__default.ComponentType<any>;
    onExternalToolCall?: (toolCall: any) => void;
}
declare const Chat: React__default.FC<ChatProps>;

interface EmbeddableChatProps {
    agentId: string;
    threadId?: string;
    agent?: Agent$1;
    height?: string;
    className?: string;
    style?: React__default.CSSProperties;
    metadata?: any;
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
    onAgentSelect?: (agentId: string) => void;
    onResponse?: (message: any) => void;
}
declare const EmbeddableChat: React__default.FC<EmbeddableChatProps>;

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
    showSidebar?: boolean;
    sidebarWidth?: number;
    onAgentSelect?: (agentId: string) => void;
    onThreadSelect?: (threadId: string) => void;
    onThreadCreate?: (threadId: string) => void;
    onThreadDelete?: (threadId: string) => void;
    onLogoClick?: () => void;
}
declare const FullChat: React__default.FC<FullChatProps>;

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
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof buttonVariants.variant;
    size?: keyof typeof buttonVariants.size;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

declare const Card: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const CardDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const CardContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;

declare const badgeVariants: (props?: ({
    variant?: "default" | "destructive" | "outline" | "secondary" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
}
declare function Badge({ className, variant, ...props }: BadgeProps): react_jsx_runtime.JSX.Element;

interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}
declare const DialogRoot: React.FC<DialogProps>;
declare const DialogTrigger: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>;
declare const DialogContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const DialogHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const DialogTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
}
declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;

interface Agent {
    id: string;
    name: string;
    description?: string;
}
interface AgentDropdownProps {
    agents: Agent[];
    selectedAgentId: string;
    onAgentSelect: (agentId: string) => void;
    className?: string;
    placeholder?: string;
}
declare const AgentDropdown: React__default.FC<AgentDropdownProps>;

interface ApprovalDialogProps {
    toolCalls: ToolCall[];
    reason?: string;
    onApprove: () => void;
    onDeny: () => void;
    onCancel: () => void;
}
declare const ApprovalDialog: React__default.FC<ApprovalDialogProps>;

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

interface MessageRendererProps {
    content: string;
    className?: string;
    metadata?: any;
}
declare const MessageRenderer: React__default.FC<MessageRendererProps>;

declare function cn(...inputs: ClassValue[]): string;

export { AgentDropdown, ApprovalDialog, Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Chat, ChatContainer, ChatInput, DialogRoot as Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DistriProvider, EmbeddableChat, FullChat, Input, MessageRenderer, Textarea, ThemeProvider, cn, createBuiltinTools, createTool, useAgent, useAgents, useChat, useTheme, useThreads, useTools };
