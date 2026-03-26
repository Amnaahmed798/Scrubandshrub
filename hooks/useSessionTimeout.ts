import { useEffect } from 'react';
import { getAccessToken } from '@/lib/auth-service';

interface SessionTimeoutProps {
  onLogout: () => void;
  warningTime?: number; // Show warning this many seconds before expiry (default: 5 minutes)
}

export const useSessionTimeout = ({ onLogout, warningTime = 300 }: SessionTimeoutProps) => {
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
        const timeUntilExpiry = (exp - now) * 1000; // Convert to milliseconds

        if (timeUntilExpiry <= 0) {
          // Token already expired
          console.log('[Session] Token expired, logging out...');
          onLogout();
          return;
        }

        if (timeUntilExpiry <= warningTime * 1000) {
          // Show warning before expiry
          console.log(`[Session] Token expiring in ${Math.floor(timeUntilExpiry / 1000)}s`);
          
          // Optionally show a warning modal here
          // For now, just auto-logout when expired
        }

        // Check again in 30 seconds
        const timeoutId = setTimeout(checkTokenExpiry, 30000);
        return () => clearTimeout(timeoutId);
      } catch (error) {
        console.error('[Session] Error checking token expiry:', error);
      }
    };

    // Start checking token expiry
    checkTokenExpiry();

    return () => {
      // Cleanup
    };
  }, [onLogout, warningTime]);
};
