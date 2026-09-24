import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThreadPicker } from '../ThreadPicker';

vi.mock('react-native', async () => import('./react-native.mock'));

const getThreads = vi.fn(async () => ({
  threads: [
    { id: 't-old', title: 'Nouns', agent_id: 'a', agent_name: 'a', updated_at: '2026-09-01T00:00:00Z', message_count: 2, last_message: 'A noun names a thing.' },
    { id: 't-new', title: 'Leaves', agent_id: 'a', agent_name: 'a', updated_at: '2026-09-20T00:00:00Z', message_count: 4 },
  ],
  total: 2, page: 1, page_size: 20,
}));
vi.mock('../DistriNativeProvider', () => ({ useDistriNative: () => ({ client: { getThreads }, error: null, isLoading: false }) }));

describe('ThreadPicker', () => {
  afterEach(cleanup);

  it('lists conversations newest first and switches or starts a new one', async () => {
    const onSelect = vi.fn();
    const onNewThread = vi.fn();
    render(<ThreadPicker agent_id="a" currentThreadId="t-new" onSelect={onSelect} onNewThread={onNewThread} />);

    fireEvent.click(screen.getByLabelText('Choose conversation'));
    const rows = await screen.findAllByLabelText(/^Open /);
    expect(rows.map(r => r.getAttribute('aria-label'))).toEqual(['Open Leaves', 'Open Nouns']);
    expect(getThreads).toHaveBeenCalledWith({ agent_id: 'a' });

    fireEvent.click(screen.getByLabelText('Open Nouns'));
    expect(onSelect).toHaveBeenCalledWith('t-old');

    fireEvent.click(screen.getByLabelText('Choose conversation'));
    fireEvent.click(await screen.findByLabelText('New conversation'));
    expect(onNewThread).toHaveBeenCalled();
  });
});
