'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Sidebar({ isOpen, toggleSidebar }: { isOpen: boolean; toggleSidebar: () => void }) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/washer/dashboard',
      icon: LayoutDashboard,
      label: 'Service Dashboard',
    },
    {
      href: '/washer/bookings',
      icon: Calendar,
      label: 'Service Jobs',
    },
    {
      href: '/washer/profile',
      icon: User,
      label: 'Profile',
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Sidebar with toggle functionality */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-primary text-primary-foreground transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex h-16 items-center border-b border-primary/20 px-6">
            <h1 className="text-xl font-bold">Washer Panel</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary-foreground text-primary'
                      : 'hover:bg-primary-foreground/10 hover:text-primary-foreground'
                  )}
                  onClick={() => window.innerWidth < 768 && toggleSidebar()} // Close sidebar on mobile after clicking
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-primary/20 p-4">
            <Link
              href="/logout"
              className="flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => window.innerWidth < 768 && toggleSidebar()} // Close sidebar on mobile after clicking
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile - only show on small screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}