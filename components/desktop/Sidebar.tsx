'use client';

import { FiInfo, FiSearch, FiChevronDown, FiFilter } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import EventList from './EventList';

export default function Sidebar() {
  const {
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    selectedSort,
    setSelectedSort,
  } = useStore();

  return (
    <div className="w-full lg:w-1/3 bg-dark-sidebar h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-dark-bg font-bold text-sm">E</span>
          </div>
          <span className="text-white font-semibold">event buddy</span>
        </div>
        <button className="text-white hover:text-gray-300">
          <FiInfo size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-card text-white placeholder-gray-400 px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-700 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Show me:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-green-500 text-white'
                  : 'bg-dark-card text-white hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('free')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedFilter === 'free'
                  ? 'bg-green-500 text-white'
                  : 'bg-dark-card text-white hover:bg-gray-600'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setSelectedFilter('paid')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedFilter === 'paid'
                  ? 'bg-green-500 text-white'
                  : 'bg-dark-card text-white hover:bg-gray-600'
              }`}
            >
              Paid
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Sort by:</span>
          <button
            onClick={() => {
              const options: Array<'nearest' | 'name'> = ['nearest', 'name'];
              const currentIndex = options.indexOf(selectedSort as 'nearest' | 'name');
              const nextIndex = (currentIndex + 1) % options.length;
              setSelectedSort(options[nextIndex]);
            }}
            className="flex items-center gap-2 bg-dark-card text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <span className="text-sm capitalize">{selectedSort}</span>
            <FiChevronDown size={16} />
          </button>
        </div>

        <button className="flex items-center gap-2 bg-dark-card text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 transition-colors w-full">
          <FiFilter size={16} />
          <span className="text-sm">Filters</span>
        </button>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto">
        <EventList />
      </div>
    </div>
  );
}

