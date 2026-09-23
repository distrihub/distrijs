import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DistriClient } from '@distri/core';
import type { Agent, DistriChatMessage, DistriEvent } from '@distri/core';
import { Linking } from 'react-native';
import { Chat } from '../Chat';

vi.mock('react-native', async () => import('./react-native.mock'));

const idleAgent = { name: 'renderer-test', client: { ensureAccessToken: async () => {} }, invokeStream: async function* () {} } as unknown as Agent;

describe('native chat renderers', () => {
  afterEach(cleanup);

  it('renders inline image parts using their URL', () => {
    const message = DistriClient.initDistriMessage('assistant', [
      { part_type: 'image', data: { type: 'url', mime_type: 'image/png', url: 'https://example.test/meal.png', name: 'Meal photo' } },
    ]);
    render(<Chat agent={idleAgent} threadId="image-renderer" initialMessages={[message]} />);

    expect(screen.getByAltText('Meal photo').getAttribute('src')).toBe('https://example.test/meal.png');
  });

  it('shows a readable fallback for an unsupported message part', () => {
    const message = DistriClient.initDistriMessage('assistant', [
      { part_type: 'data', data: { status: 'saved', count: 2 } },
    ]);
    render(<Chat agent={idleAgent} threadId="data-renderer" initialMessages={[message]} />);

    expect(screen.getByText(/saved/)).toBeTruthy();
    expect(screen.getByText(/2/)).toBeTruthy();
  });

  it('lets a custom renderer replace one streamed tool row', () => {
    const callEvent: DistriEvent = {
      type: 'tool_calls',
      data: { tool_calls: [
        { tool_call_id: 'tool-custom', tool_name: 'lookup_food', input: { query: 'oats' } },
        { tool_call_id: 'tool-default', tool_name: 'get_recipes', input: { ingredient: 'oats' } },
      ] },
    };
    const messages: DistriChatMessage[] = [callEvent];
    render(<Chat
      agent={idleAgent}
      threadId="tool-renderer"
      initialMessages={messages}
      toolRenderers={{ lookup_food: ({ toolCall }) => <span>Custom {toolCall.tool_name}</span> }}
    />);

    expect(screen.getByText('Custom lookup_food')).toBeTruthy();
    expect(screen.getByText('get_recipes')).toBeTruthy();
  });

  it('shows compact tool details in minimal mode and inputs in rich mode', () => {
    const callEvent: DistriEvent = {
      type: 'tool_calls',
      data: { tool_calls: [{ tool_call_id: 'tool-mode', tool_name: 'lookup_food', input: { query: 'steel cut oats' } }] },
    };
    const handler = async () => 'oat results';
    const tool = { name: 'lookup_food', description: 'Look up food', parameters: {}, type: 'function' as const, handler };

    const minimal = render(<Chat agent={idleAgent} threadId="tool-minimal" initialMessages={[callEvent]} externalTools={[tool]} />);
    expect(screen.getByText('lookup_food')).toBeTruthy();
    expect(screen.queryByText(/steel cut oats/)).toBeNull();
    minimal.unmount();

    render(<Chat agent={idleAgent} threadId="tool-rich" initialMessages={[callEvent]} externalTools={[tool]} rendering="rich" />);
    expect(screen.getByText(/steel cut oats/)).toBeTruthy();
    expect(screen.getByText('Run')).toBeTruthy();
  });

  it('renders tool result payloads for successful and failed calls', () => {
    const resultEvent: DistriEvent = {
      type: 'tool_results',
      data: { results: [
        { tool_call_id: 'tool-ok', tool_name: 'lookup_food', parts: [{ part_type: 'data', data: { success: true, result: 'Oats found' } }] },
        { tool_call_id: 'tool-bad', tool_name: 'lookup_food', parts: [{ part_type: 'data', data: { success: false, error: 'Catalog unavailable' } }] },
      ] },
    };
    render(<Chat agent={idleAgent} threadId="tool-results" initialMessages={[resultEvent]} />);

    expect(screen.getByText(/Oats found/)).toBeTruthy();
    expect(screen.getByText(/Catalog unavailable/)).toBeTruthy();
  });

  it('renders native-safe live view and context compaction summaries', () => {
    const openURL = vi.spyOn(Linking, 'openURL');
    const events: DistriEvent[] = [
      { type: 'live_view', data: { view_id: 'preview-1', url: 'https://example.test/preview', title: 'Generated preview', width: 640, height: 400 } },
      { type: 'context_compaction', data: { tier: 'summarize', tokens_before: 12000, tokens_after: 4500, entries_affected: 8, context_limit: 16000, usage_ratio: 0.75, summary: 'Kept the key product decisions.' } },
    ];
    render(<Chat agent={idleAgent} threadId="native-events" initialMessages={events} />);

    expect(screen.getByText('Generated preview')).toBeTruthy();
    expect(screen.getByText('https://example.test/preview')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Open Generated preview'));
    expect(openURL).toHaveBeenCalledWith('https://example.test/preview');
    openURL.mockRestore();
    expect(screen.getByText(/Context summarized/)).toBeTruthy();
    expect(screen.getByText(/Kept the key product decisions/)).toBeTruthy();
  });

  it('runs a confirmed client function and completes the tool with its result', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const handler = vi.fn(async ({ food }: { food: string }) => ({ calories: 150, food }));
    const completeTool = vi.fn(async () => {});
    async function* toolStream() {
      yield { type: 'tool_calls', data: { tool_calls: [{ tool_call_id: 'tool-confirm', tool_name: 'lookup_food', input: { food: 'oats' } }] } } satisfies DistriEvent;
      await gate;
    }
    const agent = { ...idleAgent, invokeStream: async () => toolStream(), completeTool } as unknown as Agent;
    render(<Chat agent={agent} threadId="tool-confirm" externalTools={[{
      name: 'lookup_food', description: 'Look up food', parameters: {}, type: 'function', handler,
    }]} />);

    fireEvent.change(screen.getByPlaceholderText('Message…'), { target: { value: 'How many calories in oats?' } });
    await act(async () => fireEvent.click(screen.getByLabelText('Send message')));
    await screen.findByLabelText('Approve lookup_food');
    await act(async () => fireEvent.click(screen.getByLabelText('Approve lookup_food')));

    expect(handler).toHaveBeenCalledWith({ food: 'oats' });
    await waitFor(() => expect(completeTool).toHaveBeenCalledOnce());
    expect(completeTool.mock.calls[0][0]).toMatchObject({
      tool_call_id: 'tool-confirm',
      tool_name: 'lookup_food',
      parts: [{ part_type: 'data', data: { success: true, result: { calories: 150, food: 'oats' } } }],
    });
    await act(async () => { release(); await Promise.resolve(); });
  });

  it('supports a native UI tool component registered as an external tool', async () => {
    const callEvent: DistriEvent = {
      type: 'tool_calls',
      data: { tool_calls: [{ tool_call_id: 'tool-ui', tool_name: 'choose_food', input: { choices: ['oats', 'eggs'] } }] },
    };
    render(<Chat agent={idleAgent} threadId="tool-ui" initialMessages={[callEvent]} externalTools={[{
      name: 'choose_food', description: 'Choose a food', parameters: {}, type: 'ui',
      component: ({ toolCall }) => <span>Native picker for {toolCall.tool_name}</span>,
    }]} />);

    expect(screen.getByText('Native picker for choose_food')).toBeTruthy();
  });
});
