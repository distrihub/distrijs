import { AgentSkill, Message, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, Task, MessageSendParams } from '@a2a-js/sdk/client';
export * from '@a2a-js/sdk/client';
export { AgentCard, Message, MessageSendParams, Task, TaskArtifactUpdateEvent, TaskStatus, TaskStatusUpdateEvent } from '@a2a-js/sdk/client';

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
    /** External tools that are handled by the frontend */
    external_tools?: ExternalTool[];
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
 * External tool definition
 */
interface ExternalTool {
    name: string;
    description: string;
    input_schema: any;
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
 * Tool call definition
 */
interface ToolCall {
    tool_call_id: string;
    tool_name: string;
    input: string;
}
/**
 * Message metadata types for external tools and approval system
 */
type MessageMetadata = {
    type: 'tool_response';
    tool_call_id: string;
    result: any;
} | {
    type: 'tool_calls';
    tool_calls: ToolCall[];
} | {
    type: 'external_tool_calls';
    tool_calls: ToolCall[];
    requires_approval: boolean;
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

type Role = 'user' | 'system' | 'assistant';
interface RunStartedEvent {
    type: 'run_started';
}
interface RunFinishedEvent {
    type: 'run_finished';
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
    static initMessage(input: string, role?: 'agent' | 'user', contextId?: string, messageId?: string, taskId?: string): Message;
    /**
     * Helper method to create message send parameters
     */
    static initMessageParams(message: Message, configuration?: MessageSendParams['configuration']): MessageSendParams;
}
declare function uuidv4(): string;

/**
 * Configuration for Agent invoke method
 */
interface InvokeConfig {
    /** Whether to stream responses */
    stream?: boolean;
    /** Configuration for the message */
    configuration?: MessageSendParams['configuration'];
    /** Context/thread ID */
    contextId?: string;
    /** External tool handlers */
    externalToolHandlers?: Record<string, ExternalToolHandler>;
    /** Approval handler for approval requests */
    approvalHandler?: ApprovalHandler;
}
/**
 * External tool handler function
 */
type ExternalToolHandler = (toolCall: ToolCall) => Promise<any>;
/**
 * Approval handler function
 */
type ApprovalHandler = (toolCalls: ToolCall[], reason?: string) => Promise<boolean>;
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
 * Stream response from agent invoke
 */
interface InvokeStreamResult {
    /** Async generator for streaming events */
    stream: AsyncGenerator<A2AStreamEventData>;
    /** Method to handle external tools and approval requests */
    handleExternalTools: (handler: ExternalToolHandler, approvalHandler?: ApprovalHandler) => Promise<void>;
}
/**
 * Enhanced Agent class with nice API
 */
declare class Agent {
    private client;
    private agentDefinition;
    constructor(agentDefinition: DistriAgent, client: DistriClient);
    /**
     * Get agent information
     */
    get id(): string;
    get name(): string;
    get description(): string | undefined;
    get externalTools(): ExternalTool[];
    /**
     * Invoke the agent with a message
     */
    invoke(input: string, config?: InvokeConfig): Promise<InvokeResult | InvokeStreamResult>;
    /**
     * Direct (non-streaming) invoke
     */
    private invokeDirect;
    /**
     * Streaming invoke
     */
    private invokeStream;
    /**
     * Handle external tools in a message response
     */
    private handleMessageExternalTools;
    /**
     * Handle external tools in a stream
     */
    private handleStreamExternalTools;
    /**
     * Handle a single external tool call
     */
    private handleExternalTool;
    /**
     * Handle approval request
     */
    private handleApprovalRequest;
    /**
     * Send tool response back to the agent
     */
    private sendToolResponse;
    /**
     * Create an agent instance from an agent ID
     */
    static create(agentId: string, client: DistriClient): Promise<Agent>;
    /**
     * List all available agents
     */
    static list(client: DistriClient): Promise<Agent[]>;
}

export { A2AProtocolError, type A2AStreamEventData, APPROVAL_REQUEST_TOOL_NAME, Agent, type AgentHandoverEvent, ApiError, type ApprovalHandler, type ApprovalMode, type ChatProps, ConnectionError, type ConnectionStatus, type DistriAgent, DistriClient, type DistriClientConfig, DistriError, type DistriEvent, type DistriThread, type ExternalTool, type ExternalToolHandler, type InvokeConfig, type InvokeResult, type InvokeStreamResult, type McpDefinition, type McpServerType, type MessageMetadata, type ModelProvider, type ModelSettings, type Role, type RunErrorEvent, type RunFinishedEvent, type RunStartedEvent, type TextMessageContentEvent, type TextMessageEndEvent, type TextMessageStartEvent, type Thread, type ToolCall, type ToolCallArgsEvent, type ToolCallEndEvent, type ToolCallResultEvent, type ToolCallStartEvent, uuidv4 };
