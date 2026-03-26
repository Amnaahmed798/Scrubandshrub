import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { logout as authLogout, getAccessToken, getRefreshToken } from '@/lib/auth-service';
import AppConfig from '@/config/app-config';

export const useAuthSession = () => {
  const router = useRouter();
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const logout = useCallback(() => {
    setShowExpiryWarning(false); // Hide modal immediately
    authLogout();
    router.replace('/login');
  }, [router]);

  const extendSession = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.warn('[Session] No refresh token available');
      authLogout();
      return;
    }

    try {
      const backendUrl = AppConfig.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh session');
      }

      const data = await response.json();

      // Store new tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Update the timer (timeRemaining will be recalculated on next check)
      setShowExpiryWarning(false);

      console.log('[Session] Session extended successfully');
    } catch (error) {
      console.error('[Session] Failed to extend session:', error);
      // If refresh fails, log the user out
      authLogout();
    }
  }, []);

  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        // Decode JWT token to get expiry time
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const { exp } = JSON.parse(jsonPayload);

        const now = Date.now() / 1000;
        const timeUntilExpiry = exp - now; // seconds

        if (timeUntilExpiry <= 0) {
          setShowExpiryWarning(false);
          logout();
          return;
        }

        // Show warning if less than 5 minutes remaining (300 seconds)
        if (timeUntilExpiry <= 300) {
          setShowExpiryWarning(true);
          setTimeRemaining(Math.floor(timeUntilExpiry));
        } else {
          setShowExpiryWarning(false);
        }

        // Check again in 10 seconds
        setTimeout(checkTokenExpiry, 10000);
      } catch (error) {
        console.error('[Session] Error checking token expiry:', error);
      }
    };

    checkTokenExpiry();
  }, [logout]);

  return {
    showExpiryWarning,
    timeRemaining,
    logout,
    extendSession
  };
};
