'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Search, Eye, MapPin, Phone, User, Car } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function TeamManagementPage() {
  const [washers, setWashers] = useState<any[]>([]);
  const [filteredWashers, setFilteredWashers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock data for washers - in a real app, this would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockWashers = [
        {
          id: '1',
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
          last_active: '2024-01-20'
        },
        {
          id: '2',
          full_name: 'Misbah Khan',
          email: 'misbahahmed857@gmail.com',
          phone_number: '+92-300-9876543',
          cnic_id: '34567-8901234-5',
          service_area: 'Lahore, Pakistan',
          status: 'APPROVED',
          vehicle_details: {
            vehicle_type: 'Truck',
            vehicle_model: 'Ford Transit',
            license_plate: 'XYZ-5678'
          },
          created_at: '2024-01-10',
          last_active: '2024-01-19'
        },
        {
          id: '3',
          full_name: 'Ali Hassan',
          email: 'alihassan@example.com',
          phone_number: '+92-300-5556667',
          cnic_id: '56789-1234567-8',
          service_area: 'Islamabad, Pakistan',
          status: 'PENDING_APPROVAL',
          vehicle_details: {
            vehicle_type: 'SUV',
            vehicle_model: 'Toyota Land Cruiser',
            license_plate: 'ISB-123'
          },
          created_at: '2024-01-18',
          last_active: '2024-01-18'
        },
        {
          id: '4',
          full_name: 'Sara Malik',
          email: 'saramalik@example.com',
          phone_number: '+92-300-8889990',
          cnic_id: '98765-4321098-7',
          service_area: 'Rawalpindi, Pakistan',
          status: 'SUSPENDED',
          vehicle_details: {
            vehicle_type: 'Van',
            vehicle_model: 'Honda Odyssey',
            license_plate: 'RWP-456'
          },
          created_at: '2024-01-05',
          last_active: '2024-01-10'
        }
      ];
      setWashers(mockWashers);
      setFilteredWashers(mockWashers);
      setLoading(false);
    }, 500);
  }, []);

  // Filter washers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredWashers(washers);
    } else {
      const filtered = washers.filter(washer =>
        washer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        washer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        washer.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        washer.service_area.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWashers(filtered);
    }
  }, [searchTerm, washers]);

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

  const handleViewDetails = (washerId: string) => {
    // In a real app, navigate to the washer details page
    window.location.href = `/admin/team/details?id=${washerId}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-12 w-full bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground">
          Manage all washers in your team
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>All Washers</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search washers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Service Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWashers.length > 0 ? (
                filteredWashers.map((washer) => (
                  <TableRow key={washer.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {washer.full_name}
                      </div>
                    </TableCell>
                    <TableCell>{washer.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {washer.phone_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {washer.service_area}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeVariant(washer.status)}>
                        {washer.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        {washer.vehicle_details?.vehicle_type} - {washer.vehicle_details?.license_plate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(washer.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No washers found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}