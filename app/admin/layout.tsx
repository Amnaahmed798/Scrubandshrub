'use client';

import { SidebarProvider } from '@/context/sidebar-context';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Check if user exists but is not an admin
        if (user) {
          // User is logged in but not an admin, redirect home
          router.push('/');
        } else {
          // User is not logged in at all, redirect to login
          router.push('/login');
        }
        setShouldRedirect(true);
      }
    }
  }, [isAuthenticated, user, loading, router]);

  if (loading || shouldRedirect) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Render the admin layout if user is authenticated as admin
  return (
    <SidebarProvider>
      <AdminLayoutClient>
        {children}
      </AdminLayoutClient>
    </SidebarProvider>
  );
}