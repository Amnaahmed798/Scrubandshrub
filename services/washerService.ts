import AppConfig from '@/config/app-config';

interface WasherBooking {
  id: string;
  customer_id: string;
  washer_id: string | null; // Added to match Booking type
  customer_name: string;
  customer_phone?: string;
  car_details: string;
  service_type: string;
  vehicle_type: string;
  status: string;
  booking_date: string;
  booking_time?: string;
  location?: string;
  selected_services_text?: string;
  required_washers?: number;
  assigned_washers?: string[];
  assigned_at: string | null; // Changed to match ExtendedBooking
  accepted_at: string | null; // Changed to match ExtendedBooking
  completed_at: string | null; // Changed to match ExtendedBooking
  total_amount: number;
  created_at: string;
  updated_at: string;
}

interface DashboardData {
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  lifetime_earnings: number;
  pending_bookings_count: number;
  pending_earnings_amount: number;
  availability_status: string;
  bookings: WasherBooking[];
}

export class WasherService {
  static async getDashboardOverview(): Promise<{ data: DashboardData }> {
    try {
      const response = await fetch(`${AppConfig.getBackendUrl()}/api/v1/washer/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }

      return result;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  static async getWasherBookings(status?: string, limit: number = 20, offset: number = 0): Promise<{ data: WasherBooking[] }> {
    try {
      const token = localStorage.getItem('access_token');
      
      // Debug logging
      console.log('[WasherService] Fetching bookings...');
      console.log('[WasherService] Token exists:', !!token);
      console.log('[WasherService] Token preview:', token ? token.substring(0, 20) + '...' : 'N/A');
      
      let url = `${AppConfig.getBackendUrl()}/api/v1/washer/bookings?limit=${limit}&offset=${offset}`;
      if (status) {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      console.log('[WasherService] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[WasherService] Error response:', errorText);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Only washers can access this endpoint.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[WasherService] Bookings received:', result.data?.length || 0);

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to fetch bookings');
      }

      return result;
    } catch (error: any) {
      console.error('[WasherService] Error fetching bookings:', error.message);
      throw error;
    }
  }

  static async updateBookingStatus(bookingId: string, status: string) {
    try {
      const response = await fetch(`${AppConfig.getBackendUrl()}/api/v1/washer/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ status }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to update booking status');
      }

      return result;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  static async getWasherEarnings(period?: string, startDate?: string, endDate?: string) {
    try {
      let url = `${AppConfig.getBackendUrl()}/api/v1/washer/earnings`;
      const params = new URLSearchParams();

      if (period) params.append('period', period);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to fetch earnings');
      }

      return result;
    } catch (error) {
      console.error('Error fetching earnings:', error);
      throw error;
    }
  }

  static async getWasherProfile() {
    try {
      const response = await fetch(`${AppConfig.getBackendUrl()}/api/v1/washer/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to fetch profile');
      }

      return result;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  static async updateWasherProfile(profileData: any) {
    try {
      const response = await fetch(`${AppConfig.getBackendUrl()}/api/v1/washer/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(profileData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to update profile');
      }

      return result;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  static async updateWasherAvailability(availabilityData: any) {
    try {
      const response = await fetch(`${AppConfig.getBackendUrl()}/api/v1/washer/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(availabilityData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to update availability');
      }

      return result;
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  static async joinBooking(bookingId: string) {
    // Self-assignment is disabled - only admin can assign jobs
    throw new Error('Self-assignment is disabled. Only admin can assign jobs to washers.');
  }

  static async leaveBooking(bookingId: string) {
    // Self-unassignment is disabled - only admin can unassign jobs
    throw new Error('Self-unassignment is disabled. Only admin can unassign jobs from washers.');
  }

  static async logout() {
    try {
      // Call backend logout endpoint to clear GPS coordinates and invalidate token
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await fetch(`${AppConfig.getBackendUrl()}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('Logout endpoint returned error, but continuing with localStorage cleanup');
        }
      }
    } catch (error) {
      console.error('Error during logout API call:', error);
      // Continue to cleanup localStorage even if API fails
    } finally {
      // Always clear tokens from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  static async updateLocation(latitude: number, longitude: number) {
    try {
      const response = await fetch(`${AppConfig.getBackendUrl()}/api/v1/washer/location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ latitude, longitude }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to update location');
      }

      return result;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }
}