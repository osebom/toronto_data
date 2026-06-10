import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { TORONTO_EVENTS_ENDPOINT } from '@/lib/fetch-events';
import { filterEventsWithinNextMonth } from '@/lib/event-window';
import { parseEvents } from '@/lib/parse-events';
import { Event } from '@/types';
import fallbackEventsData from '@/lib/fallback-events.json';

// Real dataset snapshot, served when the upstream Toronto API is unreachable
// (e.g. it IP-blocks datacenter hosts like Vercel, returning "Access Denied").
const fallbackEvents = fallbackEventsData as unknown as Event[];

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

      const deduped = dedupeEventsByName(filteredEvents);

      // If upstream responded but yielded nothing usable, fall back to the snapshot.
      return deduped.length > 0 ? deduped : fallbackEvents;
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
  const origin = process.env.ALLOWED_ORIGIN || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const events = await getCachedEvents();
    return NextResponse.json({ events }, { headers: corsHeaders });
  } catch (error) {
    // The upstream Toronto API blocks some hosts (e.g. datacenter IPs on
    // deployments) with "Access Denied". Rather than failing the whole app,
    // serve the bundled real-data snapshot so every client sees the same set.
    console.error('Failed to fetch Toronto events, serving fallback snapshot:', error);
    return NextResponse.json({ events: fallbackEvents }, { headers: corsHeaders });
  }
}
