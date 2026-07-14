import { useMemo, useRef, useState } from 'react';
import { Chat } from '@distri/react';
import { DistriTokenProvider } from './DistriTokenProvider';
import DataReconciliationGrid, { DataReconciliationGridRef } from './DataReconciliationGrid';
import { getReconciliationTools } from './tools';

export function App() {
  const gridRef = useRef<DataReconciliationGridRef | null>(null);
  const [threadId] = useState(() => `reconciliation-${Date.now()}`);

  const tools = useMemo(() => getReconciliationTools(gridRef), []);

  return (
    <DistriTokenProvider>
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
    </DistriTokenProvider>
  );
}
