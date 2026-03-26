'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getBookings, updateBookingStatus, assignBookingToWasher, getWasherDetails } from '@/lib/api';
import { useBookingWebSocket } from '@/hooks/useBookingWebSocket';
import { Booking } from '@/types';
import AssignWasherModal from '@/components/admin/AssignWasherModal';
import BookingTrackingMap from '@/components/admin/BookingTrackingMap';

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedWashers, setSelectedWashers] = useState<string[]>([]);
  const [selectedWasherDetails, setSelectedWasherDetails] = useState<any>(null);
  const [showWasherDetailsModal, setShowWasherDetailsModal] = useState(false);
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});

  // WebSocket for real-time booking updates with 60s fallback polling
  const { isConnected: wsConnected, useFallback, triggerRefresh } = useBookingWebSocket({
    enabled: true,
    refreshOnConnect: true, // Triggers refresh on WebSocket connect (with 5s dedup)
    onBookingUpdate: (booking) => {
      console.log('[Admin] Booking updated via WebSocket:', booking.id);
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, ...booking } : b));
    },
    onBookingCreated: (booking) => {
      console.log('[Admin] New booking created via WebSocket:', booking.id);
      fetchBookings(true);
    },
    fallbackPollInterval: 60000, // 60 seconds fallback
  });

  // Listen for fallback poll events
  useEffect(() => {
    const handleFallbackPoll = () => {
      console.log('[Admin] Fallback poll triggered');
      fetchBookings(true);
    };

    window.addEventListener('booking-fallback-poll', handleFallbackPoll);
    return () => window.removeEventListener('booking-fallback-poll', handleFallbackPoll);
  }, []);

  useEffect(() => {
    fetchBookings();

    // NOTE: No more 10s polling - WebSocket handles real-time updates
    // Fallback polling (60s) is handled by useBookingWebSocket hook

    return () => {
      console.log('[Admin] Cleanup: WebSocket cleanup handled by hook');
    };
  }, [statusFilter]);

  // Timer interval - updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        // Ensure bookings is an array before iterating
        if (Array.isArray(bookings)) {
          bookings.forEach(booking => {
            // Check if this booking has an active timer (in seconds)
            if (updated[booking.id] !== undefined && updated[booking.id] > 0) {
              updated[booking.id] = updated[booking.id]! - 1;
              hasChanges = true;
            }
          });
        }

        return hasChanges ? updated : prev;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [bookings]);

  const fetchBookings = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await getBookings();
      // Ensure response.data is an array
      let allBookings = Array.isArray(response.data) ? response.data : [];
      
      // If response.data is not an array, check if it's an object with a bookings property
      if (!Array.isArray(response.data) && response.data && typeof response.data === 'object') {
        allBookings = Array.isArray(response.data.bookings) ? response.data.bookings : [];
      }

      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        allBookings = allBookings.filter((booking: any) => booking.status === statusFilter);
      }

      setBookings(allBookings);

      // Initialize timers for bookings that are in progress
      const newTimers: Record<string, number> = {};
      if (Array.isArray(allBookings)) {
        allBookings.forEach((booking: any) => {
          if (booking.status === 'TEAM_FORMED' || booking.status === 'ON_THE_WAY' || booking.status === 'IN_PROGRESS' || booking.status === 'START_SERVICE') {
            // Calculate remaining time in seconds based on started_at (when washer clicked "On the Way") + estimated_duration_minutes
            // If started_at is not available, fall back to assigned_at
            if (booking.estimated_duration_minutes) {
              const now = new Date().getTime();
              const timerStartTime = new Date(booking.started_at || booking.assigned_at).getTime();
              const durationMs = booking.estimated_duration_minutes * 60 * 1000;
              const deadlineMs = timerStartTime + durationMs;
              const remainingMs = Math.max(0, deadlineMs - now);
              newTimers[booking.id] = Math.ceil(remainingMs / 1000); // Convert to seconds
            } else if (booking.time_remaining_minutes !== null && booking.time_remaining_minutes !== undefined) {
              newTimers[booking.id] = booking.time_remaining_minutes * 60; // Convert minutes to seconds
            }
          }
        });
      }
      setActiveTimers(newTimers);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      setBookings([]); // Set empty array on error
    }
    if (!silent) {
      setLoading(false);
    }
  };

  const handleViewWasherDetails = async (washer: any) => {
    try {
      const response = await getWasherDetails(washer.washer_id);
      setSelectedWasherDetails(response.data);
      setShowWasherDetailsModal(true);
    } catch (err) {
      console.error('Failed to fetch washer details:', err);
      alert('Failed to load washer details');
    }
  };


  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleAssignWashers = (bookingId: string) => {
    setSelectedBooking(bookings.find(b => b.id === bookingId));
    setAssigningBookingId(bookingId);
    setShowAssignModal(true);
  };

  const handleAssignmentComplete = () => {
    // Refresh the bookings list after assignment
    fetchBookings();
    setShowAssignModal(false);
    setAssigningBookingId(null);
    setShowDetailsModal(false); // Also close the booking details modal to return to the page
  };

  const handleConfirmAssignment = async () => {
    if (!selectedBooking || selectedWashers.length === 0) {
      alert('Please select at least one washer to assign.');
      return;
    }

    const requiredTeamSize = selectedBooking.team_size || 1;
    if (selectedWashers.length !== requiredTeamSize) {
      alert(`You must select exactly ${requiredTeamSize} washer${requiredTeamSize !== 1 ? 's' : ''} for this booking. Currently selected: ${selectedWashers.length}`);
      return;
    }

    try {
      // Call the API to assign the washers to the booking
      await assignBookingToWasher(selectedBooking.id, selectedWashers);

      // Refresh the bookings data to reflect the assignment
      await fetchBookings();

      setShowAssignModal(false);
      setSelectedWashers([]);
      alert('Booking assigned successfully!');
    } catch (error) {
      console.error('Error assigning booking:', error);
      alert('Failed to assign booking. Please try again.');
    }
  };

  const handleWasherSelection = (washerId: string) => {
    setSelectedWashers(prev => {
      if (prev.includes(washerId)) {
        return prev.filter(id => id !== washerId);
      } else {
        return [...prev, washerId];
      }
    });
  };

  if (loading) return <div className="p-2 sm:p-6">Loading bookings...</div>;
  if (error) return <div className="p-2 sm:p-6 text-red-500">Error: {error}</div>;

  const pendingBookings = bookings.filter(booking => booking.status === 'PENDING');
  const assignedBookings = bookings.filter(booking => booking.status === 'ASSIGNED');
  const acceptedBookings = bookings.filter(booking => booking.status === 'ACCEPTED');
  const teamFormedBookings = bookings.filter(booking => booking.status === 'TEAM_FORMED');
  const onTheWayBookings = bookings.filter(booking => booking.status === 'ON_THE_WAY');
  const inProgressBookings = bookings.filter(booking => booking.status === 'IN_PROGRESS');
  const completedBookings = bookings.filter(booking => booking.status === 'COMPLETED');
  const cancelledBookings = bookings.filter(booking => booking.status === 'CANCELLED');

  const renderBookingTable = (bookingsList: any[], title: string, statusColor: string) => {
    if (bookingsList.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className={statusColor}>{title} ({bookingsList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead>Acceptance</TableHead>
                  <TableHead>Team Size</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>View Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsList.map((booking) => {
                  const requiredTeamSize = booking.team_size || 1;

                  return (
                    <TableRow key={booking.id} id={`booking-row-${booking.id}`}>
                      <TableCell className="font-medium">#{booking.id}</TableCell>
                      <TableCell>{booking.customer_name || `Customer ${booking.customer_id}`}</TableCell>
                      <TableCell>{booking.service_type}</TableCell>
                      <TableCell>
                        {booking.service_type.toLowerCase().includes('car') ||
                         booking.service_type.toLowerCase().includes('washing') ||
                         booking.service_type.toLowerCase().includes('vehicle') ? booking.vehicle_type : 'N/A'}
                      </TableCell>
                      <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'ASSIGNED' ? 'bg-purple-100 text-purple-800' :
                          booking.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'ON_THE_WAY' ? 'bg-orange-100 text-orange-800' :
                          booking.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                          booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {/* Timer Display */}
                        {(() => {
                          const status = booking.status;
                          const duration = booking.estimated_duration_minutes;
                          const activeTimer = activeTimers[booking.id];

                          // ASSIGNED or ACCEPTED: show total duration in gray
                          if (status === 'ASSIGNED' || status === 'ACCEPTED') {
                            return (
                              <div className="text-sm">
                                {duration
                                  ? <span className="text-gray-500">{Math.floor(duration / 60)}h {duration % 60}m <small className="text-xs">(total)</small></span>
                                  : <span className="text-gray-500">-</span>
                                }
                              </div>
                            );
                          }

                          // TEAM_FORMED, ON_THE_WAY, IN_PROGRESS: show live countdown
                          if (status === 'TEAM_FORMED' || status === 'ON_THE_WAY' || status === 'IN_PROGRESS' || status === 'START_SERVICE') {
                            if (activeTimer !== undefined && activeTimer > 0) {
                              const hours = Math.floor(activeTimer / 3600);
                              const minutes = Math.floor((activeTimer % 3600) / 60);
                              const seconds = activeTimer % 60;
                              // Color code based on remaining time
                              const colorClass = activeTimer <= 600
                                ? 'text-red-600 font-bold animate-pulse'
                                : activeTimer <= 1800
                                ? 'text-orange-600'
                                : 'text-green-600';
                              return (
                                <div className={`text-sm ${colorClass}`}>
                                  {hours}h {minutes}m {seconds}s
                                </div>
                              );
                            } else if (activeTimer === 0) {
                              return <span className="text-red-600 font-bold text-sm">⏰ TIME EXCEEDED</span>;
                            }
                          }

                          return <span className="text-gray-500 text-sm">-</span>;
                        })()}
                      </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{requiredTeamSize} washer{requiredTeamSize !== 1 ? 's' : ''}</Badge>
                    </TableCell>
                    <TableCell>
                      {booking.assignment_status ? (
                        <div className="text-xs">
                          <div className="font-medium">{booking.assignment_status.confirmed_count}/{booking.assignment_status.total_required} washers accepted</div>
                          <div className="text-gray-500 mt-1">
                            {booking.assignment_status.confirmed_count >= booking.assignment_status.total_required
                              ? "All accepted"
                              : "Waiting for more acceptances"
                            }
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>${booking.total_amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleViewDetails(booking)}
                        size="sm"
                      >
                        View Details
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Select
                          value={booking.status}
                          onValueChange={(value) => updateBookingStatus(booking.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="ASSIGNED">Assigned</SelectItem>
                            <SelectItem value="ACCEPTED">Accepted</SelectItem>
                            <SelectItem value="ON_THE_WAY">On the Way</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {bookingsList.map((booking) => {
            const requiredTeamSize = booking.team_size || 1;
            return (
              <div key={booking.id} className="border rounded-lg p-3 bg-white shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">#{booking.id}</div>
                    <div className="text-xs text-gray-600">{booking.customer_name || `Customer ${booking.customer_id}`}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] ${
                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'ASSIGNED' ? 'bg-purple-100 text-purple-800' :
                    booking.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'ON_THE_WAY' ? 'bg-orange-100 text-orange-800' :
                    booking.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                    booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service:</span>
                    <span className="font-medium text-xs">{booking.service_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium text-xs">{new Date(booking.booking_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Team:</span>
                    <Badge variant="secondary" className="text-[10px] h-5">{requiredTeamSize} washer{requiredTeamSize !== 1 ? 's' : ''}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium text-xs">${booking.total_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button onClick={() => handleViewDetails(booking)} size="sm" className="flex-1 text-xs h-8">
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
    );
  };

  return (
    <div className="space-y-3 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h1 className="text-base sm:text-xl font-bold">Bookings Management</h1>
        <div className="text-xs sm:text-sm text-gray-500">
          Total: {bookings.length} bookings
        </div>
      </div>

      {renderBookingTable(pendingBookings, 'Pending Bookings', 'text-yellow-700')}
      {renderBookingTable(assignedBookings, 'Assigned Bookings', 'text-purple-700')}
      {renderBookingTable(acceptedBookings, 'Accepted Bookings', 'text-blue-700')}
      {renderBookingTable(teamFormedBookings, 'Team Formed', 'text-indigo-700')}
      {renderBookingTable(onTheWayBookings, 'On The Way', 'text-orange-700')}
      {renderBookingTable(inProgressBookings, 'In Progress Bookings', 'text-amber-700')}
      {renderBookingTable(completedBookings, 'Completed Bookings', 'text-green-700')}
      {renderBookingTable(cancelledBookings, 'Cancelled Bookings', 'text-red-700')}

      {/* Booking Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Booking Details</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Summary Card */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Booking ID</p>
                    <p className="font-semibold">#{selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedBooking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      selectedBooking.status === 'ASSIGNED' ? 'bg-purple-100 text-purple-800' :
                      selectedBooking.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                      selectedBooking.status === 'ON_THE_WAY' ? 'bg-orange-100 text-orange-800' :
                      selectedBooking.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                      selectedBooking.status === 'START_SERVICE' ? 'bg-indigo-100 text-indigo-800' :
                      selectedBooking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      selectedBooking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service Type</p>
                    <p className="font-semibold capitalize">{selectedBooking.service_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {selectedBooking.service_type.toLowerCase().includes('car') ||
                       selectedBooking.service_type.toLowerCase().includes('washing') ||
                       selectedBooking.service_type.toLowerCase().includes('vehicle') ? 'Vehicle Type' : 'Service Category'}
                    </p>
                    <p className="font-semibold capitalize">
                      {selectedBooking.service_type.toLowerCase().includes('car') ||
                       selectedBooking.service_type.toLowerCase().includes('washing') ||
                       selectedBooking.service_type.toLowerCase().includes('vehicle')
                         ? selectedBooking.vehicle_type
                         : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content with Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - All Details */}
                <div className="space-y-4">
                  {/* Customer Information */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Customer Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedBooking.customer_name || `Customer ${selectedBooking.customer_id}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedBooking.customer_phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Service Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{new Date(selectedBooking.booking_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">
                          {selectedBooking.booking_time
                            ? (() => {
                                const [hours, minutes] = selectedBooking.booking_time.split(':').map(Number);
                                const ampm = hours >= 12 ? 'PM' : 'AM';
                                const displayHours = hours % 12 || 12;
                                return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                              })()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Team Size:</span>
                        <span className="font-medium">{selectedBooking.team_size || 1} washer{selectedBooking.team_size && selectedBooking.team_size !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium text-lg font-bold text-green-600">${selectedBooking.total_amount?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Time Tracking Section */}
                  {(selectedBooking.status === 'ASSIGNED' ||
                    selectedBooking.status === 'ACCEPTED' ||
                    selectedBooking.status === 'TEAM_FORMED' ||
                    selectedBooking.status === 'ON_THE_WAY' ||
                    selectedBooking.status === 'IN_PROGRESS' ||
                    selectedBooking.status === 'START_SERVICE') && (
                    <div className="bg-white border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">⏱️ Service Time</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Estimated Duration:</span>
                          <span className="font-medium">
                            {selectedBooking.estimated_duration_minutes
                              ? `${Math.floor(selectedBooking.estimated_duration_minutes / 60)}h ${selectedBooking.estimated_duration_minutes % 60}m`
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-gray-700 font-medium">Time Remaining:</span>
                          <div className={`text-lg font-bold ${
                            selectedBooking.status === 'ASSIGNED' || selectedBooking.status === 'ACCEPTED'
                              ? 'text-gray-400'
                              : activeTimers[selectedBooking.id] !== undefined && activeTimers[selectedBooking.id] <= 600
                              ? 'text-red-600 animate-pulse'
                              : activeTimers[selectedBooking.id] !== undefined && activeTimers[selectedBooking.id] <= 1800
                              ? 'text-orange-600'
                              : 'text-green-600'
                          }`}>
                            {(() => {
                              if (selectedBooking.status === 'ASSIGNED' || selectedBooking.status === 'ACCEPTED') {
                                return selectedBooking.estimated_duration_minutes
                                  ? `${Math.floor(selectedBooking.estimated_duration_minutes / 60)}h ${selectedBooking.estimated_duration_minutes % 60}m (total)`
                                  : 'No duration set';
                              }
                              const timer = activeTimers[selectedBooking.id];
                              if (timer !== undefined && timer > 0) {
                                const hours = Math.floor(timer / 3600);
                                const minutes = Math.floor((timer % 3600) / 60);
                                const seconds = timer % 60;
                                return `${hours}h ${minutes}m ${seconds}s`;
                              } else if (timer === 0) {
                                return '⏰ TIME EXCEEDED';
                              }
                              return 'No deadline set';
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vehicle & Location */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">
                      {selectedBooking.service_type.toLowerCase().includes('car') ||
                       selectedBooking.service_type.toLowerCase().includes('washing') ||
                       selectedBooking.service_type.toLowerCase().includes('vehicle') ? 'Vehicle & Location' : 'Service & Location'}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600 block">
                          {selectedBooking.service_type.toLowerCase().includes('car') ||
                           selectedBooking.service_type.toLowerCase().includes('washing') ||
                           selectedBooking.service_type.toLowerCase().includes('vehicle') ? 'Vehicle Details:' : 'Service Details:'}
                        </span>
                        <span className="font-medium">{selectedBooking.car_details || selectedBooking.vehicle_details || 'N/A'}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-600 block">Location:</span>
                        <span className="font-medium">{selectedBooking.location || 'Location not provided'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Selected Services */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Selected Services</h3>
                    <div className="space-y-1">
                      {selectedBooking.selected_services_text || selectedBooking.services ? (
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(selectedBooking.selected_services_text || selectedBooking.services) ? (
                            (selectedBooking.selected_services_text || selectedBooking.services).map((service: any, index: number) => (
                              <span
                                key={index}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                              >
                                {typeof service === 'string' ? service : (service.name || service.service_name || 'Service')}
                              </span>
                            ))
                          ) : (
                            (selectedBooking.selected_services_text || selectedBooking.services)
                              .toString()
                              .split(',')
                              .map((service: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                                >
                                  {service.trim()}
                                </span>
                              ))
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">No services selected</span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Washers */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Assigned Washers</h3>
                    {selectedBooking.assigned_washers_details && selectedBooking.assigned_washers_details.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {selectedBooking.assigned_washers_details.map((washer: any) => (
                          <div key={washer.washer_id} className="bg-gray-50 rounded-lg p-4 min-w-[180px] border">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-sm text-gray-900">{washer.full_name}</p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                washer.status === 'CONFIRMED'
                                  ? 'bg-green-100 text-green-800'
                                  : washer.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {washer.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">Assigned: {washer.assigned_at ? new Date(washer.assigned_at).toLocaleDateString() : 'N/A'} {washer.assigned_at ? new Date(washer.assigned_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</p>
                            <Button
                              onClick={() => handleViewWasherDetails(washer)}
                              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-3 rounded"
                              size="sm"
                            >
                              View Details
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No washers assigned to this booking yet</p>
                    )}
                    {/* Show summary */}
                    {selectedBooking.assignment_status && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {selectedBooking.assignment_status.confirmed_count} of {selectedBooking.assignment_status.total_required} washers accepted
                          </span>
                          {selectedBooking.assignment_status.is_fully_confirmed ? (
                            <span className="text-green-600 font-medium">All accepted ✓</span>
                          ) : (
                            <span className="text-yellow-600 font-medium">Waiting for acceptances</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    {/* Show Assign button for pending bookings with no assigned washers */}
                    {selectedBooking.status === 'PENDING' &&
                     (!selectedBooking.assigned_washers || selectedBooking.assigned_washers.length === 0) && (
                      <Button
                        onClick={() => handleAssignWashers(selectedBooking.id)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Assign Washers
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailsModal(false)}
                      className="px-6 py-2"
                    >
                      Close
                    </Button>
                  </div>
                </div>

                {/* Right Column - Live Tracking Map */}
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">
                      Live Tracking Map
                    </h3>
                    <div className="text-xs text-gray-500 mb-2">
                      {['ASSIGNED', 'ACCEPTED', 'TEAM_FORMED', 'ON_THE_WAY', 'IN_PROGRESS', 'START_SERVICE'].includes(selectedBooking.status.toUpperCase()) ? (
                        <span>Tracking washer locations in real-time</span>
                      ) : (
                        <span>Live tracking not available for this booking status</span>
                      )}
                    </div>
                    <BookingTrackingMap bookingId={selectedBooking.id} />
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Destination</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>On the Way</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>In Progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Accepted/Team Formed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Washer Details Modal */}
      <Dialog open={showWasherDetailsModal} onOpenChange={setShowWasherDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Washer Details</DialogTitle>
          </DialogHeader>

          {selectedWasherDetails && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Full Name:</span>
                    <p className="font-medium">{selectedWasherDetails.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{selectedWasherDetails.email || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone Number:</span>
                    <p className="font-medium">{selectedWasherDetails.phone_number || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">CNIC:</span>
                    <p className="font-medium">{selectedWasherDetails.cnic_id || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Service Area:</span>
                    <p className="font-medium">{selectedWasherDetails.service_area || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium">{selectedWasherDetails.status ? selectedWasherDetails.status.replace('_', ' ') : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Make:</span>
                    <p className="font-medium">
                      {selectedWasherDetails.vehicle_details && typeof selectedWasherDetails.vehicle_details === 'object'
                        ? (selectedWasherDetails.vehicle_details.make || selectedWasherDetails.vehicle_details.vehicle_type || 'Not set')
                        : (selectedWasherDetails.vehicle_details || 'Not set')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Model:</span>
                    <p className="font-medium">
                      {selectedWasherDetails.vehicle_details && typeof selectedWasherDetails.vehicle_details === 'object'
                        ? (selectedWasherDetails.vehicle_details.model || selectedWasherDetails.vehicle_details.vehicle_model || 'Not set')
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Year:</span>
                    <p className="font-medium">
                      {selectedWasherDetails.vehicle_details && typeof selectedWasherDetails.vehicle_details === 'object' && selectedWasherDetails.vehicle_details.year
                        ? selectedWasherDetails.vehicle_details.year
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">License Plate:</span>
                    <p className="font-medium">
                      {selectedWasherDetails.vehicle_details && typeof selectedWasherDetails.vehicle_details === 'object'
                        ? (selectedWasherDetails.vehicle_details.license_plate || 'Not set')
                        : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Account Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Email Verified:</span>
                    <p className="font-medium">{selectedWasherDetails.email_verified ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Role:</span>
                    <p className="font-medium">{selectedWasherDetails.role ? selectedWasherDetails.role.replace('_', ' ') : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created At:</span>
                    <p className="font-medium">
                      {selectedWasherDetails.created_at ? new Date(selectedWasherDetails.created_at).toLocaleString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Login:</span>
                    <p className="font-medium">
                      {selectedWasherDetails.last_login ? new Date(selectedWasherDetails.last_login).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setShowWasherDetailsModal(false)}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Smart Assign Washer Modal */}
      {assigningBookingId && (
        <AssignWasherModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setAssigningBookingId(null);
          }}
          bookingId={assigningBookingId}
          onAssignmentComplete={handleAssignmentComplete}
        />
      )}
    </div>
  );
}