'use client';

import { FiSearch } from 'react-icons/fi';
import { useStore } from '@/store/useStore';

export default function SearchBar() {
  const { setMobileSearchOpen } = useStore();

  return (
    <div
      className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none"
      style={{
        zIndex: 1000,
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px) + 1.5rem)',
      }}
    >
      <button
        type="button"
        onClick={() => setMobileSearchOpen(true)}
        className="w-full flex items-center gap-3 bg-gray-900 text-white placeholder-gray-400 px-4 py-4 pl-4 pr-4 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-600 pointer-events-auto text-left"
      >
        <FiSearch className="text-gray-400 flex-shrink-0" size={22} />
        <span className="text-gray-400 text-base">Find events — or ask us what you want!</span>
      </button>
    </div>
  );
}
