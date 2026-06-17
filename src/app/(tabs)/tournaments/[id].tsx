import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchTournament, type TournamentDetail } from "@/api/tournaments";
import { ThemedView } from "@/components/themed-view";
import { AppColors } from "@/constants/app-colors";
import { useAuth } from "@/contexts/auth-context";
import { useHideTabBarWhileFocused } from "@/hooks/use-hide-tab-bar";

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "—"}</Text>
    </View>
  );
}

function venueDisplay(tournament: TournamentDetail): string | null {
  if (!tournament.venue) return null;
  const parts = [
    tournament.venue.name,
    tournament.venue.city?.name,
    tournament.venue.address,
  ].filter(Boolean);
  return parts.join(" · ");
}

export default function TournamentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken } = useAuth();
  useHideTabBarWhileFocused();

  const { data: tournament, isLoading, isError } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => fetchTournament(accessToken!, id),
    enabled: !!accessToken && !!id,
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
            {tournament?.name ?? "Tournament details"}
          </Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/tournaments/edit-details",
                params: { tournamentId: id },
              })
            }
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Edit tournament"
          >
            <Ionicons name="pencil" size={20} color={AppColors.primary} />
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
            <Text style={styles.errorText}>Failed to load tournament.</Text>
          </View>
        )}

        {tournament && (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <DetailRow label="Venue" value={venueDisplay(tournament)} />
            <DetailRow label="Tournament start" value={tournament.tournamentStartDate} />
            <DetailRow label="Tournament end" value={tournament.tournamentEndDate} />
            <DetailRow label="Registration start" value={tournament.registrationStartDate} />
            <DetailRow label="Registration end" value={tournament.registrationEndDate} />
            <DetailRow label="Description" value={tournament.description} />

            {tournament.contacts.length > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Contacts</Text>
                <View style={styles.contactList}>
                  {tournament.contacts.map((c) => (
                    <Text key={c.id} style={styles.rowValue}>
                      {c.user.name ? `${c.user.name} · ${c.user.phoneNumber}` : c.user.phoneNumber}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </ThemedView>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 15,
    color: AppColors.textMuted,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rowValue: {
    fontSize: 15,
    color: AppColors.textDark,
  },
  contactList: {
    gap: 4,
  },
});
