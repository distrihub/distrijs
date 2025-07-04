import React, { useState } from 'react';
import { RefreshCw, Play, Bot, CheckCircle, XCircle, Edit, Eye } from 'lucide-react';
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

  const handleUpdateAgent = async (agentId: string) => {
    try {
      // Make API call to update agent
      const response = await fetch(`/api/v1/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingAgent),
      });

      if (!response.ok) {
        throw new Error(`Failed to update agent: ${response.statusText}`);
      }

      await onRefresh(); // Refresh the list after updating
    } catch (error) {
      console.error('Failed to update agent:', error);
      throw error;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Available Agents</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
                     <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="p-6">
        {agents.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No agents available</p>
            <p className="text-sm text-gray-400 mt-1">Check your server connection</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{agent.name}</h3>
                      <div className="flex items-center space-x-1">
                        {agent.status === 'online' ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-xs text-gray-500 capitalize">
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {agent.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    {agent.card?.version && `v${agent.card.version}`}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewAgent(agent)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                      title="View Details"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleEditAgent(agent)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      title="Edit Agent"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onStartChat(agent)}
                      disabled={agent.status !== 'online'}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          agent={viewingAgent}
          isOpen={!!viewingAgent}
          onClose={() => setViewingAgent(null)}
          onStartChat={(agent) => {
            setViewingAgent(null);
            onStartChat(agent);
          }}
        />
      )}
    </div>
  );
};

export default AgentList;