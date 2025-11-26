type DateLike = string | null | undefined;

function parseDate(dateValue: DateLike): Date | null {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function fallsWithinRange(
  eventStart: Date | null,
  eventEnd: Date | null,
  windowStart: Date,
  windowEnd: Date
): boolean {
  if (!eventStart && !eventEnd) return false;
  const start = eventStart ?? eventEnd!;
  const end = eventEnd ?? eventStart!;
  return end >= windowStart && start <= windowEnd;
}

function sortByStartDate<T>(
  items: T[],
  getStart: (item: T) => DateLike,
  getEnd: (item: T) => DateLike
): T[] {
  return items.sort((a, b) => {
    const aStart = parseDate(getStart(a)) ?? parseDate(getEnd(a)) ?? new Date(0);
    const bStart = parseDate(getStart(b)) ?? parseDate(getEnd(b)) ?? new Date(0);
    return aStart.getTime() - bStart.getTime();
  });
}

export function filterEventsWithinNextMonth<T>(
  items: T[],
  getStart: (item: T) => DateLike,
  getEnd: (item: T) => DateLike
): T[] {
  const windowStart = new Date();
  const windowEnd = new Date(windowStart);
  windowEnd.setMonth(windowEnd.getMonth() + 1);

  const filtered = items.filter((item) => {
    const start = parseDate(getStart(item));
    const end = parseDate(getEnd(item));
    return fallsWithinRange(start, end, windowStart, windowEnd);
  });

  return sortByStartDate(filtered, getStart, getEnd);
}
