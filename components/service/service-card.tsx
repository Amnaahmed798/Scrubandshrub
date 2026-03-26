'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ServiceCard as ServiceCardType } from '@/lib/types';
import { THEME_COLORS, MIN_TOUCH_TARGET } from '@/lib/constants';
import { FaCar, FaCarSide, FaWrench, FaTint, FaMagic, FaShower, FaChair, FaCouch, FaTachometerAlt, FaOilCan, FaSnowflake, FaBroom, FaWheelchair, FaTruck, FaMotorcycle, FaSoap, FaWater, FaLeaf, FaShieldAlt, FaHome } from 'react-icons/fa';

interface ServiceCardProps {
  service: ServiceCardType;
  onSelectionChange: (serviceId: string, isSelected: boolean) => void;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onSelectionChange,
  className,
  isLoading = false,
  error = null
}) => {
  const handleCardClick = () => {
    if (!isLoading && !error) {
      onSelectionChange(service.serviceId, !service.isSelected);
    }
  };

  if (error) {
    return (
      <div
        className={cn(
          "border rounded-lg p-4 min-h-[120px] flex flex-col justify-center items-center",
          "border-red-200 bg-red-50",
          className
        )}
      >
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-red-600 text-center text-sm">Failed to load service</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          "border rounded-lg p-4 min-h-[120px] flex flex-col justify-center items-center",
          "border-gray-200 bg-gray-50 animate-pulse",
          className
        )}
      >
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "border rounded-lg p-4 cursor-pointer transition-all duration-200 min-h-[120px]",
        "hover:shadow-md hover:border-primary/30",
        service.isSelected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-gray-200 bg-white",
        className
      )}
      style={{
        minHeight: `${Math.max(120, MIN_TOUCH_TARGET)}px` // Accessibility: minimum 44px touch target
      }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 text-base">{service.serviceName}</h3>
          {service.icon && (
            <div className="text-xl ml-2">
              {(() => {
                // Determine icon based on service icon value
                if (service.icon === 'Car') {
                  return <FaCar className="text-xl" />;
                } else if (service.icon === 'CarFront') {
                  return <FaCarSide className="text-xl" />;
                } else if (service.icon === 'Wrench') {
                  return <FaWrench className="text-xl" />;
                } else if (service.icon === 'Droplets') {
                  return <FaTint className="text-xl" />;
                } else if (service.icon === 'Sparkles') {
                  return <FaMagic className="text-xl" />;
                } else if (service.icon === 'Vacuum') {
                  return <FaBroom className="text-xl" />;
                } else if (service.icon === 'Leaf') {
                  return <FaLeaf className="text-xl" />;
                } else if (service.icon === 'Home') {
                  return <FaHome className="text-xl" />;
                } else if (service.serviceSlug === 'car-washing') {
                  return <FaCar className="text-xl" />;
                } else if (service.serviceSlug === 'deep-cleaning') {
                  return <FaBroom className="text-xl" />;
                } else if (service.serviceSlug === 'gardening') {
                  return <FaLeaf className="text-xl" />;
                } else if (service.serviceSlug === 'house-cleaning') {
                  return <FaHome className="text-xl" />;
                } else if (service.serviceSlug === 'window-cleaning') {
                  return <FaTint className="text-xl" />;
                } else {
                  return <FaCar className="text-xl" />; // Default icon
                }
              })()}
            </div>
          )}
        </div>

        {service.description && (
          <p className="text-gray-600 text-sm mt-1 flex-grow">{service.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">{service.price.toFixed(2)}</span>
          <div
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
              service.isSelected
                ? "bg-primary border-primary"
                : "border-gray-300"
            )}
          >
            {service.isSelected && (
              <span className="text-white text-sm">✓</span>
            )}
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          {service.category === 'exterior' ? 'Exterior' : 'Interior'}
        </div>
      </div>
    </div>
  );
};

export { ServiceCard };