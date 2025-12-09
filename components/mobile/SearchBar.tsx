'use client';

import { FiSearch } from 'react-icons/fi';
import { useStore } from '@/store/useStore';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useStore();

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 p-4 bg-transparent pointer-events-none"
      style={{ 
        zIndex: 1000,
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px) + 1.5rem)'
      }}
    >
      <div className="relative pointer-events-auto">
        <input
          type="text"
          placeholder="Where do you want to go?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-200 text-black placeholder-gray-600 px-4 py-4 pl-12 pr-4 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-base"
        />
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none" size={20} />
      </div>
    </div>
  );
}

