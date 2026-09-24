import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useThreadHistory } from '../useThreadHistory';

vi.mock('react-native', async () => import('./react-native.mock'));

const pending = new Map<string, (items: unknown[]) => void>();
const getThreadMessages = vi.fn((threadId: string) => new Promise<unknown[]>((resolve) => { pending.set(threadId, resolve); }));
// Stable across renders, like the provider's memoized client.
const native = { client: { getThreadMessages }, error: null, isLoading: false };
vi.mock('../DistriNativeProvider', () => ({ useDistriNative: () => native }));

const message = (id: string, text: string) => ({ kind: 'message', messageId: id, role: 'user', parts: [{ kind: 'text', text }] });

describe('useThreadHistory', () => {
  it('never shows a previous thread, even when its answer arrives last', async () => {
    const { result, rerender } = renderHook(({ id }) => useThreadHistory(id), { initialProps: { id: 'a' } });
    expect(result.current.loading).toBe(true);

    // Switch to b before a answers: the first render for b is already loading and empty.
    rerender({ id: 'b' });
    expect(result.current.loading).toBe(true);
    expect(result.current.messages).toEqual([]);

    await act(async () => { pending.get('b')!([message('mb', 'from b')]); });
    await act(async () => { pending.get('a')!([message('ma', 'from a')]); });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages.map((m) => (m as { id?: string }).id)).toEqual(['mb']);
  });
});
