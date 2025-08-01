import React from 'react';
import { useAgents } from '@distri/react';
import { DistriAgent } from '@distri/core';
import { useNavigate } from 'react-router-dom';

// Import AgentList from the react package
import AgentList from '@distri/react/dist/components/AgentList';

export function DefinitionsPage() {
  const navigate = useNavigate();
  const { agents, loading, refetch } = useAgents();

  const handleStartChat = (agent: DistriAgent) => {
    // Navigate to chat page with agent context
    navigate('/definitions/chat', { state: { agent } });
  };

  const handleRefresh = async () => {
    await refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <AgentList
        agents={agents}
        onRefresh={handleRefresh}
        onStartChat={handleStartChat}
      />
    </div>
  );
}