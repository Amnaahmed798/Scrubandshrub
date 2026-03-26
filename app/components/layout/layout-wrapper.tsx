'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNavigation } from '../home/bottom-navigation';

interface LayoutWrapperProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export default function LayoutWrapper({ children, showBottomNav = true }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [shouldShowBottomNav, setShouldShowBottomNav] = useState(false);

  useEffect(() => {
    // Determine which routes should show the bottom navigation
    const routesWithBottomNav = ['/', '/bookings', '/book', '/membership', '/profile'];
    setShouldShowBottomNav(showBottomNav && routesWithBottomNav.includes(pathname));
  }, [pathname, showBottomNav]);

  // Pre-calculate if bottom nav should be shown to avoid flickering
  const routesWithBottomNav = ['/', '/bookings', '/book', '/membership', '/profile'];
  const showNav = showBottomNav && routesWithBottomNav.includes(pathname);

  return (
    <div className="relative min-h-screen">
      <div className={showNav ? 'pb-16' : ''}>
        {children}
      </div>

      {showNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomNavigation activePage={pathname} />
        </div>
      )}
    </div>
  );
}