import { DistriAgent, DistriThread, useThreads } from "@distri/react";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import Chat from "../components/Chat";
import { uuidv4 } from "@distri/core";
import MessageRenderer from "../components/MessageRenderer";


const ThreadItem = ({ thread, selectedThreadId, setSelectedThreadId }: { thread: DistriThread, selectedThreadId: string, setSelectedThreadId: (threadId: string) => void }) => {
  return (<div
    key={thread.id}
    onClick={() => {
      setSelectedThreadId(thread.id);
    }}
    className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedThreadId === thread.id
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
  </div>)
};



const ThreadsList = ({ selectedThreadId, setSelectedThreadId, refreshCount }: { selectedThreadId: string, setSelectedThreadId: (threadId: string) => void, refreshCount: number }) => {
  const { threads, loading: threadsLoading, refetch: refetchThreads } = useThreads();

  const initNewThread = () => {
    setSelectedThreadId(uuidv4());
  }

  useEffect(() => {
    refetchThreads();
  }, [refreshCount]);


  if (threadsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (<div className="w-80 flex-shrink-0">
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-medium text-gray-900">Conversations</h2>
        <button
          onClick={() => {
            initNewThread();
          }}
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
              Click "New" to start
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <ThreadItem key={thread.id} thread={thread} selectedThreadId={selectedThreadId} setSelectedThreadId={setSelectedThreadId} />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>)
}


export default function ChatPage({ selectedAgent }: { selectedAgent: DistriAgent | null }) {
  const [selectedThreadId, setSelectedThreadId] = useState<string>(uuidv4());
  const [refreshCount, setRefreshCount] = useState<number>(0);
  console.log('selectedAgent', selectedAgent);
  return (
    <main className="flex flex-1 flex-col min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-1 h-full w-full gap-8">
        <ThreadsList selectedThreadId={selectedThreadId} setSelectedThreadId={setSelectedThreadId} refreshCount={refreshCount} />
        {selectedAgent ? (
          <div className="flex-1 flex flex-col">
            <Chat
              selectedThreadId={selectedThreadId}
              agent={selectedAgent}
              onThreadUpdate={() => {
                setRefreshCount((refreshCount) => refreshCount + 1);
              }}
            />
          </div>
        ) : (
          <EmptyAgent />
        )}
      </div>
    </main>
  )
}

const EmptyAgent = () => {
  return (
    <main className="flex-1 flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="h-full">
        <div className="bg-white rounded-lg shadow h-full flex flex-col w-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex flex-col items-center justify-center h-full py-8">
              <MessageRenderer content={''} className="" />
              <div className="flex flex-col items-center mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" /></svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a new conversation</h3>
                <p className="text-gray-500 text-sm">Select an agent to begin chatting.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main >
  )
}

