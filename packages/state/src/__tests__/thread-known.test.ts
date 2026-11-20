import { describe, expect, it, vi } from 'vitest';
import type { Agent, DistriChatMessage, PendingCall } from '@distri/core';
import { ChatController } from '../chat/ChatController';
import { createChatStore } from '../chat/chatStore';

/**
 * G4 (distri-cloud docs/specs/2026-11-20-a2a-wire-contract.md): a thread id
 * the client minted is not on the server until its first send, so nothing
 * asks the server about it (no pending-calls probe) before then.
 */

const pending: PendingCall = {
  id: 'c1', task_id: 'task-1', thread_id: 'th-new', kind: 'client_tool', tool_name: 'book_table',
  request: { tool_call_id: 'c1', tool_name: 'book_table', input: {} }, status: 'pending',
};

async function* streamOf(events: unknown[]) {
  for (const e of events) yield e as DistriChatMessage;
}

function agentStub() {
  return {
    name: 'agent',
    client: { ensureAccessToken: vi.fn(async () => {}) },
    supportsDurableRuns: vi.fn(async () => true),
    listPendingCalls: vi.fn(async () => [] as PendingCall[]),
    claimPendingCall: vi.fn(async () => ({ claimed: true })),
    completeTool: vi.fn(async () => ({ status: 'completed' })),
    invokeStream: vi.fn(async () => streamOf([
      { type: 'run_started', taskId: 'task-1', data: { taskId: 'task-1' } },
      { type: 'run_finished', taskId: 'task-1', data: { taskId: 'task-1' } },
    ])),
  };
}

function setup(threadId: string, options?: { threadKnown?: boolean }) {
  const agent = agentStub();
  const store = createChatStore();
  store.getState().setAgent(agent as unknown as Agent);
  const controller = new ChatController(store, threadId, options);
  controller.setAgent(agent as unknown as Agent);
  controller.resubscribeDelay = async () => {};
  return { agent, store, controller };
}

describe('a thread the client just minted (G4)', () => {
  it('a thread is known by default (reopened), so recovery lists its pending calls', async () => {
    const { agent, controller } = setup('th-old');
    expect(controller.isThreadKnown()).toBe(true);
    await controller.recoverPendingCalls({ follow: false });
    expect(agent.listPendingCalls).toHaveBeenCalledWith({ threadId: 'th-old' });
  });

  it('a new thread (threadKnown: false) is not probed', async () => {
    const { agent, controller } = setup('th-new', { threadKnown: false });
    expect(controller.isThreadKnown()).toBe(false);
    await expect(controller.recoverPendingCalls({ follow: false })).resolves.toEqual([]);
    expect(agent.listPendingCalls).not.toHaveBeenCalled();
  });

  it('becomes known after its first send; then recovery lists its pending calls', async () => {
    const { agent, controller } = setup('th-new', { threadKnown: false });
    await controller.sendMessage('hello');
    expect(agent.invokeStream).toHaveBeenCalledTimes(1);
    expect(controller.isThreadKnown()).toBe(true);
    // Re-asserting "new" for the same id does not forget the send.
    controller.setThreadId('th-new', { known: false });
    expect(controller.isThreadKnown()).toBe(true);

    agent.listPendingCalls.mockResolvedValueOnce([pending]);
    const calls = await controller.recoverPendingCalls({ follow: false });
    expect(agent.listPendingCalls).toHaveBeenCalledWith({ threadId: 'th-new' });
    expect(calls).toHaveLength(1);
  });

  it('markThreadKnown makes a new thread known', async () => {
    const { agent, controller } = setup('th-new', { threadKnown: false });
    controller.markThreadKnown();
    await controller.recoverPendingCalls({ follow: false });
    expect(agent.listPendingCalls).toHaveBeenCalledTimes(1);
  });

  it('switching thread: known by default, new with { known: false }', async () => {
    const { agent, controller } = setup('th-a');
    controller.setThreadId('th-b', { known: false });
    expect(controller.isThreadKnown()).toBe(false);
    await controller.recoverPendingCalls({ follow: false });
    expect(agent.listPendingCalls).not.toHaveBeenCalled();
    controller.setThreadId('th-c');
    expect(controller.isThreadKnown()).toBe(true);
  });
});
