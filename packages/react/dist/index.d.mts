import React, { ReactNode } from 'react';
import { Agent as Agent$1, ToolCall, ToolCallState, DistriAgent, Message, MessageMetadata, DistriThread, DistriTool, ToolResult, DistriClientConfig, DistriClient } from '@distri/core';
import { Part } from '@a2a-js/sdk/client';
import * as react_jsx_runtime from 'react/jsx-runtime';

interface ChatContainerProps {
    agentId: string;
    agent?: Agent$1;
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
    agent?: Agent$1;
    height?: string;
    className?: string;
    style?: React.CSSProperties;
    metadata?: any;
    availableAgents?: Array<{
        id: string;
        name: string;
        description?: string;
    }>;
    UserMessageComponent?: React.ComponentType<any>;
    AssistantMessageComponent?: React.ComponentType<any>;
    AssistantWithToolCallsComponent?: React.ComponentType<any>;
    PlanMessageComponent?: React.ComponentType<any>;
    theme?: 'light' | 'dark' | 'auto';
    showDebug?: boolean;
    showAgentSelector?: boolean;
    placeholder?: string;
    onAgentSelect?: (agentId: string) => void;
    onResponse?: (message: any) => void;
}
declare const EmbeddableChat: React.FC<EmbeddableChatProps>;

interface FullChatProps {
    agentId: string;
    agent?: Agent$1;
    metadata?: any;
    className?: string;
    availableAgents?: Array<{
        id: string;
        name: string;
        description?: string;
    }>;
    UserMessageComponent?: React.ComponentType<any>;
    AssistantMessageComponent?: React.ComponentType<any>;
    AssistantWithToolCallsComponent?: React.ComponentType<any>;
    PlanMessageComponent?: React.ComponentType<any>;
    theme?: 'light' | 'dark' | 'auto';
    showDebug?: boolean;
    showSidebar?: boolean;
    sidebarWidth?: number;
    currentPage?: 'chat' | 'agents';
    onPageChange?: (page: 'chat' | 'agents') => void;
    onAgentSelect?: (agentId: string) => void;
    onThreadSelect?: (threadId: string) => void;
    onThreadCreate?: (threadId: string) => void;
    onThreadDelete?: (threadId: string) => void;
    onLogoClick?: () => void;
}
declare const FullChat: React.FC<FullChatProps>;

interface ChatProps {
    agentId: string;
    threadId: string;
    agent?: Agent$1;
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

interface Agent {
    id: string;
    name: string;
    description?: string;
}
interface AgentDropdownProps {
    agents: Agent[];
    selectedAgentId: string;
    onAgentSelect: (agentId: string) => void;
    className?: string;
    placeholder?: string;
}
declare const AgentDropdown: React.FC<AgentDropdownProps>;

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
    backgroundColor?: string;
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

interface UseAgentOptions {
    agentId: string;
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

interface UseChatOptions {
    agentId: string;
    threadId: string;
    agent?: Agent$1;
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
    agent: Agent$1 | null;
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
    agent?: Agent$1 | null;
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

export { AgentDropdown, AssistantMessage, type AssistantMessageProps, AssistantWithToolCalls, type AssistantWithToolCallsProps, type BaseMessageProps, Chat, ChatContainer, type ChatContainerProps, DistriProvider, EmbeddableChat, type EmbeddableChatProps, FullChat, type FullChatProps, MessageContainer, MessageRenderer, PlanMessage, type PlanMessageProps, Tool, type ToolCallProps, UserMessage, type UserMessageProps, createBuiltinTools, createTool, extractTextFromMessage, formatTimestamp, getMessageType, scrollToBottom, shouldDisplayMessage, useAgent, useAgents, useChat, useDistri, useThreads, useTools };
