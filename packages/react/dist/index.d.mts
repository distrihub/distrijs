import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import { DistriClientConfig, DistriClient, DistriAgent, Message, MessageSendParams, DistriThread } from '@distri/core';
export { AgentCard, DistriAgent, DistriClientConfig, DistriThread, Message, MessageSendParams, Task, TaskStatus } from '@distri/core';

interface DistriContextValue {
    client: DistriClient | null;
    error: Error | null;
    isLoading: boolean;
}
interface DistriProviderProps {
    config: DistriClientConfig;
    children: ReactNode;
}
declare function DistriProvider({ config, children }: DistriProviderProps): react_jsx_runtime.JSX.Element;
declare function useDistri(): DistriContextValue;
declare function useDistriClient(): DistriClient;

interface UseAgentsResult {
    agents: DistriAgent[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    getAgent: (agentId: string) => Promise<DistriAgent>;
}
declare function useAgents(): UseAgentsResult;

interface UseChatOptions {
    agentId: string;
    contextId?: string;
}
interface UseChatResult {
    loading: boolean;
    error: Error | null;
    messages: Message[];
    isStreaming: boolean;
    sendMessage: (text: string, configuration?: MessageSendParams['configuration']) => Promise<void>;
    sendMessageStream: (text: string, configuration?: MessageSendParams['configuration']) => Promise<void>;
    clearMessages: () => void;
    refreshMessages: () => Promise<void>;
    abort: () => void;
}
declare function useChat({ agentId, contextId }: UseChatOptions): UseChatResult;

interface UseThreadsResult {
    threads: DistriThread[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    deleteThread: (threadId: string) => Promise<void>;
    fetchThread: (threadId: string) => Promise<DistriThread>;
    updateThread: (threadId: string, localId?: string) => Promise<void>;
}
declare function useThreads(): UseThreadsResult;

export { DistriProvider, type UseAgentsResult, type UseChatOptions, type UseChatResult, useAgents, useChat, useDistri, useDistriClient, useThreads };
