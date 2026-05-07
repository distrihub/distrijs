import { useNavigate } from 'react-router-dom';
import { Button } from '@distri/components';
import { AgentList } from '../blocks/AgentList';
import { useDistriHome } from '../provider/context';

/**
 * AgentsPage — Tier-3 page that lists workspace agents.
 * Consumer app is responsible for wrapping this in a layout shell.
 */
export function AgentsPage() {
  const nav = useNavigate();
  const home = useDistriHome();
  const prefix = home.routes?.prefix ?? '';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Agents</h1>
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
