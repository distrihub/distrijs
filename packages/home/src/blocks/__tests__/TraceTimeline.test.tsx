import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TraceTimeline } from '../TraceTimeline';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

// Mock @distri/react
vi.mock('@distri/react', () => ({
  useDistriClient: () => ({}),
}));

// Mock @distri/components
vi.mock('@distri/components', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock the DistriHomeProvider's useDistriHomeClient to return null (no real client)
vi.mock('../../provider/context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../provider/context')>();
  return {
    ...actual,
    useDistriHomeClient: () => null,
  };
});

describe('TraceTimeline', () => {
  it('renders empty state when no homeClient', () => {
    render(
      <DistriHomeProvider config={{}}>
        <TraceTimeline />
      </DistriHomeProvider>,
    );
    // With no client, loading stops quickly and empty state renders
    expect(screen.getByText('No traces found')).toBeInTheDocument();
  });

  it('renders extraFilters slot', () => {
    render(
      <DistriHomeProvider config={{}}>
        <TraceTimeline slots={{ extraFilters: <span>my-filter</span> }} />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('my-filter')).toBeInTheDocument();
  });

  it('renders traceFilters from home provider slots', () => {
    render(
      <DistriHomeProvider config={{ slots: { traceFilters: <span>provider-filter</span> } }}>
        <TraceTimeline />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('provider-filter')).toBeInTheDocument();
  });
});
