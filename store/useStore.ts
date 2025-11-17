import { create } from 'zustand';
import { Brand, POI, SortOption, FilterOption, POICategory } from '@/types';
import { dummyBrands, dummyPOIs } from '@/lib/dummy-data';

interface AppState {
  // View mode
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
  
  // Data
  brands: Brand[];
  pois: POI[];
  
  // Filters
  selectedFilter: FilterOption;
  setSelectedFilter: (filter: FilterOption) => void;
  
  selectedSort: SortOption;
  setSelectedSort: (sort: SortOption) => void;
  
  selectedCategory: POICategory | null;
  setSelectedCategory: (category: POICategory | null) => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Map
  selectedBrand: Brand | null;
  setSelectedBrand: (brand: Brand | null) => void;
  
  selectedPOI: POI | null;
  setSelectedPOI: (poi: POI | null) => void;
  
  // Filtered data
  filteredBrands: () => Brand[];
  filteredPOIs: () => POI[];
}

export const useStore = create<AppState>((set, get) => ({
  isMobile: false,
  setIsMobile: (isMobile) => set({ isMobile }),
  
  brands: dummyBrands,
  pois: dummyPOIs,
  
  selectedFilter: 'all',
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  
  selectedSort: 'nearest',
  setSelectedSort: (sort) => set({ selectedSort: sort }),
  
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  selectedBrand: null,
  setSelectedBrand: (brand) => set({ selectedBrand: brand }),
  
  selectedPOI: null,
  setSelectedPOI: (poi) => set({ selectedPOI: poi }),
  
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
}));

