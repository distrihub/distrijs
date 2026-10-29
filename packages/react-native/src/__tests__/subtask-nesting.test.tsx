import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DistriChatMessage, DistriEvent } from '@distri/core';
import { createChatStore } from '@distri/state';
import { ChatMessageList } from '../ChatMessageList';

vi.mock('react-native', async () => import('./react-native.mock'));

afterEach(cleanup);

/** A sub-agent whose events name the tool call that started it is drawn under that call. */
describe('sub-agent nesting', () => {
  const ev = (e: unknown) => e as DistriEvent;
  function feed(events: DistriEvent[]) {
    const store = createChatStore();
    for (const e of events) store.getState().processMessage(e, true);
    return store;
  }
  const link = { taskId: 'sub', parentTaskId: 't1', parentToolCallId: 'call-agent' };
  const events = [
    ev({ type: 'run_started', taskId: 't1', data: { taskId: 't1' } }),
    ev({ type: 'tool_calls', taskId: 't1', data: { tool_calls: [{ tool_call_id: 'call-agent', tool_name: 'Agent', input: { description: 'Map the code' } }] } }),
    ev({ type: 'run_started', ...link, data: { taskId: 'sub' } }),
    ev({ type: 'text_message_start', ...link, data: { message_id: 'sub-m', step_id: '', role: 'assistant' } }),
    ev({ type: 'text_message_content', ...link, data: { message_id: 'sub-m', step_id: '', delta: 'Searching inside the sub-agent' } }),
    ev({ type: 'text_message_end', ...link, data: { message_id: 'sub-m', step_id: '' } }),
    ev({ type: 'tool_calls', ...link, data: { tool_calls: [{ tool_call_id: 'call-grep', tool_name: 'Grep', input: { pattern: 'x' } }] } }),
    ev({ type: 'text_message_start', taskId: 't1', data: { message_id: 'root-m', step_id: '', role: 'assistant' } }),
    ev({ type: 'text_message_content', taskId: 't1', data: { message_id: 'root-m', step_id: '', delta: 'The parent goes on' } }),
    ev({ type: 'text_message_end', taskId: 't1', data: { message_id: 'root-m', step_id: '' } }),
  ];

  it('draws the sub-agent under its call, not in the flat list, while it runs', () => {
    const store = feed(events);
    render(<ChatMessageList messages={store.getState().messages as DistriChatMessage[]} store={store} autoScroll={false} />);
    const card = screen.getByLabelText('Sub-agent sub running');
    expect(within(card).getByText('Map the code')).toBeTruthy();
    expect(within(card).getByText('Searching inside the sub-agent')).toBeTruthy();
    expect(within(card).getByText('Grep')).toBeTruthy();
    expect(screen.getAllByText('Searching inside the sub-agent')).toHaveLength(1);
    expect(screen.getByText('The parent goes on')).toBeTruthy();
  });

  it('leaves the row to a custom renderer of the call, sub-agent included', () => {
    const store = feed(events);
    render(<ChatMessageList
      messages={store.getState().messages as DistriChatMessage[]}
      store={store}
      autoScroll={false}
      toolRenderers={{ Agent: () => <span>My agent row</span> }}
    />);
    expect(screen.getByText('My agent row')).toBeTruthy();
    expect(screen.queryByLabelText('Sub-agent sub running')).toBeNull();
    expect(screen.queryByText('Searching inside the sub-agent')).toBeNull();
  });

  it('folds a finished sub-agent and opens it on a press', () => {
    const store = feed([...events, ev({ type: 'run_finished', ...link, data: { taskId: 'sub' } })]);
    render(<ChatMessageList messages={store.getState().messages as DistriChatMessage[]} store={store} autoScroll={false} />);
    const card = screen.getByLabelText('Sub-agent sub completed');
    expect(within(card).queryByText('Searching inside the sub-agent')).toBeNull();
    fireEvent.click(within(card).getByText('Map the code'));
    expect(within(card).getByText('Searching inside the sub-agent')).toBeTruthy();
  });
});
