import { describe, expect, it, vi } from 'vitest';
import { Agent } from '@distri/core';
import { ChatController } from '../chat/ChatController';
import { createChatStore } from '../chat/chatStore';

describe('ChatController stream cancellation', () => {
  it('forwards stopStreaming cancellation to the agent transport', async () => {
    let requestSignal: AbortSignal | undefined;
    const agent = {
      client: { ensureAccessToken: vi.fn(async () => {}) },
      invokeStream: vi.fn(async (_params, _tools, _hooks, options) => {
        requestSignal = options?.signal;
        return (async function* () {
          await new Promise<void>(resolve => {
            requestSignal?.addEventListener('abort', () => resolve(), { once: true });
          });
        }());
      }),
    } as unknown as Agent;
    const controller = new ChatController(createChatStore(), 'thread-abort');
    controller.setAgent(agent);

    const sending = controller.sendMessage('cancel this stream');
    await vi.waitFor(() => expect(requestSignal).toBeDefined());
    controller.stopStreaming();
    await sending;

    expect(requestSignal?.aborted).toBe(true);
  });
});
