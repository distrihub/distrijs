import { type KeyboardEvent, useCallback, useEffect, useState } from 'react';
import { useDistriHomeClient } from '../provider/context';
import { useDistriHome } from '../provider/context';
import type { SessionSummary } from '../DistriHomeClient';
import { ArrowLeft, ArrowRight, Clock, Database, Loader2, Search, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (seconds < 60) return rtf.format(-seconds, 'second');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.floor(hours / 24);
  return rtf.format(-days, 'day');
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SessionListProps {
  onAction?: (a: { type: 'session.selected'; id: string }) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// SessionList block
// ---------------------------------------------------------------------------

/**
 * SessionList — Tier-2 block that renders the sessions list with search,
 * pagination, and an inline detail slide-over panel.
 * Does NOT include full-page header chrome (Task 11–13 handle that).
 */
export function SessionList({ onAction, className }: SessionListProps) {
  const homeClient = useDistriHomeClient();
  const _home = useDistriHome();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [filterInput, setFilterInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Details slide-over
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<Record<string, unknown> | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load session details when selection changes
  useEffect(() => {
    if (!selectedSessionId || !homeClient) {
      setSessionDetails(null);
      return;
    }
    let cancelled = false;
    setLoadingDetails(true);
    homeClient
      .getSessionValues(selectedSessionId)
      .then((data) => { if (!cancelled) setSessionDetails(data as Record<string, unknown>); })
      .catch((e) => console.error('Failed to load session details', e))
      .finally(() => { if (!cancelled) setLoadingDetails(false); });
    return () => { cancelled = true; };
  }, [selectedSessionId, homeClient]);

  const fetchSessions = useCallback(async () => {
    if (!homeClient) return;
    setLoading(true);
    setError(null);
    try {
      const data = await homeClient.listSessions({
        threadId: activeFilter || undefined,
        limit,
        offset,
      });
      setSessions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [homeClient, activeFilter, limit, offset]);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const handleSearch = () => {
    setOffset(0);
    setActiveFilter(filterInput);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearFilter = () => {
    setFilterInput('');
    setActiveFilter('');
    setOffset(0);
  };

  const handleSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    onAction?.({ type: 'session.selected', id: sessionId });
  };

  if (!homeClient) {
    return <div className="p-6 text-destructive">Error: Home client not initialized</div>;
  }

  return (
    <div className={`flex flex-col gap-6 ${className ?? ''}`}>
      {/* Search row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by Thread ID... (Enter)"
            className="h-9 w-64 rounded-md border border-border/70 bg-card pl-9 pr-8 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {filterInput && (
            <button
              type="button"
              onClick={handleClearFilter}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-300/50 bg-amber-100/60 px-4 py-3 text-xs text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
          Error: {error}
        </div>
      )}

      {/* Sessions list */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="divide-y divide-border/60">
          {loading && sessions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-6 py-4 text-sm text-muted-foreground">No sessions found.</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.session_id}
                className="group flex cursor-pointer items-center justify-between gap-4 px-6 py-4 transition hover:bg-muted/40"
                onClick={() => handleSelect(session.session_id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-sm text-foreground">{session.session_id}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {session.keys.length > 0 ? (
                      <>
                        {session.keys.slice(0, 5).map((k) => (
                          <span
                            key={k}
                            className="rounded border border-border/60 bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                          >
                            {k}
                          </span>
                        ))}
                        {session.keys.length > 5 && (
                          <span className="text-xs text-muted-foreground">+{session.keys.length - 5} more</span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">No keys</span>
                    )}
                    {session.updated_at && (
                      <span
                        className="flex items-center gap-1 text-xs text-muted-foreground"
                        title={session.updated_at}
                      >
                        <Clock className="h-3 w-3" />
                        {timeAgo(session.updated_at)}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border/60 px-6 py-3">
          <span className="text-xs text-muted-foreground">
            Page {Math.floor(offset / limit) + 1}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              disabled={offset === 0 || loading}
              onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
            >
              <ArrowLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              disabled={sessions.length < limit || loading}
              onClick={() => setOffset((prev) => prev + limit)}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Session detail slide-over */}
      {selectedSessionId && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm"
          onClick={() => setSelectedSessionId(null)}
        >
          <div
            className="w-full max-w-2xl overflow-y-auto border-l bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Database className="h-5 w-5" />
                  Session Details
                </h2>
                <p className="mt-1 font-mono text-sm text-muted-foreground">{selectedSessionId}</p>
              </div>
              <button
                onClick={() => setSelectedSessionId(null)}
                className="rounded-full p-2 transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sessionDetails ? (
              <div className="space-y-6">
                {Object.entries(sessionDetails).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <h3 className="inline-block rounded bg-muted/40 px-2 py-1 text-sm font-medium text-foreground">
                      {key}
                    </h3>
                    <div className="overflow-x-auto rounded-md border bg-muted/20 p-4">
                      <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
                {Object.keys(sessionDetails).length === 0 && (
                  <div className="py-10 text-center text-muted-foreground">
                    No values stored in this session.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-destructive">Failed to load details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
