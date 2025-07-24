import * as react_jsx_runtime from 'react/jsx-runtime';
import React, { ReactNode } from 'react';
import { DistriClientConfig, DistriClient, Agent, DistriAgent, Message, MessageMetadata, DistriThread, DistriTool, ToolCall, ToolResult, ToolCallState } from '@distri/core';
export { A2AProtocolError, Agent, ApiError, ConnectionError, ConnectionStatus, DistriAgent, DistriClientConfig, DistriError, DistriThread, DistriTool, Message, MessageMetadata, Thread, ToolCall, ToolCallState, ToolHandler, ToolResult } from '@distri/core';
import { Part } from '@a2a-js/sdk/client';

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

interface UseChatOptions {
    agentId: string;
    threadId: string;
    agent?: Agent;
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
}
/**
 * useChat is the main hook for chat UIs with simplified tool handling.
 * Tools are now registered directly on the agent using agent.addTool() or useTools hook.
 */
declare function useChat({ agentId, threadId, agent: providedAgent, metadata, }: UseChatOptions): UseChatResult;

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
    agent?: Agent | null;
}
interface UseToolsResult {
    addTool: (tool: DistriTool) => void;
    addTools: (tools: DistriTool[]) => void;
    removeTool: (toolName: string) => void;
    executeTool: (toolCall: ToolCall) => Promise<ToolResult>;
    getTools: () => string[];
    hasTool: (toolName: string) => boolean;
}
/**
 * Hook for managing tools in an agent
 * Follows AG-UI pattern for tool registration
 */
declare function useTools({ agent }: UseToolsOptions): UseToolsResult;
/**
 * Utility function to create common tool definitions
 */
declare const createTool: (name: string, description: string, parameters: any, handler: (input: any) => Promise<any> | any) => DistriTool;
/**
 * Built-in tool definitions
 */
declare const createBuiltinTools: () => {
    /**
     * Confirmation tool for user approval
     */
    confirm: DistriTool;
    /**
     * Input request tool
     */
    input: DistriTool;
    /**
     * Notification tool
     */
    notify: DistriTool;
};

interface ChatProps {
    agentId: string;
    threadId: string;
    agent?: Agent;
    tools?: Record<string, any>;
    metadata?: any;
    height?: string;
    onThreadUpdate?: (threadId: string) => void;
    className?: string;
    placeholder?: string;
    UserMessageComponent?: React.ComponentType<any>;
    AssistantMessageComponent?: React.ComponentType<any>;
    AssistantWithToolCallsComponent?: React.ComponentType<any>;
    PlanMessageComponent?: React.ComponentType<any>;
    onExternalToolCall?: (toolCall: any) => void;
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
    toolCall: ToolCall | ToolCallState;
    status?: 'pending' | 'running' | 'completed' | 'error';
    result?: any;
    error?: string;
}
interface AssistantWithToolCallsProps extends AssistantMessageProps {
    toolCalls: ToolCallProps[];
}
interface PlanMessageProps extends BaseMessageProps {
    content: string;
    duration?: number;
    timestamp?: Date;
}
declare const MessageContainer: React.FC<{
    children: React.ReactNode;
    align: 'left' | 'right' | 'center';
    className?: string;
}>;
declare const PlanMessage: React.FC<PlanMessageProps>;
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

interface ApprovalDialogProps {
    toolCalls: ToolCall[];
    reason?: string;
    onApprove: () => void;
    onDeny: () => void;
    onCancel: () => void;
}
declare const ApprovalDialog: React.FC<ApprovalDialogProps>;

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onClose?: () => void;
}
declare const Toast: React.FC<ToastProps>;

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

interface LegacyToolHandler {
    (toolCall: ToolCall, onToolComplete: (toolCallId: string, result: ToolResult) => Promise<void>): Promise<{} | null>;
}
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
 * Legacy builtin tool handlers using the old ToolHandler interface
 * These are kept for backwards compatibility but work alongside the new system
 */
declare const createBuiltinToolHandlers: () => Record<string, LegacyToolHandler>;
/**
 * Process external tool calls with handlers
 * This is kept for backwards compatibility
 */
declare const processExternalToolCalls: (toolCalls: ToolCall[], handlers: Record<string, LegacyToolHandler>, onToolComplete: (results: ToolResult[]) => Promise<void>) => Promise<void>;

export { ApprovalDialog, AssistantMessage, type AssistantMessageProps, AssistantWithToolCalls, type AssistantWithToolCallsProps, type BaseMessageProps, Chat, type ChatConfig, type ChatContextValue, ChatProvider, type ChatTheme, DistriProvider, ExternalToolManager, type LegacyToolHandler, MessageContainer, MessageRenderer, PlanMessage, type PlanMessageProps, Toast, Tool, type ToolCallProps, UserMessage, type UserMessageProps, clearPendingToolCalls, createBuiltinToolHandlers, createBuiltinTools, createTool, getThemeClasses, initializeBuiltinHandlers, processExternalToolCalls, useAgent, useAgents, useChat, useChatConfig, useDistri, useDistriClient, useThreads, useTools };
