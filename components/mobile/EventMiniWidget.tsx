'use client';

import { format } from 'date-fns';
import { Event } from '@/types';
import { getCategoryIcon } from '@/lib/category-icons';
import { getThemeIcon } from '@/lib/event-metadata';

interface EventMiniWidgetProps {
  event: Event;
  onTap: () => void;
}

function formatEventDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

function formatTime(dateString: string): string {
  try {
    return format(new Date(dateString), 'HH.mm');
  } catch {
    return '';
  }
}

function isSameDay(startDate: string, endDate: string): boolean {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start.toDateString() === end.toDateString();
  } catch {
    return true;
  }
}

export default function EventMiniWidget({ event, onTap }: EventMiniWidgetProps) {
  const CategoryIcon = getCategoryIcon(event.categories || []);
  const themeEmoji = event.themes?.[0] ? getThemeIcon(event.themes[0]) : null;
  const startLabel = formatEventDate(event.startDate);
  const endLabel = formatEventDate(event.endDate);
  const timeLabel = formatTime(event.startDate);
  const sameDay = isSameDay(event.startDate, event.endDate);
  const dateTimeLabel = sameDay
    ? (timeLabel ? `${startLabel} · ${timeLabel}` : startLabel)
    : `${startLabel} – ${endLabel}`;

  return (
    <button
      type="button"
      onClick={onTap}
      className="flex-shrink-0 w-[168px] rounded-3xl bg-white border border-gray-200/80 shadow-sm overflow-hidden text-left active:scale-[0.98] transition-transform flex flex-col p-4"
    >
      {/* Top: title + subtitle */}
      <div className="flex flex-col gap-1 flex-1 min-h-0">
        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug">
          {event.name}
        </h3>
        <p className="text-[10px] text-gray-500 tabular-nums whitespace-nowrap truncate">
          {dateTimeLabel}
        </p>
      </div>
      {/* Bottom: event icon left, FREE/PAID label bottom-right */}
      <div className="mt-4 flex items-end justify-between w-full">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-sky-100 text-2xl shadow-inner flex-shrink-0">
          {themeEmoji ? (
            <span aria-hidden>{themeEmoji}</span>
          ) : CategoryIcon ? (
            <CategoryIcon className="text-emerald-600" size={26} />
          ) : (
            <span>📅</span>
          )}
        </div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${
            event.isFree ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {event.isFree ? 'FREE' : 'PAID'}
        </span>
      </div>
    </button>
  );
}
