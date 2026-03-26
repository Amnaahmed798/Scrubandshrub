'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Car,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function WasherDetailsPage() {
  const [washer, setWasher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();

  // Mock data for washer - in a real app, this would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockWasher = {
        id: params?.id || '1',
        full_name: 'Amna Ahmed',
        email: 'zohrazulfiqar759@gmail.com',
        phone_number: '+92-300-1234567',
        cnic_id: '12345-6789012-3',
        service_area: 'Karachi, Pakistan',
        status: 'APPROVED',
        vehicle_details: {
          vehicle_type: 'Van',
          vehicle_model: 'Toyota Hiace',
          license_plate: '918727'
        },
        created_at: '2024-01-15',
        last_active: '2024-01-20',
        total_completed_jobs: 24,
        rating: 4.8,
        total_earnings: 45600,
        verification_status: 'VERIFIED'
      };
      setWasher(mockWasher);
      setLoading(false);
    }, 500);
  }, [params]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!washer) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Washer Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The washer you're looking for doesn't exist or may have been removed.
            </p>
            <Button onClick={() => window.history.back()}>
              Back to Team
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="mb-4"
        >
          ← Back to Team
        </Button>
        <h1 className="text-3xl font-bold">Washer Details</h1>
        <p className="text-muted-foreground">
          Detailed information about {washer.full_name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Full Name</span>
                  </div>
                  <p className="font-medium">{washer.full_name}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <p className="font-medium">{washer.email}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>Phone Number</span>
                  </div>
                  <p className="font-medium">{washer.phone_number}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IdCard className="h-4 w-4" />
                    <span>CNIC</span>
                  </div>
                  <p className="font-medium">{washer.cnic_id}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Service Area</span>
                  </div>
                  <p className="font-medium">{washer.service_area}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4" />
                    <span>Verification</span>
                  </div>
                  <p className="font-medium capitalize">{washer.verification_status}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Car className="h-4 w-4" />
                    <span>Vehicle Type</span>
                  </div>
                  <p className="font-medium">{washer.vehicle_details?.vehicle_type}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Car className="h-4 w-4" />
                    <span>Model</span>
                  </div>
                  <p className="font-medium">{washer.vehicle_details?.vehicle_model}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Car className="h-4 w-4" />
                    <span>License Plate</span>
                  </div>
                  <p className="font-medium">{washer.vehicle_details?.license_plate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={getStatusBadgeVariant(washer.status)}>
                    {washer.status.replace('_', ' ')}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(washer.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Active</span>
                    <span>{new Date(washer.last_active).toLocaleDateString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed Jobs</span>
                    <span className="font-medium">{washer.total_completed_jobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="font-medium">{washer.rating}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Earnings</span>
                    <span className="font-medium">PKR {washer.total_earnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">
                Message Washer
              </Button>
              <Button variant="outline" className="w-full">
                View Activity Log
              </Button>
              <Button variant="outline" className="w-full">
                Download Report
              </Button>
              {washer.status !== 'SUSPENDED' && (
                <Button variant="destructive" className="w-full">
                  Suspend Account
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}