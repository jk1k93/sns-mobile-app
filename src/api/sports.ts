import { apiFetch } from '@/lib/api';

export type Sport = {
  id: string;
  name: string;
};

function parseSportsList(data: unknown): Sport[] {
  if (Array.isArray(data)) {
    return data as Sport[];
  }
  if (data && typeof data === 'object' && 'data' in data) {
    const inner = (data as { data: unknown }).data;
    if (Array.isArray(inner)) {
      return inner as Sport[];
    }
  }
  return [];
}

export async function fetchSports(): Promise<Sport[]> {
  const data = await apiFetch<unknown>('/sports', { method: 'GET' });
  return parseSportsList(data);
}
