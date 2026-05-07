import type { ReactNode } from 'react';
import type { DistriHomeClient } from '../DistriHomeClient';

export type HomeFeatures = {
  traces?: { exportCsv?: boolean };
  workspace?: { switcher?: boolean };
  usage?: { plansCta?: boolean };
};

export type HomeSlots = {
  header?: ReactNode;
  sidebarPrepend?: ReactNode;
  sidebarAppend?: ReactNode;
  emptyAgentsCta?: ReactNode;
  agentRowActions?: (agentId: string) => ReactNode;
  threadRowActions?: (threadId: string) => ReactNode;
  traceFilters?: ReactNode;
};

export type HomeRoutesConfig = {
  basename?: string;
  prefix?: string;
};

export type HomeAction =
  | { type: 'agent.created'; id: string }
  | { type: 'agent.deleted'; id: string }
  | { type: 'thread.opened'; id: string }
  | { type: 'connection.linked'; id: string };

/** Legacy navigation paths config for components that still use navigationPaths. */
export type HomeNavigationPaths = {
  agentDetails?: (agentId: string) => string;
};

/** Legacy homeWidget config for the Home dashboard. */
export type HomeWidget = {
  id: string;
  render: () => ReactNode;
};

export type DistriHomeConfig = {
  features?: HomeFeatures;
  slots?: HomeSlots;
  routes?: HomeRoutesConfig;
  onAction?: (action: HomeAction) => void;
  /** The DistriHomeClient used by blocks/pages to fetch data. */
  homeClient?: DistriHomeClient;
  /** Custom navigation path generators (used by Home dashboard and AgentDetails). */
  navigationPaths?: HomeNavigationPaths;
  /** Custom widgets to add to the Home page overview row. */
  homeWidgets?: HomeWidget[];
  /**
   * Navigation callback. Provide this when the consumer wants @distri/home
   * components to navigate via a custom router integration.
   * @deprecated Prefer useNavigate() from react-router-dom in each component.
   */
  navigate?: (path: string) => void;
  /**
   * Custom tabs to add to the Agent Details page.
   */
  customTabs?: {
    id: string;
    label: string;
    icon?: ReactNode;
    render: (props: { agentId: string }) => ReactNode;
  }[];
};
