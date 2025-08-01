// Core hooks
export { DistriProvider } from './DistriProvider';
export { useAgent } from './useAgent';
export { useAgents } from './useAgents';
export { useChat } from './useChat';
export { useThreads } from './useThreads';
export { registerTools } from './hooks/registerTools';
export { useToolCallState } from './hooks/useToolCallState';

// Components
export { EmbeddableChat } from './components/EmbeddableChat';
export { FullChat } from './components/FullChat';
export { ExecutionSteps, ExecutionTracker } from './components/ExecutionSteps';
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