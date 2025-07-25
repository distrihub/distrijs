import { Agent as Agent$1, DistriAgent, Message, MessageMetadata, DistriThread, DistriTool, ToolCall, ToolResult, DistriClientConfig } from '@distri/core';
import { Part } from '@a2a-js/sdk/client';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';
import React__default, { ReactNode } from 'react';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
import { ClassValue } from 'clsx';

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

interface DistriProviderProps {
    config: DistriClientConfig;
    children: ReactNode;
    defaultTheme?: 'dark' | 'light' | 'system';
}
declare function DistriProvider({ config, children, defaultTheme }: DistriProviderProps): react_jsx_runtime.JSX.Element;

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
    UserMessageComponent?: React__default.ComponentType<any>;
    AssistantMessageComponent?: React__default.ComponentType<any>;
    AssistantWithToolCallsComponent?: React__default.ComponentType<any>;
    PlanMessageComponent?: React__default.ComponentType<any>;
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
declare const ChatContainer: React__default.FC<ChatContainerProps>;

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
    UserMessageComponent?: React__default.ComponentType<any>;
    AssistantMessageComponent?: React__default.ComponentType<any>;
    AssistantWithToolCallsComponent?: React__default.ComponentType<any>;
    PlanMessageComponent?: React__default.ComponentType<any>;
    onExternalToolCall?: (toolCall: any) => void;
}
declare const Chat: React__default.FC<ChatProps>;

interface EmbeddableChatProps {
    agentId: string;
    threadId?: string;
    agent?: Agent$1;
    height?: string;
    className?: string;
    style?: React__default.CSSProperties;
    metadata?: any;
    availableAgents?: Array<{
        id: string;
        name: string;
        description?: string;
    }>;
    UserMessageComponent?: React__default.ComponentType<any>;
    AssistantMessageComponent?: React__default.ComponentType<any>;
    AssistantWithToolCallsComponent?: React__default.ComponentType<any>;
    PlanMessageComponent?: React__default.ComponentType<any>;
    theme?: 'light' | 'dark' | 'auto';
    showDebug?: boolean;
    showAgentSelector?: boolean;
    placeholder?: string;
    onAgentSelect?: (agentId: string) => void;
    onResponse?: (message: any) => void;
}
declare const EmbeddableChat: React__default.FC<EmbeddableChatProps>;

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
    UserMessageComponent?: React__default.ComponentType<any>;
    AssistantMessageComponent?: React__default.ComponentType<any>;
    AssistantWithToolCallsComponent?: React__default.ComponentType<any>;
    PlanMessageComponent?: React__default.ComponentType<any>;
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
declare const FullChat: React__default.FC<FullChatProps>;

type Theme = 'dark' | 'light' | 'system';
interface ThemeProviderProps {
    children: React__default.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}
interface ThemeProviderState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}
declare function ThemeProvider({ children, defaultTheme, storageKey, ...props }: ThemeProviderProps): react_jsx_runtime.JSX.Element;
declare const useTheme: () => ThemeProviderState;

declare const buttonVariants: {
    variant: {
        default: string;
        destructive: string;
        outline: string;
        secondary: string;
        ghost: string;
        link: string;
    };
    size: {
        default: string;
        sm: string;
        lg: string;
        icon: string;
    };
};
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof buttonVariants.variant;
    size?: keyof typeof buttonVariants.size;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

declare const Card: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const CardDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const CardContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;

declare const badgeVariants: (props?: ({
    variant?: "default" | "destructive" | "outline" | "secondary" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
}
declare function Badge({ className, variant, ...props }: BadgeProps): react_jsx_runtime.JSX.Element;

interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}
declare const DialogRoot: React.FC<DialogProps>;
declare const DialogTrigger: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>;
declare const DialogContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const DialogHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const DialogTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
}
declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;

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
declare const AgentDropdown: React__default.FC<AgentDropdownProps>;

interface ApprovalDialogProps {
    toolCalls: ToolCall[];
    reason?: string;
    onApprove: () => void;
    onDeny: () => void;
    onCancel: () => void;
}
declare const ApprovalDialog: React__default.FC<ApprovalDialogProps>;

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
declare const ChatInput: React__default.FC<ChatInputProps>;

interface MessageRendererProps {
    content: string;
    className?: string;
    metadata?: any;
}
declare const MessageRenderer: React__default.FC<MessageRendererProps>;

declare function ThemeToggle(): react_jsx_runtime.JSX.Element;

declare function ThemeDropdown(): react_jsx_runtime.JSX.Element;

declare function ModeToggle(): react_jsx_runtime.JSX.Element;

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onClose?: () => void;
}
declare const Toast: React__default.FC<ToastProps>;

declare function cn(...inputs: ClassValue[]): string;

export { AgentDropdown, ApprovalDialog, Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Chat, ChatContainer, ChatInput, DialogRoot as Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DistriProvider, EmbeddableChat, FullChat, Input, MessageRenderer, ModeToggle, Textarea, ThemeDropdown, ThemeProvider, ThemeToggle, Toast, cn, useAgent, useAgents, useChat, useTheme, useThreads, useTools };
