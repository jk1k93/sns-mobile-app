import { apiFetchAuth } from '@/lib/api';

type UserRef = string | { name: string; phone: string };

export type TeamUserSummary = {
  id: string;
  name: string | null;
  phoneNumber: string;
  email: string | null;
};

export type TeamDetail = {
  id: string;
  tournamentId: string;
  name: string;
  shortCode: string | null;
  logoUrl: string | null;
  captainId: string | null;
  viceCaptainId: string | null;
  ownerId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  captain: TeamUserSummary | null;
  viceCaptain: TeamUserSummary | null;
  owner: TeamUserSummary | null;
};

export type CreateTeamPayload = {
  name: string;
  shortCode?: string;
  logoUrl?: string;
  captain?: UserRef;
  viceCaptain?: UserRef;
  owner?: UserRef;
};

export type UpdateTeamPayload = {
  name?: string;
  shortCode?: string;
  logoUrl?: string | null;
  captain?: UserRef | null;
  viceCaptain?: UserRef | null;
  owner?: UserRef | null;
};

export type Team = {
  id: string;
  name: string;
  shortCode: string | null;
  logoUrl: string | null;
  tournamentId: string;
};

export async function fetchTeam(tournamentId: string, teamId: string): Promise<TeamDetail> {
  const { data } = await apiFetchAuth<{ message: string; data: TeamDetail }>(
    `/tournaments/${tournamentId}/teams/${teamId}`,
    { method: 'GET' }
  );
  return data;
}

export async function createTeam(tournamentId: string, payload: CreateTeamPayload): Promise<Team> {
  const { data } = await apiFetchAuth<{ message: string; data: Team }>(
    `/tournaments/${tournamentId}/teams`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return data;
}

export async function updateTeam(tournamentId: string, teamId: string, payload: UpdateTeamPayload): Promise<Team> {
  const { data } = await apiFetchAuth<{ message: string; data: Team }>(
    `/tournaments/${tournamentId}/teams/${teamId}`,
    { method: 'PATCH', body: JSON.stringify(payload) }
  );
  return data;
}

export async function deleteTeam(tournamentId: string, teamId: string): Promise<void> {
  await apiFetchAuth(
    `/tournaments/${tournamentId}/teams/${teamId}`,
    { method: 'DELETE' }
  );
}
