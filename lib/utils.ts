import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calculate subtotal based on selected services
export function calculateSubtotal(services: any[], selectedServiceIds: string[]): number {
  return services
    .filter(service => selectedServiceIds.includes(service.serviceId))
    .reduce((total, service) => total + (service.price || 0), 0);
}

// Validate vehicle type
export function isValidVehicleType(vehicleType: string): vehicleType is 'sedan' | 'suv' | 'hatchback' | 'bike' {
  return ['sedan', 'suv', 'hatchback', 'bike'].includes(vehicleType);
}
