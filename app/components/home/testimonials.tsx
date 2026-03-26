'use client';

import { useState, useEffect } from 'react';
import { useFeedback } from '../../context/feedback-context';
import { Testimonial } from '../../../lib/types';
import { testimonials as defaultTestimonials } from '../../../lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

interface TestimonialsProps {
  testimonials?: Testimonial[];
}

export function Testimonials({ testimonials: propTestimonials }: TestimonialsProps) {
  const { testimonials: contextTestimonials } = useFeedback();
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [endX, setEndX] = useState(0);
  const { t, locale } = useI18n();

  useEffect(() => {
    // Combine prop testimonials (if any), context testimonials, and default testimonials
    const combinedTestimonials = [
      ...(propTestimonials || []),
      ...contextTestimonials,
      ...defaultTestimonials
    ];
    // Ensure we have unique testimonials by ID to prevent duplicates
    const uniqueTestimonials = combinedTestimonials.filter((testimonial, index, self) =>
      index === self.findIndex(t => t.id === testimonial.id)
    );
    setAllTestimonials(uniqueTestimonials);
  }, [propTestimonials, contextTestimonials, defaultTestimonials]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev === allTestimonials.length - 1 ? 0 : prev + 1));
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev === 0 ? allTestimonials.length - 1 : prev - 1));
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setEndX(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (startX - endX > 50) {
      // Swipe left - next testimonial
      nextTestimonial();
    } else if (endX - startX > 50) {
      // Swipe right - prev testimonial
      prevTestimonial();
    }
  };

  if (allTestimonials.length === 0) return null;

  const currentTestimonial = allTestimonials[currentIndex];

  return (
    <div className="px-4 py-6 sm:py-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl sm:rounded-2xl border-2 border-primary/20 shadow-lg">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">{t('home.testimonialsTitle')}</h2>

      <div
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTestimonial.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-primary/20 hover:shadow-xl hover:border-primary/40 transition-all duration-300"
          >
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 overflow-hidden mr-3 sm:mr-4 border-2 border-primary/40 flex-shrink-0">
                {currentTestimonial.avatar ? (
                  <img
                    src={currentTestimonial.avatar}
                    alt={locale === 'ar' ? currentTestimonial.nameAr || currentTestimonial.name : currentTestimonial.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide the image on error and show the fallback with CSS
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center text-white font-bold text-lg';
                        const displayName = locale === 'ar' ? (currentTestimonial.nameAr || currentTestimonial.name) : currentTestimonial.name;
                        fallback.textContent = displayName.charAt(0);
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center text-white font-bold text-lg">
                    {(locale === 'ar' ? (currentTestimonial.nameAr || currentTestimonial.name) : currentTestimonial.name).charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900">
                  {locale === 'ar' ? (currentTestimonial.nameAr || currentTestimonial.name) : currentTestimonial.name}
                </h3>
                <div className="flex items-center gap-1">
                  <div className="text-yellow-500 text-sm sm:text-base tracking-tight">
                    {'★'.repeat(currentTestimonial.rating)}
                    {'☆'.repeat(5 - currentTestimonial.rating)}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-700 text-xs sm:text-base mb-2 sm:mb-3 leading-relaxed italic line-clamp-3">"{locale === 'ar' ? (currentTestimonial.commentAr || currentTestimonial.comment) : currentTestimonial.comment}"</p>

            <p className="text-xs sm:text-sm text-gray-500">{currentTestimonial.date}</p>

            {currentTestimonial.images && currentTestimonial.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {currentTestimonial.images.slice(0, 2).map((image, idx) => (
                  <div key={idx} className="aspect-square">
                    <img
                      src={image}
                      alt={`Testimonial image ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        // Hide broken images
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation controls */}
        <div className="flex justify-between items-center mt-4 sm:mt-6">
          <button
            onClick={prevTestimonial}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary text-white hover:bg-primary/80 shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-xs sm:text-sm"
          >
            ← {t('home.testimonialsPrev')}
          </button>

          <div className="flex space-x-1.5 sm:space-x-2">
            {allTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`rounded-full transition-all duration-200 ${
                  index === currentIndex ? 'bg-secondary w-2.5 h-2.5 sm:w-3 sm:h-3 shadow-md' : 'bg-primary/30 w-2 h-2 sm:w-2.5 sm:h-2.5 hover:bg-primary/50'
                }`}
                aria-label={t('home.testimonialsGoTo', { num: index + 1 })}
              />
            ))}
          </div>

          <button
            onClick={nextTestimonial}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary text-white hover:bg-primary/80 shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-xs sm:text-sm"
          >
            {t('home.testimonialsNext')} →
          </button>
        </div>
      </div>
    </div>
  );
}