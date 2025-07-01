import { ReactNode } from 'react';

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

export interface DistriProviderProps {
  config: DistriClientConfig;
  children: ReactNode;
}

export function DistriProvider(props: DistriProviderProps): JSX.Element;

export interface UseAgentsResult {
  agents: DistriAgent[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getAgent: (agentId: string) => Promise<DistriAgent>;
}

export function useAgents(): UseAgentsResult;

export interface UseTaskOptions {
  agentId: string;
  autoSubscribe?: boolean;
}

export interface UseTaskResult {
  task: any;
  loading: boolean;
  error: Error | null;
  messages: any[];
  isStreaming: boolean;
  sendMessage: (text: string, configuration?: any) => Promise<void>;
  sendMessageStream: (text: string, configuration?: any) => Promise<void>;
  getTask: (taskId: string) => Promise<void>;
  clearTask: () => void;
  clearMessages: () => void;
}

export function useTask(options: UseTaskOptions): UseTaskResult;

export interface UseThreadsResult {
  threads: DistriThread[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createThread: (agentId: string, title: string) => DistriThread;
  deleteThread: (threadId: string) => Promise<void>;
  updateThread: (threadId: string) => Promise<void>;
}

export function useThreads(): UseThreadsResult;

export interface UseThreadMessagesOptions {
  threadId: string | null;
}

export interface UseThreadMessagesResult {
  messages: any[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useThreadMessages(options: UseThreadMessagesOptions): UseThreadMessagesResult;