// Core hooks
export { useDistri, DistriProvider } from './DistriProvider';
export { useAgent } from './useAgent';
export { useAgents } from './useAgents';
export { useChat } from './useChat';
export { useThreads } from './useThreads';
export { useTools } from './hooks/useTools';

// Components
export { default as FullChat } from './components/FullChat';
export { EmbeddableChat } from './components/EmbeddableChat';
export { AgentSelect } from './components/AgentSelect';
export { ChatInput } from './components/ChatInput';
export { ThemeProvider, useTheme } from './components/ThemeProvider';
export { ThemeToggle } from './components/ThemeToggle';

// Message components
export {
  UserMessage,
  AssistantMessage,
  AssistantWithToolCalls,
  PlanMessage,
  DebugMessage
} from './components/MessageComponents';

// Built-in tools
export { 
  createBuiltinTools,
  createApprovalTool,
  createToastTool
} from './builtinHandlers';

// Utilities
export { shouldDisplayMessage, extractTextFromMessage } from './utils/messageUtils';

// Legacy exports
export { 
  createBuiltinToolHandlers,
  initializeBuiltinHandlers 
} from './builtinHandlers';

// UI Components - shadcn
export * from './components/ui';

// Utilities
export { cn } from './lib/utils';