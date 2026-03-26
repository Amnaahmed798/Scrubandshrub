'use client';

import { useState, useEffect } from 'react';
import { Service } from '../../../lib/types';
import { getPublicServices } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import { useI18n } from '@/lib/i18n';

interface ServiceCardsProps {
  onServiceSelect?: (service: Service, multiSelect?: boolean) => void;
}

export function ServiceCards({ onServiceSelect }: ServiceCardsProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, locale } = useI18n();

  // Helper function to translate service names based on slug
  const translateServiceName = (service: Service): string => {
    // If locale is English, return the name as-is (from backend)
    if (locale === 'en') return service.name;

    // Map service slugs to translation keys
    const serviceKeyMap: Record<string, string> = {
      'car-washing': 'serviceCarWashing',
      'basic-wash': 'serviceCarWashing',
      'premium-wash': 'serviceDeepCleaning',
      'deluxe-wash': 'serviceDeepCleaning',
      'deep-cleaning': 'serviceDeepCleaning',
      'house-cleaning': 'serviceHouseCleaning',
      'gardening': 'serviceGardening',
      'window-cleaning': 'serviceCarWashing', // Use existing translation for now
      'waterless-wash': 'serviceCarWashing'
    };

    const key = serviceKeyMap[service.slug];
    if (key) {
      const translated = t(`home.${key}`);
      // Return translation if it exists and is different from the key
      if (translated && translated !== `home.${key}`) {
        return translated;
      }
    }

    // Fallback: return the original name if no translation found
    return service.name;
  };

  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        setLoading(true);
        const servicesData = await getPublicServices();
        if (servicesData && Array.isArray(servicesData)) {
          // Transform backend response to match frontend Service type
          const transformedServices = servicesData.map((service: any) => ({
            id: service.id ? service.id.toString() : '',
            slug: service.slug || service.name.toLowerCase().replace(/\s+/g, '-'),
            name: service.name || '',
            description: service.description || '',
            category: service.category || 'cleaning',
            icon: service.icon || '',
            is_active: service.is_active !== undefined ? service.is_active : true,
            service_type: service.service_type,
            parent_service_id: service.parent_service_id,
            created_at: service.created_at || new Date().toISOString(),
            updated_at: service.updated_at || new Date().toISOString(),
          }));

          // Filter only active main services (not sub-services), excluding Window Cleaning and Waterless Wash
          const activeMainServices = transformedServices.filter(service =>
            service.is_active !== false &&
            service.service_type === 'main_service' &&
            service.name !== 'Window Cleaning' &&
            service.name !== 'Waterless Wash'
          );
          setServices(activeMainServices);
        } else {
          setServices([]);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services');
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServicesData();
  }, []);

  const handleServiceClick = (service: Service) => {
    // According to clarification, other services remain available for selection (multi-select allowed)
    let newSelectedServices: string[];

    if (selectedServices.includes(service.id || '')) {
      // Deselect if already selected
      newSelectedServices = selectedServices.filter(id => id !== service.id);
    } else {
      // Add to selection
      newSelectedServices = [...selectedServices, service.id || ''];
    }

    setSelectedServices(newSelectedServices);

    if (onServiceSelect) {
      onServiceSelect(service, true); // multi-select is allowed
    }
  };

  const getServiceImage = (service: any) => {
    // Map service names to realistic images
    const serviceImageMap: Record<string, string> = {
      'car-washing': '/images/service-car-wash.jpg',
      'deep-cleaning': '/images/service-deep-cleaning.jpg',
      'gardening': '/images/service-gardening.jpg',
      'house-cleaning': '/images/service-house-cleaning.jpg',
      'window-cleaning': '/images/service-window-cleaning.jpg',
      'waterless-wash': '/images/service-waterless-wash.jpg',
      // Map the current database service names to the appropriate images
      'basic-wash': '/images/service-car-wash.jpg',  // Map to car wash image
      'premium-wash': '/images/service-deep-cleaning.jpg',  // Map to deep cleaning image
      'deluxe-wash': '/images/service-deep-cleaning.jpg',   // Map to deep cleaning image
      'seat-cleaning': '/images/service-house-cleaning.jpg',  // Map to house cleaning image
      'carpet-detailing': '/images/service-house-cleaning.jpg', // Map to house cleaning image
      'test-service': '/images/service-default.jpg',  // Default image
      'another-test-service': '/images/service-default.jpg',  // Default image
      'premium-car-wash': '/images/service-car-wash.jpg',  // Map to car wash image
    };

    return serviceImageMap[service.slug] || '/images/service-default.jpg';
  };

  if (loading) {
    return (
      <div className="flex flex-row justify-center gap-6">
        <p className="text-gray-500">{t('home.loadingServices')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-row justify-center gap-6">
        <p className="text-red-500">{t('home.errorLoadingServices')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {services.map((service: any, index) => ( // Show all main services
        <div
          key={service.id}
          className="flex flex-col items-center"
        >
          <div
            className={cn(
              "relative flex flex-col items-center cursor-pointer transition-all duration-300 transform",
              selectedServices.includes(service.id || '')
                ? "scale-105 opacity-100"
                : "hover:scale-105 hover:opacity-100"
            )}
            onClick={() => {
              if (onServiceSelect) {
                onServiceSelect(service, true);
              } else {
                // Navigate to service-specific page if no custom handler
                window.location.href = `/services/${service.slug}`;
              }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={selectedServices.includes(service.id || '')}
            aria-label={`${service.name} ${selectedServices.includes(service.id || '') ? 'selected' : 'not selected'}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (onServiceSelect) {
                  onServiceSelect(service, true);
                } else {
                  // Navigate to service-specific page if no custom handler
                  window.location.href = `/services/${service.slug}`;
                }
              }
            }}
          >
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg border-2 border-white">
              <img
                src={getServiceImage(service)}
                alt={service.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to a default service image if the specific one fails
                  (e.target as HTMLImageElement).src = '/images/service-default.jpg';
                }}
              />
            </div>

            {/* Visual indicator for selected state */}
            {selectedServices.includes(service.id || '') && (
              <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-secondary rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                <span className="text-xs font-bold">✓</span>
              </div>
            )}
          </div>
          <h3 className="font-bold text-center text-xs sm:text-sm mt-2 text-gray-900 tracking-wide line-clamp-2">{translateServiceName(service)}</h3>
        </div>
      ))}
    </div>
  );
}