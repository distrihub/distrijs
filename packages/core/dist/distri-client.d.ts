import { EventEmitter } from 'eventemitter3';
import { AgentCard, Message, JSONRPCResponse, MessageSendParams, Task } from '@a2a-js/sdk';
import { DistriClientConfig, CreateTaskRequest } from './types';
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
    sendMessage(agentId: string, params: MessageSendParams): Promise<JSONRPCResponse>;
    /**
     * Send a streaming message to an agent
     */
    sendStreamingMessage(agentId: string, params: MessageSendParams): Promise<JSONRPCResponse>;
    /**
     * Create a task (convenience method)
     */
    createTask(request: CreateTaskRequest): Promise<{
        taskId: string;
    }>;
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
     * Handle incoming SSE events
     */
    private handleEvent;
    /**
     * Send a JSON-RPC request to an agent
     */
    private sendJsonRpcRequest;
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
    static createMessage(messageId: string, text: string, role?: 'agent' | 'user', contextId?: string): Message;
    /**
     * Helper method to create message send parameters
     */
    static createMessageParams(message: Message, configuration?: MessageSendParams['configuration']): MessageSendParams;
}
