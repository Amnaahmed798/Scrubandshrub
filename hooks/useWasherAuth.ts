import { useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated } from '@/lib/auth-service';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  isLoading: boolean;
}

export const useWasherAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        // Use synchronous localStorage check - no API calls
        const token = localStorage.getItem('access_token');
        const user = getCurrentUser();

        const hasToken = !!token;
        const hasUser = !!user;
        const isWasher = user?.role === 'WASHER';

        setAuthState({
          isAuthenticated: hasToken && hasUser && isWasher,
          user: user,
          isLoading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      }
    };

    checkAuth();

    // Listen for storage changes to update auth state across tabs
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return authState;
};