import * as react_jsx_runtime from 'react/jsx-runtime';
import React$1, { ReactNode } from 'react';
import { DistriClient, DistriClientConfig, AgentDefinition, Agent as Agent$1, DistriFnTool, DistriBaseTool, ToolCall, ToolResult, DistriEvent, DistriMessage, DistriArtifact, DistriPart, DistriThread, DistriStreamEvent } from '@distri/core';
import * as zustand from 'zustand';

interface DistriContextValue {
    client: DistriClient | null;
    error: Error | null;
    isLoading: boolean;
}
interface DistriProviderProps {
    config: DistriClientConfig;
    children: ReactNode;
    defaultTheme?: 'dark' | 'light' | 'system';
}
declare function DistriProvider({ config, children, defaultTheme }: DistriProviderProps): react_jsx_runtime.JSX.Element;
declare function useDistri(): DistriContextValue;

interface UseAgentOptions {
    agentIdOrDef: string | AgentDefinition;
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
declare function useAgent({ agentIdOrDef, }: UseAgentOptions): UseAgentResult;

interface UseAgentsResult {
    agents: AgentDefinition[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    getAgent: (agentId: string) => Promise<AgentDefinition>;
}
declare function useAgentDefinitions(): UseAgentsResult;

type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
interface ToolCallState$1 {
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
    toolCallState?: ToolCallState$1;
    completeTool: (result: ToolResult) => void;
};

interface UseToolCallStateOptions {
    onAllToolsCompleted?: (toolResults: ToolResult[]) => void;
    tools?: DistriAnyTool[];
    agent?: Agent$1;
}
interface UseToolCallStateReturn {
    toolCallStates: Map<string, ToolCallState$1>;
    initToolCall: (toolCall: ToolCall) => void;
    updateToolCallStatus: (toolCallId: string, updates: Partial<ToolCallState$1>) => void;
    getToolCallState: (toolCallId: string) => ToolCallState$1 | undefined;
    hasPendingToolCalls: () => boolean;
    getPendingToolCalls: () => ToolCallState$1[];
    clearAll: () => void;
    clearToolResults: () => void;
}
declare function useToolCallState(options: UseToolCallStateOptions): UseToolCallStateReturn;

interface TaskState {
    id: string;
    runId?: string;
    planId?: string;
    title: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
    toolCalls?: any[];
    results?: any[];
    error?: string;
    metadata?: any;
}
interface PlanState {
    id: string;
    runId?: string;
    steps: string[];
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
}
interface ToolCallState {
    tool_call_id: string;
    tool_name: string;
    input: any;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
    startTime?: number;
    endTime?: number;
}
interface ChatState {
    tasks: Map<string, TaskState>;
    plans: Map<string, PlanState>;
    toolCalls: Map<string, ToolCallState>;
    currentTaskId?: string;
    currentPlanId?: string;
}
interface ChatStateStore extends ChatState {
    processMessage: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
    clearAllStates: () => void;
    clearTask: (taskId: string) => void;
    initToolCall: (toolCall: any, timestamp?: number) => void;
    updateToolCallStatus: (toolCallId: string, status: Partial<ToolCallState>) => void;
    getToolCallById: (toolCallId: string) => ToolCallState | null;
    getPendingToolCalls: () => ToolCallState[];
    getCompletedToolCalls: () => ToolCallState[];
    getCurrentTask: () => TaskState | null;
    getCurrentPlan: () => PlanState | null;
    getCurrentTasks: () => TaskState[];
    getTaskById: (taskId: string) => TaskState | null;
    getPlanById: (planId: string) => PlanState | null;
    updateTask: (taskId: string, updates: Partial<TaskState>) => void;
    updatePlan: (planId: string, updates: Partial<PlanState>) => void;
}
declare const useChatStateStore: zustand.UseBoundStore<zustand.StoreApi<ChatStateStore>>;

interface UseChatOptions {
    threadId: string;
    agent?: Agent$1;
    onMessage?: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
    onError?: (error: Error) => void;
    getMetadata?: () => Promise<any>;
    onMessagesUpdate?: () => void;
    tools?: DistriAnyTool[];
}
interface UseChatReturn {
    messages: (DistriEvent | DistriMessage | DistriArtifact)[];
    isStreaming: boolean;
    sendMessage: (content: string | DistriPart[]) => Promise<void>;
    sendMessageStream: (content: string | DistriPart[]) => Promise<void>;
    isLoading: boolean;
    error: Error | null;
    clearMessages: () => void;
    agent: Agent$1 | undefined;
    toolCallStates: Map<string, ToolCallState$1>;
    hasPendingToolCalls: () => boolean;
    stopStreaming: () => void;
    chatState: ReturnType<typeof useChatStateStore.getState>;
    toolStateHandler: ReturnType<typeof useToolCallState>;
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

interface ChatProps {
    threadId: string;
    agent?: any;
    onMessage?: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
    onError?: (error: Error) => void;
    getMetadata?: () => Promise<any>;
    onMessagesUpdate?: () => void;
    tools?: any[];
    TaskRenderer?: React$1.ComponentType<any>;
    ArtifactRenderer?: React$1.ComponentType<any>;
    PlanRenderer?: React$1.ComponentType<any>;
    MessageRenderer?: React$1.ComponentType<any>;
    ToolCallRenderer?: React$1.ComponentType<any>;
    onToolResult?: (toolCallId: string, result: any) => void;
    theme?: 'light' | 'dark' | 'auto';
}
declare function Chat({ threadId, agent, onMessage, onError, getMetadata, onMessagesUpdate, tools, TaskRenderer: CustomTaskRenderer, ArtifactRenderer: CustomArtifactRenderer, PlanRenderer: CustomPlanRenderer, MessageRenderer: CustomMessageRenderer, ToolCallRenderer: CustomToolCallRenderer, onToolResult, theme, }: ChatProps): react_jsx_runtime.JSX.Element;

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
    toolCallStates: ToolCallState$1[];
    timestamp?: Date;
    isStreaming?: boolean;
    ToolResultRenderer?: React$1.ComponentType<any>;
    onToolResult?: (toolCallId: string, result: any) => void;
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

export { AgentSelect, ApprovalToolCall, AssistantMessage, AssistantWithToolCalls, Chat, ChatInput, type ChatProps, DebugMessage, type DistriAnyTool, DistriProvider, PlanMessage, ThemeProvider, ThemeToggle, ToastToolCall, UserMessage, extractTextFromMessage, registerTools, shouldDisplayMessage, useAgent, useAgentDefinitions, useChat, useDistri, useTheme, useThreads, useToolCallState };
