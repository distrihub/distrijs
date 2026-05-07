import { useNavigate } from 'react-router-dom';
import { Button } from '@distri/components';
import { Zap } from 'lucide-react';
import { AgentList } from '../blocks/AgentList';
import { useDistriHome } from '../provider/context';

/**
 * WorkspaceAgentsPage — list view of workspace agents.
 * Mounted at /workspace/agents in both OSS and cloud sidebar IA.
 */
export function WorkspaceAgentsPage() {
  const nav = useNavigate();
  const home = useDistriHome();
  const prefix = home.routes?.prefix ?? '';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <h1 className="text-base font-semibold sm:text-lg">Agents</h1>
        </div>
        <Button size="sm" onClick={() => nav(`${prefix}/agents/new`)}>
          New Agent
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <AgentList
          onAction={(a) => {
            if (a.type === 'agent.deleted') home.onAction?.(a);
            if (a.type === 'agent.selected')
              nav(`${prefix}/agents/${encodeURIComponent(a.id)}`);
          }}
        />
      </div>
    </div>
  );
}
