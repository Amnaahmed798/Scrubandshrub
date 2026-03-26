'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LayoutWrapper from '../../components/layout/layout-wrapper';
import Link from 'next/link';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUser, FaCreditCard, FaCheck, FaHome, FaCar, FaLeaf, FaTint, FaBroom, FaWrench, FaSoap, FaShower, FaChair, FaCouch, FaTachometerAlt, FaSnowflake, FaShieldAlt, FaCarSide, FaWater, FaTools } from 'react-icons/fa';

// Define vehicle type
type VehicleType = 'sedan' | 'suv' | 'hatchback' | 'bike';

// Define service type
interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  isSelected: boolean;
}

interface SelectedServiceData {
  serviceSlug: string;
  serviceName: string;
  serviceImage?: string; // Add service image property
  selectedServices: Service[];
  selectedVehicleType: VehicleType;
}

// Loading fallback component
function CheckoutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading checkout...</p>
      </div>
    </div>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedServiceData, setSelectedServiceData] = useState<SelectedServiceData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('credit-card');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<number>(1); // Default to 1 member team
  const [isUrgentBooking, setIsUrgentBooking] = useState<boolean>(false);

  // Get service data from URL parameters
  useEffect(() => {
    if (!searchParams) return; // ✅ Guard against null

    const selectedDataParam = searchParams.get('selectedData');
    const dateParam = searchParams.get('date');
    const timeParam = searchParams.get('time');
    const locationParam = searchParams.get('location');
    const urgentParam = searchParams.get('urgent');

    if (selectedDataParam) {
      try {
        const parsedData: SelectedServiceData = JSON.parse(decodeURIComponent(selectedDataParam));
        setSelectedServiceData(parsedData);
      } catch (error) {
        console.error('Error parsing selected data:', error);
      }
    }

    if (dateParam) setSelectedDate(dateParam);
    if (timeParam) setSelectedTime(timeParam);

    if (locationParam) {
      try {
        // Try to parse as JSON first (for location object), otherwise use as string
        const parsedLocation = JSON.parse(decodeURIComponent(locationParam));
        setLocation(parsedLocation.address || '');
      } catch (error) {
        // If parsing fails, use as a plain string
        setLocation(decodeURIComponent(locationParam));
      }
    }

    // Check if this is an urgent booking
    if (urgentParam === 'true') {
      setIsUrgentBooking(true);
    }
  }, [searchParams]);

  // Check authentication and fetch user profile when page loads
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      try {
        // Check if there are saved booking details to restore
        const savedBookingDetails = localStorage.getItem('booking_details');
        if (savedBookingDetails) {
          try {
            const details = JSON.parse(savedBookingDetails);

            // Restore all the booking details
            if (details.selectedServiceData) setSelectedServiceData(details.selectedServiceData);
            if (details.selectedDate) setSelectedDate(details.selectedDate);
            if (details.selectedTime) setSelectedTime(details.selectedTime);
            if (details.location) setLocation(details.location);
            if (details.customerName) setCustomerName(details.customerName);
            if (details.customerPhone) setCustomerPhone(details.customerPhone);
            if (details.customerEmail) setCustomerEmail(details.customerEmail);
            if (details.paymentMethod) setPaymentMethod(details.paymentMethod);
            if (details.cardNumber) setCardNumber(details.cardNumber);
            if (details.cardExpiry) setCardExpiry(details.cardExpiry);
            if (details.cardCvv) setCardCvv(details.cardCvv);
            if (details.cardName) setCardName(details.cardName);
            if (details.specialInstructions) setSpecialInstructions(details.specialInstructions);
            if (details.teamSize !== undefined) setTeamSize(details.teamSize);
            if (details.isUrgentBooking) setIsUrgentBooking(details.isUrgentBooking);
            if (details.urgentSurcharge) {
              // This will be recalculated anyway based on isUrgentBooking, but we restore for completeness
            }

            // Clear the saved booking details after restoring
            localStorage.removeItem('booking_details');
          } catch (parseError) {
            console.error('Error parsing saved booking details:', parseError);
          }
        }

        const token = localStorage.getItem('access_token');
        if (token) {
          // Fetch user profile from the backend
          const response = await fetch('/api/v1/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();
            // Populate customer fields with user profile data if not already set
            if (!customerName) setCustomerName(userData.full_name || userData.name || '');
            if (!customerEmail) setCustomerEmail(userData.email || '');
            if (!customerPhone) setCustomerPhone(userData.phone_number || '');
            // Store user ID for use in booking requests
            if (userData.id) {
              setUserId(userData.id);
            }
          } else {
            // Token exists but profile fetch failed - user might not be properly authenticated
            console.warn('Token exists but could not fetch profile:', response.status);
          }
        }
      } catch (error) {
        console.error('Error checking authentication or fetching profile:', error);
      }
    };

    checkAuthAndFetchProfile();
  }, []); // Empty dependency array to run only once when component mounts


  // Calculate total based on selected services and team size
  const calculateTotal = () => {
    if (!selectedServiceData || !selectedServiceData.selectedServices) return 0;
    // Base price from services
    let basePrice = selectedServiceData.selectedServices.length * 50; // $50 per service

    // Calculate multiplier based on team size
    let multiplier = 1.0;
    if (teamSize === 2) {
      multiplier = 1.3; // 30% increase for 2 members
    } else if (teamSize === 3) {
      multiplier = 1.6; // 60% increase for 3 members
    } else if (teamSize === 4) {
      multiplier = 1.9; // 90% increase for 4 members
    } else if (teamSize === 5) {
      multiplier = 2.2; // 120% increase for 5 members
    } else if (teamSize === 6) {
      multiplier = 2.5; // 150% increase for 6 members
    } else if (teamSize === 7) {
      multiplier = 2.8; // 180% increase for 7 members
    } else if (teamSize === 8) {
      multiplier = 3.1; // 210% increase for 8 members
    } else if (teamSize === 9) {
      multiplier = 3.4; // 240% increase for 9 members
    } else if (teamSize === 10) {
      multiplier = 3.7; // 270% increase for 10 members
    } else if (teamSize === 11) {
      multiplier = 4.0; // 300% increase for 11 members
    } else if (teamSize === 12) {
      multiplier = 4.3; // 330% increase for 12 members
    }

    return basePrice * multiplier;
  };

  // Function to determine service complexity based on service name
  const getServiceComplexity = (serviceName: string, serviceSlug: string) => {
    // Convert to lowercase for easier matching
    const name = serviceName.toLowerCase();
    const slug = serviceSlug.toLowerCase();

    // Check for high complexity services
    if (name.includes('detailing') || name.includes('detail') ||
        name.includes('correction') || name.includes('restoration') ||
        name.includes('ceramic') || name.includes('coating') ||
        name.includes('engine') || name.includes('paint') ||
        slug.includes('detailing') || slug.includes('correction') ||
        slug.includes('restoration') || slug.includes('ceramic') ||
        slug.includes('coating') || slug.includes('engine') ||
        slug.includes('paint')) {
      return 3; // High complexity
    }

    // Check for medium complexity services
    if (name.includes('interior') || name.includes('exterior') ||
        name.includes('wax') || name.includes('polish') ||
        name.includes('conditioning') || name.includes('shampoo') ||
        name.includes('treatment') || name.includes('scratch') ||
        slug.includes('interior') || slug.includes('exterior') ||
        slug.includes('wax') || slug.includes('polish') ||
        slug.includes('conditioning') || slug.includes('shampoo') ||
        slug.includes('treatment') || slug.includes('scratch')) {
      return 2; // Medium complexity
    }

    // Default to low complexity for basic services
    return 1; // Low complexity
  };

  // Function to check if selected services are valid for the team size
  const isTeamSizeValidForServices = () => {
    if (!selectedServiceData || !selectedServiceData.selectedServices) return true;

    // Calculate total complexity based on selected services
    const totalComplexity = selectedServiceData.selectedServices.reduce((sum, service) => {
      return sum + getServiceComplexity(service.name, service.slug);
    }, 0);

    // Define maximum complexity allowed per team size
    // Larger teams can handle more complex jobs
    const maxComplexityPerTeamSize: Record<number, number> = {
      1: 3,    // 1 member can handle up to complexity 3
      2: 6,    // 2 members can handle up to complexity 6
      3: 10,   // 3 members can handle up to complexity 10
      4: 15,   // 4 members can handle up to complexity 15
      5: 21,   // 5 members can handle up to complexity 21
      6: 28,   // 6 members can handle up to complexity 28
      7: 36,   // 7 members can handle up to complexity 36
      8: 45,   // 8 members can handle up to complexity 45
      9: 55,   // 9 members can handle up to complexity 55
      10: 66,  // 10 members can handle up to complexity 66
      11: 78,  // 11 members can handle up to complexity 78
      12: 91,  // 12 members can handle up to complexity 91
    };

    const maxAllowedComplexity = maxComplexityPerTeamSize[teamSize] || 3;

    return totalComplexity <= maxAllowedComplexity;
  };

  const baseTotal = calculateTotal();
  const URGENT_SURCHARGE_RATE = 0.20; // 20% surcharge for urgent bookings
  const urgentSurcharge = isUrgentBooking ? baseTotal * URGENT_SURCHARGE_RATE : 0;
  const subtotal = baseTotal + urgentSurcharge;
  const taxAmount = subtotal * 0.05;
  const totalAmount = subtotal + taxAmount;

  // Function to get price multiplier display
  const getTeamPriceMultiplier = (size: number) => {
    let multiplier = 1.0;
    if (size === 2) {
      multiplier = 1.3;
    } else if (size === 3) {
      multiplier = 1.6;
    } else if (size === 4) {
      multiplier = 1.9;
    } else if (size === 5) {
      multiplier = 2.2;
    } else if (size === 6) {
      multiplier = 2.5;
    } else if (size === 7) {
      multiplier = 2.8;
    } else if (size === 8) {
      multiplier = 3.1;
    } else if (size === 9) {
      multiplier = 3.4;
    } else if (size === 10) {
      multiplier = 3.7;
    } else if (size === 11) {
      multiplier = 4.0;
    } else if (size === 12) {
      multiplier = 4.3;
    }

    const percentage = Math.round((multiplier - 1) * 100);
    return percentage > 0 ? `(+${percentage}%)` : '';
  };

  // Function to get service image based on main service category
  const getServiceImage = () => {
    if (!selectedServiceData || !selectedServiceData.serviceImage) {
      // Fallback to icon if no service image available
      if (!selectedServiceData || !selectedServiceData.serviceSlug) {
        return <FaCar className="text-white text-2xl" />;
      }

      const serviceSlug = selectedServiceData.serviceSlug.toLowerCase();

      // Determine icon based on main service category (slug)
      if (serviceSlug.includes('car-wash') || serviceSlug.includes('car')) {
        return <FaCar className="text-white text-2xl" />;
      } else if (serviceSlug.includes('deep')) {
        return <FaBroom className="text-white text-2xl" />;
      } else if (serviceSlug.includes('garden')) {
        return <FaLeaf className="text-white text-2xl" />;
      } else if (serviceSlug.includes('house') || serviceSlug.includes('cleaning')) {
        return <FaHome className="text-white text-2xl" />;
      } else if (serviceSlug.includes('window')) {
        return <FaTint className="text-white text-2xl" />;
      } else if (serviceSlug.includes('waterless')) {
        return <FaSoap className="text-white text-2xl" />;
      } else {
        // Default to car icon for other services
        return <FaCar className="text-white text-2xl" />;
      }
    }

    // Use the service image from the selected service data with fallback to icon
    return (
      <img
        src={selectedServiceData.serviceImage}
        alt={selectedServiceData.serviceName || 'Service Logo'}
        className="w-full h-full object-cover rounded-full"
        onError={(e) => {
          // Replace with a fallback icon if image fails to load
          const target = e.target as HTMLImageElement;
          target.onerror = null; // Prevent infinite loop
          target.style.display = 'none';

          // Create and append fallback icon
          const parent = target.parentNode as HTMLElement;
          if (parent) {
            const iconDiv = document.createElement('div');
            iconDiv.className = 'w-full h-full flex items-center justify-center';
            iconDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="text-white text-2xl" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
            parent.appendChild(iconDiv);
          }
        }}
      />
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in by verifying the access token exists
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      // Save booking details to localStorage before redirecting to login
      const bookingDetails = {
        selectedServiceData,
        selectedDate,
        selectedTime,
        location,
        customerName,
        customerPhone,
        customerEmail,
        paymentMethod,
        cardNumber,
        cardExpiry,
        cardCvv,
        cardName,
        specialInstructions,
        teamSize,
        isUrgentBooking,
        urgentSurcharge,
      };
      localStorage.setItem('booking_details', JSON.stringify(bookingDetails));

      setShowLoginPrompt(true);
      setErrorMessage('Please log in to your account to complete the booking.');
      return;
    }

    setIsProcessing(true);

    try {

      // Prepare booking data
      const bookingData = {
        customer_id: userId || '00000000-0000-0000-0000-000000000000', // Use actual user ID if available, otherwise placeholder (will be overridden by backend)
        team_size: teamSize, // Include team size requested
        service_type: selectedServiceData?.serviceName || 'Service',
        vehicle_type: selectedServiceData?.selectedVehicleType || 'sedan',
        booking_date: selectedDate,
        booking_time: selectedTime,
        location,
        total_amount: totalAmount * 1.05, // Including tax
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        special_instructions: specialInstructions + (isUrgentBooking ? '\n\n[URGENT BOOKING - Priority service requested]' : ''),
        selected_services: selectedServiceData?.selectedServices || [],
        is_urgent: isUrgentBooking,
        urgent_surcharge: urgentSurcharge,
      };

      // Call the backend API to create the booking
      const response = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.error('API Error Response:', errorData);

          // Check if it's an authentication error (401 or 403), but treat 422 as validation error
          if (response.status === 401 || response.status === 403) {
            setShowLoginPrompt(true);
            setErrorMessage('Please log in to your account to complete the booking.');
            return;
          } else if (response.status === 422) {
            // 422 is typically a validation error, not necessarily authentication
            console.error('Validation error from API:', errorData);
            // Check if it's specifically related to customer authentication
            if (errorData.detail && typeof errorData.detail === 'string' &&
                (errorData.detail.toLowerCase().includes('customer') ||
                 errorData.detail.toLowerCase().includes('authentication'))) {
              setShowLoginPrompt(true);
              setErrorMessage('Please log in to your account to complete the booking.');
              return;
            } else {
              // It's a validation error, not an authentication error
              throw new Error(errorData.detail || 'Validation error: ' + JSON.stringify(errorData));
            }
          }

          // Check if the error contains customer_id related information
          if (errorData.detail && typeof errorData.detail === 'string' && errorData.detail.toLowerCase().includes('customer_id')) {
            setShowLoginPrompt(true);
            setErrorMessage('Please log in to your account to complete the booking.');
            return;
          }

          throw new Error(errorData.detail || 'Failed to create booking');
        } catch (parseError) {
          // If JSON parsing fails, it might be a network or server error
          console.error('Error parsing response:', parseError);

          // Check for common authentication-related status codes (401, 403)
          if (response.status === 401 || response.status === 403) {
            setShowLoginPrompt(true);
            setErrorMessage('Please log in to your account to complete the booking.');
            return;
          } else if (response.status === 422) {
            // 422 is typically a validation error, log it for debugging
            console.error('Non-JSON 422 validation error from API:', response);
            // For now, don't treat it as authentication error, let it continue to generic error
          }

          throw new Error('Failed to create booking due to a server error');
        }
      }

      const result = await response.json();
      console.log('Booking created successfully:', result);

      // Show success message
      setBookingSuccess(true);
    } catch (error) {
      console.error('Error submitting booking:', error);

      // Only show login prompt for authentication-related errors
      // If it's a network error or other error, don't show login prompt
      if (error instanceof Error) {
        if (error.message.includes('customer_id')) {
          // Foreign key violation related to authentication
          setShowLoginPrompt(true);
          setErrorMessage('Please log in to your account to complete the booking.');
        } else {
          // For other errors, don't show login prompt - this might be a network or server issue
          // Just show the error in console for debugging
          console.error('Non-authentication error occurred:', error.message);
          // We'll still show the generic error for now, but with better messaging
          setShowLoginPrompt(true);
          setErrorMessage('An error occurred while processing your booking. Please try again.');
        }
      } else {
        // For other types of errors
        setShowLoginPrompt(true);
        setErrorMessage('An error occurred while processing your booking. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (bookingSuccess) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 pt-4 flex items-center justify-center">
          <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheck className="text-primary text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Your {selectedServiceData?.serviceName || 'service'} has been scheduled for {selectedDate} at {selectedTime}.
            </p>
            <Link href="/" className="inline-block bg-primary text-white py-3 px-6 rounded-xl font-bold hover:bg-secondary hover:text-primary transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaUser className="text-primary text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'Please log in to your account to complete the booking.'}
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block bg-primary text-white py-3 px-6 rounded-xl font-bold hover:bg-secondary hover:text-primary transition-colors"
                onClick={() => setShowLoginPrompt(false)}
              >
                Login to Account
              </Link>
              <Link
                href="/register"
                className="block bg-white text-primary py-3 px-6 rounded-xl font-bold border border-primary hover:bg-secondary hover:text-secondary transition-colors"
                onClick={() => setShowLoginPrompt(false)}
              >
                Create New Account
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 pt-4">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Booking</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Booking Summary</h2>

                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mr-3 overflow-hidden">
                    {getServiceImage()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedServiceData?.serviceName || 'Service'}</h3>
                    <p className="text-sm text-gray-600">Vehicle: {selectedServiceData?.selectedVehicleType || 'N/A'}</p>
                  </div>
                </div>

                {selectedServiceData?.selectedServices && selectedServiceData.selectedServices.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Selected Services:</h4>
                    <ul className="space-y-1">
                      {selectedServiceData.selectedServices.map((service, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-center">
                          <FaCheck className="text-primary text-xs mr-2" />
                          {service.name}
                        </li>
                      ))}
                    </ul>

                    {/* Complexity indicator */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600">
                        <span>Service Complexity: {selectedServiceData.selectedServices.reduce((sum, service) => {
                          return sum + getServiceComplexity(service.name, service.slug);
                        }, 0)}</span>
                        <span className="ml-2">|</span>
                        <span className={`ml-2 ${isTeamSizeValidForServices() ? 'text-green-600' : 'text-red-600'}`}>
                          {isTeamSizeValidForServices() ? 'Team size sufficient' : 'Team size too small'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Base Services:</span>
                    <span className="font-medium">${baseTotal.toFixed(2)}</span>
                  </div>

                  {isUrgentBooking && (
                    <div className="flex justify-between mb-2 text-amber-600">
                      <span className="font-medium">Urgent Booking Surcharge (20%):</span>
                      <span className="font-medium">+${urgentSurcharge.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Tax (5%):</span>
                    <span className="font-medium">${((baseTotal + urgentSurcharge) * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-3 pt-3 border-t border-gray-200">
                    <span>Total:</span>
                    <span className={isUrgentBooking ? 'text-amber-600' : ''}>
                      ${(baseTotal + urgentSurcharge + ((baseTotal + urgentSurcharge) * 0.05)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Urgent Booking Badge */}
                {isUrgentBooking && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-amber-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Urgent Booking</p>
                        <p className="text-xs text-amber-700">Priority service with 20% surcharge</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mt-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Service Details</h2>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <FaCalendar className="text-primary mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium">{selectedDate || 'Not selected'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <FaClock className="text-primary mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-medium">{selectedTime || 'Not selected'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <FaMapMarkerAlt className="text-primary mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{location || 'Not selected'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Customer Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Any special instructions for the service..."
                    rows={3}
                  />
                </div>

                {/* Team Size Selection */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">Team Size</h2>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Number of Team Members</label>
                    <select
                      value={teamSize}
                      onChange={(e) => setTeamSize(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(size => (
                        <option key={size} value={size}>
                          {size} Member{size > 1 ? 's' : ''} {getTeamPriceMultiplier(size)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Team Capacity Information - Hidden from frontend, processed in backend */}
                  {/* This logic is kept for backend validation purposes only */}

                  <p className="mt-2 text-sm text-gray-500">Choose the size of your service team</p>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">Payment Method</h2>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="credit-card"
                        name="paymentMethod"
                        value="credit-card"
                        checked={paymentMethod === 'credit-card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                      />
                      <label htmlFor="credit-card" className="ml-3 flex items-center">
                        <FaCreditCard className="text-gray-500 mr-2" />
                        <span className="text-gray-700">Credit/Debit Card</span>
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="cash"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                      />
                      <label htmlFor="cash" className="ml-3 flex items-center">
                        <span className="text-gray-700">Cash on Service</span>
                      </label>
                    </div>
                  </div>

                  {paymentMethod === 'credit-card' && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="MM/YY"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                          <input
                            type="text"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="123"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl border-2 border-primary/20 mb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Subtotal:</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Tax (5%):</span>
                      <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-primary/20">
                      <span>Total Amount:</span>
                      <span className="text-lg text-primary">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !isTeamSizeValidForServices()}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-colors ${
                    isProcessing || !isTeamSizeValidForServices()
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : isUrgentBooking
                        ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
                        : 'bg-primary text-white hover:bg-secondary hover:text-primary'
                  }`}
                >
                  {isProcessing
                    ? 'Processing...'
                    : !isTeamSizeValidForServices()
                      ? `Team Too Small! Increase team size for selected services`
                      : isUrgentBooking
                        ? `Confirm Urgent Booking`
                        : `Confirm Booking`
                  }
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  By confirming this booking, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}

// Wrap the component in Suspense for useSearchParams
export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}