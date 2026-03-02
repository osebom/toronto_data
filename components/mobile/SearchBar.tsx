'use client';

import { FiSearch } from 'react-icons/fi';
import { useStore } from '@/store/useStore';

export default function SearchBar() {
  const { setMobileSearchOpen } = useStore();

  return (
    <div
      className="absolute left-0 right-0 p-4 pointer-events-none"
      style={{
        bottom: 0,
        zIndex: 1000,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.25rem)',
      }}
    >
      <button
        type="button"
        onClick={() => setMobileSearchOpen(true)}
        className="relative w-full flex items-center gap-2.5 bg-gray-900 text-white placeholder-gray-400 px-3 py-3 pl-3 pr-3 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-600 pointer-events-auto text-left"
      >
        <FiSearch className="text-gray-400 flex-shrink-0" size={18} />
        <span className="text-gray-400 text-sm">Find events — ask away!</span>
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-white/10 border border-white/15 pointer-events-none">
          <img src="/cohere-logo.png" alt="Cohere" className="h-3.5 w-3.5 opacity-90" />
        </span>
      </button>
    </div>
  );
}
