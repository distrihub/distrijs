export interface Agent {
    id: string;
    name: string;
    description: string;
    status: 'online' | 'offline';
}
export interface Thread {
    id: string;
    title: string;
    agent_id: string;
    agent_name: string;
    updated_at: string;
    message_count: number;
    last_message?: string;
}
export interface ChatProps {
    thread: Thread;
    agent: Agent;
    onThreadUpdate?: () => void;
}
/**
 * Connection Status
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
/**
 * Distri Client Configuration
 */
export interface DistriClientConfig {
    baseUrl: string;
    apiVersion?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    debug?: boolean;
    headers?: Record<string, string>;
}
/**
 * Error Types
 */
export declare class DistriError extends Error {
    code: string;
    details?: any;
    constructor(message: string, code: string, details?: any);
}
export declare class A2AProtocolError extends DistriError {
    constructor(message: string, details?: any);
}
export declare class ApiError extends DistriError {
    statusCode: number;
    constructor(message: string, statusCode: number, details?: any);
}
export declare class ConnectionError extends DistriError {
    constructor(message: string, details?: any);
}
