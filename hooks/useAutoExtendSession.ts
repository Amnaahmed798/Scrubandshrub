import { useEffect, useRef } from 'react';
import { getAccessToken } from '@/lib/auth-service';

interface AutoExtendSessionProps {
  extendInterval?: number; // Check every X milliseconds (default: 5 minutes)
}

/**
 * Auto-extend session by refreshing token when user is active
 * This prevents logout during active usage
 */
export const useAutoExtendSession = ({ extendInterval = 300000 }: AutoExtendSessionProps = {}) => {
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    // Track user activity
    const trackActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Listen for user activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, trackActivity);
    });

    // Check if we should extend token
    const checkAndExtend = async () => {
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
        const timeUntilExpiry = (exp - now) * 1000; // milliseconds
        const fiveMinutes = 5 * 60 * 1000;

        // If token expires within 5 minutes and user has been active recently
        if (timeUntilExpiry <= fiveMinutes) {
          const lastActivity = lastActivityRef.current;
          const timeSinceActivity = Date.now() - lastActivity;

          // If user was active in the last 2 minutes, extend the session
          if (timeSinceActivity < 2 * 60 * 1000) {
            console.log('[AutoExtend] User active, but token expiring soon. Consider implementing token refresh.');
            // TODO: Implement token refresh endpoint call here
            // For now, just log - the backend token expiry has been extended to 60 minutes
          }
        }
      } catch (error) {
        console.error('[AutoExtend] Error checking token:', error);
      }
    };

    // Check periodically
    const intervalId = setInterval(checkAndExtend, extendInterval);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, trackActivity);
      });
      clearInterval(intervalId);
    };
  }, [extendInterval]);
};
