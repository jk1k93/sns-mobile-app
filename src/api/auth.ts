import { apiFetch, apiFetchAuth } from '@/lib/api';

export type User = {
  id: string;
  name: string | null;
  phoneNumber: string;
  email: string | null;
  gender: string | null;
  /** Optional until backend supports it on profile. */
  dateOfBirth?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LoginOtpResponse = {
  message: string;
  phoneNumber: string;
  otp: string;
  expiresAt: string;
};

export type VerifyOtpResponse = {
  token: string;
  newUser: boolean;
  user: User;
};

export function requestLoginOtp(phoneNumber: string) {
  return apiFetch<LoginOtpResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  });
}

export function verifyOtp(phoneNumber: string, otp: string) {
  return apiFetch<VerifyOtpResponse>('/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, otp }),
  });
}

export type ProfileFetchResult = {
  newUser: boolean;
  user: User;
};

function parseProfileResponse(data: unknown): ProfileFetchResult {
  if (data && typeof data === 'object' && 'data' in data) {
    const inner = (data as { data: unknown }).data;
    if (inner && typeof inner === 'object' && 'user' in inner) {
      const d = inner as { newUser?: boolean; user: User };
      return {
        newUser: Boolean(d.newUser),
        user: d.user,
      };
    }
  }
  if (data && typeof data === 'object' && 'user' in data && !('data' in data)) {
    const wrapped = data as { user: User };
    return { newUser: false, user: wrapped.user };
  }
  return { newUser: false, user: data as User };
}

export async function fetchProfile(token: string): Promise<ProfileFetchResult> {
  const data = await apiFetchAuth<unknown>('/profile', token, { method: 'GET' });
  return parseProfileResponse(data);
}

/** Form → `PATCH /profile` (UI uses male/female; API uses M/F). */
export type ProfileCompletionPayload = {
  name: string;
  email: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
};

/**
 * JSON body for PATCH /profile.
 * Optional fields are omitted when unchanged; `null` clears email or dateOfBirth.
 */
export type PatchProfileBody = {
  name: string;
  gender: 'M' | 'F';
  email?: string | null;
  dateOfBirth?: string | null;
};

function canonicalDateOfBirth(value: string | null | undefined): string {
  if (value == null) return '';
  const t = value.trim();
  if (!t) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return t;
}

/** Converts user input to YYYY-MM-DD when possible; otherwise returns trimmed string (API may 400). */
function formDateToApiFormat(formInput: string): string {
  const t = formInput.trim();
  if (!t) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    return `${m[3]}-${mm}-${dd}`;
  }
  return t;
}

/**
 * name + gender always sent (required).
 * email / dateOfBirth: omit if unchanged; `null` clears; string updates.
 */
export function buildProfilePatchBody(
  currentUser: User | null,
  payload: ProfileCompletionPayload
): PatchProfileBody {
  const name = payload.name.trim();
  if (!name) {
    throw new Error('Name is required');
  }

  const gender: 'M' | 'F' = payload.gender === 'female' ? 'F' : 'M';

  const body: PatchProfileBody = { name, gender };

  const emailTrim = payload.email.trim();
  const prevEmail = (currentUser?.email ?? '').trim();
  if (emailTrim !== prevEmail) {
    body.email = emailTrim === '' ? null : emailTrim;
  }

  const dobTrim = payload.dateOfBirth.trim();
  const prevDob = canonicalDateOfBirth(currentUser?.dateOfBirth ?? null);
  if (!dobTrim) {
    if (prevDob) {
      body.dateOfBirth = null;
    }
  } else {
    const nextDob = formDateToApiFormat(dobTrim);
    if (nextDob !== prevDob) {
      body.dateOfBirth = nextDob;
    }
  }

  return body;
}

export async function saveProfile(
  token: string,
  body: PatchProfileBody
): Promise<ProfileFetchResult> {
  const data = await apiFetchAuth<unknown>('/profile', token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return parseProfileResponse(data);
}
