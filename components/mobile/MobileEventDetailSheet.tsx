'use client';

import { format } from 'date-fns';
import { FiChevronLeft, FiShare2, FiMapPin, FiPhone, FiExternalLink, FiX } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { Event } from '@/types';
import { calculateDistanceMiles, formatDistance } from '@/lib/utils';
import { TORONTO_CENTER_LOCATION } from '@/lib/dummy-data';
import { getThemeIcon, getFeatureIcon } from '@/lib/event-metadata';
import { getCategoryIcon } from '@/lib/category-icons';
import { useDraggableSheet } from '@/hooks/useDraggableSheet';

export default function MobileEventDetailSheet() {
  const { selectedEvent, setSelectedEvent, userLocation, isMobile, mobileResultsSheetOpen } = useStore();
  const { heightVh, dragHandleProps } = useDraggableSheet(55);

  if (!selectedEvent || !isMobile) return null;

  const event = selectedEvent as Event;
  const refLoc = userLocation || TORONTO_CENTER_LOCATION;
  const distance = calculateDistanceMiles(refLoc, event.location);
  const mapsUrl = event.locationAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(event.locationAddress)}`
    : `https://www.google.com/maps?q=${event.location.lat},${event.location.lng}`;
  const fromSearch = mobileResultsSheetOpen;

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

  const CategoryIcon = getCategoryIcon(event.categories || []);
  const themeEmoji = event.themes?.[0] ? getThemeIcon(event.themes[0]) : null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[1060] bg-white rounded-t-2xl shadow-xl flex flex-col overflow-hidden"
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
        <div className="w-10 h-1 rounded-full bg-gray-300" />
      </div>

      {/* Header: Back (from search) or X (from map) */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
        {fromSearch ? (
          <button
            type="button"
            onClick={handleClose}
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

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Event icon + name row */}
        <div className="px-4 pb-3 flex items-start gap-3">
          <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center bg-white border border-gray-200 shadow-sm">
            {themeEmoji ? (
              <span className="text-2xl">{themeEmoji}</span>
            ) : CategoryIcon ? (
              <CategoryIcon className="text-gray-600" size={28} />
            ) : (
              <span className="text-2xl text-gray-400">📅</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{event.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {event.categories?.[0] && (
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  {themeEmoji ? <span>{themeEmoji}</span> : null}
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
        <div className="flex gap-3 px-4 pb-6">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
          >
            <FiShare2 size={18} />
            share
          </button>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800"
          >
            <FiMapPin size={18} />
            directions · {formatDistance(distance)}
          </a>
          {event.website && (
            <a
              href={event.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
            >
              <FiExternalLink size={18} />
            </a>
          )}
          {event.telephone && (
            <a
              href={`tel:${event.telephone}`}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
            >
              <FiPhone size={18} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
