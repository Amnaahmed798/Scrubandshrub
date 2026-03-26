'use client';

import { useState, useEffect } from 'react';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface MapComponentProps {
  onLocationSelect: (location: Location) => void;
  initialPosition?: { lat: number; lng: number };
  selectedPosition?: Location;
}

const IFrameMapComponent = ({
  onLocationSelect,
  initialPosition = { lat: 24.7136, lng: 46.6753 },
  selectedPosition
}: MapComponentProps) => {
  const [markerPosition, setMarkerPosition] = useState<Location | null>(selectedPosition || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedPosition) {
      setMarkerPosition(selectedPosition);
    }
  }, [selectedPosition]);

  // Handle map click to get coordinates and reverse geocode
  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isLoading) return; // Prevent multiple clicks while loading

    setIsLoading(true);

    try {
      let clientX, clientY;
      
      // Handle both mouse and touch events
      if ('touches' in e) {
        const touch = e.touches[0] || e.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      // Calculate the relative click position to determine the actual coordinates
      const rect = e.currentTarget.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Estimate the coordinates based on the click position and current view
      // This is an approximation based on the iframe map bounds
      const width = rect.width;
      const height = rect.height;

      // Calculate the longitude and latitude based on the click position
      const lngRange = 0.2; // 0.1 * 2 (the bbox range we're using)
      const latRange = 0.2;

      const clickedLng = initialPosition.lng - 0.1 + (x / width) * lngRange;
      const clickedLat = initialPosition.lat + 0.1 - (y / height) * latRange; // Y is inverted

      // Round to reasonable precision
      const lat = parseFloat(clickedLat.toFixed(6));
      const lng = parseFloat(clickedLng.toFixed(6));

      // Call the reverse geocoding API to get the location name
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(
        `${apiUrl}/api/v1/geocoding/reverse?lat=${lat}&lon=${lng}`
      );

      let address = `Selected Location: ${lat}, ${lng}`; // Default fallback

      if (response.ok) {
        const data = await response.json();
        address = data.display_name || address;
      } else {
        console.error('Reverse geocoding failed:', response.statusText);
      }

      const newLocation: Location = {
        lat,
        lng,
        address,
      };

      setMarkerPosition(newLocation);
      onLocationSelect(newLocation);
    } catch (error) {
      console.error('Error getting location from map click:', error);

      // Fallback to the center of the current view
      const fallbackLocation: Location = {
        lat: initialPosition.lat,
        lng: initialPosition.lng,
        address: `Selected Location: ${initialPosition.lat.toFixed(6)}, ${initialPosition.lng.toFixed(6)}`,
      };

      setMarkerPosition(fallbackLocation);
      onLocationSelect(fallbackLocation);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* Using an iframe to embed OpenStreetMap to avoid react-leaflet context issues */}
      <iframe
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${initialPosition.lng - 0.1}%2C${initialPosition.lat - 0.1}%2C${initialPosition.lng + 0.1}%2C${initialPosition.lat + 0.1}&amp;layer=mapnik`}
        className="w-full h-full border-0 pointer-events-none"
        title="OpenStreetMap"
        loading="lazy"
        style={{ pointerEvents: 'none' }}
      ></iframe>

      {/* Overlay for click handling */}
      <div
        className="absolute inset-0 cursor-crosshair"
        onClick={handleMapClick}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleMapClick(e);
        }}
        style={{ 
          zIndex: 1000,
          touchAction: 'none'
        }}
      ></div>

      {/* Loading indicator */}
      {isLoading && (
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-black bg-opacity-50 rounded-full p-3"
          style={{ zIndex: 1002 }}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      )}

      {/* Marker overlay - positioned where the user clicked */}
      {markerPosition && !isLoading && (
        <div
          className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg z-20"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001
          }}
        >
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-xs truncate">
            {markerPosition.address.split(',')[0]} {/* Show just the first part of the address */}
          </div>
        </div>
      )}
    </div>
  );
};

export default IFrameMapComponent;