import * as react_jsx_runtime from 'react/jsx-runtime';
import React$1, { ReactNode } from 'react';
import { DistriClient, DistriClientConfig, AgentDefinition, Agent as Agent$1, DistriFnTool, DistriBaseTool, ToolCall as ToolCall$1, ToolResult as ToolResult$1, DistriPart as DistriPart$1, DistriThread, DistriMessage as DistriMessage$1, DistriStreamEvent as DistriStreamEvent$1 } from '@distri/core';

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

type Role = 'user' | 'system' | 'assistant';
interface RunStartedEvent {
    type: 'run_started';
    data: {};
}
interface RunFinishedEvent {
    type: 'run_finished';
    data: {};
}
interface RunErrorEvent {
    type: 'run_error';
    data: {
        message: string;
        code?: string;
    };
}
interface TextMessageStartEvent {
    type: 'text_message_start';
    data: {
        message_id: string;
        role: Role;
    };
}
interface TextMessageContentEvent {
    type: 'text_message_content';
    data: {
        message_id: string;
        delta: string;
    };
}
interface TextMessageEndEvent {
    type: 'text_message_end';
    data: {
        message_id: string;
    };
}
interface ToolCallStartEvent {
    type: 'tool_call_start';
    data: {
        tool_call_id: string;
        tool_call_name: string;
        parent_message_id?: string;
        is_external?: boolean;
    };
}
interface ToolCallArgsEvent {
    type: 'tool_call_args';
    data: {
        tool_call_id: string;
        delta: string;
    };
}
interface ToolCallEndEvent {
    type: 'tool_call_end';
    data: {
        tool_call_id: string;
    };
}
interface ToolCallResultEvent {
    type: 'tool_call_result';
    data: {
        tool_call_id: string;
        result: string;
    };
}
interface AgentHandoverEvent {
    type: 'agent_handover';
    data: {
        from_agent: string;
        to_agent: string;
        reason?: string;
    };
}
type DistriEvent = RunStartedEvent | RunFinishedEvent | RunErrorEvent | TextMessageStartEvent | TextMessageContentEvent | TextMessageEndEvent | ToolCallStartEvent | ToolCallArgsEvent | ToolCallEndEvent | ToolCallResultEvent | AgentHandoverEvent;

/**
 * Message roles supported by Distri
 */
type MessageRole = 'system' | 'assistant' | 'user' | 'tool';
/**
 * Distri-specific message structure with parts
 */
interface DistriMessage {
    id: string;
    role: MessageRole;
    parts: DistriPart[];
    created_at?: string;
}
type DistriStreamEvent = DistriMessage | DistriEvent;
/**
 * Distri message parts - equivalent to Rust enum Part
 */
type TextPart = {
    type: 'text';
    text: string;
};
type CodeObservationPart = {
    type: 'code_observation';
    thought: string;
    code: string;
};
type ImageUrlPart = {
    type: 'image_url';
    image: FileUrl;
};
type ImageBytesPart = {
    type: 'image_bytes';
    image: FileBytes;
};
type ImagePart = ImageUrlPart | ImageBytesPart;
type DataPart = {
    type: 'data';
    data: any;
};
type ToolCallPart = {
    type: 'tool_call';
    tool_call: ToolCall;
};
type ToolResultPart = {
    type: 'tool_result';
    tool_result: ToolResult;
};
type PlanPart = {
    type: 'plan';
    plan: string;
};
type DistriPart = TextPart | CodeObservationPart | ImagePart | DataPart | ToolCallPart | ToolResultPart | PlanPart;
/**
 * File type for images
 */
interface FileBytes {
    mime_type: string;
    data: string;
    name?: string;
}
interface FileUrl {
    mime_type: string;
    url: string;
    name?: string;
}
/**
 * Tool call from agent
 */
interface ToolCall {
    tool_call_id: string;
    tool_name: string;
    input: any;
}
/**
 * Tool result for responding to tool calls
 */
interface ToolResult {
    tool_call_id: string;
    result: string | number | boolean | null;
    success: boolean;
    error?: string;
}

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
    toolCall: ToolCall$1;
    toolCallState?: ToolCallState;
    completeTool: (result: ToolResult$1) => void;
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
    messages: DistriStreamEvent[];
    isStreaming: boolean;
    sendMessage: (content: string | DistriPart$1[]) => Promise<void>;
    sendMessageStream: (content: string | DistriPart$1[]) => Promise<void>;
    isLoading: boolean;
    error: Error | null;
    clearMessages: () => void;
    agent: Agent$1 | undefined;
    toolCallStates: Map<string, ToolCallState>;
    hasPendingToolCalls: () => boolean;
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
    onAllToolsCompleted?: (toolResults: ToolResult$1[]) => void;
    agent?: Agent$1;
}
interface UseToolCallStateReturn {
    toolCallStates: Map<string, ToolCallState>;
    initToolCall: (toolCall: ToolCall$1) => void;
    updateToolCallStatus: (toolCallId: string, updates: Partial<ToolCallState>) => void;
    getToolCallState: (toolCallId: string) => ToolCallState | undefined;
    hasPendingToolCalls: () => boolean;
    getPendingToolCalls: () => ToolCallState[];
    clearAll: () => void;
    clearToolResults: () => void;
}
declare function useToolCallState(options: UseToolCallStateOptions): UseToolCallStateReturn;

interface FullChatProps {
    agentId: string;
    agent?: Agent$1;
    getMetadata?: () => Promise<any>;
    className?: string;
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
    onAgentSelect?: (agentId: string) => void;
    onThreadSelect?: (threadId: string) => void;
    onThreadCreate?: (threadId: string) => void;
    onThreadDelete?: (threadId: string) => void;
    onLogoClick?: () => void;
}
declare const FullChat: React$1.FC<FullChatProps>;

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
    message?: DistriMessage$1;
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
    message?: DistriMessage$1;
    isStreaming?: boolean;
    metadata?: any;
    name?: string;
}
interface AssistantWithToolCallsProps extends BaseMessageProps {
    content?: string;
    message?: DistriMessage$1;
    toolCallStates: ToolCallState[];
    timestamp?: Date;
    isStreaming?: boolean;
}
interface PlanMessageProps extends BaseMessageProps {
    message?: DistriMessage$1;
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
declare const extractTextFromMessage: (message: DistriStreamEvent$1) => string;
/**
 * Utility function to determine if a message should be displayed
 * Can be used by builders when creating custom chat components
 */
declare const shouldDisplayMessage: (message: DistriStreamEvent$1, showDebugMessages?: boolean) => boolean;

export { AgentSelect, ApprovalToolCall, AssistantMessage, AssistantWithToolCalls, ChatInput, DebugMessage, type DistriAnyTool, DistriProvider, EmbeddableChat, FullChat, PlanMessage, ThemeProvider, ThemeToggle, ToastToolCall, UserMessage, extractTextFromMessage, registerTools, shouldDisplayMessage, useAgent, useAgentDefinitions, useChat, useDistri, useTheme, useThreads, useToolCallState };
