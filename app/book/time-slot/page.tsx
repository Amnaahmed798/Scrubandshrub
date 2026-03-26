'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LayoutWrapper from '../../components/layout/layout-wrapper';
import Link from 'next/link';

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

// Define the location type
interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface SelectedServiceData {
  serviceSlug: string;
  serviceName: string;
  selectedServices: Service[];
  selectedVehicleType: VehicleType;
}

// Content component that uses useSearchParams
function TimeSlotPageContent() {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedServiceData, setSelectedServiceData] = useState<SelectedServiceData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Get service data and location from URL parameters (inherited from booking page)
  useEffect(() => {
    if (!searchParams) return;

    const selectedDataParam = searchParams.get('selectedData');
    const locationParam = searchParams.get('location');

    if (selectedDataParam) {
      try {
        const parsedData: SelectedServiceData = JSON.parse(decodeURIComponent(selectedDataParam));
        setSelectedServiceData(parsedData);
      } catch (error) {
        console.error('Error parsing selected data:', error);
      }
    }

    if (locationParam) {
      try {
        const parsedLocation: Location = JSON.parse(decodeURIComponent(locationParam));
        setSelectedLocation(parsedLocation);
      } catch (error) {
        console.error('Error parsing location data:', error);
      }
    }
  }, [searchParams]);

  // Generate available dates (next 30 days) - use local date to avoid timezone shift
  const generateAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      // Format as YYYY-MM-DD using local time (not UTC)
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  };

  // Generate time slots for a given date (9 AM to 7 PM)
  const generateTimeSlots = (date: string) => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 19;  // 7 PM

    // Generate slots in 1-hour intervals
    for (let hour = startHour; hour < endHour; hour++) {
      // Skip some random time slots to simulate availability
      const isAvailable = Math.random() > 0.3; // 70% chance of being available

      const timeString = hour < 12
        ? `${hour}:00 AM`
        : hour === 12
          ? `12:00 PM`
          : `${hour - 12}:00 PM`;

      const timeValue = hour < 12
        ? `${hour.toString().padStart(2, '0')}:00`
        : `${hour.toString().padStart(2, '0')}:00`;

      slots.push({
        time: timeString,
        value: timeValue,
        available: isAvailable
      });
    }
    return slots;
  };

  // Get time slots for selected date
  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  // Navigation for calendar months
  const prevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Get days for the current month view
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add days of the month - format as local date to avoid timezone shift
    for (let day = 1; day <= daysInMonth; day++) {
      const yearStr = year.toString();
      const monthStr = (month + 1).toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
      const isAvailable = generateAvailableDates().includes(dateStr);
      days.push({ day, date: dateStr, available: isAvailable });
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 pt-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 text-center">Select Time Slot</h1>

          {/* Calendar Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={prevMonth}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-primary">{monthName}</h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((dayInfo, index) => (
                <div key={index} className="aspect-square">
                  {dayInfo ? (
                    <button
                      className={`w-full h-full rounded-full flex items-center justify-center text-sm transition-colors duration-200 ${
                        dayInfo.available
                          ? selectedDate === dayInfo.date
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 border border-primary-200 hover:border-secondary hover:bg-secondary/20 hover:text-secondary'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={() => dayInfo.available && setSelectedDate(dayInfo.date)}
                      disabled={!dayInfo.available}
                    >
                      {dayInfo.day}
                    </button>
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-primary">Available Time Slots</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    className={`p-3 rounded-lg border transition-colors duration-200 ${
                      slot.available
                        ? selectedTime === slot.value
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-primary-200 hover:border-primary-400'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={() => slot.available && setSelectedTime(slot.value)}
                    disabled={!slot.available}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Button */}
          <div className="fixed bottom-4 left-4 right-4">
            <Link
              href={selectedServiceData && selectedLocation ?
                `/book/checkout?selectedData=${encodeURIComponent(JSON.stringify(selectedServiceData))}&date=${selectedDate}&time=${selectedTime}&location=${encodeURIComponent(JSON.stringify(selectedLocation))}` :
                "/book/checkout"
              }
              className="block"
            >
              <button
                className={`w-full py-4 px-4 rounded-xl font-bold text-lg ${
                  selectedDate && selectedTime
                    ? 'bg-primary text-white hover:bg-secondary hover:text-primary active:bg-secondary active:text-primary transition-colors duration-200'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!selectedDate || !selectedTime}
              >
                Proceed to Checkout
              </button>
            </Link>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}

export default function TimeSlotPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading time slots...</p>
        </div>
      </div>
    }>
      <TimeSlotPageContent />
    </Suspense>
  );
}
