import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EditConnectionPage } from '../EditConnectionPage';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

const mockConnection = {
  id: 'conn-1',
  name: 'Slack Workspace',
  workspace_id: 'ws-1',
  skill_id: 'slack',
  status: 'active',
  config: {},
  connected_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  auth_scope: 'workspace' as const,
  auth_type: { type: 'oauth' as const, provider: 'slack', scopes: [] },
};

const mockGetConnection = vi.fn().mockResolvedValue(mockConnection);
const mockHomeClient = {
  getConnection: mockGetConnection,
  listProviderTypes: vi.fn().mockResolvedValue([]),
  listProviders: vi.fn().mockResolvedValue([]),
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
  Button: ({ children, onClick, disabled, type, variant, size }: any) => (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled}>{children}</button>
  ),
  Input: ({ value, onChange, placeholder, type }: any) => (
    <input type={type ?? 'text'} value={value ?? ''} onChange={onChange} placeholder={placeholder} />
  ),
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  Label: ({ children }: any) => <label>{children}</label>,
}));

function wrap(connectionId: string) {
  return render(
    <MemoryRouter initialEntries={[`/connections/${connectionId}/edit`]}>
      <DistriHomeProvider config={{}}>
        <Routes>
          <Route path="/connections/:connectionId/edit" element={<EditConnectionPage />} />
        </Routes>
      </DistriHomeProvider>
    </MemoryRouter>,
  );
}

describe('EditConnectionPage', () => {
  it('renders breadcrumb back link', async () => {
    wrap('conn-1');
    // The breadcrumb "← Connections" is rendered immediately
    const el = await screen.findByText('← Connections');
    expect(el).toBeInTheDocument();
  });

  it('calls getConnection with the route param', async () => {
    mockGetConnection.mockClear();
    wrap('conn-1');
    // Wait for async effect to fire
    await vi.waitFor(() => {
      expect(mockGetConnection).toHaveBeenCalledWith('conn-1');
    });
  });

  it('shows loading state initially', () => {
    wrap('conn-1');
    // During loading the content area shows loading text
    expect(screen.getByText('Loading connection…')).toBeInTheDocument();
  });
});
