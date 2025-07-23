import React from 'react';
import { Bot } from 'lucide-react';

interface WelcomeMessageProps {
  agentName?: string;
  agentDescription?: string;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  agentName = "Assistant",
  agentDescription = "How can I help you today?"
}) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-900">
      <div className="text-center max-w-2xl mx-auto px-4">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bot className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          {agentName}
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          {agentDescription}
        </p>
        <div className="text-sm text-gray-500">
          <p>Start a conversation by typing a message below.</p>
        </div>
      </div>
    </div>
  );
}; 