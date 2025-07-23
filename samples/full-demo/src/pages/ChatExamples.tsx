import React, { useState } from 'react';
import { DistriAgent, useAgents } from '@distri/react';
import Chat from '../components/Chat';
import ChatWithThreads from '../components/ChatWithThreads';
import { v4 as uuidv4 } from 'uuid';

const ChatExamples = () => {
  const { agents, loading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<DistriAgent | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string>(uuidv4());
  const [refreshCount, setRefreshCount] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading agents...</div>
      </div>
    );
  }

  if (!selectedAgent && agents.length > 0) {
    setSelectedAgent(agents[0]);
  }

  const handleThreadUpdate = () => {
    setRefreshCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Chat Component Examples</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Simple Chat Example */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Simple Chat Component</h2>
            <p className="text-gray-300 mb-4">
              A clean, simple chat interface without sidebar. Perfect for embedding in your own UI.
            </p>
            <div className="h-96 border border-gray-600 rounded-lg overflow-hidden">
              {selectedAgent && (
                <Chat
                  selectedThreadId={selectedThreadId}
                  agent={selectedAgent}
                  onThreadUpdate={handleThreadUpdate}
                />
              )}
            </div>
          </div>

          {/* ChatWithThreads Example */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">ChatWithThreads Component</h2>
            <p className="text-gray-300 mb-4">
              Full-featured chat with collapsible sidebar for conversations, agents, and tasks.
            </p>
            <div className="h-96 border border-gray-600 rounded-lg overflow-hidden">
              {selectedAgent && (
                <ChatWithThreads
                  selectedThreadId={selectedThreadId}
                  setSelectedThreadId={setSelectedThreadId}
                  agent={selectedAgent}
                  onThreadUpdate={handleThreadUpdate}
                  refreshCount={refreshCount}
                />
              )}
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Usage Instructions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Simple Chat Component</h3>
              <pre className="bg-gray-900 p-4 rounded-lg text-green-400 text-sm overflow-x-auto">
                {`import { Chat } from '@distri/react';

<Chat
  selectedThreadId={threadId}
  agent={agent}
  onThreadUpdate={(threadId) => {
    // Handle thread updates
  }}
/>`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">ChatWithThreads Component</h3>
              <pre className="bg-gray-900 p-4 rounded-lg text-green-400 text-sm overflow-x-auto">
                {`import { ChatWithThreads } from '@distri/react';

<ChatWithThreads
  selectedThreadId={threadId}
  setSelectedThreadId={setThreadId}
  agent={agent}
  onThreadUpdate={(threadId) => {
    // Handle thread updates
  }}
  refreshCount={refreshCount}
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatExamples; 