import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DistriNativeProvider } from '../DistriNativeProvider';
import { useAgent } from '../useAgent';

vi.mock('react-native', async () => import('./react-native.mock'));

const agentResponse = (name: string) => new Response(JSON.stringify({ name }), {
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
        if (String(input).endsWith('/agents/old-agent')) {
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
});
