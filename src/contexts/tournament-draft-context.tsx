import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { Venue } from '@/api/venues';

export type TournamentDraft = {
  name: string;
  startDate: string | null;
  endDate: string | null;
  venue: Venue | null;
};

type TournamentDraftContextValue = {
  draft: TournamentDraft;
  setName: (v: string) => void;
  setStartDate: (iso: string | null) => void;
  setEndDate: (iso: string | null) => void;
  setVenue: (v: Venue | null) => void;
  reset: () => void;
};

const initialDraft: TournamentDraft = {
  name: '',
  startDate: null,
  endDate: null,
  venue: null,
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
      reset,
    }),
    [draft, setName, setStartDate, setEndDate, setVenue, reset]
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
