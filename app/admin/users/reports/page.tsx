'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function UserReports() {
  const [reportType, setReportType] = useState('overview');

  // Sample data for reports
  const userData = [
    { name: 'Jan', customers: 45, washers: 12, admins: 2 },
    { name: 'Feb', customers: 52, washers: 15, admins: 2 },
    { name: 'Mar', customers: 48, washers: 18, admins: 2 },
    { name: 'Apr', customers: 61, washers: 14, admins: 2 },
    { name: 'May', customers: 55, washers: 16, admins: 2 },
    { name: 'Jun', customers: 67, washers: 20, admins: 2 },
  ];

  const statusData = [
    { name: 'Active', value: 75 },
    { name: 'Inactive', value: 15 },
    { name: 'Suspended', value: 10 },
  ];

  const roleData = [
    { name: 'Customers', value: 85 },
    { name: 'Washers', value: 12 },
    { name: 'Admins', value: 3 },
  ];

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">User Reports</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={reportType === 'overview' ? 'default' : 'outline'}
            onClick={() => setReportType('overview')}
            className="text-xs sm:text-sm h-8 sm:h-10"
          >
            Overview
          </Button>
          <Button
            variant={reportType === 'growth' ? 'default' : 'outline'}
            onClick={() => setReportType('growth')}
            className="text-xs sm:text-sm h-8 sm:h-10"
          >
            Growth
          </Button>
          <Button
            variant={reportType === 'status' ? 'default' : 'outline'}
            onClick={() => setReportType('status')}
            className="text-xs sm:text-sm h-8 sm:h-10"
          >
            Status
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">User Registration Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} minHeight={150}>
              <BarChart data={userData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="customers" fill="#3B82F6" name="Customers" />
                <Bar dataKey="washers" fill="#10B981" name="Washers" />
                <Bar dataKey="admins" fill="#8B5CF6" name="Admins" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">User Status Distribution</CardTitle>
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
          <CardTitle className="text-sm sm:text-base">User Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={150}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
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
              Export Users (CSV)
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm h-8 sm:h-10">
              Export Users (PDF)
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm h-8 sm:h-10">
              Export Growth Report (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}