// Core components
export { Chat, type ChatProps } from './components/Chat';
export { DistriProvider } from './DistriProvider';
export { ThemeProvider } from './components/ThemeProvider';
export { ThemeToggle } from './components/ThemeToggle';
export { useTheme } from './components/ThemeProvider';

// Agent components
export { default as AgentList } from './components/AgentList';
export { AgentSelect } from './components/AgentSelect';
export { default as AgentsPage } from './components/AgentsPage';

// Execution components
export { ExecutionSteps } from './components/ExecutionSteps';
export { TaskExecutionRenderer } from './components/TaskExecutionRenderer';

// Renderers
export {
  UserMessageRenderer,
  AssistantMessageRenderer,
  ThinkingRenderer,
  ToolCallRenderer,
  PlanRenderer,
  ToolMessageRenderer,
  DebugRenderer,
  ArtifactRenderer,
} from './components/renderers';

// Hooks
export { useChat } from './useChat';
export { useChatMessages } from './hooks/useChatMessages';
export { useAgent } from './useAgent';
export { useAgentDefinitions } from './useAgentDefinitions';
export { useThreads } from './useThreads';
export { useChatConfig } from './components/ChatContext';

// Store
export { useChatStateStore } from './stores/chatStateStore';

// UI components
export * from './components/ui';

// Tool call components
export { ApprovalToolCall, ToastToolCall } from './components/toolcalls';
// Utilities
export { shouldDisplayMessage, extractTextFromMessage } from './utils/messageUtils';

export type { DistriAnyTool } from './types';