import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStateStore } from '@distri/react';
import { todoWriteStream, askFollowUpStream, ROOT } from '../fixtures/streams';

/**
 * Default tools (todo_write, ask_follow_up, confirm, input, notify)
 * must be tracked in chatStateStore with the right semantics:
 *
 *  - todo_write: completes immediately on tool_results — non-blocking.
 *  - ask_follow_up: stays "pending" until user responds (no
 *    tool_results in the stream). Streaming should NOT close on the
 *    absence of run_finished — the run is intentionally open.
 *
 * (Renderer-level visual tests live in samples/full-demo and storybook.)
 */
describe('default tools — store tracking', () => {
  beforeEach(() => {
    useChatStateStore.getState().clearAllStates();
  });

  it('todo_write call completes when tool_results arrives', () => {
    const store = useChatStateStore.getState();
    for (const ev of todoWriteStream) {
      store.processMessage(ev as any, true);
    }
    const final = useChatStateStore.getState();
    const tc = final.toolCalls.get('tc_todo');
    expect(tc).toBeTruthy();
    expect(tc!.status).toMatch(/completed|finished|success/i);
    expect(final.isStreaming).toBe(false);
  });

  it('ask_follow_up call stays pending without a result', () => {
    const store = useChatStateStore.getState();
    for (const ev of askFollowUpStream) {
      store.processMessage(ev as any, true);
    }
    const final = useChatStateStore.getState();
    const tc = final.toolCalls.get('tc_ask');
    expect(tc).toBeTruthy();
    expect(tc!.status).toMatch(/pending|in_progress|awaiting/i);
    // The run did not finish — store should reflect that the chat is
    // still "live" (waiting on user input).
    expect(final.isStreaming).toBe(true);
    expect(final.currentTaskId).toBe(ROOT);
  });
});
