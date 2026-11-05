import { useMemo } from 'react';
import { useStore } from 'zustand';
import { buildAgentList, summarizeAgentList } from '@distri/state';
import type { AgentListOptions, AgentListRow, AgentListSummary, ChatStore, TaskState, ToolCallState } from '@distri/state';

export interface UseAgentListResult {
  /** The lead then its helpers, in the order they started. */
  rows: AgentListRow[];
  /** Helpers by state: running, failed, done, queued. */
  summary: AgentListSummary;
}

/**
 * Who is working on what, from the chat store: one row per agent with its
 * status, duration, failure and what it is doing now. Live as helpers start
 * and finish. `@distri/react` has the same hook, from the same model.
 */
export function useAgentList(store: ChatStore, options: AgentListOptions = {}): UseAgentListResult {
  const tasks = useStore(store, state => state.tasks) as Map<string, TaskState>;
  const toolCalls = useStore(store, state => state.toolCalls) as Map<string, ToolCallState>;
  const { rootTaskId, helpersOnly, toolLabels, summaryOverrides } = options;
  return useMemo(() => {
    const rows = buildAgentList(tasks, toolCalls, { rootTaskId, helpersOnly, toolLabels, summaryOverrides });
    return { rows, summary: summarizeAgentList(rows) };
  }, [tasks, toolCalls, rootTaskId, helpersOnly, toolLabels, summaryOverrides]);
}
