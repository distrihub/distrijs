import React, { useState } from 'react';
import { Chat as DistriChat, useAgent } from '@distri/react';
import { DistriAgent } from '@distri/react';

interface ChatProps {
  selectedThreadId: string;
  agent: DistriAgent;
  onThreadUpdate: (threadId: string) => void;
}

const EnhancedChat: React.FC<ChatProps> = ({
  selectedThreadId,
  agent,
  onThreadUpdate
}) => {
  // Use the useAgent hook to get the proper Agent instance
  const { agent: agentInstance, loading: agentLoading } = useAgent({
    agentId: agent.id,
    autoCreateAgent: true
  });

  const handleThreadUpdate = () => {
    onThreadUpdate(selectedThreadId);
  };

  if (agentLoading || !agentInstance) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <span className="text-gray-300">Loading agent...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900">
      <DistriChat
        agentId={agent.id}
        threadId={selectedThreadId}
        agent={agentInstance}
        height="100vh"
        onThreadUpdate={handleThreadUpdate}
      />
    </div>
  );
};

export default EnhancedChat;