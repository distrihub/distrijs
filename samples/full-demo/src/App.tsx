import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Settings, Activity, Loader2, Plus, Bot } from 'lucide-react';
import { DistriProvider, useAgents, useThreads, DistriAgent, DistriThread } from '@distri/react';
import { uuidv4 } from '@distri/core';
import Chat from './components/Chat';
import AgentList from './components/AgentList';
import TaskMonitor from './components/TaskMonitor';

function AppContent() {
  const { agents, loading: agentsLoading, refetch: refetchAgents } = useAgents();
  const { threads, loading: threadsLoading, createThread, deleteThread, updateThread, refetch: refetchThreads } = useThreads();

  const [selectedThread, setSelectedThread] = useState<DistriThread | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<DistriAgent | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'agents' | 'tasks'>('chat');

  const loading = agentsLoading || threadsLoading;

  const localThreadIdRef = useRef<string | null>(null);
  const [threadIdMap, setThreadIdMap] = useState<Record<string, string>>({});

  // Auto-select first agent when agents load
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, selectedAgent]);

  // Auto-select first thread when threads load
  useEffect(() => {
    if (threads.length > 0 && !selectedThread) {
      setSelectedThread(threads[0]);
    }
  }, [threads, selectedThread]);

  // Helper to replace local thread with backend thread everywhere
  const handleBackendThreadId = (localId: string, backendThread: DistriThread) => {
    setThreadIdMap(prev => ({ ...prev, [localId]: backendThread.id }));
    setSelectedThread(backendThread);
    // Replace in thread list by refetching or updating threads state if needed
    refetchThreads();
  };

  const createNewThread = () => {
    if (!selectedAgent) return;
    const localId = uuidv4();
    localThreadIdRef.current = localId;
    const newThread = { ...createThread(selectedAgent.id, `Untitled Conversation`), id: localId };
    setSelectedThread(newThread);
  };

  const startChatWithAgent = async (agent: DistriAgent) => {
    setSelectedAgent(agent);
    setActiveTab('chat');
    const localId = uuidv4();
    localThreadIdRef.current = localId;
    const newThread = { ...createThread(agent.id, `New Conversation with ${agent.name}`), id: localId };
    setSelectedThread(newThread);
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      await deleteThread(threadId);
      if (selectedThread?.id === threadId) {
        const remainingThreads = threads.filter(thread => thread.id !== threadId);
        setSelectedThread(remainingThreads.length > 0 ? remainingThreads[0] : null);
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  const handleThreadUpdate = async (threadId: string) => {
    try {
      await updateThread(threadId);
    } catch (error) {
      console.error('Failed to update thread:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('chat')}
                className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
              >
                <h1 className="text-2xl font-bold text-gray-900">Distri</h1>
                <span className="text-sm text-gray-500">AI Agent Platform</span>
              </button>
            </div>

            {/* Agent Selector - only show on chat tab */}
            <div className="flex items-center space-x-4">
              {activeTab === 'chat' && (
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-gray-600" />
                  <select
                    value={selectedAgent?.id || ''}
                    onChange={(e) => {
                      const agent = agents.find(a => a.id === e.target.value);
                      setSelectedAgent(agent || null);
                    }}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'chat'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab('agents')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'agents'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Agents</span>
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'tasks'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Activity className="h-4 w-4" />
                  <span>Tasks</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className={`flex-1 flex gap-8 ${activeTab === 'chat' ? '' : 'justify-center'}`}>
          {/* Sidebar - Threads (only show on chat tab) */}
          {activeTab === 'chat' && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h2 className="text-lg font-medium text-gray-900">Conversations</h2>
                  <button
                    onClick={createNewThread}
                    disabled={!selectedAgent}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {threads.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No conversations yet</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {selectedAgent ? 'Click "New" to start' : 'Select an agent first'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {threads.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => {
                            setSelectedThread(thread);
                          }}
                          className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedThread?.id === thread.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50 border-transparent'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 text-sm truncate">
                                {thread.title}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                with {thread.agent_name}
                              </p>
                              {thread.last_message && (
                                <p className="text-xs text-gray-400 mt-1 truncate">
                                  {thread.last_message}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end text-xs text-gray-400">
                              <span>{new Date(thread.updated_at).toLocaleDateString()}</span>
                              <span className="mt-1">{thread.message_count} msgs</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className={`flex-1 h-full ${activeTab === 'chat' ? '' : 'max-w-6xl'}`}>
            {activeTab === 'chat' && selectedAgent && (
              <div className="h-full">
                <Chat
                  thread={selectedThread}
                  agent={selectedAgent}
                  onThreadUpdate={selectedThread ? () => handleThreadUpdate(selectedThread.id) : undefined}
                  setThreadId={(threadId) => {
                    // Try to find the thread in the list
                    let found = threads.find(t => t.id === threadId);
                    if (!found) {
                      // If not found, create a placeholder so chat doesn't reset
                      found = {
                        id: threadId,
                        title: 'New Conversation',
                        agent_id: selectedAgent?.id || '',
                        agent_name: selectedAgent?.name || '',
                        updated_at: new Date().toISOString(),
                        message_count: 1,
                        last_message: '',
                      };
                    }
                    setSelectedThread(found);
                    refetchThreads();
                    updateThread(threadId);
                    localThreadIdRef.current = null;
                  }}
                  onBackendThreadId={handleBackendThreadId}
                />
              </div>
            )}

            {activeTab === 'agents' && (
              <div className="h-full">
                <AgentList
                  agents={agents}
                  onRefresh={refetchAgents}
                  onStartChat={startChatWithAgent}
                />
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="h-full">
                <TaskMonitor />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <DistriProvider config={{
      baseUrl: 'http://localhost:8080',
      debug: true
    }}>
      <AppContent />
    </DistriProvider>
  );
}

export default App;