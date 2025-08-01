import { useMemo, useRef, useState, useCallback } from 'react';
import { DistriProvider, EmbeddableChat, useAgent, DistriAnyTool } from '@distri/react';
import { AlertCircle } from 'lucide-react';
import { APIProvider } from '@vis.gl/react-google-maps';
import GoogleMapsManager, { GoogleMapsManagerRef } from './components/GoogleMapsManager';
import { getTools } from './Tools';
import { uuidv4 } from '@distri/core';

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
  const { agent, loading } = useAgent({ agentId: 'maps-navigator', autoCreateAgent: true });
  const [selectedThreadId] = useState<string>(getThreadId());
  const mapManagerRef = useRef<GoogleMapsManagerRef>(null);
  const [tools, setTools] = useState<DistriAnyTool[]>([]);

  // Get tools when map manager is ready
  const handleMapReady = useCallback((mapRef: GoogleMapsManagerRef) => {
    console.log('Map manager is ready, getting tools...');
    const mapTools = getTools(mapRef);
    console.log('Created tools array:', mapTools.map(t => t.name));
    setTools(mapTools);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-600">Loading Maps Assistant...</span>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-600">Loading Agent...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
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
          {!loading && agent && tools.length > 0 && (
            <EmbeddableChat
              agent={agent}
              tools={tools}
              theme="dark"
              threadId={selectedThreadId}
              showDebug={true}
            />
          )}
        </div>
      </div>
    </div>
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