import { afterEach, describe, expect, it, vi } from 'vitest';
import { DistriClient, uuidv4 } from '../distri-client';

describe('DistriClient fetch transport', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses an injected fetch implementation for regular API requests', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ name: 'native-agent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    const client = new DistriClient({
      baseUrl: 'http://localhost:1341/v1',
      accessToken: 'test-token',
      fetchImpl,
      retryAttempts: 0,
    });

    await client.getAgent('native-agent');

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0][0]).toBe('http://localhost:1341/v1/agents/native-agent');
    const requestHeaders = (fetchImpl.mock.calls[0][1] as RequestInit).headers as Headers;
    expect(requestHeaders.get('Authorization')).toBe('Bearer test-token');
  });

  it('uses the injected fetch implementation for A2A agent requests', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('.well-known/agent.json')) {
        return new Response(JSON.stringify({ name: 'native-agent', url: 'http://localhost:1341/v1/agents/native-agent' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });
    const client = new DistriClient({
      baseUrl: 'http://localhost:1341/v1',
      accessToken: 'test-token',
      fetchImpl,
      retryAttempts: 0,
    });

    await client.getAgentCard('native-agent');

    expect(fetchImpl).toHaveBeenCalled();
    expect(fetchImpl.mock.calls.some(([input]) => String(input).includes('.well-known/agent.json'))).toBe(true);
  });

  it('forwards an abort signal through the A2A streaming fetch adapter', async () => {
    let transportSignal: AbortSignal | undefined;
    const fetchImpl = vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      if (String(input).includes('.well-known/agent.json')) {
        return Promise.resolve(new Response(JSON.stringify({
          name: 'native-agent',
          url: 'http://localhost:1341/v1/agents/native-agent',
          version: '1.0.0',
          capabilities: { streaming: true },
          defaultInputModes: ['text'],
          defaultOutputModes: ['text'],
          skills: [],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      transportSignal = init?.signal ?? undefined;
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      });
    });
    const client = new DistriClient({
      baseUrl: 'http://localhost:1341/v1',
      accessToken: 'test-token',
      fetchImpl,
      retryAttempts: 0,
    });
    const abortController = new AbortController();
    const stream = client.sendMessageStream('native-agent', {
      message: { role: 'user', parts: [{ text: 'hello' }] },
    } as never, { signal: abortController.signal });

    const firstEvent = stream.next();
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
    abortController.abort();
    await expect(firstEvent).rejects.toThrow();

    expect(transportSignal?.aborted).toBe(true);
  });
});

describe('uuidv4 in runtimes without Web Crypto', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('still creates an RFC 4122 v4 identifier when crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined);

    expect(uuidv4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
