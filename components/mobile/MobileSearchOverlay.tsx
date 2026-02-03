'use client';

import { useState, useMemo } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { filterEventsWithAIFilters, rankAndLimitEvents, generateEventSummary } from '@/lib/ai-filter-events';
import { ExtractedFilters } from '@/app/api/ai-search/route';
import { getRateLimitStatus, recordMessage, formatTimeUntilReset } from '@/lib/rate-limit';

const SUGGESTION_CHIPS = [
  { label: 'free events this weekend', emoji: '🎉' },
  { label: 'family-friendly', emoji: '🧸' },
  { label: 'concerts', emoji: '🎵' },
  { label: 'food events', emoji: '🍴' },
  { label: 'events today', emoji: '📅' },
  { label: 'free things to do', emoji: '✨' },
  { label: 'art exhibitions', emoji: '🎨' },
  { label: 'outdoor activities', emoji: '🌳' },
];

export default function MobileSearchOverlay() {
  const {
    events,
    userLocation,
    mobileSearchOpen,
    setMobileSearchOpen,
    setMobileSearchQuery,
    setMobileSearchResults,
    setMobileSearchStatus,
    setMobileResultsSheetOpen,
    setMobileResultsTab,
    setSearchQuery,
  } = useStore();

  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableThemes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.themes?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [events]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.categories?.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [events]);

  const runSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const status = getRateLimitStatus();
    if (!status.canSend) {
      setErrorMessage(`Rate limit reached. Try again in ${formatTimeUntilReset()}.`);
      return;
    }
    if (!recordMessage()) {
      setErrorMessage(`Rate limit reached. Try again in ${formatTimeUntilReset()}.`);
      return;
    }

    setErrorMessage(null);
    setMobileSearchQuery(trimmed);
    setSearchQuery(trimmed);
    setMobileSearchStatus('searching');
    setMobileSearchOpen(false);
    setMobileResultsSheetOpen(true);
    setMobileResultsTab('for-you');

    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          availableThemes,
          availableCategories,
          chatContext: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setMobileSearchStatus('error');
          setErrorMessage(data.message || 'Rate limit reached. Try again later.');
          return;
        }
        throw new Error(data.details || data.error || 'Search failed');
      }

      const data = (await res.json()) as { filters: ExtractedFilters };
      const filters = data.filters;
      const filtered = filterEventsWithAIFilters(events, filters, userLocation);
      const top = rankAndLimitEvents(filtered, 10, userLocation);
      setMobileSearchResults(top);
      setMobileSearchStatus('done');

      if (top.length > 0) {
        const summaries = top.map(generateEventSummary);
        const respondRes = await fetch('/api/ai-search/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: trimmed,
            eventSummaries: summaries,
            count: top.length,
          }),
        });
        if (respondRes.ok) {
          const { response } = (await respondRes.json()) as { response: string };
          setErrorMessage(null);
        }
      }
    } catch (err) {
      setMobileSearchStatus('error');
      setMobileSearchResults([]);
      setErrorMessage(err instanceof Error ? err.message : 'Search failed. Try again.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(inputValue);
  };

  const handleChipClick = (label: string) => {
    setInputValue(label);
    runSearch(label);
  };

  if (!mobileSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] bg-white flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header with close */}
      <div className="flex items-center justify-end px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={() => setMobileSearchOpen(false)}
          className="p-2 -m-2 rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200"
          aria-label="Close search"
        >
          <FiX size={24} />
        </button>
      </div>

      {/* Prompt */}
      <p className="text-gray-500 text-center px-6 pt-2 pb-4 text-sm">
        Find events in Toronto — or ask us what you want!
      </p>

      {/* Suggestion chips */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => handleChipClick(chip.label)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm text-left text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <span className="text-xl" aria-hidden>{chip.emoji}</span>
            <span className="font-medium">{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {errorMessage && (
        <p className="px-4 py-2 text-sm text-amber-600 bg-amber-50">{errorMessage}</p>
      )}

      {/* Search bar at bottom */}
      <div className="p-4 bg-gray-100 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-gray-900 rounded-xl overflow-hidden">
            <FiSearch className="ml-4 text-gray-400 flex-shrink-0" size={20} />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="search"
              className="flex-1 bg-transparent text-white placeholder-gray-400 px-3 py-4 text-base focus:outline-none"
              autoFocus
              autoComplete="off"
            />
            {inputValue.length > 0 && (
              <button
                type="button"
                onClick={() => setInputValue('')}
                className="px-3 py-2 text-gray-400 hover:text-white text-sm"
              >
                clear
              </button>
            )}
            <button
              type="submit"
              className="m-1.5 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0"
              aria-label="Search"
            >
              <FiSearch size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
