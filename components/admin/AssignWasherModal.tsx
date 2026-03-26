'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Navigation, User, CheckCircle2, Package, Search, Wrench, AlertTriangle } from 'lucide-react';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Utility function to format minutes as human-readable duration
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

interface Washer {
  id: string;
  name: string;
  service_area: string;
  distance_km: number;
  travel_time_minutes: number;
  estimated_arrival: string;
  estimated_delay_minutes: number;
  availability_note: string;  // Changed from availability_time
  is_available: boolean;
  minutes_until_free?: number | null;  // New: minutes until washer becomes free
  current_booking_status?: string | null;  // Status of the booking that's making them busy
  phone_number?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  status?: string;  // Current booking assignment status (ON_THE_WAY, etc.)
  location_name?: string;  // Human-readable location from reverse geocoding
}

interface BookingInfo {
  id: string;
  customer_name: string;
  location: string;
  booking_date: string;
  service_type: string;
  vehicle_type: string;
  team_size: number;
  status?: string;
  latitude?: number;
  longitude?: number;
}

interface AssignWasherModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onAssignmentComplete: () => void;
}

export default function AssignWasherModal({
  isOpen,
  onClose,
  bookingId,
  onAssignmentComplete,
}: AssignWasherModalProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [washers, setWashers] = useState<Washer[]>([]);
  const [selectedWasherIds, setSelectedWasherIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [searching, setSearching] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState<string>(''); // hours
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>(''); // minutes
  const [leafletReady, setLeafletReady] = useState(false);
  const L = useRef<any>(null);
  const [LeafletComponents, setLeafletComponents] = useState<any>(null);
  const [trackingLines, setTrackingLines] = useState<{ [washerId: string]: { lat: number; lng: number } }>({});
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showDelayWarning, setShowDelayWarning] = useState(false);
  const [delayedWashers, setDelayedWashers] = useState<Washer[]>([]);
  const [maxDelayMinutes, setMaxDelayMinutes] = useState<number>(0);
  const mapRef = useRef<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerPositions, setMarkerPositions] = useState<Map<string, [number, number]>>(new Map());

  // Load Leaflet on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('leaflet').then((leafletModule) => {
      L.current = leafletModule.default || leafletModule;
      delete (L.current.Icon.Default.prototype as any)._getIconUrl;
      L.current.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setLeafletReady(true);
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-leaflet').then((module) => {
        setLeafletComponents({
          MapContainer: module.MapContainer,
          TileLayer: module.TileLayer,
          Marker: module.Marker,
          Popup: module.Popup,
          Polyline: module.Polyline,
        });
      });
    }
  }, []);

  // Auto-fit map bounds to show all washers and booking location
  useEffect(() => {
    if (!mapInstance || !washers.length) return;

    const L = window.L;
    if (!L) return;

    // Collect all coordinates: booking location + washers with coords
    const allCoords: [number, number][] = [];

    if (booking?.latitude && booking?.longitude) {
      allCoords.push([booking.latitude, booking.longitude]);
    }

    washers
      .filter(washer => washer.latitude && washer.longitude)
      .forEach(washer => {
        allCoords.push([washer.latitude!, washer.longitude!]);
      });

    if (allCoords.length < 2) return; // Need at least 2 points to fit bounds

    // Create bounds and fit map
    const bounds = L.latLngBounds(allCoords);
    mapInstance.fitBounds(bounds, { padding: [20, 20], maxZoom: 8 });

  }, [washers, booking, mapInstance]);

  // Create custom icon using Leaflet
  const getCustomIcon = (washer: Washer, isSelected: boolean = false) => {
    if (!L.current) return null;
    const size = 32; // Keep all markers same size for better visibility

    // Determine color based on availability and selection
    let color: string;
    if (isSelected) {
      color = '#22c55e'; // Green for selected
    } else if (!washer.is_available) {
      color = '#f59e0b'; // Amber/Orange for busy washers
    } else {
      color = '#3b82f6'; // Blue for available washers
    }

    return L.current.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
    });
  };

  // Create a distinct icon for the booking location (red, same size as washers)
  const getBookingIcon = () => {
    if (!L.current) return null;
    return L.current.divIcon({
      className: 'booking-marker',
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
      zIndex: 1000,
    });
  };

  // Fetch suggested washers
  const fetchSuggestedWashers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSearching(true);

      const token = localStorage.getItem('access_token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

      const response = await fetch(
        `${apiBaseUrl}/bookings/${bookingId}/suggested-washers`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          cache: 'no-store', // Prevent caching to always get fresh washer data
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch washers');
      }

      const data = await response.json();
      setBooking(data.data.booking);
      setWashers(data.data.suggested_washers);
    } catch (err: any) {
      console.error('Error fetching suggested washers:', err);
      setError(err.message || 'Failed to load washers');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchSuggestedWashers();
      // Start polling for washer locations when modal opens
      startLocationPolling();
    }
    return () => {
      // Cleanup: stop polling when modal closes
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen, bookingId, fetchSuggestedWashers]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedWasherIds([]);
      setWashers([]);
      setBooking(null);
      setError(null);
      setSearching(false);
      setEstimatedHours('');
      setEstimatedMinutes('');
      setTrackingLines({});
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [isOpen]);

  // Calculate marker positions for washers to avoid overlap
  useEffect(() => {
    if (washers.length > 0) {
      const positions = calculateMarkerPositions(washers, booking);
      setMarkerPositions(positions);
    } else {
      setMarkerPositions(new Map());
    }
  }, [washers, booking]);

  // Poll for washer locations every 5 seconds
  const startLocationPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = async () => {
      try {
        // Fetch latest assignment data with washer coordinates
        const token = localStorage.getItem('access_token');
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

        const response = await fetch(
          `${apiBaseUrl}/bookings/${bookingId}/suggested-washers`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            cache: 'no-store', // Prevent caching to always get fresh washer data
          }
        );

        if (response.ok) {
          const data = await response.json();
          const washersData = data.data.suggested_washers || [];

          // Update washer data with latest coordinates
          setWashers(washersData);

          // Update tracking lines with latest washer positions (only for ON_THE_WAY status)
          const newTrackingLines: { [washerId: string]: { lat: number; lng: number } } = {};
          washersData.forEach((washer: any) => {
            // Check if washer is en route (status is ON_THE_WAY or current_booking_status is ON_THE_WAY)
            const isOnTheWay = washer.status === 'ON_THE_WAY' || washer.current_booking_status === 'ON_THE_WAY';
            if (isOnTheWay && washer.latitude && washer.longitude) {
              newTrackingLines[washer.id] = {
                lat: washer.latitude,
                lng: washer.longitude
              };
            }
          });

          setTrackingLines(newTrackingLines);
        }
      } catch (error) {
        console.error('Error polling washer locations:', error);
      }
    };

    // Initial poll
    poll();

    // Set up interval (every 5 seconds for smooth tracking)
    pollIntervalRef.current = setInterval(poll, 5000);
  };

  // Calculate offset positions for washers at similar/identical locations
  const calculateMarkerPositions = (washersList: Washer[], bookingLoc: BookingInfo | null): Map<string, [number, number]> => {
    const positions = new Map<string, [number, number]>();
    const radius = 0.00025; // ~27 meters - small cluster visible at most zoom levels
    const groups: Washer[][] = [];

    // Filter washers with valid coordinates
    const washersWithCoords = washersList.filter(w => w.latitude && w.longitude);

    // Group washers that are within ~50 meters of each other
    washersWithCoords.forEach(washer => {
      if (!washer.latitude || !washer.longitude) return;

      // Try to find an existing group this washer is close to
      let foundGroup: Washer[] | null = null;
      for (const group of groups) {
        const first = group[0];
        const distance = Math.sqrt(
          Math.pow(washer.latitude! - first.latitude!, 2) +
          Math.pow(washer.longitude! - first.longitude!, 2)
        );
        if (distance < radius) {
          foundGroup = group;
          break;
        }
      }

      if (foundGroup) {
        foundGroup.push(washer);
      } else {
        groups.push([washer]);
      }
    });

    // For each group, assign offset positions
    groups.forEach((group) => {
      if (group.length === 1) {
        // Single washer - use exact coordinates
        positions.set(group[0].id, [group[0].latitude!, group[0].longitude!]);
      } else {
        // Multiple washers at similar location - spread them out in a circle
        const baseLat = group[0].latitude!;
        const baseLon = group[0].longitude!;
        const total = group.length;
        const angleStep = (2 * Math.PI) / total;

        group.forEach((washer, index) => {
          const angle = index * angleStep;
          const offsetLat = baseLat + Math.sin(angle) * radius;
          const offsetLon = baseLon + Math.cos(angle) * radius;
          positions.set(washer.id, [offsetLat, offsetLon]);
        });
      }
    });

    return positions;
  };

  const handleWasherSelect = (washerId: string) => {
    setSelectedWasherIds(prev =>
      prev.includes(washerId)
        ? prev.filter(id => id !== washerId)
        : [...prev, washerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedWasherIds.length === washers.length) {
      setSelectedWasherIds([]);
    } else {
      setSelectedWasherIds(washers.map(w => w.id));
    }
  };

  const handleAssign = async () => {
    if (selectedWasherIds.length === 0) return;

    // Check if any selected washers are busy and calculate delays
    const selectedWashers = washers.filter(w => selectedWasherIds.includes(w.id));
    const busyWashers = selectedWashers.filter(w => !w.is_available && w.minutes_until_free && w.minutes_until_free > 0);

    if (busyWashers.length > 0 && booking) {
      // Calculate estimated delay for each busy washer
      // Delay = minutes_until_free + travel_time - (time until booking)
      const bookingTime = new Date(booking.booking_date);
      const now = new Date();
      const minutesUntilBooking = Math.max(0, Math.floor((bookingTime.getTime() - now.getTime()) / (1000 * 60)));

      const washersWithDelays = busyWashers.map(washer => {
        // If washer is busy, they can't depart until they're free
        const timeToDeparture = washer.minutes_until_free || 0;
        const travelTime = washer.travel_time_minutes || 0;
        // Total time needed = time until free + travel time
        const totalMinutesNeeded = timeToDeparture + travelTime;
        // Delay = total needed - time until booking (if booking is in future)
        const delay = totalMinutesNeeded > minutesUntilBooking ? totalMinutesNeeded - minutesUntilBooking : 0;

        return {
          washer,
          delay,
          totalNeeded: totalMinutesNeeded,
          minutesUntilBooking
        };
      });

      // Find max delay
      const maxDelay = Math.max(...washersWithDelays.map(w => w.delay));

      if (maxDelay > 0) {
        setDelayedWashers(busyWashers);
        setMaxDelayMinutes(maxDelay);
        setShowDelayWarning(true);
        return; // Wait for user confirmation
      }
    }

    // No delays or all washers available - proceed with assignment
    await confirmAssignment();
  };

  const confirmAssignment = async () => {
    try {
      setAssigning(true);
      const token = localStorage.getItem('access_token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

      // Calculate total minutes from hours and minutes
      const hours = estimatedHours === '' ? 0 : parseInt(estimatedHours);
      const minutes = estimatedMinutes === '' ? 0 : parseInt(estimatedMinutes);
      const totalMinutes = (hours * 60) + minutes;

      // Prepare request body
      const requestBody: any = { washer_ids: selectedWasherIds };
      if (totalMinutes > 0) {
        requestBody.estimated_duration_minutes = totalMinutes;
      }

      const response = await fetch(
        `${apiBaseUrl}/admin/bookings/${bookingId}/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to assign washers');
      }

      onAssignmentComplete();
      onClose();
    } catch (err: any) {
      console.error('Error assigning washers:', err);
      alert('Failed to assign washers. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const getMapCenter = (): [number, number] => {
    if (booking?.latitude && booking?.longitude) {
      return [booking.latitude, booking.longitude];
    }
    return [24.7136, 46.6753]; // Default to Riyadh
  };

  // Simple loading component
  const LoadingIndicator = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-lg font-medium text-gray-800">Loading washers...</p>
    </div>
  );

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          <div className="flex flex-col items-center justify-center h-[600px]">
            <LoadingIndicator />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl p-6">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription className="sr-only">Error loading washers</DialogDescription>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <Search className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Error Loading Washers</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <Button
              onClick={fetchSuggestedWashers}
              className="bg-red-600 hover:bg-red-700 text-white px-8"
            >
              Try Again
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('booking.assignWasher')}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {booking.team_size > 1
                ? t('booking.requiredWashers', { count: booking.team_size })
                : t('booking.requiredWasher')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Map */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100 shadow-lg"
            >
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Washer Locations</h3>
                {booking.latitude && booking.longitude && (
                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                    GPS Active
                  </Badge>
                )}
              </div>

              <div className="rounded-xl overflow-hidden shadow-inner" style={{ height: '450px' }}>
                {leafletReady && LeafletComponents ? (
                  <LeafletComponents.MapContainer
                    center={getMapCenter()}
                    zoom={11}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                    whenCreated={(map: any) => {
                      mapRef.current = map;
                      setMapInstance(map);
                    }}
                  >
                    <LeafletComponents.TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />

                    {/* Booking location marker */}
                    {booking.latitude && booking.longitude && (
                      <LeafletComponents.Marker
                        position={[booking.latitude, booking.longitude]}
                        icon={getBookingIcon()}
                        zIndexOffset={1000}
                      >
                        <LeafletComponents.Popup className="rounded-lg shadow-lg">
                          <div className="text-center p-1">
                            <strong className="text-red-700">📍 Booking Location</strong>
                            <p className="text-sm text-gray-600 mt-1 font-semibold">{booking.location || 'Unknown'}</p>
                          </div>
                        </LeafletComponents.Popup>
                      </LeafletComponents.Marker>
                    )}

                    {/* Tracking polylines for washers en route (ON_THE_WAY) */}
                    {booking.latitude && booking.longitude && LeafletComponents?.Polyline && (
                      <>
                        {Object.entries(trackingLines).map(([washerId, washerLocation]) => (
                          <LeafletComponents.Polyline
                            key={`tracking-${washerId}`}
                            positions={[
                              [booking.latitude, booking.longitude],
                              [washerLocation.lat, washerLocation.lng]
                            ]}
                            color="#3b82f6"
                            weight={3}
                            dashArray="5, 10"
                            opacity={0.7}
                          />
                        ))}
                      </>
                    )}

                    {/* Washer markers - only show washers with location enabled */}
                    {washers
                      .filter(washer => washer.latitude && washer.longitude)
                      .map((washer, index) => {
                        const isSelected = selectedWasherIds.includes(washer.id);
                        const icon = getCustomIcon(washer, isSelected);
                        if (!icon) return null;

                        // Get offset position from calculated positions (handles both booking overlap AND washer-washer overlap)
                        const computedPosition = markerPositions.get(washer.id);
                        const position: [number, number] = computedPosition
                          ? [computedPosition[0], computedPosition[1]]
                          : [washer.latitude!, washer.longitude!];

                        return (
                          <motion.div
                            key={washer.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                          >
                            <LeafletComponents.Marker
                              position={position}
                              icon={icon}
                              eventHandlers={{
                                click: () => handleWasherSelect(washer.id),
                              }}
                            >
                              <LeafletComponents.Popup className="rounded-lg shadow-lg">
                                <div className="text-center p-2 min-w-[160px]">
                                  <strong className="text-lg text-blue-700">{washer.name}</strong>
                                  <div className="mt-2 space-y-1 text-sm">
                                    <div className="flex items-center justify-center gap-1 text-gray-700">
                                      <Navigation className="w-3 h-3" />
                                      <span>{washer.distance_km.toFixed(1)} km away</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1 text-gray-700">
                                      <Clock className="w-3 h-3" />
                                      <span>ETA: {new Date(washer.estimated_arrival).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}</span>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Badge className="mt-2 bg-green-100 text-green-700 border-0">
                                      ✓ Selected
                                    </Badge>
                                  )}
                                </div>
                              </LeafletComponents.Popup>
                            </LeafletComponents.Marker>
                          </motion.div>
                        );
                      })}
                  </LeafletComponents.MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Map legend */}
              <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Booking</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Selected</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Washer List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* Booking Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-blue-100 rounded-xl p-5 shadow-sm"
              >
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" /> Booking Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block mb-1">Customer</span>
                    <span className="font-semibold text-gray-900">{booking.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Service</span>
                    <span className="font-semibold text-gray-900">{booking.service_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </span>
                    <span className="font-semibold text-gray-900">{booking.location || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Time
                    </span>
                    <span className="font-semibold text-gray-900">
                      {new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {' '}
                      {new Date(booking.booking_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Washers List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-blue-600" /> Available Washers
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={washers.length === 0}
                    className="text-sm h-8 px-3"
                  >
                    {selectedWasherIds.length === washers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                {washers.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500 italic">
                    No washers available near this location
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2">
                    {washers.map((washer, index) => (
                      <motion.div
                        key={washer.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedWasherIds.includes(washer.id)
                            ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md'
                            : washer.latitude && washer.longitude
                              ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                        onClick={() => washer.latitude && washer.longitude && handleWasherSelect(washer.id)}
                      >
                        <div className="flex items-start gap-3">
                          <motion.div
                            animate={{ rotate: selectedWasherIds.includes(washer.id) ? [0, 10, -10, 0] : 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-1"
                          >
                            <input
                              type="checkbox"
                              checked={selectedWasherIds.includes(washer.id)}
                              onChange={() => {}}
                              disabled={!washer.latitude || !washer.longitude}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                            />
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <p className="font-semibold text-gray-900 truncate">{washer.name}</p>
                                {index === 0 && washer.latitude && washer.longitude && (
                                  <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs border-0">
                                    {t('booking.nearest')}
                                  </Badge>
                                )}
                                {!washer.latitude || !washer.longitude ? (
                                  <Badge variant="outline" className="border-red-300 text-red-600 text-xs">
                                    OFFLINE
                                  </Badge>
                                ) : null}
                              </div>
                              {selectedWasherIds.includes(washer.id) && (
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              )}
                            </div>

                            {/* Location */}
                            <div className="mb-2">
                              {/* Removed city name display per user request */}
                              {('location_name' in washer) && washer.location_name && (
                                <p className="text-sm font-medium text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded break-words">
                                  {washer.location_name}
                                </p>
                              )}
                              {'location_name' in washer && !washer.location_name && washer.latitude && washer.longitude && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  ({washer.latitude.toFixed(4)}, {washer.longitude.toFixed(4)})
                                </p>
                              )}
                            </div>

                            {/* Availability Status */}
                            {washer.is_available ? (
                              <Badge className="mb-2 bg-green-100 text-green-700 border-0 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                {t('booking.available')}
                              </Badge>
                            ) : (
                              <div className="flex flex-col gap-1 mb-2">
                                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs self-start">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {t('booking.currentlyOnJob')}
                                </Badge>
                                {washer.current_booking_status && (
                                  <Badge variant="secondary" className="text-xs self-start">
                                    {t('booking.currentJob')}: {t(`washerStatus.${washer.current_booking_status}`)}
                                  </Badge>
                                )}
                                {washer.minutes_until_free !== undefined &&
                                 washer.minutes_until_free !== null &&
                                 washer.minutes_until_free > 0 && (
                                  <Badge variant="outline" className="text-xs self-start border-gray-300 text-gray-600">
                                    {formatDuration(washer.minutes_until_free)} {t('booking.minutesUntilFree')}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {washer.latitude && washer.longitude ? (
                              <div className="flex items-center gap-3 text-xs flex-wrap">
                                <Badge variant="outline" className="flex items-center gap-1 border-blue-200 text-blue-700">
                                  <Navigation className="w-3 h-3" />
                                  {washer.distance_km.toFixed(1)} km
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1 border-purple-200 text-purple-700">
                                  <Clock className="w-3 h-3" />
                                  {t('booking.eta')}: {new Date(washer.estimated_arrival).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </Badge>
                                {washer.estimated_delay_minutes > 0 && (
                                  <Badge className="bg-amber-100 text-amber-700 border-0">
                                    +{formatDuration(washer.estimated_delay_minutes)}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 italic">
                                {t('booking.locationNotEnabled')}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 pt-4 border-t border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm text-gray-600">
                  {washers.length} washer{washers.length !== 1 ? 's' : ''} found nearby
                </span>
              </div>
              <div>
                {selectedWasherIds.length === booking.team_size ? (
                  <Badge className="bg-green-100 text-green-700 px-3 py-1">
                    ✓ Ready to assign ({selectedWasherIds.length}/{booking.team_size})
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 px-3 py-1">
                    Select {booking.team_size - selectedWasherIds.length} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Estimated Duration Input */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Estimated Service Duration (optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Specify how long the service is expected to take. Washers will see this as a deadline.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          placeholder="Hours"
                          value={estimatedHours}
                          onChange={(e) => setEstimatedHours(e.target.value)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <span className="text-sm text-gray-600">hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="Minutes"
                          value={estimatedMinutes}
                          onChange={(e) => setEstimatedMinutes(e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <span className="text-sm text-gray-600">minutes</span>
                      </div>
                    </div>
                    {(estimatedHours || estimatedMinutes) && (
                      <p className="text-xs text-gray-500 mt-2">
                        Washers will have <strong>{`${estimatedHours || '0'}h ${estimatedMinutes || '0'}m`}</strong> from assignment to complete the service.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={assigning}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={selectedWasherIds.length !== booking.team_size || assigning}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigning ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                  ) : (
                    'Assign Selected Washer(s)'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </DialogContent>

      {/* Delay Warning Modal */}
      <AnimatePresence>
        {showDelayWarning && (
          <Dialog open={showDelayWarning} onOpenChange={setShowDelayWarning}>
            <DialogContent className="max-w-md p-0 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-gradient-to-br from-amber-50 to-orange-50"
              >
                <DialogHeader className="p-6 pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <DialogTitle className="text-xl text-gray-900">Potential Delay Detected</DialogTitle>
                  </div>
                  <DialogDescription className="text-sm text-gray-600">
                    The following washer(s) are currently busy and may arrive late to the booking.
                  </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4">
                  <div className="space-y-3 mb-4">
                    {delayedWashers.map(washer => {
                      const bookingTime = new Date(booking.booking_date);
                      const now = new Date();
                      const minutesUntilBooking = Math.max(0, Math.floor((bookingTime.getTime() - now.getTime()) / (1000 * 60)));
                      const timeToDeparture = washer.minutes_until_free || 0;
                      const travelTime = washer.travel_time_minutes || 0;
                      const totalNeeded = timeToDeparture + travelTime;
                      const delay = totalNeeded > minutesUntilBooking ? totalNeeded - minutesUntilBooking : 0;

                      return (
                        <div key={washer.id} className="bg-white rounded-lg p-3 border border-amber-200 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-900">{washer.name}</p>
                              <p className="text-xs text-gray-500">{washer.service_area}</p>
                            </div>
                            <Badge variant="outline" className="border-amber-300 text-amber-700">
                              {formatDuration(delay)} delay
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Free in:</span>
                              <span className="font-medium">{formatDuration(timeToDeparture)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Travel time:</span>
                              <span className="font-medium">{formatDuration(travelTime)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total needed:</span>
                              <span className="font-medium">{formatDuration(totalNeeded)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Until booking:</span>
                              <span className="font-medium">{formatDuration(minutesUntilBooking)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-900">Summary</p>
                        <p className="text-amber-800 mt-1">
                          The selected washer(s) will arrive <strong>{formatDuration(maxDelayMinutes)} late</strong> if assigned now.
                          Do you still want to proceed with this assignment?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 p-6 pt-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowDelayWarning(false)}
                    className="flex-1 border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDelayWarning(false);
                      confirmAssignment();
                    }}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    Assign Anyway
                  </Button>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
