import { describe, expect, it } from 'vitest';
import { childTaskIdSet, isChildTaskMessage } from '../components/renderers/taskGrouping';
import type { TaskState } from '../stores/chatStateStore';

const task = (id: string, parentTaskId?: string): TaskState =>
  ({ id, parentTaskId, childTaskIds: [], title: id, status: 'running' }) as unknown as TaskState;

const msg = (taskId?: string) => ({ taskId }) as never;

describe('childTaskIdSet', () => {
  it('collects only tasks with a parent', () => {
    const tasks = new Map<string, TaskState>([
      ['root', task('root')],
      ['fork-1', task('fork-1', 'root')],
      ['fork-2', task('fork-2', 'root')],
      ['grandchild', task('grandchild', 'fork-1')],
    ]);
    expect([...childTaskIdSet(tasks)].sort()).toEqual(['fork-1', 'fork-2', 'grandchild']);
  });
});

describe('isChildTaskMessage', () => {
  const childIds = new Set(['fork-1']);

  it('true for messages stamped with a child taskId', () => {
    expect(isChildTaskMessage(msg('fork-1'), childIds)).toBe(true);
  });

  it('false for root-task messages', () => {
    expect(isChildTaskMessage(msg('root'), childIds)).toBe(false);
  });

  it('false for messages without a taskId (user input, hydrated history)', () => {
    expect(isChildTaskMessage(msg(undefined), childIds)).toBe(false);
    expect(isChildTaskMessage({} as never, childIds)).toBe(false);
  });
});

describe('streamed text carries its task (regression: empty SubTaskCards)', () => {
  it('text_message_start stamps taskId/parentTaskId from the envelope', async () => {
    const { createChatStore } = await import('../stores/chatStateStore');
    const store = createChatStore();
    store.getState().addMessage({
      type: 'text_message_start',
      taskId: 'fork-1',
      parentTaskId: 'root',
      data: { message_id: 'mm1', role: 'assistant', is_final: false },
    } as never);
    const msg = store.getState().messages.find((m) => (m as { id?: string }).id === 'mm1') as {
      taskId?: string;
      parentTaskId?: string;
    };
    expect(msg?.taskId).toBe('fork-1');
    expect(msg?.parentTaskId).toBe('root');
    // …and the grouping filter routes it to the card, not the flat column.
    expect(isChildTaskMessage(msg as never, new Set(['fork-1']))).toBe(true);
  });
});

describe('hydrateTaskTree (history reload)', () => {
  it('rebuilds parent/child links from message routing fields', async () => {
    const { createChatStore } = await import('../stores/chatStateStore');
    const store = createChatStore();
    store.getState().hydrateTaskTree([
      { taskId: 'root' },
      { taskId: 'fork-1', parentTaskId: 'root' },
      { taskId: 'grand', parentTaskId: 'fork-1' },
      { taskId: 'fork-1', parentTaskId: 'root' }, // idempotent
    ]);
    const tasks = store.getState().tasks;
    expect(tasks.get('root')?.childTaskIds).toEqual(['fork-1']);
    expect(tasks.get('fork-1')?.parentTaskId).toBe('root');
    expect(tasks.get('fork-1')?.childTaskIds).toEqual(['grand']);
    expect([...childTaskIdSet(tasks)].sort()).toEqual(['fork-1', 'grand']);
  });

  it('never overwrites live task entries', async () => {
    const { createChatStore } = await import('../stores/chatStateStore');
    const store = createChatStore();
    store.getState().updateTask('fork-1', { id: 'fork-1', title: 'Live', status: 'running', childTaskIds: [], parentTaskId: 'root' } as never);
    store.getState().hydrateTaskTree([{ taskId: 'fork-1', parentTaskId: 'root' }]);
    expect(store.getState().tasks.get('fork-1')?.status).toBe('running');
    expect(store.getState().tasks.get('fork-1')?.title).toBe('Live');
  });
});

describe('per-task context budgets', () => {
  const budget = (conversation: number) => ({
    system_prompt_static_tokens: 1000,
    system_prompt_dynamic_tokens: 0,
    tool_schema_tokens: 500,
    deferred_tool_tokens: 0,
    skill_listing_tokens: 0,
    conversation_tokens: conversation,
    tool_result_tokens: 0,
    context_window_size: 100000,
    static_prefix_cache_hit: true,
  });

  it("routes budgets by task; a child's update never clobbers the root chip", async () => {
    const { createChatStore } = await import('../stores/chatStateStore');
    const store = createChatStore();
    store.getState().processMessage({
      type: 'context_budget_update',
      taskId: 'root-1',
      data: { budget: budget(10000), is_warning: false, is_critical: false },
    } as never, true);
    store.getState().processMessage({
      type: 'context_budget_update',
      taskId: 'fork-1',
      parentTaskId: 'root-1',
      data: { budget: budget(90000), is_warning: true, is_critical: true },
    } as never, true);
    const s = store.getState();
    expect(s.contextBudget?.conversation_tokens).toBe(10000); // root untouched
    expect(s.contextWarning).toBe(false);
    expect(s.contextBudgets.get('fork-1')?.conversation_tokens).toBe(90000);
    expect(s.contextBudgets.get('root-1')?.conversation_tokens).toBe(10000);
  });

  it('budgetRatio computes used/window', async () => {
    const { budgetRatio } = await import('../components/ContextChip');
    expect(budgetRatio(budget(48500) as never)).toBeCloseTo(0.5);
    expect(budgetRatio(undefined)).toBeNull();
  });
});
