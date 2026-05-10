/**
 * Shared helpers for distrijs integration tests.
 *
 * Server-gated tests should call `requireServer()` (or the LLM variant)
 * inside a `beforeAll` so they skip cleanly without exploding when the
 * test env doesn't have a server / .env.
 */

export function getEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

export const DISTRI_BASE_URL =
  process.env.DISTRI_BASE_URL ?? 'http://localhost:1341/v1';
export const DISTRI_API_KEY = process.env.DISTRI_API_KEY ?? '';
export const DISTRI_WORKSPACE_ID = process.env.DISTRI_WORKSPACE_ID ?? '';

export async function isServerUp(): Promise<boolean> {
  try {
    const url = DISTRI_BASE_URL.replace(/\/v1$/, '');
    const res = await fetch(`${url}/healthz`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export function hasRealLLMKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

/**
 * Build an SSE-style ReadableStream from a list of events. Use this in
 * client/ tests to drive DistriClient without a server.
 */
export function makeSSEStream(events: unknown[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const ev of events) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
      }
      controller.close();
    },
  });
}

/**
 * Stub `globalThis.fetch` to respond to:
 *   - GET .well-known/agent.json   → minimal AgentCard
 *   - POST /messages/stream        → an SSE stream of `events`
 *   - any other GET                → 200 with `{}`
 *
 * Returns a `restore()` to put the original fetch back.
 */
export function stubFetch(events: unknown[]): { restore: () => void; bodies: any[] } {
  const original = globalThis.fetch;
  const bodies: any[] = [];
  globalThis.fetch = (async (url: any, init?: RequestInit) => {
    const u = String(url);
    if (u.includes('.well-known/agent.json')) {
      return new Response(
        JSON.stringify({ name: 'test-agent', url: u.replace('/.well-known/agent.json', ''), version: '1.0', capabilities: { streaming: true } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (init?.body) {
      try { bodies.push(JSON.parse(init.body as string)); } catch { /* ignore */ }
    }
    if (init?.method === 'POST') {
      return new Response(makeSSEStream(events), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    }
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as any;
  return {
    restore: () => { globalThis.fetch = original; },
    bodies,
  };
}
