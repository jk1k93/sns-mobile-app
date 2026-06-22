import { apiFetchAuth, ApiError } from '@/lib/api';
import type { JerseySize } from '@/api/players';

export type UserSummary = {
  id: string;
  name: string | null;
  phoneNumber: string;
  email: string | null;
};

export type CricketPlayerProfileSummary = {
  id: string;
  roleId: string | null;
  role: { id: string; name: string } | null;
  battingHand: 'LEFT' | 'RIGHT' | null;
  bowlingHand: 'LEFT' | 'RIGHT' | null;
  jerseyNumber: number | null;
  jerseySize: JerseySize | null;
};

export type UserSearchResult = UserSummary & {
  cricketPlayerProfile?: CricketPlayerProfileSummary | null;
};

export async function searchUserByPhone(phone: string, sportId?: string): Promise<UserSearchResult | null> {
  try {
    const params = new URLSearchParams({ phone });
    if (sportId) params.set('sportId', sportId);
    const result = await apiFetchAuth<{ message: string; data: UserSearchResult }>(
      `/profile/search?${params.toString()}`,
      { method: 'GET' }
    );
    return result.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
