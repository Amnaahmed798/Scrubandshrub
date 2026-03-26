'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WasherService } from '@/services/washerService';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        await WasherService.logout();
        router.push('/login');
      } catch (error) {
        console.error('Logout error:', error);
        // Even if there's an error, redirect to login
        router.push('/login');
      }
    };

    logout();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p>Logging out...</p>
      </div>
    </div>
  );
}