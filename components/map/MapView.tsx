'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { TORONTO_CENTER_LOCATION } from '@/lib/dummy-data';
import { Brand, POI, Event } from '@/types';
import { getCategoryIcon } from '@/lib/category-icons';
import { renderToStaticMarkup } from 'react-dom/server';

// CSS will be imported dynamically

interface MapViewProps {
  mode: 'brands' | 'pois' | 'events';
}

export default function MapView({ mode }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { filteredBrands, filteredPOIs, filteredEvents, events, isMobile, searchQuery, selectedFilter, selectedCategory, selectedEvent, setSelectedEvent, selectedThemes, selectedDateRange, selectedCategories, mobileSearchContextActive, mobileSearchResults } = useStore();

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
    const filteredEventsData =
      mode === 'events' && isMobile && selectedEvent
        ? [selectedEvent]
        : mode === 'events' && isMobile && mobileSearchContextActive
          ? mobileSearchResults
          : filteredEvents();

    if (mode === 'brands') {
      filteredBrandsData.forEach((brand) => {
        const marker = createBrandMarker(brand);
        if (marker) markersRef.current.push(marker);
      });
    } else if (mode === 'pois') {
      filteredPOIsData.forEach((poi) => {
        const marker = createPOIMarker(poi);
        if (marker) markersRef.current.push(marker);
      });
    } else if (mode === 'events') {
      filteredEventsData.forEach((event) => {
        const marker = createEventMarker(event);
        if (marker) {
          markersRef.current.push(marker);
          // If this event is selected, open its popup
          if (selectedEvent?.id === event.id) {
            if (!isMobile) marker.openPopup();
            map.current?.setView([event.location.lat, event.location.lng], 15);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, mode, events, searchQuery, selectedFilter, selectedCategory, selectedEvent, selectedThemes, selectedDateRange, selectedCategories, isMobile, mobileSearchContextActive, mobileSearchResults]);

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
    label.style.whiteSpace = 'normal';
    label.style.wordBreak = 'break-word';
    label.style.maxWidth = '140px';
    label.style.maxHeight = '36px';
    label.style.overflow = 'hidden';
    label.style.textOverflow = 'ellipsis';
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

  const createEventMarker = (event: Event): any => {
    if (!map.current || !leafletRef.current || typeof window === 'undefined') return null;
    
    const Leaflet = leafletRef.current;

    const el = document.createElement('div');
    el.className = 'event-marker';
    el.style.width = '50px';
    el.style.height = '50px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#ffffff';
    el.style.border = '2px solid #e5e7eb';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.paddingTop = '0px';
    el.style.cursor = 'pointer';
    el.style.fontSize = '16px';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    el.style.position = 'relative';
    el.style.zIndex = '1000';
    el.style.fontWeight = 'bold';
    el.style.color = '#111827';
    el.style.textTransform = 'uppercase';
    el.style.letterSpacing = '-0.5px';

    const IconComponent = getCategoryIcon(event.categories || []);
    const iconMarkup = renderToStaticMarkup(
      <div
        style={{
          width: '70%',
          height: '70%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        <IconComponent color="#111827" size={15} />
      </div>
    );
    el.innerHTML = iconMarkup;

    if (event.isFree) {
      const freeBar = document.createElement('div');
      freeBar.textContent = 'FREE';
      freeBar.style.position = 'absolute';
      freeBar.style.top = '100%';
      freeBar.style.left = '50%';
      freeBar.style.transform = 'translate(-50%, 0px)';
      freeBar.style.padding = '2px 6px';
      freeBar.style.borderRadius = '6px';
      freeBar.style.backgroundColor = '#10b981';
      freeBar.style.color = '#ffffff';
      freeBar.style.fontSize = '10px';
      freeBar.style.fontWeight = '700';
      freeBar.style.boxShadow = '0 1px 4px rgba(0,0,0,0.2)';
      el.appendChild(freeBar);
    }

    // Add label with event name
    const label = document.createElement('div');
    label.style.display = 'none';
    el.appendChild(label);

    const icon = Leaflet.divIcon({
      html: el.outerHTML,
      className: 'custom-event-marker',
      iconSize: [50, 75],
      iconAnchor: [25, 75],
      popupAnchor: [0, -70], // arrow centers above the circle
    });

    const marker = Leaflet.marker([event.location.lat, event.location.lng], { icon })
      .addTo(map.current);

    // Add popup on click
    const mapsUrl = event.locationAddress 
      ? `https://www.google.com/maps?q=${encodeURIComponent(event.locationAddress)}`
      : `https://www.google.com/maps?q=${event.location.lat},${event.location.lng}`;
    const popupContent = `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">${event.name}</h3>
        <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">${event.locationName}</p>
        ${event.locationAddress ? `<a href="${mapsUrl}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 12px;">${event.locationAddress}</a>` : ''}
        <p style="margin: 0 0 8px 0; font-size: 13px;">${event.shortDescription || event.description.substring(0, 100)}...</p>
        ${event.website ? `<a href="${event.website}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 12px;">Learn more →</a>` : ''}
      </div>
    `;
    marker.bindPopup(popupContent);

    if (isMobile) {
      marker.on('click', () => setSelectedEvent(event));
    }

    return marker;
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
