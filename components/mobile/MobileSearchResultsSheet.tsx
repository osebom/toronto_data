'use client';

import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { useDraggableSheet } from '@/hooks/useDraggableSheet';
import { Event } from '@/types';
import { calculateDistanceMiles, formatDistance } from '@/lib/utils';
import { TORONTO_CENTER_LOCATION } from '@/lib/dummy-data';
import { getThemeIcon } from '@/lib/event-metadata';
import { getCategoryIcon } from '@/lib/category-icons';
import React from 'react';

type TabId = 'for-you' | 'all';

interface EventCardProps {
  event: Event;
  onSelect: () => void;
}

function EventCard({ event, onSelect }: EventCardProps) {
  const { userLocation } = useStore();
  const refLoc = userLocation || TORONTO_CENTER_LOCATION;
  const CategoryIcon = getCategoryIcon(event.categories || []);
  const themeEmoji = event.themes?.[0] ? getThemeIcon(event.themes[0]) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center bg-white border border-gray-200 shadow-sm">
        {themeEmoji ? (
          <span className="text-xl">{themeEmoji}</span>
        ) : CategoryIcon ? (
          <CategoryIcon className="text-gray-600" size={22} />
        ) : (
          <span className="text-xl text-gray-400">📅</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{event.name}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
          {event.price && <span className="text-gray-500">$</span>}
          {event.categories?.[0] && (
            <span className="flex items-center gap-1">
              {themeEmoji ? <span>{themeEmoji}</span> : null}
              <span>{event.categories[0]}</span>
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {event.locationName} · {formatDistance(calculateDistanceMiles(refLoc, event.location))}
        </div>
      </div>
      <div className="flex-shrink-0">
        <span
          className={`text-xs px-2 py-1 rounded font-medium ${
            event.isFree ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {event.isFree ? 'FREE' : 'PAID'}
        </span>
      </div>
    </button>
  );
}

export default function MobileSearchResultsSheet() {
  const {
    mobileResultsSheetOpen,
    setMobileResultsSheetOpen,
    mobileSearchQuery,
    mobileSearchResults,
    mobileSearchStatus,
    mobileResultsTab,
    setMobileResultsTab,
    filteredEvents,
    setSelectedEvent,
  } = useStore();

  const { heightVh, dragHandleProps } = useDraggableSheet(55);
  const activeTab = mobileResultsTab;

  const keywordEvents = filteredEvents();
  const displayEvents = activeTab === 'for-you' ? mobileSearchResults : keywordEvents;

  const setActiveTab = (tab: TabId) => setMobileResultsTab(tab);

  if (!mobileResultsSheetOpen) return null;

  const isSearching = mobileSearchStatus === 'searching';
  const isError = mobileSearchStatus === 'error';
  const count = activeTab === 'for-you' ? mobileSearchResults.length : keywordEvents.length;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[1050] bg-white rounded-t-2xl shadow-xl flex flex-col"
      style={{
        height: `${heightVh}vh`,
        maxHeight: '85vh',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Drag handle - draggable */}
      <div
        className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
        {...dragHandleProps}
      >
        <div className="w-10 h-1 rounded-full bg-gray-300" />
      </div>

      {/* Header: filter pill + close */}
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="px-4 py-2 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
          {mobileSearchQuery || 'events'}
        </span>
        <button
          type="button"
          onClick={() => setMobileResultsSheetOpen(false)}
          className="p-2 -m-2 rounded-full text-gray-600 hover:bg-gray-100"
          aria-label="Close"
        >
          <FiX size={24} />
        </button>
      </div>

      {/* Status / message */}
      {isSearching && (
        <div className="px-4 pb-3 flex items-center gap-2 text-sm text-gray-600">
          <span className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '300ms' }} />
          </span>
          <span>searching</span>
        </div>
      )}
      {mobileSearchStatus === 'done' && !isSearching && !isError && (
        <p className="px-4 pb-3 text-sm text-gray-600">
          {count > 0
            ? `✓ Found ${count} curated event${count !== 1 ? 's' : ''} for you.`
            : 'Only found a couple spots — try a wider search or different keywords.'}
        </p>
      )}
      {isError && (
        <p className="px-4 pb-3 text-sm text-amber-600">Search failed. Try again or check your rate limit.</p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 px-4 border-b border-gray-200">
        {(['for-you', 'all'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500'
            }`}
          >
            {tab === 'for-you' ? 'for you' : 'all'}
          </button>
        ))}
      </div>

      {/* Result list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {displayEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onSelect={() => setSelectedEvent(event)}
          />
        ))}
        {!isSearching && displayEvents.length === 0 && (
          <p className="text-center text-gray-500 py-8 text-sm">No events match your search.</p>
        )}
      </div>
    </div>
  );
}
