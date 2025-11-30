'use client';

import { useStore } from '@/store/useStore';
import { Event } from '@/types';
import { format } from 'date-fns';
import { calculateDistanceMiles, formatDistance } from '@/lib/utils';
import { TORONTO_CENTER_LOCATION } from '@/lib/dummy-data';
import { getFeatureIcon, getThemeIcon } from '@/lib/event-metadata';
import { getCategoryIcon } from '@/lib/category-icons';
import { IconType } from 'react-icons';
import React from 'react';

type IconComponentProps = {
  size?: number;
  className?: string;
  [key: string]: any;
};

export default function EventList() {
  const { filteredEvents, setSelectedEvent, selectedEvent, userLocation, isLoadingEvents, eventsLoadedCount, totalEventsCount } = useStore();
  const events = filteredEvents();
  
  // Use user's location if available, otherwise fall back to Toronto center
  const referenceLocation = userLocation || TORONTO_CENTER_LOCATION;

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const getEventIconComponent = (event: Event): IconType | React.ComponentType<IconComponentProps> | null => {
    if (event.categories && event.categories.length > 0) {
      return getCategoryIcon(event.categories);
    }
    return null;
  };

  return (
    <div className="p-4 space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          onClick={() => setSelectedEvent(event)}
          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
            selectedEvent?.id === event.id
              ? 'bg-green-500/20 border border-green-500'
              : 'bg-dark-card hover:bg-gray-700'
          }`}
        >
          {/* Event Icon */}
          <div className="relative w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center flex-shrink-0 shadow-sm">
            {(() => {
              const Icon = getEventIconComponent(event);
              if (Icon) {
                return (
                  <div className="flex items-center justify-center" style={{ width: '70%', height: '70%', padding: 0 }}>
                    <Icon className="text-gray-900" size={15} />
                  </div>
                );
              }
              return (
              <span className="text-gray-900 text-xl">
                {event.themes?.[0] ? getThemeIcon(event.themes[0]) : '📅'}
              </span>
              );
            })()}
          </div>

          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{event.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
              <span className="truncate">{event.locationName}</span>
              <span>•</span>
              <span>{formatDistance(calculateDistanceMiles(referenceLocation, event.location))}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span>{formatEventDate(event.startDate)}</span>
              {event.startDate !== event.endDate && (
                <>
                  <span>•</span>
                  <span>{formatEventDate(event.endDate)}</span>
                </>
              )}
            </div>
            {event.categories && event.categories.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {event.categories.slice(0, 2).map((category, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}

            {event.shortDescription && (
              <p
                className="text-xs text-gray-400 mt-2"
                style={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  overflow: 'hidden',
                }}
              >
                {event.shortDescription}
              </p>
            )}

            {event.themes && event.themes.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {event.themes.slice(0, 3).map((theme) => (
                  <span
                    key={theme}
                    className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded flex items-center gap-1"
                  >
                    <span>{getThemeIcon(theme)}</span>
                    {theme}
                  </span>
                ))}
              </div>
            )}

            {event.features && event.features.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {event.features.slice(0, 3).map((feature) => (
                  <span
                    key={feature}
                    className="text-xs px-2 py-0.5 bg-gray-800 text-gray-200 rounded flex items-center gap-1"
                  >
                    <span>{getFeatureIcon(feature)}</span>
                    {feature}
                  </span>
                ))}
              </div>
            )}

            {(event.isAccessible || event.reservationsRequired || event.price) && (
              <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                {event.price && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-200 rounded border border-blue-500/40">
                    {event.price}
                  </span>
                )}
                {event.isAccessible && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-200 rounded border border-purple-500/40 flex items-center gap-1">
                    <span>♿</span>
                    Accessible
                  </span>
                )}
                {event.reservationsRequired && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-200 rounded border border-amber-500/40 flex items-center gap-1">
                    <span>📝</span>
                    Reservations
                  </span>
                )}
              </div>
            )}

            {event.partnerships && event.partnerships.length > 0 && (
              <div className="text-[11px] text-gray-400 mt-2 space-y-0.5">
                {event.partnerships.map((partner, idx) => (
                  <div key={`${partner.name}-${idx}`}>
                    <span className="text-gray-500">{partner.role}:</span> {partner.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Free/Paid Badge */}
          <div className="flex-shrink-0">
            <span
              className={`text-xs px-2 py-1 rounded font-semibold ${
                event.isFree
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              }`}
            >
              {event.isFree ? 'FREE' : 'PAID'}
            </span>
          </div>
        </div>
      ))}

      {events.length === 0 && !isLoadingEvents && (
        <div className="text-center text-gray-400 py-8">
          No events found
        </div>
      )}

      {isLoadingEvents && (
        <div className="mt-4 p-4 bg-dark-card border border-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-300 font-medium">
                Loading more events...
              </div>
              {totalEventsCount > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {eventsLoadedCount} of {totalEventsCount} loaded
                </div>
              )}
              {totalEventsCount > 0 && (
                <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min((eventsLoadedCount / totalEventsCount) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isLoadingEvents && totalEventsCount > 0 && eventsLoadedCount === totalEventsCount && events.length > 0 && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>All {totalEventsCount} events loaded</span>
          </div>
        </div>
      )}
    </div>
  );
}
