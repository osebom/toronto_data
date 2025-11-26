import { Event } from '@/types';

export const TORONTO_EVENTS_ENDPOINT =
  'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/9201059e-43ed-4369-885e-0b867652feac/resource/8900fdb2-7f6c-4f50-8581-b463311ff05d/download/file.json';

const LOCAL_EVENTS_API = '/api/events';

interface TorontoEventsResponse {
  events?: Event[];
}

export async function fetchTorontoEvents(signal?: AbortSignal): Promise<Event[]> {
  const response = await fetch(LOCAL_EVENTS_API, {
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events (${response.status})`);
  }

  const payload = (await response.json()) as TorontoEventsResponse;
  return Array.isArray(payload.events) ? payload.events : [];
}
