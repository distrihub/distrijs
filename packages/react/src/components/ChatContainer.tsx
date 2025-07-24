import React from 'react';
import { Agent } from '@distri/core';
import { EmbeddableChat } from './EmbeddableChat';
import { FullChat } from './FullChat';
import '../styles/themes.css';

export interface ChatContainerProps {
  agentId: string;
  agent?: Agent;
  metadata?: any;
  
  // Layout options
  variant?: 'embedded' | 'full';
  height?: string | number;
  className?: string;
  
  // Threading (only for full variant)
  threadId?: string;
  showSidebar?: boolean;
  sidebarWidth?: number;
  
  // Appearance
  theme?: 'light' | 'dark' | 'auto';
  placeholder?: string;
  
  // Functionality
  showDebug?: boolean;
  
  // Customization
  UserMessageComponent?: React.ComponentType<any>;
  AssistantMessageComponent?: React.ComponentType<any>;
  AssistantWithToolCallsComponent?: React.ComponentType<any>;
  PlanMessageComponent?: React.ComponentType<any>;
  
  // Callbacks
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
export const ChatContainer: React.FC<ChatContainerProps> = ({
  variant = 'embedded',
  height = 500,
  theme = 'auto',
  showDebug = false,
  placeholder = "Type your message...",
  ...props
}) => {
  // Convert height to string if it's a number
  const heightString = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'full') {
    return (
      <FullChat
        {...props}
        theme={theme}
        showDebug={showDebug}
      />
    );
  }

  return (
    <EmbeddableChat
      {...props}
      height={heightString}
      theme={theme}
      showDebug={showDebug}
      placeholder={placeholder}
    />
  );
};

export default ChatContainer;