// frontend/lib/types.ts

// User-related types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'CUSTOMER' | 'WASHER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  email_verified: boolean;
  phone_number?: string;
  cnic_id?: string;
  service_area?: string;
  vehicle_details?: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
  role?: 'CUSTOMER' | 'WASHER' | 'ADMIN';
  phone_number?: string;
  accept_terms: boolean;
}

export interface UserUpdate {
  full_name?: string;
  phone_number?: string;
  cnic_id?: string;
  service_area?: string;
  vehicle_details?: Record<string, any>;
}

// Service-related types
export interface Service {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: 'exterior' | 'interior' | 'automotive' | 'cleaning' | 'outdoor' | 'full' | 'eco-friendly';
  icon?: string;
  is_active: boolean;
  service_type?: 'main_service' | 'sub_service';
  parent_service_id?: number | null;
  created_at: string;
  updated_at: string;
  price?: number; // Add price property for UI display
  isSelected?: boolean; // Add isSelected property for UI state
}

// Pricing-related types
export interface Pricing {
  id: string;
  service_id: string;
  prices: {
    sedan: number;
    suv: number;
    hatchback: number;
    bike: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Package-related types
export interface Package {
  id: string;
  title: string;
  description?: string;
  benefits: string[];
  price: number;
  duration: string;
  icon?: string;
}

// Vehicle-related types
export interface Vehicle {
  id: string;
  type: 'sedan' | 'suv' | 'hatchback' | 'bike';
  number: string;
  model: string;
  user_id?: string;
}

// Booking-related types
export interface Booking {
  id: string;
  customer_id: string;
  washer_id?: string;
  service_type: string;
  vehicle_type: 'sedan' | 'suv' | 'hatchback' | 'bike';
  selected_services: string[];
  status: 'PENDING' | 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  booking_date: string;
  scheduled_date?: string;
  assigned_at?: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  total_amount: number;
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  customer_notes?: string;
  washer_notes?: string;
  created_at: string;
  updated_at: string;
}

// Authentication-related types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
  role?: 'CUSTOMER' | 'WASHER';
  phone_number?: string;
  accept_terms: boolean;
  cnic_id?: string;
  service_area?: string;
  vehicle_details?: Record<string, any>;
}

export interface RegisterResponse {
  message: string;
  user_id: string;
}

export interface VerifyEmailRequest {
  user_id: string;
  verification_code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
}

// Service card type for UI
export interface ServiceCard {
  serviceId: string;
  serviceName: string;
  serviceSlug: string;
  category: 'exterior' | 'interior' | 'automotive' | 'cleaning' | 'outdoor' | 'eco-friendly' | 'full';
  price: number;
  description?: string;
  icon?: string;
  isSelected: boolean;
}

// Service selection state
export interface ServiceSelection {
  selectedServices: string[];
  selectedVehicleType: 'sedan' | 'suv' | 'hatchback' | 'bike';
  subtotal: number;
  selectionTimestamp?: Date;
}

// Constants
export const VEHICLE_TYPES = {
  SEDAN: 'sedan',
  SUV: 'suv',
  HATCHBACK: 'hatchback',
  BIKE: 'bike',
} as const;

export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  WASHER: 'WASHER',
  ADMIN: 'ADMIN',
} as const;

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const USER_STATUSES = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;

// Theme colors
export const THEME_COLORS = {
  PRIMARY: '#1e3a8a', // Dark blue
  BACKGROUND: '#ffffff', // White
  BUTTON: '#f59e0b', // Yellow
  BUTTON_HOVER: '#1e3a8a', // Dark blue on hover
  SUCCESS: '#10b981', // Green
  WARNING: '#f59e0b', // Yellow
  ERROR: '#ef4444', // Red
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLD = {
  CATALOG_LOAD: 500, // ms - Service catalog loading
  SUBTOTAL_UPDATE: 100, // ms - Real-time subtotal update
  PAGE_LOAD: 2000, // ms - Page load time
} as const;

// Minimum touch target size for accessibility
export const MIN_TOUCH_TARGET = 44; // px

// Membership-related types
export interface Membership {
  id: number | string;
  planName: string;
  name?: string; // Optional fallback
  description?: string;
  discount_percentage: number;
  duration_months: number;
  created_at?: string;
  updated_at?: string;
  price: number;
  billingCycle: string;
  benefits: string[];
  features: string[];
}

// Alias for backward compatibility
export type MembershipPlan = Membership;

// Testimonial-related types
export interface Testimonial {
  id: string;
  name: string;
  nameAr?: string;
  rating: number;
  comment: string;
  commentAr?: string;
  date: string;
  avatar?: string;
  images?: string[];
}

// Banner-related types
export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  videoUrl?: string;
  ctaLink: string; // Required for navigation
  ctaText?: string; // Optional CTA button text
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

// Navigation-related types
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  route?: string; // Optional route for programmatic navigation
  icon?: string; // Icon identifier for UI display
  children?: NavigationItem[];
  order: number;
  isActive: boolean;
}