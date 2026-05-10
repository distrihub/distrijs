import { describe, it, expect, beforeAll } from 'vitest';
import { Agent, DistriClient } from '@distri/core';
import {
  isServerUp,
  hasRealLLMKey,
  DISTRI_BASE_URL,
  DISTRI_API_KEY,
  DISTRI_WORKSPACE_ID,
} from '../scripts/lib';

/**
 * Real-server e2e: send a message via @distri/core, collect the full
 * event stream, assert the assistant produced a final text and the run
 * cleanly closed. Skipped silently when the server is down or no LLM
 * key is configured.
 *
 * The agent under test is `mock_smoke_agent` (pushed from
 * distri/integration/agents/) — pick anything cheap. With the
 * mock-llm server feature it costs $0; without it, this run is real.
 */
describe('e2e — agent run end-to-end', () => {
  let serverUp = false;
  beforeAll(async () => {
    serverUp = await isServerUp();
  });

  it('streams text and finishes', async () => {
    if (!serverUp) return;
    if (!hasRealLLMKey() && !process.env.DISTRI_MOCK_LLM) {
      console.warn('[skip] no LLM key and server is not in mock mode');
      return;
    }

    const client = new DistriClient({
      baseUrl: DISTRI_BASE_URL,
      apiKey: DISTRI_API_KEY || undefined,
      workspaceId: DISTRI_WORKSPACE_ID || undefined,
    } as any);

    const agent = await Agent.create('mock_smoke_agent', client);

    const events: any[] = [];
    let textOut = '';
    let runFinished = false;

    for await (const ev of agent.streamMessage('say hello in three words') as any) {
      events.push(ev);
      if (ev?.type === 'text_message_content') {
        textOut += ev?.data?.content ?? '';
      } else if (ev?.type === 'run_finished') {
        runFinished = true;
      }
    }

    expect(runFinished).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    // Don't pin exact text — different LLMs phrase differently — just
    // that *something* was produced.
    expect(textOut.length).toBeGreaterThan(0);
  }, 60_000);
});
