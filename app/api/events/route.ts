import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { TORONTO_EVENTS_ENDPOINT } from '@/lib/fetch-events';
import { filterEventsWithinNextMonth } from '@/lib/event-window';
import { parseEvents } from '@/lib/parse-events';
import { Event } from '@/types';

interface TorontoApiResponse {
  value?: unknown;
}

function dedupeEventsByName(events: Event[]): Event[] {
  const map = new Map<string, Event>();

  events.forEach((event) => {
    const key = event.name.trim().toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, event);
      return;
    }

    const existingTime = new Date(existing.startDate).getTime();
    const candidateTime = new Date(event.startDate).getTime();

    if (Number.isNaN(existingTime) && !Number.isNaN(candidateTime)) {
      map.set(key, event);
      return;
    }

    if (!Number.isNaN(candidateTime) && candidateTime < existingTime) {
      map.set(key, event);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

const getCachedEvents = unstable_cache(
  async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const upstreamResponse = await fetch(TORONTO_EVENTS_ENDPOINT, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!upstreamResponse.ok) {
        throw new Error(`Upstream request failed with status ${upstreamResponse.status}`);
      }

      const payload = (await upstreamResponse.json()) as TorontoApiResponse;
      const rows = Array.isArray(payload.value) ? payload.value : [];
      // Type assertion needed here as the API response structure is dynamic
      const parsedEvents = parseEvents(rows as Parameters<typeof parseEvents>[0]);

      const filteredEvents = filterEventsWithinNextMonth<Event>(
        parsedEvents,
        (event) => event.startDate,
        (event) => event.endDate
      );

      return dedupeEventsByName(filteredEvents);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout: External API took too long to respond');
      }
      throw error;
    }
  },
  ['toronto-events-next-month'],
  { revalidate: 3600 }
);

export async function GET() {
  try {
    const events = await getCachedEvents();
    const origin = process.env.ALLOWED_ORIGIN || '*';
    return NextResponse.json(
      { events },
      {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch Toronto events:', error);
    return NextResponse.json(
      { error: 'Unable to fetch events at this time.' },
      { status: 500 }
    );
  }
}
