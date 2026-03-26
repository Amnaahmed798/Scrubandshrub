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

export default function CanceledBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getBookingsByStatus('CANCELLED');
      setBookings(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch canceled bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading canceled bookings...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Canceled Bookings</h1>
        <Button onClick={fetchBookings}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canceled Bookings List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Cancellation Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">#{booking.id}</TableCell>
                  <TableCell>{booking.customer_id}</TableCell>
                  <TableCell>{booking.service_type}</TableCell>
                  <TableCell>{booking.vehicle_type}</TableCell>
                  <TableCell>
                    {booking.updated_at ? new Date(booking.updated_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                      {booking.status_note || 'Customer Cancellation'}
                    </span>
                  </TableCell>
                  <TableCell>${booking.total_amount?.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}