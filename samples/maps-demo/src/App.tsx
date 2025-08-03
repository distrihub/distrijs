import { useMemo, useRef, useState, useCallback } from 'react';
import { DistriProvider, Chat, useAgent, DistriAnyTool, useThreads } from '@distri/react';
import { AlertCircle } from 'lucide-react';
import { APIProvider } from '@vis.gl/react-google-maps';
import GoogleMapsManager, { GoogleMapsManagerRef } from './components/GoogleMapsManager';
import { ConversationsSidebar } from './components/ConversationsSidebar';
import { getTools } from './Tools.tsx';
import { uuidv4 } from '@distri/core';
import { SidebarProvider, SidebarInset } from '@distri/components';

// Environment variables validation
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const DISTRI_API_URL = import.meta.env.VITE_DISTRI_API_URL || 'http://localhost:8080/api/v1';

function getThreadId() {
  const threadId = localStorage.getItem('MapsDemo:threadId');
  if (!threadId) {
    const newThreadId = uuidv4();
    localStorage.setItem('MapsDemo:threadId', newThreadId);
    return newThreadId;
  }
  return threadId;
}

function MapsChat() {
  const { agent, loading } = useAgent({ agentIdOrDef: 'maps-navigator' });
  const [selectedThreadId, setSelectedThreadId] = useState<string>(getThreadId());
  const mapManagerRef = useRef<GoogleMapsManagerRef>(null);
  const [tools, setTools] = useState<DistriAnyTool[]>([]);

  // Thread management
  const { threads, loading: threadsLoading, refetch, deleteThread } = useThreads();

  // Get tools when map manager is ready
  const handleMapReady = useCallback((mapRef: GoogleMapsManagerRef) => {
    console.log('Map manager is ready, getting tools...');
    const mapTools = getTools(mapRef);
    console.log('Created tools array:', mapTools.map(t => t.name));
    setTools(mapTools);
  }, []);

  // Thread management functions
  const handleThreadSelect = useCallback((threadId: string) => {
    setSelectedThreadId(threadId);
    localStorage.setItem('MapsDemo:threadId', threadId);
  }, []);

  const handleThreadDelete = useCallback(async (threadId: string) => {
    try {
      await deleteThread(threadId);
      if (selectedThreadId === threadId) {
        const newThreadId = uuidv4();
        setSelectedThreadId(newThreadId);
        localStorage.setItem('MapsDemo:threadId', newThreadId);
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  }, [deleteThread, selectedThreadId]);

  const handleThreadRename = useCallback((threadId: string, newTitle: string) => {
    // This would typically update the thread title on the server
    console.log('Rename thread:', threadId, 'to:', newTitle);
  }, []);

  // New chat logic
  const handleNewChat = useCallback(() => {
    const newThreadId = uuidv4();
    setSelectedThreadId(newThreadId);
    localStorage.setItem('MapsDemo:threadId', newThreadId);
    // Optionally, refetch threads to show the new one if backend supports creation
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-600 dark:text-gray-300">Loading Maps Assistant...</span>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="max-w-md p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Backend Not Available
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The Distri backend server is not running. Please start the backend server.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              To start the backend, run:
            </p>
            <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">
              pnpm dev:maps
            </code>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Make sure the backend is running on {DISTRI_API_URL}
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      style={{
        "--sidebar-width": "20rem",
        "--sidebar-width-mobile": "18rem",
      } as React.CSSProperties}
    >
      <ConversationsSidebar
        threads={threads}
        selectedThreadId={selectedThreadId}
        loading={threadsLoading}
        onThreadSelect={handleThreadSelect}
        onThreadDelete={handleThreadDelete}
        onRefresh={refetch}
        onNewChat={handleNewChat}
      />
      <SidebarInset>
        <main className="flex-1 overflow-hidden">
          <div className="flex h-screen">
            {/* Google Maps Panel */}
            <div className="flex-1">
              <GoogleMapsManager
                ref={mapManagerRef}
                defaultCenter={{ lat: 37.7749, lng: -122.4194 }} // San Francisco
                defaultZoom={13}
                onReady={handleMapReady}
              />
            </div>

            {/* Chat Panel */}
            <div className="w-96">
              <div className="h-full">
                {!loading && agent && tools.length > 0 ? (
                  <Chat
                    agent={agent}
                    tools={tools}
                    theme="dark"
                    threadId={selectedThreadId}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-900 text-gray-300">
                    <div className="text-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                      <p>Loading chat interface...</p>
                      {!agent && <p className="text-sm text-gray-400 mt-1">Waiting for agent</p>}
                      {agent && tools.length === 0 && <p className="text-sm text-gray-400 mt-1">Waiting for map tools</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function EnvironmentCheck() {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Google Maps API Key Required
          </h2>
          <p className="text-gray-600 mb-4">
            To use this sample, you need to configure your Google Maps API key.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">
              1. Get an API key from the <a
                href="https://developers.google.com/maps/documentation/javascript/get-api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Maps Platform
              </a>
            </p>
            <p className="text-sm text-gray-700 mb-2">
              2. Copy <code className="bg-gray-200 px-1 rounded">.env.example</code> to <code className="bg-gray-200 px-1 rounded">.env</code>
            </p>
            <p className="text-sm text-gray-700">
              3. Set <code className="bg-gray-200 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your API key
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Make sure to enable Maps JavaScript API and Places API in your Google Cloud Console
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function App() {
  const config = useMemo(() => ({
    baseUrl: DISTRI_API_URL,
    debug: true
  }), []);

  // Check for required environment variables
  const envCheck = EnvironmentCheck();
  if (envCheck) return envCheck;

  return (
    <DistriProvider config={config}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <MapsChat />
      </APIProvider>
    </DistriProvider>
  );
}

export default App;