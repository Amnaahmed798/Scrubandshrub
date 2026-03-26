'use client';

import { FeedbackProvider } from './context/feedback-context';
import { ToastProvider } from '@/components/ui/toast';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <FeedbackProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </FeedbackProvider>
  );
}