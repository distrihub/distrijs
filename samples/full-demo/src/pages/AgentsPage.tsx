import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAgents, DistriAgent } from '@distri/react';
import AgentList from '../components/AgentList';

function AgentsPage() {
  const { agents, loading, refetch: refetchAgents } = useAgents();


  const [selectedAgent, setSelectedAgent] = useState<DistriAgent | null>(null);

  // Auto-select first agent when agents load
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, selectedAgent]);



  const startChatWithAgent = async (agent: DistriAgent) => {
    setSelectedAgent(agent);
  };





  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading agents...</span>
        </div>
      </div>
    );
  }

  return (

    <main className="flex-1 flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

      <div className="h-full max-w-6xl">
        <AgentList
          agents={agents}
          onRefresh={refetchAgents}
          onStartChat={startChatWithAgent}
          onUpdateAgent={async (agent) => {
            try {
              const id = agent.id || agent.name;
              // Make API call to update agent
              const response = await fetch(`/api/v1/agents/${id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(agent),
              });

              if (!response.ok) {
                throw new Error(`Failed to update agent: ${response.statusText}`);
              }

              // Refresh the agents list
              await refetchAgents();
            } catch (error) {
              console.error('Failed to update agent:', error);
              throw error;
            }
          }}
        />
      </div>
    </main>
  );
}

export default AgentsPage;