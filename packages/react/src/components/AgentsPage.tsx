import React from 'react';
import AgentList from './AgentList';
import { useAgentDefinitions } from '../useAgentDefinitions';
import { AgentDefinition } from '@distri/core';

const AgentsPage: React.FC<{
  onStartChat?: (agent: AgentDefinition) => void;
}> = ({ onStartChat }) => {
  const { agents, loading, refetch } = useAgentDefinitions();

  const handleRefresh = async () => {
    await refetch();
  };

  const handleStartChat = (agent: AgentDefinition) => {
    // This would typically navigate to chat or update the selected agent
    onStartChat?.(agent);
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
        />
      </div>
    </div>
  );
};

export default AgentsPage;