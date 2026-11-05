import { describe, expect, it } from 'vitest';
import type { DistriEvent } from '@distri/core';
import { createChatStore } from '../chat/chatStore';

const at = (s: string) => Date.parse(`2026-11-05T10:00:${s}Z`);

describe('a sub-agent task keeps its name, agent and the server\'s times', () => {
  it('names the task from the frame and does not overwrite it on run_started', () => {
    const store = createChatStore();
    const s = store.getState();
    s.processMessage({ type: 'run_started', taskId: 'root', timestamp: at('00'), data: { taskId: 'root' } } as DistriEvent, true);
    s.processMessage({
      type: 'run_started', taskId: 'c1', parentTaskId: 'root', agentId: 'zippy_lesson',
      title: 'Newton\'s first law', timestamp: at('01'), data: { taskId: 'c1' },
    } as DistriEvent, true);
    expect(store.getState().tasks.get('c1')).toMatchObject({
      title: 'Newton\'s first law', agentId: 'zippy_lesson', parentTaskId: 'root', startTime: at('01'),
    });
    expect(store.getState().tasks.get('root')?.title).toBe('Agent Run');
  });

  it('backfills a name that arrives after the first frame', () => {
    const store = createChatStore();
    const s = store.getState();
    s.processMessage({ type: 'tool_calls', taskId: 'c1', parentTaskId: 'root', data: { tool_calls: [] } } as DistriEvent, true);
    expect(store.getState().tasks.get('c1')?.title).toBe('Agent Run');
    s.processMessage({ type: 'run_started', taskId: 'c1', parentTaskId: 'root', title: 'Friction', agentId: 'a', data: { taskId: 'c1' } } as DistriEvent, true);
    expect(store.getState().tasks.get('c1')).toMatchObject({ title: 'Friction', agentId: 'a' });
  });

  it('measures a task by frame times, not by when frames arrived', () => {
    const store = createChatStore();
    const s = store.getState();
    s.processMessage({ type: 'run_started', taskId: 'c1', parentTaskId: 'root', timestamp: at('04'), data: { taskId: 'c1' } } as DistriEvent, true);
    s.processMessage({ type: 'run_finished', taskId: 'c1', parentTaskId: 'root', timestamp: at('10'), data: { taskId: 'c1' } } as DistriEvent, true);
    const t = store.getState().tasks.get('c1')!;
    expect(t.endTime! - t.startTime!).toBe(6000);
    expect(t.status).toBe('completed');
  });

  it('marks a run that finished with success=false as failed', () => {
    const store = createChatStore();
    const s = store.getState();
    s.processMessage({ type: 'run_started', taskId: 'c1', parentTaskId: 'root', data: { taskId: 'c1' } } as DistriEvent, true);
    s.processMessage({ type: 'run_finished', taskId: 'c1', parentTaskId: 'root', data: { taskId: 'c1', success: false, failedSteps: 1 } } as DistriEvent, true);
    expect(store.getState().tasks.get('c1')?.status).toBe('failed');
  });
});
