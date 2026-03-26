'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LayoutWrapper from '../components/layout/layout-wrapper';
import { Booking } from '@/lib/types';
import { useFeedback } from '../context/feedback-context';
import { useI18n } from '@/lib/i18n';

interface BookingWithService extends Booking {
  service: string;
  date: string;
  time: string;
}

export default function BookingsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<BookingWithService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null);
  const { showFeedbackForm } = useFeedback();

  // Separate arrays for filtering (computed from bookings)
  const upcomingBookings: BookingWithService[] = [];
  const pastBookings: BookingWithService[] = [];

  // Fetch bookings from the backend API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);

        // Check if user is authenticated first
        const token = localStorage.getItem('access_token');
        if (!token) {
          // For non-authenticated users, don't show an error but allow the animated UI to show
          setLoading(false);
          return;
        }

        const response = await fetch('/api/v1/bookings/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view your bookings');
            return;
          }
          throw new Error('Failed to fetch bookings');
        }

        const result = await response.json();
        const fetchedBookings = result.data || [];

        // Transform the booking data to match the expected format
        const transformedBookings: BookingWithService[] = fetchedBookings
          .filter((booking: any) => booking.status !== 'CANCELLED') // Filter out cancelled bookings
          .map((booking: any) => ({
            id: booking.id,
            customer_id: booking.customer_id,
            washer_id: booking.washer_id,
            service_type: booking.service_type,
            vehicle_type: booking.vehicle_type,
            selected_services: booking.selected_services || [],
            status: booking.status,
            booking_date: booking.booking_date,
            scheduled_date: booking.scheduled_date,
            assigned_at: booking.assigned_at,
            accepted_at: booking.accepted_at,
            started_at: booking.started_at,
            completed_at: booking.completed_at,
            total_amount: booking.total_amount,
            payment_status: booking.payment_status,
            customer_notes: booking.customer_notes,
            washer_notes: booking.washer_notes,
            created_at: booking.created_at,
            updated_at: booking.updated_at,
            // Add the fields needed for display
            service: booking.service_type || 'Service',
            date: new Date(booking.booking_date).toLocaleDateString(),
            time: new Date(booking.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));

        setBookings(transformedBookings);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Function to cancel a booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm(t('common.confirmCancel'))) {
      return;
    }

    try {
      setCancelingBookingId(bookingId);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to cancel booking');
      }

      // Remove the booking from the list entirely
      setBookings(prevBookings =>
        prevBookings.filter(booking => booking.id !== bookingId)
      );

      alert(t('common.cancelSuccess'));
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(`${t('common.cancelFailed')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCancelingBookingId(null);
    }
  };

  // Separate bookings into upcoming and past based on booking date and status
  // Logic:
  // - COMPLETED bookings go to past regardless of date
  // - CANCELLED bookings are filtered out earlier, so we don't need to worry about them here
  // - All other bookings are categorized by date only
  const currentDate = new Date();

  // Clear the arrays before populating
  upcomingBookings.length = 0;
  pastBookings.length = 0;

  // Process each booking individually to ensure no overlap
  bookings.forEach(booking => {
    // If status is COMPLETED, it goes to past regardless of date
    if (booking.status === 'COMPLETED') {
      pastBookings.push(booking);
    } else {
      // For non-COMPLETED bookings, categorize by date only
      // Note: CANCELLED bookings are already filtered out at the data fetching level (line 57)
      const bookingDate = new Date(booking.booking_date);

      if (bookingDate >= currentDate) {
        upcomingBookings.push(booking);
      } else {
        pastBookings.push(booking);
      }
    }
  });

  // Sort the arrays
  upcomingBookings.sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()); // Sort upcoming bookings by date (earliest first)
  pastBookings.sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()); // Sort past bookings by date (most recent first)

  // Animation effect for search to cross (infinite loop)
  useEffect(() => {
    if ((activeTab === 'upcoming' && upcomingBookings.length === 0) ||
        (activeTab === 'past' && pastBookings.length === 0)) {

      let animationInterval: NodeJS.Timeout;

      const animateIcons = () => {
        const searchIcons = document.querySelectorAll('.search-icon');
        const crossIcons = document.querySelectorAll('.cross-icon');

        // Animate search to cross
        searchIcons.forEach((icon: Element) => {
          (icon as HTMLElement).style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
          (icon as HTMLElement).style.transform = 'scale(0.8)';
          (icon as HTMLElement).style.opacity = '0';
        });

        setTimeout(() => {
          // Show cross
          crossIcons.forEach((icon: Element) => {
            (icon as HTMLElement).style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
            (icon as HTMLElement).style.transform = 'scale(1)';
            (icon as HTMLElement).style.opacity = '1';
          });

          setTimeout(() => {
            // Animate cross to search again after a delay
            crossIcons.forEach((icon: Element) => {
              (icon as HTMLElement).style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
              (icon as HTMLElement).style.transform = 'scale(0.8)';
              (icon as HTMLElement).style.opacity = '0';
            });

            setTimeout(() => {
              // Show search again
              searchIcons.forEach((icon: Element) => {
                (icon as HTMLElement).style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
                (icon as HTMLElement).style.transform = 'scale(1)';
                (icon as HTMLElement).style.opacity = '1';
              });
            }, 500);
          }, 1500); // Show cross for 1.5 seconds
        }, 500); // Transition to cross after 0.5 seconds
      };

      // Start the animation after a delay and repeat every 3 seconds
      const initialTimer = setTimeout(() => {
        animateIcons();
        animationInterval = setInterval(animateIcons, 3000);
      }, 1000);

      return () => {
        clearTimeout(initialTimer);
        if (animationInterval) {
          clearInterval(animationInterval);
        }
      };
    } else {
      // If there are bookings, clear any ongoing animation
      const searchIcons = document.querySelectorAll('.search-icon');
      const crossIcons = document.querySelectorAll('.cross-icon');

      searchIcons.forEach((icon: Element) => {
        (icon as HTMLElement).style.transition = '';
        (icon as HTMLElement).style.transform = '';
        (icon as HTMLElement).style.opacity = '';
      });

      crossIcons.forEach((icon: Element) => {
        (icon as HTMLElement).style.transition = '';
        (icon as HTMLElement).style.transform = '';
        (icon as HTMLElement).style.opacity = '0';
      });
    }
  }, [activeTab, upcomingBookings.length, pastBookings.length]);

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 pt-4 pb-4">
        <div className="container mx-auto px-3 sm:px-4">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t('common.myBookings')}</h1>

          {/* Centered toggle tab selector */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="inline-flex bg-gray-100 p-1 rounded-full">
              <button
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-colors ${
                  activeTab === 'upcoming'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('upcoming')}
              >
                {t('common.upcoming')}
              </button>
              <button
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-colors ${
                  activeTab === 'past'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('past')}
              >
                {t('common.past')}
              </button>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-red-600 font-medium text-sm sm:text-base">{error}</p>
              <button
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-700"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Booking list */}
          {!loading && !error && (
            <div className="space-y-3 sm:space-y-4">
              {activeTab === 'upcoming' && upcomingBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-6">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 search-icon"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="11" cy="11" r="8" strokeWidth="2"></circle>
                          <path d="m21 21-4.35-4.35" strokeWidth="2"></path>
                        </svg>
                        <svg
                          className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 cross-icon absolute top-0 left-0 opacity-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"></line>
                          <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"></line>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg font-medium text-gray-700">No upcoming bookings</p>
                  <p className="text-sm sm:text-base text-gray-500 mt-2">
                    Book a new appointment{' '}
                    <a href="/book" className="text-primary font-medium hover:underline">
                      here
                    </a>
                  </p>
                </div>
              ) : activeTab === 'past' && pastBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-6">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 search-icon"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="11" cy="11" r="8" strokeWidth="2"></circle>
                          <path d="m21 21-4.35-4.35" strokeWidth="2"></path>
                        </svg>
                        <svg
                          className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 cross-icon absolute top-0 left-0 opacity-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"></line>
                          <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"></line>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg font-medium text-gray-700">No past bookings</p>
                  <p className="text-sm sm:text-base text-gray-500 mt-2">
                    Book a new appointment{' '}
                    <a href="/book" className="text-primary font-medium hover:underline">
                      here
                    </a>
                  </p>
                </div>
              ) : (
                (activeTab === 'upcoming' ? upcomingBookings : pastBookings).map((booking: BookingWithService) => (
                  <Link href={`/bookings/${booking.id}`} key={booking.id} className="block">
                    <div
                      className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-3">
                            <h3 className="font-bold text-base sm:text-xl text-gray-900 group-hover:text-primary transition-colors">{booking.service_type}</h3>
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.status === 'PENDING' || booking.status === 'ASSIGNED' || booking.status === 'ACCEPTED'
                                ? 'bg-blue-100 text-blue-800'
                                : booking.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>

                          <div className="flex items-center text-gray-700 mb-4">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <span className="text-xs sm:text-base font-medium">
                                {booking.date || (booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : 'N/A')}
                              </span>
                              <span className="mx-1 sm:mx-2 text-gray-400 text-xs sm:text-base">•</span>
                              <span className="text-xs sm:text-base font-medium">
                                {booking.time || 'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* Display selected services/subcategories */}
                          {booking.selected_services && booking.selected_services.length > 0 && (
                            <div className="mb-3 sm:mb-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Selected Services:</p>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {booking.selected_services.map((service: any, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-block bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-blue-200 shadow-sm"
                                  >
                                    {typeof service === 'string' ? service : (service.name || service.service_name || 'Service')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center text-gray-700 text-xs sm:text-base font-medium">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
                            </svg>
                            <span className="capitalize">{booking.vehicle_type}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end ml-3 sm:ml-4">
                          {/* Action buttons - only show on the main bookings page, not in the detail view */}
                          <div className="flex flex-col gap-2 sm:gap-3">

                            {/* Cancel button for pending bookings */}
                            {booking.status === 'PENDING' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent navigation to detail page
                                  handleCancelBooking(booking.id);
                                }}
                                disabled={cancelingBookingId === booking.id}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg min-w-[80px] sm:min-w-[100px] flex items-center justify-center gap-1.5 sm:gap-2 ${
                                  cancelingBookingId === booking.id
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                                }`}
                              >
                                {cancelingBookingId === booking.id ? (
                                  <>
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="hidden sm:inline">Canceling...</span>
                                    <span className="sm:hidden">...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    <span className="hidden sm:inline">Cancel</span>
                                    <span className="sm:hidden">Cancel</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Feedback button for completed bookings */}
                            {booking.status === 'COMPLETED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent navigation to detail page
                                  showFeedbackForm(booking.id);
                                }}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary to-blue-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-blue-500 hover:to-primary hover:text-white transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-1.5 sm:gap-2 min-w-[80px] sm:min-w-[100px]"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                </svg>
                                Rate Service
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}