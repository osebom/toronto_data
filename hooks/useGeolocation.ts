import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Location } from '@/types';

export function useGeolocation() {
  const { setUserLocation } = useStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      return;
    }

    // Get user's current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
      },
      (error) => {
        console.error('Error getting user location:', error);
        // Don't set location on error - will fall back to Toronto center
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, [setUserLocation]);
}

