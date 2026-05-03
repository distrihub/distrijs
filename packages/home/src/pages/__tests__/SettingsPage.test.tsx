import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from '../SettingsPage';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

const mockHomeClient = {
  listSkills: vi.fn().mockResolvedValue([]),
  listPromptTemplates: vi.fn().mockResolvedValue([]),
  listConnections: vi.fn().mockResolvedValue([]),
  listSecrets: vi.fn().mockResolvedValue([]),
  listProviders: vi.fn().mockResolvedValue([]),
  listProviderTypes: vi.fn().mockResolvedValue([]),
  getProfile: vi.fn().mockResolvedValue(null),
} as any;

vi.mock('../../provider/context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../provider/context')>();
  return {
    ...actual,
    useDistriHomeClient: () => mockHomeClient,
  };
});

vi.mock('@distri/react', () => ({
  useDistriClient: () => ({}),
}));

vi.mock('@distri/components', () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled}>{children}</button>
  ),
  Input: ({ value, onChange, placeholder, type }: any) => (
    <input type={type ?? 'text'} value={value ?? ''} onChange={onChange} placeholder={placeholder} />
  ),
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  Label: ({ children }: any) => <label>{children}</label>,
  Separator: () => <hr />,
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarFallback: ({ children }: any) => <div>{children}</div>,
  AvatarImage: ({ src }: any) => <img src={src} alt="" />,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => asChild ? children : <div>{children}</div>,
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ children }: any) => <span>{children}</span>,
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  Switch: ({ checked, onCheckedChange }: any) => (
    <input type="checkbox" checked={checked ?? false} onChange={(e) => onCheckedChange?.(e.target.checked)} />
  ),
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

describe('SettingsPage', () => {
  it('renders Settings heading', () => {
    wrap(<SettingsPage />);
    expect(screen.getByRole('heading', { name: /^settings$/i })).toBeInTheDocument();
  });

  it('renders Skills section', () => {
    wrap(<SettingsPage />);
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('renders Templates section', () => {
    wrap(<SettingsPage />);
    const matches = screen.getAllByText('Templates');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renders Connections section', () => {
    wrap(<SettingsPage />);
    const matches = screen.getAllByText('Connections');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renders Secrets section', () => {
    wrap(<SettingsPage />);
    expect(screen.getByText('Secrets')).toBeInTheDocument();
  });

  it('renders extra sections when provided', () => {
    render(
      <MemoryRouter>
        <DistriHomeProvider config={{}}>
          <SettingsPage extraSections={<div>Billing Section</div>} />
        </DistriHomeProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Billing Section')).toBeInTheDocument();
  });

  it('hides sections when hide prop used', () => {
    wrap(<SettingsPage hide={{ skills: true, templates: true }} />);
    expect(screen.queryByText('Skills')).not.toBeInTheDocument();
    expect(screen.queryByText('Templates')).not.toBeInTheDocument();
    const connMatches = screen.getAllByText('Connections');
    expect(connMatches.length).toBeGreaterThan(0);
  });
});
