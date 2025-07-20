import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import { DistriClientConfig, DistriClient, DistriAgent, Message, MessageSendParams, DistriThread, ExternalToolHandler, ApprovalHandler, Agent, InvokeConfig, InvokeResult, InvokeStreamResult } from '@distri/core';
export { APPROVAL_REQUEST_TOOL_NAME, Agent, AgentCard, ApprovalHandler, ApprovalMode, DistriAgent, DistriClient, DistriClientConfig, DistriThread, ExternalTool, ExternalToolHandler, InvokeConfig, InvokeResult, InvokeStreamResult, Message, MessageMetadata, MessageSendParams, Task, TaskStatus, ToolCall } from '@distri/core';

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

interface UseAgentOptions {
    agentId: string;
    autoCreateAgent?: boolean;
    defaultExternalToolHandlers?: Record<string, ExternalToolHandler>;
    defaultApprovalHandler?: ApprovalHandler;
}
interface UseAgentResult {
    agent: Agent | null;
    loading: boolean;
    error: Error | null;
    invoke: (input: string, config?: InvokeConfig) => Promise<InvokeResult | InvokeStreamResult>;
    invokeWithHandlers: (input: string, handlers?: Record<string, ExternalToolHandler>, approvalHandler?: ApprovalHandler, config?: Omit<InvokeConfig, 'externalToolHandlers' | 'approvalHandler'>) => Promise<InvokeResult>;
}
/**
 * React hook for working with a specific agent
 */
declare function useAgent({ agentId, autoCreateAgent, defaultExternalToolHandlers, defaultApprovalHandler }: UseAgentOptions): UseAgentResult;
/**
 * Built-in external tool handlers
 */
declare const createBuiltinToolHandlers: () => Record<string, ExternalToolHandler>;
/**
 * Built-in approval handler with confirm dialog
 */
declare const createBuiltinApprovalHandler: () => ApprovalHandler;

export { DistriProvider, type UseAgentOptions, type UseAgentResult, type UseAgentsResult, type UseChatOptions, type UseChatResult, createBuiltinApprovalHandler, createBuiltinToolHandlers, useAgent, useAgents, useChat, useDistri, useDistriClient, useThreads };
