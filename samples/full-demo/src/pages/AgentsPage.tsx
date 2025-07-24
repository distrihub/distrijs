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
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          <span className="text-white">Loading agents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">Agents</h1>
          <p className="text-gray-400 text-lg">
            Manage and configure your AI agents.
          </p>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
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
      </div>
    </div>
  );
}

export default AgentsPage;