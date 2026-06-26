import { apiFetchAuth, ApiError } from '@/lib/api';
import type { GroundType, BallType } from '@/contexts/tournament-draft-context';

export type CricketConfig = {
  id: string;
  tournamentId: string;
  groundType: GroundType;
  ballType: BallType;
  numberOfTeams: number;
  playersPerTeam: number;
  auctionBased: boolean;
  auctionPurse: number | null;
  playerBasePrice: number | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

type CricketConfigResponse = {
  message: string;
  data: CricketConfig;
};

export type CreateCricketConfigPayload = {
  groundType: GroundType;
  ballType: BallType;
  numberOfTeams: number;
  playersPerTeam: number;
  auctionBased?: boolean;
  auctionPurse?: number;
  playerBasePrice?: number;
};

export type UpdateCricketConfigPayload = Partial<CreateCricketConfigPayload>;

export async function createCricketConfig(
  tournamentId: string,
  payload: CreateCricketConfigPayload
): Promise<CricketConfig> {
  const { data } = await apiFetchAuth<CricketConfigResponse>(
    `/tournaments/${tournamentId}/cricket-config`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return data;
}

export async function updateCricketConfig(
  tournamentId: string,
  payload: UpdateCricketConfigPayload
): Promise<CricketConfig> {
  const { data } = await apiFetchAuth<CricketConfigResponse>(
    `/tournaments/${tournamentId}/cricket-config`,
    { method: 'PATCH', body: JSON.stringify(payload) }
  );
  return data;
}

export async function getCricketConfig(tournamentId: string): Promise<CricketConfig | null> {
  try {
    const { data } = await apiFetchAuth<CricketConfigResponse>(
      `/tournaments/${tournamentId}/cricket-config`,
      { method: 'GET' }
    );
    return data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
