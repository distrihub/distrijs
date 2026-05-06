import type { ReactElement } from 'react';
import { Navigate, Route } from 'react-router-dom';
import {
  AgentsPage,
  NewAgentPage,
  ThreadsPage,
  ThreadDetailPage,
  ChatPage,
  CopilotPage,
  TracesPage,
  UsagePage,
  ConnectionsPage,
  NewConnectionPage,
  EditConnectionPage,
  OAuthCallbackPage,
  SetupPage,
  CliLoginPage,
  HomePage,
  WorkspaceAgentsPage,
  WorkspaceSkillsPage,
  WorkspaceTemplatesPage,
  SessionsPage,
  ChannelsPage,
  UsersPage,
  SettingsLayoutPage,
} from '../pages';

export type HomeRoutePath =
  | '/'
  | '/home'
  | '/agents'
  | '/agents/new'
  | '/workspace/agents'
  | '/workspace/skills'
  | '/workspace/templates'
  | '/threads'
  | '/threads/:id'
  | '/sessions'
  | '/channels'
  | '/users'
  | '/chat'
  | '/chat/:agentId'
  | '/copilot'
  | '/traces'
  | '/traces/:spanId'
  | '/usage'
  | '/connections'
  | '/connections/new'
  | '/connections/:connectionId/edit'
  | '/oauth/callback'
  | '/settings'
  | '/settings/secrets'
  | '/settings/models'
  | '/settings/models/providers'
  | '/settings/api-keys'
  | '/settings/usage'
  | '/setup'
  | '/cli-login';

export type HomeRoutesOverrides = Partial<Record<HomeRoutePath, ReactElement>>;

const DEFAULTS: Record<HomeRoutePath, ReactElement> = {
  '/': <Navigate to="/home" replace />,
  '/home': <HomePage />,
  '/agents': <Navigate to="/workspace/agents" replace />,
  '/agents/new': <NewAgentPage />,
  '/workspace/agents': <WorkspaceAgentsPage />,
  '/workspace/skills': <WorkspaceSkillsPage />,
  '/workspace/templates': <WorkspaceTemplatesPage />,
  '/threads': <ThreadsPage />,
  '/threads/:id': <ThreadDetailPage />,
  '/sessions': <SessionsPage />,
  '/channels': <ChannelsPage />,
  '/users': <UsersPage />,
  '/chat': <ChatPage />,
  '/chat/:agentId': <ChatPage />,
  '/copilot': <CopilotPage />,
  '/traces': <TracesPage />,
  '/traces/:spanId': <TracesPage />,
  '/usage': <UsagePage />,
  '/connections': <ConnectionsPage />,
  '/connections/new': <NewConnectionPage />,
  '/connections/:connectionId/edit': <EditConnectionPage />,
  '/oauth/callback': <OAuthCallbackPage />,
  '/settings': <Navigate to="/settings/models" replace />,
  '/settings/secrets': <SettingsLayoutPage activeSection="secrets" />,
  '/settings/models': <SettingsLayoutPage activeSection="models" />,
  '/settings/models/providers': <SettingsLayoutPage activeSection="models" />,
  '/settings/api-keys': <SettingsLayoutPage activeSection="apiKeys" />,
  '/settings/usage': <SettingsLayoutPage activeSection="usage" />,
  '/setup': <SetupPage />,
  '/cli-login': <CliLoginPage />,
};

export interface HomeRoutesOptions {
  /** Override specific page paths with custom components. */
  override?: HomeRoutesOverrides;
  /** Hide specific paths entirely. */
  hide?: HomeRoutePath[];
}

export function homeRoutes(opts?: HomeRoutesOptions): ReactElement[] {
  const overrides = opts?.override ?? {};
  const hidden = new Set(opts?.hide ?? []);
  const merged = { ...DEFAULTS, ...overrides };
  return (Object.keys(merged) as HomeRoutePath[])
    .filter((path) => !hidden.has(path))
    .map((path) => <Route key={path} path={path} element={merged[path]} />);
}
