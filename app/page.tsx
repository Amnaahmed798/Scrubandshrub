'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { Service } from '../lib/types';
import { getPublicServices } from '../lib/api';
import { ServiceCards } from './components/home/service-cards';
import { WaterlessWash } from './components/home/waterless-wash';
import { BannerCarousel } from './components/home/banner-carousel';
import { MembershipSlider } from './components/home/membership-slider';
import { Testimonials } from './components/home/testimonials';
import LayoutWrapper from './components/layout/layout-wrapper';
import Navbar from '../components/Navbar';
import { Globe } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { t, locale: currentLocale, setLocale } = useI18n();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  useEffect(() => {
    // Preload both services and any required data for testimonials
    const preloadData = async () => {
      try {
        // Load services data
        await getPublicServices();

        // Both services and testimonials data are now preloaded
        // The individual components will use cached data
        setInitialDataLoaded(true);
      } catch (error) {
        console.error('Error preloading data:', error);
        setInitialDataLoaded(true); // Still allow page to render even if preload fails
      }
    };

    preloadData();
  }, []);

  const handleServiceSelect = (service: Service, multiSelect?: boolean) => {
    if (multiSelect) {
      setSelectedService(service);
      router.push(`/services/${service.slug}`);
    } else {
      setSelectedService(service);
      router.push(`/services/${service.slug}`);
    }
  };

  const handleBannerClick = (banner: any) => {
    router.push(banner.ctaLink);
  };

  const handlePackageSelect = (pkg: any) => {
    router.push('/packages');
  };

  const handleMembershipSelect = (plan: any) => {
    router.push('/membership');
  };

  // Effect to set HTML direction and language
  useEffect(() => {
    document.documentElement.dir = currentLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLocale;
  }, [currentLocale]);

  const toggleLanguage = () => {
    setLocale(currentLocale === 'en' ? 'ar' : 'en');
  };

  return (
    <LayoutWrapper>
      <Navbar />
      <div className="min-h-screen bg-background">
        {/* Language Selector */}
        <div className="w-full bg-white border-b border-gray-200 py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
                aria-label="Toggle language"
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">{currentLocale === 'en' ? 'العربية' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Banner Carousel */}
        <div className="w-full">
          <BannerCarousel onBannerClick={handleBannerClick} />
        </div>

        {/* Service Cards - 4 core services above the fold */}
        <div className="px-4 py-6 bg-secondary text-black rounded-xl">
          <h2 className="text-lg font-bold mb-4">{t('home.servicesTitle')}</h2>
          <ServiceCards onServiceSelect={handleServiceSelect} />
        </div>

        {/* Waterless Wash Highlight */}
        <div className="px-4 py-6">
          <WaterlessWash onServiceSelect={handleServiceSelect} />
        </div>

        {/* Membership Section */}
        <div className="px-4 py-6">
          <MembershipSlider onMembershipSelect={handleMembershipSelect} />
        </div>

        {/* Customer Testimonials */}
        <Testimonials />
      </div>
    </LayoutWrapper>
  );
}