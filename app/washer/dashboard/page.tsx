'use client';

import { useState, useEffect, useRef } from 'react';
import type { Booking } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import api from '@/lib/api-client';

// Define additional types needed for the dashboard
interface TeamDetails {
  id: string;
  team_size: number;
  current_count: number;
  team_members: string[];
  status: string;
}

interface Availability {
  isOnline: boolean;
  lastUpdated?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

// Define ExtendedBooking interface with explicit properties for clarity
interface ExtendedBooking {
  id: string;
  customer_id: string;
  washer_id: string | null;
  service_type: string;
  vehicle_type: string;
  status: string;
  booking_date: string;
  assigned_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_phone?: string;
  booking_time?: string;
  location?: string;
  selected_services_text?: string;
  required_washers?: number;
  assigned_washers?: string[];
  team_size?: number;
  car_details: string;
  // Extended fields for time tracking
  estimated_duration_minutes?: number;
  extended_minutes?: number;
  deadline?: string;
  time_remaining_minutes?: number;
  has_pending_extension?: boolean;
}
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUser, FaPhone, FaCar, FaExclamationTriangle, FaUserFriends, FaBars, FaLocationArrow, FaCheck } from 'react-icons/fa';

// Import the API functions
import { WasherService } from '@/services/washerService';
import { useWasherAuth } from '@/hooks/useWasherAuth';
import { useBookingWebSocket } from '@/hooks/useBookingWebSocket';
import { LocationThrottler } from '@/utils/location-throttler';
import { isNative, checkPermissions, requestPermissions, getCurrentPosition } from '@/lib/capacitor-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const WasherDashboard = () => {
  const [joinedBookings, setJoinedBookings] = useState<ExtendedBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('joined');
  const [teamDetails, setTeamDetails] = useState<Record<string, TeamDetails>>({});
  const [availability, setAvailability] = useState<Availability>({isOnline: false});
  const [locationPermission, setLocationPermission] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showExtensionModal, setShowExtensionModal] = useState<boolean>(false);
  const [selectedBookingForExtension, setSelectedBookingForExtension] = useState<ExtendedBooking | null>(null);
  const [extensionMinutes, setExtensionMinutes] = useState<string>('');
  const [extensionReason, setExtensionReason] = useState<string>('');
  const [submittingExtension, setSubmittingExtension] = useState<boolean>(false);
  const [extensionRequests, setExtensionRequests] = useState<any[]>([]);
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTrackingActiveRef = useRef<boolean>(false);
  const locationThrottlerRef = useRef<LocationThrottler | null>(null); // Throttler instance

  const { user, isAuthenticated, isLoading } = useWasherAuth();
  const { toast } = useToast();

  // Auto-request location permission when washer logs in
  useEffect(() => {
    console.log('[Location] useEffect triggered:', { isAuthenticated, userRole: user?.role, isLoading });
    if (isAuthenticated && user?.role === 'WASHER' && !isLoading) {
      console.log('[Location] Requesting permission...');
      requestLocationPermission();
    }
  }, [isAuthenticated, user?.role, isLoading]);

  // WebSocket for real-time booking updates with 60s fallback polling
  const { isConnected: wsConnected, useFallback, triggerRefresh } = useBookingWebSocket({
    enabled: isAuthenticated,
    refreshOnConnect: true, // Triggers refresh on WebSocket connect (with 5s dedup)
    onBookingUpdate: (booking) => {
      console.log('[Dashboard] Booking updated via WebSocket:', booking.id);
      // Update the booking in the local state
      setJoinedBookings(prev => prev.map(b => b.id === booking.id ? { ...b, ...booking } : b));
    },
    onBookingCreated: (booking) => {
      console.log('[Dashboard] New booking created via WebSocket:', booking.id);
      // Refresh to get the new booking
      fetchBookings(true);
    },
    fallbackPollInterval: 60000, // 60 seconds fallback
  });

  // Listen for fallback poll events
  useEffect(() => {
    const handleFallbackPoll = () => {
      console.log('[Dashboard] Fallback poll triggered');
      fetchBookings(true);
    };

    window.addEventListener('booking-fallback-poll', handleFallbackPoll);
    return () => window.removeEventListener('booking-fallback-poll', handleFallbackPoll);
  }, []);

  useEffect(() => {
    console.log('[Dashboard] useEffect isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      console.log('[Dashboard] Authenticated, starting services');
      // Fetch bookings from the API
      fetchBookings();
      // Fetch current availability status
      fetchAvailability();
      // Request location permission when washer logs in
      requestLocationPermission();

      // NOTE: No more 10s polling - WebSocket handles real-time updates
      // Fallback polling (60s) is handled by useBookingWebSocket hook

      return () => {
        console.log('[Dashboard] Cleanup: WebSocket cleanup handled by hook');
      };
    }

    // Cleanup on unmount: stop location tracking
    return () => {
      console.log('[Dashboard] Cleanup: stopping location tracking (unmount or logout)');
      stopLocationTracking();
    };
  }, [isAuthenticated]);

  // Timer interval - updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        joinedBookings.forEach(booking => {
          // Check if this booking has an active timer (in seconds)
          if (updated[booking.id] !== undefined && updated[booking.id] > 0) {
            updated[booking.id] = updated[booking.id]! - 1;
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [joinedBookings]);

  const requestLocationPermission = async () => {
    console.log('[Location] requestLocationPermission called');
    if (typeof window === 'undefined') {
      console.log('[Location] window is undefined');
      return;
    }

    setLocationPermission('loading');

    try {
      console.log('[Location] Checking if native...');
      // Check if running in native app
      if (isNative()) {
        console.log('[Location] Running in native app');
        // Use Capacitor to request location permissions
        const { location } = await checkPermissions();
        console.log('[Location] Current permission:', location);
        
        if (location === 'granted') {
          console.log('[Location] Permission already granted');
          // Already granted, get position
          const position = await getCurrentPosition();
          if (position) {
            const { latitude, longitude, accuracy } = position.coords;
            setCurrentLocation({ latitude, longitude, accuracy, timestamp: position.timestamp });
            setLocationPermission('granted');
            
            // Save location to profile
            try {
              await WasherService.updateWasherProfile({ latitude, longitude });
              console.log('[Location] Location saved successfully');
              toast({
                title: 'Location Enabled',
                description: 'Your location is now being shared with admins.',
                variant: 'default',
              });
            } catch (error) {
              console.error('[Location] Error saving location:', error);
            }
          }
        } else if (location === 'denied') {
          console.log('[Location] Permission denied, requesting again...');
          // Permission denied, show system settings dialog
          setLocationPermission('denied');
          setLocationError('Location permission denied. Please enable it in device settings.');
          toast({
            title: 'Location Required',
            description: 'Please enable location in your device settings to receive bookings.',
            variant: 'destructive',
            duration: 10000,
          });
          // Try to request again to open system settings
          await requestPermissions();
          console.log('[Location] Request permissions called after denied');
        } else {
          console.log('[Location] Permission is prompt, requesting...');
          // 'prompt' - request permission
          await requestPermissions();
          const { location: newLocation } = await checkPermissions();
          console.log('[Location] New permission status:', newLocation);
          
          if (newLocation === 'granted') {
            const position = await getCurrentPosition();
            if (position) {
              const { latitude, longitude, accuracy } = position.coords;
              setCurrentLocation({ latitude, longitude, accuracy, timestamp: position.timestamp });
              setLocationPermission('granted');
              
              try {
                await WasherService.updateWasherProfile({ latitude, longitude });
                console.log('[Location] Location saved successfully');
                toast({
                  title: 'Location Enabled',
                  description: 'Your location is now being shared with admins.',
                  variant: 'default',
                });
              } catch (error) {
                console.error('[Location] Error saving location:', error);
              }
            }
          } else {
            setLocationPermission('denied');
            setLocationError('Location permission denied');
            toast({
              title: 'Location Required',
              description: 'Please enable location to receive bookings.',
              variant: 'destructive',
              duration: 10000,
            });
          }
        }
      } else {
        console.log('[Location] Running in browser');
        // Browser - use geolocation API
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              console.log('[Location] Browser position obtained:', position.coords);
              const { latitude, longitude, accuracy } = position.coords;
              setCurrentLocation({ latitude, longitude, accuracy, timestamp: position.timestamp });
              setLocationPermission('granted');
              
              try {
                await WasherService.updateWasherProfile({ latitude, longitude });
                console.log('[Location] Location saved successfully');
                toast({
                  title: 'Location Enabled',
                  description: 'Your location is now being shared with admins.',
                  variant: 'default',
                });
              } catch (error) {
                console.error('[Location] Error saving location:', error);
              }
            },
            (error) => {
              console.error('[Location] Browser geolocation error:', error);
              setLocationPermission('denied');
              setLocationError(error.message || 'Location permission denied');
              toast({
                title: 'Location Required',
                description: 'Please enable location in your browser to receive bookings.',
                variant: 'destructive',
                duration: 10000,
              });
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        } else {
          console.log('[Location] Geolocation not supported in browser');
          setLocationPermission('denied');
          setLocationError('Geolocation not supported');
        }
      }
    } catch (error) {
      console.error('[Location] Permission error:', error);
      setLocationPermission('denied');
      setLocationError('Unable to access location');
      toast({
        title: 'Location Error',
        description: 'Unable to access your location. Please check your device settings.',
        variant: 'destructive',
        duration: 10000,
      });
    }
  };

  // Start real-time location updates via WebSocket with throttling
  const startLocationTracking = () => {
    console.log('[Location Tracking] Starting location tracking with throttling');
    const token = localStorage.getItem('access_token');
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    const wsUrl = token ? `${apiBaseUrl.replace('http', 'ws')}/ws/washer?token=${token}` : `${apiBaseUrl.replace('http', 'ws')}/ws/washer`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[Location Tracking] WebSocket connected');
      wsRef.current = ws;
      isTrackingActiveRef.current = true;

      // Initialize throttler (3s min interval, 10m min distance)
      if (!locationThrottlerRef.current) {
        locationThrottlerRef.current = new LocationThrottler({
          minIntervalMs: 3000,      // Send at most once every 3 seconds
          minDistanceMeters: 10,    // Only send if moved >10 meters
          onSendUpdate: (location) => {
            // This callback sends the location via WebSocket
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              const message = JSON.stringify({
                type: 'location_update',
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy
              });
              console.log(`[LocationThrottler] Sending: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)} (accuracy: ${location.accuracy?.toFixed(0) || 'N/A'}m)`);
              wsRef.current.send(message);
            } else {
              console.warn('[LocationThrottler] WebSocket not open, cannot send');
            }
          }
        });
      }

      // Get location every 1 second (high frequency for accuracy)
      // Throttler will filter and only send when needed
      locationIntervalRef.current = setInterval(() => {
        if (!isTrackingActiveRef.current) {
          console.log('[Location Tracking] Interval fired but tracking inactive, skipping');
          return;
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!isTrackingActiveRef.current) {
                console.log('[Location Tracking] Got position but tracking inactive, not processing');
                return;
              }

              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
              };

              // Pass to throttler - it decides whether to send
              locationThrottlerRef.current?.processLocation(location);
            },
            (error) => {
              console.error('Error getting location:', error);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );
        } else {
          console.error('Geolocation is not supported by this browser');
        }
      }, 1000); // Check every 1 second, but throttler controls actual sends
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.error('Location update error:', data.error);
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      wsRef.current = null;
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  };

  const stopLocationTracking = () => {
    console.log('[Location Tracking] Stopping location tracking (logout or unmount)');
    isTrackingActiveRef.current = false;

    // Cleanup throttler first (may have pending send)
    if (locationThrottlerRef.current) {
      console.log('[Location Tracking] Flushing pending location update');
      locationThrottlerRef.current.forceSend(); // Send any pending update
      locationThrottlerRef.current.cleanup();
      locationThrottlerRef.current = null;
    }

    if (wsRef.current) {
      console.log('[Location Tracking] Closing WebSocket connection');
      wsRef.current.close();
      wsRef.current = null;
    } else {
      console.log('[Location Tracking] WebSocket already closed');
    }

    if (locationIntervalRef.current) {
      console.log('[Location Tracking] Clearing location interval');
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    } else {
      console.log('[Location Tracking] Interval already cleared');
    }
  };

  const fetchAvailability = async () => {
    try {
      // Since we don't have a direct API to get availability, we'll use the profile API
      // which includes availability information
      const response = await WasherService.getWasherProfile();
      const profileData = response.data;

      // Set the availability based on the profile data
      if (profileData.availability_status) {
        setAvailability({
          isOnline: profileData.availability_status.includes('online') || profileData.availability_status === 'available'
        });
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      // Default to offline if there's an error
      setAvailability({ isOnline: false });
    }
  };

  const fetchBookings = async (silent = false) => {
    try {
      // Guard: if not authenticated, don't fetch
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('fetchBookings: No token available, skipping fetch');
        if (!silent) setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      // Get assignments with deadline and time tracking from new endpoint
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

      const response = await fetch(
        `${apiBaseUrl}/washer/assignments/me`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        }
      );

      // Handle unauthorized/forbidden - token may be invalid or expired
      if (response.status === 401 || response.status === 403) {
        console.log(`fetchBookings: Auth error (${response.status}), clearing auth and stopping`);
        // Clear localStorage and let useWasherAuth detect the change
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_type');
        // Dispatch storage event to notify same-tab listeners
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'access_token',
            oldValue: token,
            newValue: null,
            url: window.location.href,
            storageArea: localStorage,
          })
        );
        if (!silent) setLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const assignments = data.data || [];

        // Debug: Show what we received
        console.log('Assignments API response:', {
          total: assignments.length,
          data: assignments
        });

        // Transform assignments into ExtendedBooking format
        const assignedBookings: ExtendedBooking[] = assignments.map((assignment: any) => ({
          ...assignment.booking,
          // Use the booking's status, not the assignment status
          status: assignment.booking?.status || assignment.status,
          assigned_at: assignment.assigned_at,
          estimated_duration_minutes: assignment.estimated_duration_minutes,
          extended_minutes: assignment.extended_minutes,
          deadline: assignment.deadline,
          time_remaining_minutes: assignment.time_remaining_minutes,
          has_pending_extension: assignment.has_pending_extension,
        }));

        // Update state with fetched bookings
        setJoinedBookings(assignedBookings);

        // Set active timers for countdown (convert minutes to seconds)
        // Active countdown for: TEAM_FORMED, ON_THE_WAY, IN_PROGRESS
        // Gray static display for: ASSIGNED, ACCEPTED (no active timer)
        const timers: Record<string, number> = {};
        assignedBookings.forEach((booking) => {
          if (booking.time_remaining_minutes !== null && booking.time_remaining_minutes >= 0) {
            const status = booking.status as string;
            if (status === 'TEAM_FORMED' || status === 'ON_THE_WAY' || status === 'IN_PROGRESS') {
              timers[booking.id] = booking.time_remaining_minutes * 60; // Convert to seconds
            }
          }
        });
        setActiveTimers(timers);

        // Update team details
        if (assignedBookings.length > 0) {
          const details: Record<string, TeamDetails> = {};
          assignedBookings.forEach((booking) => {
            details[booking.id] = {
              id: booking.id,
              team_size: booking.team_size || 1,
              current_count: 1, // simplified for now
              team_members: [],
              status: booking.status
            };
          });
          setTeamDetails(details);
        }
      } else {
        console.error('Failed to fetch assignments');
        if (!silent) {
          toast({
            title: "Error",
            description: "Failed to fetch assignments. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to fetch bookings. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleLeaveBooking = async (bookingId: string) => {
    toast({
      title: "Info",
      description: "Self-unassignment is disabled. Only admin can unassign jobs from washers.",
    });
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await WasherService.updateBookingStatus(bookingId, newStatus);
      // Success notification
      const message = newStatus === 'CONFIRMED' ? 'Booking accepted successfully!' : `Booking status updated to ${newStatus}`;
      toast({
        title: "Success",
        description: message,
      });
      fetchBookings(); // Refresh the booking lists
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAvailability = async () => {
    try {
      const newAvailability = !availability.isOnline;
      const availabilityData = {
        is_online: newAvailability,
        reason: newAvailability ? 'Available now' : 'Going offline'
      };

      await WasherService.updateWasherAvailability(availabilityData);
      setAvailability({ isOnline: newAvailability, lastUpdated: new Date().toISOString() });

      if (newAvailability) {
        // Going online - start real-time location tracking
        startLocationTracking();
      } else {
        // Going offline - stop tracking
        stopLocationTracking();
      }

      // Refresh bookings to reflect any changes
      fetchBookings();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitExtension = async () => {
    if (!selectedBookingForExtension || !extensionMinutes) return;

    try {
      setSubmittingExtension(true);

      const response = await api.post('/washer/extension-request', {
        booking_id: selectedBookingForExtension.id,
        requested_minutes: parseInt(extensionMinutes),
        reason: extensionReason
      });

      // Reset modal and refresh data
      setShowExtensionModal(false);
      setSelectedBookingForExtension(null);
      setExtensionMinutes('');
      setExtensionReason('');
      toast({
        title: "Success",
        description: "Extension request submitted successfully!",
      });

      // Refresh bookings to show pending status
      fetchBookings();

    } catch (err: any) {
      console.error('Error submitting extension:', err);
      toast({
        title: "Error",
        description: `Failed: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setSubmittingExtension(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto"></div>
          <p className="mt-4 text-primary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    // We don't redirect here since the useWasherAuth hook handles it automatically
    return null;
  }

  // Show all bookings regardless of location permission
  // Location is only needed for admin to see washer on map, not for viewing assignments
  const filteredBookings = joinedBookings;

  // Main return statement
  return (
    <>
      <div className="space-y-6 p-2 sm:p-4">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-2">
            {/* Hamburger menu button to control the sidebar */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => {
                // We need to somehow trigger the layout's toggleSidebar function
                // Since we can't directly access it, we'll use a workaround
                // by triggering a custom event that the layout can listen to
                window.dispatchEvent(new CustomEvent('toggleWasherSidebar'));
              }}
              aria-label="Toggle menu"
            >
              <FaBars className="h-5 w-5" />
            </Button>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <Link href="/washer/dashboard" className="text-emerald-600 font-semibold">Dashboard</Link>
            <Link href="/washer/profile" className="text-gray-600 hover:text-gray-900 transition-colors">Profile</Link>
            <Link href="/washer/earnings" className="text-gray-600 hover:text-gray-900 transition-colors">Earnings</Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={handleUpdateAvailability}
              className={`px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-white rounded-md min-w-[80px] ${
                availability.isOnline
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {availability.isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Location Permission Notice */}
        {locationPermission === 'denied' && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <FaMapMarkerAlt className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800 mb-2">📍 Enable Your Location</h3>
                <p className="text-red-700 font-medium mb-3">
                  To receive job assignments, you must enable location sharing on your device.
                </p>
                <p className="text-red-600 text-sm mb-4">
                  Your location helps admins find you and assign nearby jobs. Without location enabled, you won't be visible for assignments.
                </p>
                <div className="bg-red-100 border border-red-300 rounded p-3 text-sm text-red-700 mb-4">
                  <strong>Browser Prompt:</strong> When you clicked "Enable Location", your browser showed a permission request. Please click "Allow" or "Share" to enable location sharing.
                </div>
                <Button
                  onClick={requestLocationPermission}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2"
                >
                  🔄 Retry / Enable Location
                </Button>
                <p className="text-xs text-red-600 mt-2">
                  After enabling location in your browser settings, click the button above to retry.
                </p>
              </div>
            </div>
          </div>
        )}

        {locationPermission === 'granted' && currentLocation && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-800">
                <FaCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Location enabled - your position is visible to admins</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold leading-6 text-gray-900">
              Service Dashboard
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Manage your available service jobs and team assignments
            </p>
          </div>
        </div>

        {/* Tab Navigation - Only Active Jobs since available jobs are disabled */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('joined')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'joined'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Jobs
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {filteredBookings.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Only show Active Jobs content since Available Jobs is removed */}
        {activeTab === 'joined' && (
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <h3 className="text-lg font-medium text-gray-900">Active Service Jobs</h3>
            </div>

            {/* Show filtered bookings */}
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No bookings assigned
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  You have not been assigned any bookings yet. Please wait for admin to assign jobs.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking: ExtendedBooking) => {
                  const teamInfo: TeamDetails = teamDetails[booking.id] || {
                    id: booking.id, // Add missing id field
                    team_size: booking.required_washers || 1, // Add default value
                    current_count: booking.assigned_washers?.length || 0,
                    team_members: booking.assigned_washers || [],
                    status: booking.status
                  };

                  return (
                    <div key={booking.id} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{booking.service_type}</h4>
                            <div className="flex items-center mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                booking.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'PENDING' ? 'bg-gray-100 text-gray-800' :
                                booking.status === 'TEAM_FORMED' ? 'bg-green-100 text-green-800' :
                                booking.status === 'ON_THE_WAY' ? 'bg-blue-100 text-blue-800' :
                                booking.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-800' :
                                booking.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {booking.status.replace('_', ' ')}
                              </span>
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                <FaUserFriends className="mr-1" />
                                {teamInfo.current_count}/{teamInfo.team_size} members
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {(booking.status === 'PENDING' || booking.status === 'JOINING') && (
                              <button
                                onClick={() => handleLeaveBooking(booking.id)}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Leave
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <FaUser className="mr-2 flex-shrink-0 text-gray-400" />
                              <span>{booking.customer_name}</span>
                            </div>

                            {booking.customer_phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <FaPhone className="mr-2 flex-shrink-0 text-gray-400" />
                                <span>{booking.customer_phone}</span>
                              </div>
                            )}

                            <div className="flex items-center text-sm text-gray-600">
                              <FaCar className="mr-2 flex-shrink-0 text-gray-400" />
                              <span>{booking.vehicle_type}</span>
                            </div>

                            <div className="flex items-center text-sm text-gray-600">
                              <FaCalendar className="mr-2 flex-shrink-0 text-gray-400" />
                              <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                            </div>

                            {booking.booking_time && (
                              <div className="flex items-center text-sm text-gray-600">
                                <FaClock className="mr-2 flex-shrink-0 text-gray-400" />
                                <span>{booking.booking_time}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            {booking.location && (
                              <div className="flex items-center text-sm text-gray-600">
                                <FaMapMarkerAlt className="mr-2 flex-shrink-0 text-gray-400" />
                                <span>{booking.location}</span>
                              </div>
                            )}

                            {booking.selected_services_text && (
                              <div className="flex items-center text-sm text-gray-600">
                                <FaCar className="mr-2 flex-shrink-0 text-gray-400" />
                                <span>Services: {booking.selected_services_text}</span>
                              </div>
                            )}

                            <div className="text-lg font-bold text-emerald-600">PKR {booking.total_amount}</div>

                            <div className="mt-3">
                              {booking.status === 'ASSIGNED' && (
                                <button
                                  onClick={() => handleUpdateStatus(booking.id, 'ACCEPTED')}
                                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                >
                                  Accept Booking
                                </button>
                              )}

                              {(booking.status === 'ACCEPTED' || booking.status === 'TEAM_FORMED') && (
                                <button
                                  onClick={() => handleUpdateStatus(booking.id, 'ON_THE_WAY')}
                                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  On the Way
                                </button>
                              )}

                              {booking.status === 'ON_THE_WAY' && (
                                <button
                                  onClick={() => handleUpdateStatus(booking.id, 'IN_PROGRESS')}
                                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                >
                                  Start Service
                                </button>
                              )}

                              {booking.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  Complete Service
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Time Tracking Section */}
                        {(booking.status === 'ASSIGNED' ||
                         booking.status === 'ACCEPTED' ||
                         booking.status === 'TEAM_FORMED' ||
                         booking.status === 'ON_THE_WAY' ||
                         booking.status === 'IN_PROGRESS') && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">⏱️ Service Time Remaining</h5>
                            <div className="flex items-center justify-between">
                              <div className={`text-lg font-bold ${
                                booking.status === 'ASSIGNED' || booking.status === 'ACCEPTED' || booking.status === 'TEAM_FORMED'
                                  ? 'text-gray-400' // Gray for ASSIGNED/ACCEPTED/TEAM_FORMED (not started)
                                  : activeTimers[booking.id] !== undefined && activeTimers[booking.id] <= 600
                                  ? 'text-red-600 animate-pulse'
                                  : activeTimers[booking.id] !== undefined && activeTimers[booking.id] <= 1800
                                  ? 'text-orange-600'
                                  : 'text-green-600'
                              }`}>
                                {booking.status === 'ASSIGNED' || booking.status === 'ACCEPTED' || booking.status === 'TEAM_FORMED'
                                  ? // For ASSIGNED/CONFIRMED/TEAM_FORMED, show total estimated duration without countdown
                                    booking.estimated_duration_minutes
                                      ? `${Math.floor(booking.estimated_duration_minutes / 60)}h ${booking.estimated_duration_minutes % 60}m (total)`
                                      : 'No duration set'
                                  : activeTimers[booking.id] !== undefined && activeTimers[booking.id] > 0
                                  ? (() => {
                                      const totalSeconds = activeTimers[booking.id] || 0;
                                      const hours = Math.floor(totalSeconds / 3600);
                                      const minutes = Math.floor((totalSeconds % 3600) / 60);
                                      const seconds = totalSeconds % 60;
                                      return `${hours}h ${minutes}m ${seconds}s`;
                                    })()
                                  : activeTimers[booking.id] === 0
                                  ? '⏰ TIME EXCEEDED'
                                  : 'No deadline set'
                                }
                              </div>
                              {!booking.has_pending_extension && activeTimers[booking.id] !== undefined && activeTimers[booking.id] > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedBookingForExtension(booking);
                                    setShowExtensionModal(true);
                                  }}
                                  className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                                >
                                  Request Extra Time
                                </button>
                              )}
                              {booking.has_pending_extension && (
                                <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-md">
                                  Extension Request Pending
                                </span>
                              )}
                            </div>
                            {booking.deadline && (
                              <p className="text-xs text-gray-500 mt-1">
                                Deadline: {new Date(booking.deadline).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Team Members Section */}
                        {teamInfo.team_members && teamInfo.team_members.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Team Members</h5>
                            <div className="flex flex-wrap gap-2">
                              {teamInfo.team_members.map((memberId, index) => {
                                // In a real app, we'd fetch washer details from the API
                                // For now, we'll just display generic names
                                const isCurrentUser = memberId === user?.id;
                                return (
                                  <span
                                    key={memberId}
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      isCurrentUser
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    Washer {index + 1}
                                    {isCurrentUser && " (You)"}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Extension Request Modal */}
    <Dialog open={showExtensionModal} onOpenChange={setShowExtensionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Extra Time</DialogTitle>
            <DialogDescription>
              Ask admin for additional time to complete this service.
            </DialogDescription>
          </DialogHeader>

          {selectedBookingForExtension && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{selectedBookingForExtension.service_type}</h4>
                <p className="text-sm text-gray-600">
                  {selectedBookingForExtension.location}
                </p>
                {selectedBookingForExtension.deadline && (
                  <p className="text-sm text-gray-600 mt-1">
                    Current deadline: {new Date(selectedBookingForExtension.deadline).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Time Needed (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={extensionMinutes}
                  onChange={(e) => setExtensionMinutes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 30"
                />
                <p className="text-xs text-gray-500">
                  You can request up to 180 minutes (3 hours)
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Reason (optional)
                </label>
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Explain why you need extra time..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExtensionModal(false);
                    setSelectedBookingForExtension(null);
                    setExtensionMinutes('');
                    setExtensionReason('');
                  }}
                  disabled={submittingExtension}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitExtension}
                  disabled={submittingExtension || !extensionMinutes || parseInt(extensionMinutes) <= 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submittingExtension ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Toaster />
    </>
    );
  };

export default WasherDashboard;
