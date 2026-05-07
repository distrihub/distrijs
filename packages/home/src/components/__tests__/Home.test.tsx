import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Home } from '../Home';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

const LONG_TITLE =
  'Create a site "Nordic North Winter Sale 2026" — a promotional landing page with hero section';

const mockGetHomeStats = vi.fn().mockResolvedValue({
  latest_threads: [
    {
      id: 'thread-1',
      title: LONG_TITLE,
      agent_id: 'agent-1',
      agent_name: 'tamy',
      updated_at: new Date().toISOString(),
    },
    {
      id: 'thread-2',
      title: LONG_TITLE,
      agent_id: 'agent-1',
      agent_name: 'tamy',
      updated_at: new Date().toISOString(),
    },
  ],
  recently_used_agents: [
    {
      id: 'agent-1',
      name: 'tamy',
      last_used_at: new Date().toISOString(),
      thread_count: 10,
    },
  ],
  most_active_agent: null,
  total_threads: 5,
  total_messages: 42,
  total_agents: 2,
  avg_run_time_ms: 3000,
  custom_metrics: {},
});

const mockHomeClient = { getHomeStats: mockGetHomeStats };

vi.mock('@distri/react', () => ({
  useAgentDefinitions: () => ({ agents: [], loading: false, error: null }),
}));

vi.mock('../../provider/context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../provider/context')>();
  return {
    ...actual,
    useDistriHomeNavigate: () => vi.fn(),
    useDistriHome: () => ({
      homeClient: mockHomeClient,
      navigationPaths: undefined,
      homeWidgets: [],
    }),
  };
});

describe('Home', () => {
  it('renders thread titles with truncation ancestor', async () => {
    render(
      <DistriHomeProvider config={{ homeClient: mockHomeClient }}>
        <Home />
      </DistriHomeProvider>,
    );

    // Wait for the long title to appear
    const titleEls = await screen.findAllByText(LONG_TITLE);
    expect(titleEls.length).toBeGreaterThan(0);

    // Every title should have the truncate class (overflow-hidden text-ellipsis)
    for (const el of titleEls) {
      expect(el.classList.contains('truncate')).toBe(true);
    }
  });

  it('title parents have min-w-0 so truncate can work inside grid tracks', async () => {
    render(
      <DistriHomeProvider config={{ homeClient: mockHomeClient }}>
        <Home />
      </DistriHomeProvider>,
    );

    const titleEls = await screen.findAllByText(LONG_TITLE);
    for (const el of titleEls) {
      // Walk up to find a parent with min-w-0
      let found = false;
      let cur = el.parentElement;
      let depth = 0;
      while (cur && depth < 10) {
        if (cur.classList.contains('min-w-0')) {
          found = true;
          break;
        }
        cur = cur.parentElement;
        depth++;
      }
      expect(found).toBe(true);
    }
  });
});
