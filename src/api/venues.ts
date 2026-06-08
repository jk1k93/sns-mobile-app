import { apiFetchAuth } from '@/lib/api';

export type Venue = {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
};

export type CreateVenuePayload = {
  city: {
    placeId: string;
    name: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  venue: {
    name: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
};

type VenueApiShape = {
  id: string;
  name: string;
  address?: string | null;
  city?:
    | string
    | null
    | {
        name?: string | null;
      };
};

function parseVenuesList(data: unknown): Venue[] {
  if (Array.isArray(data)) {
    return (data as VenueApiShape[]).map(normalizeVenue);
  }
  if (data && typeof data === 'object' && 'data' in data) {
    const inner = (data as { data: unknown }).data;
    if (Array.isArray(inner)) {
      return (inner as VenueApiShape[]).map(normalizeVenue);
    }
  }
  if (data && typeof data === 'object' && 'venues' in data) {
    const inner = (data as { venues: unknown }).venues;
    if (Array.isArray(inner)) {
      return (inner as VenueApiShape[]).map(normalizeVenue);
    }
  }
  return [];
}

function normalizeVenue(input: VenueApiShape): Venue {
  const city =
    typeof input.city === 'string'
      ? input.city
      : input.city?.name
        ? input.city.name
        : null;

  return {
    id: input.id,
    name: input.name,
    city,
    address: input.address ?? null,
  };
}

function parseVenue(data: unknown): Venue {
  if (data && typeof data === 'object' && 'data' in data) {
    const inner = (data as { data: unknown }).data;
    if (inner && typeof inner === 'object' && 'id' in inner) {
      return normalizeVenue(inner as VenueApiShape);
    }
  }
  if (data && typeof data === 'object' && 'venue' in data) {
    const inner = (data as { venue: unknown }).venue;
    if (inner && typeof inner === 'object' && 'id' in inner) {
      return normalizeVenue(inner as VenueApiShape);
    }
  }
  return normalizeVenue(data as VenueApiShape);
}

export async function fetchVenues(token: string, q?: string): Promise<Venue[]> {
  const query = q?.trim();
  const path = query
    ? `/venues/search?q=${encodeURIComponent(query)}`
    : '/venues/search';
  const data = await apiFetchAuth<unknown>(path, token, { method: 'GET' });
  return parseVenuesList(data);
}

export async function createVenue(
  token: string,
  payload: CreateVenuePayload
): Promise<Venue> {
  const data = await apiFetchAuth<unknown>('/venues', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseVenue(data);
}
