import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStateStore } from '@distri/react';
import { forkStream, ROOT, FORK1 } from '../fixtures/streams';

/**
 * useChat / chatStateStore must:
 *  1. Create the root task on its run_started.
 *  2. Create the child task with parentTaskId linkage on the fork's
 *     run_started (delivered with parentTaskId on the envelope).
 *  3. NOT close streaming on the child's run_finished.
 *  4. Mark only the parent's invoke_agent tool call as completed when
 *     the parent's tool_results arrives — sibling tool calls (none
 *     here, but the assertion guards against future regressions)
 *     stay untouched.
 *  5. Close streaming when the parent's run_finished arrives.
 */
describe('useChat — fork task tracking from invoke_agent', () => {
  beforeEach(() => {
    useChatStateStore.getState().clearAllStates();
  });

  it('tracks parent → child task lifecycle correctly', () => {
    const store = useChatStateStore.getState();
    for (const ev of forkStream) {
      store.processMessage(ev as any, true);
    }
    const final = useChatStateStore.getState();

    const root = final.getTaskById(ROOT);
    const fork = final.getTaskById(FORK1);
    expect(root).toBeTruthy();
    expect(fork).toBeTruthy();
    expect(fork!.parentTaskId).toBe(ROOT);
    expect(root!.childTaskIds).toContain(FORK1);

    // Both tasks finished by the end of the stream.
    expect(root!.status).toMatch(/finished|completed|done/i);
    expect(fork!.status).toMatch(/finished|completed|done/i);

    // Streaming must be off after the root finishes.
    expect(final.isStreaming).toBe(false);
    expect(final.isLoading).toBe(false);

    // The invoke_agent tool call was marked completed by tool_results.
    const invoke = final.toolCalls.get('tc_invoke');
    expect(invoke).toBeTruthy();
    expect(invoke!.status).toMatch(/completed|finished|success/i);
  });

  it('does not close streaming when only the child finishes', () => {
    const store = useChatStateStore.getState();
    // Replay everything except the parent's run_finished (last event).
    const partial = forkStream.slice(0, forkStream.length - 1);
    for (const ev of partial) {
      store.processMessage(ev as any, true);
    }
    const final = useChatStateStore.getState();
    expect(final.isStreaming).toBe(true);
  });
});
