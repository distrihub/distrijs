import { useEffect, useState } from 'react';
import { MessageSquare, Settings, Activity, Loader2, Bot } from 'lucide-react';
import { DistriProvider, useAgents, DistriAgent } from '@distri/react';
import ChatPage from './pages/ChatPage';
import AgentsPage from './pages/AgentsPage';
import TasksPage from './pages/TasksPage';

function AppContent() {
  const { agents, loading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<DistriAgent | null>(agents[0] || null);
  const [activeTab, setActiveTab] = useState<'chat' | 'agents' | 'tasks'>('chat');

  useEffect(() => {
    if (!loading && agents.length > 0) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, loading]);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('chat')}
                className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
              >
                <h1 className="text-2xl font-bold text-gray-900">Distri</h1>
                <span className="text-sm text-gray-500">AI Agent Platform</span>
              </button>
            </div>

            {/* Agent Selector - only show on chat tab */}
            <div className="flex items-center space-x-4">
              {activeTab === 'chat' && (
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-gray-600" />
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

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'chat'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
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
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}

      {activeTab === 'chat' && (
        <ChatPage selectedAgent={selectedAgent} />
      )}

      {activeTab === 'agents' && (
        <AgentsPage />
      )}

      {activeTab === 'tasks' && (
        <TasksPage />
      )}
    </div>
  );
}

function App() {
  return (
    <DistriProvider config={{
      baseUrl: 'http://localhost:8080/api/v1',
      debug: true
    }}>
      <AppContent />
    </DistriProvider>
  );
}

export default App;