import { describe, it, expect, vi } from 'vitest';
import type { Agent, DistriChatMessage } from '@distri/core';
import { createChatService } from '../chat';
import { createAgentService, resolveAgentOnce } from '../agent';
import { AGENT_EXTENSION_URI, DistriClient } from '@distri/core';

function fakeAgent(events: DistriChatMessage[]): Agent {
  async function* stream(): AsyncGenerator<DistriChatMessage> {
    for (const e of events) yield e;
  }
  return {
    name: 'test-agent',
    client: { ensureAccessToken: vi.fn().mockResolvedValue(undefined) },
    invokeStream: vi.fn().mockImplementation(async () => stream()),
  } as unknown as Agent;
}

describe('createChatService', () => {
  it('exposes reactive signals that update as the store changes', async () => {
    const events: DistriChatMessage[] = [
      { type: 'run_started', data: { runId: 'r1', taskId: 't1' }, taskId: 't1' } as unknown as DistriChatMessage,
      {
        type: 'text_message_start',
        data: { message_id: 'm1', role: 'assistant', is_final: false },
        taskId: 't1',
      } as unknown as DistriChatMessage,
      {
        type: 'text_message_content',
        data: { message_id: 'm1', delta: 'Hello from Angular' },
        taskId: 't1',
      } as unknown as DistriChatMessage,
      { type: 'text_message_end', data: { message_id: 'm1' }, taskId: 't1' } as unknown as DistriChatMessage,
      { type: 'run_finished', data: { runId: 'r1', taskId: 't1' }, taskId: 't1' } as unknown as DistriChatMessage,
    ];
    const agent = fakeAgent(events);

    const chat = createChatService({ agent, threadId: 'thread-1' });

    expect(chat.isStreaming()).toBe(false);
    expect(chat.messages()).toEqual([]);

    await chat.sendMessage('hi there');

    // Stream ran to completion synchronously (no real network), so by the
    // time sendMessage resolves the store has processed every event.
    expect(chat.isStreaming()).toBe(false);
    expect(chat.error()).toBeNull();

    const texts = chat.messages()
      .filter((m): m is Extract<DistriChatMessage, { role: string }> => 'role' in m)
      .map((m) => JSON.stringify(m));
    expect(texts.some((t) => t.includes('Hello from Angular'))).toBe(true);
    expect(texts.some((t) => t.includes('hi there'))).toBe(true);

    chat.dispose();
  });

  it('stopStreaming aborts and clears the streaming flag', () => {
    const agent = fakeAgent([]);
    const chat = createChatService({ agent, threadId: 'thread-2' });
    chat.stopStreaming();
    expect(chat.isStreaming()).toBe(false);
  });
});

describe('createAgentService', () => {
  it('resolves an agent from an AgentDefinition and exposes it as a signal', async () => {
    const client = {} as never;
    const definition = { name: 'my-agent' } as never;
    const service = createAgentService({ client, agentIdOrDef: definition });

    // Resolution kicks off synchronously in the constructor; wait a tick.
    await new Promise((r) => setTimeout(r, 0));

    expect(service.agent()?.name).toBe('my-agent');
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });
});

describe('agent versions (spec 2026-11-20-agent-versions V4)', () => {
  function versionedClient() {
    const urls: string[] = [];
    const client = new DistriClient({
      baseUrl: 'http://localhost:1341/v1',
      accessToken: 't',
      retryAttempts: 0,
      fetchImpl: async (input: RequestInfo | URL) => {
        const url = String(input);
        urls.push(url);
        const sel = decodeURIComponent(url.match(/\/agents\/([^/]+)\/\.well-known/)![1]).split('@')[1];
        return new Response(JSON.stringify({
          name: 'helper',
          capabilities: {
            streaming: true,
            extensions: [{ uri: AGENT_EXTENSION_URI, params: { agent_type: 'standard_agent', external_tools: [], any_tool: false, browser_streaming: false, version_no: sel ? Number(sel) : 9 } }],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      },
    });
    return { client, urls };
  }

  it('resolveAgentOnce loads the pinned card', async () => {
    const { client, urls } = versionedClient();
    const agent = await resolveAgentOnce(client, 'helper', 3);
    expect(agent.version).toBe(3);
    expect(agent.name).toBe('helper');
    expect(urls).toEqual(['http://localhost:1341/v1/agents/helper@3/.well-known/agent-card.json']);
  });

  it('createAgentService takes a version and refresh({ version }) reloads', async () => {
    const { client, urls } = versionedClient();
    const service = createAgentService({ client, agentIdOrDef: 'helper', version: 3 });
    await vi.waitFor(() => expect(service.agent()?.version).toBe(3));
    await service.refresh({ version: 4 });
    expect(service.agent()?.version).toBe(4);
    expect(urls).toEqual([
      'http://localhost:1341/v1/agents/helper@3/.well-known/agent-card.json',
      'http://localhost:1341/v1/agents/helper@4/.well-known/agent-card.json',
    ]);
  });
});
