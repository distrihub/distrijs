import React from 'react';
import AgentList from '../components/AgentList';
import { useAgents } from '@distri/react';
import { DistriAgent } from '@distri/core';

const AgentsPage: React.FC = () => {
  const { agents, loading, refetch } = useAgents();

  const handleRefresh = async () => {
    await refetch();
  };

  const handleStartChat = (agent: DistriAgent) => {
    // This would typically navigate to chat or update the selected agent
    console.log('Starting chat with agent:', agent.name);
  };

  const handleUpdateAgent = async (agent: DistriAgent) => {
    // This would typically make an API call to update the agent
    console.log('Updating agent:', agent.name);
    // For now, just refresh the list
    await refetch();
  };

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span className="text-foreground">Loading agents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Agents</h1>
        <AgentList
          agents={agents}
          onRefresh={handleRefresh}
          onStartChat={handleStartChat}
          onUpdateAgent={handleUpdateAgent}
        />
      </div>
    </div>
  );
};

export default AgentsPage;