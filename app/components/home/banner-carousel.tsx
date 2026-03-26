'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Banner } from '../../../lib/types';
import { banners } from '../../../lib/data';
import { cn } from '../../../lib/utils';
import { useI18n } from '@/lib/i18n';

interface BannerCarouselProps {
  onBannerClick?: (banner: Banner) => void;
}

export function BannerCarousel({ onBannerClick }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { t } = useI18n();

  // Filter active banners
  const activeBanners = banners.filter(banner => banner.isActive);

  // Debug: Log banner info
  useEffect(() => {
    console.log('BannerCarousel: Total banners:', banners.length);
    console.log('BannerCarousel: Active banners:', activeBanners.length);
    activeBanners.forEach((b, i) => console.log(`  Banner ${i}: ${b.id}, video: ${b.videoUrl}, active: ${b.isActive}`));
  }, [activeBanners.length]);

  // Auto-advance carousel
  useEffect(() => {
    if (isPaused || activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex =>
        prevIndex === activeBanners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // 5 seconds per slide as per research

    return () => clearInterval(interval);
  }, [isPaused, activeBanners.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex(prevIndex =>
      prevIndex === activeBanners.length - 1 ? 0 : prevIndex + 1
    );
  }, [activeBanners.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prevIndex =>
      prevIndex === 0 ? activeBanners.length - 1 : prevIndex - 1
    );
  }, [activeBanners.length]);

  if (activeBanners.length === 0) {
    // Show fallback content if no active banners (per clarification)
    return (
      <div className="relative h-60 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Promotional content coming soon</p>
      </div>
    );
  }

  const getBannerTranslations = (index: number) => {
    const keys = [
      { title: 'banner1Title', subtitle: 'banner1Subtitle', cta: 'banner1Cta' },
      { title: 'banner2Title', subtitle: 'banner2Subtitle', cta: 'banner2Cta' },
      { title: 'banner3Title', subtitle: 'banner3Subtitle', cta: 'banner3Cta' }
    ];
    return keys[index] || keys[0];
  };

  return (
    <div
      className="relative w-full h-64 overflow-hidden rounded-2xl shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {activeBanners.map((banner, index) => {
        const bannerT = getBannerTranslations(index);
        return (
        <div
          key={banner.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
          aria-hidden={index !== currentIndex}
        >
          {banner.videoUrl ? (
            <div className="relative w-full h-full">
              <video
                key={`${banner.id}-${currentIndex === index ? 'active' : 'inactive'}`}
                className="w-full h-full object-cover"
                src={banner.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedData={() => console.log(`Video ${banner.id} loaded`)}
                onError={(e) => console.error(`Video ${banner.id} error:`, e)}
                onClick={() => {
                  if (onBannerClick) {
                    onBannerClick(banner);
                  } else {
                    window.location.href = banner.ctaLink;
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${t(`home.${bannerT.title}`)} - ${t(`home.${bannerT.subtitle}`)}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (onBannerClick) {
                      onBannerClick(banner);
                    } else {
                      window.location.href = banner.ctaLink;
                    }
                  }
                }}
              >
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 flex items-center justify-center cursor-pointer hover:from-black/40 hover:to-black/70 transition-all duration-300"
                onClick={() => {
                  if (onBannerClick) {
                    onBannerClick(banner);
                  } else {
                    window.location.href = banner.ctaLink;
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${t(`home.${bannerT.title}`)} - ${t(`home.${bannerT.subtitle}`)}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (onBannerClick) {
                      onBannerClick(banner);
                    } else {
                      window.location.href = banner.ctaLink;
                    }
                  }
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-white text-3xl font-bold drop-shadow-lg">{t(`home.${bannerT.title}`)}</h3>
                  <p className="text-white text-lg mt-2 drop-shadow-md">{t(`home.${bannerT.subtitle}`)}</p>
                  <button className="mt-6 bg-secondary text-primary px-8 py-3 rounded-full font-bold text-lg hover:bg-secondary/90 hover:shadow-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                    {t(`home.${bannerT.cta}`)}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="w-full h-full bg-cover bg-center flex items-center justify-center cursor-pointer"
              style={{ backgroundImage: `url(${banner.imageUrl})` }}
              onClick={() => {
                if (onBannerClick) {
                  onBannerClick(banner);
                } else {
                  window.location.href = banner.ctaLink;
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${t(`home.${bannerT.title}`)} - ${t(`home.${bannerT.subtitle}`)}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (onBannerClick) {
                    onBannerClick(banner);
                  } else {
                    window.location.href = banner.ctaLink;
                  }
                }
              }}
            >
              <div className="bg-black bg-opacity-50 w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <h3 className="text-white text-xl font-bold">{t(`home.${bannerT.title}`)}</h3>
                <p className="text-white text-sm mt-1">{t(`home.${bannerT.subtitle}`)}</p>
                <button className="mt-3 bg-secondary text-primary px-4 py-2 rounded-full font-semibold hover:bg-secondary/80 hover:text-secondary transition-colors">
                  {t(`home.${bannerT.cta}`)}
                </button>
              </div>
            </div>
          )}
        </div>
      );
      })}

      {/* Navigation dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
        {activeBanners.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-3 h-3 rounded-full transition-all border-2 border-white",
              index === currentIndex ? "bg-white" : "bg-white/50 hover:bg-white/75"
            )}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <span className="text-lg">‹</span>
          </button>
          <button
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <span className="text-lg">›</span>
          </button>
        </>
      )}
    </div>
  );
}