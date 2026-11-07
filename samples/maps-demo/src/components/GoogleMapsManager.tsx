import React, { useImperativeHandle, forwardRef, useState, useCallback, useRef, useEffect } from 'react';
import {
  Map,
  MapProps,
  Marker,
  InfoWindow,
  useMap,
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
  center: google.maps.LatLngLiteral;
  setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onReady?: (mapRef: GoogleMapsManagerRef) => void;
}

// Separate component to handle map interactions
const MapController: React.FC<MapControllerProps> = ({
  mapRef,
  markers: _markers, // Used for marker state management
  setMarkers,
  center: _center, // Used for map center state
  setCenter,
  zoom,
  setZoom,
  onReady,
}) => {
  const map = useMap();
  // The route is drawn as a polyline. Kept in a ref because the functions below are exposed once,
  // when the map appears, and must still see the latest line.
  const routeLine = useRef<google.maps.Polyline | null>(null);

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
      // Routes API: Route.computeRoutes replaces the deprecated DirectionsService.
      const { Route } = (await google.maps.importLibrary('routes')) as google.maps.RoutesLibrary;
      const { routes } = await Route.computeRoutes({
        origin: params.origin,
        destination: params.destination,
        travelMode: ((params.travel_mode || 'DRIVING').toUpperCase() as google.maps.TravelMode),
        fields: ['path', 'distanceMeters', 'durationMillis', 'localizedValues', 'legs'],
      });
      const route = routes?.[0];
      if (!route?.path) throw new Error('No route found');

      routeLine.current?.setMap(null);
      routeLine.current = new google.maps.Polyline({ path: route.path, strokeColor: '#2563eb', strokeWeight: 5, map: map ?? undefined });
      const bounds = new google.maps.LatLngBounds();
      route.path.forEach((point) => bounds.extend(point));
      map?.fitBounds(bounds);

      const distance = route.localizedValues?.distance ?? `${route.distanceMeters} m`;
      const duration = route.localizedValues?.duration ?? `${Math.round((route.durationMillis ?? 0) / 60000)} min`;
      return {
        success: true,
        message: `Directions from ${params.origin} to ${params.destination}: ${distance}, ${duration}`,
        directions: {
          distance,
          duration,
          start_address: params.origin,
          end_address: params.destination
        }
      };
    } catch (error) {
      console.error('Error getting directions:', error);
      return {
        success: false,
        message: `Failed to get directions: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, [map]);

  const searchPlaces = useCallback(async (params: { query: string; latitude: number; longitude: number; radius?: number }) => {
    try {
      // Places API (New): Place.searchByText replaces the deprecated PlacesService.nearbySearch.
      const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;
      const { places } = await Place.searchByText({
        textQuery: params.query,
        fields: ['displayName', 'location', 'formattedAddress', 'rating'],
        locationBias: { center: { lat: params.latitude, lng: params.longitude }, radius: params.radius || 5000 },
        maxResultCount: 10,
      });

      const placeMarkers: MapMarker[] = places.flatMap((place, index) => place.location ? [{
        id: `place-${Date.now()}-${index}`,
        position: { lat: place.location.lat(), lng: place.location.lng() },
        title: place.displayName || 'Unknown Place',
        description: `${place.formattedAddress || ''} • Rating: ${place.rating ?? 'N/A'}`
      }] : []);

      setMarkers(prev => [...prev, ...placeMarkers]);

      return {
        success: true,
        message: `Found ${places.length} places for "${params.query}". Added ${placeMarkers.length} markers.`,
        places: places.slice(0, 5).map(place => ({
          name: place.displayName,
          address: place.formattedAddress,
          rating: place.rating,
          latitude: place.location?.lat(),
          longitude: place.location?.lng()
        }))
      };
    } catch (error) {
      console.error('Error searching places:', error);
      return {
        success: false,
        message: `Failed to search places: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, [setMarkers]);

  const clearMap = useCallback(async () => {
    try {
      setMarkers([]);

      routeLine.current?.setMap(null);
      routeLine.current = null;

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
  }, [setMarkers]);

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
      onReady?.(mapRef.current);
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
          center={center}
          setCenter={setCenter}
          zoom={zoom}
          setZoom={setZoom}
          onReady={onReady}
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