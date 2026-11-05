import { describe, expect, it } from 'vitest';
import type { TaskState, ToolCallState } from '../chat/chatStore';
import { agentTitle, buildAgentList, summarizeAgentList } from '../chat/agentList';

const task = (id: string, extra: Partial<TaskState> = {}): TaskState =>
  ({ id, title: 'Agent Run', status: 'running', childTaskIds: [], ...extra });
const call = (id: string, name: string, taskId: string, status: ToolCallState['status'], startTime = 1): ToolCallState =>
  ({ tool_call_id: id, tool_name: name, input: {}, status, taskId, startTime });

function course() {
  return new Map<string, TaskState>([
    ['lead', task('lead', { childTaskIds: ['b', 'a', 'c', 'd'] })],
    ['a', task('a', { parentTaskId: 'lead', title: 'Newton\'s first law', agentId: 'zippy_lesson', status: 'completed', startTime: 1000, endTime: 7000 })],
    ['b', task('b', { parentTaskId: 'lead', title: 'Force and acceleration', startTime: 500 })],
    ['c', task('c', { parentTaskId: 'lead', title: 'Friction', status: 'failed', startTime: 2000, endTime: 3000, error: 'a blank has no answer' })],
    ['d', task('d', { parentTaskId: 'lead', title: 'Momentum', status: 'pending' })],
  ])
}

describe('buildAgentList', () => {
  it('lists the lead then its helpers in the order they started, queued last', () => {
    const rows = buildAgentList(course(), new Map());
    expect(rows.map(r => [r.title, r.depth])).toEqual([
      ['Agent', 0], ['Force and acceleration', 1], ['Newton\'s first law', 1], ['Friction', 1], ['Momentum', 1],
    ]);
  });

  it('carries duration, error and agent id', () => {
    const rows = buildAgentList(course(), new Map());
    expect(rows.find(r => r.id === 'a')).toMatchObject({ durationMs: 6000, agentId: 'zippy_lesson' });
    expect(rows.find(r => r.id === 'c')).toMatchObject({ status: 'failed', error: 'a blank has no answer' });
  });

  it('says what a running agent is doing from its newest running tool call, with the host label', () => {
    const calls = new Map([
      ['t1', call('t1', 'lookup_reference', 'b', 'completed', 1)],
      ['t2', call('t2', 'check_game', 'b', 'running', 5)],
    ]);
    const rows = buildAgentList(course(), calls, { toolLabels: { check_game: 'Checking the game…' } });
    expect(rows.find(r => r.id === 'b')?.activity).toBe('Checking the game…');
    expect(rows.find(r => r.id === 'a')?.activity).toBeUndefined();
  });

  it('can leave the lead out, and survives a cycle', () => {
    expect(buildAgentList(course(), new Map(), { helpersOnly: true }).every(r => r.depth > 0)).toBe(true);
    const loop = new Map([['x', task('x', { parentTaskId: 'y', childTaskIds: ['y'] })], ['y', task('y', { parentTaskId: 'x', childTaskIds: ['x'] })]]);
    expect(() => buildAgentList(loop, new Map())).not.toThrow();
  });

  it('treats a task whose parent is unknown as a root', () => {
    const rows = buildAgentList(new Map([['z', task('z', { parentTaskId: 'missing' })]]), new Map());
    expect(rows).toHaveLength(1);
  });
});

describe('summarizeAgentList', () => {
  it('counts helpers by state, not the lead', () => {
    expect(summarizeAgentList(buildAgentList(course(), new Map()))).toEqual({ running: 1, failed: 1, done: 1, queued: 1, total: 4 });
  });
});

describe('agentTitle', () => {
  it('prefers the server title, then intent, then the agent id', () => {
    expect(agentTitle(task('1', { title: 'Friction' }))).toBe('Friction');
    expect(agentTitle(task('1', { metadata: { intent: ' Write   the lesson ' } }))).toBe('Write the lesson');
    expect(agentTitle(task('1', { agentId: 'zippy_lesson' }))).toBe('zippy_lesson');
  });
});
