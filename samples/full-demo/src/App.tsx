import { useEffect, useState, useMemo } from 'react';
import { DistriProvider, useAgents, FullChat, ThemeProvider } from '@distri/react';
import { DistriAgent } from '@distri/core';

function AppContent() {
  const { agents, loading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<DistriAgent | null>(null);

  useEffect(() => {
    if (!loading && agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, loading, selectedAgent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span className="text-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!selectedAgent && agents.length > 0) {
    setSelectedAgent(agents[0]);
    return null;
  }

  const availableAgents = agents.map((agent: DistriAgent) => ({
    id: agent.id,
    name: agent.name,
    description: agent.description
  }));

  return (
    <div className="h-screen bg-background">

      <FullChat
        agentId={selectedAgent?.id || ''}
        availableAgents={availableAgents}
        onAgentSelect={(agentId: string) => {
          const agent = agents.find((a: DistriAgent) => a.id === agentId);
          if (agent) setSelectedAgent(agent);
        }}

      />
    </div>
  );
}

function App() {
  const config = useMemo(() => ({
    baseUrl: 'http://localhost:8080/api/v1',
    debug: true
  }), []);

  // Initialize theme to dark by default
  useEffect(() => {
    const currentTheme = localStorage.getItem('distri-theme');
    if (!currentTheme || currentTheme === 'system') {
      localStorage.setItem('distri-theme', 'dark');
    }
  }, []);

  return (
    <DistriProvider config={config}>
      <ThemeProvider defaultTheme="dark" storageKey="distri-theme">
        <AppContent />
      </ThemeProvider>
    </DistriProvider>
  );
}

export default App;