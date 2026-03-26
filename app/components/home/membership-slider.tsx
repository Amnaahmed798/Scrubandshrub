'use client';

import { MembershipPlan } from '../../../lib/types';
import { membershipPlans } from '../../../lib/data';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

interface MembershipSliderProps {
  onMembershipSelect?: (plan: MembershipPlan) => void;
}

export function MembershipSlider({ onMembershipSelect }: MembershipSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(true); // paused until hover
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const handleClick = (plan: MembershipPlan) => {
    onMembershipSelect?.(plan);
  };

  // Auto rotate ONLY when hovered
  useEffect(() => {
    if (membershipPlans.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev =>
        prev === membershipPlans.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Translate plan name based on locale
  const getTranslatedPlanName = (planId: string): string => {
    // Try to get from membership.plans translation key
    const translated = t(`membership.plans.${planId}`);
    return translated !== `membership.plans.${planId}` ? translated : planId.charAt(0).toUpperCase() + planId.slice(1);
  };

  // Get benefits with translations
  const getTranslatedBenefits = (planId: string): string[] => {
    const benefitConfigs = {
      silver: [
        { key: 'membership.benefits.discountAll', params: { percentage: '10' } },
        { key: 'membership.benefits.priorityBooking', params: {} },
        { key: 'membership.benefits.freeCancellation', params: {} },
        { key: 'membership.benefits.basicAccess', params: {} },
        { key: 'membership.benefits.loyaltyMultiplier', params: { x: '1.2' } }
      ],
      gold: [
        { key: 'membership.benefits.discountAll', params: { percentage: '20' } },
        { key: 'membership.benefits.extendedCancellation', params: {} },
        { key: 'membership.benefits.extendedAccess', params: {} },
        { key: 'membership.benefits.complimentaryBasic', params: {} },
        { key: 'membership.benefits.loyaltyMultiplier', params: { x: '1.5' } }
      ],
      platinum: [
        { key: 'membership.benefits.discountAll', params: { percentage: '30' } },
        { key: 'membership.benefits.highestPriority', params: {} },
        { key: 'membership.benefits.anytimeCancellation', params: {} },
        { key: 'membership.benefits.premiumAccess', params: {} },
        { key: 'membership.benefits.complimentaryPremium', params: {} },
        { key: 'membership.benefits.quarterlyAssessments', params: {} },
        { key: 'membership.benefits.earlyAccess', params: {} },
        { key: 'membership.benefits.personalAdvisor', params: {} },
        { key: 'membership.benefits.loyaltyMultiplier', params: { x: '2' } }
      ]
    };

    const configs = benefitConfigs[planId as keyof typeof benefitConfigs] || [];
    return configs.map(config => t(config.key, config.params));
  };

  return (
    <div
      className="pb-4"
      onMouseEnter={() => setIsPaused(false)}
      onMouseLeave={() => setIsPaused(true)}
    >
      <h2 className="text-lg font-bold mb-3">{t('home.membersTitle')}</h2>

      {/* Fixed card container */}
      <div className="relative w-full min-h-[280px] sm:min-h-[300px] overflow-hidden">
        <motion.div
          className="flex w-full"
          style={{ direction: 'ltr' }}
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {membershipPlans.map((plan, idx) => (
            <div
              key={plan.id}
              className="min-w-full bg-primary rounded-xl shadow-lg p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-200 text-white"
              onClick={() => handleClick(plan)}
              role="button"
              tabIndex={0}
            >
              <div className="flex flex-col h-full text-white">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-bold text-lg sm:text-xl text-white">
                    {getTranslatedPlanName(plan.id)}
                  </h3>
                  <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-secondary text-primary`}>
                    SAR {plan.price}/{plan.billingCycle}
                  </div>
                </div>

                <div className="flex-1">
                  <ul className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                    {getTranslatedBenefits(plan.id).map((benefit, idx) => (
                      <li key={idx} className="flex items-center text-xs sm:text-base text-white">
                        <span className={isRTL ? 'ml-1 sm:ml-2 text-sm sm:text-lg text-white' : 'mr-1 sm:mr-2 text-sm sm:text-lg text-white'}>✓</span>
                        <span className="line-clamp-2">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 sm:pt-3 border-t border-white/30">
                    <h4 className="text-xs sm:text-sm font-semibold mb-2 text-white">
                      {t('membership.includedBenefits')}
                    </h4>
                    <ul className="space-y-0.5 sm:space-y-1">
                      {plan.features.map((feature, idx) => {
                        // Extract translation key from feature text
                        const featureKeyMap: Record<string, string> = {
                          'Standard': 'membership.benefits.priorityBooking',
                          'High': 'membership.benefits.priorityBooking',
                          'Highest': 'membership.benefits.highestPriority',
                          '10%': 'membership.benefits.discountAll',
                          '20%': 'membership.benefits.discountAll',
                          '30%': 'membership.benefits.discountAll',
                        };
                        
                        // Try to find matching translation key
                        const translationKey = Object.keys(featureKeyMap).find(key => feature.includes(key));
                        const translatedFeature = translationKey 
                          ? t(featureKeyMap[translationKey], { 
                              percentage: feature.match(/\d+/)?.[0] || '0',
                              x: feature.match(/[\d.]+x/)?.[0] || '1'
                            })
                          : feature;
                        
                        return (
                          <li
                            key={idx}
                            className="text-xs flex items-center text-white/80"
                          >
                            <span className={isRTL ? 'ml-1 text-white/80' : 'mr-1 text-white/80'}>•</span>
                            {translatedFeature}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                <Link href={`/membership#${plan.id}`} className="mt-auto block">
                  <button className={`w-full py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm bg-secondary text-primary transition-colors`}>
                    {t('home.membersViewDetails')}
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center mt-4 space-x-2">
        {membershipPlans.map((_, index) => (
          <button
            key={index}
            className={cn(
              'w-3 h-3 rounded-full',
              index === currentIndex ? 'bg-secondary' : 'bg-gray-300'
            )}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to plan ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

