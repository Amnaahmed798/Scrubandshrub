'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { getCurrentUser, isAuthenticated, logout } from '@/lib/auth-service';

const Navbar = () => {
  const { t } = useI18n();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const pathname = usePathname();

  useEffect(() => {
    const checkAuthStatus = () => {
      // Use synchronous check from localStorage - no API calls
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);

      if (authenticated) {
        // If token is valid, get the user data
        const currentUser = getCurrentUser();
        setUser(currentUser);
      } else {
        // If token is invalid or doesn't exist, clear user data
        setUser(null);
        // Also clear any stored tokens to ensure clean state
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('access_token');
          window.localStorage.removeItem('refresh_token');
          window.localStorage.removeItem('user');
        }
      }
      setLoading(false); // Set loading to false after auth check
    };

    checkAuthStatus();

    // Listen for storage changes (in case login/logout happens from another tab)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setUser(null);
  };

  // Don't show auth links on auth pages
const currentPath = usePathname();
const isAuthPage = currentPath ? currentPath.startsWith('/login') || currentPath.startsWith('/register') : false;


  return (
    <nav className="bg-gradient-to-r from-white to-gray-50 shadow-lg border-b-2 border-primary/10 fixed top-0 left-0 right-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/sandpiperlogo.png"
                alt="Sandpiper Car Wash Logo"
                width={300}
                height={70}
                className="h-16 w-auto"
              />
            </Link>
          </div>

          {/* Center - Navigation Links */}
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {/* Removed Home, Customize, and Book links as requested */}
          </div>

          {/* Right - Auth Links */}
          <div className="flex items-center">
            {loading ? (
              // Show nothing while loading to avoid flash of wrong state
              <div className="flex space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors duration-200"
                >
                  {t('common.navLogin')}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full hover:from-yellow-600 hover:to-yellow-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {t('common.navRegister')}
                </Link>
              </div>
            ) : !isAuthPage && isLoggedIn ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                {user?.role === 'WASHER' && (
                  <Link
                    href="/washer/dashboard"
                    className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-primary transition-colors duration-200 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    {t('common.navWasherDashboard')}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {t('common.navLogout')}
                </button>
              </div>
            ) : !isAuthPage ? (
              <div className="flex space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors duration-200"
                >
                  {t('common.navLogin')}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full hover:from-yellow-600 hover:to-yellow-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {t('common.navRegister')}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;