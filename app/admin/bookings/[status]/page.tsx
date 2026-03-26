'use client';

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
import { getBookingsByStatus } from '@/lib/api';
import { Booking } from '@/types';
import { useParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function BookingsByStatus() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const status = params?.status as string;
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [status]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getBookingsByStatus(status.toUpperCase());
      setBookings(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to fetch ${status} bookings`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedBooking(null);
  };

  if (loading) return <div className="p-6">Loading {status} bookings...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  const getTitle = () => {
    switch(status.toLowerCase()) {
      case 'pending': return 'Pending Bookings';
      case 'completed': return 'Completed Bookings';
      case 'cancelled': return 'Cancelled Bookings';
      case 'accepted': return 'Accepted Bookings';
      case 'in_progress': return 'In Progress Bookings';
      default: return `${status.charAt(0).toUpperCase() + status.slice(1)} Bookings`;
    }
  };

  const getStatusDisplay = (bookingStatus: string) => {
    switch(bookingStatus.toLowerCase()) {
      case 'pending': return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
      case 'accepted': return { text: 'Accepted', color: 'bg-blue-100 text-blue-800' };
      case 'in_progress': return { text: 'In Progress', color: 'bg-purple-100 text-purple-800' };
      case 'completed': return { text: 'Completed', color: 'bg-green-100 text-green-800' };
      case 'cancelled': return { text: 'Cancelled', color: 'bg-red-100 text-red-800' };
      default: return { text: bookingStatus, color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{getTitle()}</h1>
        <Button onClick={fetchBookings}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{getTitle()} List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Booking Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">#{booking.id}</TableCell>
                  <TableCell>{booking.customer_id}</TableCell>
                  <TableCell>{booking.service_type}</TableCell>
                  <TableCell>{booking.vehicle_type}</TableCell>
                  <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusDisplay(booking.status).color}`}>
                      {getStatusDisplay(booking.status).text}
                    </span>
                  </TableCell>
                  <TableCell>${booking.total_amount?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleViewDetails(booking)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <Dialog open={showDetailsModal} onOpenChange={closeModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Booking Details - #{selectedBooking.id}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold text-base mb-3 text-gray-900">Booking Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Booking ID</span>
                        <span className="font-medium text-gray-900">#{selectedBooking.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Customer</span>
                        <span className="font-medium text-gray-900">{selectedBooking.customer_name || `Customer ${selectedBooking.customer_id}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Service Type</span>
                        <span className="font-medium text-gray-900">{selectedBooking.service_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Vehicle Type</span>
                        <span className="font-medium text-gray-900 capitalize">{selectedBooking.vehicle_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Booking Date</span>
                        <span className="font-medium text-gray-900">
                          {selectedBooking.date || new Date(selectedBooking.booking_date).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedBooking.time && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Booking Time</span>
                          <span className="font-medium text-gray-900">{selectedBooking.time}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusDisplay(selectedBooking.status).color}`}>
                          {getStatusDisplay(selectedBooking.status).text}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Total Amount</span>
                        <span className="font-medium text-gray-900">${selectedBooking.total_amount?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.selected_services_text && (
                    <div className="bg-white border rounded-lg p-4">
                      <h3 className="font-semibold text-base mb-3 text-gray-900">Selected Services</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200">
                          {typeof selectedBooking.selected_services_text === 'string'
                            ? selectedBooking.selected_services_text
                            : JSON.stringify(selectedBooking.selected_services_text)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {selectedBooking.assignment_status && (
                    <div className="bg-white border rounded-lg p-4">
                      <h3 className="font-semibold text-base mb-3 text-gray-900">Assignment Details</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Required Washers</span>
                          <span className="font-medium text-gray-900">{selectedBooking.required_washers || 1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Assigned Washers</span>
                          <span className="font-medium text-gray-900">
                            {selectedBooking.assignment_status.confirmed_count}/{selectedBooking.assignment_status.total_required}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Confirmation Status</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            selectedBooking.assignment_status.confirmed_count >= selectedBooking.assignment_status.total_required
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedBooking.assignment_status.confirmed_count >= selectedBooking.assignment_status.total_required
                              ? 'All accepted'
                              : 'Waiting for acceptances'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold text-base mb-3 text-gray-900">Timestamps</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Created</span>
                        <span className="font-medium text-gray-900">{new Date(selectedBooking.created_at).toLocaleString()}</span>
                      </div>
                      {selectedBooking.assigned_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Assigned</span>
                          <span className="font-medium text-gray-900">{new Date(selectedBooking.assigned_at).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedBooking.accepted_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Accepted</span>
                          <span className="font-medium text-gray-900">{new Date(selectedBooking.accepted_at).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedBooking.completed_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Completed</span>
                          <span className="font-medium text-gray-900">{new Date(selectedBooking.completed_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t mt-6">
              <Button onClick={closeModal}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}