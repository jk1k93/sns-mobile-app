import { apiFetchAuth } from '@/lib/api';

export type Sport = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ListSportsResponse = {
  message: string;
  data: Sport[];
};

export async function fetchSports(): Promise<Sport[]> {
  const { data } = await apiFetchAuth<ListSportsResponse>('/sports', { method: 'GET' });
  return data;
}
