'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { VEHICLE_TYPES } from '@/lib/constants';

interface VehicleSelectorProps {
  selectedVehicleType: 'sedan' | 'suv' | 'hatchback' | 'bike';
  onVehicleTypeChange: (vehicleType: 'sedan' | 'suv' | 'hatchback' | 'bike') => void;
  className?: string;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  selectedVehicleType,
  onVehicleTypeChange,
  className
}) => {
  const vehicleTypeArray = Object.values(VEHICLE_TYPES) as ('sedan' | 'suv' | 'hatchback' | 'bike')[];

  return (
    <div className={cn("mb-8", className)}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Vehicle Type
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {vehicleTypeArray.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onVehicleTypeChange(type)}
            className={cn(
              "p-2 sm:p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center min-h-[70px] sm:min-h-[90px]",
              selectedVehicleType === type
                ? "border-primary bg-primary/10"
                : "border-gray-200 bg-white hover:border-primary/30"
            )}
          >
            <div className="text-lg sm:text-2xl mb-0.5 sm:mb-2">
              {type === 'sedan' && '🚙'}
              {type === 'suv' && '🚐'}
              {type === 'hatchback' && '🚗'}
              {type === 'bike' && '🏍️'}
            </div>
            <span className="capitalize text-xs sm:text-sm font-medium text-center break-words">{type}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export { VehicleSelector };