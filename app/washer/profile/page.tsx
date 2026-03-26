'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Car,
  Building,
  Save,
  Camera,
  MapPinIcon,
  Upload
} from 'lucide-react';
import { useWasherAuth } from '@/hooks/useWasherAuth';
import { WasherService } from '@/services/washerService';
import AppConfig from '@/config/app-config';

export default function WasherProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useWasherAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    service_area: '',
    latitude: null as number | null,
    longitude: null as number | null,
    profile_picture: '',
    vehicle_details: {
      vehicle_type: '',
      vehicle_model: '',
      equipment: [] as string[],
      license_plate: ''
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await WasherService.getWasherProfile();
      const userData = response.data;

      setProfile(userData);
      setFormData({
        full_name: userData.full_name || '',
        phone_number: userData.phone_number || '',
        service_area: userData.service_area || '',
        latitude: userData.latitude || null,
        longitude: userData.longitude || null,
        profile_picture: userData.profile_picture || '',
        vehicle_details: userData.vehicle_details || {
          vehicle_type: '',
          vehicle_model: '',
          equipment: [],
          license_plate: ''
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('vehicle_')) {
      const vehicleField = name.replace('vehicle_', '') as keyof typeof formData.vehicle_details;
      setFormData(prev => ({
        ...prev,
        vehicle_details: {
          ...prev.vehicle_details,
          [vehicleField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await WasherService.updateWasherProfile(formData);
      // Refresh profile data
      fetchProfile();
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const toggleAvailability = async () => {
    try {
      const availabilityData = {
        is_online: !profile?.availability_status?.includes('online'),
        reason: profile?.availability_status === 'offline' ? 'Available now' : 'Going offline'
      };
      await WasherService.updateWasherAvailability(availabilityData);
      // Refresh profile data
      fetchProfile();
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPG, PNG, GIF, or WebP');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File is too large. Maximum size is 5MB');
      return;
    }

    try {
      setUploadingPicture(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${AppConfig.getBackendUrl()}/api/v1/washer/profile/upload-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to upload picture');
      }

      const result = await response.json();
      // Refresh profile to show new picture
      fetchProfile();
      alert('Profile picture uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      alert(`Failed to upload picture: ${error.message}`);
    } finally {
      setUploadingPicture(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCameraButtonClick = () => {
    fileInputRef.current?.click();
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8"></div>
          <div className="space-y-6">
            <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal and professional information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    {profile?.profile_picture ? (
                      <img
                        src={profile.profile_picture}
                        alt={profile.full_name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center ${profile?.profile_picture ? 'hidden' : ''}`}>
                      <User className="w-12 h-12 text-gray-500" />
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute bottom-0 right-0 rounded-full"
                      onClick={handleCameraButtonClick}
                      disabled={uploadingPicture}
                    >
                      {uploadingPicture ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    {uploadingPicture ? 'Uploading...' : 'Click the camera to upload your photo'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF, or WebP (max 5MB)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Availability Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    Status:
                    <span className={`ml-2 font-medium ${profile?.availability_status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                      {profile?.availability_status || 'unknown'}
                    </span>
                  </span>
                  <Button
                    variant={profile?.availability_status === 'online' ? 'destructive' : 'default'}
                    size="sm"
                    onClick={toggleAvailability}
                  >
                    {profile?.availability_status === 'online' ? 'Go Offline' : 'Go Online'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            className="pl-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone_number"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleInputChange}
                            className="pl-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="service_area">Service Area</Label>
                        <div className="relative">
                          <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="service_area"
                            name="service_area"
                            value={formData.service_area}
                            onChange={handleInputChange}
                            className="pl-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <div className="relative">
                          <MapPinIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="latitude"
                            name="latitude"
                            type="number"
                            step="any"
                            value={formData.latitude || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                            placeholder="e.g., 24.7136"
                            className="pl-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <div className="relative">
                          <MapPinIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="longitude"
                            name="longitude"
                            type="number"
                            step="any"
                            value={formData.longitude || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                            placeholder="e.g., 46.6753"
                            className="pl-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile_picture">Profile Picture URL</Label>
                        <div className="relative">
                          <Camera className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="profile_picture"
                            name="profile_picture"
                            value={formData.profile_picture || ''}
                            onChange={handleInputChange}
                            placeholder="https://example.com/your-image.jpg"
                            className="pl-8"
                          />
                        </div>
                        {formData.profile_picture && (
                          <div classNamemt-2>
                            <img
                              src={formData.profile_picture}
                              alt="Profile preview"
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Enter a URL to your profile picture. Use a square image (recommended: 200x200px or larger).
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cnic_id">CNIC</Label>
                        <div className="relative">
                          <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="cnic_id"
                            value={profile?.cnic_id || ''}
                            readOnly
                            className="pl-8 opacity-50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            value={profile?.email || ''}
                            readOnly
                            className="pl-8 opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vehicle_type">Vehicle Type</Label>
                      <div className="relative">
                        <Car className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="vehicle_type"
                          name="vehicle_vehicle_type"
                          value={formData.vehicle_details.vehicle_type}
                          onChange={handleInputChange}
                          placeholder="e.g., Van, Truck, SUV"
                          className="pl-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vehicle_model">Vehicle Model</Label>
                      <div className="relative">
                        <Car className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="vehicle_model"
                          name="vehicle_vehicle_model"
                          value={formData.vehicle_details.vehicle_model}
                          onChange={handleInputChange}
                          placeholder="e.g., Toyota Hiace, Ford Transit"
                          className="pl-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="license_plate">License Plate</Label>
                      <div className="relative">
                        <Car className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="license_plate"
                          name="vehicle_license_plate"
                          value={formData.vehicle_details.license_plate}
                          onChange={handleInputChange}
                          placeholder="e.g., ABC 123"
                          className="pl-8"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditing(false);
                          // Reset form to original values
                          if (profile) {
                            setFormData({
                              full_name: profile.full_name || '',
                              phone_number: profile.phone_number || '',
                              service_area: profile.service_area || '',
                              latitude: profile.latitude || null,
                              longitude: profile.longitude || null,
                              profile_picture: profile.profile_picture || '',
                              vehicle_details: profile.vehicle_details || {
                                vehicle_type: '',
                                vehicle_model: '',
                                equipment: [],
                                license_plate: ''
                              }
                            });
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Full Name</Label>
                        <p className="font-medium">{profile?.full_name || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-medium">{profile?.email || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Phone Number</Label>
                        <p className="font-medium">{profile?.phone_number || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Service Area</Label>
                        <p className="font-medium">{profile?.service_area || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Profile Picture</Label>
                        <p className="font-medium">
                          {profile?.profile_picture ? (
                            <a href={profile.profile_picture} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              View Image
                            </a>
                          ) : (
                            'Not set'
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Location Coordinates</Label>
                        <p className="font-medium">
                          {profile?.latitude && profile?.longitude
                            ? `${profile.latitude.toFixed(6)}, ${profile.longitude.toFixed(6)}`
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">CNIC</Label>
                        <p className="font-medium">{profile?.cnic_id || 'Not set'}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-3">Vehicle Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Vehicle Type</Label>
                          <p className="font-medium">{profile?.vehicle_details?.vehicle_type || 'Not set'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Vehicle Model</Label>
                          <p className="font-medium">{profile?.vehicle_details?.vehicle_model || 'Not set'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">License Plate</Label>
                          <p className="font-medium">{profile?.vehicle_details?.license_plate || 'Not set'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={() => setEditing(true)}>
                        <Save className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
