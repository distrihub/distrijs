import { useEffect, useState, useMemo } from 'react';
import { MessageSquare, Settings, Activity, Loader2, Bot, Code, Menu, X, Home } from 'lucide-react';
import { DistriProvider, useAgents, DistriAgent } from '@distri/react';
import ChatPage from './pages/ChatPage';
import AgentsPage from './pages/AgentsPage';
import TasksPage from './pages/TasksPage';
import AgentApiDemo from './components/AgentApiDemo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedAgent: DistriAgent | null;
  agents: DistriAgent[];
  setSelectedAgent: (agent: DistriAgent | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  selectedAgent,
  agents,
  setSelectedAgent
}) => {
  const menuItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'agents', label: 'Agents', icon: Settings },
    { id: 'tasks', label: 'Tasks', icon: Activity },
    { id: 'demo', label: 'API Demo', icon: Code },
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
              <div>
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

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
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
  const [activeTab, setActiveTab] = useState<'chat' | 'agents' | 'tasks' | 'demo'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, loading, selectedAgent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatPage selectedAgent={selectedAgent} />;
      case 'agents':
        return <AgentsPage />;
      case 'tasks':
        return <TasksPage />;
      case 'demo':
        return <AgentApiDemo />;
      default:
        return <ChatPage selectedAgent={selectedAgent} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedAgent={selectedAgent}
        agents={agents}
        setSelectedAgent={setSelectedAgent}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 flex flex-col min-h-screen">
        {/* Top bar for mobile */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
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