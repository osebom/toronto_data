'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useResponsive } from '@/hooks/useResponsive';
import { useGeolocation } from '@/hooks/useGeolocation';
import Sidebar from '@/components/desktop/Sidebar';
import MapView from '@/components/map/MapView';
import BottomFilters from '@/components/mobile/BottomFilters';
import SearchBar from '@/components/mobile/SearchBar';
import MapControls from '@/components/mobile/MapControls';
import { fetchTorontoEvents } from '@/lib/fetch-events';

export default function Home() {
  const { isMobile, setEvents } = useStore();
  useResponsive();
  useGeolocation(); // Get user's location

  useEffect(() => {
    const controller = new AbortController();

    fetchTorontoEvents(controller.signal)
      .then((events) => setEvents(events))
      .catch((error) => {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        console.error('Failed to load events:', error);
      });

    return () => controller.abort();
  }, [setEvents]);

  // Determine which mode to show based on mobile/desktop
  const mapMode = 'events'; // Show events on both mobile and desktop

  return (
    <main className="h-screen w-screen overflow-hidden">
      {isMobile ? (
        // Mobile Layout - Full screen map with overlays
        <div className="relative w-full h-full overflow-hidden">
          <MapView mode={mapMode} />
          <MapControls />
          <BottomFilters />
          <SearchBar />
        </div>
      ) : (
        // Desktop Layout - Sidebar + Map
        <div className="flex h-screen w-screen">
          <Sidebar />
          <div className="flex-1 relative h-full">
            <MapView mode={mapMode} />
          </div>
        </div>
      )}
    </main>
  );
}
