// frontend/lib/constants.ts

// Vehicle types
export const VEHICLE_TYPES = {
  SEDAN: 'sedan',
  SUV: 'suv',
  HATCHBACK: 'hatchback',
  BIKE: 'bike',
} as const;

export type VehicleType = keyof typeof VEHICLE_TYPES;

// Theme colors - following white-blue-yellow theme from constitution
export const THEME_COLORS = {
  PRIMARY: '#1e3a8a', // Dark blue
  BACKGROUND: '#ffffff', // White
  BUTTON: '#f59e0b', // Yellow
  BUTTON_HOVER: '#1e3a8a', // Dark blue on hover
} as const;

// Touch target size for accessibility
export const MIN_TOUCH_TARGET = 44; // 44px minimum for accessibility

// Performance thresholds
export const PERFORMANCE_THRESHOLD = {
  CATALOG_LOAD: 500, // ms - Full catalog load
  SUBTOTAL_UPDATE: 100, // ms - Live subtotal update
  PAGE_LOAD: 2000, // ms - Page load time
} as const;

// Service catalog size limits
export const SERVICE_CATALOG_LIMITS = {
  MIN: 5,
  TYPICAL_MIN: 15,
  TYPICAL_MAX: 25,
  MAX: 50,
} as const;