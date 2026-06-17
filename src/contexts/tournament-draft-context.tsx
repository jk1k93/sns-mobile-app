import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { Venue } from '@/api/venues';

export type DraftContact = {
  userId?: string;
  name: string;
  phone: string;
};

export type GroundType = 'BOX' | 'OPEN';
export type BallType = 'TENNIS' | 'LEATHER';

export type CricketDetails = {
  groundType: GroundType | null;
  ballType: BallType | null;
  numberOfTeams: string;
  playersPerTeam: string;
  isAuctionBased: boolean | null;
};

export type TournamentDraft = {
  name: string;
  startDate: string | null;
  endDate: string | null;
  venue: Venue | null;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  description: string;
  contacts: DraftContact[];
  cricketDetails: CricketDetails;
  /** Set once step 1 has been submitted; identifies the already-created tournament. */
  tournamentId: string | null;
  /** Set once step 2 has been submitted; identifies the saved cricket config. */
  cricketConfigId: string | null;
};

type TournamentDraftContextValue = {
  draft: TournamentDraft;
  setName: (v: string) => void;
  setStartDate: (iso: string | null) => void;
  setEndDate: (iso: string | null) => void;
  setVenue: (v: Venue | null) => void;
  setRegistrationStartDate: (iso: string | null) => void;
  setRegistrationEndDate: (iso: string | null) => void;
  setDescription: (v: string) => void;
  addContact: (contact: DraftContact) => void;
  removeContact: (phone: string) => void;
  setGroundType: (v: GroundType | null) => void;
  setBallType: (v: BallType | null) => void;
  setNumberOfTeams: (v: string) => void;
  setPlayersPerTeam: (v: string) => void;
  setIsAuctionBased: (v: boolean | null) => void;
  markSaved: (tournamentId: string) => void;
  markCricketConfigSaved: (cricketConfigId: string) => void;
  reset: () => void;
};

const initialCricketDetails: CricketDetails = {
  groundType: null,
  ballType: null,
  numberOfTeams: '',
  playersPerTeam: '',
  isAuctionBased: null,
};

const initialDraft: TournamentDraft = {
  name: '',
  startDate: null,
  endDate: null,
  venue: null,
  registrationStartDate: null,
  registrationEndDate: null,
  description: '',
  contacts: [],
  cricketDetails: initialCricketDetails,
  tournamentId: null,
  cricketConfigId: null,
};

const TournamentDraftContext =
  createContext<TournamentDraftContextValue | null>(null);

export function TournamentDraftProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState<TournamentDraft>(initialDraft);

  const setName = useCallback((name: string) => {
    setDraft((d) => ({ ...d, name }));
  }, []);

  const setStartDate = useCallback((startDate: string | null) => {
    setDraft((d) => ({ ...d, startDate }));
  }, []);

  const setEndDate = useCallback((endDate: string | null) => {
    setDraft((d) => ({ ...d, endDate }));
  }, []);

  const setVenue = useCallback((venue: Venue | null) => {
    setDraft((d) => ({ ...d, venue }));
  }, []);

  const setRegistrationStartDate = useCallback(
    (registrationStartDate: string | null) => {
      setDraft((d) => ({ ...d, registrationStartDate }));
    },
    []
  );

  const setRegistrationEndDate = useCallback(
    (registrationEndDate: string | null) => {
      setDraft((d) => ({ ...d, registrationEndDate }));
    },
    []
  );

  const setDescription = useCallback((description: string) => {
    setDraft((d) => ({ ...d, description }));
  }, []);

  const addContact = useCallback((contact: DraftContact) => {
    setDraft((d) => ({
      ...d,
      contacts: [...d.contacts, contact],
    }));
  }, []);

  const removeContact = useCallback((phone: string) => {
    setDraft((d) => ({
      ...d,
      contacts: d.contacts.filter((c) => c.phone !== phone),
    }));
  }, []);

  const setGroundType = useCallback((groundType: GroundType | null) => {
    setDraft((d) => ({
      ...d,
      cricketDetails: { ...d.cricketDetails, groundType },
    }));
  }, []);

  const setBallType = useCallback((ballType: BallType | null) => {
    setDraft((d) => ({
      ...d,
      cricketDetails: { ...d.cricketDetails, ballType },
    }));
  }, []);

  const setNumberOfTeams = useCallback((numberOfTeams: string) => {
    setDraft((d) => ({
      ...d,
      cricketDetails: { ...d.cricketDetails, numberOfTeams },
    }));
  }, []);

  const setPlayersPerTeam = useCallback((playersPerTeam: string) => {
    setDraft((d) => ({
      ...d,
      cricketDetails: { ...d.cricketDetails, playersPerTeam },
    }));
  }, []);

  const setIsAuctionBased = useCallback((isAuctionBased: boolean | null) => {
    setDraft((d) => ({
      ...d,
      cricketDetails: { ...d.cricketDetails, isAuctionBased },
    }));
  }, []);

  const markSaved = useCallback((tournamentId: string) => {
    setDraft((d) => ({ ...d, tournamentId }));
  }, []);

  const markCricketConfigSaved = useCallback((cricketConfigId: string) => {
    setDraft((d) => ({ ...d, cricketConfigId }));
  }, []);

  const reset = useCallback(() => {
    setDraft(initialDraft);
  }, []);

  const value = useMemo(
    () => ({
      draft,
      setName,
      setStartDate,
      setEndDate,
      setVenue,
      setRegistrationStartDate,
      setRegistrationEndDate,
      setDescription,
      addContact,
      removeContact,
      setGroundType,
      setBallType,
      setNumberOfTeams,
      setPlayersPerTeam,
      setIsAuctionBased,
      markSaved,
      markCricketConfigSaved,
      reset,
    }),
    [
      draft,
      setName,
      setStartDate,
      setEndDate,
      setVenue,
      setRegistrationStartDate,
      setRegistrationEndDate,
      setDescription,
      addContact,
      removeContact,
      setGroundType,
      setBallType,
      setNumberOfTeams,
      setPlayersPerTeam,
      setIsAuctionBased,
      markSaved,
      markCricketConfigSaved,
      reset,
    ]
  );

  return (
    <TournamentDraftContext.Provider value={value}>
      {children}
    </TournamentDraftContext.Provider>
  );
}

export function useTournamentDraft(): TournamentDraftContextValue {
  const ctx = useContext(TournamentDraftContext);
  if (!ctx) {
    throw new Error(
      'useTournamentDraft must be used within TournamentDraftProvider'
    );
  }
  return ctx;
}
