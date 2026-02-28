'use client';

import { useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { getThemeIcon } from '@/lib/event-metadata';
import { getCategoryIcon } from '@/lib/category-icons';

export default function MobileNavigationTab() {
  const {
    filteredEvents,
    selectedFilter,
    setSelectedFilter,
    selectedCategories,
    setSelectedCategories,
  } = useStore();
  const events = filteredEvents();

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const getEmojiForEvent = (event: any) => {
    if (event.themes && event.themes.length > 0) {
      return getThemeIcon(event.themes[0]);
    }
    return '📅';
  };

  const getPriceLabel = (event: any) => {
    if (event.isFree) return 'Free';
    if (event.price) return event.price;
    return 'Paid';
  };

  /** Display label: add $ to single price if missing */
  const getDisplayPriceLabel = (event: any) => {
    const label = getPriceLabel(event);
    if (label === 'Free' || label === 'Paid') return label;
    if (label.includes(' - ')) return label; // range already has $ or format
    if (label.startsWith('$')) return label;
    return `$${label}`;
  };

  const getTitleSizeClass = (name: string) => {
    if (name.length > 40) return 'text-[11px]';
    if (name.length > 28) return 'text-[12px]';
    return 'text-[13px]';
  };

  const getPriceSizeClass = (label: string) => {
    if (label.length > 18) return 'text-[8px]';
    if (label.length > 12) return 'text-[9px]';
    return 'text-[10px]';
  };

  /** Compact bubble for "Free" or single price; full width for price ranges */
  const isCompactPriceBubble = (label: string) => {
    if (!label) return true;
    if (label === 'Free' || label === 'Paid') return true;
    if (!label.includes(' - ') && label.length < 15) return true;
    return false;
  };

  const categoryFilters: { id: string; label: string; categories: string[] }[] = [
    { id: 'arts', label: 'Arts & culture', categories: ['Arts/Exhibits', 'Artisan', 'Museum', 'Cultural', 'History'] },
    { id: 'music', label: 'Music & shows', categories: ['Music', 'Live Performances', 'Theatre', 'Comedy'] },
    { id: 'family', label: 'Family', categories: ['Family/Children'] },
    { id: 'food', label: 'Food & drink', categories: ['Food/Culinary', 'Farmers Market', "Farmers' Market"] },
  ];

  const activeCategoryId =
    selectedCategories.length > 0
      ? categoryFilters.find((f) => f.categories.every((c) => selectedCategories.includes(c)))?.id ?? null
      : null;

  return (
    <div
      className="fixed inset-0 z-[1020] flex flex-col bg-white"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <header className="px-5 pb-3">
        <p className="text-sm font-semibold text-gray-900 mb-3">Discover Toronto events</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => {
              setSelectedFilter('this-week');
              setSelectedCategories([]);
            }}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium ${
              !activeCategoryId && selectedFilter === 'this-week'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFilter('free');
              setSelectedCategories([]);
            }}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium ${
              !activeCategoryId && selectedFilter === 'free'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Free
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFilter('accessible');
              setSelectedCategories([]);
            }}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium ${
              !activeCategoryId && selectedFilter === 'accessible'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Accessible
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFilter('multi-day');
              setSelectedCategories([]);
            }}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium ${
              !activeCategoryId && selectedFilter === 'multi-day'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Multi-day
          </button>
          {categoryFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setSelectedFilter('all');
                setSelectedCategories(filter.categories);
              }}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium ${
                activeCategoryId === filter.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px) + 4rem)' }}>
        <div className="grid grid-cols-2 gap-3">
          {events.map((event) => {
            const emoji = getEmojiForEvent(event);
            const priceLabel = getDisplayPriceLabel(event);
            const CategoryIcon = getCategoryIcon(event.categories || []);
            const titleSizeClass = getTitleSizeClass(event.name || '');
             const priceSizeClass = getPriceSizeClass(priceLabel || '');
            const compactBubble = isCompactPriceBubble(priceLabel || '');

            return (
              <article
                key={event.id}
                className="relative flex h-[170px] flex-col justify-between rounded-3xl bg-white shadow-sm border border-gray-100 px-3 pt-3 pb-4"
              >
                <h2
                  className={`${titleSizeClass} font-semibold text-gray-900 line-clamp-2 pr-4`}
                >
                  {event.name}
                </h2>

                <div className="mt-1 space-y-0.5 text-[10px] text-gray-500">
                  <p className="leading-snug line-clamp-1">{event.locationName}</p>
                  <p className="text-[10px] text-gray-400 leading-snug">
                    {event.startDate !== event.endDate
                      ? `${formatEventDate(event.startDate)} – ${formatEventDate(event.endDate)}`
                      : formatEventDate(event.startDate)}
                  </p>
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <span
                    className={`inline-flex items-center justify-center rounded-full font-semibold ${priceSizeClass} ${
                      compactBubble
                        ? 'h-5 min-w-0 w-auto px-2 py-0.5'
                        : 'h-6 w-[96px] px-2.5 py-1'
                    } ${
                      event.isFree
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <span className="whitespace-nowrap">{priceLabel}</span>
                  </span>

                  <div className="relative h-9 w-9 rounded-2xl bg-gradient-to-tr from-emerald-100 via-sky-100 to-indigo-100 flex items-center justify-center text-lg shadow-sm overflow-hidden">
                    {CategoryIcon ? (
                      <CategoryIcon className="w-full h-full" size={24} />
                    ) : (
                      <span className="leading-none">{emoji}</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {events.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">
            No events found.
          </div>
        )}
      </main>
    </div>
  );
}


