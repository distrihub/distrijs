import { AgentSkill, Message, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, Task, MessageSendParams, Part } from '@a2a-js/sdk/client';
export { AgentCard, Message, MessageSendParams, Task, TaskArtifactUpdateEvent, TaskStatus, TaskStatusUpdateEvent } from '@a2a-js/sdk/client';

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
interface ChatProps {
    thread: Thread;
    agent: DistriAgent;
    onThreadUpdate?: () => void;
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

export { A2AProtocolError, type A2AStreamEventData, APPROVAL_REQUEST_TOOL_NAME, Agent, type AgentHandoverEvent, ApiError, type ApprovalMode, type ChatProps, ConnectionError, type ConnectionStatus, type DistriAgent, DistriClient, type DistriClientConfig, DistriError, type DistriEvent, type DistriThread, type DistriTool, type InvokeConfig, type InvokeResult, type McpDefinition, type McpServerType, type MessageMetadata, type ModelProvider, type ModelSettings, type Role, type RunErrorEvent, type RunFinishedEvent, type RunStartedEvent, type TextMessageContentEvent, type TextMessageEndEvent, type TextMessageStartEvent, type Thread, type ToolCall, type ToolCallArgsEvent, type ToolCallEndEvent, type ToolCallResultEvent, type ToolCallStartEvent, type ToolCallState, type ToolHandler, type ToolResult };
