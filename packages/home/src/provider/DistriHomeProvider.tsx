import { type ReactNode } from 'react';
import { DistriHomeContext } from './context';
import type { DistriHomeConfig } from './types';
import { setApiHomeClient } from '../lib/api';
import { PageHeaderProvider } from '../components/PageHeader';

export function DistriHomeProvider({
  config,
  children,
}: {
  config: DistriHomeConfig;
  children: ReactNode;
}) {
  // Bind the lib/api singleton so workspace files copied verbatim from
  // cloud (which call `listAgents()`/`getSkill()` etc. as module-level
  // functions) can resolve to this provider's homeClient.
  //
  // Set synchronously during render — child effects flush BEFORE parent
  // effects (bottom-up), so a useEffect here would leave _client null
  // when WorkspacePage's tree-loader fires on mount.
  //
  // No cleanup: a useEffect cleanup that nulls the singleton runs as part
  // of React 18 Strict Mode's "double-mount" simulation, which would leave
  // _client = null in the window between cleanup and re-render — long
  // enough for WorkspacePage's re-fired effect to throw and silently
  // resolve to []. The singleton is process-global; tearing it down on
  // unmount adds no safety and breaks Strict Mode.
  setApiHomeClient(config.homeClient ?? null);

  return (
    <DistriHomeContext.Provider value={config}>
      <PageHeaderProvider>{children}</PageHeaderProvider>
    </DistriHomeContext.Provider>
  );
}
