// Core exports
export * from './useChat';
export * from './useAgent';
export * from './useAgentDefinitions';
export * from './useThreads';
export * from './useModels';
export * from './useBackgroundTasks';

// Component exports
export * from './components/Chat';
export * from './components/AgentList';
export * from './components/AgentSelect';
export * from './components/ChatInput';
export * from './components/VoiceInput';
export * from './components/BrowserPreviewPanel';
export * from './components/BrowserViewport';
export * from './components/ConfigurationPanel';
export * from './components/ThemeProvider';
export * from './components/ThemeToggle';
export * from './components/Toast';
export * from './components/AuthLoading';
export * from './components/AskFollowUp';
export * from './components/ContextIndicator';
export * from './components/ContextUsagePanel';
export * from './components/ContextControl';

// Provider exports
export * from './DistriProvider';
export * from './DistriAuthProvider';

// Type exports
export * from './types';

// Hook exports
export * from './hooks/useChatMessages';
export * from './hooks/useTts';
export * from './hooks/useSpeechToText';
export * from './hooks/useConfiguration';
export * from './hooks/useMessageFeedback';
export * from './hooks/useContextHealth';
export * from './stores/chatStateStore';

// Utility exports
export * from './utils/toolWrapper';
export { createHttpToolRenderer } from './utils/createHttpToolRenderer';
export type { HttpToolRendererOptions, PathConfig } from './utils/createHttpToolRenderer';

// Browser tools exports — unified IndexedDB toolset (no more Read/Write file shims).
export {
  IndexedDbStore,
  createDbTools,
  dbToolsPrompt,
  DB_PUT_TOOL_DEF,
  DB_GET_TOOL_DEF,
  DB_LIST_TOOL_DEF,
  DB_SEARCH_TOOL_DEF,
  DB_DELETE_TOOL_DEF,
  DB_CLEAR_TOOL_DEF,
  DB_COLLECTIONS_TOOL_DEF,
  EXEC_JS_TOOL_DEF,
  createDbPutHandler,
  createDbGetHandler,
  createDbListHandler,
  createDbSearchHandler,
  createDbDeleteHandler,
  createDbClearHandler,
  createDbCollectionsHandler,
  createExecJsHandler,
  createDbPutTool,
  createDbGetTool,
  createDbListTool,
  createDbSearchTool,
  createDbDeleteTool,
  createDbClearTool,
  createDbCollectionsTool,
  createExecJsTool,
} from './browser-tools';
export type {
  StoreRecord,
  StoreChangeOp,
  StoreChangeEvent,
  CollectionDef,
  CreateDbToolsOptions,
  CreateDbToolsResult,
  ExecJsParams,
  ExecDbApi,
  CreateExecJsHandlerOptions,
} from './browser-tools';

// Workflow
export * from './useWorkflow';
export * from './useWorkflowRunner';
export * from './components/WorkflowProgress';

// UI Component exports (for customization)
export * from './components/ui';

// Renderer exports (for customization)
export * from './components/renderers';
export { ContextChip, budgetRatio, budgetUsedTokens } from './components/ContextChip';
export { ContextRow, type ContextRowProps } from './components/ContextRow';
export { LoadingStrip } from './components/renderers/LoadingStrip';
export { TodosCompact } from './components/renderers/TodosCompact';
export { DiffView, looksLikeDiff } from './components/renderers/tools/DiffView';
export { getToolSummary } from './components/renderers/tools/getToolSummary';
export { MinimalToolRow } from './components/renderers/tools/MinimalToolRow';
export { RichToolCard } from './components/renderers/tools/RichToolCard';
export { InteractiveToolCard } from './components/renderers/tools/InteractiveToolCard';
export { HttpToolCard } from './components/renderers/tools/HttpToolCard';
export type { HttpToolCardProps } from './components/renderers/tools/HttpToolCard';
export { RendererContext, useRendererContext } from './components/renderers/RendererContext';
export { CommandPalette } from './components/CommandPalette';
export { CommandPill } from './components/CommandPill';
export { DeveloperModeComponent } from './components/developer/DeveloperModeComponent';

// Styles are NOT imported here - consumers must explicitly import them:
//   import '@distri/react/globals.css';  // Required utilities
//   import '@distri/react/theme.css';    // Optional default theme
