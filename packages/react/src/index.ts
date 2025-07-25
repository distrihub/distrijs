// Main chat components
export { ChatContainer } from './components/ChatContainer';
export { EmbeddableChat } from './components/EmbeddableChat';
export { FullChat } from './components/FullChat';
export { Chat } from './components/Chat'; // Deprecated - use ChatContainer instead
export { AgentDropdown } from './components/AgentDropdown';
export { ChatInput } from './components/ChatInput';
export { ThemeDemo } from './components/ThemeDemo';
export { ThemeTest } from './components/ThemeTest';
export { DarkModeDemo } from './components/DarkModeDemo';
export { ThemeDebug } from './components/ThemeDebug';

// Message components (customizable)
export {
  UserMessage,
  AssistantMessage,
  AssistantWithToolCalls,
  Tool,
  MessageContainer,
  PlanMessage
} from './components/MessageComponents';

// Message renderer
export { default as MessageRenderer } from './components/MessageRenderer';

// Hooks
export { useAgent } from './useAgent';
export { useAgents } from './useAgents';
export { useChat } from './useChat';
export { useThreads } from './useThreads';
export { useTools, createTool, createBuiltinTools } from './useTools';

// Providers
export { DistriProvider, useDistri } from './DistriProvider';
export { ThemeProvider, useTheme } from './components/ThemeProvider';
export { ThemeDropdown } from './components/ThemeDropdown';
export { ModeToggle } from './components/ModeToggle';

// Message utilities
export {
  extractTextFromMessage,
  shouldDisplayMessage,
  getMessageType,
  formatTimestamp,
  scrollToBottom
} from './utils/messageUtils';

// Types
export type {
  BaseMessageProps,
  UserMessageProps,
  AssistantMessageProps,
  AssistantWithToolCallsProps,
  ToolCallProps,
  PlanMessageProps
} from './components/MessageComponents';

export type { ChatContainerProps } from './components/ChatContainer';
export type { EmbeddableChatProps } from './components/EmbeddableChat';
export type { FullChatProps } from './components/FullChat';
export type { ChatInputProps } from './components/ChatInput';