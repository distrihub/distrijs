import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Agent,
  DistriChatMessage,
  DistriEvent,
  DistriMessage,
  PendingCall,
  ToolCallClosedError,
} from '@distri/core';
import { ChatController } from '../chat/ChatController';
import { createChatStore, ChatStore, resetStartedInThisPage } from '../chat/chatStore';
import { TaskStreamingController } from '../chat/taskStreamingController';
import { windowInstanceId } from '../chat/durable';

/**
 * Durable runs in the chat state layer (spec 2026-11-20-durable-runs-and-nodes
 * §2.7, S4, S5, S6, S28): replays never run tools, the pending-calls list does
 * (claimed, once), a parked run keeps the chat waiting, a dropped stream is
 * resubscribed, and an old server keeps today's resume path.
 */

const ev = (e: unknown) => e as DistriEvent;

function bookTable(handler = vi.fn(async (_input: unknown) => ({ booked: true }))) {
  return {
    tool: {
      type: 'function' as const,
      name: 'book_table',
      description: 'Book a table',
      parameters: {},
      handler,
      autoExecute: true,
      isExternal: true,
    },
    handler,
  };
}

function pendingCall(id: string, overrides: Partial<PendingCall> = {}): PendingCall {
  return {
    id,
    task_id: 'task-1',
    thread_id: 'th-1',
    kind: 'client_tool',
    tool_name: 'book_table',
    request: { tool_call_id: id, tool_name: 'book_table', input: { party: 2 } },
    status: 'pending',
    ...overrides,
  };
}

/** One in-memory "server": pending calls, first claim wins, completions. */
function fakeServer(calls: PendingCall[] = []) {
  const claims = new Map<string, string>();
  const completed: Array<{ tool_call_id: string }> = [];
  return {
    calls,
    claims,
    completed,
    agentFor(extra: Partial<Record<string, unknown>> = {}): Agent {
      return {
        name: 'agent',
        client: { ensureAccessToken: vi.fn(async () => {}), hasCapability: () => false },
        supportsDurableRuns: vi.fn(async () => true),
        listPendingCalls: vi.fn(async () => calls.filter((c) => c.status === 'pending')),
        claimPendingCall: vi.fn(async (id: string, instanceId: string) => {
          const holder = claims.get(id);
          if (holder && holder !== instanceId) return { claimed: false, claimed_by: holder };
          claims.set(id, instanceId);
          return { claimed: true, until: 'later' };
        }),
        completeTool: vi.fn(async (result: { tool_call_id: string }) => {
          completed.push(result);
          return { status: 'completed' };
        }),
        ...extra,
      } as unknown as Agent;
    },
  };
}

function setup(agent: Agent, tools: unknown[], threadId = 'th-1') {
  const store = createChatStore();
  store.getState().setAgent(agent);
  store.getState().setExternalTools(tools as never);
  const controller = new ChatController(store, threadId, { threadKnown: true });
  controller.setAgent(agent);
  controller.setExternalTools(tools as never);
  controller.resubscribeDelay = async () => {};
  return { store, controller };
}

async function* streamOf(events: unknown[], gate?: Promise<void>, gateAfter = Infinity) {
  let i = 0;
  for (const e of events) {
    if (i++ === gateAfter && gate) await gate;
    yield e as DistriChatMessage;
  }
}

function text(store: ChatStore): string[] {
  return store.getState().messages
    .filter((m) => (m as DistriMessage).role === 'assistant')
    .map((m) => ((m as DistriMessage).parts[0] as { data: string }).data);
}

afterEach(() => {
  vi.restoreAllMocks();
  resetStartedInThisPage();
});

describe('replayed tool calls never run (S5)', () => {
  it('a history/replay tool_calls event shows the call without running it', () => {
    const { tool, handler } = bookTable();
    const store = createChatStore();
    store.getState().setExternalTools([tool] as never);
    store.getState().processMessage(ev({
      type: 'tool_calls', taskId: 'task-1',
      data: { tool_calls: [{ tool_call_id: 'c1', tool_name: 'book_table', input: {} }] },
    }), false);
    expect(store.getState().toolCalls.get('c1')).toMatchObject({ isExternal: true, isLiveStream: false });
    expect(handler).not.toHaveBeenCalled();
  });

  it('a resubscribe follow (TaskStreamingController) never runs tools', async () => {
    const { tool, handler } = bookTable();
    const store = createChatStore();
    store.getState().setExternalTools([tool] as never);
    const agent = {
      resubscribe: () => streamOf([
        { type: 'run_started', taskId: 'task-1', data: { taskId: 'task-1' } },
        { type: 'tool_calls', taskId: 'task-1', data: { tool_calls: [{ tool_call_id: 'c1', tool_name: 'book_table', input: {} }] } },
        { type: 'run_finished', taskId: 'task-1', data: { taskId: 'task-1' } },
      ]),
    } as unknown as Agent;
    const done = new Promise<boolean>((resolve) => {
      new TaskStreamingController(store).start({ agent, taskId: 'task-1', onTerminalChange: (t) => t && resolve(t) });
    });
    await done;
    expect(store.getState().toolCalls.has('c1')).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('pending calls after a reload (S4, S28)', () => {
  it('fetches the thread\'s pending calls, claims, runs the tool once and completes it', async () => {
    const server = fakeServer([pendingCall('c1')]);
    const agent = server.agentFor();
    const { tool, handler } = bookTable();
    const { store, controller } = setup(agent, [tool]);

    // History already showed the call (replay: not run).
    store.getState().processMessage(ev({
      type: 'tool_calls', taskId: 'task-1',
      data: { tool_calls: [{ tool_call_id: 'c1', tool_name: 'book_table', input: { party: 2 } }] },
    }), false);
    expect(handler).not.toHaveBeenCalled();

    await controller.recoverPendingCalls({ follow: false });
    await vi.waitFor(() => expect(server.completed).toHaveLength(1));
    expect(agent.listPendingCalls).toHaveBeenCalledWith({ threadId: 'th-1' });
    expect(agent.claimPendingCall).toHaveBeenCalledWith('c1', store.getState().instanceId);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ party: 2 });
    expect(server.completed[0]).toMatchObject({ tool_call_id: 'c1', tool_name: 'book_table' });
    expect(store.getState().parkedRun).toMatchObject({ taskId: 'task-1', pending: ['c1'] });

    // A second sync, a replayed run_parked, and a live duplicate: still once.
    await controller.recoverPendingCalls({ follow: false });
    store.getState().processMessage(ev({ type: 'run_parked', taskId: 'task-1', data: { taskId: 'task-1', pending: ['c1'] } }), false);
    store.getState().processMessage(ev({
      type: 'tool_calls', taskId: 'task-1',
      data: { tool_calls: [{ tool_call_id: 'c1', tool_name: 'book_table', input: { party: 2 } }] },
    }), true);
    await new Promise((r) => setTimeout(r, 10));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(server.completed).toHaveLength(1);
  });

  it('skips calls for tools this chat does not have, and non-client-tool waits', async () => {
    const server = fakeServer([
      pendingCall('other', { tool_name: 'other_tool', request: { tool_call_id: 'other', tool_name: 'other_tool', input: {} } }),
      pendingCall('appr', { kind: 'approval' }),
    ]);
    const agent = server.agentFor();
    const { tool, handler } = bookTable();
    const { controller } = setup(agent, [tool]);
    await controller.recoverPendingCalls({ follow: false });
    expect(agent.claimPendingCall).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it('follows the parked task, showing only what comes after the park point', async () => {
    const server = fakeServer([pendingCall('c1')]);
    let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    const agent = server.agentFor({
      resubscribe: vi.fn(() => streamOf([
        { type: 'run_started', taskId: 'task-1', data: { taskId: 'task-1' } },
        { type: 'text_message_start', taskId: 'task-1', data: { message_id: 'm-old', step_id: 's1', role: 'assistant' } },
        { type: 'text_message_content', taskId: 'task-1', data: { message_id: 'm-old', step_id: 's1', delta: 'Already in history' } },
        { type: 'tool_calls', taskId: 'task-1', data: { tool_calls: [{ tool_call_id: 'c1', tool_name: 'book_table', input: { party: 2 } }] } },
        { type: 'run_parked', taskId: 'task-1', data: { taskId: 'task-1', pending: ['c1'] } },
        { type: 'tool_results', taskId: 'task-1', data: { results: [{ tool_call_id: 'c1', tool_name: 'book_table', parts: [] }] } },
        { type: 'text_message_start', taskId: 'task-1', data: { message_id: 'm-new', step_id: 's2', role: 'assistant' } },
        { type: 'text_message_content', taskId: 'task-1', data: { message_id: 'm-new', step_id: 's2', delta: 'Booked.' } },
        { type: 'run_finished', taskId: 'task-1', data: { taskId: 'task-1' } },
      ], gate, 6)),
    });
    const { tool, handler } = bookTable();
    const { store, controller } = setup(agent, [tool]);

    await controller.recoverPendingCalls();
    await vi.waitFor(() => expect(store.getState().parkedRun).toBeDefined());
    expect(store.getState().isStreaming).toBe(true);
    release();
    await vi.waitFor(() => expect(store.getState().isStreaming).toBe(false));
    expect(text(store)).toEqual(['Booked.']);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(store.getState().parkedRun).toBeUndefined();
  });
});

describe('a live call on a durable server', () => {
  it('runs once claimed even if tool_execution_start arrived while the claim was in flight', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const server = fakeServer([pendingCall('c1')]);
    const claim = server.agentFor().claimPendingCall as unknown as (id: string, i: string) => Promise<unknown>;
    const agent = server.agentFor({
      claimPendingCall: vi.fn(async (id: string, instanceId: string) => {
        await gate;
        return claim(id, instanceId);
      }),
    });
    const { tool, handler } = bookTable();
    const { store } = setup(agent, [tool]);
    store.getState().setDurableRuns(true);
    store.getState().processMessage(ev({
      type: 'tool_calls', taskId: 'task-1',
      data: { tool_calls: [{ tool_call_id: 'c1', tool_name: 'book_table', input: { party: 2 } }] },
    }), true);
    // The server announces the external call it is now waiting on.
    store.getState().processMessage(ev({
      type: 'tool_execution_start', taskId: 'task-1',
      data: { tool_call_id: 'c1', tool_call_name: 'book_table', input: { party: 2 }, step_id: 's1' },
    }), true);
    release();
    await vi.waitFor(() => expect(server.completed).toHaveLength(1));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('a call the server expired (S5)', () => {
  it('marks the call expired when its timed-out result arrives', () => {
    const { tool } = bookTable();
    const store = createChatStore();
    store.getState().setExternalTools([tool] as never);
    store.getState().processMessage(ev({
      type: 'tool_calls', taskId: 'task-1',
      data: { tool_calls: [{ tool_call_id: 'c1', tool_name: 'book_table', input: {} }] },
    }), false);
    store.getState().processMessage(ev({
      type: 'tool_results', taskId: 'task-1',
      data: { results: [{ tool_call_id: 'c1', tool_name: 'book_table', parts: [{ part_type: 'data', data: { error: 'timed out', status: 'expired' } }] }] },
    }), true);
    expect(store.getState().toolCalls.get('c1')).toMatchObject({ status: 'error', remoteStatus: 'expired' });
  });
});

describe('a reload is the same window (S4)', () => {
  it('keeps the instance id in sessionStorage, so the reloaded tab takes back its own claim', async () => {
    const kv = new Map<string, string>();
    const storage = { getItem: (k: string) => kv.get(k) ?? null, setItem: (k: string, v: string) => void kv.set(k, v) };
    let n = 0;
    const make = () => `id-${++n}`;
    expect(windowInstanceId(make, storage)).toBe('id-1');
    expect(windowInstanceId(make, storage)).toBe('id-1');
    expect(windowInstanceId(make, null)).toBe('id-2');

    // Before the reload this window claimed c1 and showed the tool; after it, the same id claims again.
    const server = fakeServer([pendingCall('c1')]);
    server.claims.set('c1', 'tab-1');
    const { tool, handler } = bookTable();
    const { store, controller } = setup(server.agentFor(), [tool]);
    store.setState({ instanceId: 'tab-1' });
    await controller.recoverPendingCalls({ follow: false });
    await vi.waitFor(() => expect(server.completed).toHaveLength(1));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('two windows (S5)', () => {
  it('takes the call over when the other window\'s claim lease ends without an answer', async () => {
    vi.useFakeTimers();
    try {
      const server = fakeServer([pendingCall('c1')]);
      server.claims.set('c1', 'gone-window');
      const until = new Date(Date.now() + 60_000).toISOString();
      const claim = vi.fn(async (id: string, instanceId: string) => {
        const holder = server.claims.get(id);
        if (holder && holder !== instanceId) return { claimed: false, claimed_by: holder, until };
        server.claims.set(id, instanceId);
        return { claimed: true, until: 'later' };
      });
      const { tool, handler } = bookTable();
      const { store, controller } = setup(server.agentFor({ claimPendingCall: claim }), [tool]);
      await controller.recoverPendingCalls({ follow: false });
      expect(store.getState().toolCalls.get('c1')).toMatchObject({ remoteStatus: 'running_elsewhere' });
      expect(handler).not.toHaveBeenCalled();

      // The other window closed: its lease runs out.
      server.claims.delete('c1');
      await vi.advanceTimersByTimeAsync(61_500);
      expect(handler).toHaveBeenCalledTimes(1);
      await vi.waitFor(() => expect(server.completed).toHaveLength(1));
    } finally {
      vi.useRealTimers();
    }
  });

  it('one claim wins; the other shows "running in another window"', async () => {
    const server = fakeServer([pendingCall('c1')]);
    const a = bookTable();
    const b = bookTable();
    const tabA = setup(server.agentFor(), [a.tool]);
    const tabB = setup(server.agentFor(), [b.tool]);

    await Promise.all([
      tabA.controller.recoverPendingCalls({ follow: false }),
      tabB.controller.recoverPendingCalls({ follow: false }),
    ]);
    await vi.waitFor(() => expect(server.completed).toHaveLength(1));
    expect(a.handler.mock.calls.length + b.handler.mock.calls.length).toBe(1);
    const loser = a.handler.mock.calls.length === 1 ? tabB : tabA;
    expect(loser.store.getState().toolCalls.get('c1')).toMatchObject({ remoteStatus: 'running_elsewhere', status: 'running' });
  });
});

describe('completing a tool on a durable server', () => {
  it('uses complete-tool even when not streaming (capability, not isStreaming)', async () => {
    const server = fakeServer();
    const agent = server.agentFor();
    const store = createChatStore();
    store.getState().setAgent(agent);
    store.getState().setDurableRuns(true);
    const resume = vi.fn(async () => {});
    store.getState().setResumeWithToolResult(resume);
    expect(store.getState().isStreaming).toBe(false);
    await store.getState().completeTool(
      { tool_call_id: 'c1', tool_name: 'book_table', input: {} },
      { tool_call_id: 'c1', tool_name: 'book_table', parts: [] },
    );
    expect(agent.completeTool).toHaveBeenCalledTimes(1);
    expect(resume).not.toHaveBeenCalled();
  });

  it('an old server keeps the resumeWithToolResult fallback when not streaming', async () => {
    const server = fakeServer();
    const agent = server.agentFor({ supportsDurableRuns: vi.fn(async () => false) });
    const store = createChatStore();
    store.getState().setAgent(agent);
    const resume = vi.fn(async () => {});
    store.getState().setResumeWithToolResult(resume);
    await store.getState().completeTool(
      { tool_call_id: 'c1', tool_name: 'book_table', input: {} },
      { tool_call_id: 'c1', tool_name: 'book_table', parts: [{ part_type: 'text', data: 'ok' }] },
    );
    expect(resume).toHaveBeenCalledWith([{ part_type: 'text', data: 'ok' }]);
    expect(agent.completeTool).not.toHaveBeenCalled();
    // ...and while streaming it completes in place, as before.
    store.getState().setStreaming(true);
    await store.getState().completeTool(
      { tool_call_id: 'c2', tool_name: 'book_table', input: {} },
      { tool_call_id: 'c2', tool_name: 'book_table', parts: [] },
    );
    expect(agent.completeTool).toHaveBeenCalledTimes(1);
  });

  it('an expired call is marked expired; the run and other calls are untouched', async () => {
    const agent = fakeServer().agentFor({
      completeTool: vi.fn(async () => { throw new ToolCallClosedError('c1', 'expired'); }),
    });
    const store = createChatStore();
    store.getState().setAgent(agent);
    store.getState().setDurableRuns(true);
    store.getState().setStreaming(true);
    store.getState().initToolCall({ tool_call_id: 'c1', tool_name: 'x', input: {} }, undefined, false, 'task-1');
    store.getState().initToolCall({ tool_call_id: 'c2', tool_name: 'y', input: {} }, undefined, false, 'task-1');
    await store.getState().completeTool(
      { tool_call_id: 'c1', tool_name: 'x', input: {} },
      { tool_call_id: 'c1', tool_name: 'x', parts: [] },
    );
    expect(store.getState().toolCalls.get('c1')).toMatchObject({ status: 'error', remoteStatus: 'expired' });
    expect(store.getState().toolCalls.get('c2')?.status).toBe('running');
    expect(store.getState().isStreaming).toBe(true);
  });
});

describe('a parked run (B5)', () => {
  it('keeps the stream and the controller waiting; nothing pending is failed', async () => {
    const server = fakeServer([pendingCall('c1')]);
    let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    const agent = server.agentFor({
      invokeStream: vi.fn(async () => streamOf([
        { type: 'run_started', taskId: 'task-1', data: { taskId: 'task-1' } },
        { type: 'tool_calls', taskId: 'task-1', data: { tool_calls: [
          { tool_call_id: 'c1', tool_name: 'book_table', input: { party: 2 } },
          { tool_call_id: 'srv', tool_name: 'Bash', input: {} },
        ] } },
        { type: 'run_parked', taskId: 'task-1', data: { taskId: 'task-1', pending: ['c1'], deadline: '2026-11-20T10:15:00Z' } },
        { type: 'tool_results', taskId: 'task-1', data: { results: [{ tool_call_id: 'srv', tool_name: 'Bash', parts: [] }] } },
        { type: 'run_finished', taskId: 'task-1', data: { taskId: 'task-1' } },
      ], gate, 3)),
    });
    const { tool, handler } = bookTable();
    const { store, controller } = setup(agent, [tool]);

    const sending = controller.sendMessage('book a table');
    await vi.waitFor(() => expect(store.getState().parkedRun).toBeDefined());
    await vi.waitFor(() => expect(server.completed).toHaveLength(1));
    const s = store.getState();
    expect(s.isStreaming).toBe(true);
    expect(s.parkedRun).toMatchObject({ taskId: 'task-1', pending: ['c1'], deadline: '2026-11-20T10:15:00Z' });
    expect(s.tasks.get('task-1')?.parked?.pending).toEqual(['c1']);
    expect(s.toolCalls.get('srv')?.status).toBe('running'); // not failed
    expect(s.toolCalls.get('c1')?.status).toBe('completed');
    expect(handler).toHaveBeenCalledTimes(1); // live call + run_parked sync: once

    release();
    await sending;
    expect(store.getState().isStreaming).toBe(false);
    expect(store.getState().parkedRun).toBeUndefined();
    expect(store.getState().error).toBeNull();
  });
});

describe('a dropped stream (R6)', () => {
  it('resubscribes and continues without doubling what was shown', async () => {
    const server = fakeServer();
    const live = [
      { type: 'run_started', taskId: 'task-1', data: { taskId: 'task-1' } },
      { type: 'text_message_start', taskId: 'task-1', data: { message_id: 'm1', step_id: 's1', role: 'assistant' } },
      { type: 'text_message_content', taskId: 'task-1', data: { message_id: 'm1', step_id: 's1', delta: 'Hel' } },
    ];
    const agent = server.agentFor({
      invokeStream: vi.fn(async () => streamOf([
        ...live,
        { type: 'run_error', data: { message: 'network error', code: 'STREAM_ERROR' } },
      ])),
      resubscribe: vi.fn(() => streamOf([
        ...live,
        { type: 'text_message_content', taskId: 'task-1', data: { message_id: 'm1', step_id: 's1', delta: 'lo' } },
        { type: 'run_finished', taskId: 'task-1', data: { taskId: 'task-1' } },
      ])),
    });
    const onError = vi.fn();
    const { store, controller } = setup(agent, []);
    controller.setCallbacks({ onError });

    await controller.sendMessage('hi');
    expect(agent.resubscribe).toHaveBeenCalledWith('task-1', expect.objectContaining({ signal: expect.anything() }));
    expect(text(store)).toEqual(['Hello']);
    expect(store.getState().tasks.get('task-1')?.status).toBe('completed');
    expect(store.getState().error).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });

  it('an old server: a drop ends the turn as before (no resubscribe)', async () => {
    const agent = fakeServer().agentFor({
      supportsDurableRuns: vi.fn(async () => false),
      invokeStream: vi.fn(async () => streamOf([
        { type: 'run_started', taskId: 'task-1', data: { taskId: 'task-1' } },
        { type: 'run_error', data: { message: 'network error', code: 'STREAM_ERROR' } },
      ])),
      resubscribe: vi.fn(),
    });
    const { store, controller } = setup(agent, []);
    await controller.sendMessage('hi');
    expect(agent.resubscribe).not.toHaveBeenCalled();
    expect(store.getState().isStreaming).toBe(false);
  });
});

describe('segment attempts (S6)', () => {
  it('drops events of a superseded attempt and what it drew', () => {
    const store = createChatStore();
    const p = (e: unknown) => store.getState().processMessage(ev(e), true);
    p({ type: 'step_started', taskId: 't', attempt: 1, stepId: 's1', data: { step_id: 's1', step_title: 'x', step_index: 0 } });
    p({ type: 'text_message_start', taskId: 't', attempt: 1, stepId: 's1', data: { message_id: 'm1', step_id: 's1', role: 'assistant' } });
    p({ type: 'text_message_content', taskId: 't', attempt: 1, stepId: 's1', data: { message_id: 'm1', step_id: 's1', delta: 'partial' } });
    // The worker crashed; another re-runs the step.
    p({ type: 'step_started', taskId: 't', attempt: 2, stepId: 's1', data: { step_id: 's1', step_title: 'x', step_index: 0 } });
    expect(text(store)).toEqual([]);
    p({ type: 'text_message_start', taskId: 't', attempt: 2, stepId: 's1', data: { message_id: 'm2', step_id: 's1', role: 'assistant' } });
    p({ type: 'text_message_content', taskId: 't', attempt: 1, stepId: 's1', data: { message_id: 'm1', step_id: 's1', delta: ' late' } });
    p({ type: 'text_message_content', taskId: 't', attempt: 2, stepId: 's1', data: { message_id: 'm2', step_id: 's1', delta: 'full answer' } });
    expect(text(store)).toEqual(['full answer']);
  });
});
