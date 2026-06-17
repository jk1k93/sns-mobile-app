import { apiFetchAuth, ApiError } from '@/lib/api';

export type UserSummary = {
  id: string;
  name: string | null;
  phoneNumber: string;
  email: string | null;
};

export async function searchUserByPhone(
  token: string,
  phone: string
): Promise<UserSummary | null> {
  try {
    const result = await apiFetchAuth<{ message: string; data: UserSummary }>(
      `/profile/search?phone=${encodeURIComponent(phone)}`,
      token,
      { method: 'GET' }
    );
    return result.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
