import { create } from 'zustand';
import { Brand, POI, Event, SortOption, FilterOption, POICategory, Location } from '@/types';
import { dummyBrands, dummyPOIs } from '@/lib/dummy-data';
import { parseEvents } from '@/lib/parse-events';
import { sampleApiEvents } from '@/lib/sample-events';
import { calculateDistanceMiles } from '@/lib/utils';
import { TORONTO_CENTER_LOCATION } from '@/lib/dummy-data';

interface DateRangeFilter {
  start: string | null;
  end: string | null;
}

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
  
  // Loading states
  isLoadingEvents: boolean;
  setIsLoadingEvents: (loading: boolean) => void;
  eventsLoadedCount: number;
  totalEventsCount: number;
  setEventsProgress: (loaded: number, total: number) => void;
  
  // Filters
  selectedFilter: FilterOption;
  setSelectedFilter: (filter: FilterOption) => void;
  
  selectedSort: SortOption;
  setSelectedSort: (sort: SortOption) => void;
  
  selectedCategory: POICategory | null;
  setSelectedCategory: (category: POICategory | null) => void;

  selectedThemes: string[];
  setSelectedThemes: (themes: string[]) => void;

  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  
  selectedDateRange: DateRangeFilter;
  setSelectedDateRange: (range: DateRangeFilter) => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Map
  selectedBrand: Brand | null;
  setSelectedBrand: (brand: Brand | null) => void;
  
  selectedPOI: POI | null;
  setSelectedPOI: (poi: POI | null) => void;
  
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
  
  // Mobile search
  mobileSearchOpen: boolean;
  setMobileSearchOpen: (open: boolean) => void;
  mobileSearchResults: Event[];
  setMobileSearchResults: (events: Event[]) => void;
  mobileSearchStatus: 'idle' | 'searching' | 'done' | 'error';
  setMobileSearchStatus: (status: 'idle' | 'searching' | 'done' | 'error') => void;
  mobileSearchQuery: string;
  setMobileSearchQuery: (query: string) => void;
  mobileResultsSheetOpen: boolean;
  setMobileResultsSheetOpen: (open: boolean) => void;
  mobileResultsTab: 'for-you' | 'all';
  setMobileResultsTab: (tab: 'for-you' | 'all') => void;
  
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
  
  isLoadingEvents: false,
  setIsLoadingEvents: (loading) => set({ isLoadingEvents: loading }),
  eventsLoadedCount: 0,
  totalEventsCount: 0,
  setEventsProgress: (loaded, total) => set({ eventsLoadedCount: loaded, totalEventsCount: total }),
  
  selectedFilter: 'all',
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  
  selectedSort: 'nearest',
  setSelectedSort: (sort) => set({ selectedSort: sort }),
  
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  selectedThemes: [],
  setSelectedThemes: (themes) => set({ selectedThemes: themes }),

  selectedCategories: [],
  setSelectedCategories: (categories) => set({ selectedCategories: categories }),
  
  selectedDateRange: { start: null, end: null },
  setSelectedDateRange: (range) => set({ selectedDateRange: range }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  selectedBrand: null,
  setSelectedBrand: (brand) => set({ selectedBrand: brand }),
  
  selectedPOI: null,
  setSelectedPOI: (poi) => set({ selectedPOI: poi }),
  
  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  
  mobileSearchOpen: false,
  setMobileSearchOpen: (open) => set({ mobileSearchOpen: open }),
  mobileSearchResults: [],
  setMobileSearchResults: (events) => set({ mobileSearchResults: events }),
  mobileSearchStatus: 'idle',
  setMobileSearchStatus: (status) => set({ mobileSearchStatus: status }),
  mobileSearchQuery: '',
  setMobileSearchQuery: (query) => set({ mobileSearchQuery: query }),
  mobileResultsSheetOpen: false,
  setMobileResultsSheetOpen: (open) => set({ mobileResultsSheetOpen: open }),
  mobileResultsTab: 'for-you',
  setMobileResultsTab: (tab) => set({ mobileResultsTab: tab }),
  
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
    const { events, searchQuery, selectedFilter, selectedSort, selectedThemes, selectedDateRange, selectedCategories } = get();
    let filtered = [...events];

    const startBoundary = selectedDateRange.start ? new Date(selectedDateRange.start) : null;
    const endBoundary = selectedDateRange.end ? new Date(selectedDateRange.end) : null;
    if (startBoundary) startBoundary.setHours(0, 0, 0, 0);
    if (endBoundary) endBoundary.setHours(23, 59, 59, 999);
    
    // Filter by free/paid status
    if (selectedFilter === 'free') {
      filtered = filtered.filter(event => event.isFree);
    } else if (selectedFilter === 'paid') {
      filtered = filtered.filter(event => !event.isFree);
    } else if (selectedFilter === 'accessible') {
      filtered = filtered.filter((event) => event.isAccessible);
    }

    if (selectedThemes.length > 0) {
      filtered = filtered.filter((event) =>
        event.themes.some((theme) => selectedThemes.includes(theme))
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((event) =>
        event.categories.some((category) => selectedCategories.includes(category))
      );
    }

    // Filter by date range (overlapping events)
    if (startBoundary || endBoundary) {
      filtered = filtered.filter((event) => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);

        if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime())) {
          return true;
        }

        if (startBoundary && eventEnd < startBoundary) return false;
        if (endBoundary && eventStart > endBoundary) return false;
        return true;
      });
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
