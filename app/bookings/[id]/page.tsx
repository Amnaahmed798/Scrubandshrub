'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LayoutWrapper from '../../components/layout/layout-wrapper';
import { useFeedback } from '../../context/feedback-context';
import dynamicImport from 'next/dynamic';
import { useI18n } from '@/lib/i18n';

const BookingTrackingMap = dynamicImport(
  () => import('@/components/admin/BookingTrackingMap'),
  { ssr: false, loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div> }
);

interface BookingDetail {
  id: string;
  customer_id: string;
  washer_id: string | null;
  service_type: string;
  vehicle_type: string;
  status: string;
  booking_date: string;
  assigned_at?: string;
  accepted_at?: string;
  completed_at?: string;
  total_amount: number;
  team_size?: number; // Number of washers required for this booking
  selected_services: any[];
  created_at: string;
  updated_at: string;
  assigned_washers?: Array<{
    id: string;
    full_name: string;
    profile_picture?: string;
    service_area?: string;
    phone_number?: string;
  }>;
}

interface WasherInfo {
  id: string;
  full_name: string;
  profile_picture?: string;
  service_area?: string;
  phone_number?: string;
}

export default function BookingDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [hasAcknowledgedReminder, setHasAcknowledgedReminder] = useState(false);
  const [showTrackingMap, setShowTrackingMap] = useState(false);
  const [hasOnTheWayWasher, setHasOnTheWayWasher] = useState(false);
  const { showFeedbackForm } = useFeedback();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('Please log in to view booking details');
          return;
        }

        const response = await fetch(`/api/v1/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch booking details');
        }

        const result = await response.json();
        setBooking(result.data);

        // Check if there are any washers with ON_THE_WAY or ACCEPTED status
        if (result.data?.assigned_washers?.length > 0) {
          const hasActiveWasher = result.data.assigned_washers.some((w: any) =>
            w.status === 'ON_THE_WAY' || w.status === 'ACCEPTED' ||
            result.data.status === 'IN_PROGRESS' || result.data.status === 'CONFIRMED'
          );
          setHasOnTheWayWasher(hasActiveWasher);
        }
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
    // Refresh booking every 10 seconds to update washer status
    const interval = setInterval(fetchBooking, 10000);
    return () => clearInterval(interval);
  }, [bookingId]);

  // Calculate time left until booking
  useEffect(() => {
    if (!booking?.booking_date) return;

    const calculateTimeLeft = () => {
      const bookingDateTime = new Date(booking.booking_date);
      const now = new Date();
      const difference = bookingDateTime.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [booking]);

  // Check if booking date is approaching (within 1 hour) and notify
  // Reset acknowledgment when booking changes
  useEffect(() => {
    setHasAcknowledgedReminder(false);
  }, [booking?.id]);

  // Check if booking date is approaching (within 1 hour) and notify
  useEffect(() => {
    if (!booking?.booking_date || !timeLeft) return;

    const bookingDateTime = new Date(booking.booking_date);
    const now = new Date();
    const timeDiff = bookingDateTime.getTime() - now.getTime();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

    if (timeDiff > 0 && timeDiff <= oneHour && timeDiff > 0) {
      // Show notification that service is approaching
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Service Reminder', {
          body: `Your ${booking.service_type} service is starting soon at ${new Date(booking.booking_date).toLocaleTimeString()}`,
          icon: '/favicon.ico',
          tag: `booking-${booking.id}`
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Service Reminder', {
              body: `Your ${booking.service_type} service is starting soon at ${new Date(booking.booking_date).toLocaleTimeString()}`,
              icon: '/favicon.ico',
              tag: `booking-${booking.id}`
            });
          }
        });
      }

      // Also show an in-app notification (only if not already acknowledged)
      if (timeDiff <= 600000 && !hasAcknowledgedReminder) { // Less than 10 minutes
        alert(`Reminder: Your ${booking.service_type} service is starting soon at ${new Date(booking.booking_date).toLocaleTimeString()}`);
        setHasAcknowledgedReminder(true); // Mark as acknowledged
      }
    }

    // Special notification when the booking date arrives (at the start time)
    if (timeDiff > -60000 && timeDiff < 60000) { // Within 1 minute of the booking time
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Service Day!', {
          body: `Today is your ${booking.service_type} service day! Your service will start at ${new Date(booking.booking_date).toLocaleTimeString()}`,
          icon: '/favicon.ico',
          tag: `service-day-${booking.id}`
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Service Day!', {
              body: `Today is your ${booking.service_type} service day! Your service will start at ${new Date(booking.booking_date).toLocaleTimeString()}`,
              icon: '/favicon.ico',
              tag: `service-day-${booking.id}`
            });
          }
        });
      }
    }
  }, [timeLeft, booking, hasAcknowledgedReminder]);

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-background pt-4 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </LayoutWrapper>
    );
  }

  if (error) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-background pt-4 flex justify-center items-center">
          <div className="text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (!booking) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-background pt-4 flex justify-center items-center">
          <div className="text-center">
            <p className="text-gray-600">Booking not found</p>
            <button
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  // Format booking date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format time left for display
  const formatTimeLeft = () => {
    if (!timeLeft) return '';

    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.seconds}s`;
    }
  };

  // Check if booking is upcoming (future date) or past
  const isUpcoming = new Date(booking.booking_date) > new Date();
  const isCompleted = booking.status === 'COMPLETED';

  // Only show timer if the booking is upcoming and not completed
  const shouldShowTimer = isUpcoming && !isCompleted;

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-background pt-4">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-primary hover:text-secondary mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{booking.service_type}</h1>
                <div className="flex items-center mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'PENDING' || booking.status === 'CONFIRMED'
                      ? 'bg-blue-100 text-blue-800'
                      : booking.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'CANCELLED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                  {isUpcoming && !isCompleted && (
                    <span className="ml-2 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">SAR {booking.total_amount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Booking ID: {booking.id.substring(0, 8)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Service Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Type:</span>
                    <span className="font-medium">{booking.service_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle Type:</span>
                    <span className="font-medium capitalize">{booking.vehicle_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Size:</span>
                    <span className="font-medium">{booking.team_size || 1} washer{booking.team_size && booking.team_size !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">{booking.status}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Date & Time</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(booking.booking_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{formatTime(booking.booking_date)}</span>
                  </div>
                  {shouldShowTimer && timeLeft && (
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Time Until Service</p>
                        <p className="text-xl font-bold text-primary">{formatTimeLeft()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {booking.selected_services && booking.selected_services.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Selected Services</h3>
                <div className="flex flex-wrap gap-2">
                  {booking.selected_services.map((service: any, index: number) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200"
                    >
                      {typeof service === 'string' ? service : (service.name || service.service_name || 'Service')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-3 h-3 rounded-full bg-primary"></div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Booking Created</p>
                    <p className="text-sm text-gray-500">{formatDate(booking.created_at)} at {formatTime(booking.created_at)}</p>
                  </div>
                </div>
                {booking.accepted_at && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Booking Accepted</p>
                      <p className="text-sm text-gray-500">{formatDate(booking.accepted_at)} at {formatTime(booking.accepted_at)}</p>
                    </div>
                  </div>
                )}
                {booking.completed_at && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Service Completed</p>
                      <p className="text-sm text-gray-500">{formatDate(booking.completed_at)} at {formatTime(booking.completed_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Assigned Washers Section */}
          {booking.assigned_washers && booking.assigned_washers.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Washers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {booking.assigned_washers.map((washer: any) => {
                  const washerStatus = washer.status || 'ASSIGNED';
                  const isOnTheWay = washerStatus === 'ON_THE_WAY';
                  const isAccepted = washerStatus === 'ACCEPTED';

                  return (
                    <div
                      key={washer.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-shrink-0">
                          {washer.profile_picture ? (
                            <img
                              src={washer.profile_picture}
                              alt={washer.full_name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {washer.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{washer.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">#{washer.id.slice(0, 8)}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {isOnTheWay ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 animate-pulse">
                              🚗 On the way
                            </span>
                          ) : isAccepted ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              ⏳ Accepting
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              Assigned
                            </span>
                          )}
                        </div>
                      </div>

                      {washer.phone_number && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="truncate">{washer.phone_number}</span>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {isOnTheWay ? (
                          <button
                            onClick={() => router.push(`/book?trackingBookingId=${booking.id}`)}
                            className="w-full bg-green-500 text-white py-2 px-3 rounded-lg font-medium text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            Track Washer
                          </button>
                        ) : (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Status</span>
                            <span className="font-medium text-blue-600">
                              {isAccepted ? 'Accepting your booking' : 'Ready to serve'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Tracking Map removed - not needed for customers */}

          <div className="flex flex-col sm:flex-row gap-3">
            {booking.status === 'COMPLETED' && (
              <button
                onClick={() => showFeedbackForm(booking.id)}
                className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-bold hover:bg-secondary transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
                Rate Service
              </button>
            )}

            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
              <button
                className="flex-1 bg-red-100 text-red-700 py-3 px-4 rounded-xl font-bold hover:bg-red-200 transition-colors"
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to cancel this booking?')) {
                    return;
                  }

                  try {
                    const token = localStorage.getItem('access_token');
                    const response = await fetch(`/api/v1/bookings/${booking.id}/cancel`, {
                      method: 'PUT',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                    });

                    if (!response.ok) {
                      throw new Error('Failed to cancel booking');
                    }

                    alert('Booking cancelled successfully');
                    window.location.reload();
                  } catch (error) {
                    console.error('Error cancelling booking:', error);
                    alert('Failed to cancel booking. Please try again.');
                  }
                }}
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}