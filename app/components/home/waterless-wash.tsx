'use client';

import { useState, useEffect } from 'react';
import { Service } from '../../../lib/types';
import { getPublicServices } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import { useI18n } from '@/lib/i18n';

interface WaterlessWashProps {
  onServiceSelect?: (service: Service) => void;
}

export function WaterlessWash({ onServiceSelect }: WaterlessWashProps) {
  const [waterlessService, setWaterlessService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, locale } = useI18n();

  // Helper function to translate service name
  const translateServiceName = (service: Service): string => {
    if (locale === 'en') return service.name;
    const translated = t('home.serviceCarWashing');
    return translated !== 'home.serviceCarWashing' ? translated : service.name;
  };

  useEffect(() => {
    const fetchWaterlessService = async () => {
      try {
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
            created_at: service.created_at || new Date().toISOString(),
            updated_at: service.updated_at || new Date().toISOString(),
          }));

          // Find the waterless wash service
          const service = transformedServices.find((s: any) =>
            s.name.toLowerCase().includes('waterless') || s.slug === 'waterless-wash'
          );
          setWaterlessService(service || null);
        }
      } catch (err) {
        console.error('Error fetching waterless wash service:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWaterlessService();
  }, []);

  if (loading || !waterlessService) {
    return null; // Don't render if loading or service not found
  }

  const handleClick = () => {
    if (onServiceSelect && waterlessService) {
      onServiceSelect(waterlessService);
    }
  };

  return (
    <div
      className="bg-gradient-to-r from-emerald-100 via-teal-50 to-cyan-100 rounded-xl p-3 sm:p-4 border-2 border-emerald-300 shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${waterlessService.name} - ${waterlessService.description}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-200 to-teal-200 shadow-lg border-2 border-emerald-300">
            <img
              src="/images/waterless-wash.jpg"
              alt={waterlessService.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to a default image if the specific one fails
                (e.target as HTMLImageElement).src = '/images/service-default.jpg';
              }}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm sm:text-lg text-emerald-900 truncate">{translateServiceName(waterlessService)}</h3>
          <p className="text-xs sm:text-base text-gray-700 mt-0.5 sm:mt-1 line-clamp-2">{waterlessService.description}</p>
          <p className="text-xs sm:text-sm text-emerald-700 mt-1 sm:mt-2 font-semibold">✓ {t('home.waterlessEcoFriendly')}</p>
        </div>
      </div>
    </div>
  );
}