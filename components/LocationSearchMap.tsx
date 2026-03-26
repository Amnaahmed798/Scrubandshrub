import ClientOnlyMap from './ClientOnlyMap';

interface LocationSearchMapProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialPosition?: { lat: number; lng: number };
  selectedPosition?: { lat: number; lng: number; address: string };
}

const LocationSearchMap = (props: LocationSearchMapProps) => {
  return <ClientOnlyMap {...props} />;
};

export default LocationSearchMap;
