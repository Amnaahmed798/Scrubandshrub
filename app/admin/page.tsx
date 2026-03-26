'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/lib/api';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardStats();
        setDashboardData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const bookingGrowth = dashboardData?.analytics_data?.length > 1
    ? Math.round(((dashboardData.analytics_data[dashboardData.analytics_data.length - 1]?.bookings || 0) - (dashboardData.analytics_data[0]?.bookings || 0)) / (dashboardData.analytics_data[0]?.bookings || 1) * 100)
    : 0;

  const revenueGrowth = dashboardData?.analytics_data?.length > 1
    ? Math.round(((dashboardData.analytics_data[dashboardData.analytics_data.length - 1]?.revenue || 0) - (dashboardData.analytics_data[0]?.revenue || 0)) / (dashboardData.analytics_data[0]?.revenue || 1) * 100)
    : 0;

  return (
    <div className="w-full overflow-x-hidden p-2 sm:p-3 md:p-4 space-y-3">
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-2 sm:p-3">
            <CardTitle className="text-[0.6rem] sm:text-xs font-medium">Total Users</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 opacity-80" />
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
            <div className="text-base sm:text-lg font-bold">{dashboardData?.total_users || 0}</div>
            <p className="text-[0.55rem] sm:text-xs opacity-80 mt-0.5">Active users</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-2 sm:p-3">
            <CardTitle className="text-[0.6rem] sm:text-xs font-medium">Total Bookings</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 opacity-80" />
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
            <div className="text-base sm:text-lg font-bold">{dashboardData?.total_bookings || 0}</div>
            <p className="text-[0.55rem] sm:text-xs opacity-80 mt-0.5">{bookingGrowth >= 0 ? '+' : ''}{bookingGrowth}%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-2 sm:p-3">
            <CardTitle className="text-[0.6rem] sm:text-xs font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 opacity-80" />
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
            <div className="text-base sm:text-lg font-bold">${dashboardData?.total_revenue?.toFixed(2) || '0.00'}</div>
            <p className="text-[0.55rem] sm:text-xs opacity-80 mt-0.5">{revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-2 sm:p-3">
            <CardTitle className="text-[0.6rem] sm:text-xs font-medium">Active Services</CardTitle>
            <Wrench className="h-3 w-3 sm:h-4 sm:w-4 opacity-80" />
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
            <div className="text-base sm:text-lg font-bold">{dashboardData?.active_services || 0}</div>
            <p className="text-[0.55rem] sm:text-xs opacity-80 mt-0.5">{dashboardData?.pending_services || 0} pending</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-2 sm:p-3">
            <CardTitle className="text-[0.6rem] sm:text-xs font-medium">Completed Jobs</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 opacity-80" />
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
            <div className="text-base sm:text-lg font-bold">{dashboardData?.completed_jobs || 0}</div>
            <p className="text-[0.55rem] sm:text-xs opacity-80 mt-0.5">Today completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Card>
          <CardHeader className="p-2 sm:p-3">
            <CardTitle className="text-xs sm:text-sm">Bookings Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={160} minWidth={260} minHeight={130}>
                <LineChart data={dashboardData?.analytics_data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={8} tick={{ fontSize: 8 }} />
                  <YAxis fontSize={8} tick={{ fontSize: 8 }} width={25} />
                  <Tooltip contentStyle={{ fontSize: 9 }} />
                  <Line type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-2 sm:p-3">
            <CardTitle className="text-xs sm:text-sm">Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={160} minWidth={260} minHeight={130}>
                <BarChart data={dashboardData?.analytics_data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={8} tick={{ fontSize: 8 }} />
                  <YAxis fontSize={8} tick={{ fontSize: 8 }} width={25} />
                  <Tooltip contentStyle={{ fontSize: 9 }} />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Card>
          <CardHeader className="p-2 sm:p-3">
            <CardTitle className="text-xs sm:text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">
            <div className="space-y-1.5">
              {dashboardData?.status_counts ? (
                (Object.entries(dashboardData.status_counts) as [string, number][]).map(([status, count], index) => (
                  <div key={index} className="flex items-center justify-between p-1.5 sm:p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${
                          status === 'PENDING' ? 'bg-blue-500' :
                          status === 'COMPLETED' ? 'bg-emerald-500' :
                          status === 'CANCELLED' ? 'bg-red-500' :
                          status === 'IN_PROGRESS' ? 'bg-amber-500' :
                          status === 'ACCEPTED' ? 'bg-indigo-500' :
                          status === 'ASSIGNED' ? 'bg-purple-500' : 'bg-gray-500'
                        }`}></div>
                      </div>
                      <span className="text-[0.6rem] sm:text-xs truncate">Booking {status.toLowerCase()}: {count}</span>
                    </div>
                    <span className="text-[0.55rem] sm:text-xs text-gray-500 flex-shrink-0">Now</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-gray-500 text-xs sm:text-sm">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-2 sm:p-3">
            <CardTitle className="text-xs sm:text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button className="text-left p-1.5 sm:p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                <div className="font-medium text-emerald-800 text-[0.6rem] sm:text-xs leading-tight">Add Service</div>
                <div className="text-[0.5rem] sm:text-xs text-emerald-600 mt-0.5 hidden sm:block">Add new service</div>
              </button>
              <button className="text-left p-1.5 sm:p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium text-blue-800 text-[0.6rem] sm:text-xs leading-tight">Bookings</div>
                <div className="text-[0.5rem] sm:text-xs text-blue-600 mt-0.5 hidden sm:block">Manage bookings</div>
              </button>
              <button className="text-left p-1.5 sm:p-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium text-purple-800 text-[0.6rem] sm:text-xs leading-tight">Carousel</div>
                <div className="text-[0.5rem] sm:text-xs text-purple-600 mt-0.5 hidden sm:block">Update images</div>
              </button>
              <button className="text-left p-1.5 sm:p-2 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                <div className="font-medium text-amber-800 text-[0.6rem] sm:text-xs leading-tight">Reports</div>
                <div className="text-[0.5rem] sm:text-xs text-amber-600 mt-0.5 hidden sm:block">Export analytics</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
