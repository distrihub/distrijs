import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DistriClient } from '@distri/core';
import type { Agent, DistriChatMessage, DistriEvent, DistriPart } from '@distri/core';
import { Linking } from 'react-native';
import { Chat } from '../Chat';
import { ChatInput } from '../ChatInput';
import { isAwaitingReply } from '../messageVisibility';
import { parseMarkdown, Markdown } from '../Markdown';
import { createNativeTheme, defaultNativeTheme } from '../theme';

vi.mock('react-native', async () => import('./react-native.mock'));

const idleAgent = { name: 'parity', client: { ensureAccessToken: async () => {} }, invokeStream: async function* () {} } as unknown as Agent;
const answer = 'Leaves are green because of **chlorophyll**.';
const finalCall: DistriEvent = {
  type: 'tool_calls',
  data: { tool_calls: [{ tool_call_id: 'final-1', tool_name: 'final', input: { input: answer } }] },
};
const user = DistriClient.initDistriMessage('user', [{ part_type: 'text', data: 'Why are leaves green?' }]);
const reply = DistriClient.initDistriMessage('assistant', [{ part_type: 'text', data: answer }]);

describe('web parity', () => {
  afterEach(cleanup);

  it('hides the final tool call and shows the answer once, with Markdown', () => {
    render(<Chat agent={idleAgent} threadId="final" initialMessages={[user, finalCall, reply]} />);

    expect(screen.queryByLabelText(/Tool final/)).toBeNull();
    expect(screen.getAllByText('chlorophyll')).toHaveLength(1);
    expect(screen.queryByText(/\*\*/)).toBeNull();
  });

  it('waits for a reply until the first visible assistant output after the user message', () => {
    const budget = { type: 'context_budget_update', data: {} } as unknown as DistriEvent;
    expect(isAwaitingReply([user], true)).toBe(true);
    expect(isAwaitingReply([user, finalCall, budget], true)).toBe(true);
    expect(isAwaitingReply([user, finalCall, reply], true)).toBe(false);
    expect(isAwaitingReply([user], false)).toBe(false);
  });

  it('gives the header a send helper and knows when the transcript is empty', () => {
    const sent: string[] = [];
    const agent = {
      ...idleAgent,
      // An empty stream: the test only needs to see what was sent.
      // eslint-disable-next-line require-yield
      invokeStream: vi.fn(async function* (params: { message: { parts: Array<{ text?: string }> } }) {
        sent.push(params.message.parts.map(p => p.text ?? '').join(''));
      }),
    } as unknown as Agent;
    render(
      <Chat
        agent={agent}
        threadId="header"
        renderHeader={({ sendMessage, isEmpty }) => (isEmpty ? <button onClick={() => sendMessage('Give me a hint')}>hint</button> : null)}
      />,
    );

    fireEvent.click(screen.getByText('hint'));
    return waitFor(() => expect(sent).toContain('Give me a hint'));
  });
});

describe('Markdown', () => {
  afterEach(cleanup);

  it('parses headings, lists, quotes, code and rules', () => {
    const blocks = parseMarkdown('## Steps\n\n1. Read\n2. Write\n\n- dot\n\n> note\n\n```\ncode\n```\n\n---\nplain');
    expect(blocks.map(b => b.kind)).toEqual(['heading', 'list', 'list', 'quote', 'code', 'rule', 'paragraph']);
    expect(blocks[1]).toMatchObject({ ordered: true, items: ['Read', 'Write'] });
  });

  it('opens links and leaves snake_case literal', () => {
    const openURL = vi.spyOn(Linking, 'openURL');
    render(<Markdown>{'See [the guide](https://example.test/guide) for some_value.'}</Markdown>);

    fireEvent.click(screen.getByText('the guide'));
    expect(openURL).toHaveBeenCalledWith('https://example.test/guide');
    expect(screen.getByText(/some_value/)).toBeTruthy();
    openURL.mockRestore();
  });
});

describe('theme', () => {
  it('fills anything a partial theme leaves out from the defaults', () => {
    const theme = createNativeTheme({ colors: { userBubble: '#f1ebff' }, fonts: { body: 'Quicksand' } });
    expect(theme.colors.userBubble).toBe('#f1ebff');
    expect(theme.colors.primary).toBe(defaultNativeTheme.colors.primary);
    expect(theme.fonts).toMatchObject({ body: 'Quicksand', mono: 'monospace' });
  });
});

describe('image attachments', () => {
  afterEach(cleanup);

  it('attaches a picked image and sends it as an image part with the text', async () => {
    const onSend = vi.fn();
    const onPickImage = vi.fn(async () => ({ uri: 'file://leaf.jpg', base64: 'QUJD', mimeType: 'image/jpeg', name: 'leaf.jpg' }));
    render(<ChatInput onSend={onSend} onPickImage={onPickImage} />);

    fireEvent.click(screen.getByLabelText('Attach image'));
    expect(await screen.findByAltText('leaf.jpg')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Chat message'), { target: { value: 'Is this healthy?' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    const parts = onSend.mock.calls[0][0] as DistriPart[];
    expect(parts).toEqual([
      { part_type: 'text', data: 'Is this healthy?' },
      { part_type: 'image', data: { type: 'bytes', mime_type: 'image/jpeg', bytes: 'QUJD', name: 'leaf.jpg' } },
    ]);
    expect(screen.queryByAltText('leaf.jpg')).toBeNull();
  });

  it('shows no attach button when the app provides no picker', () => {
    render(<ChatInput onSend={vi.fn()} />);
    expect(screen.queryByLabelText('Attach image')).toBeNull();
  });
});

// Keeps the imported type used when a test is skipped by a filter.
export type { DistriChatMessage };
