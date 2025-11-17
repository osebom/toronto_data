'use client';

import { useStore } from '@/store/useStore';
import { POICategory } from '@/types';

const categories: Array<{ id: POICategory; label: string; icon: string }> = [
  { id: 'eat', label: 'eat', icon: '🍴' },
  { id: 'cafe', label: 'café', icon: '☕' },
  { id: 'bar', label: 'bar', icon: '🍸' },
  { id: 'shop', label: 'shop', icon: '🛍️' },
  { id: 'club', label: 'club', icon: '🎉' },
  { id: 'hotel', label: 'hotel', icon: '🏨' },
  { id: 'destination', label: 'destination', icon: '📍' },
  { id: 'entertainment', label: 'entertainment', icon: '🎵' },
];

export default function BottomFilters() {
  const { selectedCategory, setSelectedCategory } = useStore();

  return (
    <div 
      className="absolute bottom-24 left-0 right-0 px-4 pointer-events-none"
      style={{ zIndex: 999 }}
    >
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pointer-events-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-white text-black'
                : 'bg-black/80 text-white backdrop-blur-sm'
            }`}
          >
            <span>{category.icon}</span>
            <span className="text-sm font-medium">{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

