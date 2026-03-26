'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createService, getCategories } from '@/lib/api';

export default function AddService() {
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    detailed_description: string;
    category: string;
    category_id: number | null;
    icon: string;
    image_path: string;
    is_active: boolean;
    parent_service_id: number | null;
    service_type: string;
    sort_order: number;
  }>({
    name: '',
    slug: '',
    description: '',
    detailed_description: '',
    category: '',
    category_id: null,
    icon: '',
    image_path: '',
    is_active: true,
    parent_service_id: null,
    service_type: 'main_service',
    sort_order: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      // getCategories returns array directly
      const response: any[] = await getCategories();
      setCategories(response);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
      // Still allow the form to work even if categories fail to load
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createService(formData);
      // Reset form after successful creation
      setFormData({
        name: '',
        slug: '',
        description: '',
        detailed_description: '',
        category: '',
        category_id: null,
        icon: '',
        image_path: '',
        is_active: true,
        parent_service_id: null,
        service_type: 'sub_service',
        sort_order: 0
      });
      alert('Service created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Add New Service</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create Service</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Service Name</label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData({
                    ...formData,
                    name: newName,
                    // Auto-generate slug from name when name changes
                    slug: newName
                      .toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                      .replace(/\s+/g, '-') // Replace spaces with hyphens
                      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
                      .trim()
                  });
                }}
                required
                placeholder="Enter service name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                required
                placeholder="Enter service slug (e.g., car-wash-basic)"
              />
              <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and hyphens only</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
                placeholder="Enter service description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Detailed Description</label>
              <Textarea
                value={formData.detailed_description}
                onChange={(e) => setFormData({...formData, detailed_description: e.target.value})}
                placeholder="Enter detailed description for the service detail page"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                {loadingCategories ? (
                  <div className="text-sm text-gray-500">Loading categories...</div>
                ) : (
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  placeholder="e.g., 🚗, ✨, 💎"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Image Path</label>
                <Input
                  value={formData.image_path}
                  onChange={(e) => setFormData({...formData, image_path: e.target.value})}
                  placeholder="e.g., /images/services/kitchen-service.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                  placeholder="Order to display this service"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Service Type</label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData({...formData, service_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main_service">Main Service</SelectItem>
                    <SelectItem value="head_category">Head Category</SelectItem>
                    <SelectItem value="sub_category">Sub Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Parent Service ID (for head categories and sub categories)</label>
                <Input
                  type="number"
                  value={formData.parent_service_id || ''}
                  onChange={(e) => setFormData({...formData, parent_service_id: e.target.value ? parseInt(e.target.value) : null})}
                  placeholder="Leave empty for main services"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">Active Status</label>
                <p className="text-sm text-gray-500">Toggle to make service active/inactive</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">
                Error: {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Service'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}