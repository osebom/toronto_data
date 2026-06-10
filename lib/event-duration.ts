import { Event } from '@/types';

export type EventDurationType = 'single' | 'weekend' | 'ongoing';
export type DurationFilter = 'all' | EventDurationType;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Classify an event by how long it runs:
 * - 'single'  : starts and ends on the same calendar day
 * - 'weekend' : a short multi-day run (2–3 calendar days)
 * - 'ongoing' : a longer run (4+ days), e.g. exhibitions open for weeks or months
 *
 * Events with unparseable dates are treated as 'ongoing' so they are never
 * silently dropped from the broader buckets.
 */
export function getEventDurationType(event: Pick<Event, 'startDate' | 'endDate'>): EventDurationType {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'ongoing';
  }

  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const spanDays = Math.round((endDay.getTime() - startDay.getTime()) / MS_PER_DAY);

  if (spanDays <= 0) return 'single';
  if (spanDays <= 3) return 'weekend';
  return 'ongoing';
}

export function matchesDurationFilter(
  event: Pick<Event, 'startDate' | 'endDate'>,
  filter: DurationFilter
): boolean {
  if (filter === 'all') return true;
  return getEventDurationType(event) === filter;
}
