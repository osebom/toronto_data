'use client';

import { FiNavigation } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { Location } from '@/types';

export default function MapControls() {
  const { setUserLocation } = useStore();

  const LAST_PROMPT_KEY = 'userLocationLastPrompt';
  const LOCATION_CACHE_KEY = 'userLocationCache';
  const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

  const handleCurrentLocation = () => {
    if (typeof window === 'undefined') return;
    if (navigator.geolocation) {
      const lastPromptRaw = window.localStorage.getItem(LAST_PROMPT_KEY);
      const lastPrompt = lastPromptRaw ? Number(lastPromptRaw) : 0;
      const now = Date.now();

      if (lastPrompt && now - lastPrompt < FOUR_DAYS_MS) {
        const cached = window.localStorage.getItem(LOCATION_CACHE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as { lat: number; lng: number };
            const location: Location = { lat: parsed.lat, lng: parsed.lng };
            setUserLocation(location);
          } catch {
            // Ignore malformed cache
          }
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          window.localStorage.setItem(LAST_PROMPT_KEY, String(now));
          window.localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
        },
        (error) => {
          console.error('Error getting user location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
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
