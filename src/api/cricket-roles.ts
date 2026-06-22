import { apiFetch } from '@/lib/api';

export type CricketRole = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function fetchCricketRoles(activeOnly = true): Promise<CricketRole[]> {
  const params = new URLSearchParams(activeOnly ? { activeOnly: 'true' } : {});
  const { data } = await apiFetch<{ message: string; data: CricketRole[] }>(
    `/cricket-roles?${params.toString()}`,
    { method: 'GET' }
  );
  return data;
}
