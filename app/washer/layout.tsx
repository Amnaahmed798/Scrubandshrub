'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from '@/components/washer/Sidebar';

interface WasherLayoutProps {
  children: ReactNode;
}

export default function WasherLayout({ children }: WasherLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Listen for custom event to toggle sidebar from child components
  useEffect(() => {
    const handleToggleSidebar = () => {
      toggleSidebar();
    };

    window.addEventListener('toggleWasherSidebar', handleToggleSidebar);

    return () => {
      window.removeEventListener('toggleWasherSidebar', handleToggleSidebar);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <main className={`flex-1 ${sidebarOpen ? 'ml-0 md:ml-0 lg:ml-64' : 'ml-0 lg:ml-64'}`}>
        {children}
      </main>
    </div>
  );
}