'use client';

import { useEffect } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';

export default function SessionWarningModal() {
  const { showExpiryWarning, timeRemaining, logout, extendSession } = useAuthSession();

  const handleStayLoggedIn = () => {
    extendSession();
  };

  const handleLogout = () => {
    logout();
  };

  // Auto-logout when timer reaches 0
  useEffect(() => {
    if (timeRemaining <= 0 && showExpiryWarning) {
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, showExpiryWarning]);

  if (!showExpiryWarning) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Session Expiring Soon</h3>
        </div>

        <p className="text-gray-600 mb-4">
          Your session will expire in{' '}
          <span className="font-bold text-red-600">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Stay Logged In
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Logout
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Click "Stay Logged In" to extend your session
        </p>
      </div>
    </div>
  );
}
