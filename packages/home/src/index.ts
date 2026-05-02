// Client exports
export { DistriHomeClient } from './DistriHomeClient';
export type { HomeStats, HomeStatsThread, RecentlyUsedAgent, AgentUsageInfo, ApiKey, DetailedThreadListParams, DetailedThread, DetailedThreadsResponse, UserChannelSummary, UserListItem, UserListResponse, UserListParams, UserDetail, SendUserTestMessageRequest, ChannelDetail, ChannelConversation, Secret, PromptTemplate, AgentValidationResult, ValidationWarning, ValidationWarningSeverity, SkillRecord, NewSkill, UpdateSkill, ConfiguredField, CustomProviderConfig, CustomModelEntry, SecretKeyDefinition, UpsertProviderRequest, UpsertProviderResponse, ModelProviderDefinition, Model, ModelWithProvider, ModelCapability, ModelPricing, ProviderKeyDefinition, ProviderTypeInfo, TtsVoiceInfo } from './DistriHomeClient';

// Feature/slot/routes context provider (Tier-2 blocks read from this)
export { DistriHomeProvider } from './provider/DistriHomeProvider';
export { useDistriHome, DistriHomeContext } from './provider/context';
export type {
  DistriHomeConfig,
  HomeFeatures,
  HomeSlots,
  HomeRoutesConfig,
  HomeAction,
} from './provider/types';

// Infrastructure provider (client, navigate, homeClient) — used by legacy components
export {
  DistriHomeProvider as DistriHomeInfraProvider,
  useDistriHome as useDistriHomeInfra,
  useDistriHomeConfig,
  useDistriHomeNavigate,
  useDistriHomeClient,
} from './DistriHomeProvider';
export type {
  DistriHomeConfig as DistriHomeInfraConfig,
  DistriHomeProviderProps,
  NavigateFunction,
  HomeWidget,
} from './DistriHomeProvider';

// Hook exports
export { useHomeStats } from './hooks/useHomeStats';
export type { UseHomeStatsResult } from './hooks/useHomeStats';
export { useApiKeys } from './hooks/useApiKeys';
export type { UseApiKeysResult } from './hooks/useApiKeys';
export { useAgentValidation } from './hooks/useAgentValidation';
export type { UseAgentValidationOptions, UseAgentValidationResult } from './hooks/useAgentValidation';

export { Home } from './components/Home';
export { AgentDetails } from './components/AgentDetails';
export { ThreadsView } from './components/ThreadsView';
export { SettingsView } from './components/SettingsView';
export { SecretsView } from './components/SecretsView';
export { AgentSettingsView } from './components/AgentSettingsView';
export type { AgentSettingsViewProps } from './components/AgentSettingsView';
export { VoicePreviewDialog } from './components/VoicePreviewDialog';
export { PromptTemplatesView } from './components/PromptTemplatesView';
export { SessionsView } from './components/SessionsView';
export { CodePanel } from './components/CodePanel';
export { WorkflowEntryPointSelector } from './components/WorkflowEntryPointSelector';
export type { HomeProps } from './components/Home';
export type { AgentDetailsProps } from './components/AgentDetails';
export type { ThreadsViewProps } from './components/ThreadsView';
export type { SettingsViewProps, SettingsSection } from './components/SettingsView';
export type { SecretsViewProps } from './components/SecretsView';
export type { SessionsViewProps } from './components/SessionsView';
export type { CodePanelProps, CodeLanguage } from './components/CodePanel';
export type { WorkflowEntryPointSelectorProps } from './components/WorkflowEntryPointSelector';

// Tier-2 blocks
export { AgentList } from './blocks/AgentList';
export type { AgentListSlots, AgentListProps } from './blocks/AgentList';
export { AgentEditor } from './blocks/AgentEditor';
export type { AgentEditorProps } from './blocks/AgentEditor';
export { ThreadList } from './blocks/ThreadList';
export type { ThreadListSlots, ThreadListProps } from './blocks/ThreadList';
export { ThreadView } from './blocks/ThreadView';
export type { ThreadViewProps } from './blocks/ThreadView';
export { SessionList } from './blocks/SessionList';
export type { SessionListProps } from './blocks/SessionList';
