import { apiFetch, apiFetchAuth } from '@/lib/api';

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

export type CreatePlayerPayload = {
  playerId: string;
  roleId?: string;
  jerseyNumber?: number;
  jerseySize?: JerseySize;
};

export async function fetchPlayers(tournamentId: string): Promise<TournamentPlayerDetail[]> {
  const { data } = await apiFetch<{ message: string; data: TournamentPlayerDetail[] }>(
    `/tournaments/${tournamentId}/players`,
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

export async function deletePlayer(tournamentId: string, playerId: string): Promise<void> {
  await apiFetchAuth<{ message: string }>(
    `/tournaments/${tournamentId}/players/${playerId}`,
    { method: 'DELETE' }
  );
}
