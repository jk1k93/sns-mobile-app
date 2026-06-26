import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/contexts/auth-context';
import {
  getSelectedSportId,
  setSelectedSportId as persistSportIdToStorage,
} from '@/lib/selected-sport-id';

type SelectedSportContextValue = {
  selectedSportId: string | null;
  /** False briefly after sign-in while reading SecureStore. */
  isSportPreferenceReady: boolean;
  /** Persist id and update state so the app can show Home. */
  selectSport: (id: string) => Promise<void>;
};

const SelectedSportContext = createContext<SelectedSportContextValue | null>(null);

export function useSelectedSport(): SelectedSportContextValue {
  const ctx = useContext(SelectedSportContext);
  if (!ctx) {
    throw new Error('useSelectedSport must be used within SelectedSportProvider');
  }
  return ctx;
}

export function SelectedSportProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const [isSportPreferenceReady, setIsSportPreferenceReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSportPreference() {
      if (!user) {
        setSelectedSportId(null);
        setIsSportPreferenceReady(true);
        return;
      }

      setIsSportPreferenceReady(false);
      const id = await getSelectedSportId(user.id);
      if (!cancelled) {
        setSelectedSportId(id);
        setIsSportPreferenceReady(true);
      }
    }

    void loadSportPreference();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const selectSport = useCallback(async (id: string) => {
    if (!user) return;
    await persistSportIdToStorage(user.id, id);
    setSelectedSportId(id);
  }, [user]);

  const value = useMemo(
    () => ({
      selectedSportId,
      isSportPreferenceReady,
      selectSport,
    }),
    [selectedSportId, isSportPreferenceReady, selectSport]
  );

  return (
    <SelectedSportContext.Provider value={value}>{children}</SelectedSportContext.Provider>
  );
}
