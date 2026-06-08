import { Platform } from 'react-native';

const PLACES_AUTOCOMPLETE =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const GEOCODE_LOOKUP = 'https://maps.googleapis.com/maps/api/geocode/json';

export type CityPrediction = {
  description: string;
  placeId: string;
};

type LegacyAutocompleteResponse = {
  predictions?: {
    description: string;
    place_id: string;
  }[];
  status: string;
  error_message?: string;
};

type GeocodeResponse = {
  results?: {
    address_components?: {
      long_name: string;
      short_name: string;
      types: string[];
    }[];
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
  }[];
  status: string;
  error_message?: string;
};

export type CityDetails = {
  placeId: string;
  name: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
};

/**
 * City suggestions via Google Places Autocomplete (legacy).
 * Set `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` in `.env`. Enable "Places API" in Google Cloud.
 * Native apps: no CORS issues. Web: often blocked by CORS — use a server proxy in production.
 */
export async function fetchCityPredictions(
  input: string
): Promise<CityPrediction[]> {
  const key = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!key?.trim()) {
    return [];
  }
  const q = input.trim();
  if (q.length < 2) {
    return [];
  }
  if (Platform.OS === 'web') {
    // Browser CORS usually blocks direct calls; fall back to manual city entry on web.
    return [];
  }

  const params = new URLSearchParams({
    input: q,
    types: '(cities)',
    key,
  });
  const res = await fetch(`${PLACES_AUTOCOMPLETE}?${params.toString()}`);
  const json = (await res.json()) as LegacyAutocompleteResponse;

  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    console.warn('[google-places]', json.status, json.error_message);
    return [];
  }

  const list = json.predictions ?? [];
  return list.map((p) => ({
    description: p.description,
    placeId: p.place_id,
  }));
}

export async function fetchCityDetails(
  placeId: string
): Promise<CityDetails | null> {
  const key = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!key?.trim()) {
    return null;
  }
  const id = placeId.trim();
  if (!id) {
    return null;
  }

  const params = new URLSearchParams({
    place_id: id,
    key,
  });
  const res = await fetch(`${GEOCODE_LOOKUP}?${params.toString()}`);
  const json = (await res.json()) as GeocodeResponse;

  if (json.status !== 'OK') {
    console.warn('[google-places geocode]', json.status, json.error_message);
    return null;
  }

  const first = json.results?.[0];
  const location = first?.geometry?.location;
  if (!first || !location) {
    return null;
  }

  const components = first.address_components ?? [];
  const byType = (type: string) =>
    components.find((component) => component.types.includes(type))?.long_name ??
    null;

  const cityName =
    byType('locality') ??
    byType('administrative_area_level_2') ??
    byType('administrative_area_level_1');
  const stateName = byType('administrative_area_level_1');
  const countryName = byType('country');

  if (!cityName || !stateName || !countryName) {
    return null;
  }

  return {
    placeId: id,
    name: cityName,
    state: stateName,
    country: countryName,
    latitude: location.lat,
    longitude: location.lng,
  };
}
