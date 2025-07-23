import { useEffect, useState, useMemo } from 'react';
import { MessageSquare, Settings, Activity, Loader2, Bot, Menu, X, Plus, Code } from 'lucide-react';
import { DistriProvider, useAgents, DistriAgent, useThreads } from '@distri/react';
import ChatWithThreads from './components/ChatWithThreads';
import ChatExamples from './pages/ChatExamples';
import { v4 as uuidv4 } from 'uuid';

// Conversations List Component for Sidebar
const ConversationsList = ({
  selectedThreadId,
  setSelectedThreadId,
  refreshCount
}: {
  selectedThreadId: string,
  setSelectedThreadId: (threadId: string) => void,
  refreshCount: number
}) => {
  const { threads, loading: threadsLoading, refetch: refetchThreads } = useThreads();

  const initNewThread = () => {
    setSelectedThreadId(uuidv4());
  }

  useEffect(() => {
    refetchThreads();
  }, [refreshCount, refetchThreads]);

  if (threadsLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-blue-400 mr-2" />
        <span className="text-gray-400 text-sm">Loading conversations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {threads.length === 0 ? (
        <div className="text-xs text-gray-500 text-center py-4">
          No conversations yet
        </div>
      ) : (
        threads.map((thread: any) => (
          <div
            key={thread.id}
            onClick={() => setSelectedThreadId(thread.id)}
            className={`p-2 rounded cursor-pointer transition-colors text-sm ${selectedThreadId === thread.id
              ? 'bg-blue-900 text-white'
              : 'text-gray-300 hover:bg-gray-800'
              }`}
          >
            <div className="truncate">{thread.title || 'Untitled'}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(thread.updated_at).toLocaleDateString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: 'chat' | 'agents' | 'tasks' | 'examples') => void;
  selectedAgent: DistriAgent | null;
  agents: DistriAgent[];
  setSelectedAgent: (agent: DistriAgent | null) => void;
  selectedThreadId: string;
  setSelectedThreadId: (threadId: string) => void;
  refreshCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  selectedAgent,
  agents,
  setSelectedAgent,
  selectedThreadId,
  setSelectedThreadId,
  refreshCount
}) => {
  const menuItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'agents', label: 'Agents', icon: Settings },
    { id: 'tasks', label: 'Tasks', icon: Activity },
    { id: 'examples', label: 'Examples', icon: Code },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-semibold">Distri</h1>
                <p className="text-xs text-gray-400">AI Agent Platform</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Agent Selector - only show on chat tab */}
          {activeTab === 'chat' && (
            <div className="p-4 border-b border-gray-700">
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Select Agent
              </label>
              <select
                value={selectedAgent?.id || ''}
                onChange={(e) => {
                  const agent = agents.find(a => a.id === e.target.value);
                  setSelectedAgent(agent || null);
                }}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an agent...</option>
                {agents.map((agent: DistriAgent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conversations - moved to top */}
          {activeTab === 'chat' && (
            <div className="flex-1 p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">Conversations</h3>
                <button
                  onClick={() => {
                    const newThreadId = uuidv4();
                    setSelectedThreadId(newThreadId);
                  }}
                  className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <ConversationsList
                selectedThreadId={selectedThreadId}
                setSelectedThreadId={setSelectedThreadId}
                refreshCount={refreshCount}
              />
            </div>
          )}

          {/* Navigation */}
          <nav className="p-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as 'chat' | 'agents' | 'tasks' | 'examples');
                      // Close sidebar on mobile after selection
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-400">
              <p>DistriJS Framework</p>
              <p>Version 0.1.7</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

function AppContent() {
  const { agents, loading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<DistriAgent | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'agents' | 'tasks' | 'examples'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string>(() => {
    const saved = localStorage.getItem('distri-selected-thread-id');
    return saved || Math.random().toString(36).substr(2, 9);
  });
  const [refreshCount, setRefreshCount] = useState<number>(0);

  useEffect(() => {
    if (!loading && agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, loading, selectedAgent]);

  // Save selectedThreadId to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('distri-selected-thread-id', selectedThreadId);
  }, [selectedThreadId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          <span className="text-gray-300">Loading...</span>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    switch (activeTab) {
      case 'chat':
        return selectedAgent ? (
          <ChatWithThreads
            selectedThreadId={selectedThreadId}
            setSelectedThreadId={setSelectedThreadId}
            agent={selectedAgent}
            onThreadUpdate={() => {
              setRefreshCount(refreshCount + 1);
            }}
            refreshCount={refreshCount}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">Start a new conversation</h3>
              <p className="text-gray-400 text-sm">Select an agent to begin chatting.</p>
            </div>
          </div>
        );
      case 'agents':
        return (
          <div className="flex-1 p-6 bg-gray-900">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl font-bold text-white mb-6">Agents</h1>
              {/* Agent content will be rendered inside chat interface */}
            </div>
          </div>
        );
      case 'tasks':
        return (
          <div className="flex-1 p-6 bg-gray-900">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl font-bold text-white mb-6">Tasks</h1>
              {/* Task content will be rendered inside chat interface */}
            </div>
          </div>
        );
      case 'examples':
        return <ChatExamples />;
      default:
        return selectedAgent ? (
          <ChatWithThreads
            selectedThreadId={selectedThreadId}
            setSelectedThreadId={setSelectedThreadId}
            agent={selectedAgent}
            onThreadUpdate={() => {
              setRefreshCount(refreshCount + 1);
            }}
            refreshCount={refreshCount}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">Start a new conversation</h3>
              <p className="text-gray-400 text-sm">Select an agent to begin chatting.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedAgent={selectedAgent}
        agents={agents}
        setSelectedAgent={setSelectedAgent}
        selectedThreadId={selectedThreadId}
        setSelectedThreadId={setSelectedThreadId}
        refreshCount={refreshCount}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 flex flex-col min-h-screen bg-gray-900">
        {/* Top bar for mobile */}
        <div className="lg:hidden bg-gray-900 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-800 text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <div className="w-9 h-9" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}

function App() {
  // Memoize the config to prevent recreating it on every render
  const config = useMemo(() => ({
    baseUrl: 'http://localhost:8080/api/v1',
    debug: true
  }), []);

  return (
    <DistriProvider config={config}>
      <AppContent />
    </DistriProvider>
  );
}

export default App;