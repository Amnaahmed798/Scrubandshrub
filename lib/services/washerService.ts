import AppConfig from '@/config/app-config';

interface DashboardData {
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  lifetime_earnings: number;
  pending_bookings_count: number;
  pending_earnings_amount: number;
  availability_status: string;
  bookings: Array<{
    id: string;
    customer_id: string;
    customer_name: string;
    car_details: string;
    service_type: string;
    vehicle_type: string;
    status: string;
    booking_date: string;
    assigned_at?: string;
    accepted_at?: string;
    completed_at?: string;
    total_amount: number;
    created_at: string;
    updated_at: string;
  }>;
}

export class WasherService {
  static async getDashboardOverview(): Promise<{ data: DashboardData }> {
    try {
      const response = await fetch(`${AppConfig.getBackendUrl()}/api/v1/washer/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
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

  static async getWasherBookings(status?: string, limit: number = 20, offset: number = 0) {
    try {
      let url = `${AppConfig.getBackendUrl()}/api/v1/washer/bookings?limit=${limit}&offset=${offset}`;
      if (status) {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to fetch bookings');
      }

      return result;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  static async updateBookingStatus(bookingId: string, status: string) {
    try {
      const response = await fetch(`${AppConfig.getBackendUrl()}/api/v1/washer/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
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
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
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
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
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
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
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
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
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
}