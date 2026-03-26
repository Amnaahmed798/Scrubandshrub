'use client';

export const dynamic = 'force-dynamic';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail as verifyEmailService, requestVerificationCode } from '@/lib/auth-service';
import { useI18n } from '@/lib/i18n';

// Content component
function VerifyEmailContent() {
  const { t } = useI18n();
  const [verificationCode, setVerificationCode] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get email and userId from query params if available
  React.useEffect(() => {
    const emailParam = searchParams.get('email');
    const userIdParam = searchParams.get('userId');
    if (emailParam) setEmail(emailParam);
    if (userIdParam) setUserId(userIdParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyEmailService(userId, verificationCode);
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: any) {
      let errorMessage = 'Verification failed. Please try again.';
      if (err && typeof err === 'object') {
        if (err.message) {
          errorMessage = err.message;
        } else if (err.detail) {
          errorMessage = err.detail;
        } else {
          errorMessage = JSON.stringify(err);
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
      console.error('Verification error details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
            {t('verifyEmail.emailVerifiedSuccessfully')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('verifyEmail.accountVerified')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
          {t('verifyEmail.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('verifyEmail.description')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary">
                {t('profile.email')}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="verification_code" className="block text-sm font-medium text-primary">
                {t('verifyEmail.verificationCode')}
              </label>
              <div className="mt-1">
                <input
                  id="verification_code"
                  name="verification_code"
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                  placeholder={t('verifyEmail.enterCode')}
                  maxLength={6}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('verifyEmail.verifying') : t('verifyEmail.verifyEmail')}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  await requestVerificationCode(email);
                  alert('Verification code resent successfully!');
                } catch (err: any) {
                  let errorMessage = 'Failed to resend verification code';
                  if (err && typeof err === 'object') {
                    if (err.message) {
                      errorMessage = err.message;
                    } else if (err.detail) {
                      errorMessage = err.detail;
                    } else {
                      errorMessage = JSON.stringify(err);
                    }
                  } else if (typeof err === 'string') {
                    errorMessage = err;
                  }
                  setError(errorMessage);
                  console.error(err);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="text-sm font-medium text-secondary hover:text-yellow-700 disabled:opacity-50"
            >
              {t('verifyEmail.resendVerificationCode')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm font-medium text-secondary hover:text-yellow-700">
              {t('verifyEmail.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
