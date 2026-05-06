// Client exports
export { DistriHomeClient } from './DistriHomeClient';
export type { HomeStats, HomeStatsThread, RecentlyUsedAgent, AgentUsageInfo, ApiKey, DetailedThreadListParams, DetailedThread, DetailedThreadsResponse, UserChannelSummary, UserListItem, UserListResponse, UserListParams, UserDetail, SendUserTestMessageRequest, ChannelDetail, ChannelConversation, Secret, PromptTemplate, AgentValidationResult, ValidationWarning, ValidationWarningSeverity, SkillRecord, NewSkill, UpdateSkill, ConfiguredField, CustomProviderConfig, CustomModelEntry, SecretKeyDefinition, UpsertProviderRequest, UpsertProviderResponse, ModelProviderDefinition, Model, ModelWithProvider, ModelCapability, ModelPricing, ProviderKeyDefinition, ProviderTypeInfo, TtsVoiceInfo, TracesQuery, TraceRecord, TracesResponse, ConnectionRecord, ConnectionAuthScope, ConnectionAuthType, UsageQuery, UsageStatsResponse, UsageTotals, UsageBucket, UsageAppliedFilters, Profile, ProfileUpdate } from './DistriHomeClient';

// Single context provider — the ONLY provider. Pass homeClient + navigate via config.
export { DistriHomeProvider } from './provider/DistriHomeProvider';
export { useDistriHome, useDistriHomeClient, useDistriHomeNavigate, DistriHomeContext } from './provider/context';
export type {
  DistriHomeConfig,
  HomeFeatures,
  HomeSlots,
  HomeRoutesConfig,
  HomeAction,
  HomeNavigationPaths,
  HomeWidget,
} from './provider/types';

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
export type { SettingsViewProps, SettingsSection as SettingsSectionConfig } from './components/SettingsView';
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

// Tier-2 blocks — traces/usage/connections/skills/settings (Task 9)
export { TraceTimeline } from './blocks/TraceTimeline';
export type { TraceTimelineSlots, TraceTimelineProps, TraceSpan, TraceSpanAttribute, TraceSummary } from './blocks/TraceTimeline';
export { TraceDetail } from './blocks/TraceDetail';
export type { TraceDetailProps } from './blocks/TraceDetail';
export { UsageWidget } from './blocks/UsageWidget';
export type { UsageWidgetSlots, UsageWidgetProps, UsageData } from './blocks/UsageWidget';
export { ConnectionList } from './blocks/ConnectionList';
export type { ConnectionListSlots, ConnectionListProps, Connection, AuthScope, AuthType } from './blocks/ConnectionList';
export { ConnectionEditor } from './blocks/ConnectionEditor';
export type { ConnectionEditorProps, ConnectionEditorMode, OAuthProviderInfo } from './blocks/ConnectionEditor';
export { SkillBrowser } from './blocks/SkillBrowser';
export type { SkillBrowserSlots, SkillBrowserProps, SkillScope } from './blocks/SkillBrowser';
export { TemplateBrowser } from './blocks/TemplateBrowser';
export type { TemplateBrowserSlots, TemplateBrowserProps } from './blocks/TemplateBrowser';
export { SettingsSection } from './blocks/SettingsSection';
export type { SettingsSectionProps } from './blocks/SettingsSection';
export { SecretsManager } from './blocks/SecretsManager';
export type { SecretsManagerProps } from './blocks/SecretsManager';
export { ProvidersManager } from './blocks/ProvidersManager';
export type { ProvidersManagerProps } from './blocks/ProvidersManager';
export { ProfileEditor } from './blocks/ProfileEditor';
export type { ProfileEditorProps } from './blocks/ProfileEditor';
export { AppearancePicker } from './blocks/AppearancePicker';
export type { AppearancePickerProps } from './blocks/AppearancePicker';

// Tier-2 blocks — layout shell (Task 10)
export { DashboardLayout } from './blocks/DashboardLayout';
export type { DashboardLayoutProps } from './blocks/DashboardLayout';
export { DistriSidebar } from './blocks/DistriSidebar';
export type { DistriSidebarProps } from './blocks/DistriSidebar';

// Tier-3 pages (Task 11)
export { AgentsPage } from './pages/AgentsPage';
export { NewAgentPage } from './pages/NewAgentPage';
export { ChatPage } from './pages/ChatPage';
export { ThreadsPage } from './pages/ThreadsPage';
export { ThreadDetailPage } from './pages/ThreadDetailPage';
export { CopilotPage } from './pages/CopilotPage';

// Tier-3 pages (Task 12)
export { TracesPage } from './pages/TracesPage';
export { UsagePage } from './pages/UsagePage';
export { ConnectionsPage } from './pages/ConnectionsPage';
export { NewConnectionPage } from './pages/NewConnectionPage';
export { EditConnectionPage } from './pages/EditConnectionPage';
export { OAuthCallbackPage } from './pages/OAuthCallbackPage';

// Tier-3 pages (Task 13)
export { SettingsPage } from './pages/SettingsPage';
export type { SettingsPageProps } from './pages/SettingsPage';
export { SettingsLayoutPage } from './pages/SettingsLayoutPage';
export type { SettingsLayoutPageProps } from './pages/SettingsLayoutPage';
export { SetupPage } from './pages/SetupPage';
export { CliLoginPage } from './pages/CliLoginPage';

// Cloud-IA pages (sidebar parity)
export { HomePage } from './pages/HomePage';
export { WorkspaceAgentsPage } from './pages/WorkspaceAgentsPage';
export { WorkspaceSkillsPage } from './pages/WorkspaceSkillsPage';
export { WorkspaceTemplatesPage } from './pages/WorkspaceTemplatesPage';
export { SessionsPage } from './pages/SessionsPage';
export { ChannelsPage } from './pages/ChannelsPage';
export { UsersPage } from './pages/UsersPage';

// Misc blocks
export { ApiKeysManager } from './blocks/ApiKeysManager';
export type { ApiKeysManagerProps } from './blocks/ApiKeysManager';
export { NotAvailableInOss } from './blocks/NotAvailableInOss';
export type { NotAvailableInOssProps } from './blocks/NotAvailableInOss';

// Route factory (Task 14)
export { homeRoutes } from './routes/homeRoutes';
export type { HomeRoutePath, HomeRoutesOverrides, HomeRoutesOptions } from './routes/homeRoutes';
