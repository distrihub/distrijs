import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DistriHomeProvider } from '../DistriHomeProvider';
import { useDistriHome } from '../context';

function Reader() {
  const { features } = useDistriHome();
  return <div>{features?.traces?.exportCsv ? 'csv-on' : 'csv-off'}</div>;
}

function SlotReader() {
  const { slots } = useDistriHome();
  return <div data-testid="slot">{slots?.header}</div>;
}

describe('DistriHomeProvider', () => {
  it('exposes features via context', () => {
    render(
      <DistriHomeProvider config={{ features: { traces: { exportCsv: true } } }}>
        <Reader />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('csv-on')).toBeInTheDocument();
  });

  it('defaults features to undefined when not provided', () => {
    render(
      <DistriHomeProvider config={{}}>
        <Reader />
      </DistriHomeProvider>,
    );
    expect(screen.getByText('csv-off')).toBeInTheDocument();
  });

  it('exposes slots via context', () => {
    render(
      <DistriHomeProvider config={{ slots: { header: <span>HEADER-FILL</span> } }}>
        <SlotReader />
      </DistriHomeProvider>,
    );
    expect(screen.getByTestId('slot')).toHaveTextContent('HEADER-FILL');
  });

  it('throws when useDistriHome called outside provider', () => {
    // Suppress React's error log noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Reader />)).toThrow(
      /useDistriHome must be used within/,
    );
    spy.mockRestore();
  });
});
