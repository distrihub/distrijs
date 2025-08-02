import React from 'react';
import { RefreshCw, Play, Bot } from 'lucide-react';
import { AgentDefinition } from '@distri/core';

interface AgentListProps {
  agents: AgentDefinition[];
  onRefresh: () => Promise<void>;
  onStartChat: (agent: AgentDefinition) => void;
}

const AgentList: React.FC<AgentListProps> = ({ agents, onRefresh, onStartChat }) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Available Agents</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="p-6">
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No agents available</p>
            <p className="text-sm text-muted-foreground mt-2">Check your server connection</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="bg-card border border-border rounded-xl p-6 hover:border-border/80 hover:bg-card/80 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{agent.name}</h3>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-muted-foreground capitalize">
                          {agent.version ? `v${agent.version}` : 'Latest'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                  {agent.description || 'No description available'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {agent.version && `Version ${agent.version}`}
                  </div>
                  <div className="flex items-center space-x-2">

                    <button
                      onClick={() => onStartChat(agent)}
                      className="flex items-center space-x-1 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Play className="h-3 w-3" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AgentList;