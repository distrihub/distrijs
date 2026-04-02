import React, { useState } from 'react';
import { TodoItem } from '@distri/core';
import { ChevronRight, ChevronDown, CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface TodosCompactProps {
  todos: TodoItem[];
  className?: string;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'done') return <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />;
  if (status === 'in_progress') return <Loader2 className="h-3 w-3 text-primary animate-spin flex-shrink-0" />;
  return <Circle className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
}

export const TodosCompact: React.FC<TodosCompactProps> = ({ todos, className = '' }) => {
  const [expanded, setExpanded] = useState(false);
  if (!todos || todos.length === 0) return null;

  const done = todos.filter(t => t.status === 'done').length;
  const inProgress = todos.find(t => t.status === 'in_progress');
  const pct = Math.round((done / todos.length) * 100);

  return (
    <div className={`rounded-md border border-border overflow-hidden ${className}`}>
      <div
        className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {inProgress
          ? <Loader2 className="h-3 w-3 text-primary animate-spin flex-shrink-0" />
          : <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
        }
        <span className="text-xs text-muted-foreground flex-1 truncate">
          {inProgress ? inProgress.content : `${done} of ${todos.length} tasks`}
        </span>
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
        </div>
      )}
    </div>
  );
};

export default TodosCompact;
