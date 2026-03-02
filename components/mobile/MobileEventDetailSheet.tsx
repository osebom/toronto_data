'use client';

import { format } from 'date-fns';
import { FiChevronLeft, FiChevronRight, FiShare2, FiMapPin, FiPhone, FiExternalLink, FiX } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { Event } from '@/types';
import { getThemeIcon, getFeatureIcon } from '@/lib/event-metadata';
import { getCategoryIcon } from '@/lib/category-icons';
import { useDraggableSheet } from '@/hooks/useDraggableSheet';

export default function MobileEventDetailSheet() {
  const {
    selectedEvent,
    setSelectedEvent,
    chatEventGroup,
    isMobile,
    mobileSearchContextActive,
    setMobileResultsSheetOpen,
  } = useStore();
  const { heightVh, dragHandleProps } = useDraggableSheet(33);

  if (!selectedEvent || !isMobile) return null;

  const event = selectedEvent as Event;
  const group = chatEventGroup || [];
  const currentIndex = group.findIndex((e) => e.id === event.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < group.length - 1;
  const mapsUrl = event.locationAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(event.locationAddress)}`
    : `https://www.google.com/maps?q=${event.location.lat},${event.location.lng}`;
  const fromSearch = mobileSearchContextActive;

  const formatEventDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'EEEE, MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const now = new Date();
  const isEndingSoon = endDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000 && endDate > now;
  const isUpcoming = startDate > now;

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: event.name,
        text: event.shortDescription || event.description,
        url: event.website || window.location.href,
      }).catch((err: Error) => {
        if (err.name !== 'AbortError') console.error(err);
      });
    } else {
      navigator.clipboard?.writeText(event.website || window.location.href);
    }
  };

  const handleClose = () => setSelectedEvent(null);
  const handleBackToSearch = () => {
    setSelectedEvent(null);
    setMobileResultsSheetOpen(true);
  };

  const CategoryIcon = getCategoryIcon(event.categories || []);
  const themeEmoji = event.themes?.[0] ? getThemeIcon(event.themes[0]) : null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[1060] rounded-t-2xl flex flex-col overflow-hidden bg-white/65 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-2xl backdrop-saturate-150 border-2 border-white/70 border-b-0 ring-1 ring-white/30"
      style={{
        height: `${heightVh}vh`,
        maxHeight: '90vh',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Drag handle - draggable */}
      <div
        className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing"
        {...dragHandleProps}
      >
        <div className="w-10 h-1 rounded-full bg-gray-400/80" />
      </div>

      {/* Header: Back (from search) or X (from map) */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
        {fromSearch ? (
          <button
            type="button"
            onClick={handleBackToSearch}
            className="flex items-center gap-1 p-2 -m-2 rounded-full text-gray-700 hover:bg-gray-100"
            aria-label="Back"
          >
            <FiChevronLeft size={24} />
          </button>
        ) : (
          <div />
        )}
        {!fromSearch && (
          <button
            type="button"
            onClick={handleClose}
            className="p-2 -m-2 rounded-full text-gray-600 hover:bg-gray-100"
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
        )}
      </div>

      {/* Chat group navigation (if opened from chat with multiple events) */}
      {group.length > 1 && currentIndex !== -1 && (
        <div className="flex items-center justify-between px-4 pb-2 text-xs text-gray-500 flex-shrink-0">
          <span>
            Event {currentIndex + 1} of {group.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (!hasPrev) return;
                setSelectedEvent(group[currentIndex - 1]);
              }}
              disabled={!hasPrev}
              className={`h-7 w-7 flex items-center justify-center rounded-full border text-gray-600 bg-white/80 ${
                !hasPrev ? 'opacity-40 cursor-default' : 'hover:bg-gray-50'
              }`}
              aria-label="Previous event"
            >
              <FiChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!hasNext) return;
                setSelectedEvent(group[currentIndex + 1]);
              }}
              disabled={!hasNext}
              className={`h-7 w-7 flex items-center justify-center rounded-full border text-gray-600 bg-white/80 ${
                !hasNext ? 'opacity-40 cursor-default' : 'hover:bg-gray-50'
              }`}
              aria-label="Next event"
            >
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Event icon + name row */}
        <div className="px-4 pb-3 flex items-start gap-3">
          <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center bg-white border border-gray-200 shadow-sm">
            {CategoryIcon ? (
              <CategoryIcon className="text-gray-600" size={28} />
            ) : themeEmoji ? (
              <span className="text-2xl">{themeEmoji}</span>
            ) : (
              <span className="text-2xl text-gray-400">📅</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{event.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {event.categories?.[0] && (
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <span>{event.categories[0]}</span>
                </span>
              )}
              {event.categories?.slice(1).map((cat) => (
                <span key={cat} className="text-sm text-gray-600">{cat}</span>
              ))}
              {event.price && <span className="text-sm text-gray-600">$</span>}
              <span
                className={`text-xs px-2 py-1 rounded font-medium ${
                  event.isFree ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {event.isFree ? 'FREE' : 'PAID'}
              </span>
            </div>
          </div>
        </div>

        {/* Status + dates */}
        <div className="px-4 pb-3">
          {isEndingSoon && (
            <span className="text-amber-600 font-medium text-sm">ending soon</span>
          )}
          {isUpcoming && !isEndingSoon && (
            <span className="text-gray-600 text-sm">upcoming</span>
          )}
          <p className="text-sm text-gray-600 mt-1">
            {formatEventDate(event.startDate)}
            {event.startDate !== event.endDate && ` – ${formatEventDate(event.endDate)}`}
          </p>
        </div>

        {/* Metadata: themes, features, description */}
        <div className="px-4 pb-3 space-y-3">
          {event.themes && event.themes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.themes.map((theme) => (
                <span
                  key={theme}
                  className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-lg bg-gray-100 text-gray-700"
                >
                  {getThemeIcon(theme)}
                  <span>{theme}</span>
                </span>
              ))}
            </div>
          )}
          {event.features && event.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.features.slice(0, 6).map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600"
                >
                  {getFeatureIcon(feature)}
                  <span>{feature}</span>
                </span>
              ))}
            </div>
          )}
          {(event.shortDescription || event.description) && (
            <p className="text-sm text-gray-600 line-clamp-4">
              {event.shortDescription || event.description}
            </p>
          )}
        </div>

        {/* Address */}
        <div className="px-4 pb-4">
          <p className="text-sm text-gray-700">{event.locationAddress || event.locationName}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-6">
          <button
            type="button"
            onClick={handleShare}
            className="h-12 flex items-center justify-center gap-2 px-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm whitespace-nowrap"
          >
            <FiShare2 size={18} />
            share
          </button>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 flex items-center justify-center gap-2 px-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 text-sm whitespace-nowrap"
          >
            <FiMapPin size={18} />
            directions
          </a>
          {event.website && (
            <a
              href={event.website}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 flex items-center justify-center gap-2 px-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm whitespace-nowrap"
            >
              <FiExternalLink size={18} />
            </a>
          )}
          {event.telephone && (
            <a
              href={`tel:${event.telephone}`}
              className="h-12 flex items-center justify-center gap-2 px-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm whitespace-nowrap"
            >
              <FiPhone size={18} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
