import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DistriNativeProvider } from '../DistriNativeProvider';
import { useAgent } from '../useAgent';
import { AGENT_EXTENSION_URI } from '@distri/core';

vi.mock('react-native', async () => import('./react-native.mock'));

// useAgent resolves an id from the agent's A2A card, never GET /agents/{id}.
const agentResponse = (name: string) => new Response(JSON.stringify({ name, capabilities: { streaming: true } }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

describe('useAgent', () => {
  afterEach(cleanup);

  it('ignores an older agent response after the requested agent changes', async () => {
    let releaseOldRequest: ((response: Response) => void) | undefined;
    const config = {
      baseUrl: 'http://localhost:1341/v1',
      accessToken: 'test-token',
      retryAttempts: 0,
      fetchImpl: (input: RequestInfo | URL) => {
        expect(String(input)).toMatch(/\/\.well-known\/agent-card\.json$/);
        if (String(input).endsWith('/agents/old-agent/.well-known/agent-card.json')) {
          return new Promise<Response>(resolve => { releaseOldRequest = resolve; });
        }
        return Promise.resolve(agentResponse('new-agent'));
      },
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DistriNativeProvider config={config}>{children}</DistriNativeProvider>
    );
    const { result, rerender } = renderHook(
      ({ agentId }: { agentId: string }) => useAgent({ agentIdOrDef: agentId }),
      { initialProps: { agentId: 'old-agent' }, wrapper },
    );

    await waitFor(() => expect(releaseOldRequest).toBeDefined());
    rerender({ agentId: 'new-agent' });
    await waitFor(() => expect(result.current.agent?.name).toBe('new-agent'));
    await act(async () => releaseOldRequest?.(agentResponse('old-agent')));

    expect(result.current.agent?.name).toBe('new-agent');
  });

  it('loads the pinned card for a version and refetches when it changes', async () => {
    const urls: string[] = [];
    const config = {
      baseUrl: 'http://localhost:1341/v1',
      accessToken: 'test-token',
      retryAttempts: 0,
      fetchImpl: (input: RequestInfo | URL) => {
        const url = String(input);
        urls.push(url);
        const sel = decodeURIComponent(url.match(/\/agents\/([^/]+)\/\.well-known/)![1]).split('@')[1];
        return Promise.resolve(new Response(JSON.stringify({
          name: 'helper',
          capabilities: {
            streaming: true,
            extensions: [{ uri: AGENT_EXTENSION_URI, params: { agent_type: 'standard_agent', external_tools: [], any_tool: false, browser_streaming: false, version_no: Number(sel) } }],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      },
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DistriNativeProvider config={config}>{children}</DistriNativeProvider>
    );
    const { result, rerender } = renderHook(
      ({ version }: { version: number }) => useAgent({ agentIdOrDef: 'helper', version }),
      { initialProps: { version: 3 }, wrapper },
    );
    await waitFor(() => expect(result.current.agent?.version).toBe(3));
    rerender({ version: 4 });
    await waitFor(() => expect(result.current.agent?.version).toBe(4));
    expect(result.current.agent?.name).toBe('helper');
    expect(urls).toEqual([
      'http://localhost:1341/v1/agents/helper@3/.well-known/agent-card.json',
      'http://localhost:1341/v1/agents/helper@4/.well-known/agent-card.json',
    ]);
  });
});
