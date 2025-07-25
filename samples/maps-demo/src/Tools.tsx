import { GoogleMapsManagerRef } from "./components/GoogleMapsManager";

export const getTools = (mapManagerRef: React.RefObject<GoogleMapsManagerRef>) => {
  return [
    {
      name: 'set_map_center',
      description: 'Set the center location of the Google Maps view',
      parameters: {
        type: 'object',
        properties: {
          latitude: { type: 'number', description: 'Latitude coordinate for the map center' },
          longitude: { type: 'number', description: 'Longitude coordinate for the map center' },
          zoom: { type: 'number', description: 'Zoom level (1-20)', minimum: 1, maximum: 20, default: 13 }
        },
        required: ['latitude', 'longitude']
      },
      handler: async (input: { latitude: number; longitude: number; zoom?: number }) => {
        return await mapManagerRef.current?.setMapCenter(input);
      }
    },

    {
      name: 'add_marker',
      description: 'Add a marker to the Google Maps at a specific location',
      parameters: {
        type: 'object',
        properties: {
          latitude: { type: 'number', description: 'Latitude coordinate for the marker' },
          longitude: { type: 'number', description: 'Longitude coordinate for the marker' },
          title: { type: 'string', description: 'Title/label for the marker' },
          description: { type: 'string', description: 'Optional description for the marker' }
        },
        required: ['latitude', 'longitude', 'title']
      },
      handler: async (input: { latitude: number; longitude: number; title: string; description?: string }) => {
        return await mapManagerRef.current?.addMarker(input);
      }
    },

    {
      name: 'get_directions',
      description: 'Get directions between two locations on Google Maps',
      parameters: {
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
      handler: async (input: { origin: string; destination: string; travel_mode?: string }) => {
        return await mapManagerRef.current?.getDirections(input);
      }
    },

    {
      name: 'search_places',
      description: 'Search for places near a location',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (e.g., "restaurants", "gas stations")' },
          latitude: { type: 'number', description: 'Latitude for the search center' },
          longitude: { type: 'number', description: 'Longitude for the search center' },
          radius: { type: 'number', description: 'Search radius in meters', default: 5000 }
        },
        required: ['query', 'latitude', 'longitude']
      },
      handler: async (input: { query: string; latitude: number; longitude: number; radius?: number }) => {
        return await mapManagerRef.current?.searchPlaces(input);
      }
    },

    {
      name: 'clear_map',
      description: 'Clear all markers and directions from the map',
      parameters: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        return await mapManagerRef.current?.clearMap();
      }
    }
  ];
}