// types.ts

export interface Service {
  id: number;
  slug: string;
  name: string;
  description: string;
  detailed_description?: string;
  category: string;
  category_id?: number | null; // Optional field for category relationship
  icon: string;
  image_path?: string;
  is_active: boolean;
  parent_service_id?: number | null;
  service_type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string; // UUID string
  email: string;
  full_name: string;
  role: string;
  status: string;
  email_verified: boolean;
  phone_number: string | null;
  cnic_id: string | null;
  service_area: string | null;
  vehicle_details: {
    make?: string;
    model?: string;
    license_plate?: string;
    vehicle_type?: string;
    vehicle_model?: string;
  } | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface UserDetailsData {
  user: User;
  booking_stats: {
    total_bookings?: number;
    completed_bookings?: number;
    total_spent?: number;
    pending_bookings?: number;
    total_assigned?: number;
    accepted_or_in_progress?: number;
    completion_rate?: number;
  } | null;
  recent_bookings: Array<{
    id: string;
    status: string;
    booking_date: string;
    total_amount: number;
    vehicle_type: string;
    service_type: string;
    team_size: number;
    created_at: string;
    accepted_at?: string | null;
    completed_at?: string | null;
  }>;
}

export interface Booking {
  id: string;
  customer_id: string;
  washer_id: string | null;
  service_type: string;
  vehicle_type: string;
  status: string;
  booking_date: string;
  assigned_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
  // Additional fields used in various parts of the app
  customer_name: string;
  customer_phone?: string;
  date?: string; // For user-friendly date display
  time?: string; // For user-friendly time display
  location?: string;
  selected_services_text?: string;
  required_washers?: number;
  assigned_washers?: string[];
  status_note?: string;
  assignment_status?: {
    confirmed_washers: string[];
    total_required: number;
    confirmed_count: number;
    is_fully_confirmed: boolean;
  };
}

export interface Media {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  content_type: string;
  file_category: string;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: number;
  user_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Membership plan details (joined)
  name?: string;
  description?: string;
  discount_percentage?: number;
  duration_months?: number;
}