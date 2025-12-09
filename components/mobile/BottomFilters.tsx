'use client';

import { useStore } from '@/store/useStore';
import { getCategoryIcon } from '@/lib/category-icons';
import React from 'react';

// Event categories with shortened labels and their corresponding category names
const eventCategories: Array<{ 
  label: string; 
  categoryNames: string[]; // Categories that map to this filter
}> = [
  { label: 'Comedy', categoryNames: ['Comedy', 'Theatre'] },
  { label: 'Music', categoryNames: ['Music'] },
  { label: 'Arts', categoryNames: ['Arts/Exhibits', 'Museum'] },
  { label: 'Food', categoryNames: ['Food/Culinary'] },
  { label: 'Film', categoryNames: ['Film'] },
  { label: 'Dance', categoryNames: ['Dance', 'Live Performances'] },
  { label: 'Family', categoryNames: ['Family/Children'] },
  { label: 'Festival', categoryNames: ['Celebrations', 'Street Festival', 'Parade'] },
  { label: 'Nightlife', categoryNames: ['Nightlife'] },
  { label: 'Sports', categoryNames: ['Run/Walk', 'Sports'] },
  { label: 'Charity', categoryNames: ['Charity/Cause'] },
  { label: 'Cultural', categoryNames: ['Cultural', 'Indigenous', '2SLGBTQ+'] },
  { label: 'History', categoryNames: ['History'] },
  { label: 'Literary', categoryNames: ['Literary', 'Talks'] },
  { label: 'Nature', categoryNames: ['Environmental'] },
  { label: 'Science', categoryNames: ['Science/Technology'] },
  { label: 'Market', categoryNames: ['Farmers Market', "Farmers' Market"] },
  { label: 'Artisan', categoryNames: ['Artisan'] },
  { label: 'Other', categoryNames: ['Other'] },
];

export default function BottomFilters() {
  const { selectedCategories, setSelectedCategories } = useStore();

  const toggleCategory = (categoryNames: string[]) => {
    const current = [...selectedCategories];
    
    // Check if any of the category names are already selected
    const isSelected = categoryNames.some(name => current.includes(name));
    
    if (isSelected) {
      // Remove all matching categories
      const updated = current.filter(cat => !categoryNames.includes(cat));
      setSelectedCategories(updated);
    } else {
      // Add all category names
      const updated = [...current, ...categoryNames];
      setSelectedCategories(updated);
    }
  };

  const isCategorySelected = (categoryNames: string[]) => {
    return categoryNames.some(name => selectedCategories.includes(name));
  };

  return (
    <div 
      className="absolute bottom-24 left-0 right-0 px-4 pointer-events-none"
      style={{ zIndex: 999 }}
    >
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pointer-events-auto">
        {eventCategories.map((category) => {
          const IconComponent = getCategoryIcon(category.categoryNames);
          const isSelected = isCategorySelected(category.categoryNames);
          
          return (
            <button
              key={category.label}
              onClick={() => toggleCategory(category.categoryNames)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-white text-black'
                  : 'bg-black/80 text-white backdrop-blur-sm'
              }`}
            >
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <IconComponent 
                size={20} 
                color={isSelected ? '#111827' : '#ffffff'}
                className={isSelected ? 'text-gray-900' : 'text-white'}
              />
            </div>
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

