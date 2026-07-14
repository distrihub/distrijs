import { useMemo, useRef, useState } from 'react';
import { DistriProvider, Chat } from '@distri/react';
import DataReconciliationGrid, { DataReconciliationGridRef } from './DataReconciliationGrid';
import { getReconciliationTools } from './tools';

const distriConfig = {
  baseUrl: import.meta.env.VITE_DISTRI_API_URL ?? 'http://localhost:8080',
  clientId: import.meta.env.VITE_DISTRI_CLIENT_ID,
  workspaceId: import.meta.env.VITE_DISTRI_WORKSPACE_ID,
};

export function App() {
  const gridRef = useRef<DataReconciliationGridRef | null>(null);
  const [threadId] = useState(() => `reconciliation-${Date.now()}`);

  const tools = useMemo(() => getReconciliationTools(gridRef), []);

  return (
    <DistriProvider config={distriConfig}>
      <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <DataReconciliationGrid ref={gridRef} />
        </div>
        <div style={{ width: '380px', borderLeft: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
          <Chat
            agentId="reconciliation_agent"
            threadId={threadId}
            externalTools={tools}
            theme="dark"
          />
        </div>
      </div>
    </DistriProvider>
  );
}
