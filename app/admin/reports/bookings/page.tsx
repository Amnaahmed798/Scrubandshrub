'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function BookingReports() {
  const [reportType, setReportType] = useState('overview');

  // Sample data for reports
  const bookingData = [
    { name: 'Jan', bookings: 45, revenue: 4500 },
    { name: 'Feb', bookings: 52, revenue: 5200 },
    { name: 'Mar', bookings: 48, revenue: 4800 },
    { name: 'Apr', bookings: 61, revenue: 6100 },
    { name: 'May', bookings: 55, revenue: 5500 },
    { name: 'Jun', bookings: 67, revenue: 6700 },
  ];

  const statusData = [
    { name: 'Completed', value: 75 },
    { name: 'Pending', value: 15 },
    { name: 'Cancelled', value: 10 },
  ];

  const serviceData = [
    { name: 'Basic Wash', value: 35 },
    { name: 'Premium Wash', value: 25 },
    { name: 'Deluxe Wash', value: 20 },
    { name: 'Seat Cleaning', value: 15 },
    { name: 'Carpet Detailing', value: 5 },
  ];

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Booking Reports</h1>
        <div className="flex gap-2">
          <Button
            variant={reportType === 'overview' ? 'default' : 'outline'}
            onClick={() => setReportType('overview')}
          >
            Overview
          </Button>
          <Button
            variant={reportType === 'trends' ? 'default' : 'outline'}
            onClick={() => setReportType('trends')}
          >
            Trends
          </Button>
          <Button
            variant={reportType === 'status' ? 'default' : 'outline'}
            onClick={() => setReportType('status')}
          >
            Status Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Bookings Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#3B82F6" name="Bookings" />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Popularity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {serviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">
              Export Bookings (CSV)
            </Button>
            <Button variant="outline">
              Export Bookings (PDF)
            </Button>
            <Button variant="outline">
              Export Status Report (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}