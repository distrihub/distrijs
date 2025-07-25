import React, { useState } from 'react';
import { Chat as DistriChat, useAgent, useThreads } from '@distri/react';
import { DistriAgent } from '@distri/react';
import { ChevronLeft, ChevronRight, Plus, MessageSquare, Settings, Activity, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import AgentList from './AgentList';
import TaskMonitor from './TaskMonitor';

interface ChatWithThreadsProps {
  selectedThreadId: string;
  setSelectedThreadId: (threadId: string) => void;
  agent: DistriAgent;
  onThreadUpdate: (threadId: string) => void;
  refreshCount: number;
}

// Conversations List Component for Sidebar
const ConversationsList = ({
  selectedThreadId,
  setSelectedThreadId,
  refreshCount
}: {
  selectedThreadId: string,
  setSelectedThreadId: (threadId: string) => void,
  refreshCount: number
}) => {
  const { threads, loading: threadsLoading, refetch: refetchThreads } = useThreads();

  React.useEffect(() => {
    refetchThreads();
  }, [refreshCount, refetchThreads]);

  if (threadsLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-blue-400 mr-2" />
        <span className="text-gray-400 text-sm">Loading conversations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {threads.length === 0 ? (
        <div className="text-xs text-gray-500 text-center py-4">
          No conversations yet
        </div>
      ) : (
        threads.map((thread: any) => (
          <div
            key={thread.id}
            onClick={() => setSelectedThreadId(thread.id)}
            className={`p-2 rounded cursor-pointer transition-colors text-sm ${selectedThreadId === thread.id
              ? 'bg-blue-900 text-white'
              : 'text-gray-300 hover:bg-gray-800'
              }`}
          >
            <div className="truncate">{thread.title || 'Untitled'}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(thread.updated_at).toLocaleDateString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Sidebar Component for Threaded Mode
const ThreadsSidebar = ({
  isOpen,
  onToggle,
  selectedThreadId,
  setSelectedThreadId,
  refreshCount,
  activeTab,
  setActiveTab
}: {
  isOpen: boolean;
  onToggle: () => void;
  selectedThreadId: string;
  setSelectedThreadId: (threadId: string) => void;
  refreshCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  const menuItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'agents', label: 'Agents', icon: Settings },
    { id: 'tasks', label: 'Tasks', icon: Activity },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed left-4 top-4 z-50 p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition-colors"
      >
        {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full pt-16">
          {/* Navigation */}
          <nav className="p-4 border-b border-gray-700">
            <div className="space-y-1">
              {/* New Chat Button */}
              <button
                onClick={() => {
                  const newThreadId = uuidv4();
                  setSelectedThreadId(newThreadId);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-300 hover:text-white hover:bg-gray-800 mb-4"
              >
                <Plus className="h-5 w-5" />
                <span>New Chat</span>
              </button>

              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Conversations - moved to top */}
          <div className="flex-1 p-4 border-b border-gray-700">
            <h3 className="text-sm font-medium text-white mb-3">Conversations</h3>
            <ConversationsList
              selectedThreadId={selectedThreadId}
              setSelectedThreadId={setSelectedThreadId}
              refreshCount={refreshCount}
            />
          </div>

          {/* Content based on active tab */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'agents' && (
              <div className="p-4">
                <AgentList
                  agents={[]}
                  onRefresh={async () => { }}
                  onStartChat={() => { }}
                  onUpdateAgent={async () => { }}
                />
              </div>
            )}
            {activeTab === 'tasks' && (
              <div className="p-4">
                <TaskMonitor />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const ChatWithThreads: React.FC<ChatWithThreadsProps> = ({
  selectedThreadId,
  setSelectedThreadId,
  agent,
  onThreadUpdate,
  refreshCount
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

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
    <div className="flex h-full bg-gray-900">
      <ThreadsSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedThreadId={selectedThreadId}
        setSelectedThreadId={setSelectedThreadId}
        refreshCount={refreshCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {activeTab === 'chat' ? (
          <DistriChat
            agentId={agent.id}
            threadId={selectedThreadId}
            agent={agentInstance}
            height="100vh"
            onThreadUpdate={handleThreadUpdate}
          />
        ) : activeTab === 'agents' ? (
          <div className="h-full p-6">
            <AgentList
              agents={[]}
              onRefresh={async () => { }}
              onStartChat={() => { }}
              onUpdateAgent={async () => { }}
            />
          </div>
        ) : (
          <div className="h-full p-6">
            <TaskMonitor />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWithThreads; 