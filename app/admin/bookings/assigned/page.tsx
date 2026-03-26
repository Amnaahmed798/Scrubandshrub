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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getBookings, updateBookingStatus, getAllWashers, assignBookingToWasher } from '@/lib/api';
import { Booking } from '@/types';

interface Washer {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  service_area: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AssignedBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [washers, setWashers] = useState<Washer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWashers, setLoadingWashers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedWashers, setSelectedWashers] = useState<string[]>([]);

  useEffect(() => {
    fetchBookings();
    fetchWashers();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getBookings();
      let allBookings = response.data;

      // Filter for assigned bookings only
      allBookings = allBookings.filter((booking: any) => booking.status === 'ASSIGNED');

      setBookings(allBookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchWashers = async () => {
    try {
      setLoadingWashers(true);
      const response = await getAllWashers();
      setWashers(response.data);
    } catch (err) {
      console.error('Failed to fetch washers:', err);
    } finally {
      setLoadingWashers(false);
    }
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleAssignWashers = async (bookingId: string) => {
    setSelectedBooking(bookings.find(b => b.id === bookingId));
    // Fetch washers when opening the assignment modal to ensure we have the latest data
    await fetchWashers();
    setShowAssignModal(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedBooking || selectedWashers.length === 0) {
      alert('Please select at least one washer to assign.');
      return;
    }

    try {
      // Call the API to assign the washers to the booking
      await assignBookingToWasher(selectedBooking.id, selectedWashers);

      // Refresh the bookings data to reflect the assignment
      await fetchBookings();
      await fetchWashers();

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

  if (loading || loadingWashers) return <div className="p-6">Loading assigned bookings and washers...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assigned Bookings</h1>
        <div className="text-sm text-gray-500">
          Showing {bookings.length} assigned booking{bookings.length !== 1 ? 's' : ''}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Bookings List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Team Size</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>View Details</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
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
                        booking.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                        booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{requiredTeamSize} washer{requiredTeamSize !== 1 ? 's' : ''}</Badge>
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
        </CardContent>
      </Card>

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
                      selectedBooking.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
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

              {/* Main Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Customer & Booking Info */}
                <div className="space-y-4">
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

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Service Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{new Date(selectedBooking.booking_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{selectedBooking.booking_time || 'N/A'}</span>
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
                </div>

                {/* Right Column - Location & Services */}
                <div className="space-y-4">
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
                </div>
              </div>

              {/* Assigned Washers Section */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Assigned Washers</h3>
                {selectedBooking.assigned_washers && selectedBooking.assigned_washers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedBooking.assigned_washers.map((washerId: string) => {
                      const washer = washers.find(w => w.id === washerId);
                      return washer ? (
                        <div key={washerId} className="bg-gray-100 rounded-lg p-3 min-w-[150px]">
                          <p className="font-medium text-sm">{washer.full_name}</p>
                          <p className="text-xs text-gray-600">{washer.service_area || 'Area not specified'}</p>
                        </div>
                      ) : (
                        <div key={washerId} className="bg-red-50 rounded-lg p-3 min-w-[150px] border border-red-200">
                          <p className="font-medium text-sm text-red-700">Unknown Washer</p>
                          <p className="text-xs text-red-600">{washerId}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No washers assigned to this booking yet</p>
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
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Washers Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Assign Washers to Booking</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="font-semibold text-lg mb-2">Booking Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Booking ID:</span>
                  <p className="font-medium">#{selectedBooking?.id}</p>
                </div>
                <div>
                  <span className="text-gray-500">Service Type:</span>
                  <p className="font-medium">{selectedBooking?.service_type}</p>
                </div>
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <p className="font-medium">{selectedBooking?.customer_name || `Customer ${selectedBooking?.customer_id}`}</p>
                </div>
                <div>
                  <span className="text-gray-500">Team Size:</span>
                  <p className="font-medium">{selectedBooking?.team_size || 1} washer{selectedBooking?.team_size !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Available Washers</h3>
              {loadingWashers ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-500">Loading washers...</p>
                </div>
              ) : washers.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {washers.map((washer) => (
                    <div
                      key={washer.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                        selectedWashers.includes(washer.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleWasherSelection(washer.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedWashers.includes(washer.id)}
                          onChange={() => {}}
                          className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-medium">{washer.full_name}</p>
                          <p className="text-sm text-gray-600">{washer.service_area || 'No service area specified'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        washer.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        washer.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                        washer.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {washer.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No washers available</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-1">Selected Washers</h4>
              <p className="text-sm text-blue-700">
                {selectedWashers.length > 0
                  ? `${selectedWashers.length} washer${selectedWashers.length !== 1 ? 's' : ''} selected`
                  : 'No washers selected'}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedWashers([]);
              }}
              className="px-6 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAssignment}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={selectedWashers.length === 0}
            >
              Assign Washers
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}