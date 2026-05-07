import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ChatPage } from '../ChatPage';
import { DistriHomeProvider } from '../../provider/DistriHomeProvider';

vi.mock('@distri/react', () => ({
  useDistriClient: () => ({}),
  useAgentsByUsage: () => ({ agents: [{ agent_name: 'TestBot' }], loading: false, error: null, refetch: vi.fn() }),
  useAgentDefinitions: () => ({ agents: [{ id: 'a1', name: 'TestBot' }], loading: false, error: null }),
  useModels: () => ({ providers: [], loading: false }),
  useAgent: () => ({ agent: { id: 'a1', name: 'TestBot' }, loading: false, error: null }),
  useChatMessages: () => ({ messages: [], isLoading: false }),
  Chat: ({ agent }: any) => <div data-testid="chat">chat:{agent?.name}</div>,
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectGroup: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectLabel: ({ children }: any) => <div>{children}</div>,
  SelectSeparator: () => <hr />,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@distri/components', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectGroup: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectLabel: ({ children }: any) => <div>{children}</div>,
  SelectSeparator: () => <hr />,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ children }: any) => <span>{children}</span>,
}));

function wrap(ui: React.ReactNode, search = '') {
  return render(
    <MemoryRouter initialEntries={[`/chat${search}`]}>
      <DistriHomeProvider config={{}}>
        {ui}
      </DistriHomeProvider>
    </MemoryRouter>,
  );
}

describe('ChatPage', () => {
  it('renders agent selector', () => {
    wrap(<ChatPage />);
    // Agent label or select should be present
    expect(screen.getByText('Agent')).toBeInTheDocument();
  });

  it('renders model selector label', () => {
    wrap(<ChatPage />);
    expect(screen.getByText('Model')).toBeInTheDocument();
  });

  it('renders the Chat component when agent is loaded', () => {
    wrap(<ChatPage />, '?id=TestBot');
    expect(screen.getByTestId('chat')).toBeInTheDocument();
  });
});
