export interface Location {
  lat: number;
  lng: number;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  location: Location;
  distance: number; // in miles
  openingHours: string;
  isOpen: boolean;
  waitTime?: number; // in minutes
  capacity?: number; // percentage
}

export interface POI {
  id: string;
  name: string;
  category: POICategory;
  icon: string;
  iconColor: string;
  location: Location;
  description: string;
  isLiked?: boolean;
  isSaved?: boolean;
  likedBy?: string;
  savedBy?: string;
}

export type POICategory = 
  | 'eat' 
  | 'cafe' 
  | 'bar' 
  | 'shop' 
  | 'club' 
  | 'hotel' 
  | 'destination' 
  | 'entertainment';

export type SortOption = 'nearest' | 'name' | 'rating';
export type FilterOption = 'open-now' | 'all';

