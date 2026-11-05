import { useMemo } from 'react';
import { buildAgentList, summarizeAgentList } from '@distri/state';
import type { AgentListOptions, AgentListRow, AgentListSummary } from '@distri/state';
import { useChatStateStore } from '../stores/chatStateStore';

export interface UseAgentListResult {
  /** The lead then its helpers, in the order they started. */
  rows: AgentListRow[];
  /** Helpers by state: running, failed, done, queued. */
  summary: AgentListSummary;
}

/**
 * Who is working on what, from the nearest chat store: one row per agent with
 * its status, duration, failure and what it is doing now. Live as helpers
 * start and finish. Must render inside a `<Chat>` / `useChat` /
 * `useTaskStreaming` subtree. `@distri/react-native` has the same hook.
 */
export function useAgentList(options: AgentListOptions = {}): UseAgentListResult {
  const tasks = useChatStateStore(s => s.tasks);
  const toolCalls = useChatStateStore(s => s.toolCalls);
  const { rootTaskId, helpersOnly, toolLabels, summaryOverrides } = options;
  return useMemo(() => {
    const rows = buildAgentList(tasks, toolCalls, { rootTaskId, helpersOnly, toolLabels, summaryOverrides });
    return { rows, summary: summarizeAgentList(rows) };
  }, [tasks, toolCalls, rootTaskId, helpersOnly, toolLabels, summaryOverrides]);
}
