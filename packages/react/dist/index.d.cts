import * as react_jsx_runtime from 'react/jsx-runtime';
import React$1, { ReactNode } from 'react';
import { DistriClientConfig, Agent as Agent$1, DistriAgent, DistriFnTool, DistriBaseTool, ToolCall, ToolResult, DistriStreamEvent, DistriMessage, DistriEvent, DistriPart, DistriThread } from '@distri/core';

interface DistriProviderProps {
    config: DistriClientConfig;
    children: ReactNode;
    defaultTheme?: 'dark' | 'light' | 'system';
}
declare function DistriProvider({ config, children, defaultTheme }: DistriProviderProps): react_jsx_runtime.JSX.Element;

interface UseAgentOptions {
    agentId: string;
    agent?: Agent$1;
    autoCreateAgent?: boolean;
}
interface UseAgentResult {
    agent: Agent$1 | null;
    loading: boolean;
    error: Error | null;
}
/**
 * useAgent is for agent configuration and invocation.
 * For chat UIs, use useChat instead.
 */
declare function useAgent({ agentId, autoCreateAgent, }: UseAgentOptions): UseAgentResult;

interface UseAgentsResult {
    agents: DistriAgent[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    getAgent: (agentId: string) => Promise<DistriAgent>;
}
declare function useAgents(): UseAgentsResult;

type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
interface ToolCallState {
    tool_call_id: string;
    status: ToolCallStatus;
    tool_name: string;
    input: any;
    result?: any;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
    component?: React.ReactNode;
}
type DistriAnyTool = DistriFnTool | DistriUiTool;
interface DistriUiTool extends DistriBaseTool {
    type: 'ui';
    component: (props: UiToolProps) => React.ReactNode;
}
type UiToolProps = {
    toolCall: ToolCall;
    toolCallState?: ToolCallState;
    completeTool: (result: ToolResult) => void;
};

interface UseChatOptions {
    threadId: string;
    agent?: Agent$1;
    onMessage?: (message: DistriStreamEvent) => void;
    onError?: (error: Error) => void;
    getMetadata?: () => Promise<any>;
    onMessagesUpdate?: () => void;
    tools?: DistriAnyTool[];
}
interface UseChatReturn {
    messages: (DistriMessage | DistriEvent)[];
    executionEvents: DistriEvent[];
    isLoading: boolean;
    isStreaming: boolean;
    error: Error | null;
    sendMessage: (content: string | DistriPart[]) => Promise<void>;
    sendMessageStream: (content: string | DistriPart[], role?: 'user' | 'tool') => Promise<void>;
    toolCallStates: Map<string, ToolCallState>;
    clearMessages: () => void;
    stopStreaming: () => void;
}
declare function useChat({ threadId, onMessage, onError, getMetadata, onMessagesUpdate, agent, tools, }: UseChatOptions): UseChatReturn;

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

interface UseToolsOptions {
    agent?: Agent$1;
    tools?: DistriAnyTool[];
}
declare function registerTools({ agent, tools }: UseToolsOptions): void;

interface UseToolCallStateOptions {
    onAllToolsCompleted?: (toolResults: ToolResult[]) => void;
    agent?: Agent$1;
}
interface UseToolCallStateReturn {
    toolCallStates: Map<string, ToolCallState>;
    initToolCall: (toolCall: ToolCall) => void;
    updateToolCallStatus: (toolCallId: string, updates: Partial<ToolCallState>) => void;
    getToolCallState: (toolCallId: string) => ToolCallState | undefined;
    hasPendingToolCalls: () => boolean;
    getPendingToolCalls: () => ToolCallState[];
    clearAll: () => void;
    clearToolResults: () => void;
}
declare function useToolCallState(options: UseToolCallStateOptions): UseToolCallStateReturn;

interface EmbeddableChatProps {
    agent: Agent$1;
    threadId?: string;
    height?: string;
    className?: string;
    style?: React$1.CSSProperties;
    getMetadata?: () => Promise<any>;
    tools?: DistriAnyTool[];
    availableAgents?: Array<{
        id: string;
        name: string;
        description?: string;
    }>;
    UserMessageComponent?: React$1.ComponentType<any>;
    AssistantMessageComponent?: React$1.ComponentType<any>;
    AssistantWithToolCallsComponent?: React$1.ComponentType<any>;
    PlanMessageComponent?: React$1.ComponentType<any>;
    theme?: 'light' | 'dark' | 'auto';
    showDebug?: boolean;
    showAgentSelector?: boolean;
    placeholder?: string;
    disableAgentSelection?: boolean;
    onAgentSelect?: (agentId: string) => void;
    onResponse?: (message: any) => void;
    onMessagesUpdate?: () => void;
}
declare const EmbeddableChat: React$1.FC<EmbeddableChatProps>;

interface FullChatProps {
    agent: Agent$1;
    threadId: string;
    className?: string;
    style?: React$1.CSSProperties;
    getMetadata?: () => any;
    tools?: DistriAnyTool[];
    availableAgents?: Agent$1[];
    UserMessageComponent?: React$1.ComponentType<any>;
    AssistantMessageComponent?: React$1.ComponentType<any>;
    AssistantWithToolCallsComponent?: React$1.ComponentType<any>;
    PlanMessageComponent?: React$1.ComponentType<any>;
    theme?: 'light' | 'dark' | 'auto';
    showDebug?: boolean;
    showAgentSelector?: boolean;
    placeholder?: string;
    disableAgentSelection?: boolean;
    onAgentSelect?: (agentId: string) => void;
    onResponse?: (message: DistriMessage) => void;
    onMessagesUpdate?: () => void;
}
declare const FullChat: React$1.FC<FullChatProps>;

interface ExecutionStep {
    id: string;
    index: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    started_at?: string;
    completed_at?: string;
    success?: boolean;
}
interface ExecutionStepsProps {
    steps: ExecutionStep[];
    currentStepId?: string;
    isPlanning?: boolean;
    planDescription?: string;
    className?: string;
}
declare const ExecutionSteps: React$1.FC<ExecutionStepsProps>;
interface ExecutionTrackerProps {
    events: DistriEvent[];
    className?: string;
}
declare const ExecutionTracker: React$1.FC<ExecutionTrackerProps>;

interface Agent {
    id: string;
    name: string;
    description?: string;
}
interface AgentSelectProps {
    agents: Agent[];
    selectedAgentId?: string;
    onAgentSelect: (agentId: string) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}
declare const AgentSelect: React$1.FC<AgentSelectProps>;

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onStop?: () => void;
    placeholder?: string;
    disabled?: boolean;
    isStreaming?: boolean;
    className?: string;
}
declare const ChatInput: React$1.FC<ChatInputProps>;

type Theme = 'dark' | 'light' | 'system';
interface ThemeProviderProps {
    children: React$1.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}
interface ThemeProviderState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}
declare function ThemeProvider({ children, defaultTheme, storageKey, ...props }: ThemeProviderProps): react_jsx_runtime.JSX.Element;
declare const useTheme: () => ThemeProviderState;

declare function ThemeToggle(): react_jsx_runtime.JSX.Element;

interface BaseMessageProps {
    content?: string;
    message?: DistriMessage;
    timestamp?: Date;
    className?: string;
    avatar?: React$1.ReactNode;
    name?: string;
}
interface UserMessageProps extends BaseMessageProps {
    content?: string;
}
interface AssistantMessageProps extends BaseMessageProps {
    content?: string;
    message?: DistriMessage;
    isStreaming?: boolean;
    metadata?: any;
    name?: string;
}
interface AssistantWithToolCallsProps extends BaseMessageProps {
    content?: string;
    message?: DistriMessage;
    toolCallStates: ToolCallState[];
    timestamp?: Date;
    isStreaming?: boolean;
}
interface PlanMessageProps extends BaseMessageProps {
    message?: DistriMessage;
    plan: string;
    timestamp?: Date;
}
interface DebugMessageProps extends BaseMessageProps {
    className?: string;
}
declare const UserMessage: React$1.FC<UserMessageProps>;
declare const AssistantMessage: React$1.FC<AssistantMessageProps>;
declare const AssistantWithToolCalls: React$1.FC<AssistantWithToolCallsProps>;
declare const PlanMessage: React$1.FC<PlanMessageProps>;
declare const DebugMessage: React$1.FC<DebugMessageProps>;

declare const ApprovalToolCall: React$1.FC<UiToolProps>;

declare const ToastToolCall: React$1.FC<UiToolProps>;

/**
 * Utility function to extract text content from message parts
 */
declare const extractTextFromMessage: (message: DistriStreamEvent) => string;
/**
 * Utility function to determine if a message should be displayed
 * Can be used by builders when creating custom chat components
 */
declare const shouldDisplayMessage: (message: DistriStreamEvent, showDebugMessages?: boolean) => boolean;

export { AgentSelect, ApprovalToolCall, AssistantMessage, AssistantWithToolCalls, ChatInput, DebugMessage, type DistriAnyTool, DistriProvider, EmbeddableChat, ExecutionSteps, ExecutionTracker, FullChat, PlanMessage, ThemeProvider, ThemeToggle, ToastToolCall, UserMessage, extractTextFromMessage, registerTools, shouldDisplayMessage, useAgent, useAgents, useChat, useTheme, useThreads, useToolCallState };
