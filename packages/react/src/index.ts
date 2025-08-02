// Core hooks
export { useDistri, DistriProvider } from './DistriProvider';
export { useAgent } from './useAgent';
export { useAgentDefinitions } from './useAgentDefinitions';
export { useChat } from './useChat';
export { useThreads } from './useThreads';
export { registerTools } from './hooks/registerTools';
export { useToolCallState } from './hooks/useToolCallState';

// Components
export { Chat, type ChatProps } from './components/Chat';
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
} from './components/Components';

// Tool call components
export { ApprovalToolCall, ToastToolCall } from './components/toolcalls';

// Utilities
export { shouldDisplayMessage, extractTextFromMessage } from './utils/messageUtils';


export type { DistriAnyTool } from './types';