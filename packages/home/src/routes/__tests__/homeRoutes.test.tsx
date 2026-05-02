import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes } from 'react-router-dom';
import { homeRoutes } from '../homeRoutes';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

// ---------------------------------------------------------------------------
// Mock @distri/react — consumed by AgentList and other blocks
// ---------------------------------------------------------------------------
vi.mock('@distri/react', () => ({
  useDistriClient: () => ({}),
  useAgentDefinitions: () => ({ agents: [], isLoading: false, loading: false, error: null, refetch: vi.fn(), getAgent: vi.fn() }),
  useAgent: () => ({ data: null, isLoading: false }),
  useAgentsByUsage: () => ({ agents: [], isLoading: false, loading: false, error: null, refetch: vi.fn(), search: '', setSearch: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Mock @distri/components — avoids pulling in full shadcn bundle in tests
// ---------------------------------------------------------------------------
vi.mock('@distri/components', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>{children}</button>
  ),
  Input: ({ value, onChange, placeholder, className }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} className={className} />
  ),
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarFallback: ({ children }: any) => <div>{children}</div>,
  AvatarImage: ({ src }: any) => <img src={src} alt="" />,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => (asChild ? children : <div>{children}</div>),
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ children }: any) => <div>{children}</div>,
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
  Label: ({ children, className }: any) => <label className={className}>{children}</label>,
  Separator: () => <hr />,
}));

// ---------------------------------------------------------------------------
// Mock legacy infra provider (DistriHomeProvider.tsx — the HOC one)
// ---------------------------------------------------------------------------
vi.mock('../../DistriHomeProvider', () => ({
  useDistriHomeClient: () => ({
    listDetailedThreads: vi.fn().mockResolvedValue({ threads: [], total: 0, page: 1, page_size: 30 }),
    listConnections: vi.fn().mockResolvedValue([]),
    listSkills: vi.fn().mockResolvedValue([]),
    listTemplates: vi.fn().mockResolvedValue([]),
    getUsage: vi.fn().mockResolvedValue({ total_tokens: 0, total_cost: 0, by_agent: [] }),
    client: { fetch: vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) },
    distriClient: { workspaceId: 'test', fetch: vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) },
  }),
  useDistriHomeNavigate: () => vi.fn(),
  DistriHomeProvider: ({ children }: any) => <>{children}</>,
  useDistriHome: () => ({ routes: { prefix: '' } }),
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function renderAt(path: string, opts?: Parameters<typeof homeRoutes>[0]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DistriHomeProvider config={{}}>
        <Routes>{homeRoutes(opts)}</Routes>
      </DistriHomeProvider>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('homeRoutes', () => {
  it('mounts AgentsPage at /agents', () => {
    renderAt('/agents');
    expect(screen.getByRole('heading', { name: /agents/i })).toBeInTheDocument();
  });

  it('mounts SettingsPage at /settings', () => {
    renderAt('/settings');
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
  });

  it('renders override at /traces', () => {
    renderAt('/traces', { override: { '/traces': <div>CLOUD-TRACES</div> } });
    expect(screen.getByText('CLOUD-TRACES')).toBeInTheDocument();
  });

  it('hides paths via hide prop', () => {
    const { container } = renderAt('/usage', { hide: ['/usage'] });
    // No route matches — React Router renders nothing inside Routes
    expect(container.querySelector('h1')).toBeNull();
  });
});
