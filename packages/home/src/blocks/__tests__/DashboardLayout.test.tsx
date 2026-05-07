import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardLayout } from '../DashboardLayout';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

describe('DashboardLayout', () => {
  it('renders children in main', () => {
    render(
      <MemoryRouter>
        <DistriHomeProvider config={{}}>
          <DashboardLayout>HELLO</DashboardLayout>
        </DistriHomeProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText('HELLO')).toBeInTheDocument();
  });

  it('renders sidebarPrepend slot from context', () => {
    render(
      <MemoryRouter>
        <DistriHomeProvider config={{ slots: { sidebarPrepend: <div>WS-SWITCHER</div> } }}>
          <DashboardLayout>x</DashboardLayout>
        </DistriHomeProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText('WS-SWITCHER')).toBeInTheDocument();
  });

  it('renders header slot from context', () => {
    render(
      <MemoryRouter>
        <DistriHomeProvider config={{ slots: { header: <div>HEAD-FILL</div> } }}>
          <DashboardLayout>x</DashboardLayout>
        </DistriHomeProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText('HEAD-FILL')).toBeInTheDocument();
  });

  it('uses custom sidebar prop over default', () => {
    render(
      <MemoryRouter>
        <DistriHomeProvider config={{}}>
          <DashboardLayout sidebar={<div>CUSTOM-SIDEBAR</div>}>x</DashboardLayout>
        </DistriHomeProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText('CUSTOM-SIDEBAR')).toBeInTheDocument();
    // Default DistriSidebar should NOT render
    expect(screen.queryByText('Agents')).not.toBeInTheDocument();
  });
});
