import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Agent, DistriClient, DistriEvent, extractTextFromDistriMessage, isDistriMessage } from '@distri/core';
import { Text } from 'react-native';
import { Chat } from '../Chat';

vi.mock('react-native', async () => import('./react-native.mock'));

async function* assistantStream() {
  yield DistriClient.initDistriMessage('assistant', [{ part_type: 'text', data: 'streamed answer' }]);
}

describe('Chat', () => {
  afterEach(cleanup);

  it('renders the optimistic user message and sends from the native composer', async () => {
    const invokeStream = vi.fn(async () => assistantStream());
    const agent = {
      name: 'native-agent',
      client: { ensureAccessToken: vi.fn(async () => {}) },
      invokeStream,
    } as unknown as Agent;
    render(<Chat agent={agent} threadId="thread-ui" />);

    fireEvent.change(screen.getByPlaceholderText('Message…'), { target: { value: 'send from chat' } });
    await act(async () => fireEvent.click(screen.getByLabelText('Send message')));

    expect(screen.getByText('send from chat')).toBeTruthy();
    expect(await screen.findByText('streamed answer')).toBeTruthy();
    expect(invokeStream).toHaveBeenCalledOnce();
  });

  it('updates the rendered assistant message as streamed text deltas arrive', async () => {
    let releaseSecondDelta!: () => void;
    const secondDelta = new Promise<void>(resolve => { releaseSecondDelta = resolve; });

    const asEvent = (event: DistriEvent) => event;
    async function* incrementalStream() {
      yield asEvent({
        type: 'text_message_start',
        data: { message_id: 'assistant-live', step_id: 'step-live', role: 'assistant', is_final: true },
      });
      yield asEvent({
        type: 'text_message_content',
        data: { message_id: 'assistant-live', step_id: 'step-live', delta: 'A live' },
      });
      await secondDelta;
      yield asEvent({
        type: 'text_message_content',
        data: { message_id: 'assistant-live', step_id: 'step-live', delta: ' response' },
      });
      yield asEvent({
        type: 'text_message_end',
        data: { message_id: 'assistant-live', step_id: 'step-live' },
      });
    }

    const agent = {
      name: 'native-agent',
      client: { ensureAccessToken: vi.fn(async () => {}) },
      invokeStream: vi.fn(async () => incrementalStream()),
    } as unknown as Agent;
    render(<Chat agent={agent} threadId="thread-streaming" />);

    fireEvent.change(screen.getByPlaceholderText('Message…'), { target: { value: 'show me streaming' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    expect(await screen.findByText('A live')).toBeTruthy();
    expect(screen.queryByText('A live response')).toBeNull();
    releaseSecondDelta();
    expect(await screen.findByText('A live response')).toBeTruthy();
  });

  it('uses the app-provided renderer for persisted native chat messages', () => {
    const agent = {
      name: 'native-agent',
      client: { ensureAccessToken: vi.fn(async () => {}) },
      invokeStream: vi.fn(async () => assistantStream()),
    } as unknown as Agent;
    const messages = [
      DistriClient.initDistriMessage('assistant', [{ part_type: 'text', data: 'saved answer' }]),
    ];

    render(<Chat
      agent={agent}
      threadId="thread-renderer"
      initialMessages={messages}
      renderMessage={message => (
        <Text>{isDistriMessage(message) ? `custom: ${extractTextFromDistriMessage(message)}` : 'custom: event'}</Text>
      )}
    />);

    expect(screen.getByText('custom: saved answer')).toBeTruthy();
  });

  it('shows a visible error when the native stream cannot be opened', async () => {
    const agent = {
      name: 'native-agent',
      client: { ensureAccessToken: vi.fn(async () => {}) },
      invokeStream: vi.fn(async () => { throw new Error('Network unavailable'); }),
    } as unknown as Agent;
    render(<Chat agent={agent} threadId="thread-error" />);

    fireEvent.change(screen.getByPlaceholderText('Message…'), { target: { value: 'try offline' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    expect(await screen.findByText('Network unavailable')).toBeTruthy();
  });

  it('runs a registered client function and renders its streamed tool call', async () => {
    const handler = vi.fn(async ({ amount }: { amount: number }) => ({ total: amount * 1.1 }));
    const completeTool = vi.fn(async () => {});
    async function* stream() {
      yield {
        type: 'tool_calls',
        data: { tool_calls: [{ tool_call_id: 'tool-1', tool_name: 'calculate_total', input: { amount: 20 } }] },
      } satisfies DistriEvent;
      yield DistriClient.initDistriMessage('assistant', [{ part_type: 'text', data: 'Total is 22.' }]);
    }
    const agent = {
      name: 'native-agent',
      client: { ensureAccessToken: vi.fn(async () => {}) },
      invokeStream: vi.fn(async () => stream()),
      completeTool,
    } as unknown as Agent;
    render(<Chat
      agent={agent}
      threadId="thread-client-tool"
      externalTools={[{
        name: 'calculate_total',
        description: 'Calculate a total',
        parameters: { type: 'object', properties: { amount: { type: 'number' } }, required: ['amount'] },
        type: 'function',
        autoExecute: true,
        handler,
      }]}
    />);

    fireEvent.change(screen.getByPlaceholderText('Message…'), { target: { value: 'Add tax to 20' } });
    await act(async () => fireEvent.click(screen.getByLabelText('Send message')));

    await waitFor(() => expect(handler).toHaveBeenCalledWith({ amount: 20 }));
    expect(completeTool).toHaveBeenCalledOnce();
    expect(await screen.findByText('calculate_total')).toBeTruthy();
    expect(await screen.findByText('Total is 22.')).toBeTruthy();
  });

  it('sends the message returned by beforeSendMessage to the agent', async () => {
    const beforeSendMessage = vi.fn(async (message: import('@distri/core').DistriMessage) => ({
      ...message,
      parts: [...message.parts, { part_type: 'text' as const, data: 'Native form fields: fullName, incidentType' }],
    }));
    const invokeStream = vi.fn(async () => assistantStream());
    const agent = {
      name: 'native-agent',
      client: { ensureAccessToken: vi.fn(async () => {}) },
      invokeStream,
    } as unknown as Agent;
    render(<Chat agent={agent} threadId="before-send-context" beforeSendMessage={beforeSendMessage} />);

    fireEvent.change(screen.getByPlaceholderText('Message…'), { target: { value: 'Fill the incident report' } });
    await act(async () => fireEvent.click(screen.getByLabelText('Send message')));

    await waitFor(() => expect(beforeSendMessage).toHaveBeenCalledOnce());
    await waitFor(() => expect(JSON.stringify(invokeStream.mock.calls[0])).toContain('Native form fields: fullName, incidentType'));
  });
});
