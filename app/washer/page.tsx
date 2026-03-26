'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WasherRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect from /washer to /washer/dashboard
    router.push('/washer/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p>Redirecting to dashboard...</p>
      </div>
    </div>
  );
}