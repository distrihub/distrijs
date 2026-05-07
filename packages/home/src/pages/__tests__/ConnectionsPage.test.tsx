import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ConnectionsPage } from '../ConnectionsPage';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

const mockListConnections = vi.fn().mockResolvedValue([]);
const mockHomeClient = { listConnections: mockListConnections } as any;

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
  Button: ({ children, onClick, disabled, size, variant }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
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

describe('ConnectionsPage', () => {
  it('renders Connections heading', async () => {
    wrap(<ConnectionsPage />);
    expect(await screen.findByText('Connections')).toBeInTheDocument();
  });

  it('renders New button', async () => {
    wrap(<ConnectionsPage />);
    expect(await screen.findByText('New')).toBeInTheDocument();
  });

  it('renders empty state when no connections', async () => {
    wrap(<ConnectionsPage />);
    expect(await screen.findByText('No connections yet')).toBeInTheDocument();
  });
});
