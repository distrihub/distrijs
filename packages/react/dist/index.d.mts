import { Agent, DistriAgent, ToolHandler, Message, MessageMetadata, DistriThread, ToolCall, ToolCallState as ToolCallState$1, ToolResult, DistriClientConfig, DistriClient } from '@distri/core';
export { DistriAgent, DistriThread, Message, MessageMetadata, ToolCall, ToolCallState, ToolHandler, ToolResult } from '@distri/core';
import { Part } from '@a2a-js/sdk/client';
import React, { ReactNode } from 'react';
import * as react_jsx_runtime from 'react/jsx-runtime';

interface UseAgentOptions {
    agentId: string;
    autoCreateAgent?: boolean;
}
interface UseAgentResult {
    agent: Agent | null;
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

interface ToolCallState {
    tool_call_id: string;
    tool_name: string;
    status: 'running' | 'completed' | 'error';
    input: string;
    result: any;
    error: string | null;
}
interface ToolHandlerResult {
    tool_call_id: string;
    result: any;
    success: boolean;
    error: string | null;
}

interface UseChatOptions {
    agentId: string;
    threadId: string;
    agent?: Agent;
    tools?: Record<string, ToolHandler>;
    metadata?: any;
}
interface UseChatResult {
    messages: Message[];
    loading: boolean;
    error: Error | null;
    isStreaming: boolean;
    sendMessage: (input: string | Part[], metadata?: MessageMetadata) => Promise<void>;
    sendMessageStream: (input: string | Part[], metadata?: MessageMetadata) => Promise<void>;
    refreshMessages: () => Promise<void>;
    clearMessages: () => void;
    agent: Agent | null;
    toolCallStatus: Record<string, ToolCallState>;
    toolHandlerResults: Record<string, ToolHandlerResult>;
    cancelToolExecution: () => void;
}
/**
 * useChat is the main hook for chat UIs.
 * It handles all chat logic internally and can optionally accept a pre-configured agent.
 * For advanced agent configuration, use useAgent and pass the agent to useChat.
 *
 * sendParams: MessageSendParams configuration (auth, output modes, etc.)
 * {
 *   configuration: {
 *     acceptedOutputModes: ['text/plain'],
 *     blocking: false
 *   },
 *   // Executor Metadata (https://github.com/distrihub/distri/blob/main/distri/src/agent/types.rs#L97)
 *   metadata: {
 *     tools: {
 *       tool1: { .. },
 *       tool2: { ... }
 *     }
 *   }
 * }
 *
 * contextMetadata: MessageMetadata for tool responses and content
 * {
 *   type: 'tool_response',
 *   tool_call_id: '...',
 *   result: '...'
 * }
 */
declare function useChat({ agentId, threadId, agent: providedAgent, tools, metadata, }: UseChatOptions): UseChatResult;

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

interface ChatProps {
    agentId: string;
    threadId: string;
    agent?: Agent;
    tools?: Record<string, any>;
    metadata?: any;
    height?: string;
    onThreadUpdate?: (threadId: string) => void;
    className?: string;
}
declare const Chat: React.FC<ChatProps>;

interface BaseMessageProps {
    content?: string;
    timestamp?: Date;
    className?: string;
    avatar?: React.ReactNode;
}
interface UserMessageProps extends BaseMessageProps {
    content: string;
}
interface AssistantMessageProps extends BaseMessageProps {
    content: string;
    isStreaming?: boolean;
    metadata?: any;
}
interface ToolCallProps {
    toolCall: ToolCall | ToolCallState$1;
    status?: 'pending' | 'running' | 'completed' | 'error';
    result?: any;
    error?: string;
}
interface AssistantWithToolCallsProps extends AssistantMessageProps {
    toolCalls: ToolCallProps[];
}
declare const MessageContainer: React.FC<{
    children: React.ReactNode;
    align: 'left' | 'right' | 'center';
    className?: string;
}>;
declare const UserMessage: React.FC<UserMessageProps>;
declare const AssistantMessage: React.FC<AssistantMessageProps>;
declare const Tool: React.FC<ToolCallProps>;
declare const AssistantWithToolCalls: React.FC<AssistantWithToolCallsProps>;

interface MessageRendererProps {
    content: string;
    className?: string;
    metadata?: any;
}
declare const MessageRenderer: React.FC<MessageRendererProps>;

interface ExternalToolManagerProps {
    toolCalls: ToolCall[];
    onToolComplete: (results: ToolResult[]) => void;
    onCancel: () => void;
}
declare const ExternalToolManager: React.FC<ExternalToolManagerProps>;

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onClose?: () => void;
}
declare const Toast: React.FC<ToastProps>;

interface ApprovalDialogProps {
    toolCalls: ToolCall[];
    reason?: string;
    onApprove: () => void;
    onDeny: () => void;
    onCancel: () => void;
}
declare const ApprovalDialog: React.FC<ApprovalDialogProps>;

type ChatTheme = 'light' | 'dark' | 'chatgpt';
interface ChatConfig {
    theme: ChatTheme;
    showDebugMessages: boolean;
    enableCodeHighlighting: boolean;
    enableMarkdown: boolean;
    maxMessageWidth: string;
    borderRadius: string;
    spacing: string;
}
interface ChatContextValue {
    config: ChatConfig;
    updateConfig: (updates: Partial<ChatConfig>) => void;
}
interface ChatProviderProps {
    children: ReactNode;
    config?: Partial<ChatConfig>;
}
declare function ChatProvider({ children, config: initialConfig }: ChatProviderProps): react_jsx_runtime.JSX.Element;
declare function useChatConfig(): ChatContextValue;
declare const getThemeClasses: (theme: ChatTheme) => {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    userBubble: string;
    assistantBubble: string;
    avatar: {
        user: string;
        assistant: string;
    };
};

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

/**
 * Initialize the builtin handlers with callbacks
 */
declare const initializeBuiltinHandlers: (callbacks: {
    onToolComplete: (results: ToolResult[]) => void;
    onCancel: () => void;
    showToast: (message: string, type?: "success" | "error" | "warning" | "info") => void;
    showApprovalDialog: (toolCalls: ToolCall[], reason?: string) => Promise<boolean>;
}) => void;
/**
 * Clear pending tool calls
 */
declare const clearPendingToolCalls: () => void;
/**
 * Builtin tool handlers using the new ToolHandler interface
 */
declare const createBuiltinToolHandlers: () => Record<string, ToolHandler>;
/**
 * Process external tool calls with handlers
 */
declare const processExternalToolCalls: (toolCalls: ToolCall[], handlers: Record<string, ToolHandler>, onToolComplete: (results: ToolResult[]) => Promise<void>) => Promise<void>;

export { ApprovalDialog, AssistantMessage, AssistantWithToolCalls, Chat, type ChatConfig, type ChatContextValue, ChatProvider, type ChatTheme, DistriProvider, ExternalToolManager, MessageContainer, MessageRenderer, Toast, Tool, UserMessage, clearPendingToolCalls, createBuiltinToolHandlers, getThemeClasses, initializeBuiltinHandlers, processExternalToolCalls, useAgent, useAgents, useChat, useChatConfig, useDistri, useDistriClient, useThreads };
