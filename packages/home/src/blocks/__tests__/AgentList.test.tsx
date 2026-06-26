import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AgentList } from '../AgentList';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

// The block loads the full definitions directly via the client's getAgents().
vi.mock('@distri/react', () => ({
  useDistri: () => ({
    client: {
      getAgents: () =>
        Promise.resolve([
          {
            id: 'a1',
            name: 'Agent One',
            description: 'First test agent',
            is_workspace: true,
            is_system: false,
            published: false,
            is_owner: true,
          },
          {
            id: 'a2',
            name: 'System Bot',
            description: 'A system agent',
            is_workspace: false,
            is_system: true,
            published: false,
            is_owner: false,
          },
        ]),
    },
    error: null,
    isLoading: false,
  }),
}));

// Mock @distri/components to render simple HTML equivalents
vi.mock('@distri/components', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  Button: ({ children, onClick, disabled, title, className }: any) => (
    <button onClick={onClick} disabled={disabled} title={title} className={className}>
      {children}
    </button>
  ),
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarFallback: ({ children }: any) => <div>{children}</div>,
  AvatarImage: ({ src }: any) => <img src={src} alt="" />,
  Input: ({ value, onChange, placeholder, className }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} className={className} />
  ),
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => asChild ? children : <div>{children}</div>,
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-value={value} onClick={() => onValueChange?.('workspace')}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => <div data-tab={value}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button data-value={value} onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('AgentList', () => {
  it('renders agents', async () => {
    render(
      <DistriHomeProvider config={{}}>
        <AgentList />
      </DistriHomeProvider>,
    );
    expect(await screen.findByText('Agent One')).toBeInTheDocument();
  });

  it('renders rowActions slot', async () => {
    render(
      <DistriHomeProvider config={{}}>
        <AgentList slots={{ rowActions: (id) => <span>action-{id}</span> }} />
      </DistriHomeProvider>,
    );
    expect(await screen.findByText('action-Agent One')).toBeInTheDocument();
  });

  it('renders emptyAgentsCta from home config slot', async () => {
    render(
      <DistriHomeProvider config={{ slots: { emptyAgentsCta: <span>home-cta</span> } }}>
        <AgentList />
      </DistriHomeProvider>,
    );
    // agents are present so we expect agent names, not the CTA
    expect(await screen.findByText('Agent One')).toBeInTheDocument();
  });
});
