import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Chat,
  useAgent,
  useAgentDefinitions,
  useAgentsByUsage,
  useChatMessages,
  useModels,
} from '@distri/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@distri/components';
import { CheckCircle2, Loader2, Plus, XCircle } from 'lucide-react';

const MODEL_STORAGE_KEY = 'distri-selected-model';

/**
 * ChatPage — Tier-3 page for chatting with an agent.
 *
 * URL params (search):
 *   ?id=<agentName>      — agent to chat with (auto-selects first if absent)
 *   ?threadId=<uuid>     — thread to resume (generates new UUID if absent)
 *
 * Cloud-specific simplifications:
 *   - `useTracesStore` / `openTrace` removed (cloud-only Zustand store)
 *   - `AgentSelector` from cloud's components replaced with a plain <select>
 *     using the same data from useAgentsByUsage + useAgentDefinitions.
 *   - Developer mode traces callback omitted (can be added via slots later).
 */
export function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { agents: usageAgents, loading: agentsLoading } = useAgentsByUsage();
  const { agents: agentDefs } = useAgentDefinitions();
  const { providers, loading: modelsLoading } = useModels();

  const agentIdParam = searchParams.get('id');
  const threadIdParam = searchParams.get('threadId');

  // Build sorted list: usage-ordered first, then remaining defs
  const agentOptions = useMemo(() => {
    const usageNames = new Set(usageAgents.map((a) => a.agent_name));
    const extra = agentDefs.filter((d) => d.name && !usageNames.has(d.name));
    return [
      ...usageAgents.map((a) => ({ id: a.agent_name, label: a.agent_name })),
      ...extra.map((d) => ({ id: d.name!, label: d.name! })),
    ];
  }, [usageAgents, agentDefs]);

  // Auto-select first agent if none in URL
  const defaultAgentId = useMemo(() => {
    if (agentIdParam) return agentIdParam;
    if (usageAgents.length > 0) return usageAgents[0].agent_name;
    return undefined;
  }, [agentIdParam, usageAgents]);

  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(
    agentIdParam ?? undefined,
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem(MODEL_STORAGE_KEY) ?? 'auto',
  );

  const { agent, loading: agentLoading } = useAgent({
    agentIdOrDef: selectedAgentId ?? '',
  });
  const threadId = useMemo(
    () => threadIdParam ?? crypto.randomUUID(),
    [threadIdParam],
  );
  const { messages, isLoading: messagesLoading } = useChatMessages({
    agent: agent ?? undefined,
    threadId: threadIdParam ?? undefined,
  });

  // Sync state with URL / auto-select first agent
  useEffect(() => {
    if (agentIdParam && agentIdParam !== selectedAgentId) {
      setSelectedAgentId(agentIdParam);
    } else if (!selectedAgentId && defaultAgentId) {
      setSelectedAgentId(defaultAgentId);
      const next = new URLSearchParams(searchParams);
      next.set('id', defaultAgentId);
      setSearchParams(next, { replace: true });
    }
  }, [agentIdParam, defaultAgentId, selectedAgentId, searchParams, setSearchParams]);

  // Ensure threadId is in URL
  useEffect(() => {
    if (!threadIdParam) {
      const next = new URLSearchParams(searchParams);
      next.set('threadId', threadId);
      setSearchParams(next, { replace: true });
    }
  }, [threadIdParam, threadId, searchParams, setSearchParams]);

  const handleAgentChange = (newId: string) => {
    setSelectedAgentId(newId);
    const next = new URLSearchParams(searchParams);
    if (newId) next.set('id', newId);
    else next.delete('id');
    next.set('threadId', crypto.randomUUID());
    setSearchParams(next);
  };

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    localStorage.setItem(MODEL_STORAGE_KEY, model);
  }, []);

  const selectedModelLabel = useMemo(() => {
    if (selectedModel === 'auto') return 'Auto';
    for (const provider of providers) {
      const model = provider.models.find((m) => m.id === selectedModel);
      if (model) return model.name;
    }
    return selectedModel;
  }, [selectedModel, providers]);

  const getMetadata = useCallback(async () => {
    if (selectedModel === 'auto') return {};
    return { definition_overrides: { model: selectedModel } };
  }, [selectedModel]);

  const handleNewChat = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set('threadId', crypto.randomUUID());
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex items-center gap-2">
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Agent
          </label>
          <select
            className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm text-slate-100 focus:outline-none"
            value={selectedAgentId ?? ''}
            disabled={agentsLoading}
            onChange={(e) => handleAgentChange(e.target.value)}
          >
            {agentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              Model
            </label>
            <Select
              value={selectedModel}
              onValueChange={handleModelChange}
              disabled={modelsLoading}
            >
              <SelectTrigger className="h-8 min-w-[180px] border-slate-700 bg-slate-900 text-sm text-slate-100">
                <SelectValue>{selectedModelLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                {providers.map((provider, idx) => (
                  <SelectGroup key={provider.provider_id}>
                    {idx > 0 && <SelectSeparator />}
                    <SelectLabel className="flex items-center gap-2 text-xs text-slate-400">
                      {provider.configured ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-slate-500" />
                      )}
                      {provider.provider_label}
                      {!provider.configured && (
                        <span className="text-[10px] font-normal text-slate-500">
                          (not configured)
                        </span>
                      )}
                    </SelectLabel>
                    {provider.models.map((model) => (
                      <SelectItem
                        key={model.id}
                        value={model.id}
                        disabled={!provider.configured}
                      >
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={handleNewChat}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </header>
      {(agentLoading || messagesLoading) && (
        <Loader2 className="h-5 w-5 animate-spin" />
      )}
      {!agentLoading && agent && (
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <Chat
            key={threadId}
            agent={agent}
            threadId={threadId}
            initialMessages={messages}
            theme="dark"
            getMetadata={getMetadata}
          />
        </div>
      )}
    </div>
  );
}
