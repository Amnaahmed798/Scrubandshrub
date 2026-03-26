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
import { getUsers, getUserById } from '@/lib/api';
import { User, UserDetailsData } from '@/types';
import { ApiResponse } from '@/lib/api';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all'); // 'all', 'washers', 'customers'
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userDetails, setUserDetails] = useState<ApiResponse<UserDetailsData> | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [activeTab, statusFilter]); // Removed roleFilter since we use activeTab

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      let allUsers = response.data;

      // Apply tab filter (role-based)
      if (activeTab === 'washers') {
        allUsers = allUsers.filter((user: User) => user.role === 'WASHER');
      } else if (activeTab === 'customers') {
        allUsers = allUsers.filter((user: User) => user.role === 'CUSTOMER');
      }
      // 'all' tab shows all users

      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        allUsers = allUsers.filter((user: User) => user.status === statusFilter);
      }

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        allUsers = allUsers.filter((user: User) =>
          user.full_name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.id.toString().includes(term)
        );
      }

      setUsers(allUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (user: User) => {
    try {
      setSelectedUser(user);
      setShowDetailsModal(true);
      // Fetch detailed user info with booking stats
      const details = await getUserById(user.id);
      setUserDetails(details);
    } catch (err) {
      console.error('Error fetching user details:', err);
      alert('Failed to load user details');
    }
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
    setUserDetails(null);
  };

  // Filter users based on search term - ensure users is an array
  const filteredUsers = Array.isArray(users) ? users.filter((user: User) =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toString().includes(searchTerm)
  ) : [];

  if (loading) return <div className="p-6">Loading users...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-3 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
        <h1 className="text-base sm:text-xl font-bold">User Management</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 border rounded-md text-xs sm:text-sm w-full sm:w-auto"
          />
          <Link href="/admin/users/manage" passHref>
            <Button className="text-xs sm:text-sm h-8 sm:h-9 px-3">Manage Accounts</Button>
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-1 overflow-x-auto pb-1">
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('all')}
            className="text-xs whitespace-nowrap px-2 sm:px-3 h-8"
          >
            All Users
          </Button>
          <Button
            variant={activeTab === 'washers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('washers')}
            className="text-xs whitespace-nowrap px-2 sm:px-3 h-8"
          >
            Washers
          </Button>
          <Button
            variant={activeTab === 'customers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('customers')}
            className="text-xs whitespace-nowrap px-2 sm:px-3 h-8"
          >
            Customers
          </Button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium whitespace-nowrap">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 sm:w-[150px] text-xs h-8">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Status</SelectItem>
              <SelectItem value="ACTIVE" className="text-xs">Active</SelectItem>
              <SelectItem value="INACTIVE" className="text-xs">Inactive</SelectItem>
              <SelectItem value="SUSPENDED" className="text-xs">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'all' && `All Users (${filteredUsers.length})`}
            {activeTab === 'washers' && `All Washers (${filteredUsers.length})`}
            {activeTab === 'customers' && `All Customers (${filteredUsers.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">User ID</TableHead>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">Role</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Joined Date</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium whitespace-nowrap">#{user.id}</TableCell>
                    <TableCell className="whitespace-nowrap">{user.full_name}</TableCell>
                    <TableCell className="min-w-[150px] break-words">{user.email}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'WASHER' ? 'bg-emerald-100 text-emerald-800' :
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        user.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                        user.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Button
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                        className="text-xs h-8"
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-2">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">#{user.id} - {user.full_name}</div>
                    <div className="text-xs text-gray-600 mt-1 truncate">{user.email}</div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      user.role === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'WASHER' ? 'bg-emerald-100 text-emerald-800' :
                      user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      user.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                      user.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleViewDetails(user)}
                    className="text-xs h-7 w-full"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found. {searchTerm ? 'Try a different search term.' : 'No users in the system.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <Dialog open={showDetailsModal} onOpenChange={closeModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-gray-700">{selectedUser.full_name}</p>
                  <p className="text-sm font-normal text-gray-500">{selectedUser.email}</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {userDetails ? (
              <div className="space-y-6 py-4">
                {/* Status Badges Row */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedUser.role === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' :
                    selectedUser.role === 'WASHER' ? 'bg-emerald-100 text-emerald-800' :
                    selectedUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedUser.role}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedUser.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    selectedUser.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                    selectedUser.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedUser.status}
                  </span>
                  {selectedUser.email_verified && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      ✓ Email Verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Personal & Contact Info */}
                  <div className="space-y-4">
                    {/* Personal Information Card */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <h3 className="font-semibold text-base mb-3 text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Personal Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-gray-500">Full Name</span>
                          <span className="font-medium text-gray-900 text-right">{selectedUser.full_name}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-gray-500">Email</span>
                          <span className="font-medium text-gray-900 text-right break-all max-w-[200px]">{selectedUser.email}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-gray-500">Joined</span>
                          <span className="font-medium text-gray-900">{new Date(selectedUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        {selectedUser.last_login && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-gray-500">Last Login</span>
                            <span className="font-medium text-gray-900">{new Date(selectedUser.last_login).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact & Location Card */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <h3 className="font-semibold text-base mb-3 text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Contact & Location
                      </h3>
                      <div className="space-y-3">
                        {selectedUser.phone_number && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-gray-500">Phone</span>
                            <span className="font-medium text-gray-900">{selectedUser.phone_number}</span>
                          </div>
                        )}
                        {selectedUser.cnic_id && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-gray-500">CNIC</span>
                            <span className="font-medium text-gray-900">{selectedUser.cnic_id}</span>
                          </div>
                        )}
                        {selectedUser.service_area && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-gray-500">Service Area</span>
                            <span className="font-medium text-gray-900 text-right max-w-[200px]">{selectedUser.service_area}</span>
                          </div>
                        )}
                        {!selectedUser.phone_number && !selectedUser.cnic_id && !selectedUser.service_area && (
                          <p className="text-sm text-gray-500 italic">No contact information provided</p>
                        )}
                      </div>
                    </div>

                    {/* Vehicle Information Card (for washers) */}
                    {selectedUser.role === 'WASHER' && selectedUser.vehicle_details && (
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold text-base mb-3 text-gray-900 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                          </svg>
                          Vehicle Information
                        </h3>
                        <div className="space-y-3">
                          {typeof selectedUser.vehicle_details === 'object' ? (
                            <>
                              {selectedUser.vehicle_details.make && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Make</span>
                                  <span className="font-medium text-gray-900">{selectedUser.vehicle_details.make}</span>
                                </div>
                              )}
                              {(selectedUser.vehicle_details.model || selectedUser.vehicle_details.vehicle_model) && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Model</span>
                                  <span className="font-medium text-gray-900">
                                    {selectedUser.vehicle_details.model || selectedUser.vehicle_details.vehicle_model}
                                  </span>
                                </div>
                              )}
                              {selectedUser.vehicle_details.vehicle_type && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Vehicle Type</span>
                                  <span className="font-medium text-gray-900">{selectedUser.vehicle_details.vehicle_type}</span>
                                </div>
                              )}
                              {selectedUser.vehicle_details.license_plate && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">License Plate</span>
                                  <span className="font-medium text-gray-900">{selectedUser.vehicle_details.license_plate}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-gray-600">{selectedUser.vehicle_details}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Statistics */}
                  <div className="space-y-4">
                    {userDetails.data && userDetails.data.booking_stats && (
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold text-base mb-4 text-gray-900 flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          {selectedUser.role === 'CUSTOMER' ? 'Booking Statistics' : 'Work Statistics'}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedUser.role === 'CUSTOMER' ? (
                            <>
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-600 font-medium">Total Bookings</p>
                                <p className="text-2xl font-bold text-blue-900">{userDetails.data.booking_stats.total_bookings}</p>
                              </div>
                              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                <p className="text-sm text-green-600 font-medium">Completed</p>
                                <p className="text-2xl font-bold text-green-900">{userDetails.data.booking_stats.completed_bookings}</p>
                              </div>
                              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                                <p className="text-sm text-amber-600 font-medium">Pending</p>
                                <p className="text-2xl font-bold text-amber-900">{userDetails.data.booking_stats.pending_bookings}</p>
                              </div>
                              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                                <p className="text-sm text-purple-600 font-medium">Total Spent</p>
                                <p className="text-2xl font-bold text-purple-900">${(userDetails.data.booking_stats.total_spent || 0).toFixed(2)}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-600 font-medium">Total Assigned</p>
                                <p className="text-2xl font-bold text-blue-900">{userDetails.data.booking_stats.total_assigned}</p>
                              </div>
                              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                                <p className="text-sm text-amber-600 font-medium">In Progress</p>
                                <p className="text-2xl font-bold text-amber-900">{userDetails.data.booking_stats.accepted_or_in_progress}</p>
                              </div>
                              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                <p className="text-sm text-green-600 font-medium">Completed</p>
                                <p className="text-2xl font-bold text-green-900">{userDetails.data.booking_stats.completed_bookings}</p>
                              </div>
                              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                                <p className="text-sm text-indigo-600 font-medium">Completion Rate</p>
                                <p className="text-2xl font-bold text-indigo-900">{userDetails.data.booking_stats.completion_rate}%</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Account Information Card */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <h3 className="font-semibold text-base mb-3 text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Account Information
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">User ID</span>
                          <span className="font-mono text-gray-900 text-xs max-w-[150px] truncate">{selectedUser.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Account Type</span>
                          <span className="font-medium text-gray-900">{selectedUser.role}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedUser.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            selectedUser.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                            selectedUser.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedUser.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Bookings */}
                {userDetails.data && userDetails.data.recent_bookings && userDetails.data.recent_bookings.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">Recent Bookings</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {userDetails.data.recent_bookings.slice(0, 5).map((booking: any) => (
                            <tr key={booking.id}>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                  booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                  booking.status === 'PENDING' || booking.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
                                  booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">{booking.service_type}</td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                ${(booking.total_amount || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {userDetails.data.recent_bookings.length > 5 && (
                        <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 text-center">
                          Showing 5 of {userDetails.data.recent_bookings.length} bookings
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* User ID */}
                <div className="border-t pt-4 mt-6">
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">{selectedUser.id}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="ml-3 text-gray-600">Loading user details...</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t mt-6">
              <Button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
