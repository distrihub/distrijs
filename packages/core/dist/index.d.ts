export * from '@a2a-js/sdk';

export interface DistriClientConfig {
  baseUrl: string;
  apiVersion?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  debug?: boolean;
  headers?: Record<string, string>;
}

export interface DistriAgent {
  id: string;
  name: string;
  description: string;
  status: 'online' | 'offline';
  card: any;
}

export interface DistriThread {
  id: string;
  title: string;
  agent_id: string;
  agent_name: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
}

export class DistriClient {
  constructor(config: DistriClientConfig);
  getAgents(): Promise<DistriAgent[]>;
  getAgent(agentId: string): Promise<DistriAgent>;
  sendMessage(agentId: string, params: any): Promise<any>;
  sendMessageStream(agentId: string, params: any): AsyncIterable<any>;
  getTask(agentId: string, taskId: string): Promise<any>;
  cancelTask(agentId: string, taskId: string): Promise<void>;
  getThreads(): Promise<DistriThread[]>;
  getThreadMessages(threadId: string): Promise<any[]>;
  disconnect(): void;
  get baseUrl(): string;
  static createMessage(messageId: string, text: string, role?: 'user' | 'agent', contextId?: string, taskId?: string): any;
  static createMessageParams(message: any, configuration?: any): any;
}

export class DistriError extends Error {
  constructor(message: string, code: string, details?: any);
}

export class A2AProtocolError extends DistriError {
  constructor(message: string, details?: any);
}

export class ApiError extends DistriError {
  constructor(message: string, statusCode: number, details?: any);
}