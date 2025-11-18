import { Event, Location } from '@/types';

interface ApiEventLocation {
  location_name: string;
  location_address: string;
  location_gps: string; // JSON string like '[{"gps_lat":43.59765460000001,"gps_lng":-79.5158459}]'
}

interface ApiEvent {
  id: string;
  event_name: string;
  short_name?: string;
  event_description: string;
  short_description?: string;
  event_locations: ApiEventLocation[];
  event_category: string[];
  event_startdate: string;
  event_enddate: string;
  free_event: string; // 'Yes' or 'No'
  event_image?: Array<{
    bin_id?: string;
    file_name?: string;
  }>;
  event_website?: string;
  event_email?: string;
  event_telephone?: string;
}

/**
 * Parse GPS coordinates from the location_gps JSON string
 */
function parseGPS(locationGPS: string): Location | null {
  try {
    const parsed = JSON.parse(locationGPS);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first = parsed[0];
      if (first.gps_lat && first.gps_lng) {
        return {
          lat: parseFloat(first.gps_lat),
          lng: parseFloat(first.gps_lng),
        };
      }
    }
  } catch (error) {
    console.error('Error parsing GPS:', error);
  }
  return null;
}

/**
 * Get image URL from event image data
 */
function getImageUrl(eventImage?: Array<{ bin_id?: string; file_name?: string }>): string | undefined {
  if (!eventImage || eventImage.length === 0) return undefined;
  const image = eventImage[0];
  if (image.bin_id) {
    // Construct image URL - adjust this based on actual API image URL structure
    return `https://secure.toronto.ca/c3api_data/v2/DataAccess.svc/festivals_events/images/${image.bin_id}`;
  }
  return undefined;
}

/**
 * Parse API event data into our Event format
 */
export function parseEvent(apiEvent: ApiEvent): Event | null {
  // Get the first location with valid GPS coordinates
  const locationWithGPS = apiEvent.event_locations?.find((loc) => {
    const gps = parseGPS(loc.location_gps);
    return gps !== null;
  });

  if (!locationWithGPS) {
    console.warn(`Event ${apiEvent.event_name} has no valid GPS coordinates`);
    return null;
  }

  const gps = parseGPS(locationWithGPS.location_gps);
  if (!gps) return null;

  return {
    id: apiEvent.id,
    name: apiEvent.event_name,
    shortName: apiEvent.short_name,
    description: apiEvent.event_description,
    shortDescription: apiEvent.short_description,
    location: gps,
    locationName: locationWithGPS.location_name,
    locationAddress: locationWithGPS.location_address,
    categories: apiEvent.event_category || [],
    startDate: apiEvent.event_startdate,
    endDate: apiEvent.event_enddate,
    isFree: apiEvent.free_event === 'Yes',
    imageUrl: getImageUrl(apiEvent.event_image),
    website: apiEvent.event_website,
    email: apiEvent.event_email,
    telephone: apiEvent.event_telephone,
  };
}

/**
 * Parse an array of API events
 */
export function parseEvents(apiEvents: ApiEvent[]): Event[] {
  return apiEvents
    .map(parseEvent)
    .filter((event): event is Event => event !== null);
}

