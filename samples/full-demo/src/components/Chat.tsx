import React from 'react';
import { Chat, DistriAgent } from '@distri/react';

interface ChatProps {
  selectedThreadId: string;
  agent: DistriAgent;
  onThreadUpdate: (threadId: string) => void;
}

const EnhancedChat: React.FC<ChatProps> = ({ selectedThreadId, agent, onThreadUpdate }) => {
  return (
    <Chat
      agentId={agent.id}
      threadId={selectedThreadId}
      agent={agent}
      height="100vh"
      onThreadUpdate={() => onThreadUpdate(selectedThreadId)}
    />
  );
};

export default EnhancedChat;