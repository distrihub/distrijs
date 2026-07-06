/**
 * ContextRow — the single-line status strip that sits between the message
 * list and the composer: thinking indicator on the left, todos chip in the
 * middle, context dial on the right. Everything stays on ONE line; the
 * todos chip pops its list upward and the dial toggles the usage panel
 * above the row, so nothing reflows the composer.
 */

import { useState } from 'react';
import type { ContextBudget, TodoChange, TodoItem } from '@distri/core';
import { TodosCompact } from './renderers/TodosCompact';
import { LoadingStrip } from './renderers/LoadingStrip';
import { LoadingShimmer } from './renderers/ThinkingRenderer';
import { ContextChip, budgetRatio } from './ContextChip';
import { ContextUsagePanel, type CompactionLogItem } from './ContextUsagePanel';

export interface ContextRowProps {
  todos?: TodoItem[];
  todoChanges?: TodoChange[];
  isStreaming?: boolean;
  /** External (frontend-handled) tool calls still awaiting a result. */
  pendingToolCallCount?: number;
  /** Cycle words for the thinking indicator while streaming. */
  loadingWords?: string[];
  /** Context budget; omit (or no window size) to hide the dial. */
  contextBudget?: ContextBudget;
  compactions?: CompactionLogItem[];
  isCompacting?: boolean;
  className?: string;
}

export function ContextRow({
  todos,
  todoChanges,
  isStreaming = false,
  pendingToolCallCount = 0,
  loadingWords,
  contextBudget,
  compactions,
  isCompacting = false,
  className = '',
}: ContextRowProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const ratio = budgetRatio(contextBudget);
  const hasTodos = Boolean(todos && todos.length > 0);
  const hasThinking = isStreaming || pendingToolCallCount > 0;
  if (!hasTodos && !hasThinking && ratio == null) return null;

  return (
    <div className={className}>
      {ratio != null && panelOpen && (
        <ContextUsagePanel
          budget={contextBudget}
          compactions={compactions}
          isCompacting={isCompacting}
          className="mb-2"
        />
      )}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-1 min-w-0 overflow-hidden">
          {pendingToolCallCount > 0 ? (
            <LoadingShimmer
              showIcon
              className="text-xs sm:text-sm"
              text={`Waiting for ${pendingToolCallCount} tool response${pendingToolCallCount === 1 ? '' : 's'}…`}
            />
          ) : (
            isStreaming && <LoadingStrip words={loadingWords} />
          )}
        </div>
        {hasTodos && (
          <TodosCompact variant="chip" todos={todos!} changes={todoChanges} />
        )}
        {/* Capacity dial, kept a tiny donut — deliberately NOT a horizontal
            bar, which reads as run progress next to the streaming indicators. */}
        {ratio != null && (
          <ContextChip
            ratio={ratio}
            isCompacting={isCompacting}
            showLabel
            onClick={() => setPanelOpen((v) => !v)}
            className="shrink-0 pr-1"
          />
        )}
      </div>
    </div>
  );
}
