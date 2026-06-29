import { apiFetchAuth } from '@/lib/api';

export type JerseySize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

export const JERSEY_SIZES: JerseySize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export type TournamentPlayerDetail = {
  id: string;
  tournamentId: string;
  playerId: string;
  teamId: string | null;
  roleId: string | null;
  bidPrice: number | null;
  jerseyNumber: number | null;
  jerseyName: string | null;
  jerseySize: JerseySize | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  player: {
    id: string;
    name: string | null;
    phoneNumber: string;
    email: string | null;
  };
  team: { id: string; name: string; shortCode: string | null } | null;
  role: { id: string; name: string } | null;
};

type CreatePlayerCommonFields = {
  teamId?: string;
  bidPrice?: number;
  roleId?: string;
  jerseyNumber?: number;
  jerseyName?: string;
  jerseySize?: JerseySize;
};

export type CreatePlayerPayload =
  | ({ userId: string } & CreatePlayerCommonFields)
  | ({ phone: string; name: string } & CreatePlayerCommonFields);

export type UpdatePlayerPayload = {
  roleId?: string | null;
  jerseyNumber?: number | null;
  jerseyName?: string | null;
  jerseySize?: JerseySize | null;
};

export async function fetchPlayers(tournamentId: string, teamId?: string): Promise<TournamentPlayerDetail[]> {
  const url = teamId
    ? `/tournaments/${tournamentId}/players?teamId=${encodeURIComponent(teamId)}`
    : `/tournaments/${tournamentId}/players`;
  const { data } = await apiFetchAuth<{ message: string; data: TournamentPlayerDetail[] }>(
    url,
    { method: 'GET' }
  );
  return data;
}

export async function createPlayer(tournamentId: string, payload: CreatePlayerPayload): Promise<TournamentPlayerDetail> {
  const { data } = await apiFetchAuth<{ message: string; data: TournamentPlayerDetail }>(
    `/tournaments/${tournamentId}/players`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return data;
}

export async function updatePlayer(
  tournamentId: string,
  tournamentPlayerId: string,
  payload: UpdatePlayerPayload
): Promise<TournamentPlayerDetail> {
  const { data } = await apiFetchAuth<{ message: string; data: TournamentPlayerDetail }>(
    `/tournaments/${tournamentId}/players/${tournamentPlayerId}`,
    { method: 'PATCH', body: JSON.stringify(payload) }
  );
  return data;
}

export async function deletePlayer(tournamentId: string, playerId: string): Promise<void> {
  await apiFetchAuth<{ message: string }>(
    `/tournaments/${tournamentId}/players/${playerId}`,
    { method: 'DELETE' }
  );
}
