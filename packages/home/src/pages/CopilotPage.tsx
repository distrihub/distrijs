import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chat, useAgent, useChatMessages, useModels } from '@distri/react';
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
import { CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';

const GATEWAY_AGENT = 'distri';
const MODEL_STORAGE_KEY = 'distri-selected-model';
const THREAD_STORAGE_KEY = 'distri-home-thread';

/**
 * CopilotPage — Tier-3 page for the Distri gateway/copilot interface.
 *
 * URL params: none — thread state is persisted to localStorage.
 *
 * Cloud-specific simplifications:
 *   - `useTracesStore` / `openTrace` removed (cloud-only Zustand store).
 *   - `executeApiRequest` / `distri_request` external tool removed; that tool
 *     is a cloud-specific capability that authenticates to the cloud API.
 *     TODO: expose via DistriHomeProvider slot (externalTools) so consumers can
 *     inject it without coupling the OSS package to the cloud implementation.
 */
export function CopilotPage() {
  const [threadId, setThreadId] = useState<string>(
    () => localStorage.getItem(THREAD_STORAGE_KEY) ?? crypto.randomUUID(),
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem(MODEL_STORAGE_KEY) ?? 'auto',
  );
  const { providers, loading: modelsLoading } = useModels();
  const {
    agent,
    loading: agentLoading,
    error: agentError,
  } = useAgent({ agentIdOrDef: GATEWAY_AGENT });
  const { messages, isLoading: messagesLoading } = useChatMessages({
    agent: agent ?? undefined,
    threadId,
  });

  // Persist threadId to localStorage
  useEffect(() => {
    localStorage.setItem(THREAD_STORAGE_KEY, threadId);
  }, [threadId]);

  const handleNewChat = () => setThreadId(crypto.randomUUID());

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

  if (agentLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading Distri Gateway…</p>
        </div>
      </div>
    );
  }

  if (agentError || !agent) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-lg">!</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Gateway Agent Unavailable
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The distri agent could not be loaded. Make sure it is registered as
            a system agent.
          </p>
          {agentError && (
            <p className="mt-2 text-xs text-destructive">{String(agentError)}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <svg
              className="h-4 w-4 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Distri</h1>
            <p className="text-xs text-muted-foreground">
              Manage your platform through conversation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedModel}
            onValueChange={handleModelChange}
            disabled={modelsLoading}
          >
            <SelectTrigger className="h-8 min-w-[160px] border-border/70 bg-background text-xs">
              <SelectValue>{selectedModelLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              {providers.map((provider, idx) => (
                <SelectGroup key={provider.provider_id}>
                  {idx > 0 && <SelectSeparator />}
                  <SelectLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                    {provider.configured ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground/50" />
                    )}
                    {provider.provider_label}
                    {!provider.configured && (
                      <span className="text-[10px] font-normal text-muted-foreground/50">
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
          <button
            onClick={handleNewChat}
            className="flex items-center justify-center rounded-md border border-border/70 p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="New conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>
      {messagesLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Chat
          key={threadId}
          agent={agent}
          threadId={threadId}
          initialMessages={messages}
          theme="dark"
          getMetadata={getMetadata}
          executionOptions={{ autoExecute: true }}
        />
      </div>
    </div>
  );
}
