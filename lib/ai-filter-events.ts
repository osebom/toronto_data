import { Event } from '@/types';
import { ExtractedFilters } from '@/app/api/ai-search/route';
import { calculateDistanceMiles } from './utils';
import { TORONTO_CENTER_LOCATION } from './dummy-data';
import { Location } from '@/types';

/**
 * Filter events based on extracted AI filters
 * Hard constraints: dates, isFree, isAccessible (must match)
 * Soft constraints: themes, categories (OR logic - event can have any of them)
 */
export function filterEventsWithAIFilters(
  events: Event[],
  filters: ExtractedFilters,
  userLocation?: Location | null
): Event[] {
  let filtered = [...events];

  // Hard constraint: Date range
  if (filters.dateStart || filters.dateEnd) {
    const startBoundary = filters.dateStart ? new Date(filters.dateStart) : null;
    const endBoundary = filters.dateEnd ? new Date(filters.dateEnd) : null;
    
    if (startBoundary) startBoundary.setHours(0, 0, 0, 0);
    if (endBoundary) endBoundary.setHours(23, 59, 59, 999);

    filtered = filtered.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);

      if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime())) {
        return false; // Exclude events with invalid dates when date filter is active
      }

      if (startBoundary && eventEnd < startBoundary) return false;
      if (endBoundary && eventStart > endBoundary) return false;
      return true;
    });
  }

  // Hard constraint: Free/Paid
  if (filters.isFree !== null && filters.isFree !== undefined) {
    filtered = filtered.filter((event) => event.isFree === filters.isFree);
  }

  // Hard constraint: Accessible
  if (filters.isAccessible !== null && filters.isAccessible !== undefined) {
    filtered = filtered.filter((event) => event.isAccessible === filters.isAccessible);
  }

  // Soft constraint: Themes (OR logic - event can have any of the specified themes)
  if (filters.themes && filters.themes.length > 0) {
    filtered = filtered.filter((event) =>
      event.themes.some((theme) => filters.themes!.includes(theme))
    );
  }

  // Soft constraint: Categories (OR logic - event can have any of the specified categories)
  if (filters.categories && filters.categories.length > 0) {
    filtered = filtered.filter((event) =>
      event.categories.some((category) => filters.categories!.includes(category))
    );
  }

  // Soft constraint: Keywords (search in name, description, location)
  if (filters.keywords && filters.keywords.length > 0) {
    filtered = filtered.filter((event) => {
      const searchableText = [
        event.name,
        event.description,
        event.shortDescription,
        event.locationName,
        ...event.themes,
        ...event.categories,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return filters.keywords!.some((keyword) => searchableText.includes(keyword.toLowerCase()));
    });
  }

  return filtered;
}

/**
 * Rank and return top N events
 */
export function rankAndLimitEvents(
  events: Event[],
  maxResults: number,
  userLocation?: Location | null
): Event[] {
  const referenceLocation = userLocation || TORONTO_CENTER_LOCATION;

  // Calculate scores for ranking
  const scoredEvents = events.map((event) => {
    const distance = calculateDistanceMiles(referenceLocation, event.location);
    const startDate = new Date(event.startDate);
    const now = new Date();
    
    // Prefer events that are:
    // 1. Closer to user
    // 2. Starting soon (but not in the past)
    // 3. Free events (slight preference)
    
    let score = 0;
    
    // Distance score (closer = higher score, max 10 miles = 0, 0 miles = 100)
    const distanceScore = Math.max(0, 100 - distance * 10);
    score += distanceScore * 0.4;
    
    // Date score (sooner = higher score, but past events get penalty)
    const daysUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntilStart < 0) {
      score -= 50; // Penalty for past events
    } else if (daysUntilStart <= 7) {
      score += 30; // Bonus for events within a week
    } else if (daysUntilStart <= 30) {
      score += 15; // Bonus for events within a month
    }
    
    // Free event bonus
    if (event.isFree) {
      score += 5;
    }
    
    return { event, score, distance };
  });

  // Sort by score (descending), then by distance
  scoredEvents.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 1) {
      return b.score - a.score;
    }
    return a.distance - b.distance;
  });

  return scoredEvents.slice(0, maxResults).map((item) => item.event);
}

/**
 * Generate a compact summary for an event (minimal token usage)
 */
export function generateEventSummary(event: Event): string {
  const parts: string[] = [];
  
  // Name
  parts.push(event.name);
  
  // Date
  try {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (start.getTime() === end.getTime()) {
      parts.push(`(${startStr})`);
    } else {
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      parts.push(`(${startStr} - ${endStr})`);
    }
  } catch {
    // Skip date if invalid
  }
  
  // Location
  parts.push(`at ${event.locationName}`);
  
  // Price
  if (event.isFree) {
    parts.push('(Free)');
  } else if (event.price) {
    parts.push(`(${event.price})`);
  }
  
  // Primary category
  if (event.categories && event.categories.length > 0) {
    parts.push(`[${event.categories[0]}]`);
  }
  
  return parts.join(' ');
}



