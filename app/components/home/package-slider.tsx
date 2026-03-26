'use client';

import { Package } from '../../../lib/types';
import { packages } from '../../../lib/data';
import { cn } from '../../../lib/utils';
import { FaCar, FaCrown, FaGem } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

interface PackageSliderProps {
  onPackageSelect?: (pkg: Package) => void;
}

export function PackageSlider({ onPackageSelect }: PackageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(true); // paused by default
  const { locale } = useI18n();

  const handleClick = (pkg: Package) => {
    onPackageSelect?.(pkg);
  };

  // Auto rotate ONLY when hovered
  useEffect(() => {
    if (packages.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev =>
        prev === packages.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      className="pb-4"
      onMouseEnter={() => setIsPaused(false)}
      onMouseLeave={() => setIsPaused(true)}
    >
      <h2 className="text-lg font-bold mb-3">Packages & Promotions</h2>

      {/* Card container (fixed shape) */}
      <div className="relative w-full min-h-[200px] overflow-hidden">
        <motion.div
          className="flex w-full"
          style={{ direction: 'ltr' }}
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="min-w-full bg-white rounded-xl shadow-md border border-gray-200 p-4 cursor-pointer"
              onClick={() => handleClick(pkg)}
            >
              <div>
                {/* Package image */}
                <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden mb-3">
                  <img
                    src={`/images/package-${pkg.id.replace('pkg-', '')}.jpg`}
                    alt={pkg.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to a generic package image if the specific one fails
                      (e.target as HTMLImageElement).src = '/images/package-fallback.jpg';
                    }}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-primary">{pkg.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>

                  <ul className="mt-2 text-xs text-gray-500">
                    {pkg.benefits.slice(0, 2).map((b, i) => (
                      <li key={i} className="flex items-center">
                        <span className="mr-1">✓</span> {b}
                      </li>
                    ))}
                    {pkg.benefits.length > 2 && (
                      <li>+{pkg.benefits.length - 2} more</li>
                    )}
                  </ul>

                  <div className="mt-3">
                    <span className="text-lg font-bold text-secondary">
                      ${pkg.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      /{pkg.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center mt-2 space-x-2">
        {packages.map((_, index) => (
          <button
            key={index}
            className={cn(
              'w-2 h-2 rounded-full',
              index === currentIndex ? 'bg-secondary' : 'bg-gray-300'
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
