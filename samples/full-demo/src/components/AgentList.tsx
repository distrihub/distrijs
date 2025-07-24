import React, { useState } from 'react';
import { RefreshCw, Play, Bot, Edit, Eye } from 'lucide-react';
import { DistriAgent } from '@distri/react';
import AgentEditForm from './AgentEditForm';
import AgentDetailsDialog from './AgentDetailsDialog';

interface AgentListProps {
  agents: DistriAgent[];
  onRefresh: () => Promise<void>;
  onStartChat: (agent: DistriAgent) => void;
  onUpdateAgent?: (agent: DistriAgent) => Promise<void>;
}

const AgentList: React.FC<AgentListProps> = ({ agents, onRefresh, onStartChat, onUpdateAgent }) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [editingAgent, setEditingAgent] = useState<DistriAgent | null>(null);
  const [viewingAgent, setViewingAgent] = useState<DistriAgent | null>(null);

  console.log('agents', agents);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditAgent = (agent: DistriAgent) => {
    setEditingAgent(agent);
  };

  const handleViewAgent = (agent: DistriAgent) => {
    setViewingAgent(agent);
  };

  const handleSaveAgent = async (agent: DistriAgent) => {
    if (onUpdateAgent) {
      try {
        await onUpdateAgent(agent);
        await onRefresh(); // Refresh the list after updating
      } catch (error) {
        console.error('Failed to update agent:', error);
        throw error; // Re-throw to let the dialog handle the error
      }
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50">
      <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
        <h2 className="text-xl font-semibold text-white">Available Agents</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="p-6">
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No agents available</p>
            <p className="text-sm text-gray-500 mt-2">Check your server connection</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="bg-gray-700/30 border border-gray-600/50 rounded-xl p-6 hover:border-gray-500/50 hover:bg-gray-700/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{agent.name}</h3>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-400 capitalize">
                          {agent.version ? `v${agent.version}` : 'Latest'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-6 line-clamp-3">
                  {agent.description || 'No description available'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {agent.version && `Version ${agent.version}`}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewAgent(agent)}
                      className="flex items-center space-x-1 px-3 py-2 text-xs bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => handleEditAgent(agent)}
                      className="flex items-center space-x-1 px-3 py-2 text-xs bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                      title="Edit Agent"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onStartChat(agent)}
                      className="flex items-center space-x-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Edit Dialog */}
      {editingAgent && (
        <AgentEditForm
          agent={editingAgent}
          isOpen={!!editingAgent}
          onClose={() => setEditingAgent(null)}
          onSave={handleSaveAgent}
        />
      )}

      {/* Details Dialog */}
      {viewingAgent && (
        <AgentDetailsDialog
          agentId={viewingAgent.name}
          isOpen={!!viewingAgent}
          onClose={() => setViewingAgent(null)}
          onStartChat={() => {
            setViewingAgent(null);
            onStartChat(viewingAgent);
          }}
        />
      )}
    </div>
  );
};

export default AgentList;