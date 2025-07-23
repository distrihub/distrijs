import { DistriAgent } from "@distri/react";
import EnhancedChat from "../components/Chat";

const EmptyAgent = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-medium text-white mb-2">Start a new conversation</h3>
        <p className="text-gray-400 text-sm">Select an agent to begin chatting.</p>
      </div>
    </div>
  );
}

export default function ChatPage({
  selectedAgent,
  selectedThreadId,
  onThreadUpdate
}: {
  selectedAgent: DistriAgent | null;
  selectedThreadId: string;
  onThreadUpdate: (threadId: string) => void;
}) {

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {selectedAgent ? (
        <EnhancedChat
          selectedThreadId={selectedThreadId}
          agent={selectedAgent}
          onThreadUpdate={onThreadUpdate}
        />
      ) : (
        <EmptyAgent />
      )}
    </div>
  );
}

