import { useEffect, useState, useMemo } from 'react';
import { Settings, Activity, Code, Wrench, Monitor, Maximize } from 'lucide-react';
import { DistriProvider, useAgents, DistriAgent, ChatContainer, FullChat, EmbeddableChat } from '@distri/react';
import AgentsPage from './pages/AgentsPage';
import TasksPage from './pages/TasksPage';
import AgentApiDemo from './components/AgentApiDemo';
import ToolsExample from './components/ToolsExample';

function AppContent() {
  const { agents, loading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<DistriAgent | null>(agents[0] || null);
  const [activeTab, setActiveTab] = useState<'embedded' | 'full' | 'agents' | 'tasks' | 'tools' | 'demo'>('embedded');

  useEffect(() => {
    if (!loading && agents.length > 0) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation - Compact header instead of sidebar */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Distri</h1>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Demo</span>
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
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('embedded')}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'embedded'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Monitor className="h-4 w-4" />
                <span>Embedded</span>
              </button>
              <button
                onClick={() => setActiveTab('full')}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'full'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Maximize className="h-4 w-4" />
                <span>Full Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'tools'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Wrench className="h-4 w-4" />
                <span>Tools</span>
              </button>
              <button
                onClick={() => setActiveTab('agents')}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'agents'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Settings className="h-4 w-4" />
                <span>Agents</span>
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'tasks'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Activity className="h-4 w-4" />
                <span>Tasks</span>
              </button>
              <button
                onClick={() => setActiveTab('demo')}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'demo'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Code className="h-4 w-4" />
                <span>API</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Embedded Chat Demo */}
        {activeTab === 'embedded' && selectedAgent && (
          <div className="h-full p-6">
            <div className="max-w-4xl mx-auto h-full">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Embedded Chat</h2>
                <p className="text-gray-600">
                  Clean, embeddable chat interface perfect for integrating into existing applications.
                  No sidebar, just pure chat functionality.
                </p>
              </div>
              
              <div className="h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm border">
                <EmbeddableChat
                  agentId={selectedAgent.id}
                  height="100%"
                  theme="auto"
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
              theme="auto"
              showSidebar={true}
              sidebarWidth={280}
            />
          </div>
        )}

        {/* Tools Demo */}
        {activeTab === 'tools' && (
          <div className="flex-1 overflow-auto">
            <ToolsExample />
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

        {/* API Demo */}
        {activeTab === 'demo' && (
          <div className="flex-1 overflow-auto">
            <AgentApiDemo />
          </div>
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