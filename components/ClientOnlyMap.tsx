'use client';

import dynamic from 'next/dynamic';

// Enhanced dynamic import with error handling - using iframe map component to avoid context issues
const MapComponent = dynamic(
  () => import('./IFrameMapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        Loading map...
      </div>
    )
  }
);

export default function ClientOnlyMap(props: any) {
  return <MapComponent {...props} />;
}

