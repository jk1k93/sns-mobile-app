import * as Location from 'expo-location';
import { Accuracy, PermissionStatus } from 'expo-location';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type UserLocationContextValue = {
  /** Full fix from expo-location (includes coords, timestamp, etc.). */
  location: Location.LocationObject | null;
  permissionStatus: PermissionStatus | null;
  error: string | null;
  /** True until permission + first location attempt finish (success or failure). */
  isLoading: boolean;
  /** Request permission again and read current position. */
  refresh: () => Promise<void>;
};

const LocationContext = createContext<UserLocationContextValue | null>(null);

export function useUserLocation(): UserLocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useUserLocation must be used within LocationProvider');
  }
  return ctx;
}

async function readCurrentLocation(): Promise<Location.LocationObject> {
  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: 60_000,
    requiredAccuracy: 1000,
  });
  if (lastKnown) {
    return lastKnown;
  }
  return Location.getCurrentPositionAsync({
    accuracy: Accuracy.Balanced,
  });
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== PermissionStatus.GRANTED) {
        setLocation(null);
        setError(
          status === PermissionStatus.DENIED
            ? 'Location permission denied'
            : 'Location permission not granted'
        );
        return;
      }

      const pos = await readCurrentLocation();
      setLocation(pos);
    } catch (e) {
      setLocation(null);
      setError(e instanceof Error ? e.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo(
    () => ({
      location,
      permissionStatus,
      error,
      isLoading,
      refresh: load,
    }),
    [location, permissionStatus, error, isLoading, load]
  );

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
}
