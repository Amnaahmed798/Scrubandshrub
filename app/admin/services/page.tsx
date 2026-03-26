'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createService,
  updateService,
  deleteService,
  getServices
} from '@/lib/api';
import { Service } from '@/types';

export default function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    detailed_description: string;
    category: string;
    icon: string;
    image_path: string;
    sort_order: number;
    service_type: string;
    parent_service_id: number | null | undefined;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    detailed_description: '',
    category: 'cleaning',
    icon: '',
    image_path: '',
    sort_order: 0,
    service_type: 'main_service',
    parent_service_id: undefined,
    is_active: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await getServices();
      setServices(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Generate slug from name if not provided
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();

    try {
      // Generate slug from name with proper formatting
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim();

      // Ensure slug is not empty
      const slug = generatedSlug || 'default-slug';

      // Prepare the service data with only the fields expected by the backend model
      const serviceData = {
        name: String(formData.name || ''),
        slug: slug, // Use the properly formatted slug
        category: String((formData.category || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()),
        description: String(formData.description || ''),
        detailed_description: String(formData.detailed_description || ''),
        icon: String(formData.icon || ''),
        image_path: String(formData.image_path || ''),
        sort_order: Number(formData.sort_order || 0),
        is_active: Boolean(formData.is_active),
        service_type: String(formData.service_type || 'sub_service'),
        parent_service_id: formData.service_type === 'sub_service' && formData.parent_service_id ? Number(formData.parent_service_id) : null,
      };

      if (editingService) {
        await updateService(editingService.id, serviceData);
      } else {
        await createService(serviceData);
      }

      await fetchServices();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error('Service creation/update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save service. Please check the console for details.');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      detailed_description: service.detailed_description || '',
      category: service.category,
      icon: service.icon || '',
      image_path: service.image_path || '',
      sort_order: service.sort_order || 0,
      is_active: service.is_active,
      service_type: service.service_type || 'main_service',
      parent_service_id: service.parent_service_id
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteService(id);
        await fetchServices();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete service');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      detailed_description: '',
      category: 'cleaning',
      icon: '',
      image_path: '',
      sort_order: 0,
      is_active: true,
      service_type: 'main_service',
      parent_service_id: null
    });
    setEditingService(null);
  };

  if (loading) return <div className="p-6">Loading services...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Services Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingService(null); }} className="text-sm h-8 sm:h-10">
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value.toLowerCase()})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Service Type</label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData({...formData, service_type: value, parent_service_id: value === 'main_service' ? null : formData.parent_service_id})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main_service">Main Service</SelectItem>
                    <SelectItem value="sub_service">Sub Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.service_type === 'sub_service' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Parent Service</label>
                  <Select
                    value={formData.parent_service_id?.toString() || ''}
                    onValueChange={(value) => setFormData({...formData, parent_service_id: value ? parseInt(value) : undefined})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services
                        .filter(service => service.service_type === 'main_service')
                        .map(service => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Detailed Description</label>
                <Input
                  value={formData.detailed_description}
                  onChange={(e) => setFormData({...formData, detailed_description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image Path</label>
                <Input
                  value={formData.image_path}
                  onChange={(e) => setFormData({...formData, image_path: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData({...formData, is_active: value === 'active'})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsDialogOpen(false); resetForm(); }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingService ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Services</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Description</TableHead>
                  <TableHead className="whitespace-nowrap">Category</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(services) && services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium whitespace-nowrap">{service.name}</TableCell>
                    <TableCell className="min-w-[200px] break-words">{service.description}</TableCell>
                    <TableCell className="whitespace-nowrap">{service.category}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        service.service_type === 'main_service'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {service.service_type === 'main_service' ? 'Main' : 'Sub'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        service.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 min-w-[120px]">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => handleEdit(service)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => handleDelete(service.id)}
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
          <div className="md:hidden space-y-4">
            {Array.isArray(services) && services.map((service) => (
              <div key={service.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{service.description}</div>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      service.service_type === 'main_service'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {service.service_type === 'main_service' ? 'Main' : 'Sub'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      service.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <div>Category: {service.category}</div>
                </div>
                <div className="mt-3 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => handleEdit(service)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => handleDelete(service.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}