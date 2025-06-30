import { EventEmitter } from 'eventemitter3';
import { AgentCard, Message, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, JSONRPCResponse, MessageSendParams, Task, TaskState } from '@a2a-js/sdk';
import { DistriClientConfig } from './types';
export interface TextDeltaEvent {
    type: 'text_delta';
    task_id: string;
    delta: string;
    timestamp: number;
}
export interface TaskStatusChangedEvent {
    type: 'task_status_changed';
    task_id: string;
    status: TaskState;
    timestamp: number;
}
export interface TaskCompletedEvent {
    type: 'task_completed';
    task_id: string;
    timestamp: number;
}
export interface TaskErrorEvent {
    type: 'task_error';
    task_id: string;
    error: string;
    timestamp: number;
}
export interface TaskCanceledEvent {
    type: 'task_canceled';
    task_id: string;
    timestamp: number;
}
export interface AgentStatusChangedEvent {
    type: 'agent_status_changed';
    agent_id: string;
    status: string;
    timestamp: number;
}
export type DistriEvent = TextDeltaEvent | TaskStatusChangedEvent | TaskCompletedEvent | TaskErrorEvent | TaskCanceledEvent | AgentStatusChangedEvent | TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
export declare function decodeSSEEvent(data: string): DistriEvent | null;
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
    createTask(agentId: string, message: Message): Promise<Task>;
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
    static createMessage(messageId: string, text: string, role?: 'agent' | 'user', contextId?: string): Message;
    /**
     * Helper method to create message send parameters
     */
    static createMessageParams(message: Message, configuration?: MessageSendParams['configuration']): MessageSendParams;
}
