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
import { getServices, updateService, uploadMedia } from '@/lib/api';
import { Service } from '@/types';
import ImageUpload from '@/components/admin/ImageUpload';

export default function EditServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceImage, setServiceImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMainServices, setExpandedMainServices] = useState<Set<number>>(new Set());

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

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setServiceImage(null); // Reset image when selecting a new service
  };

  // Image handling functions
  const handleServiceImageUpload = (file: File, url: string) => {
    if (selectedService) {
      setSelectedService({...selectedService, image_path: url });
      setServiceImage(file);
    }
  };

  const handleServiceImageRemove = () => {
    if (selectedService) {
      setSelectedService({...selectedService, image_path: '' });
      setServiceImage(null);
    }
  };

  // Helper function to organize services into hierarchy
  const organizeServicesIntoHierarchy = () => {
    const serviceArray = Array.isArray(services) ? services : [];
    const mainServices = serviceArray.filter(s => s.service_type === 'main_service');
    const headCategories = serviceArray.filter(s => s.service_type === 'head_category');
    const subCategories = serviceArray.filter(s => s.service_type === 'sub_category');
    const subServices = serviceArray.filter(s => s.service_type === 'sub_service');

    // Create a map of main service IDs to their head categories
    const mainServiceHeadCategories: Record<number, Service[]> = {};
    headCategories.forEach(hc => {
      if (hc.parent_service_id) {
        if (!mainServiceHeadCategories[hc.parent_service_id]) {
          mainServiceHeadCategories[hc.parent_service_id] = [];
        }
        mainServiceHeadCategories[hc.parent_service_id].push(hc);
      }
    });

    // Create a map of head category IDs to their sub categories
    const headCategorySubCategories: Record<number, Service[]> = {};
    subCategories.forEach(sc => {
      if (sc.parent_service_id) {
        if (!headCategorySubCategories[sc.parent_service_id]) {
          headCategorySubCategories[sc.parent_service_id] = [];
        }
        headCategorySubCategories[sc.parent_service_id].push(sc);
      }
    });

    return {
      mainServices,
      headCategories,
      subCategories,
      subServices,
      mainServiceHeadCategories,
      headCategorySubCategories
    };
  };

  const toggleMainServiceExpansion = (mainServiceId: number) => {
    setExpandedMainServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mainServiceId)) {
        newSet.delete(mainServiceId);
      } else {
        newSet.add(mainServiceId);
      }
      return newSet;
    });
  };

  const handleUpdate = async () => {
    if (!selectedService) return;

    try {
      let serviceImagePath = selectedService.image_path;

      // Upload image if a new one has been selected
      if (serviceImage) {
        const mediaResponse = await uploadMedia(serviceImage);
        serviceImagePath = mediaResponse.data.file_path;

        // Update the selected service with the new image path
        setSelectedService({...selectedService, image_path: serviceImagePath});
      }

      await updateService(selectedService.id, {
        ...selectedService,
        image_path: serviceImagePath
      });

      alert('Service updated successfully!');
      fetchServices();
      setExpandedMainServices(new Set()); // Collapse all after update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service');
    }
  };

  if (loading) return <div className="p-6">Loading services...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  const {
    mainServices,
    headCategories,
    subCategories,
    subServices,
    mainServiceHeadCategories,
    headCategorySubCategories
  } = organizeServicesIntoHierarchy();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Edit Services</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Service Hierarchy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {mainServices.map((mainService) => (
                  <div key={mainService.id} className="border border-gray-200 rounded-lg mb-2">
                    {/* Main Service Card */}
                    <div
                      className={`p-4 cursor-pointer transition-all duration-200 flex items-center justify-between ${
                        selectedService?.id === mainService.id
                          ? 'bg-blue-50 border-blue-500'
                          : 'hover:bg-gray-50'
                      } bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500`}
                      onClick={() => handleServiceSelect(mainService)}
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className={`w-5 h-5 transform transition-transform ${expandedMainServices.has(mainService.id) ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-medium text-blue-700 truncate">{mainService.name}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Main
                        </span>
                      </div>
                      {mainService.image_path && (
                        <img
                          src={mainService.image_path}
                          alt={mainService.name}
                          className="w-8 h-8 rounded-md object-cover border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                    </div>

                    {/* Head Categories (collapsible) */}
                    {expandedMainServices.has(mainService.id) && (
                      <div className="pl-6 border-l-2 border-gray-200">
                        {(mainServiceHeadCategories[mainService.id] || []).map((headCategory) => (
                          <div key={headCategory.id} className="border border-gray-100 rounded-lg mb-1 ml-4">
                            {/* Head Category Card */}
                            <div
                              className={`p-3 cursor-pointer transition-all duration-200 flex items-center gap-2 ${
                                selectedService?.id === headCategory.id
                                  ? 'bg-orange-50 border-orange-300'
                                  : 'hover:bg-gray-50'
                              } bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-l-orange-500`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleServiceSelect(headCategory);
                              }}
                            >
                              <span className="font-medium text-orange-700 truncate">{headCategory.name}</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Head
                              </span>
                              {headCategory.image_path && (
                                <img
                                  src={headCategory.image_path}
                                  alt={headCategory.name}
                                  className="w-6 h-6 rounded-md object-cover border border-gray-200"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                            </div>

                            {/* Sub Categories (nested) */}
                            <div className="pl-4 border-l border-gray-100 ml-4">
                              {(headCategorySubCategories[headCategory.id] || []).map((subCategory) => (
                                <div
                                  key={subCategory.id}
                                  className={`p-2 pl-4 cursor-pointer transition-all duration-200 text-sm flex items-center gap-2 ${
                                    selectedService?.id === subCategory.id
                                      ? 'bg-blue-50 border border-blue-200 rounded'
                                      : 'hover:bg-gray-50'
                                  } bg-gradient-to-r from-blue-50 to-sky-50 border-l-4 border-l-blue-400`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleServiceSelect(subCategory);
                                  }}
                                >
                                  <span className="font-medium text-blue-700 truncate">{subCategory.name}</span>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Sub
                                  </span>
                                  {subCategory.image_path && (
                                    <img
                                      src={subCategory.image_path}
                                      alt={subCategory.name}
                                      className="w-5 h-5 rounded-md object-cover border border-gray-200"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Show any head categories that don't have a parent (shouldn't happen in proper hierarchy) */}
                {headCategories.filter(hc => !hc.parent_service_id || !mainServices.some(ms => ms.id === hc.parent_service_id)).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Orphaned Head Categories</h3>
                    {headCategories.filter(hc => !hc.parent_service_id || !mainServices.some(ms => ms.id === hc.parent_service_id)).map((headCategory) => (
                      <div
                        key={headCategory.id}
                        className={`p-3 cursor-pointer transition-all duration-200 flex items-center gap-2 mb-1 ${
                          selectedService?.id === headCategory.id
                            ? 'bg-orange-50 border border-orange-300 rounded'
                            : 'hover:bg-gray-50'
                        } bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-l-orange-500`}
                        onClick={() => handleServiceSelect(headCategory)}
                      >
                        <span className="font-medium text-orange-700 truncate">{headCategory.name}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Head
                        </span>
                        {headCategory.image_path && (
                          <img
                            src={headCategory.image_path}
                            alt={headCategory.name}
                            className="w-6 h-6 rounded-md object-cover border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Show any sub categories that don't have a parent (shouldn't happen in proper hierarchy) */}
                {subCategories.filter(sc => !sc.parent_service_id || !headCategories.some(hc => hc.id === sc.parent_service_id)).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Orphaned Sub Categories</h3>
                    {subCategories.filter(sc => !sc.parent_service_id || !headCategories.some(hc => hc.id === sc.parent_service_id)).map((subCategory) => (
                      <div
                        key={subCategory.id}
                        className={`p-2 pl-4 cursor-pointer transition-all duration-200 text-sm flex items-center gap-2 mb-1 ${
                          selectedService?.id === subCategory.id
                            ? 'bg-blue-50 border border-blue-200 rounded'
                            : 'hover:bg-gray-50'
                        } bg-gradient-to-r from-blue-50 to-sky-50 border-l-4 border-l-blue-400`}
                        onClick={() => handleServiceSelect(subCategory)}
                      >
                        <span className="font-medium text-blue-700 truncate">{subCategory.name}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Sub
                        </span>
                        {subCategory.image_path && (
                          <img
                            src={subCategory.image_path}
                            alt={subCategory.name}
                            className="w-5 h-5 rounded-md object-cover border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Show additional services separately */}
                {subServices.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Services</h3>
                    {subServices.map((subService) => (
                      <div
                        key={subService.id}
                        className={`p-2 pl-4 cursor-pointer transition-all duration-200 text-sm flex items-center gap-2 mb-1 ${
                          selectedService?.id === subService.id
                            ? 'bg-green-50 border border-green-200 rounded'
                            : 'hover:bg-gray-50'
                        } bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-400`}
                        onClick={() => handleServiceSelect(subService)}
                      >
                        <span className="font-medium text-green-700 truncate">{subService.name}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Additional
                        </span>
                        {subService.image_path && (
                          <img
                            src={subService.image_path}
                            alt={subService.name}
                            className="w-5 h-5 rounded-md object-cover border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Service Details</CardTitle>
                <div className="flex items-center justify-between">
                  {selectedService && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedService.service_type === 'main_service' ? 'bg-blue-100 text-blue-800' :
                      selectedService.service_type === 'head_category' ? 'bg-orange-100 text-orange-800' :
                      selectedService.service_type === 'sub_category' ? 'bg-blue-100 text-blue-800' :
                      selectedService.service_type === 'sub_service' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedService.service_type === 'main_service' ? 'Main Service' :
                       selectedService.service_type === 'head_category' ? 'Head Category' :
                       selectedService.service_type === 'sub_category' ? 'Sub Category' :
                       selectedService.service_type === 'sub_service' ? 'Additional Service' :
                       'Other Service'}
                    </span>
                  )}
                  <div className="text-xs text-gray-500 italic">
                    Hierarchy: Main → Head → Sub
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedService ? (
                <div className="space-y-6">
                  {/* Service Info Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Service Name</label>
                        <Input
                          value={selectedService.name}
                          onChange={(e) => setSelectedService({...selectedService, name: e.target.value})}
                          required
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Category</label>
                        <Input
                          value={selectedService.category}
                          onChange={(e) => setSelectedService({...selectedService, category: e.target.value})}
                          required
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Sort Order</label>
                        <Input
                          type="number"
                          value={selectedService.sort_order}
                          onChange={(e) => setSelectedService({...selectedService, sort_order: parseInt(e.target.value) || 0})}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Service Type</label>
                        <Select
                          value={selectedService.service_type}
                          onValueChange={(value) => setSelectedService({...selectedService, service_type: value})}
                        >
                          <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main_service">Main Service</SelectItem>
                            <SelectItem value="head_category">Head Category</SelectItem>
                            <SelectItem value="sub_category">Sub Category</SelectItem>
                            <SelectItem value="sub_service">Additional Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Parent Service ID</label>
                        <Input
                          type="number"
                          value={selectedService.parent_service_id || ''}
                          onChange={(e) => setSelectedService({...selectedService, parent_service_id: e.target.value ? parseInt(e.target.value) : undefined})}
                          placeholder={
                            selectedService.service_type === 'main_service' ? 'Main services have no parent' :
                            selectedService.service_type === 'head_category' ? 'Main service ID required' :
                            selectedService.service_type === 'sub_category' ? 'Head category ID required' :
                            selectedService.service_type === 'sub_service' ? 'Link to main service or head category' :
                            'Enter parent service ID'
                          }
                          disabled={selectedService.service_type === 'main_service'}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Active Status</label>
                          <p className="text-sm text-gray-500">Toggle to make service active/inactive</p>
                        </div>
                        <Switch
                          checked={selectedService.is_active}
                          onCheckedChange={(checked) => setSelectedService({...selectedService, is_active: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                      <Textarea
                        value={selectedService.description}
                        onChange={(e) => setSelectedService({...selectedService, description: e.target.value})}
                        required
                        rows={3}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter a brief description of the service..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Detailed Description</label>
                      <Textarea
                        value={selectedService.detailed_description || ''}
                        onChange={(e) => setSelectedService({...selectedService, detailed_description: e.target.value})}
                        rows={4}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter detailed information about the service..."
                      />
                    </div>
                  </div>

                  {/* Image Section */}
                  <div className="space-y-4">
                    <div>
                      <ImageUpload
                        onImageUpload={handleServiceImageUpload}
                        onImageRemove={handleServiceImageRemove}
                        currentImageUrl={selectedService.image_path || undefined}
                        label="Service Image"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedService(null);
                        setServiceImage(null);
                      }}
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Update Service
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No service selected</h3>
                  <p className="text-gray-500">Select a service from the list to edit its details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}