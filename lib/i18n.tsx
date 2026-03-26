'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

interface Translation {
  [key: string]: any;
}

interface I18nContextType {
  locale: 'en' | 'ar';
  setLocale: (locale: 'en' | 'ar') => void;
  t: (key: string, params?: Record<string, string>) => string;
  isLoaded: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Complete fallback English dictionary - ALL keys the app uses
const fallbackMessages: Translation = {
  common: {
    appName: 'Sandpiper Cleaning Services',
    navHome: 'Home',
    navServices: 'Services',
    navMembership: 'Membership',
    navBookings: 'My Bookings',
    navAdmin: 'Admin',
    navLogin: 'Login',
    navRegister: 'Sign up',
    navLogout: 'Logout',
    navProfile: 'Profile',
    navWasherDashboard: 'Washer Dashboard',
    welcome: 'Welcome',
    languageToggle: 'Toggle language',
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    ascending: 'Ascending',
    descending: 'Descending',
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
    enabled: 'Enabled',
    disabled: 'Disabled',
    viewMore: 'View More',
    viewLess: 'View Less',
    showAll: 'Show All',
    optional: '(Optional)',
    confirmPassword: 'Confirm Password',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    submit: 'Submit',
    privacyPolicy: 'Privacy Policy',
    hide: 'Hide',
    upcoming: 'Upcoming',
    past: 'Past',
    myBookings: 'My Bookings',
    noBookings: 'No bookings found',
    cancelBooking: 'Cancel Booking',
    confirmCancel: 'Are you sure you want to cancel this booking?',
    cancelSuccess: 'Booking cancelled successfully',
    cancelFailed: 'Failed to cancel booking'
  },
  home: {
    welcome: 'Welcome to Sandpiper Cleaning Services',
    tagline: 'Professional cleaning and washing services at your doorstep',
    viewServices: 'View Services',
    servicesTitle: 'Our Services',
    bookNow: 'Book Now',
    testimonialsTitle: 'What Our Customers Say',
    testimonialsPrev: 'Prev',
    testimonialsNext: 'Next',
    testimonialsGoTo: 'Go to testimonial {num}',
    loadingServices: 'Loading services...',
    errorLoadingServices: 'Error loading services',
    membersTitle: 'Membership Plans',
    membersViewDetails: 'View Details',
    membersIncludedBenefits: 'Included Benefits:',
    waterlessEcoFriendly: 'Eco-friendly wash option',
    // Banner translations
    banner1Title: 'Premium Cleaning Special',
    banner1Subtitle: 'Get 20% off premium cleaning services',
    banner1Cta: 'Book Now',
    banner2Title: 'New Customer Deal',
    banner2Subtitle: 'First cleaning service 40% off for new customers',
    banner2Cta: 'Get Deal',
    banner3Title: 'VIP Membership',
    banner3Subtitle: 'Unlimited cleanings with our VIP package',
    banner3Cta: 'Join Now',
    // Service name translations (for hardcoded services from backend)
    serviceCarWashing: 'Car Washing',
    serviceDeepCleaning: 'Deep Cleaning',
    serviceGardening: 'Gardening',
    serviceHouseCleaning: 'House Cleaning',
    // Testimonial section
    customerFeedback: 'What Our Customers Say'
  },
  booking: {
    assignWasher: 'Assign Washer',
    availableWashers: 'Available Washers',
    nearest: 'Nearest',
    available: 'Available',
    currentlyOnJob: 'Currently on a job',
    currentJob: 'Current job',
    requiredWashers: 'Select washers near the booking location. Required: {count} washers',
    requiredWasher: 'Select washers near the booking location. Required: 1 washer',
    kmAway: 'km away',
    eta: 'ETA',
    minutesUntilFree: 'until free',
    locationNotEnabled: 'Location not enabled - cannot assign'
  },
  washerStatus: {
    ASSIGNED: 'Assigned',
    CONFIRMED: 'Confirmed',
    ON_THE_WAY: 'On the way',
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
  },
  membership: {
    title: 'Membership Plans',
    subtitle: 'Choose a plan that works best for you',
    plans: { silver: 'Silver Plan', gold: 'Gold Plan', platinum: 'Platinum Plan' },
    selectDuration: 'Select Duration',
    months: { 1: '1 Month', 3: '3 Months', 6: '6 Months' },
    save: 'Save {percentage}%',
    bestValue: 'Best Value!',
    continue: 'Continue',
    total: 'Total',
    processing: 'Processing...',
    paymentSuccessful: 'Payment Successful!',
    viewProfile: 'View Profile',
    authenticationRequired: 'Authentication Required',
    actionFailed: 'Action Failed',
    tryAgain: 'Try Again',
    createAccount: 'Create Account',
    signIn: 'Sign In',
    perMonth: '/month',
    includedBenefits: 'Included Benefits:',
    benefits: {
      discountAll: '{percentage}% discount on ALL services',
      priorityBooking: 'Standard priority booking',
      freeCancellation: 'Free cancellation up to 4 hours',
      basicAccess: 'Basic service access',
      loyaltyMultiplier: 'Loyalty points multiplier ({x}x)',
      extendedCancellation: 'Free cancellation up to 2 hours',
      extendedAccess: 'Extended service access',
      complimentaryBasic: 'Complimentary basic add-ons',
      highestPriority: 'Highest priority booking',
      anytimeCancellation: 'Free cancellation anytime',
      premiumAccess: 'Premium service access',
      complimentaryPremium: 'Complimentary premium add-ons',
      quarterlyAssessments: 'Quarterly service assessments',
      earlyAccess: 'Early access to new services',
      personalAdvisor: 'Personal service advisor'
    }
  },
  profile: {
    title: 'My Profile',
    editProfile: 'Edit Profile',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    personalInfo: 'Personal Information',
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone Number',
    cnic: 'CNIC',
    serviceArea: 'Service Area',
    vehicleDetails: 'Vehicle Details',
    make: 'Make',
    model: 'Model',
    licensePlate: 'License Plate',
    addVehicle: 'Add Vehicle',
    membershipStatus: 'Membership Status',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    updatePassword: 'Update Password',
    support: 'Support',
    sendMessage: 'Send Message',
    logout: 'Logout',
    deleteAccount: 'Delete Account',
    loading: 'Loading...',
    uploadPhoto: 'Upload Photo',
    noFileSelected: 'No file selected',
    uploading: 'Uploading...',
    account: 'Account',
    security: 'Security',
    help: 'Help & Support',
    preferences: 'Preferences',
    notSet: 'Not set',
    active: 'Active',
    inactive: 'Inactive',
    premium: 'Premium',
    basic: 'Basic',
    // Additional keys used in profile page
    accountDetails: 'Account Details',
    membership: 'Membership',
    contactSupport: 'Contact Support',
    saveSuccess: 'Profile updated successfully!',
    saveFailed: 'Failed to update profile. Please try again.',
    saveError: 'An error occurred while saving your profile. Please try again.',
    mustLogin: 'You must be logged in to save changes',
    membershipCancelledSuccess: 'Membership cancelled successfully',
    membershipCancelledFailed: 'Failed to cancel membership. Please try again.',
    membershipUpdateFailed: 'Failed to update membership status. Please try again.',
    confirmCancelMembership: 'Are you sure you want to cancel your membership?',
    confirmDeleteAccount: 'Are you sure you want to delete your account? This action cannot be undone.',
    name: 'Full Name',
    phone: 'Phone Number',
    basicPlan: 'Basic Plan',
    membershipDetails: 'Membership Details',
    cancelMembership: 'Cancel Membership',
    selectPlanFirst: 'Please select a membership plan first',
    userNotAuthenticated: 'User not authenticated',
    loginRequired: 'Login Required',
    pleaseLoginToAccess: 'Please login to access your profile',
    accountDetails: 'Account Details',
    membership: 'Membership',
    contactSupport: 'Contact Support',
    saveSuccess: 'Profile updated successfully!',
    saveFailed: 'Failed to update profile. Please try again.',
    saveError: 'An error occurred while saving your profile. Please try again.',
    mustLogin: 'You must be logged in to save changes',
    membershipCancelledSuccess: 'Membership cancelled successfully',
    membershipCancelledFailed: 'Failed to cancel membership. Please try again.',
    membershipUpdateFailed: 'Failed to update membership status. Please try again.',
    selectPlanFirst: 'Please select a membership plan first',
    confirmCancelMembership: 'Are you sure you want to cancel your membership?',
    confirmDeleteAccount: 'Are you sure you want to delete your account? This action cannot be undone.',
    basicPlan: 'Basic Plan',
    membershipDetails: 'Membership Details',
    cancelMembership: 'Cancel Membership',
    benefits: 'Benefits',
    privacyPolicyText: 'By signing in, you agree to our <a href="/privacy" class="text-primary hover:underline">Privacy Policy</a>'
  },
  bookingPage: {
    title: 'Book a Service',
    selectServices: 'Select Services',
    selectVehicleType: 'Select Vehicle Type',
    vehicleTypes: { sedan: 'Sedan', suv: 'SUV', hatchback: 'Hatchback', bike: 'Bike' },
    next: 'Next',
    back: 'Back',
    continue: 'Continue',
    selectTimeSlot: 'Select Time Slot',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    bookNow: 'Book Now',
    serviceDetails: 'Service Details',
    description: 'Description',
    duration: 'Duration',
    minutes: 'minutes',
    price: 'Price',
    selectedServices: 'Selected Services',
    remove: 'Remove',
    clearAll: 'Clear All',
    yourLocation: 'Your Location',
    setLocation: 'Set Location',
    searchAddress: 'Search for an address',
    useCurrentLocation: 'Use current location',
    dropPin: 'Drop a pin on the map',
    confirmBooking: 'Confirm Booking',
    bookingSummary: 'Booking Summary',
    totalAmount: 'Total Amount',
    taxIncluded: 'Tax included',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card',
    confirmAndPay: 'Confirm and Pay',
    success: 'Booked successfully!',
    error: 'Failed to book service',
    retry: 'Retry'
  },
  booking: {
    bookService: 'Book a Service',
    selectLocation: 'Select Location',
    searchLocation: 'Search location...',
    selectedLocation: 'Selected Location',
    selectedService: 'Selected Service',
    selectService: 'Select Service',
    trackWasher: 'Track Washer',
    trackingYourWasher: 'Tracking your washer',
    pleaseSelectServices: 'Please select services first',
    urgentBooking: 'Urgent Booking'
  },
  checkout: {
    title: 'Checkout',
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    proceedToPayment: 'Proceed to Payment',
    payNow: 'Pay Now',
    paymentSuccess: 'Payment successful!',
    paymentFailed: 'Payment failed',
    processing: 'Processing payment...',
    backToProfile: 'Back to Profile',
    viewBookings: 'View My Bookings'
  },
  auth: {
    login: {
      title: 'Sign In',
      email: 'Email',
      password: 'Password',
      loginButton: 'Sign In',
      forgotPassword: 'Forgot Password?',
      noAccount: "Don't have an account?",
      registerHere: 'Register here',
      loggingIn: 'Signing in...',
      invalidCredentials: 'Invalid email or password',
      orContinueWith: 'Or continue with',
      signInWithGoogle: 'Sign in with Google',
      rememberMe: 'Remember me'
    },
    register: {
      title: 'Create Account',
      fullName: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      registerButton: 'Create Account',
      hasAccount: 'Already have an account?',
      loginHere: 'Sign in here',
      registering: 'Creating account...',
      emailExists: 'Email already registered',
      adminNote: 'Note: If you select Admin or Washer as your role, it will require admin approval before you can access those panels.',
      agreeTerms: 'I agree to the',
      termsLink: 'Terms of Service',
      privacyLink: 'Privacy Policy',
      and: 'and',
      orSignUp: 'Or sign up with'
    },
    forgotPassword: {
      title: 'Reset Password',
      subtitle: 'Enter your email to receive a password reset link',
      email: 'Email',
      sendResetLink: 'Send Reset Link',
      sending: 'Sending...',
      resetLinkSent: 'Password reset link sent to your email',
      backToLogin: 'Back to Sign In'
    },
    verifyEmail: {
      title: 'Verify Your Email',
      subtitle: 'A verification link has been sent to your email. Please verify to continue.',
      checkEmail: 'Check your email',
      verified: 'Email verified successfully!',
      verifying: 'Verifying...',
      error: 'Verification failed'
    }
  }
};

let globalMessages: { en: Translation; ar: Translation } = { en: fallbackMessages, ar: {} };

async function loadMessagesForLocale(locale: 'en' | 'ar'): Promise<Translation> {
  const res = await fetch(`/messages/${locale}.json`);
  if (!res.ok) throw new Error(`Failed to load ${locale} messages`);
  return res.json();
}

function getNestedValue(obj: any, keys: string[]): any {
  let value = obj;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  return value;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const getInitialLocale = (): 'en' | 'ar' => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('locale');
      if (saved === 'en' || saved === 'ar') return saved as 'en' | 'ar';
    }
    return 'en';
  };

  const [locale, setLocaleState] = useState<'en' | 'ar'>('en');
  const [messages, setMessages] = useState<Translation>(fallbackMessages);
  const [hasMounted, setHasMounted] = useState(false);

  const setLocale = (newLocale: 'en' | 'ar') => {
    console.log('[I18n] setLocale called:', newLocale, 'Current locale:', locale);
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    const savedLocale = getInitialLocale();
    if (savedLocale !== locale) {
      setLocaleState(savedLocale);
    }
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const loadMessages = async () => {
      if (locale === 'en') {
        setMessages(fallbackMessages);
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = 'en';
        return;
      }

      try {
        // Check if we have non-empty cached messages for Arabic
        let msgs = globalMessages[locale];
        if (!msgs || Object.keys(msgs).length === 0) {
          msgs = await loadMessagesForLocale(locale);
          globalMessages[locale] = msgs;
        }
        setMessages(msgs);
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
      } catch (err) {
        console.error('Failed to load messages for', locale, err);
        setMessages(fallbackMessages);
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = 'en';
      }
    };

    loadMessages();
  }, [locale, hasMounted]);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string>): string => {
      const keys = key.split('.');
      let value = getNestedValue(messages, keys);

      if (value === undefined || typeof value !== 'string') {
        value = getNestedValue(fallbackMessages, keys);
        if (value === undefined || typeof value !== 'string') {
          return key;
        }
      }

      if (params && typeof value === 'string') {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          value = value.replace(`{${paramKey}}`, paramValue);
        }
      }

      return value;
    };
  }, [messages]);

  // Server render: use English fallback to match initial client state
  if (!hasMounted) {
    return (
      <I18nContext.Provider value={{ locale: 'en', setLocale: () => {}, t: (key) => getNestedValue(fallbackMessages, key.split('.')) || key, isLoaded: false }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isLoaded: true }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return { locale: ctx.locale, setLocale: ctx.setLocale, t: ctx.t, isLoaded: ctx.isLoaded };
}
