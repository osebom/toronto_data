'use client';

import { useStore } from '@/store/useStore';
import type { DurationFilter as DurationFilterValue } from '@/lib/event-duration';

const OPTIONS: Array<{ value: DurationFilterValue; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'single', label: 'Single day' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'ongoing', label: 'Ongoing' },
];

interface DurationFilterProps {
  /** 'light' for use over the map, 'dark' for the desktop sidebar. */
  variant?: 'light' | 'dark';
  className?: string;
}

export default function DurationFilter({ variant = 'light', className = '' }: DurationFilterProps) {
  const { durationFilter, setDurationFilter } = useStore();

  const isLight = variant === 'light';
  const containerClass = isLight
    ? 'bg-white/90 backdrop-blur-md border border-white/60 shadow-lg'
    : 'bg-white/5 border border-white/10';

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full p-1 ${containerClass} ${className}`}
      role="group"
      aria-label="Filter events by duration"
    >
      {OPTIONS.map((option) => {
        const active = durationFilter === option.value;
        const activeClass = isLight
          ? 'bg-emerald-600 text-white'
          : 'bg-emerald-500 text-white';
        const inactiveClass = isLight
          ? 'text-gray-700 hover:bg-black/5'
          : 'text-white/80 hover:bg-white/10';

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setDurationFilter(option.value)}
            aria-pressed={active}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              active ? activeClass : inactiveClass
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
