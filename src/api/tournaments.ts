import { apiFetchAuth } from '@/lib/api';

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
  city: { id: string; name: string; state: string; country: string } | null;
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
  user: {
    id: string;
    name: string | null;
    phoneNumber: string;
    email: string | null;
  };
};

export type TournamentDetail = TournamentListItem & {
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  description: string | null;
  contacts: TournamentContactDetail[];
};

type TournamentListResponse = {
  message: string;
  data: TournamentListItem[];
};

type TournamentDetailResponse = {
  message: string;
  data: TournamentDetail;
};

type CreateTournamentResponse = {
  message: string;
  data: Tournament;
};

export async function fetchTournaments(token: string): Promise<TournamentListItem[]> {
  const { data } = await apiFetchAuth<TournamentListResponse>('/tournaments', token, {
    method: 'GET',
  });
  return data;
}

export async function fetchTournament(token: string, id: string): Promise<TournamentDetail> {
  const { data } = await apiFetchAuth<TournamentDetailResponse>(`/tournaments/${id}`, token, {
    method: 'GET',
  });
  return data;
}

export type UpdateTournamentPayload = Partial<CreateTournamentPayload>;

type UpdateTournamentResponse = {
  message: string;
  data: Tournament;
};

export async function createTournament(
  token: string,
  payload: CreateTournamentPayload
): Promise<Tournament> {
  const { data } = await apiFetchAuth<CreateTournamentResponse>('/tournaments', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

export async function updateTournament(
  token: string,
  id: string,
  payload: UpdateTournamentPayload
): Promise<Tournament> {
  const { data } = await apiFetchAuth<UpdateTournamentResponse>(`/tournaments/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data;
}
