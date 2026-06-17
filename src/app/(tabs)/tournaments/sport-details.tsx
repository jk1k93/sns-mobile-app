import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchSports } from "@/api/sports";
import { CricketConfigForm } from "@/components/tournament/cricket-config-form";
import { ThemedView } from "@/components/themed-view";
import { AppColors } from "@/constants/app-colors";
import { useAuth } from "@/contexts/auth-context";
import { useSelectedSport } from "@/contexts/selected-sport-context";
import { useTournamentDraft } from "@/contexts/tournament-draft-context";
import { useHideTabBarWhileFocused } from "@/hooks/use-hide-tab-bar";

export default function SportDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tournamentId, mode = "create", tournamentName } =
    useLocalSearchParams<{ tournamentId: string; mode?: string; tournamentName?: string }>();
  const { accessToken } = useAuth();
  const { selectedSportId } = useSelectedSport();
  const draft = useTournamentDraft();
  useHideTabBarWhileFocused();

  const sportsQuery = useQuery({
    queryKey: ["sports"],
    queryFn: fetchSports,
  });

  const sportName = useMemo(
    () =>
      sportsQuery.data?.find((s) => s.id === selectedSportId)?.name ?? null,
    [sportsQuery.data, selectedSportId]
  );

  const isCricket = sportName?.toLowerCase() === "cricket";

  const onSave = () => {
    queryClient.invalidateQueries({ queryKey: ["cricket-config", tournamentId] });
    queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    draft.reset();
    router.replace(`/tournaments/${tournamentId}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ThemedView style={styles.flex}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={AppColors.textDark} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {tournamentName ?? "Tournament"}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {mode === "create" && (
            <Text style={styles.stepTag}>Step 2 of 2</Text>
          )}

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isCricket && accessToken && tournamentId ? (
              <CricketConfigForm
                tournamentId={tournamentId}
                accessToken={accessToken}
                onSave={onSave}
              />
            ) : (
              <Text style={styles.noDetailsText}>
                No additional details are available for this sport.
              </Text>
            )}
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.textDark,
    textAlign: "center",
  },
  headerSpacer: {
    width: 24,
  },
  stepTag: {
    marginHorizontal: 20,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.primary,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  noDetailsText: {
    fontSize: 15,
    color: AppColors.textMuted,
    marginTop: 16,
  },
});
