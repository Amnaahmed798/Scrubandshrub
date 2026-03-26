// frontend/lib/auth-service.ts

import { User, UserCreate, LoginResponse, RegisterResponse, VerifyEmailRequest, ForgotPasswordRequest, ResetPasswordRequest, LoginRequest } from './types';
import AppConfig from '@/config/app-config';
import api from './api-client';

/**
 * Login user with email and password
 * @param email User's email address
 * @param password User's password
 * @returns Login response with tokens and user data
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await api.post('/login', {
      email,
      password,
    });
    return response.data;
  } catch (error: any) {
    // Extract error message from response
    const detail = error?.response?.data?.detail || error?.message || 'Login failed';
    throw new Error(detail);
  }
}

/**
 * Register a new user
 * @param userData User registration data
 * @returns Registration response
 */
export async function registerUser(userData: Omit<UserCreate, 'password'> & { password: string }): Promise<RegisterResponse> {
  let endpoint = '/customer/register';

  // Change endpoint based on role
  if (userData.role === 'WASHER') {
    endpoint = '/washer/register';
  }

  try {
    const response = await api.post(endpoint, userData);
    return response.data;
  } catch (error: any) {
    // Extract error message from response
    const err = error?.response?.data;
    if (err) {
      if (err.detail) {
        throw new Error(String(err.detail));
      } else if (err.message) {
        throw new Error(String(err.message));
      } else if (err.error) {
        throw new Error(String(err.error));
      } else if (err.msg) {
        throw new Error(String(err.msg));
      }
    }
    throw new Error(error?.message || 'Registration failed');
  }
}

/**
 * Verify user's email with OTP code
 * @param userId User ID
 * @param verificationCode OTP code
 * @returns Verification response
 */
export async function verifyEmail(userId: string, verificationCode: string): Promise<{ status: string; message: string }> {
  try {
    const response = await api.post('/verify-email', {
      user_id: userId,
      verification_code: verificationCode,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || 'Email verification failed');
  }
}

/**
 * Request a new verification code
 * @param email User's email address
 * @returns Request response
 */
export async function requestVerificationCode(email: string): Promise<{ status: string; message: string }> {
  try {
    const response = await api.post('/resend-verification', { email });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || 'Failed to send verification code');
  }
}

/**
 * Logout user (client-side only - clears local storage)
 */
export async function logout(): Promise<void> {
  console.log('Logout: Function called');

  // Call backend logout to clear GPS coordinates and invalidate token
  try {
    await api.post('/logout');
  } catch (error) {
    console.warn('Logout API call failed, but continuing with cleanup:', error);
  }

  // Always clear localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('token_type');
  console.log('Logout: LocalStorage cleared');

  // Dispatch storage event to notify same-tab listeners (useWasherAuth hook)
  // The storage event only fires across tabs, so we manually dispatch it
  const token = localStorage.getItem('access_token');
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'access_token',
      oldValue: token,
      newValue: null,
      url: window.location.href,
      storageArea: localStorage,
    })
  );
}

/**
 * Get current authenticated user from local storage
 * @returns Current user or null
 */
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

/**
 * Check if user is authenticated by validating the token with the backend
 * @returns True if user is authenticated and token is valid, false otherwise
 */
export async function isAuthenticatedAsync(): Promise<boolean> {
  try {
    const response = await api.get('/profile');
    return response.status === 200;
  } catch (error: any) {
    // Silent fail - don't log errors for normal auth checks
    // If there's an error, check if we have tokens in localStorage as fallback
    const token = localStorage.getItem('access_token');
    const user = getCurrentUser();
    return !!user && !!token;
  }
}

/**
 * Check if user is authenticated (synchronous version - checks only if token exists)
 * @returns True if user has a token, false otherwise
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('access_token');
  return !!token;
}

/**
 * Get access token from local storage
 * @returns Access token or null
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Get refresh token from local storage
 * @returns Refresh token or null
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

/**
 * Change user's password
 * @param oldPassword Current password
 * @param newPassword New password
 * @returns Change password response
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<{ status: string; message: string }> {
  try {
    const response = await api.put('/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || 'Failed to change password');
  }
}

/**
 * Forgot password request
 * @param email User's email address
 * @returns Forgot password response
 */
export async function forgotPassword(email: string): Promise<{ status: string; message: string }> {
  try {
    const response = await api.post('/forgot-password', { email });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || 'Failed to send password reset email');
  }
}

/**
 * Reset password with token
 * @param resetToken Reset token received via email
 * @param newPassword New password
 * @returns Reset password response
 */
export async function resetPassword(resetToken: string, newPassword: string): Promise<{ status: string; message: string }> {
  try {
    const response = await api.post('/reset-password', {
      reset_token: resetToken,
      new_password: newPassword,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || 'Failed to reset password');
  }
}

/**
 * Update user profile
 * @param profileData Profile update data
 * @returns Updated user data
 */
export async function updateProfile(profileData: Partial<Omit<User, 'id' | 'email' | 'role' | 'status' | 'created_at' | 'updated_at'>>): Promise<User> {
  try {
    const response = await api.put('/profile', profileData);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || 'Failed to update profile');
  }
}