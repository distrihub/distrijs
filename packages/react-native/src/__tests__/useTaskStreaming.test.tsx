import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Agent, DistriChatMessage, DistriEvent } from '@distri/core';
import * as native from '../index';

vi.mock('react-native', async () => import('./react-native.mock'));

afterEach(cleanup);

describe('native task streaming API', () => {
  it('exports a React hook for following an existing task', () => {
    expect(native.useTaskStreaming).toBeTypeOf('function');
  });

  it('streams task history and stops when the task reaches its terminal event', async () => {
    const taskId = 'task-follow-1';
    const message: DistriChatMessage = {
      id: 'assistant-follow-1',
      role: 'assistant',
      parts: [{ part_type: 'text', data: 'Task answer from resubscribe' }],
      created_at: 1,
    };
    const agent = {
      resubscribe: async function* (subscribedTaskId: string) {
        expect(subscribedTaskId).toBe(taskId);
        yield message;
        yield { type: 'run_finished', taskId, data: { taskId } } satisfies DistriEvent;
      },
    } as unknown as Agent;
    const api = native as unknown as { useTaskStreaming: (options: { agent: Agent; taskId: string }) => { messages: DistriChatMessage[]; isTerminal: boolean } };

    const { result } = renderHook(() => api.useTaskStreaming({ agent, taskId }));
    await waitFor(() => expect(result.current.isTerminal).toBe(true));

    expect(result.current.messages).toContainEqual(message);
  });

  it('does not process a blocked resubscribe event after unmount', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const store = native.createChatStore();
    const agent = {
      resubscribe: async function* () {
        await gate;
        yield { id: 'late-task-message', role: 'assistant', parts: [{ part_type: 'text', data: 'late update' }], created_at: 2 } satisfies DistriChatMessage;
      },
    } as unknown as Agent;
    const api = native as unknown as { useTaskStreaming: (options: { agent: Agent; taskId: string; store: ReturnType<typeof native.createChatStore> }) => { store: ReturnType<typeof native.createChatStore> } };

    const { unmount } = renderHook(() => api.useTaskStreaming({ agent, taskId: 'task-stop', store }));
    unmount();
    await act(async () => { release(); await Promise.resolve(); });

    expect(store.getState().messages).toEqual([]);
  });
});
