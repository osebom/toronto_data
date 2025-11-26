import { Event, EventPartnership, Location } from '@/types';

interface ApiEventLocation {
  location_name: string;
  location_address: string;
  location_gps: string; // JSON string like '[{"gps_lat":43.59765460000001,"gps_lng":-79.5158459}]'
}

interface ApiPartnership {
  text?: string;
  value?: string;
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
  event_features?: string[];
  partnerships?: ApiPartnership[];
  accessible_event?: string;
  reservations_required?: string;
  event_price?: string | null;
  event_price_low?: string | number | null;
  event_price_high?: string | number | null;
  event_theme?: string[] | string | null;
}

/**
 * Parse GPS coordinates from the location_gps JSON string
 */
function parseGPS(locationGPS: string): Location | null {
  if (!locationGPS || typeof locationGPS !== 'string' || locationGPS.trim() === '') {
    return null;
  }
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

function normalizePartnershipRole(role?: string): string {
  if (!role) return 'Partner';
  const map: Record<string, string> = {
    event_presented_by: 'Presented by',
    event_sponsored_by: 'Sponsored by',
    event_supported_by: 'Supported by',
  };
  return map[role] || 'Partner';
}

function parsePartnerships(partnerships?: ApiPartnership[]): EventPartnership[] {
  if (!partnerships) return [];
  return partnerships
    .map((partner) => {
      const name = partner.text?.trim();
      if (!name) return null;
      return {
        role: normalizePartnershipRole(partner.value),
        name,
      };
    })
    .filter((partner): partner is EventPartnership => partner !== null);
}

function parseThemes(themeValue?: string[] | string | null): string[] {
  if (!themeValue) return [];
  if (Array.isArray(themeValue)) {
    return themeValue.map((theme) => theme.trim()).filter(Boolean);
  }
  return themeValue
    .split(',')
    .map((theme) => theme.trim())
    .filter(Boolean);
}

function parsePriceValue(value?: string | number | null): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPriceRange(low?: number | null, high?: number | null): string | null {
  if (low == null && high == null) return null;
  if (low != null && high != null) {
    if (low === high) return `$${low.toFixed(2)}`;
    return `$${low.toFixed(2)} - $${high.toFixed(2)}`;
  }
  const value = low ?? high;
  if (value == null) return null;
  return `$${value.toFixed(2)}`;
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

  const priceLow = parsePriceValue(apiEvent.event_price_low);
  const priceHigh = parsePriceValue(apiEvent.event_price_high);

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
    features: apiEvent.event_features?.filter(Boolean) || [],
    partnerships: parsePartnerships(apiEvent.partnerships),
    isAccessible: apiEvent.accessible_event === 'Yes',
    reservationsRequired: apiEvent.reservations_required === 'Yes',
    price: apiEvent.event_price ?? formatPriceRange(priceLow, priceHigh),
    priceLow,
    priceHigh,
    themes: parseThemes(apiEvent.event_theme),
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
