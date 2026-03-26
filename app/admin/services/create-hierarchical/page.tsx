'use client';

import { useState } from 'react';
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
import { createService, uploadMedia } from '@/lib/api';
import ImageUpload from '@/components/admin/ImageUpload';

export default function CreateHierarchicalService() {
  const [mainService, setMainService] = useState({
    name: '',
    slug: '',
    description: '',
    detailed_description: '',
    category: '',
    image_path: '',
    is_active: true,
    service_type: 'main_service',
    sort_order: 0
  });

  const [headCategories, setHeadCategories] = useState([
    { id: 1, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true },
    { id: 2, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true }
  ]);

  const [subCategories, setSubCategories] = useState([
    { id: 1, headCategoryId: 1, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true },
    { id: 2, headCategoryId: 1, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true },
    { id: 3, headCategoryId: 1, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true },
    { id: 4, headCategoryId: 2, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true },
    { id: 5, headCategoryId: 2, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true },
    { id: 6, headCategoryId: 2, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true }
  ]);

  // State for tracking uploaded images
  const [mainServiceImage, setMainServiceImage] = useState<File | null>(null);
  const [headCategoryImages, setHeadCategoryImages] = useState<Record<number, File>>({});
  const [subCategoryImages, setSubCategoryImages] = useState<Record<number, File>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMainServiceChange = (field: string, value: any) => {
    setMainService(prev => ({ ...prev, [field]: value }));
  };

  const handleHeadCategoryChange = (id: number, field: string, value: any) => {
    setHeadCategories(prev =>
      prev.map(cat => cat.id === id ? { ...cat, [field]: value } : cat)
    );
  };

  const handleSubCategoryChange = (id: number, field: string, value: any) => {
    setSubCategories(prev =>
      prev.map(cat => cat.id === id ? { ...cat, [field]: value } : cat)
    );
  };

  // Image handling functions
  const handleMainServiceImageUpload = (file: File, url: string) => {
    setMainService(prev => ({ ...prev, image_path: url }));
    setMainServiceImage(file);
  };

  const handleMainServiceImageRemove = () => {
    setMainService(prev => ({ ...prev, image_path: '' }));
    setMainServiceImage(null);
  };

  const handleHeadCategoryImageUpload = (id: number, file: File, url: string) => {
    setHeadCategoryImages(prev => ({ ...prev, [id]: file }));
    handleHeadCategoryChange(id, 'image_path', url);
  };

  const handleHeadCategoryImageRemove = (id: number) => {
    setHeadCategoryImages(prev => {
      const newImages = { ...prev };
      delete newImages[id];
      return newImages;
    });
    handleHeadCategoryChange(id, 'image_path', '');
  };

  const handleSubCategoryImageUpload = (id: number, file: File, url: string) => {
    setSubCategoryImages(prev => ({ ...prev, [id]: file }));
    handleSubCategoryChange(id, 'image_path', url);
  };

  const handleSubCategoryImageRemove = (id: number) => {
    setSubCategoryImages(prev => {
      const newImages = { ...prev };
      delete newImages[id];
      return newImages;
    });
    handleSubCategoryChange(id, 'image_path', '');
  };

  const handleNameChange = (id: number, value: string, type: 'head' | 'sub') => {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();

    if (type === 'head') {
      handleHeadCategoryChange(id, 'name', value);
      handleHeadCategoryChange(id, 'slug', slug);
    } else {
      handleSubCategoryChange(id, 'name', value);
      handleSubCategoryChange(id, 'slug', slug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Upload main service image if available
      let mainServiceImagePath = mainService.image_path;
      if (mainServiceImage) {
        const mediaResponse = await uploadMedia(mainServiceImage);
        mainServiceImagePath = mediaResponse.data.file_path;
      }

      // Create main service first
      const mainServiceResponse = await createService({
        ...mainService,
        image_path: mainServiceImagePath,
        parent_service_id: null,
        service_type: 'main_service'
      });

      const mainServiceId = mainServiceResponse.data.id;

      // Upload head category images if available
      const headCategoryImageData: Record<number, string> = {};
      const headCategoryUploadPromises = headCategories
        .filter(cat => cat.name.trim() !== '' && headCategoryImages[cat.id])
        .map(async (headCat) => {
          if (headCategoryImages[headCat.id]) {
            const mediaResponse = await uploadMedia(headCategoryImages[headCat.id]);
            headCategoryImageData[headCat.id] = mediaResponse.data.file_path;
          }
        });

      await Promise.all(headCategoryUploadPromises);

      // Create head categories
      const headCategoryPromises = headCategories
        .filter(cat => cat.name.trim() !== '')
        .map(headCat =>
          createService({
            ...headCat,
            image_path: headCategoryImageData[headCat.id] || headCat.image_path,
            parent_service_id: mainServiceId,
            service_type: 'head_category',
            category: mainService.category,
            detailed_description: headCat.description
          })
        );

      const headCategoryResponses = await Promise.all(headCategoryPromises);

      // Create mapping from head category index to created service ID
      const headCategoryMap: Record<number, number> = {};
      headCategoryResponses.forEach((resp, idx) => {
        const originalId = headCategories.filter(cat => cat.name.trim() !== '')[idx].id;
        headCategoryMap[originalId] = resp.data.id;
      });

      // Upload sub category images if available
      const subCategoryImageData: Record<number, string> = {};
      const subCategoryUploadPromises = subCategories
        .filter(subCat => subCat.name.trim() !== '' && subCategoryImages[subCat.id])
        .map(async (subCat) => {
          if (subCategoryImages[subCat.id]) {
            const mediaResponse = await uploadMedia(subCategoryImages[subCat.id]);
            subCategoryImageData[subCat.id] = mediaResponse.data.file_path;
          }
        });

      await Promise.all(subCategoryUploadPromises);

      // Create sub categories
      const subCategoryPromises = subCategories
        .filter(subCat => subCat.name.trim() !== '')
        .map(subCat =>
          createService({
            ...subCat,
            image_path: subCategoryImageData[subCat.id] || subCat.image_path,
            parent_service_id: headCategoryMap[subCat.headCategoryId],
            service_type: 'sub_category',
            category: mainService.category,
            detailed_description: subCat.description
          })
        );

      await Promise.all(subCategoryPromises);

      alert('Service hierarchy created successfully!');
      // Reset form
      setMainService({
        name: '',
        slug: '',
        description: '',
        detailed_description: '',
        category: '',
        image_path: '',
        is_active: true,
        service_type: 'main_service',
        sort_order: 0
      });
      setHeadCategories([
        { id: 1, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true },
        { id: 2, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true }
      ]);
      setSubCategories([
        { id: 1, headCategoryId: 1, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true },
        { id: 2, headCategoryId: 1, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true },
        { id: 3, headCategoryId: 1, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true },
        { id: 4, headCategoryId: 2, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true },
        { id: 5, headCategoryId: 2, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true },
        { id: 6, headCategoryId: 2, name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: true }
      ]);
      setMainServiceImage(null);
      setHeadCategoryImages({});
      setSubCategoryImages({});
    } catch (err) {
      console.error('Error creating service hierarchy:', err);
      setError(err instanceof Error ? err.message : 'Failed to create service hierarchy. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create Service Hierarchy</h1>
      <p className="text-gray-600">Create a main service with 2 head categories and 3 subcategories each</p>

      {error && (
        <div className="text-red-500 text-sm">
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Service Card */}
        <Card>
          <CardHeader>
            <CardTitle>Main Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Main Service Name</label>
              <Input
                value={mainService.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setMainService({
                    ...mainService,
                    name: newName,
                    slug: newName
                      .toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                      .replace(/\s+/g, '-') // Replace spaces with hyphens
                      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
                      .trim()
                  });
                }}
                required
                placeholder="Enter main service name (e.g., Car Washing)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <Input
                  value={mainService.slug}
                  onChange={(e) => setMainService({...mainService, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                  required
                  placeholder="Enter service slug (e.g., car-washing)"
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and hyphens only</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Input
                  value={mainService.category}
                  onChange={(e) => setMainService({...mainService, category: e.target.value})}
                  placeholder="e.g., automotive, cleaning, outdoor"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={mainService.description}
                onChange={(e) => setMainService({...mainService, description: e.target.value})}
                placeholder="Enter main service description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Detailed Description</label>
              <Textarea
                value={mainService.detailed_description}
                onChange={(e) => setMainService({...mainService, detailed_description: e.target.value})}
                placeholder="Enter detailed description for the main service"
              />
            </div>

            <div>
              <ImageUpload
                onImageUpload={handleMainServiceImageUpload}
                onImageRemove={handleMainServiceImageRemove}
                currentImageUrl={mainService.image_path}
                label="Main Service Image"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <Input
                  type="number"
                  value={mainService.sort_order}
                  onChange={(e) => setMainService({...mainService, sort_order: parseInt(e.target.value) || 0})}
                  placeholder="Order to display this service"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1">Active Status</label>
                  <p className="text-sm text-gray-500">Toggle to make service active/inactive</p>
                </div>
                <Switch
                  checked={mainService.is_active}
                  onCheckedChange={(checked) => setMainService({...mainService, is_active: checked})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Head Categories Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Head Categories</h2>

          {headCategories.map((headCat, index) => (
            <Card key={headCat.id}>
              <CardHeader>
                <CardTitle>Head Category {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Head Category Name</label>
                  <Input
                    value={headCat.name}
                    onChange={(e) => handleNameChange(headCat.id, e.target.value, 'head')}
                    required={index < 2} // Only first 2 are required
                    placeholder={`Enter head category ${index + 1} name`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <Input
                    value={headCat.slug}
                    onChange={(e) => handleHeadCategoryChange(headCat.id, 'slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    required={index < 2} // Only first 2 are required
                    placeholder={`head-category-${index + 1}`}
                  />
                </div>

                <div>
                  <ImageUpload
                    onImageUpload={(file, url) => handleHeadCategoryImageUpload(headCat.id, file, url)}
                    onImageRemove={() => handleHeadCategoryImageRemove(headCat.id)}
                    currentImageUrl={headCat.image_path}
                    label="Head Category Image"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={headCat.description}
                    onChange={(e) => handleHeadCategoryChange(headCat.id, 'description', e.target.value)}
                    placeholder="Enter head category description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Sort Order</label>
                    <Input
                      type="number"
                      value={headCat.sort_order}
                      onChange={(e) => handleHeadCategoryChange(headCat.id, 'sort_order', parseInt(e.target.value) || 0)}
                      placeholder="Order to display this category"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium mb-1">Active Status</label>
                      <p className="text-sm text-gray-500">Toggle to make category active/inactive</p>
                    </div>
                    <Switch
                      checked={headCat.is_active}
                      onCheckedChange={(checked) => handleHeadCategoryChange(headCat.id, 'is_active', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sub Categories Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Sub Categories</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subCategories.map((subCat, index) => (
              <Card key={subCat.id}>
                <CardHeader>
                  <CardTitle className="text-base">Sub Category {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Sub Category Name</label>
                    <Input
                      value={subCat.name}
                      onChange={(e) => handleNameChange(subCat.id, e.target.value, 'sub')}
                      required={index < 6} // All 6 are part of the structure
                      placeholder={`Enter sub category ${index + 1} name`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Slug</label>
                    <Input
                      value={subCat.slug}
                      onChange={(e) => handleSubCategoryChange(subCat.id, 'slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      required={index < 6} // All 6 are part of the structure
                      placeholder={`sub-category-${index + 1}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={subCat.description}
                      onChange={(e) => handleSubCategoryChange(subCat.id, 'description', e.target.value)}
                      placeholder="Enter sub category description"
                      className="h-20"
                    />
                  </div>

                  <div className="col-span-2">
                    <ImageUpload
                      onImageUpload={(file, url) => handleSubCategoryImageUpload(subCat.id, file, url)}
                      onImageRemove={() => handleSubCategoryImageRemove(subCat.id)}
                      currentImageUrl={subCat.image_path}
                      label="Sub Category Image"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium mb-1">Active Status</label>
                      <p className="text-sm text-gray-500">Active</p>
                    </div>
                    <Switch
                      checked={subCat.is_active}
                      onCheckedChange={(checked) => handleSubCategoryChange(subCat.id, 'is_active', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Hierarchy...' : 'Create Service Hierarchy'}
          </Button>
        </div>
      </form>
    </div>
  );
}