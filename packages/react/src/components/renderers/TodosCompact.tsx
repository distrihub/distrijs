import React, { useEffect, useRef, useState } from 'react';
import { TodoChange, TodoChangeKind, TodoItem, TodoStatus } from '@distri/core';
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  ArrowRight,
  Minus,
} from 'lucide-react';

interface TodosCompactProps {
  todos: TodoItem[];
  /**
   * Per-call diff from the latest `write_todos` invocation. When
   * non-empty, the most recent change is surfaced inline at the top
   * of the compact card — that's what the agent JUST changed, which
   * answers "what's happening?" better than dumping the full list.
   *
   * Optional for back-compat with consumers passing only `todos`.
   */
  changes?: TodoChange[];
  className?: string;
  /**
   * `card` (default) — full-width row that expands the list downward,
   * for use inside message flows.
   * `chip` — inline pill (icon + mini bar + n/m count) for single-line
   * footers; the list opens upward in a popover so it never pushes the
   * composer around.
   */
  variant?: 'card' | 'chip';
}

function StatusIcon({ status }: { status: TodoStatus | string }) {
  if (status === 'done') return <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />;
  if (status === 'in_progress') return <Loader2 className="h-3 w-3 text-primary animate-spin flex-shrink-0" />;
  return <Circle className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
}

/**
 * Render the latest change as a single line: `+ Wire up auth`,
 * `□ → ◐ Wire up auth`, or `- Old TODO`.
 *
 * We only show the *most recent* change so the line stays compact;
 * the full list is one click away in the expanded view.
 */
function ChangeIcon({ kind }: { kind: TodoChangeKind }) {
  if (kind === 'added')
    return <Plus className="h-3 w-3 text-primary flex-shrink-0" />;
  if (kind === 'removed')
    return <Minus className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
  return <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />;
}

export const TodosCompact: React.FC<TodosCompactProps> = ({ todos, changes, className = '', variant = 'card' }) => {
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // The chip popover floats over other footer content, so close it on
  // any outside click — the card variant expands in-flow and doesn't
  // need this.
  useEffect(() => {
    if (variant !== 'chip' || !expanded) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [variant, expanded]);

  if (!todos || todos.length === 0) return null;

  const done = todos.filter(t => t.status === 'done').length;
  const inProgress = todos.find(t => t.status === 'in_progress');
  const pct = Math.round((done / todos.length) * 100);

  // Pick the LAST change in the list — server appends in iteration
  // order so the trailing entry is the most recently mutated item
  // when there's only one mutation per call (the common case).
  const latestChange = changes && changes.length > 0 ? changes[changes.length - 1] : null;

  const todoList = (
    <>
      {todos.map(todo => (
        <div key={todo.id} className="flex items-start gap-2 text-xs">
          <StatusIcon status={todo.status} />
          <span className={
            todo.status === 'done'
              ? 'text-muted-foreground line-through'
              : todo.status === 'in_progress'
                ? 'text-foreground font-medium'
                : 'text-muted-foreground'
          }>
            {todo.content}
          </span>
        </div>
      ))}
    </>
  );

  if (variant === 'chip') {
    return (
      <div ref={rootRef} className={`relative flex-shrink-0 ${className}`}>
        {expanded && (
          <div className="absolute bottom-full right-0 mb-2 z-40 w-72 max-w-[80vw] rounded-lg border border-border bg-background shadow-lg px-3 py-2.5 space-y-1.5">
            {todoList}
          </div>
        )}
        {/* Quiet at rest — the row's other occupants (thinking dots, context
            dial) are borderless, so the chip only grows a soft pill on hover. */}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          title={inProgress ? inProgress.content : `${done} of ${todos.length} tasks`}
          className={`flex items-center gap-1.5 rounded-full px-1.5 py-0.5 transition-colors cursor-pointer select-none ${expanded ? 'bg-muted/60' : 'hover:bg-muted/60'}`}
        >
          {inProgress ? (
            <Loader2 className="h-3 w-3 text-primary animate-spin flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
          )}
          <div className="w-10 h-1 bg-muted rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground flex-shrink-0">{done}/{todos.length}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-md border border-border overflow-hidden ${className}`}>
      <div
        className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {latestChange ? (
          <>
            <ChangeIcon kind={latestChange.kind} />
            <span className="text-xs text-foreground flex-1 truncate">
              {latestChange.kind === 'status_changed' && latestChange.prev_status ? (
                <>
                  <span className="text-muted-foreground mr-1">
                    {iconForStatus(latestChange.prev_status)}→{iconForStatus(latestChange.status)}
                  </span>
                  {latestChange.content}
                </>
              ) : (
                latestChange.content
              )}
            </span>
          </>
        ) : (
          <>
            {inProgress ? (
              <Loader2 className="h-3 w-3 text-primary animate-spin flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
            )}
            <span className="text-xs text-muted-foreground flex-1 truncate">
              {inProgress ? inProgress.content : `${done} of ${todos.length} tasks`}
            </span>
          </>
        )}
        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden flex-shrink-0">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">{done}/{todos.length}</span>
        {expanded
          ? <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        }
      </div>
      {expanded && (
        <div className="border-t border-border bg-background px-3 py-2 space-y-1.5">
          {todoList}
        </div>
      )}
    </div>
  );
};

/**
 * Compact UTF-8 status glyph for inline change rendering. Mirrors
 * the icons we use in the expanded list (□ open, ◐ in-progress,
 * ■ done) so the visual vocabulary stays consistent.
 */
function iconForStatus(s: TodoStatus): string {
  if (s === 'done') return '■';
  if (s === 'in_progress') return '◐';
  return '□';
}

export default TodosCompact;
