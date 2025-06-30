import { EventEmitter } from 'eventemitter3';
import { DistriClientConfig, AgentCard, Task, A2AMessage, MessageSendParams, CreateTaskRequest, CreateTaskResponse, JsonRpcResponse } from './types';
/**
 * Main Distri Client for interacting with Distri server
 * Uses HTTP API with JSON-RPC and Server-Sent Events
 */
export declare class DistriClient extends EventEmitter {
    private config;
    private eventSources;
    private requestIdCounter;
    constructor(config: DistriClientConfig);
    /**
     * Get all available agents
     */
    getAgents(): Promise<AgentCard[]>;
    /**
     * Get specific agent card
     */
    getAgent(agentId: string): Promise<AgentCard>;
    /**
     * Send a message to an agent using JSON-RPC
     */
    sendMessage(agentId: string, params: MessageSendParams): Promise<JsonRpcResponse>;
    /**
     * Send a streaming message to an agent
     */
    sendStreamingMessage(agentId: string, params: MessageSendParams): Promise<JsonRpcResponse>;
    /**
     * Create a task (convenience method)
     */
    createTask(request: CreateTaskRequest): Promise<CreateTaskResponse>;
    /**
     * Get task details
     */
    getTask(taskId: string): Promise<Task>;
    /**
     * Cancel a task
     */
    cancelTask(_taskId: string): Promise<void>;
    /**
     * Subscribe to agent events via Server-Sent Events
     */
    subscribeToAgent(agentId: string): EventSource;
    /**
     * Subscribe to task events
     */
    subscribeToTask(taskId: string): void;
    /**
     * Unsubscribe from agent events
     */
    unsubscribeFromAgent(agentId: string): void;
    /**
     * Close all connections
     */
    disconnect(): void;
    /**
     * Send a JSON-RPC request to an agent
     */
    private sendJsonRpcRequest;
    /**
     * Handle incoming SSE events
     */
    private handleEvent;
    /**
     * Enhanced fetch with retry logic
     */
    private fetch;
    /**
     * Generate unique request ID
     */
    private generateRequestId;
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
    static createMessage(messageId: string, text: string, role?: 'user' | 'assistant' | 'system', contextId?: string): A2AMessage;
    /**
     * Helper method to create message send parameters
     */
    static createMessageParams(message: A2AMessage, configuration?: MessageSendParams['configuration']): MessageSendParams;
}
