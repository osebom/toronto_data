'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useResponsive } from '@/hooks/useResponsive';
import Sidebar from '@/components/desktop/Sidebar';
import MapView from '@/components/map/MapView';
import BottomFilters from '@/components/mobile/BottomFilters';
import SearchBar from '@/components/mobile/SearchBar';
import MapControls from '@/components/mobile/MapControls';

export default function Home() {
  const { isMobile } = useStore();
  useResponsive();

  // Determine which mode to show based on mobile/desktop
  const mapMode = isMobile ? 'pois' : 'brands';

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

