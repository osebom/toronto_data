import { create } from 'zustand';
import { Brand, POI, Event, SortOption, FilterOption, POICategory, Location } from '@/types';
import { dummyBrands, dummyPOIs } from '@/lib/dummy-data';
import { parseEvents } from '@/lib/parse-events';
import { sampleApiEvents } from '@/lib/sample-events';
import { calculateDistanceMiles } from '@/lib/utils';
import { TORONTO_CENTER_LOCATION } from '@/lib/dummy-data';

interface AppState {
  // View mode
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
  
  // User location
  userLocation: Location | null;
  setUserLocation: (location: Location | null) => void;
  
  // Data
  brands: Brand[];
  pois: POI[];
  events: Event[];
  setEvents: (events: Event[]) => void;
  
  // Filters
  selectedFilter: FilterOption;
  setSelectedFilter: (filter: FilterOption) => void;
  
  selectedSort: SortOption;
  setSelectedSort: (sort: SortOption) => void;
  
  selectedCategory: POICategory | null;
  setSelectedCategory: (category: POICategory | null) => void;

  selectedTheme: string | null;
  setSelectedTheme: (theme: string | null) => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Map
  selectedBrand: Brand | null;
  setSelectedBrand: (brand: Brand | null) => void;
  
  selectedPOI: POI | null;
  setSelectedPOI: (poi: POI | null) => void;
  
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
  
  // Filtered data
  filteredBrands: () => Brand[];
  filteredPOIs: () => POI[];
  filteredEvents: () => Event[];
}

export const useStore = create<AppState>((set, get) => ({
  isMobile: false,
  setIsMobile: (isMobile) => set({ isMobile }),
  
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  
  brands: dummyBrands,
  pois: dummyPOIs,
  events: parseEvents(sampleApiEvents),
  setEvents: (events) => set({ events }),
  
  selectedFilter: 'all',
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  
  selectedSort: 'nearest',
  setSelectedSort: (sort) => set({ selectedSort: sort }),
  
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  selectedTheme: null,
  setSelectedTheme: (theme) => set({ selectedTheme: theme }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  selectedBrand: null,
  setSelectedBrand: (brand) => set({ selectedBrand: brand }),
  
  selectedPOI: null,
  setSelectedPOI: (poi) => set({ selectedPOI: poi }),
  
  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  
  filteredBrands: () => {
    const { brands, selectedFilter, searchQuery, selectedSort } = get();
    let filtered = [...brands];
    
    // Filter by open status
    if (selectedFilter === 'open-now') {
      filtered = filtered.filter(brand => brand.isOpen);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(brand =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort
    if (selectedSort === 'nearest') {
      filtered.sort((a, b) => a.distance - b.distance);
    } else if (selectedSort === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return filtered;
  },
  
  filteredPOIs: () => {
    const { pois, selectedCategory, searchQuery } = get();
    let filtered = [...pois];
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(poi => poi.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(poi =>
        poi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poi.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  },
  
  filteredEvents: () => {
    const { events, searchQuery, selectedFilter, selectedSort, selectedTheme } = get();
    let filtered = [...events];
    
    // Filter by free/paid status
    if (selectedFilter === 'free') {
      filtered = filtered.filter(event => event.isFree);
    } else if (selectedFilter === 'paid') {
      filtered = filtered.filter(event => !event.isFree);
    } else if (selectedFilter === 'accessible') {
      filtered = filtered.filter((event) => event.isAccessible);
    }

    if (selectedTheme) {
      filtered = filtered.filter((event) => event.themes.includes(selectedTheme));
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.locationName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort events
    if (selectedSort === 'nearest') {
      // Use user's location if available, otherwise fall back to Toronto center
      const { userLocation } = get();
      const referenceLocation: Location = userLocation || TORONTO_CENTER_LOCATION;
      
      // Calculate distance for each event and sort
      filtered = filtered
        .map(event => ({
          event,
          distance: calculateDistanceMiles(referenceLocation, event.location)
        }))
        .sort((a, b) => a.distance - b.distance)
        .map(item => item.event);
    } else if (selectedSort === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return filtered;
  },
}));
