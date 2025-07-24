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

interface ChatContainerProps {
    agentId: string;
    agent?: Agent;
    metadata?: any;
    variant?: 'embedded' | 'full';
    height?: string | number;
    className?: string;
    threadId?: string;
    showSidebar?: boolean;
    sidebarWidth?: number;
    theme?: 'light' | 'dark' | 'auto';
    placeholder?: string;
    showDebug?: boolean;
    UserMessageComponent?: React.ComponentType<any>;
    AssistantMessageComponent?: React.ComponentType<any>;
    AssistantWithToolCallsComponent?: React.ComponentType<any>;
    PlanMessageComponent?: React.ComponentType<any>;
    onMessageSent?: (message: string) => void;
    onResponse?: (response: any) => void;
    onThreadSelect?: (threadId: string) => void;
    onThreadCreate?: (threadId: string) => void;
    onThreadDelete?: (threadId: string) => void;
}
/**
 * ChatContainer - A ready-to-use chat component for Distri agents
 *
 * This is the main component developers should use. It provides:
 * - Embedded variant: Simple chat interface for embedding in existing UIs
 * - Full variant: Complete chat application with threads sidebar
 * - Theme support: Light/dark/auto themes compatible with shadcn/ui
 * - Tool support: Automatic tool execution with visual feedback
 * - Customization: Override any message component
 *
 * @example
 * ```tsx
 * // Simple embedded chat
 * <ChatContainer agentId="my-agent" variant="embedded" height={400} />
 *
 * // Full chat with threads
 * <ChatContainer agentId="my-agent" variant="full" />
 *
 * // With custom components
 * <ChatContainer
 *   agentId="my-agent"
 *   UserMessageComponent={CustomUserMessage}
 *   theme="dark"
 * />
 * ```
 */
declare const ChatContainer: React.FC<ChatContainerProps>;

interface EmbeddableChatProps {
    agentId: string;
    threadId?: string;
    agent?: Agent;
    metadata?: any;
    height?: string | number;
    placeholder?: string;
    className?: string;
    UserMessageComponent?: React.ComponentType<any>;
    AssistantMessageComponent?: React.ComponentType<any>;
    AssistantWithToolCallsComponent?: React.ComponentType<any>;
    PlanMessageComponent?: React.ComponentType<any>;
    theme?: 'light' | 'dark' | 'auto';
    showDebug?: boolean;
    onMessageSent?: (message: string) => void;
    onResponse?: (response: any) => void;
}
declare const EmbeddableChat: React.FC<EmbeddableChatProps>;

interface FullChatProps {
    agentId: string;
    agent?: Agent;
    metadata?: any;
    className?: string;
    UserMessageComponent?: React.ComponentType<any>;
    AssistantMessageComponent?: React.ComponentType<any>;
    AssistantWithToolCallsComponent?: React.ComponentType<any>;
    PlanMessageComponent?: React.ComponentType<any>;
    theme?: 'light' | 'dark' | 'auto';
    showDebug?: boolean;
    showSidebar?: boolean;
    sidebarWidth?: number;
    onThreadSelect?: (threadId: string) => void;
    onThreadCreate?: (threadId: string) => void;
    onThreadDelete?: (threadId: string) => void;
}
declare const FullChat: React.FC<FullChatProps>;

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

/**
 * Utility function to extract text content from message parts
 */
declare const extractTextFromMessage: (message: any) => string;
/**
 * Utility function to determine if a message should be displayed
 * Can be used by builders when creating custom chat components
 */
declare const shouldDisplayMessage: (message: any, showDebugMessages?: boolean) => boolean;
/**
 * Utility function to determine message type for rendering
 */
declare const getMessageType: (message: any) => "user" | "assistant" | "assistant_with_tools" | "plan" | "system";
/**
 * Utility function to format timestamps
 */
declare const formatTimestamp: (timestamp: string | number | Date) => string;
/**
 * Utility function to scroll to bottom of chat
 */
declare const scrollToBottom: (element: HTMLElement | null, _behavior?: ScrollBehavior) => void;

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

interface ExternalToolManagerProps {
    toolCalls: ToolCall[];
    onToolComplete: (results: ToolResult[]) => void;
    onCancel: () => void;
}
declare const ExternalToolManager: React.FC<ExternalToolManagerProps>;

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

type ChatTheme = 'light' | 'dark' | 'auto';
interface ChatConfig {
    theme: ChatTheme;
    showDebug: boolean;
    autoScroll: boolean;
    showTimestamps: boolean;
    enableMarkdown: boolean;
    enableCodeHighlighting: boolean;
}
interface ChatContextValue {
    config: ChatConfig;
    updateConfig: (updates: Partial<ChatConfig>) => void;
}
interface ChatProviderProps {
    children: ReactNode;
    config?: Partial<ChatConfig>;
}
declare const ChatProvider: React.FC<ChatProviderProps>;
declare const useChatConfig: () => ChatContextValue;
/**
 * Utility function to get theme classes for components
 */
declare const getThemeClasses: (theme: ChatTheme) => string;

export { ApprovalDialog, AssistantMessage, type AssistantMessageProps, AssistantWithToolCalls, type AssistantWithToolCallsProps, type BaseMessageProps, Chat, type ChatConfig, ChatContainer, type ChatContainerProps, type ChatContextValue, ChatProvider, type ChatTheme, DistriProvider, EmbeddableChat, type EmbeddableChatProps, ExternalToolManager, FullChat, type FullChatProps, type LegacyToolHandler, MessageContainer, MessageRenderer, PlanMessage, type PlanMessageProps, Toast, Tool, type ToolCallProps, UserMessage, type UserMessageProps, clearPendingToolCalls, createBuiltinToolHandlers, createBuiltinTools, createTool, extractTextFromMessage, formatTimestamp, getMessageType, getThemeClasses, initializeBuiltinHandlers, processExternalToolCalls, scrollToBottom, shouldDisplayMessage, useAgent, useAgents, useChat, useChatConfig, useDistri, useDistriClient, useThreads, useTools };
