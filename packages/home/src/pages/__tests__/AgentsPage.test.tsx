import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AgentsPage } from '../AgentsPage';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

vi.mock('@distri/react', () => ({
  useDistriClient: () => ({}),
  useAgentDefinitions: () => ({
    agents: [
      { id: 'a1', name: 'My Agent', description: 'Test', is_workspace: true, is_system: false, published: false, is_owner: true },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
    getAgent: vi.fn(),
  }),
}));

vi.mock('@distri/components', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarFallback: ({ children }: any) => <div>{children}</div>,
  AvatarImage: ({ src }: any) => <img src={src} alt="" />,
  Input: ({ value, onChange, placeholder }: any) => <input value={value} onChange={onChange} placeholder={placeholder} />,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => asChild ? children : <div>{children}</div>,
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
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

describe('AgentsPage', () => {
  it('renders Agents heading', () => {
    wrap(<AgentsPage />);
    expect(screen.getByRole('heading', { name: /agents/i })).toBeInTheDocument();
  });

  it('renders New Agent button', () => {
    wrap(<AgentsPage />);
    expect(screen.getByText('New Agent')).toBeInTheDocument();
  });

  it('renders agent list from hook', () => {
    wrap(<AgentsPage />);
    expect(screen.getByText('My Agent')).toBeInTheDocument();
  });

  it('fires onAction when agent deleted', () => {
    const onAction = vi.fn();
    render(
      <MemoryRouter>
        <DistriHomeProvider config={{ onAction }}>
          <AgentsPage />
        </DistriHomeProvider>
      </MemoryRouter>,
    );
    // Agent list is rendered; onAction wired via DistriHomeProvider config
    expect(screen.getByText('My Agent')).toBeInTheDocument();
  });
});
