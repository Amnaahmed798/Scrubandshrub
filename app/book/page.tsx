'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaCar, FaTint, FaBroom, FaLeaf, FaHome, FaWrench, FaMagic, FaSoap, FaShower, FaChair, FaCouch, FaTachometerAlt, FaSnowflake, FaShieldAlt, FaCarSide, FaWater, FaTools, FaCalendarAlt, FaClock, FaTimes } from 'react-icons/fa';
import LayoutWrapper from '../components/layout/layout-wrapper';
import dynamicImport from 'next/dynamic';
import { useI18n } from '@/lib/i18n';

import LocationSearchMap from '@/components/LocationSearchMap';

const BookingTrackingMap = dynamicImport(
  () => import('@/components/admin/BookingTrackingMap'),
  { ssr: false, loading: () => <div className="h-full bg-gray-100 animate-pulse"></div> }
);

// Define the location type
interface Location {
  lat: number;
  lng: number;
  address: string;
}

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
  serviceImage?: string;
  selectedServices: Service[];
  selectedVehicleType: VehicleType;
}

// Content component that uses useSearchParams
function BookPageContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('sedan');
  const [selectedServiceData, setSelectedServiceData] = useState<SelectedServiceData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUrgentBookingModal, setShowUrgentBookingModal] = useState(false);
  const [urgentDate, setUrgentDate] = useState('');
  const [urgentTime, setUrgentTime] = useState('');
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);

  // Check for trackingBookingId in URL params
  useEffect(() => {
    if (!searchParams) return;

    const bookingId = searchParams.get('trackingBookingId');
    if (bookingId) {
      setTrackingBookingId(bookingId);
    }
  }, [searchParams]);

  // Get service data from URL parameters (including regeneration)
  useEffect(() => {
    if (!searchParams) return;

    // Check for regeneration parameter first
    const regenerateParam = searchParams.get('regenerate');
    if (regenerateParam) {
      try {
        const bookingDetails = JSON.parse(decodeURIComponent(regenerateParam));

        // Create selected service data from booking details for regeneration
        const regeneratedData: SelectedServiceData = {
          serviceSlug: bookingDetails.service_type.toLowerCase().replace(/\s+/g, '-'),
          serviceName: bookingDetails.service_type,
          selectedServices: bookingDetails.selected_services || [],
          selectedVehicleType: bookingDetails.vehicle_type || 'sedan',
        };

        setSelectedServiceData(regeneratedData);
        setSelectedVehicle(bookingDetails.vehicle_type || 'sedan');
      } catch (error) {
        console.error('Error parsing regeneration data:', error);
      }
      return;
    }

    // Check for regular selected data parameter
    const selectedDataParam = searchParams.get('selectedData');
    if (selectedDataParam) {
      try {
        const parsedData: SelectedServiceData = JSON.parse(decodeURIComponent(selectedDataParam));
        setSelectedServiceData(parsedData);
        setSelectedVehicle(parsedData.selectedVehicleType || 'sedan');
      } catch (error) {
        console.error('Error parsing selected data:', error);
      }
    }
  }, [searchParams]);

  // Rest of the component logic remains the same until the return statement...
  // Function to get service image based on main service category
  const getServiceImage = () => {
    if (!selectedServiceData || !selectedServiceData.serviceImage) {
      return <FaCalendarAlt className="text-white text-2xl" />;
    }

    return (
      <img
        src={selectedServiceData.serviceImage}
        alt={selectedServiceData.serviceName || 'Service Logo'}
        className="w-full h-full object-cover rounded-full"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.style.display = 'none';

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

  // Function to get main service category name to display
  const getServiceName = () => {
    if (!selectedServiceData || !selectedServiceData.serviceName) {
      return t('booking.selectService');
    }

    return selectedServiceData.serviceName;
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  // Handle search input changes
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.length > 2) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const response = await fetch(
          `${apiUrl}/api/v1/geocoding/search?q=${encodeURIComponent(value)}&limit=5&countrycodes=SA`
        );

        if (!response.ok) {
          throw new Error(`Geocoding API error: ${response.status}`);
        }

        const data = await response.json();
        const saResults = data.results || [];

        setSuggestions(saResults);
        setShowSuggestions(saResults.length > 0);
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    const location = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      address: suggestion.display_name,
    };

    setSelectedLocation(location);
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    handleLocationSelect(location);
  };

  return (
    <LayoutWrapper>
      <div className="relative min-h-screen bg-background pt-4">
        {/* Map in background */}
        <div className="absolute inset-0 z-0">
          {trackingBookingId ? (
            <BookingTrackingMap bookingId={trackingBookingId} />
          ) : (
            <LocationSearchMap
              onLocationSelect={handleLocationSelect}
              initialPosition={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : undefined}
              selectedPosition={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng, address: selectedLocation.address } : undefined}
            />
          )}
        </div>

        {/* Content overlay */}
        <div className="relative z-10 container mx-auto px-4 pb-0">
          {trackingBookingId && (
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span className="text-xs sm:text-sm font-medium text-green-700">{t('booking.trackingYourWasher')}</span>
              </div>
              <button
                onClick={() => setTrackingBookingId(null)}
                className="text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm"
              >
                {t('common.close')}
              </button>
            </div>
          )}

          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-black drop-shadow-lg">
            {trackingBookingId ? t('booking.trackWasher') : t('booking.bookService')}
          </h1>

          {/* Location Selection - Search bar at top */}
          {!trackingBookingId && (
          <div className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-black drop-shadow-lg">{t('booking.selectLocation')}</h2>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={t('booking.searchLocation')}
                className="w-full p-2.5 sm:p-3 pl-3.5 sm:pl-4 pr-10 sm:pr-12 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                onClick={() => searchQuery.length > 2 && setShowSuggestions(true)}
              />
              <div className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-2.5 sm:p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-xs sm:text-sm"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      {suggestion.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedLocation && (
              <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-white bg-opacity-90 rounded-lg border border-gray-200">
                <p className="text-xs sm:text-sm text-gray-700">
                  <span className="font-medium">{t('booking.selectedLocation')}:</span> {selectedLocation.address}
                </p>
              </div>
            )}
          </div>
          )}

          {/* Card with service logo, service name, and time slot button */}
          {!trackingBookingId && (
          <div className="fixed bottom-16 left-2 right-2 sm:left-4 sm:right-4 z-40 bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex flex-col items-center">
              {/* Rounded service logo */}
              <Link href={selectedServiceData ? `/services/${selectedServiceData.serviceSlug}` : "/"} className="mb-2">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-teal-700 transition-colors overflow-hidden">
                  {getServiceImage()}
                </div>
              </Link>

              {/* Selected service name */}
              <div className="text-center mb-2">
                <p className="text-xs text-gray-600">{t('booking.selectedService')}</p>
                <p className="font-semibold text-sm text-gray-900 capitalize">{getServiceName()}</p>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2">
                {/* View Time Slot button */}
                <button
                  onClick={() => {
                    if (!selectedLocation) {
                      alert('Please select a location first before viewing time slots.');
                      return;
                    }
                    if (!selectedServiceData) {
                      const errorMessage = document.getElementById('service-selection-error');
                      if (errorMessage) {
                        errorMessage.classList.remove('hidden');
                        setTimeout(() => {
                          errorMessage.classList.add('hidden');
                        }, 5000);
                      }
                      return;
                    }
                    if (selectedServiceData && selectedLocation) {
                      const url = `/book/time-slot?selectedData=${encodeURIComponent(JSON.stringify(selectedServiceData))}&location=${encodeURIComponent(JSON.stringify(selectedLocation))}`;
                      router.push(url);
                    }
                  }}
                  disabled={!selectedLocation}
                  className={`w-full py-2 px-3 rounded-lg font-bold text-sm transition-colors ${
                    selectedLocation
                      ? 'bg-[#FCD34D] text-[#3B7C87] hover:bg-[#3B7C87] hover:text-[#FCD34D] active:bg-[#3B7C87] active:text-[#FCD34D] cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  View Time Slot
                </button>

                {/* Urgent Booking button */}
                <button
                  onClick={() => {
                    if (!selectedLocation) {
                      alert('Please select a location first.');
                      return;
                    }
                    if (!selectedServiceData) {
                      const errorMessage = document.getElementById('service-selection-error');
                      if (errorMessage) {
                        errorMessage.classList.remove('hidden');
                        setTimeout(() => {
                          errorMessage.classList.add('hidden');
                        }, 5000);
                      }
                      return;
                    }
                    setShowUrgentBookingModal(true);
                  }}
                  disabled={!selectedLocation}
                  className={`w-full py-2 px-3 rounded-lg font-bold text-sm transition-colors ${
                    selectedLocation
                      ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FaClock className="inline-block mr-1" />
                  Urgent Booking
                </button>

                {/* Beautiful error message with arrow */}
                <div id="service-selection-error" className="hidden mt-2">
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-lg relative">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 mr-2 mt-0.5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs font-medium">{t('booking.pleaseSelectServices')}</p>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 rotate-45 bg-red-500 w-3 h-3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Urgent Booking Modal */}
      {showUrgentBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{t('booking.urgentBooking')}</h2>
              <button
                onClick={() => {
                  setShowUrgentBookingModal(false);
                  setUrgentDate('');
                  setUrgentTime('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Enter your preferred date and time for immediate booking. We'll try to accommodate your request.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaCalendarAlt className="inline-block mr-2" />
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={urgentDate}
                    onChange={(e) => setUrgentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaClock className="inline-block mr-2" />
                    Select Time
                  </label>
                  <input
                    type="time"
                    value={urgentTime}
                    onChange={(e) => setUrgentTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (!urgentDate || !urgentTime) {
                    alert('Please select both date and time');
                    return;
                  }

                  setShowUrgentBookingModal(false);

                  // Navigate to checkout with the urgent date and time
                  const url = `/book/checkout?selectedData=${encodeURIComponent(JSON.stringify(selectedServiceData))}&date=${urgentDate}&time=${urgentTime}&location=${encodeURIComponent(JSON.stringify(selectedLocation))}&urgent=true`;
                  router.push(url);
                }}
                className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-bold hover:bg-secondary hover:text-primary transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              This will skip the time slot selection and proceed directly to checkout with your chosen date and time.
            </p>
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking page...</p>
        </div>
      </div>
    }>
      <BookPageContent />
    </Suspense>
  );
}
