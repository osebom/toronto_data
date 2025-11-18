'use client';

import { useStore } from '@/store/useStore';
import { Event } from '@/types';
import { format } from 'date-fns';
import { calculateDistanceMiles, formatDistance } from '@/lib/utils';
import { TORONTO_CENTER_LOCATION } from '@/lib/dummy-data';

export default function EventList() {
  const { filteredEvents, setSelectedEvent, selectedEvent, userLocation } = useStore();
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

  const getEventIcon = (event: Event) => {
    // Use calendar emoji for all events, or could use category-based icons
    return '📅';
  };

  const getEventColor = (event: Event) => {
    return event.isFree ? 'bg-green-500' : 'bg-blue-500';
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
          <div className={`w-12 h-12 rounded-full ${getEventColor(event)} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-xl">
              {getEventIcon(event)}
            </span>
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

      {events.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No events found
        </div>
      )}
    </div>
  );
}

