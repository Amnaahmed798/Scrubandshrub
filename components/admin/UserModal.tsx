'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createUser, updateUser } from '@/lib/api';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any; // Existing user data for editing, undefined for creating
  onSave: (userData: any) => void;
}

export default function UserModal({ isOpen, onClose, user, onSave }: UserModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    phone_number: '',
    cnic_id: '',
    service_area: '',
    vehicle_details: {
      make: '',
      model: '',
      license_plate: ''
    },
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Editing existing user - parse vehicle_details if it's a dict
      let vehicle_details = { make: '', model: '', license_plate: '' };
      if (user.vehicle_details && typeof user.vehicle_details === 'object') {
        vehicle_details = {
          make: user.vehicle_details.get('make', '') || user.vehicle_details.get('vehicle_type', '') || '',
          model: user.vehicle_details.get('model', '') || user.vehicle_details.get('vehicle_model', '') || '',
          license_plate: user.vehicle_details.get('license_plate', '') || ''
        };
      }
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        role: user.role || 'CUSTOMER',
        status: user.status || 'ACTIVE',
        phone_number: user.phone_number || '',
        cnic_id: user.cnic_id || '',
        service_area: user.service_area || '',
        vehicle_details,
        password: '' // Don't prefill password for security
      });
    } else {
      // Creating new user
      setFormData({
        full_name: '',
        email: '',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        phone_number: '',
        cnic_id: '',
        service_area: '',
        vehicle_details: {
          make: '',
          model: '',
          license_plate: ''
        },
        password: ''
      });
      setErrors({});
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!user && !formData.password && !user?.id) { // Only require password for new users
      newErrors.password = 'Password is required for new users';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (user?.id) {
        // Update existing user
        const updatedUser = await updateUser(user.id, formData);
        onSave(updatedUser.data);
      } else {
        // Create new user
        const newUser = await createUser(formData);
        onSave(newUser.data);
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setErrors({ submit: error.message || 'Failed to save user' });
    } finally {
      setLoading(false);
    }
  };

  const title = user?.id ? 'Edit User' : 'Create New User';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter full name"
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {!user?.id && ( // Only show password field for new users
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleSelectChange('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="WASHER">Washer</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnic_id">CNIC ID</Label>
            <Input
              id="cnic_id"
              name="cnic_id"
              value={formData.cnic_id}
              onChange={handleChange}
              placeholder="Enter CNIC ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_area">Service Area</Label>
            <Input
              id="service_area"
              name="service_area"
              value={formData.service_area}
              onChange={handleChange}
              placeholder="Enter service area (e.g., Downtown, Karachi)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_make">Vehicle Details</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="vehicle_make" className="text-xs font-medium">Make</Label>
                <Input
                  id="vehicle_make"
                  name="vehicle_make"
                  value={formData.vehicle_details.make}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      vehicle_details: {
                        ...formData.vehicle_details,
                        make: e.target.value
                      }
                    });
                  }}
                  placeholder="e.g., Toyota"
                />
              </div>
              <div>
                <Label htmlFor="vehicle_model" className="text-xs font-medium">Model</Label>
                <Input
                  id="vehicle_model"
                  name="vehicle_model"
                  value={formData.vehicle_details.model}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      vehicle_details: {
                        ...formData.vehicle_details,
                        model: e.target.value
                      }
                    });
                  }}
                  placeholder="e.g., Hiace"
                />
              </div>
              <div>
                <Label htmlFor="vehicle_license_plate" className="text-xs font-medium">License Plate</Label>
                <Input
                  id="vehicle_license_plate"
                  name="vehicle_license_plate"
                  value={formData.vehicle_details.license_plate}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      vehicle_details: {
                        ...formData.vehicle_details,
                        license_plate: e.target.value
                      }
                    });
                  }}
                  placeholder="e.g., ABC-123"
                />
              </div>
            </div>
          </div>

          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (user?.id ? 'Updating...' : 'Creating...') : (user?.id ? 'Update User' : 'Create User')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}