// Distri Framework Types - Based on A2A Protocol and SSE

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
 * Task Creation Request
 */
export interface CreateTaskRequest {
  agentId: string;
  message: any; // A2AMessage from @a2a-js/sdk
  configuration?: any; // MessageSendParams['configuration']
}

/**
 * Distri Event Types for Server-Sent Events
 */
export interface DistriEvent {
  type: string;
  data: any;
  timestamp?: number;
}

export interface TextDeltaEvent extends DistriEvent {
  type: 'text_delta';
  data: {
    task_id: string;
    delta: string;
  };
  task_id: string;
  delta: string;
}

export interface TaskStatusChangedEvent extends DistriEvent {
  type: 'task_status_changed';
  data: {
    task_id: string;
    status: string;
  };
  task_id: string;
  status: string;
}

export interface TaskCompletedEvent extends DistriEvent {
  type: 'task_completed';
  data: {
    task_id: string;
    result: any;
  };
  task_id: string;
  result: any;
}

export interface TaskErrorEvent extends DistriEvent {
  type: 'task_error';
  data: {
    task_id: string;
    error: string;
  };
  task_id: string;
  error: string;
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
