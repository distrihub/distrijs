import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DistriEvent } from '@distri/core';
import { createChatStore } from '../chat/chatStore';

/**
 * A tool the client has no external (JS) tool for is *reported*: it runs
 * where the agent runs and this client only shows it. It must never be left
 * `pending` as if it waited for the client, and must not log on every call.
 */
describe('reported (non-external) tools', () => {
  afterEach(() => vi.restoreAllMocks());
  const ev = (e: DistriEvent) => e;

  it('run until their result, fail when the result says so, and stay quiet', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const store = createChatStore();
    const s = store.getState();
    s.processMessage(ev({ type: 'run_started', taskId: 't1', data: { taskId: 't1' } } as DistriEvent), true);
    s.processMessage(ev({ type: 'tool_calls', taskId: 't1', data: { tool_calls: [
      { tool_call_id: 'c1', tool_name: 'Bash', input: { command: 'ls' } },
      { tool_call_id: 'c2', tool_name: 'Read', input: { file_path: 'x' } },
    ] } } as DistriEvent), true);
    expect(store.getState().toolCalls.get('c1')).toMatchObject({ status: 'running', isExternal: false, taskId: 't1' });
    s.processMessage(ev({ type: 'tool_results', taskId: 't1', data: { results: [
      { tool_call_id: 'c1', tool_name: 'Bash', parts: [{ part_type: 'data', data: { result: 'a b', success: true, error: null } }] },
      { tool_call_id: 'c2', tool_name: 'Read', parts: [{ part_type: 'data', data: { result: 'no such file', success: false, error: 'no such file' } }] },
    ] } } as DistriEvent), true);
    expect(store.getState().toolCalls.get('c1')?.status).toBe('completed');
    expect(store.getState().toolCalls.get('c2')).toMatchObject({ status: 'error', error: 'no such file' });
    expect(log.mock.calls.map(c => String(c[0])).filter(m => /not external|Tool found/.test(m))).toEqual([]);
  });

  it('log only when the store is in debug', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const store = createChatStore();
    store.setState({ debug: true });
    store.getState().initToolCall({ tool_call_id: 'c', tool_name: 'Bash', input: {} });
    expect(log.mock.calls.some(c => /not external/.test(String(c[0])))).toBe(true);
  });

  it('an external tool still waits for this client', () => {
    const store = createChatStore();
    store.getState().setExternalTools([{ type: 'function', name: 'ask_user', description: '', parameters: {}, handler: async () => ({}), isExternal: true } as never]);
    // executeTool runs it; the state starts pending until then.
    const run = vi.spyOn(store.getState(), 'executeTool').mockImplementation(async () => {});
    store.getState().initToolCall({ tool_call_id: 'e', tool_name: 'ask_user', input: {} });
    expect(store.getState().toolCalls.get('e')).toMatchObject({ status: 'pending', isExternal: true });
    expect(run).toHaveBeenCalled();
  });
});

describe('sub-agent tasks', () => {
  const ev = (e: unknown) => e as DistriEvent;

  it('remember the tool call that started them, and never take over the chat', () => {
    const store = createChatStore();
    const s = store.getState();
    s.processMessage(ev({ type: 'run_started', taskId: 't1', data: { taskId: 't1', agentId: 'main' } }), true);
    s.processMessage(ev({ type: 'run_started', taskId: 'sub', parentTaskId: 't1', parentToolCallId: 'call-1', data: { taskId: 'sub', agentId: 'explorer' } }), true);
    expect(store.getState().tasks.get('sub')).toMatchObject({ parentTaskId: 't1', parentToolCallId: 'call-1' });
    expect(store.getState().tasks.get('t1')?.childTaskIds).toEqual(['sub']);
    expect(store.getState().currentAgentId).toBe('main');
    expect(store.getState().currentTaskId).toBe('t1');
    // A sub-agent's error fails its task only.
    s.processMessage(ev({ type: 'run_error', taskId: 'sub', parentTaskId: 't1', data: { message: 'boom', code: '' } }), true);
    expect(store.getState().tasks.get('sub')?.status).toBe('failed');
    expect(store.getState().isStreaming).toBe(true);
  });

  it('a tool_execution_start for an unseen call is a new map (selectors re-render)', () => {
    const store = createChatStore();
    const before = store.getState().toolCalls;
    store.getState().processMessage(ev({ type: 'tool_execution_start', taskId: 't1', data: { tool_call_id: 'x', tool_call_name: 'Bash', input: {} } }), true);
    expect(store.getState().toolCalls).not.toBe(before);
    expect(store.getState().toolCalls.get('x')?.status).toBe('running');
  });
});
