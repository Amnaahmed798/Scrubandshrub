'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSpinner } from 'react-icons/fa';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Extract tokens from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // Store tokens in localStorage
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      // Clear URL parameters to avoid exposing tokens in URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Delay redirect slightly to ensure tokens are stored
      setTimeout(() => {
        // Redirect to home page
        router.push('/');
      }, 1000);
    } else {
      // If no tokens, redirect to login with error
      router.push('/login?error=auth_failed');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <FaSpinner className="animate-spin text-4xl text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">Completing Authentication</h2>
        <p className="text-gray-600">Please wait while we complete your sign-in...</p>
      </div>
    </div>
  );
}