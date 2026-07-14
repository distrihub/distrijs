import { useCallback, useMemo, useRef, useState } from 'react';
import { DistriProvider, Chat } from '@distri/react';
import type { DistriMessage } from '@distri/core';
import IncidentForm, { IncidentFormRef } from './IncidentForm';
import { getFormHtml, getFormTools } from './tools';

const distriConfig = {
  baseUrl: import.meta.env.VITE_DISTRI_API_URL ?? 'http://localhost:8080',
  clientId: import.meta.env.VITE_DISTRI_CLIENT_ID,
  workspaceId: import.meta.env.VITE_DISTRI_WORKSPACE_ID,
};

export function App() {
  const formRef = useRef<IncidentFormRef | null>(null);
  const [threadId] = useState(() => `form-filler-${Date.now()}`);

  const tools = useMemo(() => getFormTools(formRef), []);

  // Injects the form's HTML structure as context so the agent knows which
  // fields/options are available before it decides which tool to call.
  const beforeSendMessage = useCallback(async (message: DistriMessage): Promise<DistriMessage> => {
    const formContextPart = {
      part_type: 'text' as const,
      data: `[Form HTML for analysis]\n${getFormHtml()}`,
    };

    return {
      ...message,
      parts: [formContextPart, ...(message.parts || [])],
    };
  }, []);

  return (
    <DistriProvider config={distriConfig}>
      <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <IncidentForm ref={formRef} />
        </div>
        <div style={{ width: '380px', borderLeft: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
          <Chat
            agentId="form_filler_agent_v2"
            threadId={threadId}
            externalTools={tools}
            beforeSendMessage={beforeSendMessage}
            theme="dark"
          />
        </div>
      </div>
    </DistriProvider>
  );
}
