import { cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DistriChatMessage, DistriEvent, DistriMessage } from '@distri/core';
import { createChatStore } from '@distri/state';
import { ChatMessageList } from '../ChatMessageList';
import { useAgentList } from '../useAgentList';

vi.mock('react-native', async () => import('./react-native.mock'));

afterEach(cleanup);

const ev = (e: unknown) => e as DistriEvent;
const labels = { lookup_reference: 'Looked up references' };
const calls = (taskId: string, ...ids: string[]) => ev({
  type: 'tool_calls', taskId, data: { tool_calls: ids.map(id => ({ tool_call_id: id, tool_name: 'lookup_reference', input: {} })) },
});
const results = (taskId: string, ...rs: Array<[string, boolean]>) => ev({
  type: 'tool_results', taskId,
  data: { results: rs.map(([id, ok]) => ({ tool_call_id: id, tool_name: 'lookup_reference', parts: [{ part_type: 'data', data: ok ? { success: true, result: 'ok' } : { success: false, error: 'No game type' } }] })) },
});
function feed(events: DistriEvent[]) {
  const store = createChatStore();
  for (const e of events) store.getState().processMessage(e, true);
  return store;
}
const list = (store: ReturnType<typeof feed>, props: Partial<React.ComponentProps<typeof ChatMessageList>> = {}) =>
  render(<ChatMessageList messages={store.getState().messages as DistriChatMessage[]} store={store} autoScroll={false} {...props} />);

describe('grouped tool calls', () => {
  const events = [ev({ type: 'run_started', taskId: 't1', data: { taskId: 't1' } }), calls('t1', 'c1'), calls('t1', 'c2'), results('t1', ['c1', true], ['c2', true])];

  it('folds a run of calls into one row with the host label', () => {
    list(feed(events), { groupToolCalls: 'run', toolLabels: labels });
    expect(screen.getByText('2 steps · Looked up references')).toBeTruthy();
    expect(screen.queryByLabelText(/^Tool lookup_reference/)).toBeNull();
  });

  it('opens the run on a press and shows each call with the label as its title', () => {
    list(feed(events), { groupToolCalls: 'run', toolLabels: labels });
    fireEvent.click(screen.getByLabelText('Tool steps: 2 steps · Looked up references').querySelector('[role="button"], button')!);
    expect(screen.getAllByLabelText(/^Tool lookup_reference/)).toHaveLength(2);
  });

  it('opens by itself and counts the failure when a call fails', () => {
    const store = feed([ev({ type: 'run_started', taskId: 't1', data: { taskId: 't1' } }), calls('t1', 'c1', 'c2'), results('t1', ['c1', true], ['c2', false])]);
    list(store, { groupToolCalls: 'run', toolLabels: labels });
    expect(screen.getByText('2 steps · Looked up references · 1 failed')).toBeTruthy();
    expect(screen.getAllByLabelText(/^Tool lookup_reference/)).toHaveLength(2);
  });

  it('keeps a card per call when not grouping, titled by the label', () => {
    list(feed(events), { toolLabels: labels });
    expect(screen.getAllByLabelText(/^Tool lookup_reference/)).toHaveLength(2);
    expect(screen.getAllByText('Looked up references')).toHaveLength(2);
  });
});

describe('a reloaded thread', () => {
  const msg = (id: string, role: DistriMessage['role'], parts: DistriMessage['parts'], extra: Partial<DistriMessage> = {}): DistriMessage =>
    ({ id, role, parts, created_at: 1, taskId: 't1', ...extra });
  const call = (id: string) => ({ part_type: 'tool_call' as const, data: { tool_call_id: id, tool_name: 'lookup_reference', input: {} } });
  const history: DistriChatMessage[] = [
    msg('u1', 'user', [{ part_type: 'text', data: 'Write a lesson' }]),
    msg('a1', 'assistant', [call('c1'), call('c2')]),
    msg('r1', 'tool', [{ part_type: 'tool_result', data: { tool_call_id: 'c2', tool_name: 'lookup_reference', parts: [{ part_type: 'data', data: { success: false, error: 'No game type' } }] } }]),
    msg('a2', 'assistant', [{ part_type: 'text', data: 'The lesson is ready' }], { is_final: true }),
  ];

  it('draws the lead\'s steps from stored tool calls, once, with their outcome', () => {
    const store = createChatStore();
    store.getState().hydrateToolCalls(history);
    render(<ChatMessageList messages={history} store={store} autoScroll={false} groupToolCalls="run" toolLabels={labels} />);
    expect(screen.getByText('2 steps · Looked up references · 1 failed')).toBeTruthy();
    expect(screen.getAllByLabelText(/^Tool lookup_reference/)).toHaveLength(2);
    expect(screen.getByText('The lesson is ready')).toBeTruthy();
  });
});

describe('a helper\'s card', () => {
  it('draws its calls grouped like the lead\'s', () => {
    const link = { taskId: 'sub', parentTaskId: 't1', parentToolCallId: 'inv' };
    const store = feed([
      ev({ type: 'run_started', taskId: 't1', data: { taskId: 't1' } }),
      ev({ type: 'tool_calls', taskId: 't1', data: { tool_calls: [{ tool_call_id: 'inv', tool_name: 'invoke_agent', input: {} }] } }),
      ev({ type: 'run_started', ...link, title: 'Friction on a ramp', data: { taskId: 'sub' } }),
      ev({ type: 'tool_calls', ...link, data: { tool_calls: [
        { tool_call_id: 'x1', tool_name: 'lookup_reference', input: {} },
        { tool_call_id: 'x2', tool_name: 'lookup_reference', input: {} },
      ] } }),
    ]);
    list(store, { groupToolCalls: 'run', toolLabels: labels });
    const card = screen.getByLabelText('Sub-agent sub running');
    expect(within(card).getByText('Friction on a ramp')).toBeTruthy();
    expect(within(card).getByText(/2 steps · Looked up references/)).toBeTruthy();
  });
});

describe('useAgentList', () => {
  it('lists the lead and its helpers live, with what each is doing', () => {
    const link = { parentTaskId: 't1' };
    const store = feed([
      ev({ type: 'run_started', taskId: 't1', data: { taskId: 't1' } }),
      ev({ type: 'run_started', taskId: 'a', ...link, title: 'Friction', agentId: 'zippy_lesson', timestamp: 1000, data: { taskId: 'a' } }),
      ev({ type: 'run_started', taskId: 'b', ...link, title: 'Momentum', timestamp: 2000, data: { taskId: 'b' } }),
      ev({ type: 'tool_calls', taskId: 'a', ...link, data: { tool_calls: [{ tool_call_id: 'x', tool_name: 'check_game', input: {} }] } }),
      ev({ type: 'run_finished', taskId: 'b', ...link, timestamp: 8000, data: { taskId: 'b', success: false } }),
    ]);
    const { result } = renderHook(() => useAgentList(store, { toolLabels: { check_game: 'Checking the game…' } }));
    expect(result.current.rows.map(r => [r.title, r.status])).toEqual([
      ['Agent', 'running'], ['Friction', 'running'], ['Momentum', 'failed'],
    ]);
    expect(result.current.rows[1]).toMatchObject({ agentId: 'zippy_lesson', activity: 'Checking the game…' });
    expect(result.current.rows[2].durationMs).toBe(6000);
    expect(result.current.summary).toEqual({ running: 1, failed: 1, done: 0, queued: 0, total: 2 });
  });
});
