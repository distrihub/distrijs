import type { ReactNode } from 'react';

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

export type DistriHomeConfig = {
  features?: HomeFeatures;
  slots?: HomeSlots;
  routes?: HomeRoutesConfig;
  onAction?: (action: HomeAction) => void;
};
