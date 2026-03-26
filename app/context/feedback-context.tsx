'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { FeedbackForm } from '../components/feedback/feedback-form';
import { Testimonial } from '../../lib/types';

interface FeedbackContextType {
  showFeedbackForm: (bookingId?: string) => void;
  submitFeedback: (feedback: any) => void;
  addTestimonial: (testimonial: Testimonial) => void;
  testimonials: Testimonial[];
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [storedTestimonials, setStoredTestimonials] = useState<Testimonial[]>([]);

  const showFeedbackForm = (bookingId?: string) => {
    if (bookingId) {
      setCurrentBookingId(bookingId);
    }
    setIsFeedbackFormOpen(true);
  };

  const submitFeedback = (feedback: any) => {
    // In a real app, you would send this to your backend
    // For now, we'll just log it
    console.log('Feedback submitted:', feedback);

    // In a real app, you would get the user's name from their profile
    // For now, we'll use a generic name
    const userName = 'Current Customer'; // This would come from user context in a real app

    // Add the feedback as a new testimonial
    const newTestimonial: Testimonial = {
      id: feedback.id || `testimonial-${Date.now()}`,
      name: userName,
      rating: feedback.rating,
      comment: feedback.comment,
      date: new Date().toISOString().split('T')[0],
      images: feedback.images || [],
    };

    addTestimonial(newTestimonial);

    setIsFeedbackFormOpen(false);
    setCurrentBookingId(null);
  };

  const addTestimonial = (testimonial: Testimonial) => {
    setStoredTestimonials(prev => [testimonial, ...prev]); // Add to the beginning
  };

  // Combine stored testimonials with default ones
  const allTestimonials = [...storedTestimonials]; // In a real app, you'd also include default testimonials

  return (
    <FeedbackContext.Provider value={{ showFeedbackForm, submitFeedback, addTestimonial, testimonials: allTestimonials }}>
      {children}
      <FeedbackForm
        isOpen={isFeedbackFormOpen}
        onClose={() => setIsFeedbackFormOpen(false)}
        onSubmit={submitFeedback}
      />
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}