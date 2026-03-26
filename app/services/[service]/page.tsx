'use client';

import React, { useState, useEffect } from 'react';
import { Service as ServiceType } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface ServicePageProps {
  params: {
    service: string;
  };
}

// Add modal component
const ServiceDetailModal: React.FC<{
  service: any;
  isOpen: boolean;
  onClose: () => void;
}> = ({ service, isOpen, onClose }) => {
  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>

          <div className="mb-4">
            <img
              src={
                service.image && (service.image.startsWith('/uploads/') || service.image.startsWith('uploads/'))
                  ? `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${service.image.startsWith('/') ? '' : '/'}${service.image}`
                  : service.image || '/images/services/service-default.jpg'
              }
              alt={service.name}
              className="w-full h-48 object-cover rounded-md mb-4"
              onError={(e) => {(e.currentTarget as HTMLImageElement).src = "https://placehold.co/400x200/0f766e/white?text=Service";}}
            />

            <p className="text-gray-600 mb-4">{service.detailedDescription || service.description || 'No detailed description available.'}</p>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Price:</span>
                <span className="text-xl font-bold text-primary">${service.price?.toFixed(2) || '0.00'}</span>
              </div>
              {service.duration && (
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium text-gray-700">Duration:</span>
                  <span className="text-gray-600">{service.duration}</span>
                </div>
              )}
              {service.category && (
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="text-gray-600 capitalize">{service.category}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                alert(`Added ${service.name} to selections!`);
                onClose();
              }}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary hover:text-primary"
            >
              Select Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServiceDetailPage: React.FC<ServicePageProps> = ({ params }) => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [selectedVehicleType, setSelectedVehicleType] = useState<'sedan' | 'suv' | 'hatchback' | 'bike'>('sedan');
  const [serviceDetails, setServiceDetails] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const router = useRouter();
  const serviceSlug = params.service;

  // Service name mappings (simplified)
  const serviceMappings: Record<string, Record<string, { name: string; description: string; image: string }>> = {
    'car-washing': {
      'interior-basic': {
        name: 'Interior Basic Clean',
        description: 'Basic interior cleaning including vacuuming seats and carpets, wiping down dashboard and surfaces, cleaning windows, and removing surface debris.',
        image: '/images/services/interior-basic-service.jpg'
      },
      'interior-vacuum': {
        name: 'Interior Vacuum',
        description: 'Thorough vacuuming of seats, carpets, floor mats, and hard-to-reach areas using professional-grade equipment.',
        image: '/images/services/interior-vacuum-service.jpg'
      },
      'interior-detail': {
        name: 'Interior Detail',
        description: 'Comprehensive interior detailing including deep cleaning of seats, carpets, and upholstery, conditioning of leather surfaces.',
        image: '/images/services/interior-detail-service.jpg'
      },
      'exterior-basic': {
        name: 'Exterior Basic Wash',
        description: 'Basic exterior wash including soap wash, rinse, and hand dry. Includes cleaning of wheels and tires.',
        image: '/images/services/exterior-basic-service.jpg'
      },
      'exterior-wax': {
        name: 'Wax & Polish',
        description: 'Professional waxing and polishing service that protects your car\'s paint while providing a deep shine.',
        image: '/images/services/exterior-wax-service.jpg'
      },
      'exterior-detail': {
        name: 'Full Exterior Detail',
        description: 'Complete exterior detailing including clay bar treatment to remove contaminants, paint correction for swirl marks.',
        image: '/images/services/exterior-detail-service.jpg'
      }
    },
    'house-cleaning': {
      'deep-kitchen': {
        name: 'Kitchen Deep Clean',
        description: 'Comprehensive deep cleaning of kitchen including appliances, cabinets, countertops, sink, and backsplash.',
        image: '/images/services/kitchen-service.jpg'
      },
      'deep-bathroom': {
        name: 'Bathroom Deep Clean',
        description: 'Thorough cleaning of bathroom including toilet, shower, tub, sink, mirrors, and tile surfaces.',
        image: '/images/services/bathroom-service.jpg'
      },
      'deep-floor': {
        name: 'Floor Cleaning',
        description: 'Deep cleaning and mopping of all floor surfaces including hardwood, tile, laminate, and other materials.',
        image: '/images/services/floor-service.jpg'
      },
      'maintenance-windows': {
        name: 'Window Cleaning',
        description: 'Professional cleaning of interior and exterior windows, frames, and sills.',
        image: '/images/services/window-service.jpg'
      },
      'maintenance-dusting': {
        name: 'Dusting Service',
        description: 'Comprehensive dusting of all furniture, electronics, blinds, and surfaces throughout the home.',
        image: '/images/services/dusting-service.jpg'
      },
      'maintenance-organizing': {
        name: 'Organizing Service',
        description: 'Professional organizing and tidying of living spaces, closets, and storage areas.',
        image: '/images/services/organizing-service.jpg'
      }
    },
    'deep-cleaning': {
      'sanitization-basic': {
        name: 'Basic Sanitization',
        description: 'Basic sanitization service using EPA-approved disinfectants to eliminate germs and bacteria from high-touch surfaces and common areas.',
        image: '/images/services/basic-sanitization-service.jpg'
      },
      'sanitization-disinfection': {
        name: 'Disinfection Service',
        description: 'Advanced disinfection treatment using hospital-grade disinfectants with fogging technology for comprehensive coverage of all surfaces.',
        image: '/images/services/disinfection-service.jpg'
      },
      'sanitization-ozone': {
        name: 'Ozone Treatment',
        description: 'Ozone-based sanitization that eliminates odors, allergens, and pathogens at the molecular level. Chemical-free and environmentally safe.',
        image: '/images/services/ozone-treatment-service.jpg'
      },
      'detailing-scrub': {
        name: 'Scrubbing Service',
        description: 'Deep scrubbing of surfaces to remove stubborn stains, grime, and buildup. Specialized brushes and cleaning agents for tough spots.',
        image: '/images/services/scrubbing-detail-service.jpg'
      },
      'detailing-polish': {
        name: 'Polishing Service',
        description: 'Surface polishing and restoration to bring back the original shine and luster of floors, fixtures, and surfaces. Removes scratches and wear marks.',
        image: '/images/services/polishing-service.jpg'
      },
      'detailing-steam': {
        name: 'Steam Cleaning',
        description: 'High-temperature steam cleaning that sanitizes and deep cleans without chemicals. Effective for carpets, upholstery, and hard-to-reach areas.',
        image: '/images/services/steam-service.jpg'
      }
    },
    'gardening': {
      'landscaping-pruning': {
        name: 'Pruning Service',
        description: 'Professional plant pruning to promote healthy growth, improve plant structure, and enhance the aesthetic appeal of your garden.',
        image: '/images/services/pruning-service.jpg'
      },
      'landscaping-planting': {
        name: 'Planting Service',
        description: 'Garden planting and installation of flowers, shrubs, and trees. Includes soil preparation and proper placement for optimal growth.',
        image: '/images/services/planting-service.jpg'
      },
      'landscaping-trimming': {
        name: 'Lawn Trimming',
        description: 'Precision lawn trimming around edges, walkways, and garden beds. Maintains clean lines and professional appearance.',
        image: '/images/services/lawn-trimming-service.jpg'
      },
      'maintenance-mowing': {
        name: 'Lawn Mowing',
        description: 'Regular lawn mowing service to maintain optimal grass height and promote healthy growth. Includes edging and cleanup.',
        image: '/images/services/lawn-mowing-service.jpg'
      },
      'maintenance-weeding': {
        name: 'Weeding Service',
        description: 'Comprehensive weed removal from garden beds, lawns, and walkways. Prevents regrowth and maintains garden health.',
        image: '/images/services/weeding-service.jpg'
      },
      'maintenance-fertilizing': {
        name: 'Fertilizing Service',
        description: 'Professional fertilization program tailored to your garden\'s needs. Promotes healthy growth and vibrant blooms.',
        image: '/images/services/fertilizing-service.jpg'
      }
    },
    'window-cleaning': {
      'exterior-standard': {
        name: 'Standard Exterior Cleaning',
        description: 'Standard exterior window cleaning using professional tools and solutions. Includes frames and sills for a complete clean.',
        image: '/images/services/exterior-windows-service.jpg'
      },
      'exterior-pressure': {
        name: 'Pressure Washing Windows',
        description: 'Pressure washing for windows to remove stubborn dirt, grime, and environmental pollutants. Safe pressure levels for window integrity.',
        image: '/images/services/pressure-washing-service.jpg'
      },
      'exterior-stain': {
        name: 'Stain Removal',
        description: 'Specialized stain removal for water spots, mineral deposits, and other difficult stains. Restores clarity and appearance.',
        image: '/images/services/stain-removal-service.jpg'
      },
      'interior-standard': {
        name: 'Interior Standard Cleaning',
        description: 'Interior window cleaning to remove fingerprints, smudges, and indoor pollutants. Streak-free finish guaranteed.',
        image: '/images/services/interior-windows-service.jpg'
      },
      'interior-stain': {
        name: 'Interior Stain Treatment',
        description: 'Interior stain treatment for difficult spots, pet marks, and other indoor stains. Specialized solutions for different stain types.',
        image: '/images/services/interior-stain-service.jpg'
      },
      'interior-polish': {
        name: 'Glass Polish',
        description: 'Glass polishing service to remove etching, water spots, and minor imperfections. Restores clarity and shine to glass surfaces.',
        image: '/images/services/glass-polish-service.jpg'
      }
    },
    'waterless-wash': {
      'basic-standard': {
        name: 'Standard Waterless Wash',
        description: 'Standard waterless cleaning using biodegradable formulas that lift dirt and grime without scratching surfaces. Eco-friendly option.',
        image: '/images/services/waterless-standard-service.jpg'
      },
      'basic-premium': {
        name: 'Premium Waterless Detail',
        description: 'Premium waterless detailing with additional care for wheels, trim, and interior surfaces. Includes protective coating application.',
        image: '/images/services/waterless-premium-service.jpg'
      },
      'premium-deluxe': {
        name: 'Deluxe Protection Package',
        description: 'Complete protection package with waterless wash, ceramic coating, and interior treatment. Long-lasting protection and shine.',
        image: '/images/services/waterless-deluxe-service.jpg'
      }
    }
  };

  const serviceTitles: Record<string, string> = {
    'car-washing': 'Car Washing',
    'deep-cleaning': 'Deep Cleaning',
    'gardening': 'Gardening',
    'house-cleaning': 'House Cleaning',
    'window-cleaning': 'Window Cleaning',
    'waterless-wash': 'Waterless Wash'
  };

  const serviceDescriptions: Record<string, string> = {
    'car-washing': 'Professional car washing and detailing services',
    'deep-cleaning': 'Thorough deep cleaning for homes and offices',
    'gardening': 'Lawn care and garden maintenance services',
    'house-cleaning': 'Regular house cleaning and maintenance',
    'window-cleaning': 'Professional window and glass cleaning',
    'waterless-wash': 'Eco-friendly cleaning without water'
  };

  const categoryImages: Record<string, { category1: string; category2: string }> = {
    'car-washing': { 
      category1: '/images/services/interior-category.jpg', 
      category2: '/images/services/exterior-category.jpg' 
    },
    'house-cleaning': { 
      category1: '/images/services/deep-cleaning-category.jpg', 
      category2: '/images/services/house-maintenance-category.jpg' 
    },
    'deep-cleaning': { 
      category1: '/images/services/sanitization-category.jpg', 
      category2: '/images/services/detailing-category.jpg' 
    },
    'gardening': { 
      category1: '/images/services/landscaping-category.jpg', 
      category2: '/images/services/garden-maintenance-category.jpg' 
    },
    'window-cleaning': { 
      category1: '/images/services/exterior-windows-category.jpg', 
      category2: '/images/services/interior-windows-category.jpg' 
    },
    'waterless-wash': { 
      category1: '/images/services/service-category.jpg', 
      category2: '/images/services/service-category.jpg' 
    }
  };

  const categoryTitles: Record<string, { category1: string; category2: string }> = {
    'car-washing': { category1: 'Interior Services', category2: 'Exterior Services' },
    'house-cleaning': { category1: 'Deep Cleaning', category2: 'Home Care' },
    'deep-cleaning': { category1: 'Sanitization', category2: 'Detailing' },
    'gardening': { category1: 'Landscaping', category2: 'Maintenance' },
    'window-cleaning': { category1: 'Exterior Windows', category2: 'Interior Windows' },
    'waterless-wash': { category1: 'Basic Options', category2: 'Premium Options' }
  };

  // Get service image based on service name
  const getServiceImage = (serviceName: string, serviceSlug: string, serviceObj?: any): string => {
    // If service object has an image_path, use it directly
    if (serviceObj?.image_path) {
      // If the image_path starts with uploads/, prepend the backend URL
      if (serviceObj.image_path.startsWith('/uploads/') || serviceObj.image_path.startsWith('uploads/')) {
        return `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${serviceObj.image_path.startsWith('/') ? '' : '/'}${serviceObj.image_path}`;
      }
      return serviceObj.image_path;
    }

    const lowerName = serviceName.toLowerCase();

    // Check if there's a specific mapping for this service
    const mapping = serviceMappings[serviceSlug];
    if (mapping) {
      for (const [key, value] of Object.entries(mapping)) {
        if (value.name.toLowerCase() === lowerName) {
          return value.image;
        }
      }
    }

    // Fallback images based on keywords
    if (lowerName.includes('interior') && lowerName.includes('basic')) return '/images/services/interior-basic-service.jpg';
    if (lowerName.includes('interior') && lowerName.includes('vacuum')) return '/images/services/interior-vacuum-service.jpg';
    if (lowerName.includes('interior') && lowerName.includes('detail')) return '/images/services/interior-detail-service.jpg';
    if (lowerName.includes('exterior') && lowerName.includes('basic')) return '/images/services/exterior-basic-service.jpg';
    if (lowerName.includes('wax') || lowerName.includes('polish')) return '/images/services/exterior-wax-service.jpg';
    if (lowerName.includes('exterior') && lowerName.includes('detail')) return '/images/services/exterior-detail-service.jpg';
    if (lowerName.includes('kitchen')) return '/images/services/kitchen-service.jpg';
    if (lowerName.includes('bathroom')) return '/images/services/bathroom-service.jpg';
    if (lowerName.includes('floor')) return '/images/services/floor-service.jpg';
    if (lowerName.includes('window')) return '/images/services/window-service.jpg';
    if (lowerName.includes('dust')) return '/images/services/dusting-service.jpg';
    if (lowerName.includes('organiz')) return '/images/services/organizing-service.jpg';
    if (lowerName.includes('basic') && lowerName.includes('sanitiz')) return '/images/services/basic-sanitization-service.jpg';
    if (lowerName.includes('sanitiz') && lowerName.includes('disinfec')) return '/images/services/disinfection-service.jpg';
    if (lowerName.includes('ozone')) return '/images/services/ozone-treatment-service.jpg';
    if (lowerName.includes('scrub')) return '/images/services/scrubbing-detail-service.jpg';
    if (lowerName.includes('polish')) return '/images/services/polishing-service.jpg';
    if (lowerName.includes('steam')) return '/images/services/steam-service.jpg';
    if (lowerName.includes('pruning')) return '/images/services/pruning-service.jpg';
    if (lowerName.includes('planting')) return '/images/services/planting-service.jpg';
    if (lowerName.includes('trimming')) return '/images/services/lawn-trimming-service.jpg';
    if (lowerName.includes('mowing')) return '/images/services/lawn-mowing-service.jpg';
    if (lowerName.includes('weed')) return '/images/services/weeding-service.jpg';
    if (lowerName.includes('fertiliz')) return '/images/services/fertilizing-service.jpg';

    return '/images/services/service-default.jpg';
  };

  // Get service description
  const getServiceDescription = (serviceName: string, serviceSlug: string): string => {
    const lowerName = serviceName.toLowerCase();
    
    // Check if there's a specific mapping for this service
    const mapping = serviceMappings[serviceSlug];
    if (mapping) {
      for (const [key, value] of Object.entries(mapping)) {
        if (value.name.toLowerCase() === lowerName) {
          return value.description;
        }
      }
    }

    // Default description
    return `${serviceName} - Professional service with expert care and attention to detail.`;
  };

  // Get main service image
  const getMainServiceImage = (): string => {
    const images: Record<string, string> = {
      'car-washing': "/images/service-car-wash.jpg",
      'deep-cleaning': "/images/service-deep-cleaning.jpg",
      'gardening': "/images/service-gardening.jpg",
      'house-cleaning': "/images/service-house-cleaning.jpg",
      'window-cleaning': "/images/service-window-cleaning.jpg",
      'waterless-wash': "/images/service-waterless-wash.jpg"
    };
    return images[serviceSlug] || "/images/service-default.jpg";
  };

  // Mock data
  const getMockServices = () => {
    const mockServices: Record<string, any[]> = {
      'car-washing': [
        { id: 'interior-basic', name: 'Interior Basic Clean', category: 'interior', icon: 'Chair', price: 50 },
        { id: 'interior-vacuum', name: 'Interior Vacuum', category: 'interior', icon: 'Vacuum', price: 60 },
        { id: 'interior-detail', name: 'Interior Detail', category: 'interior', icon: 'Tachometer', price: 80 },
        { id: 'exterior-basic', name: 'Exterior Basic Wash', category: 'exterior', icon: 'Soap', price: 40 },
        { id: 'exterior-wax', name: 'Wax & Polish', category: 'exterior', icon: 'Water', price: 70 },
        { id: 'exterior-detail', name: 'Full Exterior Detail', category: 'exterior', icon: 'Tint', price: 90 }
      ],
      'house-cleaning': [
        { id: 'deep-kitchen', name: 'Kitchen Deep Clean', category: 'cleaning', icon: 'Soap', price: 75 },
        { id: 'deep-bathroom', name: 'Bathroom Deep Clean', category: 'cleaning', icon: 'Shield', price: 65 },
        { id: 'deep-floor', name: 'Floor Cleaning', category: 'cleaning', icon: 'Broom', price: 55 },
        { id: 'maintenance-windows', name: 'Window Cleaning', category: 'maintenance', icon: 'Tint', price: 45 },
        { id: 'maintenance-dusting', name: 'Dusting Service', category: 'maintenance', icon: 'Broom', price: 35 },
        { id: 'maintenance-organizing', name: 'Organizing Service', category: 'maintenance', icon: 'Home', price: 85 }
      ],
      'deep-cleaning': [
        { id: 'sanitization-basic', name: 'Basic Sanitization', category: 'sanitization', icon: 'Shield', price: 60, image: '/images/services/basic-sanitization-service.jpg' },
        { id: 'sanitization-disinfection', name: 'Disinfection Service', category: 'sanitization', icon: 'Spray', price: 85, image: '/images/services/disinfection-service.jpg' },
        { id: 'sanitization-ozone', name: 'Ozone Treatment', category: 'sanitization', icon: 'Wind', price: 120, image: '/images/services/ozone-treatment-service.jpg' },
        { id: 'detailing-scrub', name: 'Scrubbing Service', category: 'detailing', icon: 'Scrubber', price: 75, image: '/images/services/scrubbing-detail-service.jpg' },
        { id: 'detailing-polish', name: 'Polishing Service', category: 'detailing', icon: 'Sparkle', price: 90, image: '/images/services/polishing-service.jpg' },
        { id: 'detailing-steam', name: 'Steam Cleaning', category: 'detailing', icon: 'Steam', price: 100, image: '/images/services/steam-service.jpg' }
      ],
      'gardening': [
        { id: 'landscaping-pruning', name: 'Pruning Service', category: 'landscaping', icon: 'Scissors', price: 80 },
        { id: 'landscaping-planting', name: 'Planting Service', category: 'landscaping', icon: 'Tree', price: 95 },
        { id: 'landscaping-trimming', name: 'Lawn Trimming', category: 'landscaping', icon: 'Scissors', price: 65 },
        { id: 'maintenance-mowing', name: 'Lawn Mowing', category: 'maintenance', icon: 'LawnMower', price: 50 },
        { id: 'maintenance-weeding', name: 'Weeding Service', category: 'maintenance', icon: 'Weed', price: 45 },
        { id: 'maintenance-fertilizing', name: 'Fertilizing Service', category: 'maintenance', icon: 'Flask', price: 70 }
      ],
      'window-cleaning': [
        { id: 'exterior-standard', name: 'Standard Exterior Cleaning', category: 'exterior', icon: 'Tint', price: 50 },
        { id: 'exterior-pressure', name: 'Pressure Washing Windows', category: 'exterior', icon: 'Water', price: 75 },
        { id: 'exterior-stain', name: 'Stain Removal', category: 'exterior', icon: 'Eraser', price: 65 },
        { id: 'interior-standard', name: 'Interior Standard Cleaning', category: 'interior', icon: 'Tint', price: 45 },
        { id: 'interior-stain', name: 'Interior Stain Treatment', category: 'interior', icon: 'Eraser', price: 55 },
        { id: 'interior-polish', name: 'Glass Polish', category: 'interior', icon: 'Sparkle', price: 60 }
      ],
      'waterless-wash': [
        { id: 'basic-standard', name: 'Standard Waterless Wash', category: 'basic', icon: 'Drop', price: 35 },
        { id: 'basic-premium', name: 'Premium Waterless Detail', category: 'basic', icon: 'Star', price: 50 },
        { id: 'premium-deluxe', name: 'Deluxe Protection Package', category: 'premium', icon: 'Diamond', price: 75 }
      ]
    };

    return mockServices[serviceSlug] || [
      { id: 'basic', name: 'Basic Service', category: 'basic', icon: 'Broom', price: 50 },
      { id: 'premium', name: 'Premium Service', category: 'premium', icon: 'Magic', price: 80 },
      { id: 'deluxe', name: 'Deluxe Service', category: 'deluxe', icon: 'Home', price: 120 }
    ];
  };

  const fetchServiceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Set basic service details
      setServiceDetails({
        name: serviceTitles[serviceSlug] || 'Service',
        description: serviceDescriptions[serviceSlug] || 'Service details',
        slug: serviceSlug
      });

      // Try API fetch first
      try {
        const response = await fetch(`/api/v1/services/hierarchy`);
        if (response.ok) {
          const data = await response.json();
          const allServices = data.data;
          const mainService = allServices.find((s: any) => s.slug === serviceSlug);

          if (mainService) {
            // Process API data
            let allSubCategories: any[] = [];
            
            if (mainService.head_categories?.length > 0) {
              mainService.head_categories.forEach((headCat: any) => {
                if (headCat.sub_categories?.length > 0) {
                  allSubCategories = [...allSubCategories, ...headCat.sub_categories];
                }
              });
            }

            if (allSubCategories.length > 0) {
              // Fetch pricing
              let pricingData: any[] = [];
              try {
                const pricingResponse = await fetch(`/api/v1/pricing?vehicle_type=${selectedVehicleType}`);
                if (pricingResponse.ok) {
                  const pricingResult = await pricingResponse.json();
                  pricingData = pricingResult.data || [];
                }
              } catch (pricingError) {
                console.warn('Failed to fetch pricing data:', pricingError);
              }

              // Map services
              const mappedServices = allSubCategories.map((service: any) => {
                const mapping = serviceMappings[serviceSlug];
                const mappedService = mapping ? mapping[service.slug] : null;
                const mappedName = mappedService?.name || service.name;
                const mappedImage = mappedService?.image; // Get the mapped image if available
                const servicePricing = pricingData.find((pricingItem: any) =>
                  pricingItem.serviceId === service.id.toString()
                );

                return {
                  id: service.id.toString(),
                  name: mappedName,
                  slug: service.slug,
                  description: service.description,
                  detailedDescription: service.detailed_description || service.description,
                  category: service.category,
                  icon: service.icon || 'Broom',
                  is_active: service.is_active,
                  created_at: service.created_at,
                  updated_at: service.updated_at,
                  isSelected: false,
                  price: servicePricing?.price || 0,
                  image_path: mappedImage // Add the mapped image for later use
                };
              });

              setServices(mappedServices);
              setLoading(false);
              return;
            }
          }
        }
      } catch (apiError) {
        console.warn('API fetch failed, using mock data:', apiError);
      }

      // Fallback to mock data
      const mockServices = getMockServices().map(service => ({
        ...service,
        id: `${serviceSlug}-${service.id}`,
        slug: service.id,
        description: service.name,
        detailedDescription: getServiceDescription(service.name, serviceSlug),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isSelected: false
      }));

      setServices(mockServices);
      setLoading(false);
    } catch (err) {
      setError('Failed to load service details. Please try again.');
      console.error('Error fetching service data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceSlug) {
      fetchServiceData();
    }
  }, [serviceSlug, selectedVehicleType]);

  useEffect(() => {
    const selectedServices = services.filter(service => service.isSelected);
    const total = selectedServices.reduce((sum, service) => sum + (service.price || 0), 0);
    setSubtotal(total);
  }, [services]);

  const handleServiceSelection = (serviceId: string, isSelected: boolean) => {
    setServices(prevServices => 
      prevServices.map(service => 
        service.id === serviceId ? { ...service, isSelected } : service
      )
    );
  };

  const handleVehicleTypeChange = (newVehicleType: 'sedan' | 'suv' | 'hatchback' | 'bike') => {
    setSelectedVehicleType(newVehicleType);
  };

  const handleViewDetail = (service: any) => {
    const serviceImage = getServiceImage(service.name, serviceSlug, service);
    const serviceDescription = getServiceDescription(service.name, serviceSlug);

    setSelectedService({
      ...service,
      image: serviceImage,
      detailedDescription: service.detailedDescription || serviceDescription
    });
    setIsModalOpen(true);
  };

  const handleConfirmSelections = () => {
    const selectedServices = services.filter(service => service.isSelected);

    if (selectedServices.length === 0) {
      alert('Please select at least one service option');
      return;
    }

    const encodedServices = encodeURIComponent(JSON.stringify({
      serviceSlug,
      serviceName: serviceDetails?.name || serviceSlug.replace('-', ' '),
      serviceImage: getMainServiceImage(), // Pass the main service image
      selectedServices,
      selectedVehicleType
    }));

    router.push(`/book?selectedData=${encodedServices}`);
  };

  // Organize services into categories
  const getCategorizedServices = () => {
    const allServices = [...services];
    const totalServices = allServices.length;
    const halfPoint = Math.ceil(totalServices / 2);

    const category1Services = allServices.slice(0, halfPoint);
    const category2Services = allServices.slice(halfPoint);

    const titles = categoryTitles[serviceSlug] || { category1: 'Services', category2: '' };
    const images = categoryImages[serviceSlug] || { category1: '/images/services/service-category.jpg', category2: '/images/services/service-category.jpg' };

    return {
      category1: {
        title: titles.category1,
        image: images.category1,
        services: category1Services
      },
      category2: {
        title: titles.category2,
        image: images.category2,
        services: category2Services
      }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading {serviceDetails?.name || serviceSlug.replace('-', ' ')}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary hover:text-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const categorizedServices = getCategorizedServices();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center mb-6">
            <img 
              src={getMainServiceImage()} 
              alt={serviceDetails?.name} 
              className="w-16 h-16 object-cover rounded-full"
              onError={(e) => {(e.currentTarget as HTMLImageElement).src = "https://placehold.co/64x64/0f766e/white?text=Svc";}}
            />
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">Customize {serviceDetails?.name || serviceSlug.replace('-', ' ')}</h1>
              <p className="text-gray-600">{serviceDetails?.description || 'Select options for your service'}</p>
            </div>
          </div>

          {serviceSlug === 'car-washing' && (
            <div className="mb-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Select Vehicle Type</h3>
                <div className="grid grid-cols-4 gap-2">
                  {(['sedan', 'suv', 'hatchback', 'bike'] as const).map((type) => (
                    <button
                      key={type}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all min-h-[60px] ${
                        selectedVehicleType === type
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 bg-white hover:border-primary/30'
                      }`}
                      onClick={() => handleVehicleTypeChange(type)}
                    >
                      <div className="text-lg mb-0.5">
                        {type === 'sedan' && '🚙'}
                        {type === 'suv' && '🚐'}
                        {type === 'hatchback' && '🚗'}
                        {type === 'bike' && '🏍️'}
                      </div>
                      <span className="capitalize text-xs font-medium text-center">{type}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Services</h2>

            {/* Category 1 */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{categorizedServices.category1.title}</h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                {categorizedServices.category1.services.map((service) => {
                  const serviceImage = getServiceImage(service.name, serviceSlug, service);
                  return (
                    <div key={service.id} className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <div
                          onClick={() => handleServiceSelection(service.id, !service.isSelected)}
                          className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center cursor-pointer transition-all overflow-hidden transform shadow-lg border-2 ${
                            service.isSelected
                              ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/10 scale-105 shadow-xl'
                              : 'border-gray-200 hover:border-primary hover:shadow-xl hover:scale-105 bg-gradient-to-br from-gray-50 to-gray-100'
                          }`}
                        >
                          <img
                            src={serviceImage}
                            alt={service.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {(e.currentTarget as HTMLImageElement).src = `https://placehold.co/112x112/0f766e/white?text=${service.name.charAt(0)}`;}}
                          />
                        </div>
                        {service.isSelected && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-xl border border-white z-10">
                            ✓
                          </div>
                        )}
                      </div>
                      <div className="text-center w-full flex flex-col items-center gap-1">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem]">{service.name}</p>
                        <button onClick={() => router.push(`/services/${serviceSlug}/details/${service.slug}`)} className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-primary via-primary to-primary/90 rounded-full hover:from-primary/90 hover:via-primary/85 hover:to-primary/80 shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95">
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category 2 */}
            {categorizedServices.category2.services.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{categorizedServices.category2.title}</h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  {categorizedServices.category2.services.map((service) => {
                    const serviceImage = getServiceImage(service.name, serviceSlug, service);
                    return (
                      <div key={service.id} className="flex flex-col items-center gap-2">
                        <div className="relative">
                          <div
                            onClick={() => handleServiceSelection(service.id, !service.isSelected)}
                            className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center cursor-pointer transition-all overflow-hidden transform shadow-lg border-2 ${
                              service.isSelected
                                ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/10 scale-105 shadow-xl'
                                : 'border-gray-200 hover:border-primary hover:shadow-xl hover:scale-105 bg-gradient-to-br from-gray-50 to-gray-100'
                            }`}
                          >
                            <img
                              src={serviceImage}
                              alt={service.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {(e.currentTarget as HTMLImageElement).src = `https://placehold.co/112x112/0f766e/white?text=${service.name.charAt(0)}`;}}
                            />
                          </div>
                          {service.isSelected && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-xl border border-white z-10">
                              ✓
                            </div>
                          )}
                        </div>
                        <div className="text-center w-full flex flex-col items-center gap-1">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem]">{service.name}</p>
                          <button onClick={() => router.push(`/services/${serviceSlug}/details/${service.slug}`)} className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-primary via-primary to-primary/90 rounded-full hover:from-primary/90 hover:via-primary/85 hover:to-primary/80 shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95">
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold text-gray-900">Subtotal:</span>
              <span className="text-2xl font-bold text-primary">${subtotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleConfirmSelections}
              disabled={services.filter(s => s.isSelected).length === 0}
              className={`w-full py-3 px-6 rounded-md text-white font-semibold ${
                services.filter(s => s.isSelected).length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-secondary hover:text-primary'
              }`}
            >
              Confirm Selections
            </button>
          </div>
        </div>
      </div>

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedService}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ServiceDetailPage;