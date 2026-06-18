import { apiFetchAuth } from '@/lib/api';
import type { GeoCoordinates } from '@/lib/types';
import type { CricketConfig } from '@/api/cricket-config';

export type TournamentStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'ARCHIVED';

export type TournamentContactInput =
  | { userId: string }
  | { name: string; phone: string };

export type CreateTournamentPayload = {
  name: string;
  venueId: string;
  sportId: string;
  tournamentStartDate?: string;
  tournamentEndDate?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  description?: string;
  status?: TournamentStatus;
  contacts?: TournamentContactInput[];
};

export type Tournament = {
  id: string;
  name: string;
  status: TournamentStatus;
};

export type TournamentVenue = {
  id: string;
  name: string;
  address: string | null;
  cityId: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  city: {
    id: string;
    name: string;
    state: string;
    country: string;
    placeId: string | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type TournamentListItem = Tournament & {
  venueId: string | null;
  sportId: string;
  tournamentStartDate: string | null;
  tournamentEndDate: string | null;
  venue: TournamentVenue | null;
};

export type TournamentContactDetail = {
  id: string;
  tournamentId: string;
  userId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    phoneNumber: string;
    email: string | null;
  };
};

export type TournamentOrganiser = {
  id: string;
  name: string | null;
  phoneNumber: string;
  email: string | null;
};

export type TournamentSport = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TournamentDetail = TournamentListItem & {
  organiserId: string;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  organiser: TournamentOrganiser;
  sport: TournamentSport;
  contacts: TournamentContactDetail[];
  cricketConfig: CricketConfig | null;
};

export type TournamentFetchResult = {
  tournament: TournamentDetail;
  canUpdate: boolean;
};

type TournamentListResponse = {
  message: string;
  data: TournamentDetail[];
};

type TournamentDetailResponse = {
  message: string;
  data: {
    tournament: TournamentDetail;
    metaData: { canUpdate: boolean };
  };
};

type CreateTournamentResponse = {
  message: string;
  data: Tournament;
};

export async function fetchTournaments(
  sportId: string,
  coords?: GeoCoordinates
): Promise<TournamentDetail[]> {
  const params = new URLSearchParams({ sportId });
  if (coords) {
    params.set('lat', String(coords.lat));
    params.set('lng', String(coords.lng));
  }
  const { data } = await apiFetchAuth<TournamentListResponse>(`/tournaments?${params.toString()}`, {
    method: 'GET',
  });
  return data;
}

export async function fetchTournament(id: string): Promise<TournamentFetchResult> {
  const { data } = await apiFetchAuth<TournamentDetailResponse>(`/tournaments/${id}`, {
    method: 'GET',
  });
  return { tournament: data.tournament, canUpdate: data.metaData.canUpdate };
}

export type UpdateTournamentPayload = Partial<CreateTournamentPayload>;

type UpdateTournamentResponse = {
  message: string;
  data: Tournament;
};

export async function createTournament(payload: CreateTournamentPayload): Promise<Tournament> {
  const { data } = await apiFetchAuth<CreateTournamentResponse>('/tournaments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

export async function updateTournament(id: string, payload: UpdateTournamentPayload): Promise<Tournament> {
  const { data } = await apiFetchAuth<UpdateTournamentResponse>(`/tournaments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data;
}
