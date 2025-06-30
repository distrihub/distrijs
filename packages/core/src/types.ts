// Distri Framework Types - Based on A2A Protocol and SSE

import { TaskStatus } from "@a2a-js/sdk";
/**
 * JSON-RPC Request for A2A Protocol
 */
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id: string | number;
}

/**
 * JSON-RPC Response
 */
export interface JsonRpcResponse<T = any> {
  jsonrpc: "2.0";
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number;
}

/**
 * Message Parts for A2A Protocol
 */
export type MessagePart =
  | { kind: "text"; text: string }
  | { kind: "image"; image: string; mimeType?: string }
  | { kind: "file"; file: string; mimeType?: string };

/**
 * A2A Message Structure
 */
export interface A2AMessage {
  messageId: string;
  role: "user" | "assistant" | "system";
  parts: MessagePart[];
  contextId?: string;
  timestamp?: number;
}

/**
 * Message Send Parameters
 */
export interface MessageSendParams {
  message: A2AMessage;
  configuration?: {
    acceptedOutputModes?: string[];
    blocking?: boolean;
    maxTokens?: number;
    temperature?: number;
    [key: string]: any;
  };
}

/**
 * Message Send Streaming Parameters
 */
export interface MessageSendStreamingParams extends MessageSendParams {
  streamingConfiguration?: {
    chunkSize?: number;
    flushInterval?: number;
  };
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
 * Task Creation Request
 */
export interface CreateTaskRequest {
  agentId: string;
  message: A2AMessage;
  configuration?: MessageSendParams['configuration'];
}

/**
 * Task Creation Response
 */
export interface CreateTaskResponse {
  taskId: string;
  status: TaskStatus;
}

/**
 * Error Types
 */
export class DistriError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DistriError';
  }
}

export class A2AProtocolError extends DistriError {
  constructor(message: string, details?: any) {
    super(message, 'A2A_PROTOCOL_ERROR', details);
    this.name = 'A2AProtocolError';
  }
}

export class ApiError extends DistriError {
  constructor(message: string, public statusCode: number, details?: any) {
    super(message, 'API_ERROR', details);
    this.name = 'ApiError';
  }
}

export class ConnectionError extends DistriError {
  constructor(message: string, details?: any) {
    super(message, 'CONNECTION_ERROR', details);
    this.name = 'ConnectionError';
  }
}
