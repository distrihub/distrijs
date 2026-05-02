import type { ReactNode } from 'react';
import { DistriHomeContext } from './context';
import type { DistriHomeConfig } from './types';

export function DistriHomeProvider({
  config,
  children,
}: {
  config: DistriHomeConfig;
  children: ReactNode;
}) {
  return (
    <DistriHomeContext.Provider value={config}>
      {children}
    </DistriHomeContext.Provider>
  );
}
