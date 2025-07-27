import React, { useImperativeHandle, forwardRef, useState, useCallback, useRef, useEffect } from 'react';
import {
  Map,
  MapProps,
  Marker,
  InfoWindow,
  useMap,
  useMapsLibrary,
  useApiIsLoaded
} from '@vis.gl/react-google-maps';

interface MapMarker {
  id: string;
  position: google.maps.LatLngLiteral;
  title: string;
  description?: string;
}

export interface GoogleMapsManagerRef {
  setMapCenter: (params: { latitude: number; longitude: number; zoom?: number }) => Promise<{ success: boolean; message: string }>;
  addMarker: (params: { latitude: number; longitude: number; title: string; description?: string }) => Promise<{ success: boolean; message: string; markerId: string }>;
  getDirections: (params: { origin: string; destination: string; travel_mode?: string }) => Promise<{ success: boolean; message: string; directions?: any }>;
  searchPlaces: (params: { query: string; latitude: number; longitude: number; radius?: number }) => Promise<{ success: boolean; message: string; places?: any[] }>;
  clearMap: () => Promise<{ success: boolean; message: string }>;
}

interface MapControllerProps {
  mapRef: React.MutableRefObject<GoogleMapsManagerRef | null>;
  markers: MapMarker[];
  setMarkers: React.Dispatch<React.SetStateAction<MapMarker[]>>;
  directionsRenderer: google.maps.DirectionsRenderer | null;
  setDirectionsRenderer: React.Dispatch<React.SetStateAction<google.maps.DirectionsRenderer | null>>;
  center: google.maps.LatLngLiteral;
  setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

// Separate component to handle map interactions
const MapController: React.FC<MapControllerProps> = ({
  mapRef,
  markers: _markers, // Used for marker state management
  setMarkers,
  directionsRenderer,
  setDirectionsRenderer,
  center: _center, // Used for map center state
  setCenter,
  zoom,
  setZoom,
}) => {
  const map = useMap();
  const placesLibrary = useMapsLibrary('places');
  const directionsLibrary = useMapsLibrary('routes');

  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);

  useEffect(() => {
    if (!placesLibrary || !map) return;

    // when placesLibrary is loaded, the library can be accessed via the
    // placesLibrary API object
    setPlacesService(new placesLibrary.PlacesService(map));
  }, [placesLibrary, map]);

  useEffect(() => {
    if (!directionsLibrary || !map) return;

    setDirectionsService(new directionsLibrary.DirectionsService());
  }, [directionsLibrary, map]);

  const setMapCenter = useCallback(async (params: { latitude: number; longitude: number; zoom?: number }) => {
    try {
      const newCenter = { lat: params.latitude, lng: params.longitude };
      const newZoom = params.zoom ?? zoom;

      setCenter(newCenter);
      setZoom(newZoom);

      if (map) {
        map.setCenter(newCenter);
        map.setZoom(newZoom);
      }

      return {
        success: true,
        message: `Map centered at ${params.latitude}, ${params.longitude} with zoom ${newZoom}`
      };
    } catch (error) {
      console.error('Error setting map center:', error);
      return {
        success: false,
        message: `Failed to set map center: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, [map, zoom, setCenter, setZoom]);

  const addMarker = useCallback(async (params: { latitude: number; longitude: number; title: string; description?: string }) => {
    try {
      const markerId = `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newMarker: MapMarker = {
        id: markerId,
        position: { lat: params.latitude, lng: params.longitude },
        title: params.title,
        description: params.description
      };

      setMarkers(prev => [...prev, newMarker]);

      return {
        success: true,
        message: `Added marker "${params.title}" at ${params.latitude}, ${params.longitude}`,
        markerId
      };
    } catch (error) {
      console.error('Error adding marker:', error);
      return {
        success: false,
        message: `Failed to add marker: ${error instanceof Error ? error.message : 'Unknown error'}`,
        markerId: ''
      };
    }
  }, [setMarkers]);

  const getDirections = useCallback(async (params: { origin: string; destination: string; travel_mode?: string }) => {
    try {
      if (!directionsService) {
        return {
          success: false,
          message: 'Directions service not available'
        };
      }

      const travelMode = (params.travel_mode as google.maps.TravelMode) || google.maps.TravelMode.DRIVING;

      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(
          {
            origin: params.origin,
            destination: params.destination,
            travelMode: travelMode,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          }
        );
      });

      // Clear existing directions
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }

      // Create new directions renderer
      const newRenderer = new google.maps.DirectionsRenderer();
      newRenderer.setMap(map);
      newRenderer.setDirections(result);
      setDirectionsRenderer(newRenderer);

      const route = result.routes[0];
      const leg = route.legs[0];

      return {
        success: true,
        message: `Directions from ${leg.start_address} to ${leg.end_address}: ${leg.distance?.text}, ${leg.duration?.text}`,
        directions: {
          distance: leg.distance?.text,
          duration: leg.duration?.text,
          start_address: leg.start_address,
          end_address: leg.end_address
        }
      };
    } catch (error) {
      console.error('Error getting directions:', error);
      return {
        success: false,
        message: `Failed to get directions: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, [directionsLibrary, map, directionsRenderer, setDirectionsRenderer]);

  const searchPlaces = useCallback(async (params: { query: string; latitude: number; longitude: number; radius?: number }) => {
    try {
      if (!placesService) {
        return {
          success: false,
          message: 'Places service not available'
        };
      }
      const request = {
        location: { lat: params.latitude, lng: params.longitude },
        radius: params.radius || 5000,
        keyword: params.query
      };

      const results = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
        placesService.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        });
      });

      // Add markers for found places
      const placeMarkers: MapMarker[] = results.slice(0, 10).map((place, index) => ({
        id: `place-${Date.now()}-${index}`,
        position: {
          lat: place.geometry?.location?.lat() || params.latitude,
          lng: place.geometry?.location?.lng() || params.longitude
        },
        title: place.name || 'Unknown Place',
        description: `${place.vicinity || ''} • Rating: ${place.rating || 'N/A'}`
      }));

      setMarkers(prev => [...prev, ...placeMarkers]);

      const placesInfo = results.slice(0, 5).map(place => ({
        name: place.name,
        address: place.vicinity,
        rating: place.rating,
        priceLevel: place.price_level
      }));

      return {
        success: true,
        message: `Found ${results.length} places for "${params.query}". Added ${placeMarkers.length} markers.`,
        places: placesInfo
      };
    } catch (error) {
      console.error('Error searching places:', error);
      return {
        success: false,
        message: `Failed to search places: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, [placesLibrary, map, setMarkers]);

  const clearMap = useCallback(async () => {
    try {
      setMarkers([]);

      if (directionsRenderer) {
        directionsRenderer.setMap(null);
        setDirectionsRenderer(null);
      }

      return {
        success: true,
        message: 'Map cleared successfully'
      };
    } catch (error) {
      console.error('Error clearing map:', error);
      return {
        success: false,
        message: `Failed to clear map: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, [setMarkers, directionsRenderer, setDirectionsRenderer]);

  // Expose methods via ref and notify when ready
  useEffect(() => {
    if (map) {
      console.log('Map is available, setting up ref');
      mapRef.current = {
        setMapCenter,
        addMarker,
        getDirections,
        searchPlaces,
        clearMap
      };
      console.log('mapRef.current set:', mapRef.current);
    }
  }, [map]); // Only depend on map availability

  return null; // This component doesn't render anything
};

export interface GoogleMapsManagerProps {
  className?: string;
  defaultCenter?: google.maps.LatLngLiteral;
  defaultZoom?: number;
  onReady?: (mapRef: GoogleMapsManagerRef) => void;
}

const GoogleMapsManager = forwardRef<GoogleMapsManagerRef, GoogleMapsManagerProps>(
  ({ className = '', defaultCenter = { lat: 37.7749, lng: -122.4194 }, defaultZoom = 13, onReady }, ref) => {
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
    const [center, setCenter] = useState<google.maps.LatLngLiteral>(defaultCenter);
    const [zoom, setZoom] = useState<number>(defaultZoom);
    const mapRef = useRef<GoogleMapsManagerRef | null>(null);
    const apiIsLoaded = useApiIsLoaded();

    // Expose the ref to parent
    useImperativeHandle(ref, () => {
      if (!mapRef.current) {
        console.warn('Map ref not ready yet');
        return {} as GoogleMapsManagerRef;
      }
      return mapRef.current;
    });

    // Call onReady when mapRef is available
    useEffect(() => {
      if (mapRef.current && onReady) {
        console.log('Map manager ready, calling onReady');
        onReady(mapRef.current);
      }
    }, [mapRef.current, onReady]);

    if (!apiIsLoaded) {
      return (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600">Loading Google Maps...</p>
          </div>
        </div>
      );
    }

    const mapProps: MapProps = {
      center,
      zoom,
      className: `w-full h-full ${className}`,
      mapId: 'distri-maps-demo', // Optional: for styling with Google Maps Platform
      gestureHandling: 'cooperative',
      disableDefaultUI: false,
      clickableIcons: true,
    };

    return (
      <Map {...mapProps}>
        <MapController
          mapRef={mapRef}
          markers={markers}
          setMarkers={setMarkers}
          directionsRenderer={directionsRenderer}
          setDirectionsRenderer={setDirectionsRenderer}
          center={center}
          setCenter={setCenter}
          zoom={zoom}
          setZoom={setZoom}
        />

        {/* Render markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            title={marker.title}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}

        {/* Info window for selected marker */}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2">
              <h3 className="font-semibold text-gray-900">{selectedMarker.title}</h3>
              {selectedMarker.description && (
                <p className="text-sm text-gray-600 mt-1">{selectedMarker.description}</p>
              )}
            </div>
          </InfoWindow>
        )}
      </Map>
    );
  }
);

GoogleMapsManager.displayName = 'GoogleMapsManager';

export default GoogleMapsManager;