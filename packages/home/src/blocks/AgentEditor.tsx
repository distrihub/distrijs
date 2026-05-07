import { useMemo, useState } from 'react';
import { useAgentDefinitions, ChatInput } from '@distri/react';
import type { DistriPart } from '@distri/core';
import { useDistriHome } from '../provider/context';

export interface AgentEditorProps {
  /**
   * Called when the user submits a prompt to describe the new agent.
   * The parent page (Task 11) is responsible for navigation / routing.
   */
  onAction?: (a: { type: 'agent.created'; prompt: string; preferredAgentId?: string }) => void;
  className?: string;
}

/**
 * AgentEditor — Tier-2 block containing the "new agent" creation form.
 * Renders a ChatInput that lets users describe the agent they want to build.
 * Navigation / routing logic lives in the page layer (Task 11).
 */
export function AgentEditor({ onAction, className }: AgentEditorProps) {
  const { agents, loading } = useAgentDefinitions();
  const _home = useDistriHome();

  const [prompt, setPrompt] = useState('');

  const preferredAgent = useMemo(() => {
    if (!agents.length) return undefined;
    return (
      agents.find(
        (agent) =>
          agent.name === 'scripter' || agent.name?.toLowerCase() === 'scripter',
      ) || agents[0]
    );
  }, [agents]);

  const handleSend = (content: string | DistriPart[]) => {
    const text =
      typeof content === 'string'
        ? content
        : content.map((part) => (part.part_type === 'text' ? part.data : '')).join('\n');

    if (!text.trim() || !preferredAgent) return;

    onAction?.({
      type: 'agent.created',
      prompt: text.trim(),
      preferredAgentId: preferredAgent.name,
    });

    setPrompt('');
  };

  return (
    <div className={`flex h-full w-full items-center justify-center ${className ?? ''}`}>
      <div className="w-full max-w-2xl space-y-6 p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">New agent</p>
        </div>
        <ChatInput
          value={prompt}
          onChange={setPrompt}
          onSend={handleSend}
          placeholder="Describe the agent you want to build"
          disabled={!preferredAgent || loading}
          variant="hero"
        />
      </div>
    </div>
  );
}
