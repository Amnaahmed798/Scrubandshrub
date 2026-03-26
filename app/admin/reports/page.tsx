'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ReportsAnalytics() {
  const [reportType, setReportType] = useState('bookings');

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

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Reports & Analytics</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={reportType === 'bookings' ? 'default' : 'outline'}
            onClick={() => setReportType('bookings')}
            className="text-xs sm:text-sm h-8 sm:h-10"
          >
            Bookings
          </Button>
          <Button
            variant={reportType === 'revenue' ? 'default' : 'outline'}
            onClick={() => setReportType('revenue')}
            className="text-xs sm:text-sm h-8 sm:h-10"
          >
            Revenue
          </Button>
          <Button
            variant={reportType === 'users' ? 'default' : 'outline'}
            onClick={() => setReportType('users')}
            className="text-xs sm:text-sm h-8 sm:h-10"
          >
            Users
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} minHeight={150}>
              <BarChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#3B82F6" name="Bookings" />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Booking Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} minHeight={150}>
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
          <CardTitle className="text-sm sm:text-base">Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
            <Button variant="outline" className="text-xs sm:text-sm h-8 sm:h-10">
              Export Bookings (CSV)
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm h-8 sm:h-10">
              Export Revenue (CSV)
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm h-8 sm:h-10">
              Export Users (CSV)
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm h-8 sm:h-10">
              Export All (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}