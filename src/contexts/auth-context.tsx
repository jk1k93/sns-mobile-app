import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import {
  buildProfilePatchBody,
  fetchProfile,
  saveProfile,
  type ProfileCompletionPayload,
  type User,
} from '@/api/auth';
import { AppColors } from '@/constants/app-colors';
import { deleteAuthToken, getAuthToken, setAuthToken } from '@/lib/auth-token';
import { clearSelectedSportId } from '@/lib/selected-sport-id';

export type { ProfileCompletionPayload } from '@/api/auth';

type AuthContextValue = {
  user: User | null;
  /** Present when signed in; use for authenticated API calls. */
  accessToken: string | null;
  /** True when user must complete onboarding profile (`/profile` `data.newUser` or verify-otp `newUser`). */
  needsProfileCompletion: boolean;
  isReady: boolean;
  signIn: (payload: { token: string; user: User; newUser: boolean }) => Promise<void>;
  /** `PATCH /profile` then updates user and `needsProfileCompletion` from the response. */
  completeProfileSetup: (payload: ProfileCompletionPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await getAuthToken();
        if (cancelled) return;

        if (!token) {
          setUser(null);
          setAccessToken(null);
          setNeedsProfileCompletion(false);
          setIsReady(true);
          return;
        }

        const profile = await fetchProfile(token);
        if (cancelled) return;

        setAccessToken(token);
        setUser(profile.user);
        setNeedsProfileCompletion(profile.newUser);
      } catch {
        await deleteAuthToken();
        await clearSelectedSportId();
        if (!cancelled) {
          setUser(null);
          setAccessToken(null);
          setNeedsProfileCompletion(false);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (payload: { token: string; user: User; newUser: boolean }) => {
      await setAuthToken(payload.token);
      setAccessToken(payload.token);
      setUser(payload.user);
      setNeedsProfileCompletion(payload.newUser);
    },
    []
  );

  const completeProfileSetup = useCallback(
    async (payload: ProfileCompletionPayload) => {
      if (!accessToken) {
        throw new Error('Not signed in');
      }
      const body = buildProfilePatchBody(user, payload);
      const profile = await saveProfile(accessToken, body);
      setUser(profile.user);
      setNeedsProfileCompletion(profile.newUser);
    },
    [accessToken, user]
  );

  const signOut = useCallback(async () => {
    await deleteAuthToken();
    await clearSelectedSportId();
    setAccessToken(null);
    setUser(null);
    setNeedsProfileCompletion(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      needsProfileCompletion,
      isReady,
      signIn,
      completeProfileSetup,
      signOut,
    }),
    [
      user,
      accessToken,
      needsProfileCompletion,
      isReady,
      signIn,
      completeProfileSetup,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthBootstrapGate({ children }: { children: React.ReactNode }) {
  const { isReady } = useAuth();

  if (!isReady) {
    return (
      <View style={bootstrapStyles.root}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const bootstrapStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.white,
  },
});
