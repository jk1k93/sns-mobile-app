import { apiFetchAuth } from '@/lib/api';

type City = {
  id: string;
  name: string;
  state: string;
  country: string;
  placeId: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
};

type VenueWithCity = {
  id: string;
  name: string;
  cityId: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  city: City;
};

type SearchVenuesResponse = {
  message: string;
  data: VenueWithCity[];
};

type CreateVenueResponse = {
  message: string;
  data: VenueWithCity;
};

export type Venue = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
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

function toVenue(v: VenueWithCity): Venue {
  return {
    id: v.id,
    name: v.name,
    city: v.city.name,
    address: v.address,
  };
}

export async function fetchVenues(q?: string): Promise<Venue[]> {
  const query = q?.trim();
  const path = query
    ? `/venues/search?q=${encodeURIComponent(query)}`
    : '/venues/search';
  const { data } = await apiFetchAuth<SearchVenuesResponse>(path, { method: 'GET' });
  return data.map(toVenue);
}

export async function createVenue(payload: CreateVenuePayload): Promise<Venue> {
  const { data } = await apiFetchAuth<CreateVenueResponse>('/venues', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return toVenue(data);
}
