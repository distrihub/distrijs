import React from 'react';
import { TodoItem, TodoStatus } from '@distri/core';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export interface TodosDisplayProps {
  todos: TodoItem[];
  className?: string;
  title?: string;
}

const getStatusIcon = (status: TodoStatus) => {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />;
    case 'in_progress':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />;
    case 'open':
    default:
      return <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
  }
};

const getStatusStyles = (status: TodoStatus) => {
  switch (status) {
    case 'done':
      return 'text-muted-foreground line-through';
    case 'in_progress':
      return 'text-foreground font-medium';
    case 'open':
    default:
      return 'text-foreground';
  }
};

export const TodosDisplay: React.FC<TodosDisplayProps> = ({
  todos,
  className = '',
  title = 'Tasks',
}) => {
  if (!todos || todos.length === 0) {
    return null;
  }

  const completedCount = todos.filter(t => t.status === 'done').length;
  const inProgressCount = todos.filter(t => t.status === 'in_progress').length;
  const totalCount = todos.length;

  return (
    <div className={`rounded-lg border bg-card p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount} done
          {inProgressCount > 0 && ` (${inProgressCount} in progress)`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-start gap-2 text-sm"
          >
            {getStatusIcon(todo.status)}
            <span className={getStatusStyles(todo.status)}>
              {todo.content}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodosDisplay;
