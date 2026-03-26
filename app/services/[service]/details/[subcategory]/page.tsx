'use client';

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ServiceType {
  id: string;
  name: string;
  slug: string;
  description: string;
  detailedDescription: string;
  category: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  isSelected: boolean;
  image_path?: string;
  price?: number;
}

export default function SubServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Use optional chaining with type assertion
  const serviceSlug = params?.service as string | undefined;
  const subcategorySlug = params?.subcategory as string | undefined;

  const [service, setService] = useState<ServiceType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);

  // Early return if params are missing
  if (!serviceSlug || !subcategorySlug) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid URL</h1>
            <p className="text-gray-700">Service or subcategory parameter is missing.</p>
            <button
              onClick={() => router.push('/services')}
              className="mt-4 bg-primary text-white py-2 px-4 rounded-md hover:bg-secondary hover:text-primary"
            >
              Browse Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Now serviceSlug and subcategorySlug are guaranteed to be strings
  // Fetch service data from API
  useEffect(() => {
    const fetchServiceDetail = async () => {
      try {
        setLoading(true);

        // Try to fetch from API first
        try {
          const response = await fetch(`/api/v1/services/hierarchy`);
          if (response.ok) {
            const data = await response.json();
            const allServices = data.data;
            const mainService = allServices.find((s: any) => s.slug === serviceSlug);

            if (mainService) {
              let allSubCategories: any[] = [];

              if (mainService.head_categories?.length > 0) {
                mainService.head_categories.forEach((headCat: any) => {
                  if (headCat.sub_categories?.length > 0) {
                    allSubCategories = [...allSubCategories, ...headCat.sub_categories];
                  }
                });
              }

              // Find the specific service based on the subcategory slug
              const apiService = allSubCategories.find((s: any) => s.slug === subcategorySlug);

              if (apiService) {
                // Fetch pricing for this specific service
                let servicePrice = null;
                try {
                  const pricingResponse = await fetch(`/api/v1/pricing`);
                  if (pricingResponse.ok) {
                    const pricingData = await pricingResponse.json();
                    const pricingItem = pricingData.data.find((item: any) =>
                      item.serviceId === apiService.id.toString()
                    );
                    servicePrice = pricingItem?.price || null;
                  }
                } catch (pricingErr) {
                  console.warn('Failed to fetch pricing data:', pricingErr);
                }

                const serviceDetail: ServiceType = {
                  id: apiService.id.toString(),
                  name: apiService.name,
                  slug: apiService.slug,
                  description: apiService.description || '',
                  detailedDescription: apiService.detailed_description || apiService.description || '',
                  category: apiService.category || 'general',
                  icon: apiService.icon || 'Broom',
                  is_active: apiService.is_active ?? true,
                  created_at: apiService.created_at || new Date().toISOString(),
                  updated_at: apiService.updated_at || new Date().toISOString(),
                  isSelected: false,
                  image_path: apiService.image_path,
                  price: servicePrice
                };

                setService(serviceDetail);
                setPrice(servicePrice);
                setLoading(false);
                return;
              }
            }
          }
        } catch (apiError) {
          console.warn('API fetch failed, falling back to mock data:', apiError);
        }

        // Fallback to mock data if API fails
        // Define all services based on the main service type
        let allServices: ServiceType[] = [];

        // Sample price mapping based on service type
        const priceMap: Record<string, number> = {
          // Car washing services
          'interior-basic': 50,
          'interior-vacuum': 60,
          'interior-detail': 80,
          'exterior-basic': 40,
          'exterior-wax': 70,
          'exterior-detail': 90,

          // House cleaning services
          'deep-kitchen': 75,
          'deep-bathroom': 65,
          'deep-floor': 55,
          'maintenance-windows': 45,
          'maintenance-dusting': 35,
          'maintenance-organizing': 85,

          // Gardening services
          'landscaping-pruning': 80,
          'landscaping-planting': 95,
          'landscaping-trimming': 65,
          'maintenance-mowing': 50,
          'maintenance-weeding': 45,
          'maintenance-fertilizing': 70,

          // Deep cleaning services
          'sanitization-basic': 60,
          'sanitization-disinfection': 85,
          'sanitization-ozone': 120,
          'detailing-scrub': 75,
          'detailing-polish': 90,
          'detailing-steam': 100,

          // Window cleaning services
          'exterior-standard': 50,
          'exterior-pressure': 75,
          'exterior-stain': 65,
          'interior-standard': 45,
          'interior-stain': 55,
          'interior-polish': 60,

          // Waterless wash services
          'basic-standard': 35,
          'basic-premium': 50,
          'premium-deluxe': 75,

          // Default services
          'basic': 50,
          'premium': 80,
          'deluxe': 120
        };

        switch (serviceSlug) { // Now serviceSlug is definitely a string
          case 'car-washing':
            allServices = [
              {
                id: `${serviceSlug}-interior-basic`,
                name: 'Interior Basic Clean',
                slug: 'interior-basic',
                description: 'Basic interior cleaning',
                detailedDescription: 'Basic interior cleaning including vacuuming seats and carpets, wiping down dashboard and surfaces, cleaning windows, and removing surface debris. Perfect for regular maintenance between deep cleans.',
                category: 'interior',
                icon: 'Chair',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['interior-basic'],
                image_path: '/images/services/interior-basic-service.jpg'
              },
              {
                id: `${serviceSlug}-interior-vacuum`,
                name: 'Interior Vacuum',
                slug: 'interior-vacuum',
                description: 'Thorough vacuuming of seats, carpets, floor mats, and hard-to-reach areas',
                detailedDescription: 'Thorough vacuuming of seats, carpets, floor mats, and hard-to-reach areas using professional-grade equipment. Includes crevice tool for detailed cleaning of tight spaces.',
                category: 'interior',
                icon: 'Vacuum',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['interior-vacuum'],
                image_path: '/images/services/interior-vacuum-service.jpg'
              },
              {
                id: `${serviceSlug}-interior-detail`,
                name: 'Interior Detail',
                slug: 'interior-detail',
                description: 'Comprehensive interior detailing',
                detailedDescription: 'Comprehensive interior detailing including deep cleaning of seats, carpets, and upholstery, conditioning of leather surfaces, and deodorizing treatments.',
                category: 'interior',
                icon: 'Tachometer',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['interior-detail'],
                image_path: '/images/services/interior-detail-service.jpg'
              },
              {
                id: `${serviceSlug}-exterior-basic`,
                name: 'Exterior Basic Wash',
                slug: 'exterior-basic',
                description: 'Basic exterior wash',
                detailedDescription: 'Basic exterior wash including soap wash, rinse, and hand dry. Includes cleaning of wheels and tires. Perfect for maintaining your car\'s appearance.',
                category: 'exterior',
                icon: 'Soap',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['exterior-basic'],
                image_path: '/images/services/exterior-basic-service.jpg'
              },
              {
                id: `${serviceSlug}-exterior-wax`,
                name: 'Wax & Polish',
                slug: 'exterior-wax',
                description: 'Professional waxing and polishing',
                detailedDescription: 'Professional waxing and polishing service that protects your car\'s paint while providing a deep shine. Includes protective coating for long-lasting protection.',
                category: 'exterior',
                icon: 'Water',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['exterior-wax'],
                image_path: '/images/services/exterior-wax-service.jpg'
              },
              {
                id: `${serviceSlug}-exterior-detail`,
                name: 'Full Exterior Detail',
                slug: 'exterior-detail',
                description: 'Complete exterior detailing',
                detailedDescription: 'Complete exterior detailing including clay bar treatment to remove contaminants, paint correction for swirl marks, and multiple layers of protective wax.',
                category: 'exterior',
                icon: 'Tint',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['exterior-detail'],
                image_path: '/images/services/exterior-detail-service.jpg'
              }
            ];
            break;
          case 'house-cleaning':
            allServices = [
              {
                id: `${serviceSlug}-deep-kitchen`,
                name: 'Kitchen Deep Clean',
                slug: 'deep-kitchen',
                description: 'Comprehensive deep cleaning of kitchen',
                detailedDescription: 'Comprehensive deep cleaning of kitchen including appliances, cabinets, countertops, sink, and backsplash. Grease removal and sanitization of all surfaces.',
                category: 'cleaning',
                icon: 'Soap',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['deep-kitchen'],
                image_path: '/images/services/kitchen-service.jpg'
              },
              {
                id: `${serviceSlug}-deep-bathroom`,
                name: 'Bathroom Deep Clean',
                slug: 'deep-bathroom',
                description: 'Thorough cleaning of bathroom',
                detailedDescription: 'Thorough cleaning of bathroom including toilet, shower, tub, sink, mirrors, and tile surfaces. Sanitization and disinfection of all contact points.',
                category: 'cleaning',
                icon: 'Shield',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['deep-bathroom'],
                image_path: '/images/services/bathroom-service.jpg'
              },
              {
                id: `${serviceSlug}-deep-floor`,
                name: 'Floor Cleaning',
                slug: 'deep-floor',
                description: 'Deep cleaning and mopping of all floor surfaces',
                detailedDescription: 'Deep cleaning and mopping of all floor surfaces including hardwood, tile, laminate, and other materials. Specialized treatment for different floor types.',
                category: 'cleaning',
                icon: 'Broom',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['deep-floor'],
                image_path: '/images/services/floor-service.jpg'
              },
              {
                id: `${serviceSlug}-maintenance-windows`,
                name: 'Window Cleaning',
                slug: 'maintenance-windows',
                description: 'Professional cleaning of interior and exterior windows',
                detailedDescription: 'Professional cleaning of interior and exterior windows, frames, and sills. Streak-free finish with professional cleaning solutions.',
                category: 'maintenance',
                icon: 'Tint',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['maintenance-windows'],
                image_path: '/images/services/window-service.jpg'
              },
              {
                id: `${serviceSlug}-maintenance-dusting`,
                name: 'Dusting Service',
                slug: 'maintenance-dusting',
                description: 'Comprehensive dusting of all furniture and surfaces',
                detailedDescription: 'Comprehensive dusting of all furniture, electronics, blinds, and surfaces throughout the home. Microfiber cloths for effective dust removal.',
                category: 'maintenance',
                icon: 'Broom',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['maintenance-dusting'],
                image_path: '/images/services/dusting-service.jpg'
              },
              {
                id: `${serviceSlug}-maintenance-organizing`,
                name: 'Organizing Service',
                slug: 'maintenance-organizing',
                description: 'Professional organizing and tidying',
                detailedDescription: 'Professional organizing and tidying of living spaces, closets, and storage areas. Customized solutions to maintain organized spaces.',
                category: 'maintenance',
                icon: 'Home',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['maintenance-organizing'],
                image_path: '/images/services/organizing-service.jpg'
              }
            ];
            break;
          case 'deep-cleaning':
            allServices = [
              {
                id: `${serviceSlug}-sanitization-basic`,
                name: 'Basic Sanitization',
                slug: 'sanitization-basic',
                description: 'Basic sanitization service',
                detailedDescription: 'Basic sanitization service using EPA-approved disinfectants to eliminate germs and bacteria from high-touch surfaces and common areas.',
                category: 'sanitization',
                icon: 'Shield',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['sanitization-basic'],
                image_path: '/images/services/basic-sanitization-service.jpg'
              },
              {
                id: `${serviceSlug}-sanitization-disinfection`,
                name: 'Disinfection Service',
                slug: 'sanitization-disinfection',
                description: 'Advanced disinfection treatment',
                detailedDescription: 'Advanced disinfection treatment using hospital-grade disinfectants with fogging technology for comprehensive coverage of all surfaces.',
                category: 'sanitization',
                icon: 'Spray',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['sanitization-disinfection'],
                image_path: '/images/services/disinfection-service.jpg'
              },
              {
                id: `${serviceSlug}-sanitization-ozone`,
                name: 'Ozone Treatment',
                slug: 'sanitization-ozone',
                description: 'Ozone-based sanitization',
                detailedDescription: 'Ozone-based sanitization that eliminates odors, allergens, and pathogens at the molecular level. Chemical-free and environmentally safe.',
                category: 'sanitization',
                icon: 'Wind',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['sanitization-ozone'],
                image_path: '/images/services/ozone-treatment-service.jpg'
              },
              {
                id: `${serviceSlug}-detailing-scrub`,
                name: 'Scrubbing Service',
                slug: 'detailing-scrub',
                description: 'Deep scrubbing of surfaces',
                detailedDescription: 'Deep scrubbing of surfaces to remove stubborn stains, grime, and buildup. Specialized brushes and cleaning agents for tough spots.',
                category: 'detailing',
                icon: 'Scrubber',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['detailing-scrub'],
                image_path: '/images/services/scrubbing-detail-service.jpg'
              },
              {
                id: `${serviceSlug}-detailing-polish`,
                name: 'Polishing Service',
                slug: 'detailing-polish',
                description: 'Surface polishing and restoration',
                detailedDescription: 'Surface polishing and restoration to bring back the original shine and luster of floors, fixtures, and surfaces. Removes scratches and wear marks.',
                category: 'detailing',
                icon: 'Sparkle',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['detailing-polish'],
                image_path: '/images/services/polishing-service.jpg'
              },
              {
                id: `${serviceSlug}-detailing-steam`,
                name: 'Steam Cleaning',
                slug: 'detailing-steam',
                description: 'High-temperature steam cleaning',
                detailedDescription: 'High-temperature steam cleaning that sanitizes and deep cleans without chemicals. Effective for carpets, upholstery, and hard-to-reach areas.',
                category: 'detailing',
                icon: 'Steam',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['detailing-steam'],
                image_path: '/images/services/steam-service.jpg'
              }
            ];
            break;
          case 'gardening':
            allServices = [
              {
                id: `${serviceSlug}-landscaping-pruning`,
                name: 'Pruning Service',
                slug: 'landscaping-pruning',
                description: 'Professional plant pruning',
                detailedDescription: 'Professional plant pruning to promote healthy growth, improve plant structure, and enhance the aesthetic appeal of your garden.',
                category: 'landscaping',
                icon: 'Scissors',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['landscaping-pruning'],
                image_path: '/images/services/pruning-service.jpg'
              },
              {
                id: `${serviceSlug}-landscaping-planting`,
                name: 'Planting Service',
                slug: 'landscaping-planting',
                description: 'Garden planting and installation',
                detailedDescription: 'Garden planting and installation of flowers, shrubs, and trees. Includes soil preparation and proper placement for optimal growth.',
                category: 'landscaping',
                icon: 'Tree',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['landscaping-planting'],
                image_path: '/images/services/planting-service.jpg'
              },
              {
                id: `${serviceSlug}-landscaping-trimming`,
                name: 'Lawn Trimming',
                slug: 'landscaping-trimming',
                description: 'Precision lawn trimming',
                detailedDescription: 'Precision lawn trimming around edges, walkways, and garden beds. Maintains clean lines and professional appearance.',
                category: 'landscaping',
                icon: 'Scissors',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['landscaping-trimming'],
                image_path: '/images/services/lawn-trimming-service.jpg'
              },
              {
                id: `${serviceSlug}-maintenance-mowing`,
                name: 'Lawn Mowing',
                slug: 'maintenance-mowing',
                description: 'Regular lawn mowing service',
                detailedDescription: 'Regular lawn mowing service to maintain optimal grass height and promote healthy growth. Includes edging and cleanup.',
                category: 'maintenance',
                icon: 'LawnMower',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['maintenance-mowing'],
                image_path: '/images/services/lawn-mowing-service.jpg'
              },
              {
                id: `${serviceSlug}-maintenance-weeding`,
                name: 'Weeding Service',
                slug: 'maintenance-weeding',
                description: 'Comprehensive weed removal',
                detailedDescription: 'Comprehensive weed removal from garden beds, lawns, and walkways. Prevents regrowth and maintains garden health.',
                category: 'maintenance',
                icon: 'Weed',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['maintenance-weeding'],
                image_path: '/images/services/weeding-service.jpg'
              },
              {
                id: `${serviceSlug}-maintenance-fertilizing`,
                name: 'Fertilizing Service',
                slug: 'maintenance-fertilizing',
                description: 'Professional fertilization',
                detailedDescription: 'Professional fertilization program tailored to your garden\'s needs. Promotes healthy growth and vibrant blooms.',
                category: 'maintenance',
                icon: 'Flask',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['maintenance-fertilizing'],
                image_path: '/images/services/fertilizing-service.jpg'
              }
            ];
            break;
          case 'window-cleaning':
            allServices = [
              {
                id: `${serviceSlug}-exterior-standard`,
                name: 'Standard Exterior Cleaning',
                slug: 'exterior-standard',
                description: 'Standard exterior window cleaning',
                detailedDescription: 'Standard exterior window cleaning using professional tools and solutions. Includes frames and sills for a complete clean.',
                category: 'exterior',
                icon: 'Tint',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['exterior-standard'],
                image_path: '/images/services/exterior-windows-service.jpg'
              },
              {
                id: `${serviceSlug}-exterior-pressure`,
                name: 'Pressure Washing Windows',
                slug: 'exterior-pressure',
                description: 'Pressure washing for windows',
                detailedDescription: 'Pressure washing for windows to remove stubborn dirt, grime, and environmental pollutants. Safe pressure levels for window integrity.',
                category: 'exterior',
                icon: 'Water',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['exterior-pressure'],
                image_path: '/images/services/pressure-washing-service.jpg'
              },
              {
                id: `${serviceSlug}-exterior-stain`,
                name: 'Stain Removal',
                slug: 'exterior-stain',
                description: 'Specialized stain removal',
                detailedDescription: 'Specialized stain removal for water spots, mineral deposits, and other difficult stains. Restores clarity and appearance.',
                category: 'exterior',
                icon: 'Eraser',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['exterior-stain'],
                image_path: '/images/services/stain-removal-service.jpg'
              },
              {
                id: `${serviceSlug}-interior-standard`,
                name: 'Interior Standard Cleaning',
                slug: 'interior-standard',
                description: 'Interior window cleaning',
                detailedDescription: 'Interior window cleaning to remove fingerprints, smudges, and indoor pollutants. Streak-free finish guaranteed.',
                category: 'interior',
                icon: 'Tint',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['interior-standard'],
                image_path: '/images/services/interior-windows-service.jpg'
              },
              {
                id: `${serviceSlug}-interior-stain`,
                name: 'Interior Stain Treatment',
                slug: 'interior-stain',
                description: 'Interior stain treatment',
                detailedDescription: 'Interior stain treatment for difficult spots, pet marks, and other indoor stains. Specialized solutions for different stain types.',
                category: 'interior',
                icon: 'Eraser',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['interior-stain'],
                image_path: '/images/services/interior-stain-service.jpg'
              },
              {
                id: `${serviceSlug}-interior-polish`,
                name: 'Glass Polish',
                slug: 'interior-polish',
                description: 'Glass polishing service',
                detailedDescription: 'Glass polishing service to remove etching, water spots, and minor imperfections. Restores clarity and shine to glass surfaces.',
                category: 'interior',
                icon: 'Sparkle',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['interior-polish'],
                image_path: '/images/services/glass-polish-service.jpg'
              }
            ];
            break;
          case 'waterless-wash':
            allServices = [
              {
                id: `${serviceSlug}-basic-standard`,
                name: 'Standard Waterless Wash',
                slug: 'basic-standard',
                description: 'Standard waterless cleaning',
                detailedDescription: 'Standard waterless cleaning using biodegradable formulas that lift dirt and grime without scratching surfaces. Eco-friendly option.',
                category: 'basic',
                icon: 'Drop',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['basic-standard'],
                image_path: '/images/services/waterless-standard-service.jpg'
              },
              {
                id: `${serviceSlug}-basic-premium`,
                name: 'Premium Waterless Detail',
                slug: 'basic-premium',
                description: 'Premium waterless detailing',
                detailedDescription: 'Premium waterless detailing with additional care for wheels, trim, and interior surfaces. Includes protective coating application.',
                category: 'basic',
                icon: 'Star',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['basic-premium'],
                image_path: '/images/services/waterless-premium-service.jpg'
              },
              {
                id: `${serviceSlug}-premium-deluxe`,
                name: 'Deluxe Protection Package',
                slug: 'premium-deluxe',
                description: 'Complete protection package',
                detailedDescription: 'Complete protection package with waterless wash, ceramic coating, and interior treatment. Long-lasting protection and shine.',
                category: 'premium',
                icon: 'Diamond',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                price: priceMap['premium-deluxe'],
                image_path: '/images/services/waterless-deluxe-service.jpg'
              }
            ];
            break;
          default:
            // For any other service types, create a generic service
            allServices = [
              {
                id: `${serviceSlug}-${subcategorySlug}`,
                name: subcategorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                slug: subcategorySlug,
                description: `Service for ${serviceSlug.replace(/-/g, ' ')}`,
                detailedDescription: `Detailed information about the ${subcategorySlug.replace(/-/g, ' ')} service for ${serviceSlug.replace(/-/g, ' ')}. This service provides professional and high-quality results.`,
                category: 'general',
                icon: 'Broom',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isSelected: false,
                image_path: `/images/services/${subcategorySlug}.jpg`, // Default image path
                price: priceMap[subcategorySlug] || 50
              }
            ];
        }

        // Find the specific service based on the subcategory slug
        const foundService = allServices.find(s => s.slug === subcategorySlug); // subcategorySlug is definitely a string

        if (foundService) {
          setService(foundService);
          setPrice(foundService.price || null);
        } else {
          setError('Service not found');
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load service details');
        setLoading(false);
      }
    };

    fetchServiceDetail();
  }, [serviceSlug, subcategorySlug]); // Now these are strings, not string | undefined

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h1>
            <p className="text-gray-700">{error || 'The requested service could not be found.'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 bg-primary text-white py-2 px-4 rounded-md hover:bg-secondary hover:text-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Function to get image path
  const getImagePath = (imagePath: string) => {
    if (!imagePath || imagePath.trim() === '') return "https://placehold.co/500x400/0f766e/white?text=Service";

    return imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
      : imagePath;
  };

  // Function to handle adding service to cart
  const handleAddToOrder = () => {
    // Prepare service data for booking
    const serviceData = {
      id: service.id,
      name: service.name,
      slug: service.slug,
      price: service.price,
      serviceSlug: serviceSlug // Now definitely a string
    };

    // Store in localStorage for booking page
    localStorage.setItem('selectedService', JSON.stringify(serviceData));
    
    // Navigate to booking page
    router.push(`/book?service=${serviceSlug}&subservice=${service.slug}`); // serviceSlug is definitely a string
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.button
          onClick={() => router.back()}
          className="mb-6 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-white hover:bg-primary/80 shadow-lg transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Go back"
        >
          <span className="text-base sm:text-lg font-black">←</span>
        </motion.button>

        <motion.div
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Service Image */}
          <div className="relative w-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-t-2xl">
            <motion.img
              src={getImagePath(service.image_path || '')}
              alt={service.name}
              className="w-full h-64 sm:h-80 md:h-96 object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://placehold.co/500x400/0f766e/white?text=Service";
              }}
            />
          </div>

          {/* Service Header */}
          <motion.div
            className="p-6 md:p-8 border-b border-gray-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div>
              <motion.h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {service.name}
              </motion.h1>
              <motion.p
                className="text-gray-600 mt-3 text-sm sm:text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {service.description}
              </motion.p>
              <motion.div
                className="mt-4 inline-block bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-xs sm:text-sm px-4 py-2 rounded-full font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                {service.category.toUpperCase()}
              </motion.div>
            </div>
          </motion.div>

          {/* Service Details */}
          <motion.div
            className="p-6 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.h2
              className="text-xl sm:text-2xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              Service Details
            </motion.h2>
            <motion.p
              className="text-gray-700 leading-relaxed mb-6 text-sm sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {service.detailedDescription}
            </motion.p>

            {/* Price Display */}
            {price && (
              <motion.div
                className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-xl border-2 border-primary/20 mb-6"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-semibold text-lg">Price:</span>
                  <motion.span
                    className="text-3xl sm:text-4xl font-bold text-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                  >
                    ${price.toFixed(2)}
                  </motion.span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="p-6 md:p-8 border-t bg-gradient-to-r from-gray-50 to-gray-100 flex flex-col sm:flex-row justify-end gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              onClick={() => router.back()}
              className="py-3 px-6 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-white hover:border-gray-400 font-bold transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              ← Back
            </motion.button>
            <motion.button
              onClick={handleAddToOrder}
              className="py-3 px-8 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg hover:from-primary/90 hover:to-primary/70 font-bold shadow-lg transition-all flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              ✓ Add to Order
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}