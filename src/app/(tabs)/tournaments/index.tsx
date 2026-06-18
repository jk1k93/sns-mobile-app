import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchTournaments, type TournamentDetail } from "@/api/tournaments";
import type { GeoCoordinates } from "@/lib/types";
import { TournamentCard } from "@/components/tournament/tournament-card";
import { ThemedView } from "@/components/themed-view";
import { AppColors } from "@/constants/app-colors";
import { useAuth } from "@/contexts/auth-context";
import { useUserLocation } from "@/contexts/location-context";
import { useSelectedSport } from "@/contexts/selected-sport-context";
import { useTournamentDraft } from "@/contexts/tournament-draft-context";

export default function TournamentsListScreen() {
  const router = useRouter();
  const { reset } = useTournamentDraft();
  const { accessToken } = useAuth();
  const { selectedSportId } = useSelectedSport();
  const { location } = useUserLocation();

  const coords: GeoCoordinates | undefined = location
    ? { lat: location.coords.latitude, lng: location.coords.longitude }
    : undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tournaments", selectedSportId, coords?.lat ?? null, coords?.lng ?? null],
    queryFn: () => fetchTournaments(selectedSportId!, coords),
    enabled: !!accessToken && !!selectedSportId,
  });

  useFocusEffect(
    useCallback(() => {
      if (accessToken) refetch();
    }, [accessToken, refetch])
  );

  const goCreate = () => {
    reset();
    router.push("/tournaments/create");
  };

  const goDetail = (id: string) => {
    router.push(`/tournaments/${id}`);
  };

  const renderItem = ({ item }: { item: TournamentDetail }) => (
    <TournamentCard tournament={item} onPress={() => goDetail(item.id)} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tournaments</Text>
          <Pressable
            onPress={goCreate}
            style={({ pressed }) => [styles.createBtn, pressed && styles.createBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Create tournament"
            hitSlop={8}
          >
            <Ionicons name="add" size={26} color={AppColors.primary} />
          </Pressable>
        </View>

        {isLoading && (
          <ActivityIndicator
            size="large"
            color={AppColors.primary}
            style={styles.centered}
          />
        )}

        {isError && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Failed to load tournaments.</Text>
            <Pressable onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {!isLoading && !isError && (
          <FlatList
            data={data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No tournaments yet. Create one!</Text>
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: AppColors.primary,
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surfaceMuted,
    borderWidth: 1,
    borderColor: "#C8E6D9",
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnPressed: {
    opacity: 0.85,
  },
  list: {
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 15,
    color: AppColors.textMuted,
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: AppColors.surfaceMuted,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primary,
  },
  emptyText: {
    fontSize: 15,
    color: AppColors.textMuted,
    textAlign: "center",
    marginTop: 48,
  },
});
