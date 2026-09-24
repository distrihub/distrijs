import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Agent, DistriClient } from '@distri/core';
import { useChat } from '../useChat';

async function* emptyStream(): AsyncGenerator<never> {}

function makeAgent(invokeStream = vi.fn(async () => emptyStream())): Agent {
  return {
    name: 'native-agent',
    client: { ensureAccessToken: vi.fn(async () => {}) },
    invokeStream,
  } as unknown as Agent;
}

describe('useChat parity with @distri/react', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('adds the optimistic user message and forwards per-send metadata', async () => {
    const invokeStream = vi.fn(async () => emptyStream());
    const agent = makeAgent(invokeStream);
    const { result } = renderHook(() => useChat({ threadId: 'thread-1', agent }));

    await act(async () => {
      await result.current.sendMessage('hello from native', {
        metadata: { load_skills: ['mobile_chat'] },
      });
    });

    expect(invokeStream).toHaveBeenCalledOnce();
    expect(invokeStream.mock.calls[0][0]).toMatchObject({
      metadata: { load_skills: ['mobile_chat'] },
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({ role: 'user' });
  });

  it('keeps persisted initial messages separate from the live store', () => {
    const initialMessage = DistriClient.initDistriMessage('assistant', [{ part_type: 'text', data: 'history' }]);
    const { result } = renderHook(() => useChat({
      threadId: 'thread-2',
      agent: null,
      initialMessages: [initialMessage],
    }));

    expect(result.current.messages).toEqual([initialMessage]);
    expect(result.current.store.getState().messages).toEqual([]);
  });
});
