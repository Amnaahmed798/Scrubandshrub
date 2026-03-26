'use client';

import { useState, useEffect } from 'react';
import LayoutWrapper from '../../components/layout/layout-wrapper';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

export default function MembershipCheckoutPage() {
  const router = useRouter();
  const { t, isLoaded } = useI18n();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [totalPrice, setTotalPrice] = useState<string>('SAR 0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const stcPayEnabled = process.env.NEXT_PUBLIC_STC_PAY_MERCHANT_ID && process.env.NEXT_PUBLIC_STC_PAY_API_KEY;
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Get plan and duration from router state or localStorage
  useEffect(() => {
    const plan = localStorage.getItem('selectedMembershipPlan');
    const duration = localStorage.getItem('selectedMembershipDuration');
    const price = localStorage.getItem('selectedMembershipPrice');

    if (plan && duration && price) {
      setSelectedPlan(plan);
      setSelectedDuration(parseInt(duration));
      setTotalPrice(price);
    } else {
      // If no data is available, redirect back to membership page
      router.push('/membership');
    }
  }, [router]);

  const handlePayment = async () => {
    if (!selectedPlan || !selectedDuration) {
      router.push('/membership');
      return;
    }

    if (paymentMethod === 'stcpay' && stcPayEnabled) {
      // For STC Pay, initiate payment through backend
      await initiateStcPayPayment();
    } else {
      // Show confirmation modal for other payment methods
      setShowConfirmation(true);
    }
  };

  const initiateStcPayPayment = async () => {
    if (!selectedPlan || !selectedDuration) {
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      // Get user info
      const userInfo = getUserInfo();

      // Prepare payment data
      const paymentData = {
        amount: parseFloat(totalPrice.replace('SAR ', '')),
        currency: 'SAR',
        order_id: `MEMBERSHIP_${Date.now()}_${selectedPlan}`,
        description: `${formatPlanName(selectedPlan)} membership plan for ${selectedDuration} months`,
        customer_name: userInfo.name,
        customer_mobile: userInfo.phone,
        customer_email: userInfo.email,
        return_url: `${window.location.origin}/membership/success`,
        callback_url: `${window.location.origin}/api/v1/stcpay/webhook`
      };

      // Call backend to initiate STC Pay payment
      const response = await fetch('/api/v1/stcpay/initiate-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to initiate STC Pay payment');
      }

      // If payment initiation was successful, redirect to STC Pay
      if (result.payment_url) {
        window.location.href = result.payment_url;
      } else if (result.qr_code) {
        // Handle QR code payment if needed
        alert('Please scan the QR code in your STC Pay app to complete the payment');
        // In a real implementation, you would display the QR code
      } else {
        throw new Error('Payment initiation returned unexpected response');
      }
    } catch (error: any) {
      console.error('Error initiating STC Pay payment:', error);
      alert(error.message || 'Failed to initiate STC Pay payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmPayment = async () => {
    setIsProcessing(true);
    setShowConfirmation(false);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      if (paymentMethod === 'card') {
        // Process credit/debit card payment through backend
        const userInfo = getUserInfo();

        // Prepare card payment data
        const cardPaymentData = {
          amount: parseFloat(totalPrice.replace('SAR ', '')),
          currency: 'SAR',
          card_number: cardDetails.number.replace(/\s/g, ''), // Remove spaces
          expiry_month: cardDetails.expiry.substring(0, 2),
          expiry_year: cardDetails.expiry.substring(3, 5), // Last 2 digits of year
          cvv: cardDetails.cvv,
          card_holder_name: cardDetails.name || userInfo.name,
          order_id: `CARD_${Date.now()}_${selectedPlan}`,
          description: `${formatPlanName(selectedPlan)} membership plan for ${selectedDuration} months`
        };

        // Call backend to process credit card payment
        const response = await fetch('/api/v1/payment/credit-card', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cardPaymentData),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Credit card payment failed');
        }

        console.log('Credit card payment processed successfully:', result);

        // After successful payment, create membership record in the backend
        const membershipData = {
          type: selectedPlan ? selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1) : 'Unknown',
          duration_months: selectedDuration || 0,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + (selectedDuration || 0) * 30 * 24 * 60 * 60 * 1000).toISOString(), // Approximate end date
          price: parseFloat(totalPrice.replace('SAR ', '')),
          status: 'active',
          transaction_id: result.transaction_id
        };

        // Call the backend API to create the membership
        const membershipResponse = await fetch('/api/v1/memberships', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(membershipData),
        });

        if (!membershipResponse.ok) {
          throw new Error('Failed to create membership');
        }

        const membershipResult = await membershipResponse.json();
        console.log('Membership created successfully:', membershipResult);

        // Update the user's profile with the new membership
        const profileResponse = await fetch('/api/v1/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            membership_id: membershipResult.data.id, // Assuming the API returns the created membership ID
            membership_type: selectedPlan,
            membership_status: 'active'
          }),
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to update profile with membership');
        }

        // Clear the temporary data
        localStorage.removeItem('selectedMembershipPlan');
        localStorage.removeItem('selectedMembershipDuration');
        localStorage.removeItem('selectedMembershipPrice');

        // Redirect to success page
        router.push('/membership/success');
      } else {
        // For other payment methods, continue with the original flow
        // After successful payment, create membership record in the backend
        const membershipData = {
          type: selectedPlan ? selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1) : 'Unknown',
          duration_months: selectedDuration || 0,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + (selectedDuration || 0) * 30 * 24 * 60 * 60 * 1000).toISOString(), // Approximate end date
          price: parseFloat(totalPrice.replace('SAR ', '')),
          status: 'active'
        };

        // Call the backend API to create the membership
        const response = await fetch('/api/v1/memberships', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(membershipData),
        });

        if (!response.ok) {
          throw new Error('Failed to create membership');
        }

        const result = await response.json();
        console.log('Membership created successfully:', result);

        // Update the user's profile with the new membership
        const profileResponse = await fetch('/api/v1/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            membership_id: result.data.id, // Assuming the API returns the created membership ID
            membership_type: selectedPlan,
            membership_status: 'active'
          }),
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to update profile with membership');
        }

        // Clear the temporary data
        localStorage.removeItem('selectedMembershipPlan');
        localStorage.removeItem('selectedMembershipDuration');
        localStorage.removeItem('selectedMembershipPrice');

        // Redirect to success page
        router.push('/membership/success');
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      alert(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to format the plan name
  const formatPlanName = (plan: string | null) => {
    if (!plan) return '';
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // Function to get user information for payment
  const getUserInfo = () => {
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');

    return {
      name: profile.full_name || localStorage.getItem('user_full_name') || 'Customer',
      email: profile.email || localStorage.getItem('user_email') || '',
      phone: profile.phone_number || localStorage.getItem('user_phone') || ''
    };
  };

  // Function to get plan benefits
  const getPlanBenefits = (plan: string | null) => {
    if (!plan) return [];

    const benefitsMap: Record<string, string[]> = {
      silver: [
        t('membership.benefits.discountAll', { percentage: '10' }),
        t('membership.benefits.priorityBooking'),
        t('membership.benefits.freeCancellation'),
        t('membership.benefits.basicAccess'),
        t('membership.benefits.loyaltyMultiplier', { x: '1.2' })
      ],
      gold: [
        t('membership.benefits.discountAll', { percentage: '20' }),
        t('membership.benefits.highestPriority'),
        t('membership.benefits.extendedCancellation'),
        t('membership.benefits.extendedAccess'),
        t('membership.benefits.loyaltyMultiplier', { x: '1.5' }),
        t('membership.benefits.complimentaryBasic')
      ],
      platinum: [
        t('membership.benefits.discountAll', { percentage: '30' }),
        t('membership.benefits.highestPriority'),
        t('membership.benefits.anytimeCancellation'),
        t('membership.benefits.premiumAccess'),
        t('membership.benefits.loyaltyMultiplier', { x: '2' }),
        t('membership.benefits.complimentaryPremium'),
        t('membership.benefits.quarterlyAssessments'),
        t('membership.benefits.earlyAccess'),
        t('membership.benefits.personalAdvisor')
      ]
    };

    return benefitsMap[plan.toLowerCase()] || [];
  };

  if (!isLoaded) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-background pt-4 flex items-center justify-center">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-background pt-4">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-2xl font-bold mb-2">{t('checkout.title')}</h1>
          <p className="text-gray-600 mb-6">{t('checkout.orderSummary')}</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t('checkout.orderSummary')}</h2>

                {selectedPlan && selectedDuration && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="font-semibold text-gray-900">{formatPlanName(selectedPlan)} {t('common.all')}</h3>
                        <p className="text-sm text-gray-600">{selectedDuration} {selectedDuration && selectedDuration > 1 ? t('membership.months.6').includes('أشهر') ? 'أشهر' : 'months' : selectedDuration && selectedDuration === 1 ? t('membership.months.1').split(' ')[0] : 'month'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{totalPrice}</p>
                        <p className="text-xs text-gray-500">{t('checkout.total')}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{t('membership.includedBenefits')}</h4>
                      <ul className="space-y-2">
                        {getPlanBenefits(selectedPlan).map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span className="text-gray-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t('checkout.paymentMethod')}</h2>

                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <button
                      className={`flex-1 py-3 px-4 rounded-lg border ${
                        paymentMethod === 'card'
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      {t('checkout.payNow')}
                    </button>
                    {stcPayEnabled && (
                      <button
                        className={`flex-1 py-3 px-4 rounded-lg border ${
                          paymentMethod === 'stcpay'
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-200 bg-white text-gray-700'
                        }`}
                        onClick={() => setPaymentMethod('stcpay')}
                      >
                        STC Pay
                      </button>
                    )}
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.cardNumber')}</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.cardExpiry')}</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.cardCVV')}</label>
                          <input
                            type="text"
                            placeholder="123"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.cardName')}</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  {stcPayEnabled && paymentMethod === 'stcpay' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm">{t('membership.processing')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('checkout.orderSummary')}</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('membership.title')}</span>
                  <span className="font-medium">{formatPlanName(selectedPlan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('bookingPage.duration')}</span>
                  <span className="font-medium">{selectedDuration || 0} {selectedDuration && selectedDuration > 1 ? t('membership.months.6').includes('أشهر') ? 'أشهر' : 'months' : 'month'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('checkout.subtotal')}</span>
                  <span className="font-medium">{totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('checkout.discount')}</span>
                  <span className="font-medium text-green-600">0%</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('checkout.total')}</span>
                    <span className="text-primary">{totalPrice}</span>
                  </div>
                </div>
              </div>

              <button
                className={`w-full py-4 rounded-xl font-bold text-white transition-colors ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#3B7C87] hover:bg-[#FCD34D] hover:text-[#3B7C87] active:bg-[#FCD34D] active:text-[#3B7C87]'
                }`}
                disabled={isProcessing}
                onClick={handlePayment}
              >
                {isProcessing ? t('membership.processing') : `${t('checkout.payNow')} ${totalPrice}`}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                {t('common.loading')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t('checkout.confirmPayment')}</h2>
              <p className="text-gray-600 mb-6">
                {t('checkout.confirmPaymentMessage', {
                  amount: totalPrice,
                  plan: formatPlanName(selectedPlan),
                  duration: selectedDuration || 0,
                  plural: (selectedDuration && selectedDuration > 1) ? 's' : ''
                })}
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={confirmPayment}
                  className="w-full bg-[#3B7C87] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#FCD34D] hover:text-[#3B7C87] active:bg-[#FCD34D] active:text-[#3B7C87] transition-colors"
                >
                  {t('common.confirm')}
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="w-full bg-white text-primary py-3 px-4 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}