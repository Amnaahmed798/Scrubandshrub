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
import { getServices, updateService } from '@/lib/api';
import { Service } from '@/types';

export default function PendingServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await getServices();
      // Filter for inactive services (assuming these are pending approval)
      const inactiveServices = Array.isArray(response.data) 
        ? response.data.filter((service: Service) => !service.is_active)
        : [];
      setServices(inactiveServices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending services');
    } finally {
      setLoading(false);
    }
  };

  const approveService = async (id: number) => {
    try {
      // Update the service status to active using the API
      await updateService(id, { is_active: true });
      fetchServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve service');
    }
  };

  const rejectService = async (id: number) => {
    try {
      // Update the service status to inactive using the API
      await updateService(id, { is_active: false });
      fetchServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject service');
    }
  };

  if (loading) return <div className="p-6">Loading pending services...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pending Services</h1>
        <Button onClick={fetchServices}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Services for Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell>{new Date(service.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => approveService(service.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectService(service.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}