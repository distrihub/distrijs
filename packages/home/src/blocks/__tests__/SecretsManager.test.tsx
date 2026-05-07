import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SecretsManager } from '../SecretsManager';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

// Mock @distri/react
vi.mock('@distri/react', () => ({
  useDistriClient: () => ({}),
}));

// Mock @distri/components
vi.mock('@distri/components', () => ({
  Button: ({ children, onClick, disabled, className, size, variant, type }: any) => (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
  Input: ({ value, onChange, placeholder, type, className }: any) => (
    <input
      type={type ?? 'text'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ),
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock useDistriHomeClient to return null (no real client)
vi.mock('../../provider/context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../provider/context')>();
  return {
    ...actual,
    useDistriHomeClient: () => null,
  };
});

describe('SecretsManager', () => {
  it('renders no-client state gracefully', () => {
    render(
      <DistriHomeProvider config={{}}>
        <SecretsManager />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('No secrets yet.')).toBeInTheDocument();
  });

  it('renders New secret button', () => {
    render(
      <DistriHomeProvider config={{}}>
        <SecretsManager />
      </DistriHomeProvider>,
    );
    expect(screen.getByText(/New secret/i)).toBeInTheDocument();
  });

  it('shows create form when New secret is clicked', () => {
    render(
      <DistriHomeProvider config={{}}>
        <SecretsManager />
      </DistriHomeProvider>,
    );
    fireEvent.click(screen.getByText(/New secret/i));
    expect(screen.getByPlaceholderText('MY_API_KEY')).toBeInTheDocument();
  });

  it('cancels create form', () => {
    render(
      <DistriHomeProvider config={{}}>
        <SecretsManager />
      </DistriHomeProvider>,
    );
    fireEvent.click(screen.getByText(/New secret/i));
    expect(screen.getByPlaceholderText('MY_API_KEY')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('MY_API_KEY')).not.toBeInTheDocument();
  });
});
