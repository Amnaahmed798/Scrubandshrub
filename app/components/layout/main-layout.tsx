'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNavigation } from '../home/bottom-navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [showBottomNav, setShowBottomNav] = useState(false);

  // Determine which routes should show the bottom navigation
  useEffect(() => {
    const routesWithBottomNav = ['/', '/bookings', '/book', '/membership', '/profile'];
    setShowBottomNav(routesWithBottomNav.includes(pathname));
  }, [pathname]);

  return (
    <div className="relative min-h-screen">
      <div className={showBottomNav ? 'pb-24' : ''}>
        {children}
      </div>

      {showBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomNavigation />
        </div>
      )}
    </div>
  );
}