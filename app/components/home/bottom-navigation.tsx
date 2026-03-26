'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavigationItem } from '../../../lib/types';
import { navigationItems } from '../../../lib/data';
import { cn } from '../../../lib/utils';
import { FaCar, FaCalendarAlt, FaStar, FaUser, FaPlus, FaHome, FaCrown } from 'react-icons/fa';

interface BottomNavigationProps {
  onNavigate?: (route: string) => void;
  activePage?: string;
}

export function BottomNavigation({ onNavigate, activePage }: BottomNavigationProps) {
  const router = useRouter();
  const [activeItemId, setActiveItemId] = useState('nav-home');

  // Update active item when activePage changes
  useEffect(() => {
    if (activePage) {
      const item = navigationItems.find(nav => nav.route === activePage);
      if (item) {
        setActiveItemId(item.id);
      }
    }
  }, [activePage]);

  const handleNavigation = (item: NavigationItem) => {
    // Update active state
    setActiveItemId(item.id);

    // Use route if provided, otherwise fall back to href
    const navigationTarget = item.route || item.href;

    // Trigger navigation callback if provided
    if (onNavigate) {
      onNavigate(navigationTarget);
    } else {
      // Default navigation using Next.js router
      router.push(navigationTarget);
    }
  };

  // Specific handler for booking FAB to ensure ≤2 taps requirement (SC-001, FR-014)
  const handleBooking = () => {
    // Navigate directly to booking page for quick access
    router.push('/book');
  };

  return (
    <div className="bg-white border-t border-gray-200 px-2 py-1 flex items-center justify-between">
      {/* Left navigation items */}
      <div className="flex space-x-1">
        {navigationItems.slice(0, 2).map((item) => (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px]",
              activeItemId === item.id
                ? "text-primary bg-blue-50"
                : "text-gray-500 hover:text-primary hover:bg-gray-50"
            )}
            onClick={() => handleNavigation(item)}
            aria-label={item.label}
          >
            {item.icon === 'car' && <FaCar className="text-2xl" />}
            {item.icon === 'calendar' && <FaCalendarAlt className="text-2xl" />}
            {item.icon === 'home' && <FaHome className="text-2xl" />}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Center FAB for booking - ensures ≤2 taps for booking */}
      <button
        className="bg-secondary text-primary rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-secondary/80 hover:text-secondary transition-colors -mt-8 z-10 border-4 border-white"
        onClick={handleBooking}
        aria-label="Book Car Wash"
      >
        <FaPlus className="text-3xl" />
      </button>

      {/* Right navigation items */}
      <div className="flex space-x-1">
        {navigationItems.slice(3).map((item) => (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px]",
              activeItemId === item.id
                ? "text-primary bg-blue-50"
                : "text-gray-500 hover:text-primary hover:bg-gray-50"
            )}
            onClick={() => handleNavigation(item)}
            aria-label={item.label}
          >
            {item.icon === 'membership' && <FaCrown className="text-2xl" />}
            {item.icon === 'user' && <FaUser className="text-2xl" />}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}