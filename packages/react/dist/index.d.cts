import { AgentSkill, Message, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, Task, MessageSendParams, Part } from '@a2a-js/sdk/client';
export { AgentCard, Message, MessageSendParams, Task, TaskArtifactUpdateEvent, TaskStatus, TaskStatusUpdateEvent } from '@a2a-js/sdk/client';
import * as React from 'react';
import React__default, { ReactNode } from 'react';
import * as react_jsx_runtime from 'react/jsx-runtime';

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
/**
 * Approval request tool name constant
 */
declare const APPROVAL_REQUEST_TOOL_NAME = "approval_request";
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
interface Thread {
    id: string;
    title: string;
    agent_id: string;
    agent_name: string;
    updated_at: string;
    message_count: number;
    last_message?: string;
}
/**
 * Connection Status
 */
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
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
/**
 * Error Types
 */
declare class DistriError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
declare class A2AProtocolError extends DistriError {
    constructor(message: string, details?: any);
}
declare class ApiError extends DistriError {
    statusCode: number;
    constructor(message: string, statusCode: number, details?: any);
}
declare class ConnectionError extends DistriError {
    constructor(message: string, details?: any);
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
 * Configuration for Agent invoke method
 */
interface InvokeConfig {
    /** Configuration for the message */
    configuration?: MessageSendParams['configuration'];
    /** Context/thread ID */
    contextId?: string;
    /** Metadata for the requests */
    metadata?: any;
}
interface ToolCallState {
    tool_call_id: string;
    tool_name?: string;
    args: string;
    result?: string;
    running: boolean;
}
/**
 * Result from agent invoke
 */
interface InvokeResult {
    /** Final response message */
    message?: Message;
    /** Task if created */
    task?: any;
    /** Whether the response was streamed */
    streamed: boolean;
}
/**
 * Enhanced Agent class with simple tool system following AG-UI pattern
 */
declare class Agent {
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
     * Get all registered tool definitions
     */
    getToolDefinitions(): Record<string, any>;
    /**
     * Get a specific tool definition
     */
    getTool(toolName: string): DistriTool | undefined;
    /**
     * Check if a tool is registered
     */
    hasTool(toolName: string): boolean;
    /**
     * Execute a tool call
     */
    executeTool(toolCall: ToolCall): Promise<ToolResult>;
    /**
     * Execute multiple tool calls in parallel
     */
    executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]>;
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
    static create(agentId: string, client: DistriClient): Promise<Agent>;
    /**
     * List all available agents
     */
    static list(client: DistriClient): Promise<Agent[]>;
}

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

interface ChatProps {
    thread: DistriThread;
    agent: Agent;
    onThreadUpdate?: () => void;
    MessageRendererComponent?: React__default.ComponentType<any>;
    ExternalToolManagerComponent?: React__default.ComponentType<any>;
    HeaderComponent?: React__default.ComponentType<{
        agent: Agent;
        thread: DistriThread;
    }>;
    InputComponent?: React__default.ComponentType<any>;
    LoadingComponent?: React__default.ComponentType<any>;
    ErrorComponent?: React__default.ComponentType<{
        error: Error;
    }>;
    className?: string;
    placeholder?: string;
    showHeader?: boolean;
    theme?: 'light' | 'dark';
}
declare const ChatContent: React__default.FC<ChatProps>;

interface EmbeddableChatProps {
    agentId: string;
    threadId: string;
    agent?: Agent;
    height?: string;
    placeholder?: string;
    theme?: 'light' | 'dark';
    showDebug?: boolean;
    onThreadUpdate?: () => void;
    className?: string;
    MessageRendererComponent?: React__default.ComponentType<any>;
    ExternalToolManagerComponent?: React__default.ComponentType<any>;
    HeaderComponent?: React__default.ComponentType<{
        agent: Agent;
        agentId: string;
    }>;
    InputComponent?: React__default.ComponentType<any>;
    LoadingComponent?: React__default.ComponentType<any>;
    ErrorComponent?: React__default.ComponentType<{
        error: Error;
    }>;
    showHeader?: boolean;
}
declare const EmbeddableChat: React__default.FC<EmbeddableChatProps>;

interface ExternalToolManagerProps {
    agent: Agent;
    toolCalls: ToolCall[];
    onToolComplete: (results: ToolResult[]) => void;
    onCancel: () => void;
}
declare const ExternalToolManager: React__default.FC<ExternalToolManagerProps>;

interface MessageRendererProps {
    message?: any;
    content?: string;
    className?: string;
    metadata?: any;
    isUser?: boolean;
    isStreaming?: boolean;
    theme?: 'light' | 'dark';
}
declare const MessageRenderer: React__default.FC<MessageRendererProps>;

interface ApprovalDialogProps {
    toolCalls: ToolCall[];
    reason?: string;
    onApprove: () => void;
    onDeny: () => void;
    onCancel: () => void;
}
declare const ApprovalDialog: React__default.FC<ApprovalDialogProps>;

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
}
declare const Toast: React__default.FC<ToastProps>;

interface DistriProviderProps {
    config: DistriClientConfig;
    children: ReactNode;
    defaultTheme?: 'dark' | 'light' | 'system';
}
declare function DistriProvider({ config, children, defaultTheme }: DistriProviderProps): react_jsx_runtime.JSX.Element;

interface UseAgentOptions {
    agentId?: string;
    autoCreateAgent?: boolean;
}
interface UseAgentResult {
    agent: Agent | null;
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
    agent?: Agent;
    onToolCalls?: (toolCalls: ToolCall[]) => void;
}
interface UseChatResult {
    messages: Message[];
    loading: boolean;
    error: Error | null;
    agent: Agent | null;
    sendMessage: (input: string | Part[], metadata?: MessageMetadata) => Promise<void>;
    sendMessageStream: (input: string | Part[], metadata?: MessageMetadata) => Promise<void>;
    fetchMessages: () => Promise<void>;
    externalToolCalls: ToolCall[];
    handleExternalToolComplete: (results: ToolResult[]) => Promise<void>;
    handleExternalToolCancel: () => void;
}
/**
 * Enhanced useChat hook with integrated tool system
 */
declare function useChat({ agentId, threadId, agent: providedAgent, onToolCalls, }: UseChatOptions): UseChatResult;

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
    agent?: Agent | null;
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
 * Create built-in tools that can be added to agents
 * These tools provide common UI interactions
 */
declare const createBuiltinTools: () => Record<string, DistriTool>;
/**
 * Helper function to create a custom tool with proper typing
 */
declare const createTool: <T = any>(name: string, description: string, parameters: any, handler: (input: T) => Promise<any> | any) => DistriTool;
declare const builtinTools: Record<string, DistriTool>;
declare const approvalRequestTool: DistriTool;
declare const toastTool: DistriTool;
declare const inputRequestTool: DistriTool;
declare const confirmTool: DistriTool;
declare const notifyTool: DistriTool;

/**
 * Extract external tool calls from messages
 * This function finds messages with assistant_response metadata containing tool calls
 */
declare const extractExternalToolCalls: (messages: any[]) => ToolCall[];

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

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
}
declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;

export { A2AProtocolError, type A2AStreamEventData, APPROVAL_REQUEST_TOOL_NAME, Agent, type AgentHandoverEvent, ApiError, ApprovalDialog, type ApprovalMode, Button, type ButtonProps, ChatContent as Chat, type ChatProps, ConnectionError, type ConnectionStatus, type DistriAgent, DistriClient, type DistriClientConfig, DistriError, type DistriEvent, DistriProvider, type DistriThread, type DistriTool, EmbeddableChat, type EmbeddableChatProps, ExternalToolManager, Input, type InputProps, type InvokeConfig, type InvokeResult, type McpDefinition, type McpServerType, type MessageMetadata, MessageRenderer, type ModelProvider, type ModelSettings, type Role, type RunErrorEvent, type RunFinishedEvent, type RunStartedEvent, type TextMessageContentEvent, type TextMessageEndEvent, type TextMessageStartEvent, Textarea, type TextareaProps, type Thread, Toast, type ToolCall, type ToolCallArgsEvent, type ToolCallEndEvent, type ToolCallResultEvent, type ToolCallStartEvent, type ToolCallState, type ToolHandler, type ToolResult, approvalRequestTool, builtinTools, buttonVariants, confirmTool, createBuiltinTools, createTool, extractExternalToolCalls, inputRequestTool, notifyTool, toastTool, useAgent, useAgents, useChat, useThreads, useTools };
