'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api-client';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

interface WasherTracking {
  washer_id: string;
  full_name: string;
  phone_number?: string;
  profile_picture?: string;
  latitude: number;
  longitude: number;
  status: string;
  assigned_at?: string;
  confirmed_at?: string;
  estimated_duration_minutes?: number;
  deadline?: string;
  time_remaining_minutes?: number;
}

interface BookingLocation {
  id: string;
  location: string;
  latitude?: number;
  longitude?: number;
  service_type: string;
  status?: string;
}

interface TrackingData {
  booking: BookingLocation;
  washers: WasherTracking[];
}

interface BookingTrackingMapProps {
  bookingId: string;
  className?: string;
}

const BookingTrackingMap = ({ bookingId, className = '' }: BookingTrackingMapProps) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [leafletReady, setLeafletReady] = useState(false);
  const [LeafletComponents, setLeafletComponents] = useState<any>(null);
  const [routePaths, setRoutePaths] = useState<{ [key: string]: [number, number][] }>({});
  const [routeLoading, setRouteLoading] = useState<{ [washerId: string]: boolean }>({});
  const [routeProgress, setRouteProgress] = useState<{ [washerId: string]: number }>({});
  const wsRef = useRef<WebSocket | null>(null);
  const trackingDataRef = useRef<TrackingData | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    trackingDataRef.current = trackingData;
  }, [trackingData]);

  // Load Leaflet on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('leaflet').then((leafletModule) => {
      // Fix marker icons
      const L = leafletModule.default || leafletModule;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });

    import('react-leaflet').then((module) => {
      setLeafletComponents({
        MapContainer: module.MapContainer,
        TileLayer: module.TileLayer,
        Marker: module.Marker,
        Popup: module.Popup,
        Polyline: module.Polyline,
      });
      setLeafletReady(true);
    });
  }, []);

  // Fetch tracking data via REST (initial load)
  const fetchTrackingData = useCallback(async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}/tracking`);

      if (response.status === 404) {
        setError('Booking not found');
        return;
      }

      const data = response.data;
      if (data.status === 'success') {
        setTrackingData(data.data);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err: any) {
      console.error('Error fetching tracking data:', err);
      setError(err.message || 'Failed to load tracking data');
      if (err.response?.status === 401) {
        console.log('[fetchTrackingData] Auth error, redirecting to login');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // WebSocket connection for real-time tracking
  const connectWebSocket = useCallback(() => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.log('[BookingTrackingMap] No token, redirecting to login');
      window.location.href = '/login';
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    const wsBaseUrl = apiBaseUrl.replace('http', 'ws');
    const wsUrl = `${wsBaseUrl}/ws/tracking?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected for tracking');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'initial') {
          // Initial data load from WebSocket
          const data = message.data;
          if (bookingId && data.length > 0) {
            // Filter washers for this booking
            const bookingWashers = data.filter((item: any) => item.booking_id === bookingId);
            const washers = bookingWashers.map((item: any) => ({
              washer_id: item.washer_id,
              full_name: item.full_name,
              phone_number: item.phone_number,
              profile_picture: item.profile_picture,
              latitude: item.current_latitude,
              longitude: item.current_longitude,
              status: item.status,
              assigned_at: new Date().toISOString(),
              confirmed_at: new Date().toISOString(),
              estimated_duration_minutes: 60,
              deadline: item.last_updated,
              time_remaining_minutes: 60,
            }));

            if (washers.length > 0) {
              const bookingLocation: BookingLocation = {
                id: bookingId,
                location: bookingWashers[0].booking_location || 'Unknown',
                latitude: bookingWashers[0].booking_latitude,
                longitude: bookingWashers[0].booking_longitude,
                service_type: 'Car Wash',
                status: bookingWashers[0].booking_status || 'ON_THE_WAY',
              };
              setTrackingData({ washers, booking: bookingLocation });
              setLastUpdated(new Date());
              setError(null);
            }
          }
        } else if (message.type === 'location_update') {
          // Real-time location update
          if (message.booking_id === bookingId) {
            const currentTrackingData = trackingDataRef.current;
            if (currentTrackingData) {
              const updatedWashers = currentTrackingData.washers.map(washer => {
                if (washer.washer_id === message.washer_id) {
                  return {
                    ...washer,
                    latitude: message.current_latitude,
                    longitude: message.current_longitude,
                    status: message.status,
                    deadline: message.last_updated,
                  };
                }
                return washer;
              });
              setTrackingData(prev => prev ? { ...prev, washers: updatedWashers } : prev);
              setLastUpdated(new Date());
            }
          }
        } else if (message.type === 'status_update') {
          // Real-time status change update
          if (message.booking_id === bookingId) {
            const currentTrackingData = trackingDataRef.current;
            if (currentTrackingData) {
              const updatedWashers = currentTrackingData.washers.map(washer => {
                if (washer.washer_id === message.washer_id) {
                  return {
                    ...washer,
                    status: message.status,
                    deadline: message.last_updated,
                  };
                }
                return washer;
              });
              setTrackingData(prev => prev ? { ...prev, washers: updatedWashers } : prev);
              setLastUpdated(new Date());
            }
          }
        } else if (message.type === 'pong') {
          // Keepalive
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      console.error('WebSocket readyState:', ws.readyState);
      console.error('WebSocket url:', ws.url);
      setError('WebSocket connection error. Some features may be limited.');
    };

    ws.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      // Reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    };

    return ws;
  }, [bookingId]);

  // Start WebSocket connection
  useEffect(() => {
    if (bookingId) {
      fetchTrackingData(); // Initial fetch via REST
      const ws = connectWebSocket();

      return () => {
        ws.close();
      };
    }
  }, [bookingId, fetchTrackingData, connectWebSocket]);

  // Fetch road routes from OSRM via backend proxy for ON_THE_WAY washers (curved path)
  useEffect(() => {
    if (!trackingData || !trackingData.washers.length) return;

    const fetchRoutes = async () => {
      for (const washer of trackingData.washers) {
        if (
          washer.latitude &&
          washer.longitude &&
          trackingData.booking.latitude &&
          trackingData.booking.longitude &&
          washer.status.toUpperCase() === 'ON_THE_WAY'
        ) {
          const cacheKey = `${washer.latitude},${washer.longitude},${trackingData.booking.latitude},${trackingData.booking.longitude}`;

          // Skip if already cached
          if (routePaths[cacheKey]) continue;

          setRouteLoading(prev => ({ ...prev, [washer.washer_id]: true }));

          try {
            // Use backend proxy to avoid CORS
            const token = localStorage.getItem('access_token');
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
            const url = `${apiBaseUrl}/osrm-route?lat1=${washer.latitude}&lon1=${washer.longitude}&lat2=${trackingData.booking.latitude}&lon2=${trackingData.booking.longitude}`;

            const response = await fetch(url, {
              headers: {
                'Authorization': token ? `Bearer ${token}` : ''
              }
            });
            const data = await response.json();

            if (data.status === 'success' && data.data?.routes?.length > 0) {
              let coords: [number, number][] = data.data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

              // Ensure the route includes exact endpoints
              const startPoint: [number, number] = [washer.latitude, washer.longitude];
              const endPoint: [number, number] = [trackingData.booking.latitude!, trackingData.booking.longitude!];

              // Prepend start if needed
              if (coords.length > 0) {
                const first = coords[0];
                const distStart = Math.sqrt(Math.pow(first[0] - startPoint[0], 2) + Math.pow(first[1] - startPoint[1], 2));
                if (distStart > 0.0005) {
                  coords = [startPoint, ...coords];
                }
              }

              // Append end if needed
              if (coords.length > 0) {
                const last = coords[coords.length - 1];
                const distEnd = Math.sqrt(Math.pow(last[0] - endPoint[0], 2) + Math.pow(last[1] - endPoint[1], 2));
                if (distEnd > 0.0005) {
                  coords = [...coords, endPoint];
                }
              }

              setRoutePaths(prev => ({ ...prev, [cacheKey]: coords }));
            } else {
              console.warn('Route fetch failed:', data);
            }
          } catch (err) {
            console.error('Failed to fetch route:', err);
          } finally {
            setRouteLoading(prev => ({ ...prev, [washer.washer_id]: false }));
          }
        }
      }
    };

    fetchRoutes();
  }, [trackingData, routePaths]);

  // Calculate route progress - how far along the route is the washer
  const calculateRouteProgress = (
    washerLat: number,
    washerLon: number,
    routeCoords: [number, number][],
    destinationLat: number,
    destinationLon: number
  ): number => {
    if (!routeCoords || routeCoords.length < 2) return 0;

    // Calculate distance from washer to start of route
    const distToStart = Math.sqrt(
      Math.pow(washerLat - routeCoords[0][0], 2) +
      Math.pow(washerLon - routeCoords[0][1], 2)
    );

    // Calculate total route distance
    let totalDistance = 0;
    for (let i = 0; i < routeCoords.length - 1; i++) {
      totalDistance += Math.sqrt(
        Math.pow(routeCoords[i + 1][0] - routeCoords[i][0], 2) +
        Math.pow(routeCoords[i + 1][1] - routeCoords[i][1], 2)
      );
    }

    // Add distance from end of route to destination
    totalDistance += Math.sqrt(
      Math.pow(destinationLat - routeCoords[routeCoords.length - 1][0], 2) +
      Math.pow(destinationLon - routeCoords[routeCoords.length - 1][1], 2)
    );

    // Calculate progress (0-100)
    if (totalDistance === 0) return 100;
    return Math.min(100, Math.max(0, (totalDistance - distToStart) / totalDistance * 100));
  };

  // Update progress when tracking data or routes change
  useEffect(() => {
    if (!trackingData || !trackingData.washers.length) return;

    const newProgress: { [washerId: string]: number } = {};
    for (const washer of trackingData.washers) {
      if (washer.status.toUpperCase() === 'ON_THE_WAY') {
        const cacheKey = `${washer.latitude},${washer.longitude},${trackingData.booking.latitude},${trackingData.booking.longitude}`;
        const route = routePaths[cacheKey];

        if (route) {
          newProgress[washer.washer_id] = calculateRouteProgress(
            washer.latitude,
            washer.longitude,
            route,
            trackingData.booking.latitude!,
            trackingData.booking.longitude!
          );
        }
      }
    }
    setRouteProgress(newProgress);
  }, [trackingData, routePaths]);

  // Custom icons
  const getDestinationIcon = () => {
    if (!L) return undefined;
    return L.divIcon({
      className: 'destination-marker',
      html: `<div style="
        background-color: #ef4444;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
      "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  const getWasherIcon = (status: string) => {
    if (!L) return undefined;

    let color: string;
    switch (status.toUpperCase()) {
      case 'ON_THE_WAY':
        color = '#22c55e'; // Green
        break;
      case 'IN_PROGRESS':
        color = '#3b82f6'; // Blue
        break;
      case 'TEAM_FORMED':
      case 'ACCEPTED':
      case 'CONFIRMED':
        color = '#eab308'; // Yellow
        break;
      default:
        color = '#6b7280'; // Gray
    }

    return L.divIcon({
      className: 'washer-marker',
      html: `<div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      "></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });
  };

  const getMapCenter = (): [number, number] => {
    if (trackingData?.booking.latitude && trackingData.booking.longitude) {
      return [trackingData.booking.latitude, trackingData.booking.longitude];
    }
    // Default to Riyadh
    return [24.7136, 46.6753];
  };

  const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading live tracking...</p>
      </div>
    </div>
  );

  const ErrorMessage = () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center p-4">
        <p className="text-red-600 mb-2">{error}</p>
        <button
          onClick={fetchTrackingData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const NoTrackingMessage = () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center p-4">
        <p className="text-gray-500">Live tracking not available for this booking</p>
        <p className="text-sm text-gray-400 mt-1">
          Tracking is available for assigned, accepted, team_formed, on_the_way, and start_service statuses
        </p>
      </div>
    </div>
  );

  if (!leafletReady || !LeafletComponents) {
    return (
      <div className={`h-[400px] w-full rounded-lg overflow-hidden border ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  // If booking doesn't have tracking-capable status, show message
  if (trackingData && !['ASSIGNED', 'ACCEPTED', 'TEAM_FORMED', 'ON_THE_WAY', 'START_SERVICE', 'IN_PROGRESS'].includes((trackingData.booking.status || '').toUpperCase())) {
    return (
      <div className={`h-[400px] w-full rounded-lg overflow-hidden border ${className}`}>
        <NoTrackingMessage />
      </div>
    );
  }

  return (
    <div className={`h-[400px] w-full rounded-lg overflow-hidden border ${className}`}>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage />
      ) : trackingData ? (
        <MapContainer
          center={getMapCenter()}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Destination marker - Booking location */}
          {trackingData.booking.latitude && trackingData.booking.longitude && (
            <Marker
              position={[trackingData.booking.latitude, trackingData.booking.longitude]}
              icon={getDestinationIcon()}
              zIndexOffset={1000}
            >
              <Popup className="rounded-lg shadow-lg">
                <div className="text-center p-2">
                  <strong className="text-red-700 text-sm">📍 Destination</strong>
                  <p className="text-xs text-gray-600 mt-1 font-semibold">
                    {trackingData.booking.location || 'Unknown location'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {trackingData.booking.service_type}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route lines from washers to destination - ONLY for ON_THE_WAY status */}
          {trackingData.booking.latitude && trackingData.booking.longitude && (
            trackingData.washers
              .filter(washer => washer.latitude && washer.longitude && washer.status.toUpperCase() === 'ON_THE_WAY')
              .map((washer) => {
                const cacheKey = `${washer.latitude},${washer.longitude},${trackingData.booking.latitude},${trackingData.booking.longitude}`;
                const route = routePaths[cacheKey];
                const progress = routeProgress[washer.washer_id] || 0;

                // Calculate completed portion of route for animation
                let completedRoute: [number, number][] = [];
                if (route && progress > 0) {
                  const progressFraction = progress / 100;
                  let distanceCovered = 0;
                  let totalDistance = 0;

                  // Calculate total distance
                  for (let i = 0; i < route.length - 1; i++) {
                    totalDistance += Math.sqrt(
                      Math.pow(route[i + 1][0] - route[i][0], 2) +
                      Math.pow(route[i + 1][1] - route[i][1], 2)
                    );
                  }

                  // Find the point that represents current progress
                  const targetDistance = totalDistance * progressFraction;
                  distanceCovered = 0;

                  for (let i = 0; i < route.length; i++) {
                    completedRoute.push(route[i]);
                    if (i < route.length - 1) {
                      const segmentDistance = Math.sqrt(
                        Math.pow(route[i + 1][0] - route[i][0], 2) +
                        Math.pow(route[i + 1][1] - route[i][1], 2)
                      );
                      if (distanceCovered + segmentDistance >= targetDistance) {
                        // Interpolate the final point
                        const remaining = targetDistance - distanceCovered;
                        const fraction = remaining / segmentDistance;
                        completedRoute.push([
                          route[i][0] + (route[i + 1][0] - route[i][0]) * fraction,
                          route[i][1] + (route[i + 1][1] - route[i][1]) * fraction,
                        ]);
                        break;
                      }
                      distanceCovered += segmentDistance;
                    }
                  }
                }

                return (
                  <div key={`route-${washer.washer_id}`}>
                    {/* Full route in light blue background */}
                    <LeafletComponents.Polyline
                      positions={route || [
                        [trackingData.booking.latitude!, trackingData.booking.longitude!],
                        [washer.latitude, washer.longitude]
                      ]}
                      color="#e0e7ff"
                      weight={6}
                      opacity={0.4}
                      lineCap="round"
                      lineJoin="round"
                    />

                    {/* Animated progress line overlay */}
                    {completedRoute.length > 1 && (
                      <LeafletComponents.Polyline
                        positions={completedRoute}
                        color="#10b981"
                        weight={6}
                        opacity={1}
                        lineCap="round"
                        lineJoin="round"
                        dashArray="5, 5"
                      />
                    )}

                    {/* Full route outline for better visibility */}
                    <LeafletComponents.Polyline
                      positions={route || [
                        [trackingData.booking.latitude!, trackingData.booking.longitude!],
                        [washer.latitude, washer.longitude]
                      ]}
                      color="#3b82f6"
                      weight={2}
                      opacity={0.6}
                      lineCap="round"
                      lineJoin="round"
                    />
                  </div>
                );
              })
          )}

          {/* Washer markers */}
          {trackingData.washers
            .filter(washer => washer.latitude && washer.longitude)
            .map((washer) => {
              const icon = getWasherIcon(washer.status);
              if (!icon) return null;

              return (
                <LeafletComponents.Marker
                  key={washer.washer_id}
                  position={[washer.latitude, washer.longitude]}
                  icon={icon}
                >
                  <LeafletComponents.Popup className="rounded-lg shadow-lg">
                    <div className="text-center p-2 min-w-[160px]">
                      <strong className="text-base text-blue-700">{washer.full_name}</strong>
                      {/* Progress bar for ON_THE_WAY status */}
                      {washer.status.toUpperCase() === 'ON_THE_WAY' && (
                        <div className="mt-2 mb-1">
                          <div className="text-xs text-gray-600 mb-1">
                            {Math.round(routeProgress[washer.washer_id] || 0)}% to destination
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                              initial={{ width: '0%' }}
                              animate={{ width: `${routeProgress[washer.washer_id] || 0}%` }}
                              transition={{ duration: 0.5, ease: 'easeInOut' }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="mt-2 space-y-1.5 text-xs">
                        <div className="flex items-center justify-center gap-1 text-gray-700">
                          <span className="font-medium">Status:</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            washer.status.toUpperCase() === 'ON_THE_WAY' ? 'bg-green-100 text-green-700' :
                            washer.status.toUpperCase() === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            washer.status.toUpperCase() === 'TEAM_FORMED' || washer.status.toUpperCase() === 'ACCEPTED' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {washer.status.replace('_', ' ')}
                          </span>
                        </div>
                        {washer.phone_number && (
                          <div className="flex items-center justify-center gap-1 text-gray-600">
                            <span className="text-xs">📞</span>
                            <span>{washer.phone_number}</span>
                          </div>
                        )}
                        {washer.estimated_duration_minutes && (
                          <div className="border-t pt-1.5 mt-1.5">
                            <div className="flex items-center justify-center gap-1 text-gray-700">
                              <span className="font-medium">⏱️ Est. Duration:</span>
                              <span>{washer.estimated_duration_minutes} min</span>
                            </div>
                            {washer.deadline && (
                              <div className="flex items-center justify-center gap-1 text-gray-600 mt-0.5">
                                <span className="font-medium">📅 Deadline:</span>
                                <span>{new Date(washer.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                            )}
                            {washer.time_remaining_minutes !== null && washer.time_remaining_minutes !== undefined && (
                              <div className={`flex items-center justify-center gap-1 mt-1 ${
                                washer.time_remaining_minutes <= 0 ? 'text-red-600 font-medium' :
                                washer.time_remaining_minutes < 30 ? 'text-orange-600' :
                                'text-gray-600'
                              }`}>
                                <span>⏳</span>
                                <span>
                                  {washer.time_remaining_minutes > 0
                                    ? `${washer.time_remaining_minutes} min remaining`
                                    : '⏰ Deadline passed!'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </LeafletComponents.Popup>
                </LeafletComponents.Marker>
              );
            })}
        </MapContainer>
      ) : null}

      {/* Last update indicator */}
      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs text-gray-600 shadow z-[1000]">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default BookingTrackingMap;
