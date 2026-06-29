import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

import { deleteTeam, fetchTeam, type TeamUserSummary } from "@/api/teams";
import { fetchTournament } from "@/api/tournaments";
import { ConfirmationModal } from "@/components/confirmation-modal";
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

function personDisplay(u: TeamUserSummary): string {
  return u.name ? `${u.name} · ${u.phoneNumber}` : u.phoneNumber;
}

function isCaptain(team: { captain: TeamUserSummary | null }, userId: string) {
  return team.captain?.id === userId;
}

function isOwner(team: { owner: TeamUserSummary | null }, userId: string) {
  return team.owner?.id === userId;
}

export default function TeamDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tournamentId, teamId, canManage } = useLocalSearchParams<{
    tournamentId: string;
    teamId: string;
    canManage: string;
  }>();
  const { user } = useAuth();
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  useHideTabBarWhileFocused();

  const { data: team, isLoading, isError } = useQuery({
    queryKey: ["team", tournamentId, teamId],
    queryFn: () => fetchTeam(tournamentId, teamId),
    enabled: !!tournamentId && !!teamId,
  });

  const { data: tournamentResult } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => fetchTournament(tournamentId),
    enabled: !!tournamentId,
  });
  const isAuction = tournamentResult?.tournament.cricketTournamentConfig?.auctionBased ?? false;

  const canManageTeam =
    canManage === "1" ||
    (!!user && !!team && (isCaptain(team, user.id) || isOwner(team, user.id)));

  const deleteTeamMutation = useMutation({
    mutationFn: () => deleteTeam(tournamentId, teamId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ["tournament-players", tournamentId] }),
      ]);
      router.back();
    },
    onError: () => {
      setDeleteConfirmVisible(false);
    },
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
            {team?.name ?? "Team details"}
          </Text>
          {canManageTeam ? (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/tournaments/edit-team",
                    params: { tournamentId, teamId },
                  })
                }
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Edit team"
              >
                <Ionicons name="pencil" size={20} color={AppColors.primary} />
              </Pressable>
              <Pressable
                onPress={() => setDeleteConfirmVisible(true)}
                disabled={deleteTeamMutation.isPending}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Delete team"
              >
                <Ionicons name="trash-outline" size={20} color={AppColors.error} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {isLoading && (
          <ActivityIndicator size="large" color={AppColors.primary} style={styles.centered} />
        )}

        {isError && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Failed to load team.</Text>
          </View>
        )}

        {team && (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {team.shortCode ? <DetailRow label="Short code" value={team.shortCode} /> : null}
            {team.logoUrl ? <DetailRow label="Logo URL" value={team.logoUrl} /> : null}
            <DetailRow
              label="Owner"
              value={team.owner ? personDisplay(team.owner) : null}
            />
            {!isAuction && team.captain && (
              <DetailRow
                label="Captain"
                value={personDisplay(team.captain)}
              />
            )}
            <Pressable
              style={styles.playersRow}
              onPress={() =>
                router.push({
                  pathname: "/tournaments/players",
                  params: {
                    tournamentId,
                    teamId,
                    canManage: canManageTeam ? "1" : "0",
                    title: team.name,
                    captainId: team.captain?.id ?? undefined,
                  },
                })
              }
              accessibilityRole="button"
              accessibilityLabel="View players"
            >
              <Text style={styles.playersRowLabel}>Players</Text>
              <Ionicons name="chevron-forward" size={18} color={AppColors.primary} />
            </Pressable>
          </ScrollView>
        )}

        <ConfirmationModal
          visible={deleteConfirmVisible}
          title="Delete team"
          message={`Remove "${team?.name}" from this tournament?`}
          confirmText="Delete"
          destructive
          isPending={deleteTeamMutation.isPending}
          pendingText="Deleting…"
          onConfirm={() => deleteTeamMutation.mutate()}
          onCancel={() => setDeleteConfirmVisible(false)}
        />
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerSpacer: {
    width: 56,
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
  playersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  playersRowLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.textDark,
  },
});
