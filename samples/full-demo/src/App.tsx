import { useEffect, useState, useMemo } from 'react';
import { DistriProvider, useAgents, DistriAgent, FullChat } from '@distri/react';
import AgentsPage from './pages/AgentsPage';
import TasksPage from './pages/TasksPage';

type PageType = 'chat' | 'agents' | 'tasks';

function AppContent() {
  const { agents, loading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<DistriAgent | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('chat');

  useEffect(() => {
    if (!loading && agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, loading, selectedAgent]);

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

  if (!selectedAgent && agents.length > 0) {
    setSelectedAgent(agents[0]);
    return null;
  }

  const availableAgents = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    description: agent.description
  }));

  return (
    <div className="h-screen bg-gray-900">
      <FullChat
        agentId={selectedAgent?.id || ''}
        availableAgents={availableAgents}
        theme="dark"
        showSidebar={true}
        sidebarWidth={280}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onAgentSelect={(agentId) => {
          const agent = agents.find(a => a.id === agentId);
          if (agent) setSelectedAgent(agent);
        }}
        onLogoClick={() => setCurrentPage('chat')}
      />
      
      {/* Render page content in the main area when not on chat */}
      {currentPage !== 'chat' && (
        <div 
          className="fixed top-0 bg-gray-900 h-full overflow-auto"
          style={{ 
            left: '280px', 
            right: '0'
          }}
        >
          {currentPage === 'agents' && <AgentsPage />}
          {currentPage === 'tasks' && <TasksPage />}
        </div>
      )}
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