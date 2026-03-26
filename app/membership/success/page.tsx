'use client';

import { useState, useEffect } from 'react';
import LayoutWrapper from '../../components/layout/layout-wrapper';
import { useRouter } from 'next/navigation';

export default function MembershipSuccessPage() {
  const router = useRouter();
  const [membershipDetails, setMembershipDetails] = useState({
    plan: '',
    duration: 0,
    price: ''
  });

  useEffect(() => {
    // In a real app, you would fetch the actual membership details from the backend
    // For now, we'll use the values from localStorage
    const plan = localStorage.getItem('lastMembershipPlan') || 'Plan';
    const duration = localStorage.getItem('lastMembershipDuration') || '0';
    const price = localStorage.getItem('lastMembershipPrice') || 'SAR 0';

    setMembershipDetails({
      plan: plan,
      duration: parseInt(duration),
      price: price
    });

    // Clear the temporary data
    localStorage.removeItem('lastMembershipPlan');
    localStorage.removeItem('lastMembershipDuration');
    localStorage.removeItem('lastMembershipPrice');
  }, []);

  const formatPlanName = (plan: string) => {
    if (!plan) return '';
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-background pt-4">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-gray-600 text-lg mb-8">
              Thank you for purchasing the {formatPlanName(membershipDetails.plan)} Plan
            </p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{formatPlanName(membershipDetails.plan)}</p>
                  <p className="text-sm text-gray-600">Plan</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{membershipDetails.duration} months</p>
                  <p className="text-sm text-gray-600">Duration</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{membershipDetails.price}</p>
                  <p className="text-sm text-gray-600">Total Paid</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => router.push('/profile')}
                className="w-full bg-primary text-white py-4 px-6 rounded-xl font-bold hover:bg-secondary transition-colors"
              >
                View My Profile
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-white text-primary py-4 px-6 rounded-xl font-bold border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}