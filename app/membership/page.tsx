'use client';

import { useState, useEffect, useMemo } from 'react';
import LayoutWrapper from '../components/layout/layout-wrapper';
import { useI18n } from '@/lib/i18n';

export default function MembershipPage() {
  const { t, isLoaded } = useI18n();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle URL hash to select plan from home page
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      // Set the selected plan based on the hash
      if (hash === 'silver' || hash === 'gold' || hash === 'platinum') {
        setSelectedPlan(hash);
      }
    }
  }, []);

  // Scroll to selected plan when it changes
  useEffect(() => {
    if (selectedPlan) {
      // Add a small delay to ensure the DOM is updated
      setTimeout(() => {
        const element = document.getElementById(`plan-${selectedPlan}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a visual highlight effect
          element.classList.add('ring-2', 'ring-primary');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary');
          }, 2000);
        }
      }, 100);
    }
  }, [selectedPlan]);

  const handleContinue = async () => {
    if (selectedPlan && selectedDuration) {
      setIsProcessing(true);
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('access_token');
        if (!token) {
          // If not authenticated, show modal with option to login
          setErrorMessage(t('membership.authenticationRequired'));
          setShowErrorModal(true);
          return;
        }

        // Store the selected plan and duration in localStorage for the checkout page
        localStorage.setItem('selectedMembershipPlan', selectedPlan);
        localStorage.setItem('selectedMembershipDuration', selectedDuration.toString());
        localStorage.setItem('selectedMembershipPrice', calculateTotalPrice());

        // Navigate to the checkout page
        window.location.href = '/membership/checkout';
      } catch (error) {
        console.error('Error preparing checkout:', error);
        setErrorMessage(t('membership.actionFailed'));
        setShowErrorModal(true);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Get plan price
  const getPlanPrice = (planId: string): number => {
    switch (planId) {
      case 'silver': return 89;
      case 'gold': return 149;
      case 'platinum': return 199;
      default: return 0;
    }
  };

  // Function to calculate total price with discount
  const calculateTotalPrice = (): string => {
    if (!selectedPlan || !selectedDuration) return 'SAR 0';

    const planPrice = getPlanPrice(selectedPlan);
    const months = selectedDuration;
    let discountPercentage = 0;

    // Apply discount based on duration
    if (selectedDuration === 3) {
      discountPercentage = 10; // Save 10% for 3 months
    } else if (selectedDuration === 6) {
      discountPercentage = 20; // Save 20% for 6 months
    }

    const totalPrice = planPrice * months * (1 - discountPercentage / 100);
    return `SAR ${totalPrice.toFixed(2)}`;
  };

  // Memoize membership plans to avoid recalculating on every render and to only compute after i18n is loaded
  const membershipPlans = useMemo(() => {
    if (!isLoaded) return [];

    const formatPrice = (planId: string): string => {
      const prices = { silver: 'SAR 89', gold: 'SAR 149', platinum: 'SAR 199' };
      return prices[planId as keyof typeof prices] || '';
    };

    return [
      {
        id: 'silver',
        name: t('membership.plans.silver'),
        price: formatPrice('silver'),
        benefits: [
          t('membership.benefits.discountAll', { percentage: '10' }),
          t('membership.benefits.priorityBooking'),
          t('membership.benefits.freeCancellation'),
          t('membership.benefits.basicAccess'),
          t('membership.benefits.loyaltyMultiplier', { x: '1.2' })
        ]
      },
      {
        id: 'gold',
        name: t('membership.plans.gold'),
        price: formatPrice('gold'),
        benefits: [
          t('membership.benefits.discountAll', { percentage: '20' }),
          t('membership.benefits.extendedCancellation'),
          t('membership.benefits.extendedAccess'),
          t('membership.benefits.complimentaryBasic'),
          t('membership.benefits.loyaltyMultiplier', { x: '1.5' })
        ]
      },
      {
        id: 'platinum',
        name: t('membership.plans.platinum'),
        price: formatPrice('platinum'),
        benefits: [
          t('membership.benefits.discountAll', { percentage: '30' }),
          t('membership.benefits.highestPriority'),
          t('membership.benefits.anytimeCancellation'),
          t('membership.benefits.premiumAccess'),
          t('membership.benefits.complimentaryPremium'),
          t('membership.benefits.quarterlyAssessments'),
          t('membership.benefits.earlyAccess'),
          t('membership.benefits.personalAdvisor'),
          t('membership.benefits.loyaltyMultiplier', { x: '2' })
        ]
      }
    ];
  }, [isLoaded, t]);

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 pt-4 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">{t('membership.title')}</h1>
          <p className="text-gray-600 mb-6">{t('membership.subtitle')}</p>

          <div className="flex overflow-x-auto space-x-4 pb-4 hide-scrollbar -mx-4 px-4">
            {membershipPlans.map((plan) => (
              <div
                key={plan.id}
                id={`plan-${plan.id}`}
                className={`flex-shrink-0 w-72 rounded-xl shadow-lg p-4 min-w-[288px] cursor-pointer border-2 ${
                  selectedPlan === plan.id
                    ? 'bg-primary text-white shadow-xl border-primary'
                    : 'bg-white shadow-md border-gray-300 hover:border-primary'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-lg ${
                      selectedPlan === plan.id ? 'text-white' : 'text-primary'
                    }`}>
                      {plan.name}
                    </h3>
                    <div className={`${
                      selectedPlan === plan.id ? 'bg-white text-primary' : 'bg-secondary text-primary'
                    } px-2 py-1 rounded-full text-xs font-bold`}>
                      {plan.price}{t('membership.perMonth')}
                    </div>
                  </div>

                  <div className="mt-3">
                    <ul className="space-y-1">
                      {plan.benefits.map((benefit, idx) => (
                        <li key={idx} className={`flex items-center text-sm ${
                          selectedPlan === plan.id ? 'text-white' : ''
                        }`}>
                          <span className="mr-2 text-green-500">✓</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <h4 className={`text-sm font-semibold ${
                      selectedPlan === plan.id ? 'text-white' : 'text-gray-700'
                    }`}>
                      {t('membership.includedBenefits')}
                    </h4>
                    <ul className="mt-1 space-y-1">
                      {plan.benefits.map((benefit, idx) => (
                        <li key={idx} className={`text-xs flex items-center ${
                          selectedPlan === plan.id ? 'text-white' : 'text-gray-600'
                        }`}>
                          <span className="mr-1">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Subscription Duration Card */}
          <div className="fixed bottom-16 left-4 right-4 sm:left-8 sm:right-8 z-40 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl shadow-xl p-2 sm:p-4 border-2 border-primary/20">
            <h3 className="text-sm sm:text-base font-bold text-center mb-3 text-gray-900">{t('membership.selectDuration')}</h3>

            <div className="space-y-2 mb-3">
              <div
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg cursor-pointer transition-all transform border ${
                  selectedDuration === 1
                    ? 'bg-primary text-white shadow-lg scale-105 border-primary'
                    : 'bg-white border-gray-300 hover:border-primary hover:shadow-md'
                }`}
                onClick={() => setSelectedDuration(1)}
              >
                <div>
                  <p className="text-xs sm:text-sm font-bold">{t('membership.months.1')}</p>
                </div>
                <div className="flex items-center">
                  <span className={`${selectedDuration === 1 ? 'text-white' : 'text-primary'} font-bold text-xs sm:text-sm`}>100%</span>
                </div>
              </div>

              <div
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg cursor-pointer transition-all transform border ${
                  selectedDuration === 3
                    ? 'bg-primary text-white shadow-lg scale-105 border-primary'
                    : 'bg-white border-gray-300 hover:border-primary hover:shadow-md'
                }`}
                onClick={() => setSelectedDuration(3)}
              >
                <div>
                  <p className="text-xs sm:text-sm font-bold">{t('membership.months.3')}</p>
                  <p className={`text-xs ${selectedDuration === 3 ? 'text-white' : 'text-gray-600'}`}>{t('membership.save', { percentage: '10' })}</p>
                </div>
                <div className="flex items-center">
                  <span className={`${selectedDuration === 3 ? 'text-white' : 'text-primary'} font-bold text-xs sm:text-sm`}>90%</span>
                  <span className={`ml-1 ${selectedDuration === 3 ? 'text-white' : 'text-green-600'} text-xs font-bold`}>✓ Save 10%</span>
                </div>
              </div>

              <div
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg cursor-pointer transition-all transform border ${
                  selectedDuration === 6
                    ? 'bg-primary text-white shadow-lg scale-105 border-primary'
                    : 'bg-white border-gray-300 hover:border-primary hover:shadow-md'
                }`}
                onClick={() => setSelectedDuration(6)}
              >
                <div>
                  <p className="text-xs sm:text-sm font-bold">{t('membership.months.6')}</p>
                  <p className={`text-xs ${selectedDuration === 6 ? 'text-white' : 'text-gray-600'}`}>{t('membership.bestValue')}</p>
                </div>
                <div className="flex items-center">
                  <span className={`${selectedDuration === 6 ? 'text-white' : 'text-primary'} font-bold text-xs sm:text-sm`}>80%</span>
                  <span className={`ml-1 ${selectedDuration === 6 ? 'text-white' : 'text-green-600'} text-xs font-bold`}>✓ {t('membership.save', { percentage: '20' })}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <button
                className={`flex-1 py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-colors ${
                  selectedPlan && selectedDuration && !isProcessing
                    ? 'bg-secondary text-primary hover:bg-secondary/80 hover:text-secondary'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!selectedPlan || !selectedDuration || isProcessing}
                onClick={handleContinue}
              >
                {isProcessing ? t('membership.processing') : t('membership.continue')}
              </button>
              {selectedPlan && selectedDuration && (
                <div className="text-right min-w-[80px] sm:min-w-[100px]">
                  <p className="text-xs sm:text-sm text-gray-600">{t('membership.total')}</p>
                  <p className="font-bold text-primary text-xs sm:text-sm">{calculateTotalPrice()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success modal component */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t('membership.paymentSuccessful')}</h2>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  // Redirect to profile page after closing modal
                  window.location.href = '/profile';
                }}
                className="w-full bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-secondary transition-colors"
              >
                {t('membership.viewProfile')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error modal component */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{errorMessage.includes('sign in') ? t('membership.authenticationRequired') : t('membership.actionFailed')}</h2>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    if (errorMessage.includes('sign in')) {
                      window.location.href = '/login';
                    }
                  }}
                  className="w-full bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-secondary transition-colors"
                >
                  {errorMessage.includes('sign in') ? t('membership.signIn') : t('membership.tryAgain')}
                </button>
                {errorMessage.includes('sign in') && (
                  <button
                    onClick={() => {
                      setShowErrorModal(false);
                      window.location.href = '/register';
                    }}
                    className="w-full bg-white text-primary py-3 px-4 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    {t('membership.createAccount')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </LayoutWrapper>
  );
}