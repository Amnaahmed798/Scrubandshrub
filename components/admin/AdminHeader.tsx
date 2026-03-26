'use client';

import { useState } from 'react';
import { Menu, Search, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AdminSidebar from './AdminSidebar';
import { logout } from '@/lib/auth-service';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  onMenuToggle?: () => void;
  mobileMenu?: React.ReactNode;
}

export default function AdminHeader({ onMenuToggle, mobileMenu }: AdminHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4 lg:px-6">
        {/* Left side - Mobile menu and title */}
        <div className="flex items-center gap-2">
          {mobileMenu}
          <h1 className="text-base sm:text-xl font-bold text-gray-900 hidden sm:block">Car Wash Admin</h1>
          <h1 className="text-sm font-bold text-gray-900 sm:hidden">Admin</h1>
        </div>

        {/* Center - Navigation (Desktop Only) */}
        <nav className="hidden lg:flex items-center gap-4 text-sm font-medium">
          <a href="/admin" className="text-emerald-600 font-semibold">Dashboard</a>
          <a href="/admin/users" className="text-gray-600 hover:text-gray-900 transition-colors">Users</a>
          <a href="/admin/bookings" className="text-gray-600 hover:text-gray-900 transition-colors">Bookings</a>
          <a href="/admin/services" className="text-gray-600 hover:text-gray-600 transition-colors">Services</a>
          <a href="/admin/memberships" className="text-gray-600 hover:text-gray-900 transition-colors">Memberships</a>
        </nav>

        {/* Right side - Search and user profile */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          {/* Desktop menu toggle - shown on large screens only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="hidden lg:flex h-8 w-8 sm:h-9 sm:w-9"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-40 lg:w-48 bg-gray-100 pl-8 pr-3 py-1.5 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
            </div>
            <span className="hidden lg:block text-xs sm:text-sm font-medium text-gray-700">Admin</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hidden lg:flex h-8 w-8 sm:h-9 sm:w-9"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}