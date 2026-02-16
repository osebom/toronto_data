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
        className="relative w-full flex items-center gap-3 bg-white text-gray-900 placeholder-gray-500 px-4 py-4 pl-4 pr-4 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-300 pointer-events-auto text-left"
      >
        <FiSearch className="text-gray-500 flex-shrink-0" size={22} />
        <span className="text-gray-500 text-base">Find events — ask away!</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 border border-gray-200 pointer-events-none">
          <img src="/cohere-logo.png" alt="Cohere" className="h-4 w-4 opacity-90" />
        </span>
      </button>
    </div>
  );
}
