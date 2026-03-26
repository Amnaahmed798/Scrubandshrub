import axios, { AxiosError, AxiosInstance } from 'axios';

// Create axios instance with timeouts to prevent hanging
// Use relative URL for production (works with Apache reverse proxy) or fallback for development
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for requests
  timeoutErrorMessage: 'Request timeout - please try again',
});

// Request interceptor: adds auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('[Interceptor] Request to', config.url, 'token present?', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track refresh in progress to avoid multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: any[] = [];
let queueResolver: any = null;

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (prom.reject) prom.reject(error);
  });
  failedQueue = [];
};

// Response interceptor: handles 401/403 by auto-refreshing token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // If error is 401 or 403 (both indicate auth failure/expired token)
    if ((error.response?.status === 401 || error.response?.status === 403)) {
      console.log('[Interceptor] Got', error.response?.status, 'for', originalRequest?.url, 'Retry?', originalRequest?._retry);
      
      // If already retried, reject immediately to avoid infinite loop
      if (originalRequest._retry) {
        console.log('[Interceptor] Already retried, rejecting');
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        console.log('[Interceptor] Refresh in progress, queueing request');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;
      console.log('[Interceptor] Starting refresh flow');

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        console.log('[Interceptor] Refresh token exists?', !!refreshToken);
        if (!refreshToken) {
          console.log('[Interceptor] No refresh token, clearing auth and rejecting silently');
          // No refresh token available - clear any partial auth data and reject silently
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          isRefreshing = false;
          // Return a rejected promise but don't throw - let the caller handle it
          return Promise.reject({ 
            message: 'No refresh token available', 
            isAuthError: true,
            silent: true 
          });
        }

        // Call refresh endpoint (use relative URL for Apache reverse proxy)
        const refreshResponse = await axios.post(
          '/api/v1/refresh',
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token: newRefreshToken } = refreshResponse.data;

        // Save new tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', newRefreshToken);

        // Process queued requests
        const token = access_token;
        failedQueue.forEach((prom) => prom.resolve(token));
        processQueue(null);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed — clear tokens and reject all queued requests
        // Don't log if it's a silent auth error (no refresh token)
        if (!refreshError?.silent) {
          console.error('[Interceptor] Refresh failed:', refreshError);
        }
        processQueue(refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        isRefreshing = false;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
