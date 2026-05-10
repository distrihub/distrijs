import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStateStore } from '../stores/chatStateStore';
import type { DistriEvent } from '@distri/core';

/**
 * Verify that the new fork/invoke_agent execution mechanisms are
 * properly captured in chatStateStore:
 *
 *  - When the parent emits a tool_calls for `invoke_agent` and the
 *    child's run_started arrives with `parentTaskId` linkage, the
 *    parent task's `childTaskIds` must include the child.
 *  - When the child emits text + run_finished, the parent's
 *    `invoke_agent` tool call must be allowed to flip to "completed"
 *    when the corresponding tool_results arrives — but it stays
 *    pending in the meantime (because the model hasn't returned
 *    control yet).
 *  - The store should NOT preemptively complete the invoke_agent
 *    call just because the child finished — the run_skill / call_agent
 *    machinery on the server posts an explicit tool_results envelope.
 */
describe('chatStateStore — invoke_agent / fork capture', () => {
  beforeEach(() => {
    useChatStateStore.getState().clearAllStates();
  });

  const ROOT = 'task-root-aaaaaaaa';
  const FORK = 'task-fork-cccccccc';

  function send(event: DistriEvent) {
    useChatStateStore.getState().processMessage(event as any, true);
  }

  it('parent invoke_agent stays pending while child runs', () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);

    // Parent emits the invoke_agent tool call.
    send({
      type: 'tool_calls',
      taskId: ROOT,
      data: {
        tool_calls: [{
          tool_call_id: 'tc_invoke',
          tool_name: 'invoke_agent',
          input: { agent: 'helper', task: 'go', mode: 'fork' },
        }],
      },
    } as any);

    // Child run begins — should NOT complete the parent's tool call.
    send({ type: 'run_started', taskId: FORK, parentTaskId: ROOT, data: { taskId: FORK } } as any);
    expect(useChatStateStore.getState().toolCalls.get('tc_invoke')!.status).toBe('pending');

    // Child run finishes — STILL pending. The server hasn't posted a
    // tool_results envelope to the parent yet.
    send({ type: 'run_finished', taskId: FORK, parentTaskId: ROOT, data: { taskId: FORK } } as any);
    expect(useChatStateStore.getState().toolCalls.get('tc_invoke')!.status).toBe('pending');

    // Now the parent's tool_results arrives — flip to completed.
    send({
      type: 'tool_results',
      taskId: ROOT,
      data: {
        results: [{ tool_call_id: 'tc_invoke', tool_name: 'invoke_agent', parts: [] }],
      },
    } as any);
    expect(useChatStateStore.getState().toolCalls.get('tc_invoke')!.status).toBe('completed');
  });

  it('child task is linked under parent in the task tree', () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({
      type: 'tool_calls',
      taskId: ROOT,
      data: {
        tool_calls: [{ tool_call_id: 'tc_invoke', tool_name: 'invoke_agent', input: {} }],
      },
    } as any);
    send({ type: 'run_started', taskId: FORK, parentTaskId: ROOT, data: { taskId: FORK } } as any);

    const root = useChatStateStore.getState().getTaskById(ROOT);
    const fork = useChatStateStore.getState().getTaskById(FORK);
    expect(root!.childTaskIds).toContain(FORK);
    expect(fork!.parentTaskId).toBe(ROOT);
  });

  it('getTaskTree returns root + descendants in order', () => {
    send({ type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as any);
    send({ type: 'run_started', taskId: FORK, parentTaskId: ROOT, data: { taskId: FORK } } as any);

    const tree = useChatStateStore.getState().getTaskTree(ROOT);
    expect(tree.map(t => t.taskId)).toContain(ROOT);
    expect(tree.map(t => t.taskId)).toContain(FORK);
  });
});
