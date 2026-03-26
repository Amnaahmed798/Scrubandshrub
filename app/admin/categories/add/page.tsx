'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AddCategoryPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main categories page
    router.push('/admin/categories');
  }, [router]);

  return null; // Render nothing since we're redirecting
}