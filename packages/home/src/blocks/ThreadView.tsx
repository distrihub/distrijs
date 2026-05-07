import { useEffect, useState } from 'react';
import { Chat, useAgent } from '@distri/react';
import { useDistriHomeClient } from '../provider/context';
import { useDistriHome } from '../provider/context';
import { Loader2 } from 'lucide-react';

export interface ThreadViewProps {
  /** The thread ID to render */
  threadId: string;
  /**
   * If the agentId is already known (e.g. from routing params), pass it to
   * skip the thread-lookup round-trip.
   */
  agentId?: string;
  onAction?: (a: { type: 'thread.opened'; id: string }) => void;
  className?: string;
}

/**
 * ThreadView — Tier-2 block that loads and renders a single thread's chat
 * using @distri/react's <Chat> component.
 * The full-page layout / header shell belongs in Task 11 pages.
 */
export function ThreadView({ threadId, agentId: agentIdProp, onAction: _onAction, className }: ThreadViewProps) {
  const homeClient = useDistriHomeClient();
  const _home = useDistriHome();

  const [resolvedAgentId, setResolvedAgentId] = useState<string | null>(agentIdProp ?? null);
  const [loading, setLoading] = useState(!agentIdProp);
  const [error, setError] = useState<string | null>(null);

  // If agentId not provided, look it up from the thread list
  useEffect(() => {
    if (agentIdProp) {
      setResolvedAgentId(agentIdProp);
      setLoading(false);
      return;
    }

    if (!homeClient || !threadId) {
      setError('Missing thread ID or client.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    homeClient
      .listDetailedThreads({ limit: 100 })
      .then((response) => {
        const found = response.threads.find((t) => t.id === threadId);
        if (found?.agent_id) {
          setResolvedAgentId(found.agent_id);
        } else {
          setError('Thread not found.');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load thread.'))
      .finally(() => setLoading(false));
  }, [homeClient, threadId, agentIdProp]);

  const { agent, loading: agentLoading } = useAgent({
    agentIdOrDef: resolvedAgentId || '',
  });

  if (loading || agentLoading) {
    return (
      <div className={`flex flex-1 items-center justify-center text-sm text-muted-foreground ${className ?? ''}`}>
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading thread…
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className={`flex flex-1 items-center justify-center text-sm text-muted-foreground ${className ?? ''}`}>
        {error || 'Thread not found.'}
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full flex-col ${className ?? ''}`}>
      <Chat
        key={threadId}
        agent={agent}
        threadId={threadId}
        theme="auto"
      />
    </div>
  );
}
