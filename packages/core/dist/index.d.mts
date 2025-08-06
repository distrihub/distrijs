import { AgentSkill, Message, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, Task, MessageSendParams, Part, Artifact } from '@a2a-js/sdk/client';
export { AgentCard, Message, MessageSendParams, Task, TaskArtifactUpdateEvent, TaskStatus, TaskStatusUpdateEvent } from '@a2a-js/sdk/client';

type Role = 'user' | 'system' | 'assistant';
interface RunStartedEvent {
    type: 'run_started';
    data: {
        runId?: string;
        taskId?: string;
    };
}
interface RunFinishedEvent {
    type: 'run_finished';
    data: {
        runId?: string;
        taskId?: string;
    };
}
interface RunErrorEvent {
    type: 'run_error';
    data: {
        message: string;
        code?: string;
    };
}
interface PlanStartedEvent {
    type: 'plan_started';
    data: {
        initial_plan?: boolean;
    };
}
interface PlanFinishedEvent {
    type: 'plan_finished';
    data: {
        total_steps?: number;
    };
}
interface PlanPrunedEvent {
    type: 'plan_pruned';
    data: {
        removed_steps?: any;
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
interface ToolRejectedEvent {
    type: 'tool_rejected';
    data: {
        reason?: string;
        tool_call_id?: string;
    };
}
interface TaskArtifactEvent {
    type: 'task_artifact';
    data: {
        artifact_id: string;
        artifact_type: string;
        resolution?: any;
        content?: any;
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
interface StepStartedEvent {
    type: 'step_started';
    data: {
        step_id: string;
        step_title: string;
        step_index: number;
    };
}
interface StepCompletedEvent {
    type: 'step_completed';
    data: {
        step_id: string;
        step_title: string;
        step_index: number;
    };
}
interface FeedbackReceivedEvent {
    type: 'feedback_received';
    data: {
        feedback: string;
    };
}
interface ToolCallsEvent {
    type: 'tool_calls';
    data: {
        tool_calls: Array<{
            tool_call_id: string;
            tool_name: string;
            input: any;
        }>;
    };
}
interface ToolResultsEvent {
    type: 'tool_results';
    data: {
        results: Array<{
            tool_call_id: string;
            tool_name: string;
            result: any;
            success?: boolean;
            error?: string;
        }>;
    };
}
type DistriEvent = RunStartedEvent | RunFinishedEvent | RunErrorEvent | PlanStartedEvent | PlanFinishedEvent | PlanPrunedEvent | TextMessageStartEvent | TextMessageContentEvent | TextMessageEndEvent | ToolCallStartEvent | ToolCallArgsEvent | ToolCallEndEvent | ToolCallResultEvent | ToolRejectedEvent | StepStartedEvent | StepCompletedEvent | TaskArtifactEvent | AgentHandoverEvent | FeedbackReceivedEvent | ToolCallsEvent | ToolResultsEvent;

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
interface AssistantWithToolCalls {
    id: string;
    type: 'llm_response';
    timestamp: number;
    content: string;
    tool_calls: any[];
    step_id?: string;
    success: boolean;
    rejected: boolean;
    is_external: boolean;
    reason: string | null;
}
interface ToolResults {
    id: string;
    type: 'tool_results';
    timestamp: number;
    results: any[];
    step_id?: string;
    success: boolean;
    rejected: boolean;
    reason: string | null;
}
interface GenericArtifact {
    id: string;
    type: 'artifact';
    timestamp: number;
    data: any;
    artifactId: string;
    name: string;
    description: string | null;
}
interface DistriPlan {
    id: string;
    type: 'plan';
    timestamp: number;
    reasoning: string;
    steps: PlanStep[];
}
interface BasePlanStep {
    id: string;
}
interface ThoughtPlanStep extends BasePlanStep {
    type: 'thought';
    message: string;
}
interface ActionPlanStep extends BasePlanStep {
    type: 'action';
    action: PlanAction;
}
interface CodePlanStep extends BasePlanStep {
    type: 'code';
    code: string;
    language: string;
}
interface FinalResultPlanStep extends BasePlanStep {
    type: 'final_result';
    content: string;
    tool_calls: any[];
}
interface PlanAction {
    tool_name?: string;
    input?: string;
    prompt?: string;
    context?: any[];
    tool_calling_config?: any;
}
type PlanStep = ThoughtPlanStep | ActionPlanStep | CodePlanStep | FinalResultPlanStep;
interface LlmPlanStep extends BasePlanStep {
    type: 'llm_call';
    prompt: string;
    context: any[];
}
interface BatchToolCallsStep extends BasePlanStep {
    type: 'batch_tool_calls';
    tool_calls: any[];
}
interface ThoughtStep extends BasePlanStep {
    type: 'thought';
    message: string;
}
interface ReactStep extends BasePlanStep {
    type: 'react_step';
    thought: string;
    action: string;
}
type DistriArtifact = AssistantWithToolCalls | ToolResults | GenericArtifact | DistriPlan;
type DistriStreamEvent = DistriMessage | DistriEvent | DistriArtifact;
/**
 * Context required for constructing A2A messages from DistriMessage
 */
interface InvokeContext {
    thread_id: string;
    run_id?: string;
    getMetadata?: () => any;
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
type FileType = FileBytes | FileUrl;
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
    tool_name: string;
    result: string | number | boolean | null;
    success: boolean;
    error?: string;
}
/**
 * Distri-specific Agent type that wraps A2A AgentCard
 */
interface AgentDefinition {
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
    agent: AgentDefinition;
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
declare function isDistriMessage(event: DistriStreamEvent): event is DistriMessage;
declare function isDistriEvent(event: DistriStreamEvent): event is DistriEvent;
declare function isDistriPlan(event: DistriStreamEvent): event is DistriPlan;
declare function isDistriArtifact(event: DistriStreamEvent): event is DistriArtifact;
type DistriChatMessage = DistriEvent | DistriMessage | DistriArtifact;

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
    getAgents(): Promise<AgentDefinition[]>;
    /**
     * Get specific agent by ID
     */
    getAgent(agentId: string): Promise<AgentDefinition>;
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
declare function uuidv4(): string;

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
    constructor(agentDefinition: AgentDefinition, client: DistriClient);
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
    invokeStream(params: MessageSendParams): Promise<AsyncGenerator<DistriChatMessage>>;
    /**
     * Enhance message params with tool definitions
     */
    private enhanceParamsWithTools;
    /**
     * Create an agent instance from an agent ID
     */
    static create(agentIdOrDef: string | AgentDefinition, client: DistriClient): Promise<Agent>;
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
 * Converts A2A status-update events to DistriEvent based on metadata type
 */
declare function convertA2AStatusUpdateToDistri(statusUpdate: any): DistriEvent | null;
/**
 * Converts A2A artifacts to DistriArtifact, DistriPlan, or DistriMessage based on content
 */
declare function convertA2AArtifactToDistri(artifact: Artifact): DistriArtifact | DistriMessage | null;
/**
 * Enhanced decoder for A2A stream events that properly handles all event types
 */
declare function decodeA2AStreamEvent(event: any): DistriChatMessage | null;
/**
 * Process A2A stream data (like from stream.json) and convert to DistriMessage/DistriEvent/DistriArtifact array
 */
declare function processA2AStreamData(streamData: any[]): (DistriMessage | DistriEvent | DistriArtifact)[];
/**
 * Process A2A messages.json data and convert to DistriMessage array
 */
declare function processA2AMessagesData(data: any[]): DistriMessage[];
/**
 * Converts an A2A Part to a DistriPart
 */
declare function convertA2APartToDistri(a2aPart: Part): DistriPart;
/**
 * Converts a DistriMessage to an A2A Message using the provided context
 */
declare function convertDistriMessageToA2A(distriMessage: DistriMessage, context: InvokeContext): Message;
/**
 * Converts a DistriPart to an A2A Part
 */
declare function convertDistriPartToA2A(distriPart: DistriPart): Part;
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

export { A2AProtocolError, type A2AStreamEventData, type ActionPlanStep, Agent, type AgentDefinition, type AgentHandoverEvent, ApiError, type AssistantWithToolCalls, type BasePlanStep, type BatchToolCallsStep, type ChatProps, type CodeObservationPart, type CodePlanStep, ConnectionError, type ConnectionStatus, type DataPart, type DistriArtifact, type DistriBaseTool, type DistriChatMessage, DistriClient, type DistriClientConfig, DistriError, type DistriEvent, type DistriFnTool, type DistriMessage, type DistriPart, type DistriPlan, type DistriStreamEvent, type DistriThread, type FeedbackReceivedEvent, type FileBytes, type FileType, type FileUrl, type FinalResultPlanStep, type GenericArtifact, type ImageBytesPart, type ImagePart, type ImageUrlPart, type InvokeConfig, type InvokeContext, type InvokeResult, type LlmPlanStep, type McpDefinition, type McpServerType, type MessageRole, type ModelProvider, type ModelSettings, type PlanAction, type PlanFinishedEvent, type PlanPart, type PlanPrunedEvent, type PlanStartedEvent, type PlanStep, type ReactStep, type Role, type RunErrorEvent, type RunFinishedEvent, type RunStartedEvent, type StepCompletedEvent, type StepStartedEvent, type TaskArtifactEvent, type TextMessageContentEvent, type TextMessageEndEvent, type TextMessageStartEvent, type TextPart, type ThoughtPlanStep, type ThoughtStep, type Thread, type ToolCall, type ToolCallArgsEvent, type ToolCallEndEvent, type ToolCallPart, type ToolCallResultEvent, type ToolCallStartEvent, type ToolCallsEvent, type ToolHandler, type ToolRejectedEvent, type ToolResult, type ToolResultPart, type ToolResults, type ToolResultsEvent, convertA2AArtifactToDistri, convertA2AMessageToDistri, convertA2APartToDistri, convertA2AStatusUpdateToDistri, convertDistriMessageToA2A, convertDistriPartToA2A, decodeA2AStreamEvent, extractTextFromDistriMessage, extractToolCallsFromDistriMessage, extractToolResultsFromDistriMessage, isDistriArtifact, isDistriEvent, isDistriMessage, isDistriPlan, processA2AMessagesData, processA2AStreamData, uuidv4 };
