'use client';

import { useSidebar } from '@/context/sidebar-context';
import AdminHeader from './AdminHeader';
import DesktopSidebar from './DesktopSidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <DesktopSidebar />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300`}>
        <AdminHeader onMenuToggle={toggleSidebar} mobileMenu={
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <AdminSidebar isCollapsed={false} />
            </SheetContent>
          </Sheet>
        } />
        <main className="flex-1 p-2 sm:p-4 overflow-y-visible">
          {children}
        </main>
      </div>
    </div>
  );
}