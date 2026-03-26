import { useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated } from '@/lib/auth-service';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        // Use synchronous localStorage check - no API calls
        const token = localStorage.getItem('access_token');
        const user = getCurrentUser();

        const hasToken = !!token;
        const hasUser = !!user;
        const isAdmin = user?.role === 'ADMIN';

        setAuthState({
          isAuthenticated: hasToken && hasUser && isAdmin,
          user: user,
          loading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
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