import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useDistri } from '@distri/react';
import type { AgentDefinition } from '@distri/core';
import { Bot, Workflow, Globe, ArrowRight, Clock, TrendingUp, MessageSquare } from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Skeleton,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@distri/components';
import { useDistriHome } from '../provider/context';

export interface AgentListSlots {
  /** Per-row action buttons rendered in the card footer */
  rowActions?: (agentId: string) => ReactNode;
  /** Content rendered when agent list is empty */
  emptyCta?: ReactNode;
}

export interface AgentListProps {
  slots?: AgentListSlots;
  onAction?: (a: { type: 'agent.deleted'; id: string } | { type: 'agent.selected'; id: string }) => void;
  className?: string;
}

function getAgentIcon(agent: AgentDefinition) {
  if (
    agent.agent_type === 'sequential_workflow_agent' ||
    agent.agent_type === 'dag_workflow_agent' ||
    agent.agent_type === 'custom_agent'
  ) {
    return <Workflow className="h-6 w-6 text-primary" />;
  }
  return <Bot className="h-6 w-6 text-primary" />;
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/** Compact list item for Recently Used / Most Popular sections */
function AgentListItem({ agent, onClick }: { agent: AgentDefinition; onClick: () => void }) {
  const stats = (agent as any).stats || {};
  const threadCount = stats.thread_count || 0;
  const description =
    (agent as any).config?.description ||
    agent.description ||
    '';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-muted/40"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Bot className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
          {agent.name}
        </p>
        {description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
        <MessageSquare className="h-3 w-3" />
        <span>{threadCount}</span>
      </div>
    </button>
  );
}

type AgentsGridProps = {
  agents: AgentDefinition[];
  renderCard: (agent: AgentDefinition) => ReactNode;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  emptyMessage?: string;
};

function AgentsGrid({
  agents,
  renderCard,
  total,
  page,
  pageSize,
  onPageChange,
  emptyMessage,
}: AgentsGridProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-col gap-4">
      {total === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border/40 bg-card/40 px-6 py-10 text-center">
          <p className="text-lg font-medium text-muted-foreground">{emptyMessage || 'No agents found.'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => renderCard(agent))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-end pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              Prev
            </Button>
            <span>
              {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * AgentList — Tier-2 block that renders the agents grid with tabs (workspace / system / discover).
 * Does NOT include the full-page header/layout chrome — that belongs in Task 11 pages.
 */
export function AgentList({ slots, onAction, className }: AgentListProps) {
  // This is an admin/workspace surface: it renders Distri-only fields
  // (is_workspace, is_system, published, stats, config, workspace_slug) that
  // the lightweight A2A agent cards do NOT carry, so it loads the full
  // AgentDefinition list directly via the client's getAgents() — the bulk
  // card endpoint isn't enough here.
  const { client } = useDistri();
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const home = useDistriHome();

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    setLoading(true);
    client
      .getAgents()
      .then((defs) => {
        if (!cancelled) setAgents(defs);
      })
      .catch((err) => {
        console.error('[home/AgentList] Failed to fetch agent definitions:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const emptyCta = slots?.emptyCta ?? home.slots?.emptyAgentsCta;

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'workspace' | 'system' | 'discover'>('workspace');
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const searchTerm = search.trim().toLowerCase();

  const recentlyUsedAgents = useMemo(() => {
    return [...agents]
      .filter((a: any) => a.stats?.last_used_at)
      .sort((a: any, b: any) => {
        const aTime = new Date(a.stats?.last_used_at || 0).getTime();
        const bTime = new Date(b.stats?.last_used_at || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 4);
  }, [agents]);

  const mostPopularAgents = useMemo(() => {
    return [...agents]
      .filter((a: any) => (a.stats?.thread_count || 0) > 0)
      .sort((a: any, b: any) => (b.stats?.thread_count || 0) - (a.stats?.thread_count || 0))
      .slice(0, 4);
  }, [agents]);

  const visibleAgents = useMemo(() => {
    if (!searchTerm) return agents;
    return agents.filter((agent) => agent.name?.toLowerCase().includes(searchTerm));
  }, [agents, searchTerm]);

  const workspaceAgents = useMemo(
    () =>
      visibleAgents
        // OSS servers don't tag agents with is_workspace / is_system, so an
        // agent with neither flag is shown in Workspace by default. Cloud
        // tags every agent, so this branch is a no-op there.
        .filter((agent) => agent.is_workspace || (!agent.is_workspace && !agent.is_system))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
    [visibleAgents],
  );

  const systemAgents = useMemo(
    () =>
      visibleAgents
        .filter((agent) => agent.is_system)
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
    [visibleAgents],
  );

  const discoverAgents = useMemo(
    () =>
      visibleAgents
        .filter((agent) => (agent as any).published && !agent.is_owner && !agent.is_system)
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
    [visibleAgents],
  );

  const handleSelectAgent = (agent: AgentDefinition) => {
    onAction?.({ type: 'agent.selected', id: agent.name });
  };

  const renderAgentCard = (agent: AgentDefinition) => {
    const description =
      (agent as any).config?.description ||
      agent.description ||
      'No description provided';

    const isPublished =
      agent.is_owner === false || (agent as any).published === true;

    return (
      <Card
        key={agent.name}
        className="group border border-border/25 bg-card/90 text-foreground shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
      >
        <CardContent className="flex h-full flex-col gap-4 p-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20"
              onClick={() => handleSelectAgent(agent)}
            >
              <Avatar>
                <AvatarImage src={(agent as any).icon_url} />
                <AvatarFallback className="bg-transparent text-primary">
                  {getAgentIcon(agent)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <p
                  className="cursor-pointer text-base font-semibold leading-6 text-foreground line-clamp-1 break-words hover:underline"
                  title={agent.name}
                  onClick={() => handleSelectAgent(agent)}
                >
                  {!(agent as any).is_workspace && (agent as any).workspace_slug ? (
                    <span className="text-muted-foreground font-normal">{(agent as any).workspace_slug}/</span>
                  ) : null}
                  {agent.name}
                </p>
                {isPublished ? (
                  <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                    <Globe className="h-3 w-3" />
                    <span>Public</span>
                  </div>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2" title={description}>
                {description}
              </p>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-end gap-1">
            {/* Slot-injected row actions (e.g. clone/delete/publish from cloud UI) */}
            {slots?.rowActions
              ? slots.rowActions(agent.name)
              : home.slots?.agentRowActions
              ? home.slots.agentRowActions(agent.name)
              : null}
            {/* Default open button */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSelectAgent(agent)}
                    className="h-8 w-8 p-0 rounded-lg hover:bg-muted flex-shrink-0"
                    title="Open agent"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Open</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className={`flex justify-center py-12 ${className ?? ''}`}>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!agents.length) {
    return (
      <div className={`flex flex-col items-center gap-3 text-center text-muted-foreground ${className ?? ''}`}>
        <p>No agents found. Create a new agent to get started.</p>
        {emptyCta}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className ?? ''}`}>
      {/* Recently Used & Most Popular */}
      {(recentlyUsedAgents.length > 0 || mostPopularAgents.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {recentlyUsedAgents.length > 0 && (
            <section className="rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/60 px-5 py-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold">Recently Used</h3>
              </div>
              <div className="divide-y divide-border/60">
                {recentlyUsedAgents.map((agent) => (
                  <AgentListItem
                    key={agent.name}
                    agent={agent}
                    onClick={() => handleSelectAgent(agent)}
                  />
                ))}
              </div>
            </section>
          )}
          {mostPopularAgents.length > 0 && (
            <section className="rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/60 px-5 py-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold">Most Popular</h3>
              </div>
              <div className="divide-y divide-border/60">
                {mostPopularAgents.map((agent) => (
                  <AgentListItem
                    key={agent.name}
                    agent={agent}
                    onClick={() => handleSelectAgent(agent)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Search + Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search agents by name…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-[260px]"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: string) => { setActiveTab(v as typeof activeTab); setPage(1); }} className="w-full">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
          <TabsList className="h-9 bg-muted/50">
            <TabsTrigger value="workspace" className="text-xs">
              Workspace
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {workspaceAgents.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="system" className="text-xs">
              System
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {systemAgents.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="text-xs">
              Discover
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {discoverAgents.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="workspace" className="mt-4">
          <AgentsGrid
            agents={paginate(workspaceAgents, page, pageSize)}
            total={workspaceAgents.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            renderCard={renderAgentCard}
            emptyMessage="No agents in this workspace yet. Create one to get started."
          />
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <AgentsGrid
            agents={paginate(systemAgents, page, pageSize)}
            total={systemAgents.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            renderCard={renderAgentCard}
            emptyMessage="No system agents available."
          />
        </TabsContent>

        <TabsContent value="discover" className="mt-4">
          <AgentsGrid
            agents={paginate(discoverAgents, page, pageSize)}
            total={discoverAgents.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            renderCard={renderAgentCard}
            emptyMessage="No published agents to discover yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
