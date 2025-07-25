import { AgentSkill, Message, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, Task, MessageSendParams, Part } from '@a2a-js/sdk/client';

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
type ImagePart = {
    type: 'image';
    image: FileType;
};
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
    tool_result: ToolResponse;
};
type PlanPart = {
    type: 'plan';
    plan: string;
};
type DistriPart = TextPart | CodeObservationPart | ImagePart | DataPart | ToolCallPart | ToolResultPart | PlanPart;
/**
 * File type for images
 */
interface FileType {
    mime_type: string;
    data: string;
    filename?: string;
}
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
type ToolResponse = ToolResult;
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
type A2AStreamEventData = Message | TaskStatusUpdateEvent | TaskArtifactUpdateEvent | Task;
declare function isDistriMessage(event: DistriStreamEvent): event is DistriMessage;
declare function isDistriEvent(event: DistriStreamEvent): event is DistriEvent;

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
    registerTool(tool: DistriTool): void;
    /**
     * Add multiple tools at once
     */
    registerTools(tools: DistriTool[]): void;
    /**
     * Remove a tool
     */
    unregisterTool(toolName: string): void;
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
    static create(agentId: string, client: DistriClient): Promise<Agent>;
    /**
     * List all available agents
     */
    static list(client: DistriClient): Promise<Agent[]>;
}

/**
 * Converts an A2A Message to a DistriMessage
 */
declare function convertA2AMessageToDistri(a2aMessage: Message): DistriMessage;
/**
 * Converts an A2A Part to a DistriPart
 */
declare function convertA2APartToDistri(a2aPart: any): DistriPart;
/**
 * Converts a DistriMessage to an A2A Message using the provided context
 */
declare function convertDistriMessageToA2A(distriMessage: DistriMessage, context: InvokeContext): Message;
/**
 * Converts a DistriPart to an A2A Part
 */
declare function convertDistriPartToA2A(distriPart: DistriPart): any;
/**
 * Extract text content from DistriMessage
 */
declare function extractTextFromDistriMessage(message: DistriMessage): string;
/**
 * Extract tool calls from DistriMessage
 */
declare function extractToolCallsFromDistriMessage(message: DistriMessage): any[];
/**
 * Extract tool results from DistriMessage
 */
declare function extractToolResultsFromDistriMessage(message: DistriMessage): any[];

export { APPROVAL_REQUEST_TOOL_NAME, Agent, type AgentHandoverEvent, type ChatProps, type CodeObservationPart, type ConnectionStatus, type DataPart, type DistriAgent, DistriClient, type DistriClientConfig, type DistriEvent, type DistriMessage, type DistriPart, type DistriStreamEvent, type DistriThread, type DistriTool, type FileType, type ImagePart, type InvokeConfig, type InvokeContext, type InvokeResult, type McpDefinition, type McpServerType, type MessageRole, type ModelProvider, type ModelSettings, type PlanPart, type RunErrorEvent, type RunFinishedEvent, type RunStartedEvent, type TextMessageContentEvent, type TextMessageEndEvent, type TextMessageStartEvent, type TextPart, type Thread, type ToolCall, type ToolCallArgsEvent, type ToolCallEndEvent, type ToolCallPart, type ToolCallResultEvent, type ToolCallStartEvent, type ToolCallState, type ToolHandler, type ToolResponse, type ToolResult, type ToolResultPart, convertA2AMessageToDistri, convertA2APartToDistri, convertDistriMessageToA2A, convertDistriPartToA2A, extractTextFromDistriMessage, extractToolCallsFromDistriMessage, extractToolResultsFromDistriMessage, isDistriEvent, isDistriMessage };
