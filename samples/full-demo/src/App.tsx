import { useEffect, useState, useMemo } from 'react';
import { Settings, Activity, Monitor, Maximize } from 'lucide-react';
import { DistriProvider, useAgents, DistriAgent, FullChat, EmbeddableChat } from '@distri/react';
import AgentsPage from './pages/AgentsPage';
import TasksPage from './pages/TasksPage';

function AppContent() {
  const { agents, loading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<DistriAgent | null>(agents[0] || null);
  const [activeTab, setActiveTab] = useState<'embedded' | 'full' | 'agents' | 'tasks'>('embedded');

  useEffect(() => {
    if (!loading && agents.length > 0) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
          <span className="text-white">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Navigation - Compact header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">Distri</h1>
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">Demo</span>
            </div>

            {/* Agent Selector - only show for chat tabs */}
            {(activeTab === 'embedded' || activeTab === 'full') && (
              <div className="flex items-center space-x-2">
                <select
                  value={selectedAgent?.id || ''}
                  onChange={(e) => {
                    const agent = agents.find(a => a.id === e.target.value);
                    setSelectedAgent(agent || null);
                  }}
                  className="border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {agents.map((agent: DistriAgent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('embedded')}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'embedded'
                  ? 'bg-gray-800 text-blue-400 shadow-sm'
                  : 'text-gray-300 hover:text-white'
                  }`}
              >
                <Monitor className="h-4 w-4" />
                <span>Embedded</span>
              </button>
              <button
                onClick={() => setActiveTab('full')}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'full'
                  ? 'bg-gray-800 text-blue-400 shadow-sm'
                  : 'text-gray-300 hover:text-white'
                  }`}
              >
                <Maximize className="h-4 w-4" />
                <span>Full Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('agents')}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'agents'
                  ? 'bg-gray-800 text-blue-400 shadow-sm'
                  : 'text-gray-300 hover:text-white'
                  }`}
              >
                <Settings className="h-4 w-4" />
                <span>Agents</span>
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'tasks'
                  ? 'bg-gray-800 text-blue-400 shadow-sm'
                  : 'text-gray-300 hover:text-white'
                  }`}
              >
                <Activity className="h-4 w-4" />
                <span>Tasks</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Embedded Chat Demo */}
        {activeTab === 'embedded' && selectedAgent && (
          <div className="h-full p-6 bg-gray-900">
            <div className="max-w-4xl mx-auto h-full">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Embedded Chat</h2>
                <p className="text-gray-400">
                  Clean, embeddable chat interface perfect for integrating into existing applications.
                  No sidebar, just pure chat functionality.
                </p>
              </div>
              
              <div className="h-[calc(100vh-200px)] bg-gray-800 rounded-lg shadow-sm border border-gray-700">
                <EmbeddableChat
                  agentId={selectedAgent.id}
                  height="100%"
                  theme="dark"
                  placeholder={`Chat with ${selectedAgent.name}...`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Full Chat Demo */}
        {activeTab === 'full' && selectedAgent && (
          <div className="h-full">
            <FullChat
              agentId={selectedAgent.id}
              theme="dark"
              showSidebar={true}
              sidebarWidth={280}
            />
          </div>
        )}

        {/* Agents Management */}
        {activeTab === 'agents' && (
          <AgentsPage />
        )}

        {/* Tasks Management */}
        {activeTab === 'tasks' && (
          <TasksPage />
        )}
      </div>
    </div>
  );
}

function App() {
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