import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStateStore } from '../stores/chatStateStore';
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
  beforeEach(() => {
    useChatStateStore.getState().clearAllStates();
  });

  const ROOT = 'task-root-aaaaaaaa';
  const FORK1 = 'task-fork1-bbbbbbb';
  const FORK2 = 'task-fork2-ccccccc';

  function send(event: DistriEvent) {
    // processMessage takes DistriChatMessage which is a superset of DistriEvent;
    // any cast keeps the test ergonomic without dragging in encoder deps.
    useChatStateStore.getState().processMessage(event as any, true);
  }

  it('builds parent → child linkage from event.parentTaskId', () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    send({ type: 'run_started', taskId: FORK2, parentTaskId: ROOT, data: { taskId: FORK2 } } as any);

    const root = useChatStateStore.getState().getTaskById(ROOT);
    const fork1 = useChatStateStore.getState().getTaskById(FORK1);
    const fork2 = useChatStateStore.getState().getTaskById(FORK2);

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

    const root = useChatStateStore.getState().getTaskById(ROOT);
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

    const tc = useChatStateStore.getState().toolCalls.get('call_x');
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

    const fork1Calls = useChatStateStore.getState().getToolCallsByTaskId(FORK1);
    const fork2Calls = useChatStateStore.getState().getToolCallsByTaskId(FORK2);
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
    expect(useChatStateStore.getState().toolCalls.get('call_fork1')!.status).toBe('pending');
    expect(useChatStateStore.getState().toolCalls.get('call_fork2')!.status).toBe('pending');

    // Fork 1 finishes (sub-agent — has a parent).
    send({ type: 'run_finished', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);

    const f1 = useChatStateStore.getState().toolCalls.get('call_fork1')!;
    const f2 = useChatStateStore.getState().toolCalls.get('call_fork2')!;
    expect(f1.status).toBe('completed'); // scoped cleanup
    expect(f2.status).toBe('pending');   // untouched — different task
  });

  it("only the root run's finish flips isStreaming=false", () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    expect(useChatStateStore.getState().isStreaming).toBe(true);

    // Sub-agent finishes — wire stream stays open (parent still working).
    send({ type: 'run_finished', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    expect(useChatStateStore.getState().isStreaming).toBe(true);

    // Root finishes — now streaming closes.
    send({ type: 'run_finished', taskId: ROOT, data: { taskId: ROOT } } as any);
    expect(useChatStateStore.getState().isStreaming).toBe(false);
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

    const callB = useChatStateStore.getState().toolCalls.get('call_b');
    expect(callB).toBeTruthy();
    expect(callB!.status).toBe('pending');
    expect(callB!.taskId).toBe(FORK2);
    expect(useChatStateStore.getState().isStreaming).toBe(true);
  });

  it('getTaskTree walks root + descendants depth-first', () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    send({ type: 'run_started', taskId: FORK2, parentTaskId: ROOT, data: { taskId: FORK2 } } as any);
    const GRANDCHILD = 'task-grand-dddddddd';
    send({ type: 'run_started', taskId: GRANDCHILD, parentTaskId: FORK1, data: { taskId: GRANDCHILD } } as any);

    const tree = useChatStateStore.getState().getTaskTree(ROOT);
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
    expect(useChatStateStore.getState().currentTaskId).toBe(ROOT);

    send({ type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1 } } as any);
    expect(useChatStateStore.getState().currentTaskId).toBe(ROOT);
  });
});
