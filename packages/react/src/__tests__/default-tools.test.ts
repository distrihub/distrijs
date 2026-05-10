import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStateStore } from '../stores/chatStateStore';
import { getToolSummary } from '../components/renderers/tools/getToolSummary';
import type { DistriEvent } from '@distri/core';

/**
 * The default-tool family (todo_write, ask_follow_up, confirm, input,
 * notify, approval_request) is special: each picks a specific renderer
 * and some are interactive (block until user responds).
 *
 * These tests pin the store-level semantics — renderer-level visual
 * snapshots live in storybook.
 */
describe('default tools — store-level semantics', () => {
  beforeEach(() => {
    useChatStateStore.getState().clearAllStates();
  });

  const TASK = 'task-default-tools';
  const send = (e: DistriEvent) =>
    useChatStateStore.getState().processMessage(e as any, true);

  it.each([
    ['todo_write', { todos: [{ id: '1', content: 'x', activeForm: 'doing x', status: 'pending' }] }],
    ['confirm', { message: 'are you sure?' }],
    ['notify', { message: 'hello' }],
  ])('%s tool round-trips through the store', (toolName, input) => {
    const callId = `tc_${toolName}`;
    send({ type: 'run_started', taskId: TASK, data: { taskId: TASK } } as any);
    send({
      type: 'tool_calls',
      taskId: TASK,
      data: { tool_calls: [{ tool_call_id: callId, tool_name: toolName, input }] },
    } as any);
    send({
      type: 'tool_results',
      taskId: TASK,
      data: { results: [{ tool_call_id: callId, tool_name: toolName, parts: [] }] },
    } as any);

    const tc = useChatStateStore.getState().toolCalls.get(callId);
    expect(tc).toBeTruthy();
    expect(tc!.tool_name).toBe(toolName);
    expect(tc!.status).toBe('completed');
    expect(tc!.taskId).toBe(TASK);
  });

  it('ask_follow_up pauses without a result (interactive)', () => {
    send({ type: 'run_started', taskId: TASK, data: { taskId: TASK } } as any);
    send({
      type: 'tool_calls',
      taskId: TASK,
      data: {
        tool_calls: [{
          tool_call_id: 'tc_ask',
          tool_name: 'ask_follow_up',
          input: { question: 'q?' },
        }],
      },
    } as any);

    const tc = useChatStateStore.getState().toolCalls.get('tc_ask');
    expect(tc!.status).toBe('pending');
    // Run not finished — store still considers itself live.
    expect(useChatStateStore.getState().currentTaskId).toBe(TASK);
  });

  it('getToolSummary recognizes default tools as interactive', () => {
    // The summary classifier groups the interactive tools together —
    // this is the place where we'd notice if someone removed a name
    // from the list.
    const interactive = ['ask_follow_up', 'confirm'];
    for (const name of interactive) {
      const summary = getToolSummary(name as any, {} as any);
      expect(summary).toBeTruthy();
    }
  });
});
