import { useMemo, useEffect, useRef } from 'react';
import { DistriProvider, ChatContainer, useAgent, useTools, createTool } from '@distri/react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { APIProvider } from '@vis.gl/react-google-maps';
import GoogleMapsManager, { GoogleMapsManagerRef } from './components/GoogleMapsManager';

// Environment variables validation
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const DISTRI_API_URL = import.meta.env.VITE_DISTRI_API_URL || 'http://localhost:8080/api/v1';

function MapsChat() {
  const { agent, loading } = useAgent({ agentId: 'maps-navigator' });
  const mapManagerRef = useRef<GoogleMapsManagerRef>(null);
  const { addTools } = useTools({ agent });

  // Register Google Maps tools when agent and map manager are ready
  useEffect(() => {
    if (agent && mapManagerRef.current) {
      const mapTools = [
        createTool(
          'set_map_center',
          'Set the center location of the Google Maps view',
          {
            type: 'object',
            properties: {
              latitude: { type: 'number', description: 'Latitude coordinate for the map center' },
              longitude: { type: 'number', description: 'Longitude coordinate for the map center' },
              zoom: { type: 'number', description: 'Zoom level (1-20)', minimum: 1, maximum: 20, default: 13 }
            },
            required: ['latitude', 'longitude']
          },
          async (input: { latitude: number; longitude: number; zoom?: number }) => {
            return await mapManagerRef.current?.setMapCenter(input);
          }
        ),

        createTool(
          'add_marker',
          'Add a marker to the Google Maps at a specific location',
          {
            type: 'object',
            properties: {
              latitude: { type: 'number', description: 'Latitude coordinate for the marker' },
              longitude: { type: 'number', description: 'Longitude coordinate for the marker' },
              title: { type: 'string', description: 'Title/label for the marker' },
              description: { type: 'string', description: 'Optional description for the marker' }
            },
            required: ['latitude', 'longitude', 'title']
          },
          async (input: { latitude: number; longitude: number; title: string; description?: string }) => {
            return await mapManagerRef.current?.addMarker(input);
          }
        ),

        createTool(
          'get_directions',
          'Get directions between two locations on Google Maps',
          {
            type: 'object',
            properties: {
              origin: { type: 'string', description: 'Starting location (address or place name)' },
              destination: { type: 'string', description: 'Destination location (address or place name)' },
              travel_mode: { 
                type: 'string', 
                enum: ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'], 
                default: 'DRIVING',
                description: 'Mode of transportation' 
              }
            },
            required: ['origin', 'destination']
          },
          async (input: { origin: string; destination: string; travel_mode?: string }) => {
            return await mapManagerRef.current?.getDirections(input);
          }
        ),

        createTool(
          'search_places',
          'Search for places near a location',
          {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query (e.g., "restaurants", "gas stations")' },
              latitude: { type: 'number', description: 'Latitude for the search center' },
              longitude: { type: 'number', description: 'Longitude for the search center' },
              radius: { type: 'number', description: 'Search radius in meters', default: 5000 }
            },
            required: ['query', 'latitude', 'longitude']
          },
          async (input: { query: string; latitude: number; longitude: number; radius?: number }) => {
            return await mapManagerRef.current?.searchPlaces(input);
          }
        ),

        createTool(
          'clear_map',
          'Clear all markers and directions from the map',
          {
            type: 'object',
            properties: {}
          },
          async () => {
            return await mapManagerRef.current?.clearMap();
          }
        )
      ];

      addTools(mapTools);
    }
  }, [agent, addTools]);

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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Google Maps Panel */}
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-2 text-gray-700">
            <MapPin className="h-5 w-5" />
            <span className="font-medium">Interactive Map</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Powered by <a 
              href="https://visgl.github.io/react-google-maps/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              react-google-maps
            </a>
          </p>
        </div>
        <GoogleMapsManager 
          ref={mapManagerRef}
          defaultCenter={{ lat: 37.7749, lng: -122.4194 }} // San Francisco
          defaultZoom={13}
        />
      </div>

      {/* Chat Panel */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Navigation className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Maps Assistant</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Ask me about directions, locations, or places nearby!
          </p>
        </div>
        
        <div className="flex-1 min-h-0">
          {agent && (
            <ChatContainer
              agentId="maps-navigator"
              threadId="maps-session"
              agent={agent}
              variant="embedded"
              height="100%"
              placeholder="Ask about locations, directions, or nearby places..."
              theme="auto"
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