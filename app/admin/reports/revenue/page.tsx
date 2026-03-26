'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function RevenueReports() {
  const [reportType, setReportType] = useState('overview');

  // Sample data for reports
  const revenueData = [
    { name: 'Jan', revenue: 4500, expenses: 2000, profit: 2500 },
    { name: 'Feb', revenue: 5200, expenses: 2200, profit: 3000 },
    { name: 'Mar', revenue: 4800, expenses: 1800, profit: 3000 },
    { name: 'Apr', revenue: 6100, expenses: 2500, profit: 3600 },
    { name: 'May', revenue: 5500, expenses: 2100, profit: 3400 },
    { name: 'Jun', revenue: 6700, expenses: 2800, profit: 3900 },
  ];

  const serviceRevenueData = [
    { name: 'Basic Wash', revenue: 2500 },
    { name: 'Premium Wash', revenue: 3000 },
    { name: 'Deluxe Wash', revenue: 2800 },
    { name: 'Seat Cleaning', revenue: 1500 },
    { name: 'Carpet Detailing', revenue: 800 },
  ];

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Revenue Reports</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={reportType === 'overview' ? 'default' : 'outline'}
            onClick={() => setReportType('overview')}
            className="text-xs sm:text-sm h-8 sm:h-10"
          >
            Overview
          </Button>
          <Button
            variant={reportType === 'monthly' ? 'default' : 'outline'}
            onClick={() => setReportType('monthly')}
            className="text-xs sm:text-sm h-8 sm:h-10"
          >
            Monthly
          </Button>
          <Button
            variant={reportType === 'service' ? 'default' : 'outline'}
            onClick={() => setReportType('service')}
            className="text-xs sm:text-sm h-8 sm:h-10"
          >
            By Service
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Monthly Revenue & Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} minHeight={150}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                <Bar dataKey="profit" fill="#3B82F6" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} minHeight={150}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Revenue by Service</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={150}>
            <BarChart data={serviceRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
            <Button variant="outline" className="text-xs sm:text-sm h-8 sm:h-10">
              Export Revenue (CSV)
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm h-8 sm:h-10">
              Export Revenue (PDF)
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm h-8 sm:h-10">
              Export Profit Report (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}