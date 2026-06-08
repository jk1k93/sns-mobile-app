import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppColors } from '@/constants/app-colors';
import { AuthBootstrapGate, AuthProvider, useAuth } from '@/contexts/auth-context';
import { LocationProvider } from '@/contexts/location-context';
import { SelectedSportProvider, useSelectedSport } from '@/contexts/selected-sport-context';
import { QueryProvider } from '@/providers/query-provider';
import CreateProfileScreen from '@/screens/CreateProfileScreen';
import LoginScreen from '@/screens/LoginScreen';
import SelectSportsScreen from '@/screens/SelectSportsScreen';

function AuthenticatedRoot() {
  const { user, needsProfileCompletion } = useAuth();
  const { selectedSportId, isSportPreferenceReady } = useSelectedSport();

  if (!user) {
    return <LoginScreen />;
  }
  if (needsProfileCompletion) {
    return <CreateProfileScreen />;
  }
  if (!isSportPreferenceReady) {
    return (
      <View style={sportBootstrapStyles.root}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }
  if (!selectedSportId) {
    return <SelectSportsScreen />;
  }
  /** Renders matched file routes (e.g. `(tabs)`); `children` on root `_layout` is not the route outlet. */
  return (
    <LocationProvider>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </LocationProvider>
  );
}

const sportBootstrapStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.white,
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryProvider>
      <AuthProvider>
        <SelectedSportProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />
            <AuthBootstrapGate>
              <AuthenticatedRoot />
            </AuthBootstrapGate>
          </ThemeProvider>
        </SelectedSportProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
