import { describe, expect, it } from 'vitest';
import type { DistriChatMessage, DistriEvent, DistriMessage } from '@distri/core';
import { buildTranscript } from '../chat/transcript';
import { createChatStore } from '../chat/chatStore';

const call = (id: string, name: string) => ({ part_type: 'tool_call' as const, data: { tool_call_id: id, tool_name: name, input: {} } });
const result = (id: string, name: string, data: Record<string, unknown>) => ({
  part_type: 'tool_result' as const,
  data: { tool_call_id: id, tool_name: name, parts: [{ part_type: 'data' as const, data }] },
});
const msg = (id: string, role: DistriMessage['role'], parts: DistriMessage['parts'], extra: Partial<DistriMessage> = {}): DistriMessage =>
  ({ id, role, parts, created_at: 1, ...extra });

// A reloaded thread: stored messages only, no tool_calls events.
const history: DistriChatMessage[] = [
  msg('u1', 'user', [{ part_type: 'text', data: 'Write a lesson' }], { taskId: 't1' }),
  msg('a1', 'assistant', [call('c1', 'list_primitives'), call('c2', 'read_game_type')], { taskId: 't1' }),
  msg('r1', 'tool', [result('c1', 'list_primitives', { success: true, result: 'ok' }), result('c2', 'read_game_type', { success: false, error: 'No game type' })], { taskId: 't1' }),
  msg('a2', 'assistant', [{ part_type: 'text', data: 'Here is the lesson' }, call('c3', 'final')], { taskId: 't1', is_final: true }),
];

describe('a reloaded thread keeps its tool calls', () => {
  it('turns stored tool_call parts into one steps block, in order, without the final tool', () => {
    const blocks = buildTranscript(history);
    expect(blocks.map(b => b.kind)).toEqual(['user', 'steps', 'assistant']);
    const steps = blocks[1];
    expect(steps.kind === 'steps' && steps.toolCalls.map(c => c.tool_name)).toEqual(['list_primitives', 'read_game_type']);
  });

  it('keeps the text of a message that also called tools, then its steps', () => {
    const blocks = buildTranscript([
      msg('a1', 'assistant', [{ part_type: 'text', data: 'Let me check' }, call('c1', 'list_primitives')], { taskId: 't1' }),
    ]);
    expect(blocks.map(b => b.kind)).toEqual(['assistant', 'steps']);
  });

  it('folds consecutive stored calls into one block when grouping by run', () => {
    const blocks = buildTranscript([
      msg('a1', 'assistant', [call('c1', 'a')], { taskId: 't1' }),
      msg('a2', 'assistant', [call('c2', 'b')], { taskId: 't1' }),
    ], { groupToolCalls: 'run' });
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind === 'steps' && blocks[0].toolCalls).toHaveLength(2);
  });

  it('does not draw a call twice when the same call also arrived as a live event', () => {
    const live = { type: 'tool_calls', taskId: 't1', data: { tool_calls: [{ tool_call_id: 'c1', tool_name: 'list_primitives', input: {} }] } } as DistriEvent;
    const blocks = buildTranscript([history[0], history[1], live]);
    const calls = blocks.flatMap(b => (b.kind === 'steps' ? b.toolCalls.map(c => c.tool_call_id) : []));
    expect(calls.filter(id => id === 'c1')).toHaveLength(1);
  });
});

describe('hydrateToolCalls', () => {
  it('seeds states with the stored outcome', () => {
    const store = createChatStore();
    store.getState().hydrateToolCalls(history);
    const calls = store.getState().toolCalls;
    expect(calls.get('c1')).toMatchObject({ status: 'completed', taskId: 't1' });
    expect(calls.get('c2')).toMatchObject({ status: 'error', error: 'No game type' });
  });

  it('never overwrites a call the store already knows', () => {
    const store = createChatStore();
    store.getState().initToolCall({ tool_call_id: 'c1', tool_name: 'list_primitives', input: {} }, 5, true, 't1');
    const before = store.getState().toolCalls.get('c1');
    store.getState().hydrateToolCalls(history);
    expect(store.getState().toolCalls.get('c1')).toBe(before);
  });
});
