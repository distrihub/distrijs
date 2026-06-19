import React, { useEffect, useState, useMemo, type ReactNode } from 'react';
import { Activity, ChevronLeft, Layers, ListChecks } from 'lucide-react';
import { Button, Skeleton } from '@distri/components';
import { useDistriHome } from '../provider/context';
import { useDistriHomeClient } from '../provider/context';

// ---------------------------------------------------------------------------
// Types (mirrors @evilmartians/agent-prism-types shapes we need)
// ---------------------------------------------------------------------------

export interface TraceSpanAttribute {
  key: string;
  value: {
    stringValue?: string;
    intValue?: string;
    doubleValue?: number;
    boolValue?: boolean;
  };
}

export interface TraceSpan {
  id: string;
  traceId?: string;
  title: string;
  type: string;
  input?: string;
  output?: string;
  raw?: string;
  duration: number;
  cost?: number;
  attributes?: TraceSpanAttribute[];
  children?: TraceSpan[];
}

export interface TraceSummary {
  traceId: string;
  name: string;
  startTimeNs: number;
  endTimeNs: number;
  spanCount: number;
  threadId: string | null;
  inputTokens: number;
  totalCost: number;
  stepCount: number;
  models: string[];
  agentId?: string;
  agentName?: string;
  agentVersion?: string;
  tags?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Slot + prop types
// ---------------------------------------------------------------------------

export interface TraceTimelineSlots {
  /** Cloud injects tenant-level filter controls above the list */
  extraFilters?: ReactNode;
}

export interface TraceTimelineProps {
  /** If provided, loads spans for a specific thread inline */
  threadId?: string;
  slots?: TraceTimelineSlots;
  onSelectSpan?: (span: TraceSpan) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function formatNsDuration(startNs: number, endNs: number): string {
  const ms = (endNs - startNs) / 1_000_000;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtCost(n: number): string {
  if (n === 0) return '$0';
  return `$${n.toFixed(n < 0.001 ? 6 : 4)}`;
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'just now';
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return s <= 1 ? 'just now' : `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// TraceRow
// ---------------------------------------------------------------------------

function TraceRow({
  trace,
  selected,
  onClick,
}: {
  trace: TraceSummary;
  selected: boolean;
  onClick: () => void;
}) {
  const startDate = new Date(trace.startTimeNs / 1_000_000);
  const duration =
    trace.endTimeNs > trace.startTimeNs
      ? formatNsDuration(trace.startTimeNs, trace.endTimeNs)
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group w-full text-left px-4 py-3 border-b border-border/40 transition hover:bg-muted/30',
        selected ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
            {trace.name || trace.traceId.slice(0, 8)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {trace.models.length > 0 && (
              <span className="font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px]">
                {trace.models[0]}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {trace.spanCount}
            </span>
            {trace.stepCount > 0 && (
              <span className="flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                {trace.stepCount}
              </span>
            )}
            {trace.inputTokens > 0 && (
              <span className="font-mono">
                {trace.inputTokens >= 1000
                  ? `${(trace.inputTokens / 1000).toFixed(1)}k`
                  : trace.inputTokens}
                ↑
              </span>
            )}
            {trace.totalCost > 0 && (
              <span className="font-mono">{fmtCost(trace.totalCost)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 text-xs text-muted-foreground">
          <span>{relativeTime(startDate)}</span>
          {duration && <span className="font-mono">{duration}</span>}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main block
// ---------------------------------------------------------------------------

/**
 * TraceTimeline — displays a paginated list of traces.
 * Clicking a trace row calls onSelectSpan (Task 12 wires the TraceDetail panel).
 * Slot `extraFilters` lets the cloud inject tenant-scoped filter controls.
 */
export function TraceTimeline({ threadId, slots, onSelectSpan, className }: TraceTimelineProps) {
  const home = useDistriHome();
  const homeClient = useDistriHomeClient();

  const [traces, setTraces] = useState<TraceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  const extraFilters = slots?.extraFilters ?? home.slots?.traceFilters;

  useEffect(() => {
    if (!homeClient) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotConfigured(false);

    homeClient
      .getTraces(threadId ? { thread_id: threadId } : undefined)
      .then((data) => {
        if (cancelled) return;
        if (data.not_configured) {
          setNotConfigured(true);
          setTraces([]);
          return;
        }
        setTraces(
          data.traces.map((r) => ({
            traceId: r.traceId,
            name: r.name,
            startTimeNs: r.startTimeNs,
            endTimeNs: r.endTimeNs,
            spanCount: r.spanCount,
            threadId: r.threadId,
            inputTokens: r.inputTokens,
            totalCost: r.totalCost,
            stepCount: r.stepCount,
            models: r.models,
          })),
        );
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load traces');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [homeClient, threadId]);

  const stats = useMemo(() => {
    if (traces.length === 0) return null;
    const totalTokens = traces.reduce((s, t) => s + t.inputTokens, 0);
    const totalCost = traces.reduce((s, t) => s + t.totalCost, 0);
    return { count: traces.length, totalTokens, totalCost };
  }, [traces]);

  return (
    <div className={`flex flex-col min-h-0 ${className ?? ''}`}>
      {/* Filters slot */}
      {extraFilters && (
        <div className="px-4 py-2 border-b border-border/50">{extraFilters}</div>
      )}

      {/* Summary strip */}
      {stats && !loading && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border/40 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {stats.count} trace{stats.count !== 1 ? 's' : ''}
          </span>
          {stats.totalTokens > 0 && (
            <span className="font-mono">
              {stats.totalTokens >= 1000
                ? `${(stats.totalTokens / 1000).toFixed(1)}k`
                : stats.totalTokens}
              ↑ tokens
            </span>
          )}
          {stats.totalCost > 0 && (
            <span className="font-mono">{fmtCost(stats.totalCost)}</span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && (
          <div className="flex flex-col gap-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-md w-full" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center h-40 px-6 text-center">
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {!loading && !error && notConfigured && (
          <div className="flex flex-col items-center justify-center h-56 gap-3 px-6 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">Tracing is not configured</p>
            <p className="text-xs text-muted-foreground max-w-md">
              This server has no span store wired up. Configure an OpenTelemetry
              backend (e.g. ClickHouse, Tempo) to start collecting traces.
            </p>
          </div>
        )}

        {!loading && !error && !notConfigured && traces.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 px-6 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No traces found</p>
          </div>
        )}

        {!loading && !error && traces.length > 0 && (
          <div>
            {traces.map((trace) => (
              <TraceRow
                key={trace.traceId}
                trace={trace}
                selected={selectedTraceId === trace.traceId}
                onClick={() => {
                  setSelectedTraceId(trace.traceId);
                  // TraceDetail block will be wired up via page assembly (Task 12)
                  // Pass a minimal span-like object so onSelectSpan callers get an ID
                  onSelectSpan?.({
                    id: trace.traceId,
                    title: trace.name || trace.traceId,
                    type: 'trace',
                    duration: (trace.endTimeNs - trace.startTimeNs) / 1_000_000,
                    cost: trace.totalCost,
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
