'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components individually to avoid context issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons for Leaflet v1.9+
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

const WorkingMapComponent = ({
  onLocationSelect,
  initialPosition = { lat: 24.7136, lng: 46.6753 },
  selectedPosition
}: MapComponentProps) => {
  const [markerPosition, setMarkerPosition] = useState<Location | null>(selectedPosition || null);
  const mapRef = useRef<any>(null);

  // Update marker when selectedPosition changes
  useEffect(() => {
    if (selectedPosition) {
      setMarkerPosition(selectedPosition);
    }
  }, [selectedPosition]);

  // Custom red marker
  const customIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Handle map click using a separate approach to avoid nested context issues
  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current) {
      const map = mapRef.current.leafletElement || mapRef.current;

      const handleClick = (e: any) => {
        const newLocation: Location = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          address: `Selected Location: ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`,
        };
        setMarkerPosition(newLocation);
        onLocationSelect(newLocation);
      };

      map.on('click', handleClick);

      return () => {
        map.off('click', handleClick);
      };
    }
  }, [onLocationSelect]);

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[initialPosition.lat, initialPosition.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        maxBounds={[
          [16.0, 34.5], // SW Saudi Arabia
          [32.2, 55.7], // NE Saudi Arabia
        ]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {markerPosition && (
          <Marker position={[markerPosition.lat, markerPosition.lng]} icon={customIcon}>
            <Popup>
              {markerPosition.address}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default WorkingMapComponent;