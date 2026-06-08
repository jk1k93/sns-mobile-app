import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { apiFetch, apiFetchAuth } from '@/lib/api';

dayjs.extend(customParseFormat);

export type User = {
  id: string;
  name: string | null;
  phoneNumber: string;
  email: string | null;
  gender: 'M' | 'F' | null;
  dateOfBirth: string | null;
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

type ProfileResponse = {
  message: string;
  data: {
    newUser: boolean;
    user: User;
  };
};

export async function fetchProfile(token: string): Promise<ProfileFetchResult> {
  const { data } = await apiFetchAuth<ProfileResponse>('/profile', token, { method: 'GET' });
  return data;
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

const DATE_FORMATS = ['YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY'];

function toIsoDate(value: string): string {
  const t = value.trim();
  if (!t) return '';
  for (const fmt of DATE_FORMATS) {
    const d = dayjs(t, fmt, true);
    if (d.isValid()) return d.format('YYYY-MM-DD');
  }
  return t;
}

function canonicalDateOfBirth(value: string | null): string {
  if (value == null) return '';
  return toIsoDate(value);
}

/** Converts user input to YYYY-MM-DD when possible; otherwise returns trimmed string (API may 400). */
function formDateToApiFormat(formInput: string): string {
  return toIsoDate(formInput);
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
  const { data } = await apiFetchAuth<ProfileResponse>('/profile', token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return data;
}
