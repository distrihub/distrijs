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
