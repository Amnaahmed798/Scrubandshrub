'use client';

import { useState, useEffect, useRef } from 'react';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUser, FaPhone, FaCar, FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle, FaUserFriends, FaLocationArrow } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { useWasherAuth } from '@/hooks/useWasherAuth';
import { useBookingWebSocket } from '@/hooks/useBookingWebSocket';
import { WasherService } from '@/services/washerService';

// Helper function to check if a booking date is today
const isBookingToday = (bookingDate: string | Date | undefined): boolean => {
  if (!bookingDate) return false;
  const booking = new Date(bookingDate);
  const today = new Date();
  return (
    booking.getFullYear() === today.getFullYear() &&
    booking.getMonth() === today.getMonth() &&
    booking.getDate() === today.getDate()
  );
};

// Helper function to format time in 12-hour format
const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return '';
  // If it's already a full date-time string, extract time
  let date: Date;
  if (timeString.includes('T')) {
    date = new Date(timeString);
  } else {
    // Assume it's just time like "17:00"
    const [hours, minutes] = timeString.split(':').map(Number);
    date = new Date();
    date.setHours(hours, minutes || 0, 0, 0);
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Helper function to format date in readable format
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function WasherBookingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useWasherAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeTracking, setActiveTracking] = useState<{bookingId: string; intervalId: NodeJS.Timeout} | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket for real-time booking updates with 60s fallback polling
  const { isConnected: wsConnected, useFallback, triggerRefresh } = useBookingWebSocket({
    enabled: isAuthenticated,
    refreshOnConnect: true, // Triggers refresh on WebSocket connect (with 5s dedup)
    onBookingUpdate: (booking) => {
      console.log('[Washer Bookings] Booking updated via WebSocket:', booking.id);
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, ...booking } : b));
    },
    onBookingCreated: (booking) => {
      console.log('[Washer Bookings] New booking created via WebSocket:', booking.id);
      fetchBookings(true);
    },
    fallbackPollInterval: 60000, // 60 seconds fallback
  });

  // Listen for fallback poll events
  useEffect(() => {
    const handleFallbackPoll = () => {
      console.log('[Washer Bookings] Fallback poll triggered');
      fetchBookings(true);
    };

    window.addEventListener('booking-fallback-poll', handleFallbackPoll);
    return () => window.removeEventListener('booking-fallback-poll', handleFallbackPoll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, selectedStatus]);

  // NOTE: No more 10s polling - WebSocket handles real-time updates
  // Fallback polling (60s) is handled by useBookingWebSocket hook

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
    };
  }, []);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchBookings = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setFetchError(null);
      const response = await WasherService.getWasherBookings(selectedStatus === 'ALL' ? undefined : selectedStatus);
      setBookings(response.data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      if (!silent) {
        setFetchError(error.message || 'Failed to load bookings. Please try again.');
      }
    }
    if (!silent) {
      setLoading(false);
    }
  };

  // Function to send location update to backend
  const sendLocationUpdate = async (latitude: number, longitude: number) => {
    try {
      await WasherService.updateLocation(latitude, longitude);
      console.log('Location updated:', { latitude, longitude });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  // Start tracking location for a booking
  const startLocationTracking = (bookingId: string) => {
    // Clear any existing tracking
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Location tracking will not work.');
      return;
    }

    // Function to get current position and send update
    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          sendLocationUpdate(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    };

    // Send immediate update
    updateLocation();

    // Set up interval to send updates every 15 seconds
    trackingIntervalRef.current = setInterval(updateLocation, 15000);
    setActiveTracking({ bookingId, intervalId: trackingIntervalRef.current });

    console.log(`Location tracking started for booking ${bookingId}`);
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
      setActiveTracking(null);
      console.log('Location tracking stopped');
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      if (newStatus === 'CANCELLED') {
        // If cancelling, this means leaving the booking
        await WasherService.leaveBooking(bookingId);
        // Stop tracking if this booking was being tracked
        if (activeTracking?.bookingId === bookingId) {
          stopLocationTracking();
        }
      } else {
        await WasherService.updateBookingStatus(bookingId, newStatus);

        // If transitioning to ON_THE_WAY, start location tracking
        if (newStatus === 'ON_THE_WAY') {
          startLocationTracking(bookingId);
        }
        // If transitioning away from ON_THE_WAY (e.g., to IN_PROGRESS), stop tracking
        else if (activeTracking?.bookingId === bookingId && newStatus !== 'ON_THE_WAY') {
          // Check the current booking status in the list
          const currentBooking = bookings.find(b => b.id === bookingId);
          if (currentBooking && currentBooking.status === 'ON_THE_WAY' && newStatus !== 'ON_THE_WAY') {
            stopLocationTracking();
          }
        }
      }
      // Refresh bookings after status update
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto"></div>
          <p className="mt-4 text-primary">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold leading-6 text-gray-900">
              My Bookings
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Manage and track all your assigned bookings
            </p>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {['ALL', 'ASSIGNED', 'ACCEPTED', 'TEAM_FORMED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedStatus(status);
                }}
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Location Tracking Indicator */}
        {activeTracking && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <FaLocationArrow className="mr-2 text-blue-600 animate-pulse" />
              <span className="text-sm font-medium text-blue-900">
                Location tracking is active - sending updates every 15 seconds
              </span>
              <button
                onClick={stopLocationTracking}
                className="ml-auto px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800"
              >
                Stop Tracking
              </button>
            </div>
          </div>
        )}

        {/* Bookings Grid */}
        <div className="mt-6">
          {fetchError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <FaExclamationTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-900">Error loading bookings</h4>
                  <p className="mt-1 text-sm text-red-700">{fetchError}</p>
                  <button
                    onClick={fetchBookings}
                    className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {bookings.length === 0 && !fetchError ? (
            <div className="text-center py-12">
              <FaInfoCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any bookings assigned to you yet.</p>
            </div>
          ) : !fetchError && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{booking.service_type}</h4>
                        <div className="flex items-center mt-1 flex-wrap gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'ACCEPTED' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'TEAM_FORMED' ? 'bg-green-100 text-green-800' :
                            booking.status === 'ON_THE_WAY' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-800' :
                            booking.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                            booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <FaUserFriends className="mr-1" />
                            {booking.assigned_washers?.length || 0}/{booking.required_washers} members
                          </span>
                          {/* Show waiting message when team not fully formed yet */}
                          {booking.assignment_status &&
                           !booking.assignment_status.is_fully_confirmed &&
                           booking.assigned_washers?.includes(user?.id) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <FaClock className="mr-1" />
                              Waiting for {booking.assignment_status.total_required - booking.assignment_status.confirmed_count} more washer(s)
                            </span>
                          )}
                        </div>
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
                          <span>{formatDate(booking.booking_date)}</span>
                        </div>

                        {booking.booking_time && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FaClock className="mr-2 flex-shrink-0 text-gray-400" />
                            <span>{formatTime(booking.booking_time)}</span>
                          </div>
                        )}
                        {/* Also show full datetime if no separate booking_time field */}
                        {!booking.booking_time && booking.booking_date && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FaClock className="mr-2 flex-shrink-0 text-gray-400" />
                            <span>{formatTime(booking.booking_date)}</span>
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

                        <div className="text-lg font-bold text-emerald-600">SAR {booking.total_amount}</div>

                        {/* Single Status Action Button - shows only one button based on current status */}
                        <div className="mt-3">
                          {booking.status === 'ASSIGNED' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'ACCEPTED')}
                              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            >
                              Accept Booking
                            </button>
                          )}

                          {booking.status === 'ACCEPTED' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'TEAM_FORMED')}
                              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Confirm Team Ready
                            </button>
                          )}

                          {booking.status === 'TEAM_FORMED' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'ON_THE_WAY')}
                              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              On the Way
                            </button>
                          )}

                          {booking.status === 'ON_THE_WAY' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'IN_PROGRESS')}
                              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            >
                              Start Service
                            </button>
                          )}

                          {booking.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Complete Service
                            </button>
                          )}

                          {booking.status === 'COMPLETED' && (
                            <span className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md text-green-700 bg-green-100">
                              ✓ Completed
                            </span>
                          )}

                          {booking.status === 'CANCELLED' && (
                            <span className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md text-red-700 bg-red-100">
                              ✗ Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team Members Section */}
                    {booking.assigned_washers && booking.assigned_washers.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Team Members</h5>
                        <div className="flex flex-wrap gap-2">
                          {booking.assigned_washers.map((memberId: string, index: number) => {
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}