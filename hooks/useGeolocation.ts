import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Location } from '@/types';

export function useGeolocation() {
  const { setUserLocation } = useStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cached = window.localStorage.getItem('userLocationCache');
    if (!cached) return;

    try {
      const parsed = JSON.parse(cached) as { lat: number; lng: number };
      const location: Location = { lat: parsed.lat, lng: parsed.lng };
      setUserLocation(location);
    } catch {
      // Ignore malformed cache
    }
  }, [setUserLocation]);
}
