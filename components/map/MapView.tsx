'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { TORONTO_CENTER_LOCATION } from '@/lib/dummy-data';
import { Brand, POI } from '@/types';

// CSS will be imported dynamically

interface MapViewProps {
  mode: 'brands' | 'pois';
}

export default function MapView({ mode }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { filteredBrands, filteredPOIs, isMobile, searchQuery, selectedFilter, selectedCategory } = useStore();

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current || map.current) return;

    // Dynamically import Leaflet and CSS
    Promise.all([
      import('leaflet'),
      // @ts-ignore - CSS import
      import('leaflet/dist/leaflet.css')
    ]).then(([leafletModule]) => {
      const Leaflet = leafletModule.default;
      leafletRef.current = Leaflet; // Store Leaflet instance in ref
      
      // Fix for default marker icons in Leaflet with Next.js
      if (Leaflet.Icon.Default.prototype) {
        delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
        Leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
      }

      // Ensure container has dimensions
      if (!mapContainer.current || (mapContainer.current.offsetHeight === 0 || mapContainer.current.offsetWidth === 0)) {
        console.warn('Map container has no dimensions');
        return;
      }

      try {
        // Create map with dark theme using CartoDB Dark Matter tiles
        map.current = Leaflet.map(mapContainer.current, {
          center: [TORONTO_CENTER_LOCATION.lat, TORONTO_CENTER_LOCATION.lng],
          zoom: isMobile ? 13 : 14,
          zoomControl: true,
          attributionControl: true,
        });

        // Use CartoDB Voyager for colorful map (free, no API key needed)
        Leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map.current);

        map.current.whenReady(() => {
          setIsLoaded(true);
          // Invalidate size to ensure proper rendering
          setTimeout(() => {
            map.current?.invalidateSize();
          }, 100);
        });

      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    });

    return () => {
      // Clean up markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isMobile]);

  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const filteredBrandsData = filteredBrands();
    const filteredPOIsData = filteredPOIs();

    if (mode === 'brands') {
      filteredBrandsData.forEach((brand) => {
        const marker = createBrandMarker(brand);
        if (marker) markersRef.current.push(marker);
      });
    } else {
      filteredPOIsData.forEach((poi) => {
        const marker = createPOIMarker(poi);
        if (marker) markersRef.current.push(marker);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, mode, searchQuery, selectedFilter, selectedCategory]);

  // Resize map when container size changes
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        map.current?.invalidateSize();
      }, 100);
    });

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isLoaded]);

  const createBrandMarker = (brand: Brand): any => {
    if (!map.current || !leafletRef.current || typeof window === 'undefined') return null;
    
    const Leaflet = leafletRef.current;

    const el = document.createElement('div');
    el.className = 'brand-marker';
    el.style.width = '60px';
    el.style.height = '60px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#2a2a2a';
    el.style.border = '2px solid #ffffff';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.cursor = 'pointer';
    el.style.position = 'relative';
    el.style.zIndex = '1000';

    // Brand logo placeholder
    const logo = document.createElement('div');
    logo.style.width = '40px';
    logo.style.height = '40px';
    logo.style.borderRadius = '50%';
    logo.style.backgroundColor = '#ffffff';
    logo.style.display = 'flex';
    logo.style.alignItems = 'center';
    logo.style.justifyContent = 'center';
    logo.style.fontSize = '20px';
    logo.style.fontWeight = 'bold';
    logo.textContent = brand.name.charAt(0);
    el.appendChild(logo);

    // Capacity/wait time box
    const infoBox = document.createElement('div');
    infoBox.style.position = 'absolute';
    infoBox.style.bottom = '-25px';
    infoBox.style.left = '50%';
    infoBox.style.transform = 'translateX(-50%)';
    infoBox.style.backgroundColor = '#1a1a1a';
    infoBox.style.padding = '2px 6px';
    infoBox.style.borderRadius = '4px';
    infoBox.style.fontSize = '10px';
    infoBox.style.color = '#ffffff';
    infoBox.style.display = 'flex';
    infoBox.style.alignItems = 'center';
    infoBox.style.gap = '4px';
    infoBox.innerHTML = `⏱️ ${brand.capacity || 0}`;
    el.appendChild(infoBox);

    const icon = Leaflet.divIcon({
      html: el.outerHTML,
      className: 'custom-brand-marker',
      iconSize: [60, 85], // Height includes the info box
      iconAnchor: [30, 85],
    });

    return Leaflet.marker([brand.location.lat, brand.location.lng], { icon })
      .addTo(map.current);
  };

  const createPOIMarker = (poi: POI): any => {
    if (!map.current || !leafletRef.current || typeof window === 'undefined') return null;
    
    const Leaflet = leafletRef.current;

    const el = document.createElement('div');
    el.className = 'poi-marker';
    el.style.width = '50px';
    el.style.height = '50px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = poi.iconColor || '#ffffff';
    el.style.border = '2px solid #ffffff';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.cursor = 'pointer';
    el.style.fontSize = '24px';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    el.style.position = 'relative';
    el.style.zIndex = '1000';

    el.textContent = poi.icon;

    // Add label
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '-30px';
    label.style.left = '50%';
    label.style.transform = 'translateX(-50%)';
    label.style.backgroundColor = 'rgba(0,0,0,0.8)';
    label.style.color = '#ffffff';
    label.style.padding = '4px 8px';
    label.style.borderRadius = '4px';
    label.style.fontSize = '11px';
    label.style.whiteSpace = 'nowrap';
    label.style.pointerEvents = 'none';
    label.textContent = poi.name;
    el.appendChild(label);

    const icon = Leaflet.divIcon({
      html: el.outerHTML,
      className: 'custom-poi-marker',
      iconSize: [50, 80], // Height includes the label
      iconAnchor: [25, 80],
    });

    return Leaflet.marker([poi.location.lat, poi.location.lng], { icon })
      .addTo(map.current);
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
