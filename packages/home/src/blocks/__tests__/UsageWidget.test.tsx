import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UsageWidget } from '../UsageWidget';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

// Mock @distri/react
vi.mock('@distri/react', () => ({
  useDistriClient: () => ({}),
}));

// Mock @distri/components
vi.mock('@distri/components', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock useDistriHomeClient to return null (no real client)
vi.mock('../../DistriHomeProvider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../DistriHomeProvider')>();
  return {
    ...actual,
    useDistriHomeClient: () => null,
  };
});

describe('UsageWidget', () => {
  it('renders Usage heading', () => {
    render(
      <DistriHomeProvider config={{}}>
        <UsageWidget />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('Usage')).toBeInTheDocument();
  });

  it('renders no usage data when client is null', () => {
    render(
      <DistriHomeProvider config={{}}>
        <UsageWidget />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('No usage data')).toBeInTheDocument();
  });

  it('does NOT render usageCta slot when plansCta feature is disabled', () => {
    render(
      <DistriHomeProvider config={{ features: { usage: { plansCta: false } } }}>
        <UsageWidget slots={{ usageCta: <span>Upgrade Now</span> }} />
      </DistriHomeProvider>,
    );
    expect(screen.queryByText('Upgrade Now')).not.toBeInTheDocument();
  });

  it('renders usageCta slot when plansCta feature is enabled', () => {
    render(
      <DistriHomeProvider config={{ features: { usage: { plansCta: true } } }}>
        <UsageWidget slots={{ usageCta: <span>Upgrade Now</span> }} />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
  });

  it('renders onNavigateToUsage button when provided', () => {
    const navigate = vi.fn();
    render(
      <DistriHomeProvider config={{}}>
        <UsageWidget onNavigateToUsage={navigate} />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('View details')).toBeInTheDocument();
  });
});
