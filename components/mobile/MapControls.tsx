'use client';

import { FiNavigation } from 'react-icons/fi';

export default function MapControls() {
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        // Handle location update
        console.log('Current location:', position.coords);
      });
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      <button
        onClick={handleCurrentLocation}
        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
      >
        <FiNavigation className="text-blue-500" size={20} />
      </button>
    </div>
  );
}

