import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThreadsPage } from '../ThreadsPage';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

const mockListDetailedThreads = vi.fn().mockResolvedValue({
  threads: [{ id: 't1', title: 'Alpha Thread', agent_id: 'a1', agent_name: 'MyAgent', updated_at: new Date().toISOString(), message_count: 2, tags: [] }],
  total: 1,
  page: 1,
  page_size: 30,
});

const mockHomeClient = { listDetailedThreads: mockListDetailedThreads } as any;

vi.mock('../../provider/context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../provider/context')>();
  return {
    ...actual,
    useDistriHomeClient: () => mockHomeClient,
    useDistriHomeNavigate: () => vi.fn(),
  };
});

vi.mock('@distri/react', () => ({
  useDistriClient: () => ({}),
  useAgentsByUsage: () => ({ agents: [], loading: false, error: null, refetch: vi.fn(), search: '', setSearch: vi.fn() }),
}));

vi.mock('@distri/components', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Input: ({ value, onChange, placeholder }: any) => <input value={value} onChange={onChange} placeholder={placeholder} />,
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  Badge: ({ children }: any) => <span>{children}</span>,
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => asChild ? children : <div>{children}</div>,
}));

function wrap(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <DistriHomeProvider config={{}}>
        {ui}
      </DistriHomeProvider>
    </MemoryRouter>,
  );
}

describe('ThreadsPage', () => {
  it('renders Threads heading', () => {
    wrap(<ThreadsPage />);
    const headings = screen.getAllByRole('heading', { name: /threads/i });
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders thread from homeClient', async () => {
    wrap(<ThreadsPage />);
    expect(await screen.findByText('Alpha Thread')).toBeInTheDocument();
  });
});
