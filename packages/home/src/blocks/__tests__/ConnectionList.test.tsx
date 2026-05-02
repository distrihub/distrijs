import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConnectionList } from '../ConnectionList';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

// Mock @distri/react
vi.mock('@distri/react', () => ({
  useDistriClient: () => ({}),
}));

// Mock @distri/components
vi.mock('@distri/components', () => ({
  Button: ({ children, onClick, disabled, className, size, variant }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>{children}</button>
  ),
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
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

describe('ConnectionList', () => {
  it('renders empty state when no client', () => {
    render(
      <DistriHomeProvider config={{}}>
        <ConnectionList />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('No connections yet')).toBeInTheDocument();
  });

  it('renders Connections heading', () => {
    render(
      <DistriHomeProvider config={{}}>
        <ConnectionList />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('Connections')).toBeInTheDocument();
  });

  it('renders New button when onAdd provided', () => {
    const onAdd = vi.fn();
    render(
      <DistriHomeProvider config={{}}>
        <ConnectionList onAdd={onAdd} />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders Add connection button in empty state when onAdd provided', () => {
    const onAdd = vi.fn();
    render(
      <DistriHomeProvider config={{}}>
        <ConnectionList onAdd={onAdd} />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('Add connection')).toBeInTheDocument();
  });
});
