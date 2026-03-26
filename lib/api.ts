import { logout as authServiceLogout } from './auth-service';
import api from './api-client';
import axios from 'axios';

export interface ApiResponse<T> {
  status: string;
  data: T;
}

// All API functions now use the `api` client which has:
// - Request interceptor: adds Authorization header from localStorage
// - Response interceptor: auto-refreshes on 401
// - Base URL configured

export const login = async (email: string, password: string): Promise<ApiResponse<any>> => {
  const response = await api.post('/login', { email, password });
  return { status: 'success', data: response.data };
};

export const getDashboardStats = async (): Promise<ApiResponse<any>> => {
  const response = await api.get('/dashboard');
  return { status: 'success', data: response.data };
};

export const getUsers = async (): Promise<ApiResponse<any>> => {
  const response = await api.get('/users');
  return { status: 'success', data: response.data };
};

export const updateUserStatus = async (userId: string, status: string): Promise<ApiResponse<any>> => {
  const response = await api.put(`/users/${userId}/status`, { status });
  return { status: 'success', data: response.data };
};

export const getUserById = async (userId: string): Promise<ApiResponse<any>> => {
  const response = await api.get(`/users/${userId}`);
  return { status: 'success', data: response.data };
};

export const getWasherDetails = async (washerId: string): Promise<ApiResponse<any>> => {
  const response = await api.get(`/users/${washerId}`);
  return { status: 'success', data: response.data };
};

export const createUser = async (userData: any): Promise<ApiResponse<any>> => {
  const response = await api.post('/users', userData);
  return { status: 'success', data: response.data };
};

export const updateUser = async (userId: string, userData: any): Promise<ApiResponse<any>> => {
  const response = await api.put(`/users/${userId}`, userData);
  return { status: 'success', data: response.data };
};

export const deleteUser = async (userId: string): Promise<ApiResponse<any>> => {
  const response = await api.delete(`/users/${userId}`);
  return { status: 'success', data: response.data };
};

export const getBookings = async (): Promise<ApiResponse<any>> => {
  const response = await api.get('/bookings');
  return { status: 'success', data: response.data };
};

export const getBookingsByStatus = async (status: string): Promise<ApiResponse<any>> => {
  const response = await api.get(`/admin/bookings/${status}`);
  return { status: 'success', data: response.data };
};

export const getWasherBookings = async (): Promise<ApiResponse<any>> => {
  const response = await api.get('/washers/bookings');
  return { status: 'success', data: response.data };
};

export const joinBooking = async (bookingId: string): Promise<ApiResponse<any>> => {
  const response = await api.post(`/washers/bookings/${bookingId}/join`);
  return { status: 'success', data: response.data };
};

export const leaveBooking = async (bookingId: string): Promise<ApiResponse<any>> => {
  const response = await api.post(`/washers/bookings/${bookingId}/leave`);
  return { status: 'success', data: response.data };
};

export const updateBookingStatus = async (bookingId: string, status: string): Promise<ApiResponse<any>> => {
  const response = await api.put(`/admin/bookings/${bookingId}/status`, { status });
  return { status: 'success', data: response.data };
};

export const createService = async (serviceData: any): Promise<ApiResponse<any>> => {
  const response = await api.post('/services', serviceData);
  return { status: 'success', data: response.data };
};

export const getPricingByVehicleType = async (vehicleType: string): Promise<ApiResponse<any>> => {
  const response = await api.get(`/pricing?vehicle_type=${vehicleType}`);
  return { status: 'success', data: response.data };
};

export const updateService = async (id: number, serviceData: any): Promise<ApiResponse<any>> => {
  const response = await api.put(`/services/${id}`, serviceData);
  return { status: 'success', data: response.data };
};

export const deleteService = async (id: number): Promise<ApiResponse<any>> => {
  await api.delete(`/services/${id}`);
  return { status: 'success', data: { id } };
};

// For FormData uploads, we need to manually set headers (no JSON content type)
export const uploadMedia = async (file: File): Promise<ApiResponse<any>> => {
  const formData = new FormData();
  formData.append('file', file);
  // Use relative URL for production (Apache reverse proxy) or fallback for dev
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const response = await axios.post(`${baseUrl}/api/v1/media/upload`, formData, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return { status: 'success', data: response.data };
};

export const getMedia = async (): Promise<ApiResponse<any>> => {
  const response = await api.get('/media');
  return { status: 'success', data: response.data };
};

export const deleteMedia = async (id: number): Promise<ApiResponse<any>> => {
  await api.delete(`/media/${id}`);
  return { status: 'success', data: { id } };
};

export const getCategories = async (includeInactive: boolean = false, parentId: number | null = null): Promise<any[]> => {
  const params = new URLSearchParams();
  if (includeInactive) params.append('include_inactive', 'true');
  if (parentId !== null) params.append('parent_id', String(parentId));
  const response = await api.get(`/categories?${params.toString()}`);
  return response.data;
};

export const getCategoriesHierarchy = async (): Promise<ApiResponse<any>> => {
  const response = await api.get('/categories/hierarchy');
  return { status: 'success', data: response.data };
};

export const createCategory = async (categoryData: any): Promise<ApiResponse<any>> => {
  const response = await api.post('/categories', categoryData);
  return { status: 'success', data: response.data };
};

export const updateCategory = async (id: number, categoryData: any): Promise<ApiResponse<any>> => {
  const response = await api.put(`/categories/${id}`, categoryData);
  return { status: 'success', data: response.data };
};

export const deleteCategory = async (id: number): Promise<ApiResponse<any>> => {
  await api.delete(`/categories/${id}`);
  return { status: 'success', data: { id } };
};

export const getServices = async (): Promise<ApiResponse<any>> => {
  const response = await api.get('/services');
  return { status: 'success', data: response.data };
};

export const getPublicServices = async (): Promise<any[]> => {
  const response = await api.get('/services/public');
  return response.data;
};

export const getPublicServiceHierarchy = async (): Promise<any[]> => {
  const response = await api.get('/services/public/hierarchy');
  return response.data;
};

export const getMemberships = async (): Promise<ApiResponse<any>> => {
  const response = await api.get('/memberships');
  return { status: 'success', data: response.data };
};

export const createMembership = async (membershipData: any): Promise<ApiResponse<any>> => {
  const response = await api.post('/memberships', membershipData);
  return { status: 'success', data: response.data };
};

export const updateMembership = async (id: number, membershipData: any): Promise<ApiResponse<any>> => {
  const response = await api.put(`/memberships/${id}`, membershipData);
  return { status: 'success', data: response.data };
};

export const deleteMembership = async (id: number): Promise<ApiResponse<any>> => {
  await api.delete(`/memberships/${id}`);
  return { status: 'success', data: { id } };
};

export const assignBookingToWasher = async (bookingId: string, washerIds: string | string[]): Promise<ApiResponse<any>> => {
  const response = await api.post('/admin/bookings/assign', {
    booking_id: bookingId,
    washer_ids: Array.isArray(washerIds) ? washerIds : [washerIds],
  });
  return { status: 'success', data: response.data };
};

export const getAllWashers = async (): Promise<ApiResponse<any>> => {
  const response = await api.get('/washers');
  return { status: 'success', data: response.data };
};

export const getSuggestedWashers = async (bookingId: string): Promise<ApiResponse<any>> => {
  const response = await api.get(`/washers/bookings/${bookingId}/suggestions`);
  return { status: 'success', data: response.data };
};

// Logout: call backend then clear storage
export const logout = async (): Promise<void> => {
  try {
    await authServiceLogout();
  } catch (error) {
    console.warn('Logout failed:', error);
    throw error;
  }
};
