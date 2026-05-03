import type { ReactElement } from 'react';
import { Route } from 'react-router-dom';
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
  SettingsPage,
  SetupPage,
  CliLoginPage,
} from '../pages';

export type HomeRoutePath =
  | '/agents'
  | '/agents/new'
  | '/threads'
  | '/threads/:id'
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
  | '/setup'
  | '/cli-login';

export type HomeRoutesOverrides = Partial<Record<HomeRoutePath, ReactElement>>;

const DEFAULTS: Record<HomeRoutePath, ReactElement> = {
  '/agents': <AgentsPage />,
  '/agents/new': <NewAgentPage />,
  '/threads': <ThreadsPage />,
  '/threads/:id': <ThreadDetailPage />,
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
  '/settings': <SettingsPage />,
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
