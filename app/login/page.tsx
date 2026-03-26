'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/auth-service';
import { FcGoogle } from 'react-icons/fc';
import { handleOAuthFlow } from '@/utils/webview-utils';
import { useI18n } from '@/lib/i18n';

const LoginPage = () => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = () => {
    // For OAuth, we redirect to the backend OAuth endpoint via Apache reverse proxy
    const googleLoginUrl = '/api/v1/google/login';

    // Handle OAuth flow appropriately based on environment
    handleOAuthFlow(googleLoginUrl);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with email:', formData.email);

      const result = await login(formData.email, formData.password);
      console.log('Login response received:', result);

      // Store tokens in localStorage (in production, consider HttpOnly cookies)
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('refresh_token', result.refresh_token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Update last login timestamp in user data
      const updatedUser = {
        ...result.user,
        last_login: new Date().toISOString()
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      console.log('[Login] Tokens stored in localStorage');
      console.log('[Login] Stored access_token:', !!localStorage.getItem('access_token'));
      console.log('[Login] Stored refresh_token:', !!localStorage.getItem('refresh_token'));
      console.log('[Login] Stored user:', localStorage.getItem('user'));
      console.log('[Login] User role:', result.user.role);

      // Check if there are saved booking details
      const savedBookingDetails = localStorage.getItem('booking_details');

      if (savedBookingDetails) {
        // If there are saved booking details, go to checkout page
        router.push('/book/checkout');
      } else {
        // Otherwise, redirect based on user role
        switch (result.user.role) {
          case 'ADMIN':
            console.log('Redirecting to admin panel');
            router.push('/admin');
            break;
          case 'WASHER':
            console.log('Redirecting to washer dashboard');
            router.push('/washer/dashboard');
            break;
          case 'CUSTOMER':
          default:
            console.log('Redirecting to home page');
            router.push('/');
            break;
        }
      }
    } catch (err: any) {
      let errorMessage = 'Invalid email or password. Please try again.';

      if (err && typeof err === 'object') {
        // Handle different error object structures
        if (err.message) {
          errorMessage = String(err.message);
        } else if (err.detail) {
          errorMessage = String(err.detail);
        } else if (err.error) {
          errorMessage = String(err.error);
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else {
          // If it's still an object, try to get a meaningful message
          errorMessage = err.toString && typeof err.toString === 'function'
            ? err.toString()
            : 'Login failed. Please try again.';
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else {
        errorMessage = 'Login failed. Please try again.';
      }

      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 pb-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-primary">
          {t('auth.login.title')}
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">
          {t('auth.login.noAccount')}{' '}
          <Link href="/register" className="font-medium text-secondary hover:text-yellow-500">
            {t('auth.login.registerHere')}
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 sm:py-8 px-4 shadow sm:rounded-lg sm:px-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs sm:text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-primary">
                {t('auth.login.email')}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-secondary focus:border-secondary text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-primary">
                {t('auth.login.password')}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-secondary focus:border-secondary text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-3 w-3 sm:h-4 sm:w-4 text-secondary focus:ring-secondary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm text-primary">
                  {t('auth.login.rememberMe')}
                </label>
              </div>

              <div className="text-xs sm:text-sm">
                <Link href="/forgot-password" className="font-medium text-secondary hover:text-yellow-500">
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-secondary hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
              </button>
            </div>
          </form>

          <div className="mt-4 sm:mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 bg-white text-primary">{t('auth.login.orContinueWith')}</span>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FcGoogle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {t('auth.login.signInWithGoogle')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;