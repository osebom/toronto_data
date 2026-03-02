'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useResponsive } from '@/hooks/useResponsive';
import { useGeolocation } from '@/hooks/useGeolocation';
import Sidebar from '@/components/desktop/Sidebar';
import MapView from '@/components/map/MapView';
import SearchBar from '@/components/mobile/SearchBar';
import MapControls from '@/components/mobile/MapControls';
import MobileSearchOverlay from '@/components/mobile/MobileSearchOverlay';
import MobileSearchResultsSheet from '@/components/mobile/MobileSearchResultsSheet';
import MobileEventDetailSheet from '@/components/mobile/MobileEventDetailSheet';
import MobileTabBar from '@/components/mobile/MobileTabBar';
import MobileNavigationTab from '@/components/mobile/MobileNavigationTab';
import MobileChatTab from '@/components/mobile/MobileChatTab';
import { loadEventsProgressive } from '@/lib/load-events-progressive';

export default function Home() {
  const { isMobile, mobileTab, setEvents, setIsLoadingEvents, setEventsProgress } = useStore();
  useResponsive();
  useGeolocation(); // Get user's location

  useEffect(() => {
    const controller = new AbortController();

    setIsLoadingEvents(true);

    loadEventsProgressive(
      (events, loaded, total, isComplete) => {
        setEvents(events);
        setEventsProgress(loaded, total);
        if (isComplete) {
          setIsLoadingEvents(false);
        }
      },
      controller.signal
    ).catch((error) => {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error('Failed to load events:', error);
      setIsLoadingEvents(false);
    });

    return () => controller.abort();
  }, [setEvents, setIsLoadingEvents, setEventsProgress]);

  // Determine which mode to show based on mobile/desktop
  const mapMode = 'events'; // Show events on both mobile and desktop

  return (
    <main className="h-screen w-screen overflow-hidden">
      {isMobile ? (
        // Mobile Layout - tabbed experience
        <div className="relative w-full h-full overflow-hidden bg-black">
          {/* Map tab content */}
          {mobileTab === 'map' && (
            <div className="absolute inset-0">
              <MapView mode={mapMode} />
              <MapControls />
              <SearchBar />
              <MobileSearchOverlay />
              <MobileSearchResultsSheet />
              <MobileEventDetailSheet />
            </div>
          )}

          {/* Navigation tab */}
          {mobileTab === 'navigation' && <MobileNavigationTab />}

          {/* Chat tab */}
          {mobileTab === 'chat' && <MobileChatTab />}

          {/* Persistent bottom nav (hidden on chat page) */}
          {mobileTab !== 'chat' && <MobileTabBar />}
        </div>
      ) : (
        // Desktop Layout - Full-screen map with sidebar overlay (for liquid blur)
        <div className="relative h-screen w-screen">
          <div className="absolute inset-0">
            <MapView mode={mapMode} />
          </div>
          <div className="absolute left-2 top-2 bottom-2 z-10 w-[calc(100%-1rem)] max-w-[420px] lg:w-1/3 lg:max-w-none rounded-3xl overflow-hidden shadow-2xl">
            <Sidebar />
          </div>
        </div>
      )}
    </main>
  );
}
