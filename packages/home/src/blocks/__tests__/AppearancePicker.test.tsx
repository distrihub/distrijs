import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppearancePicker } from '../AppearancePicker';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

// Mock @distri/react
vi.mock('@distri/react', () => ({
  useDistriClient: () => ({}),
}));

// Mock @distri/components
vi.mock('@distri/components', () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
  ),
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('AppearancePicker', () => {
  it('renders three theme buttons', () => {
    render(
      <DistriHomeProvider config={{}}>
        <AppearancePicker />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(
      <DistriHomeProvider config={{}}>
        <AppearancePicker />
      </DistriHomeProvider>,
    );
    expect(screen.getByText(/Choose how Distri looks/i)).toBeInTheDocument();
  });

  it('clicking a theme button updates state without throwing', () => {
    render(
      <DistriHomeProvider config={{}}>
        <AppearancePicker storageKey="test-theme" />
      </DistriHomeProvider>,
    );
    // Click Dark — should not throw; button stays in DOM
    fireEvent.click(screen.getByText('Dark'));
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });
});
