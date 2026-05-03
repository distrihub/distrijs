import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TracesPage } from '../TracesPage';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

const mockGetTraces = vi.fn().mockResolvedValue({ traces: [] });
const mockHomeClient = { getTraces: mockGetTraces } as any;

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
  Button: ({ children, onClick, disabled }: any) => <button onClick={onClick} disabled={disabled}>{children}</button>,
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

describe('TracesPage', () => {
  it('renders Traces heading', () => {
    wrap(<TracesPage />);
    expect(screen.getByRole('heading', { name: /traces/i })).toBeInTheDocument();
  });

  it('renders empty state when no traces', async () => {
    wrap(<TracesPage />);
    expect(await screen.findByText('No traces found')).toBeInTheDocument();
  });
});
