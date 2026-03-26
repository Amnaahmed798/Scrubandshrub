'use client';

import { useState } from 'react';
import {
  BarChart3,
  Users,
  Calendar,
  Wrench,
  Gem,
  Image,
  FileText,
  Globe,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Folder
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/context/sidebar-context';
import { logout } from '@/lib/auth-service';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  icon?: React.ElementType; // Optional because subItems don't have icons
  label: string;
  href: string;
  subItems?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  { icon: BarChart3, label: 'Dashboard', href: '/admin' },
  {
    icon: Users,
    label: 'Users Management',
    href: '#',
    subItems: [
      { label: 'View Users', href: '/admin/users' },
      { label: 'Manage Accounts', href: '/admin/users/manage' },
      { label: 'User Reports', href: '/admin/users/reports' }
    ]
  },
  {
    icon: Calendar,
    label: 'Bookings Management',
    href: '#',
    subItems: [
      { label: 'All Bookings', href: '/admin/bookings' },
      { label: 'Pending', href: '/admin/bookings/pending' },
      { label: 'Assigned', href: '/admin/bookings/assigned' },
      { label: 'Completed', href: '/admin/bookings/completed' },
      { label: 'Cancelled', href: '/admin/bookings/cancelled' }
    ]
  },
  {
    icon: Wrench,
    label: 'Services Management',
    href: '#',
    subItems: [
      { label: 'Active Services', href: '/admin/services' },
      { label: 'Pending Services', href: '/admin/services/pending' },
      { label: 'Add Service', href: '/admin/services/add' },
      { label: 'Create Service Hierarchy', href: '/admin/services/create-hierarchical' },
      { label: 'Edit Services', href: '/admin/services/edit' }
    ]
  },
  {
    icon: Folder,
    label: 'Categories Management',
    href: '#',
    subItems: [
      { label: 'All Categories', href: '/admin/categories' },
      { label: 'Add Category', href: '/admin/categories/add' }
    ]
  },
  {
    icon: Gem,
    label: 'Memberships',
    href: '#',
    subItems: [
      { label: 'Plans', href: '/admin/memberships' },
      { label: 'Subscribers', href: '/admin/memberships/subscribers' },
      { label: 'Manage Benefits', href: '/admin/memberships/benefits' }
    ]
  },
  {
    icon: Image,
    label: 'Media Management',
    href: '#',
    subItems: [
      { label: 'All Media', href: '/admin/media' }
    ]
  },
  {
    icon: FileText,
    label: 'Reports & Analytics',
    href: '#',
    subItems: [
      { label: 'All Reports', href: '/admin/reports' }
    ]
  },
  {
    icon: Globe,
    label: 'Website Content',
    href: '#',
    subItems: [
      { label: 'Manage Content', href: '/admin/website' }
    ]
  },
  {
    icon: Users,
    label: 'Team Management',
    href: '#',
    subItems: [
      { label: 'All Washers', href: '/admin/team' },
      { label: 'Washer Details', href: '/admin/team/details' }
    ]
  },
  { icon: Settings, label: 'Settings', href: '/admin/settings' }
];

interface AdminSidebarProps {
  isCollapsed?: boolean;
}

export default function AdminSidebar({ isCollapsed = false }: AdminSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <div className={`flex h-full flex-col bg-white border-r ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Sidebar header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-semibold text-gray-900 ${isCollapsed ? 'hidden' : 'block'}`}>Admin Panel</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:block"
          disabled
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {sidebarItems.map((item, index) => (
            <li key={index}>
              {item.subItems ? (
                <div>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-2 ${isActive(item.href) ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700'} ${isCollapsed ? 'px-2' : ''}`}
                    onClick={() => toggleSection(item.label)}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span className={`${isCollapsed ? 'hidden' : 'block'}`}>{item.label}</span>
                    <span className={`ml-auto ${isCollapsed ? 'hidden' : 'block'}`}>
                      {openSections[item.label] ? '▲' : '▼'}
                    </span>
                  </Button>
                  {openSections[item.label] && !isCollapsed && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {item.subItems.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link
                            href={subItem.href}
                            className={`block px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors ${
                              isActive(subItem.href) ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600'
                            }`}
                          >
                            <span>{subItem.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded hover:bg-gray-100 transition-colors ${
                    isActive(item.href) ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span className={`${isCollapsed ? 'hidden' : 'block'}`}>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar footer */}
      <div className="p-4 border-t">
        <button
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded hover:bg-gray-100 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className={`${isCollapsed ? 'hidden' : 'block'}`}>Logout</span>
        </button>
      </div>
    </div>
  );
}