import { describe, it, expect } from 'vitest';
import { convertA2AMessageToDistri, convertA2AStatusUpdateToDistri } from '../encoder';
import type { Message } from '@a2a-js/sdk';

/**
 * Bug context: sub-agent activity wasn't rendering in the chat panel because
 * the wire→Distri encoder dropped routing fields. SubTaskCard filters its
 * content by `m.taskId === task.id`, and the parent↔child task tree is built
 * from `event.parentTaskId`. Both must survive the encoder.
 */
describe('encoder routing fields (taskId + parentTaskId)', () => {
  it('convertA2AMessageToDistri carries taskId through', () => {
    const a2a: Message = {
      kind: 'message',
      messageId: 'msg-1',
      role: 'agent',
      taskId: 'task-sub-1',
      parts: [{ kind: 'text', text: 'hello from sub-agent' }],
    } as Message;
    const distri = convertA2AMessageToDistri(a2a);
    expect(distri.taskId).toBe('task-sub-1');
  });

  it('convertA2AMessageToDistri reads parent_task_id from metadata envelope', () => {
    const a2a: Message = {
      kind: 'message',
      messageId: 'msg-2',
      role: 'agent',
      taskId: 'task-sub-2',
      parts: [{ kind: 'text', text: 'sub-agent text' }],
      metadata: {
        parent_task_id: 'task-parent-1',
        agent: { agent_id: 'zippy_lesson', agent_name: 'Zippy Lesson' },
      },
    } as Message;
    const distri = convertA2AMessageToDistri(a2a);
    expect(distri.taskId).toBe('task-sub-2');
    expect(distri.parentTaskId).toBe('task-parent-1');
    expect(distri.agent_id).toBe('zippy_lesson');
  });

  it('convertA2AMessageToDistri leaves taskId/parentTaskId undefined when missing', () => {
    const a2a: Message = {
      kind: 'message',
      messageId: 'msg-3',
      role: 'user',
      parts: [{ kind: 'text', text: 'no routing' }],
    } as Message;
    const distri = convertA2AMessageToDistri(a2a);
    expect(distri.taskId).toBeUndefined();
    expect(distri.parentTaskId).toBeUndefined();
  });

  it('convertA2AStatusUpdateToDistri stamps parentTaskId from metadata', () => {
    const statusUpdate = {
      kind: 'status-update',
      taskId: 'task-sub-3',
      runId: 'run-1',
      metadata: {
        type: 'run_started',
        parent_task_id: 'task-parent-2',
      },
    };
    const ev = convertA2AStatusUpdateToDistri(statusUpdate);
    expect(ev).not.toBeNull();
    expect((ev as any).taskId).toBe('task-sub-3');
    expect((ev as any).parentTaskId).toBe('task-parent-2');
  });

  it('convertA2AStatusUpdateToDistri leaves parentTaskId undefined for top-level events', () => {
    const statusUpdate = {
      kind: 'status-update',
      taskId: 'task-top-1',
      runId: 'run-2',
      metadata: { type: 'run_started' },
    };
    const ev = convertA2AStatusUpdateToDistri(statusUpdate);
    expect(ev).not.toBeNull();
    expect((ev as any).taskId).toBe('task-top-1');
    expect((ev as any).parentTaskId).toBeUndefined();
  });
});
