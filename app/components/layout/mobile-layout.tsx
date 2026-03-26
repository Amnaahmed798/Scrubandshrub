'use client';

import { useEffect, useState } from 'react';
import { isNative, initializeApp, triggerHaptic } from '@/lib/capacitor-utils';
import { ImpactStyle } from '@capacitor/haptics';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isInitialized, setIsInitialized] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialize native app features
    const init = async () => {
      // Set initialized immediately for web
      setIsInitialized(true);
      
      try {
        // Only initialize on native devices, skip on web
        if (typeof window !== 'undefined') {
          await initializeApp({
            onBackButton: () => {
              console.log('Back button pressed');
            },
            onAppResume: () => {
              console.log('App resumed');
            },
            onAppPause: () => {
              console.log('App paused');
            },
          });
        }
      } catch (error) {
        console.warn('MobileLayout init error (expected on web):', error);
      }
    };

    init();

    // Check network status
    const checkNetwork = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', checkNetwork);
    window.addEventListener('offline', checkNetwork);

    return () => {
      window.removeEventListener('online', checkNetwork);
      window.removeEventListener('offline', checkNetwork);
    };
  }, []);

  // Handle touch events for better mobile UX
  const handleTouchStart = () => {
    if (isNative()) {
      triggerHaptic(ImpactStyle.Light);
    }
  };

  return (
    <div 
      className="min-h-screen bg-background touch-manipulation"
      onTouchStart={handleTouchStart}
    >
      {/* Network status banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-xs text-center py-2 z-50">
          You're offline. Some features may not be available.
        </div>
      )}

      {/* Safe area insets for notched devices */}
      <div
        className="w-full"
      >
        {isInitialized ? children : (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        )}
      </div>

      {/* CSS for mobile optimizations */}
      <style jsx global>{`
        /* Prevent text selection on mobile */
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-user-select: none;
          user-select: none;
        }

        /* Allow text selection in inputs */
        .touch-manipulation input,
        .touch-manipulation textarea {
          -webkit-user-select: text;
          user-select: text;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Prevent pull-to-refresh on mobile (optional) */
        body {
          overscroll-behavior-y: contain;
        }

        /* Keyboard open state */
        .keyboard-open {
          position: fixed;
          width: 100%;
        }

        /* Safe area for notched devices */
        @supports (padding: max(0px)) {
          body {
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
        }

        /* Disable tap highlight on mobile */
        * {
          -webkit-tap-highlight-color: transparent;
        }

        /* Better button press feedback */
        button:active,
        [role="button"]:active {
          opacity: 0.7;
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}
