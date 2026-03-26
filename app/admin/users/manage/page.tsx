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
import { getUsers, updateUserStatus, deleteUser } from '@/lib/api';
import { User } from '@/types';
import UserModal from '@/components/admin/UserModal';

export default function ManageAccounts() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      let allUsers = response.data;

      // Apply role filter if not 'all'
      if (roleFilter !== 'all') {
        allUsers = allUsers.filter((user: User) => user.role === roleFilter);
      }

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

  const handleUpdateUserStatus = async (id: string, newStatus: string) => {
    try {
      await updateUserStatus(id, newStatus);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete user');
      }
    }
  };

  const handleSaveUser = (savedUser: User) => {
    if (editingUser && editingUser.id === savedUser.id) {
      // Update the specific user in the list
      setUsers(prevUsers =>
        prevUsers.map(user => user.id === savedUser.id ? savedUser : user)
      );
    } else {
      // Add new user to the list
      setUsers(prevUsers => [...prevUsers, savedUser]);
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleApproveWasher = async (userId: string) => {
    try {
      await updateUserStatus(userId, 'APPROVED');
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve washer');
    }
  };

  const handleRejectWasher = async (userId: string) => {
    try {
      await updateUserStatus(userId, 'REJECTED');
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject washer');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
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
      <div className="flex flex-row gap-2 items-center">
        <h1 className="text-base sm:text-xl font-bold flex-1">Manage Accounts</h1>
        <Button onClick={handleCreateUser} className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 whitespace-nowrap">Add User</Button>
      </div>
      <div className="flex flex-row gap-2">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-2 sm:px-3 py-1.5 sm:py-2 border rounded-md text-xs sm:text-sm flex-1"
        />
      </div>

      <div className="flex flex-row gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-medium whitespace-nowrap">Role:</span>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="flex-1 text-xs h-8">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Roles</SelectItem>
              <SelectItem value="CUSTOMER" className="text-xs">Customer</SelectItem>
              <SelectItem value="WASHER" className="text-xs">Washer</SelectItem>
              <SelectItem value="ADMIN" className="text-xs">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-medium whitespace-nowrap">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 text-xs h-8">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Status</SelectItem>
              <SelectItem value="ACTIVE" className="text-xs">Active</SelectItem>
              <SelectItem value="INACTIVE" className="text-xs">Inactive</SelectItem>
              <SelectItem value="SUSPENDED" className="text-xs">Suspended</SelectItem>
              <SelectItem value="PENDING_APPROVAL" className="text-xs">Pending</SelectItem>
              <SelectItem value="APPROVED" className="text-xs">Approved</SelectItem>
              <SelectItem value="REJECTED" className="text-xs">Rejected</SelectItem>
              <SelectItem value="BLOCKED" className="text-xs">Blocked</SelectItem>
              <SelectItem value="ADMIN_ACTIVE" className="text-xs">Admin Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
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
                  <TableHead className="whitespace-nowrap">Details</TableHead>
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
                        user.status === 'ACTIVE' || user.status === 'APPROVED' || user.status === 'ADMIN_ACTIVE'? 'bg-green-100 text-green-800' :
                        user.status === 'INACTIVE' || user.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                        user.status === 'SUSPENDED' || user.status === 'REJECTED' ? 'bg-yellow-100 text-yellow-800' :
                        user.status === 'PENDING_APPROVAL' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {user.role === 'WASHER' && (
                        <div className="text-xs">
                          <div>Area: {user.service_area || 'N/A'}</div>
                          <div>Phone: {user.phone_number || 'N/A'}</div>
                          <div>CNIC: {user.cnic_id || 'N/A'}</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 min-w-[200px]">
                        {user.role === 'WASHER' && user.status === 'PENDING_APPROVAL' && (
                          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => handleApproveWasher(user.id.toString())}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => handleRejectWasher(user.id.toString())}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        <Select
                          value={user.status}
                          onValueChange={(value) => handleUpdateUserStatus(user.id.toString(), value)}
                        >
                          <SelectTrigger className="w-full sm:w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                            {user.role === 'WASHER' && (
                              <>
                                <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                              </>
                            )}
                            <SelectItem value="BLOCKED">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => handleDeleteUser(user.id.toString())}
                        >
                          Delete
                        </Button>
                      </div>
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
                      user.status === 'ACTIVE' || user.status === 'APPROVED' || user.status === 'ADMIN_ACTIVE'? 'bg-green-100 text-green-800' :
                      user.status === 'INACTIVE' || user.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                      user.status === 'SUSPENDED' || user.status === 'REJECTED' ? 'bg-yellow-100 text-yellow-800' :
                      user.status === 'PENDING_APPROVAL' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                  {user.role === 'WASHER' && (
                    <div className="mt-1 text-[10px] space-y-0.5">
                      <div>Area: {user.service_area || 'N/A'}</div>
                      <div>Phone: {user.phone_number || 'N/A'}</div>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  {user.role === 'WASHER' && user.status === 'PENDING_APPROVAL' && (
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full text-xs h-7"
                        onClick={() => handleApproveWasher(user.id.toString())}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full text-xs h-7"
                        onClick={() => handleRejectWasher(user.id.toString())}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  <Select
                    value={user.status}
                    onValueChange={(value) => handleUpdateUserStatus(user.id.toString(), value)}
                  >
                    <SelectTrigger className="w-full text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      {user.role === 'WASHER' && (
                        <>
                          <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </>
                      )}
                      <SelectItem value="BLOCKED">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleDeleteUser(user.id.toString())}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found. {searchTerm ? 'Try a different search term.' : 'Add a new user to get started.'}
            </div>
          )}
        </CardContent>
      </Card>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  );
}