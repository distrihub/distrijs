import { describe, it, expect, beforeEach } from 'vitest';
import { createChatStore, type ChatStore } from '../stores/chatStateStore';
import type { DistriEvent } from '@distri/core';

/**
 * Regression suite for the task-tree event routing fix.
 *
 * Backstory: when a parent agent dispatches sub-agents via run_skill /
 * call_agent, every event from those forks now arrives at the FE with
 * `taskId` (the fork's task) AND `parentTaskId` (the dispatching task)
 * stamped on the envelope. Before this fix, the relay rewrote events
 * to the parent's task_id and the FE store treated all forks as
 * indistinguishable from the root run. Concrete failures these tests
 * lock in:
 *
 *   1. Sub-agent's `run_finished` MUST NOT close the wire stream
 *      (`isStreaming` stays true). Only the root run's finish does.
 *   2. Sub-agent's `run_finished` MUST NOT mark unrelated tool_calls
 *      as completed — only the calls scoped to its own taskId.
 *   3. `tool_calls` event populates `ToolCallState.taskId` from the
 *      envelope's taskId so per-task scoping works.
 *   4. Task tree (parent → children) is built idempotently.
 */
describe('chatStateStore — task-tree event routing', () => {
  // Each test gets a fresh, isolated store from the factory — the same
  // per-instance construction `useChat` uses. No global state to reset.
  let store: ChatStore;
  beforeEach(() => {
    store = createChatStore();
  });

  const ROOT = 'task-root-aaaaaaaa';
  const FORK1 = 'task-fork1-bbbbbbb';
  const FORK2 = 'task-fork2-ccccccc';

  function send(event: DistriEvent) {
    // processMessage takes DistriChatMessage which is a superset of DistriEvent;
    // any cast keeps the test ergonomic without dragging in encoder deps.
    store.getState().processMessage(event as any, true);
  }

  it('builds parent → child linkage from event.parentTaskId', () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    send({ type: 'run_started', taskId: FORK2, parentTaskId: ROOT, data: { taskId: FORK2 } } as any);

    const root = store.getState().getTaskById(ROOT);
    const fork1 = store.getState().getTaskById(FORK1);
    const fork2 = store.getState().getTaskById(FORK2);

    expect(root).toBeTruthy();
    expect(root!.parentTaskId).toBeUndefined();
    expect(root!.childTaskIds).toEqual(expect.arrayContaining([FORK1, FORK2]));
    expect(fork1!.parentTaskId).toBe(ROOT);
    expect(fork2!.parentTaskId).toBe(ROOT);
  });

  it('idempotent: replaying same events does not duplicate child linkage', () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);

    const root = store.getState().getTaskById(ROOT);
    expect(root!.childTaskIds.filter(id => id === FORK1).length).toBe(1);
  });

  it('attributes ToolCallState.taskId on tool_calls event', () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    send({
      type: 'tool_calls',
      taskId: FORK1,
      parentTaskId: ROOT,
      data: {
        tool_calls: [{ tool_call_id: 'call_x', tool_name: 'db_get', input: {} }],
      },
    } as any);

    const tc = store.getState().toolCalls.get('call_x');
    expect(tc).toBeTruthy();
    expect(tc!.taskId).toBe(FORK1);
  });

  it("getToolCallsByTaskId returns only that task's tool calls", () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    send({ type: 'run_started', taskId: FORK2, parentTaskId: ROOT, data: { taskId: FORK2 } } as any);

    send({
      type: 'tool_calls',
      taskId: FORK1,
      parentTaskId: ROOT,
      data: { tool_calls: [{ tool_call_id: 'a', tool_name: 'db_get', input: {} }] },
    } as any);
    send({
      type: 'tool_calls',
      taskId: FORK2,
      parentTaskId: ROOT,
      data: { tool_calls: [{ tool_call_id: 'b', tool_name: 'db_put', input: {} }] },
    } as any);

    const fork1Calls = store.getState().getToolCallsByTaskId(FORK1);
    const fork2Calls = store.getState().getToolCallsByTaskId(FORK2);
    expect(fork1Calls.map(c => c.tool_call_id)).toEqual(['a']);
    expect(fork2Calls.map(c => c.tool_call_id)).toEqual(['b']);
  });

  it("scopes run_finished cleanup to THIS task's tool calls", () => {
    // Seed two forks each with a pending external tool call.
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    send({ type: 'run_started', taskId: FORK2, parentTaskId: ROOT, data: { taskId: FORK2 } } as any);
    send({
      type: 'tool_calls',
      taskId: FORK1,
      parentTaskId: ROOT,
      data: { tool_calls: [{ tool_call_id: 'call_fork1', tool_name: 'db_get', input: {} }] },
    } as any);
    send({
      type: 'tool_calls',
      taskId: FORK2,
      parentTaskId: ROOT,
      data: { tool_calls: [{ tool_call_id: 'call_fork2', tool_name: 'db_get', input: {} }] },
    } as any);

    // Sanity: both pending.
    expect(store.getState().toolCalls.get('call_fork1')!.status).toBe('pending');
    expect(store.getState().toolCalls.get('call_fork2')!.status).toBe('pending');

    // Fork 1 finishes (sub-agent — has a parent).
    send({ type: 'run_finished', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);

    const f1 = store.getState().toolCalls.get('call_fork1')!;
    const f2 = store.getState().toolCalls.get('call_fork2')!;
    expect(f1.status).toBe('completed'); // scoped cleanup
    expect(f2.status).toBe('pending');   // untouched — different task
  });

  it("only the root run's finish flips isStreaming=false", () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    expect(store.getState().isStreaming).toBe(true);

    // Sub-agent finishes — wire stream stays open (parent still working).
    send({ type: 'run_finished', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    expect(store.getState().isStreaming).toBe(true);

    // Root finishes — now streaming closes.
    send({ type: 'run_finished', taskId: ROOT, data: { taskId: ROOT } } as any);
    expect(store.getState().isStreaming).toBe(false);
  });

  it('regression: fork-after-fork sequence keeps fork2 tool_call routable', () => {
    // The exact shape that broke before this fix: fork1 finishes with
    // run_finished, fork2's tool_calls arrives next. Pre-fix: fork1's
    // run_finished set isStreaming=false AND wiped fork2's pending
    // call with the global cleanup. Now both states must survive.
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    send({
      type: 'tool_calls',
      taskId: FORK1,
      parentTaskId: ROOT,
      data: { tool_calls: [{ tool_call_id: 'call_a', tool_name: 'db_get', input: {} }] },
    } as any);
    send({
      type: 'tool_results',
      taskId: FORK1,
      parentTaskId: ROOT,
      data: { results: [{ tool_call_id: 'call_a', tool_name: 'db_get', parts: [] }] },
    } as any);
    send({ type: 'run_finished', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);

    // Fork 2 starts AFTER fork 1's terminal event — must still land cleanly.
    send({ type: 'run_started', taskId: FORK2, parentTaskId: ROOT, data: { taskId: FORK2 } } as any);
    send({
      type: 'tool_calls',
      taskId: FORK2,
      parentTaskId: ROOT,
      data: { tool_calls: [{ tool_call_id: 'call_b', tool_name: 'db_get', input: {} }] },
    } as any);

    const callB = store.getState().toolCalls.get('call_b');
    expect(callB).toBeTruthy();
    expect(callB!.status).toBe('pending');
    expect(callB!.taskId).toBe(FORK2);
    expect(store.getState().isStreaming).toBe(true);
  });

  it('getTaskTree walks root + descendants depth-first', () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    send({ type: 'run_started', taskId: FORK2, parentTaskId: ROOT, data: { taskId: FORK2 } } as any);
    const GRANDCHILD = 'task-grand-dddddddd';
    send({ type: 'run_started', taskId: GRANDCHILD, parentTaskId: FORK1, data: { taskId: GRANDCHILD } } as any);

    const tree = store.getState().getTaskTree(ROOT);
    const ids = tree.map(t => t.id);
    expect(ids[0]).toBe(ROOT);
    expect(ids).toContain(FORK1);
    expect(ids).toContain(FORK2);
    expect(ids).toContain(GRANDCHILD);
    // FORK1 must be visited before its child GRANDCHILD.
    expect(ids.indexOf(FORK1)).toBeLessThan(ids.indexOf(GRANDCHILD));
  });

  it('first run_started without parent claims currentTaskId; sub-agent run_starts do not', () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    expect(store.getState().currentTaskId).toBe(ROOT);

    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    expect(store.getState().currentTaskId).toBe(ROOT);
  });

  it('root run_finished clears currentTaskId/RunId/PlanId so the next user message starts a fresh task', () => {
    // Reproduces the "follow-up message resurrects old tool calls" bug: if
    // currentTaskId persisted across runs, useChat would send the next
    // user turn with the previous task_id, the server would resume that
    // task's scratchpad (full of old `Action: …` lines), and re-drive any
    // timed-out external tool calls.
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT, runId: 'run-1' } } as any);
    send({ type: 'plan_started', taskId: ROOT, data: {} } as any);
    expect(store.getState().currentTaskId).toBe(ROOT);
    expect(store.getState().currentRunId).toBe('run-1');
    expect(store.getState().currentPlanId).toBeTruthy();

    send({ type: 'run_finished', taskId: ROOT, data: { taskId: ROOT } } as any);

    // After the ROOT run finishes, the next sendMessage must build an
    // InvokeContext with task_id=undefined → server mints a new task.
    expect(store.getState().currentTaskId).toBeUndefined();
    expect(store.getState().currentRunId).toBeUndefined();
    expect(store.getState().currentPlanId).toBeUndefined();
    expect(store.getState().isStreaming).toBe(false);

    // And the NEXT root run_started can claim a fresh currentTaskId
    // (the !get().currentTaskId guard at chatStateStore.ts:528 only lets
    // the slot be filled when it's empty, so the clear above is what
    // makes a second run register at all).
    const NEW_ROOT = 'task-root2-eeeeeeee';
    send({ type: 'run_started', taskId: NEW_ROOT, data: { taskId: NEW_ROOT, runId: 'run-2' } } as any);
    expect(store.getState().currentTaskId).toBe(NEW_ROOT);
    expect(store.getState().currentRunId).toBe('run-2');
  });

  it('root run_finished flips leftover in_progress todos to done', () => {
    // Agents do not always emit a closing write_todos before final, so
    // the TodosCompact spinner would otherwise keep spinning above the
    // chat input after the run ended. Lock the close-out behavior here.
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT, runId: 'run-1' } } as any);
    store.getState().setTodos([
      { id: 't1', content: 'first', status: 'done' },
      { id: 't2', content: 'second', status: 'in_progress' },
      { id: 't3', content: 'third', status: 'open' },
    ]);

    send({ type: 'run_finished', taskId: ROOT, data: { taskId: ROOT } } as any);

    const todos = store.getState().todos;
    expect(todos.find(t => t.id === 't1')!.status).toBe('done');     // unchanged
    expect(todos.find(t => t.id === 't2')!.status).toBe('done');     // flipped
    expect(todos.find(t => t.id === 't3')!.status).toBe('open');     // unchanged — never started
  });

  it('sub-agent run_finished does NOT clear root currentTaskId', () => {
    // The clear-on-finish must be scoped to the ROOT run only. If a
    // sub-agent's run_finished cleared currentTaskId, mid-run forks
    // would orphan the root task in the store and the next user
    // message would still hit the in-flight root task with task_id=undefined.
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT, runId: 'run-1' } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1, runId: 'fork-run' } } as any);

    send({ type: 'run_finished', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);

    expect(store.getState().currentTaskId).toBe(ROOT);
    expect(store.getState().isStreaming).toBe(true);
  });
});
