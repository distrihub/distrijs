import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThreadList } from '../ThreadList';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

// Stable mock response — defined once so homeClient identity stays constant
// across renders and the useEffect dependency doesn't fire in a loop.
const mockListDetailedThreads = vi.fn().mockResolvedValue({
  threads: [
    {
      id: 'thread-1',
      title: 'Test Thread Alpha',
      agent_id: 'agent-1',
      agent_name: 'TestAgent',
      updated_at: new Date().toISOString(),
      message_count: 3,
      total_tokens: 1200,
      tags: [],
    },
  ],
  total: 1,
  page: 1,
  page_size: 30,
});

const mockHomeClient = { listDetailedThreads: mockListDetailedThreads };

// Mock the legacy infra provider hooks used by ThreadList
vi.mock('../../DistriHomeProvider', () => ({
  useDistriHomeClient: () => mockHomeClient,
  useDistriHomeNavigate: () => vi.fn(),
}));

vi.mock('@distri/react', () => ({
  useAgentsByUsage: () => ({
    agents: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
    search: '',
    setSearch: vi.fn(),
  }),
}));

describe('ThreadList', () => {
  it('renders threads', async () => {
    render(
      <DistriHomeProvider config={{}}>
        <ThreadList />
      </DistriHomeProvider>,
    );
    // Threads are loaded async — wait for title to appear
    expect(await screen.findByText('Test Thread Alpha')).toBeInTheDocument();
  });

  it('renders rowActions slot', async () => {
    render(
      <DistriHomeProvider config={{}}>
        <ThreadList slots={{ rowActions: (id) => <span>row-action-{id}</span> }} />
      </DistriHomeProvider>,
    );
    expect(await screen.findByText('row-action-thread-1')).toBeInTheDocument();
  });

  it('reads threadRowActions from home config slot', async () => {
    render(
      <DistriHomeProvider
        config={{ slots: { threadRowActions: (id) => <span>home-action-{id}</span> } }}
      >
        <ThreadList />
      </DistriHomeProvider>,
    );
    expect(await screen.findByText('home-action-thread-1')).toBeInTheDocument();
  });
});
