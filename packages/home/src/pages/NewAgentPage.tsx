import { useNavigate } from 'react-router-dom';
import { Button } from '@distri/components';
import { AgentEditor } from '../blocks/AgentEditor';
import { useDistriHome } from '../provider/context';

/**
 * NewAgentPage — Tier-3 page for creating a new agent.
 * Wraps AgentEditor and handles navigation on submission.
 * Consumer app is responsible for wrapping this in a layout shell.
 */
export function NewAgentPage() {
  const nav = useNavigate();
  const home = useDistriHome();
  const prefix = home.routes?.prefix ?? '';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => nav(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Button>
        <h1 className="text-base font-semibold sm:text-lg">New Agent</h1>
      </div>
      <div className="flex-1">
        <AgentEditor
          onAction={(a) => {
            if (a.type === 'agent.created') {
              // Navigate to the preferred agent's chat with the prompt prefilled.
              // The agent detail / chat route is responsible for bootstrapping the
              // thread from the `prefill` search param.
              const params = new URLSearchParams();
              params.set('prefill', a.prompt);
              params.set('threadId', crypto.randomUUID());
              if (a.preferredAgentId) {
                nav(
                  `${prefix}/agents/${encodeURIComponent(a.preferredAgentId)}?${params.toString()}`,
                );
              } else {
                nav(`${prefix}/chat?${params.toString()}`);
              }
            }
          }}
        />
      </div>
    </div>
  );
}
