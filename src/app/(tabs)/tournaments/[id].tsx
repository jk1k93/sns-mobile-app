import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchPlayers, type TournamentPlayerDetail } from "@/api/players";
import { deleteTournament, fetchTournament, type TeamSummary, type TournamentDetail } from "@/api/tournaments";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { ThemedView } from "@/components/themed-view";
import { SportConfigDisplay } from "@/components/tournament/sport-config-display";
import { AppColors } from "@/constants/app-colors";
import { useAuth } from "@/contexts/auth-context";
import { useHideTabBarWhileFocused } from "@/hooks/use-hide-tab-bar";

const SCROLL_PADDING = 20;
const GRID_GAP = 10;
const MIN_CARD_WIDTH = 140;

function TeamCard({ team, onPress }: { team: TeamSummary; onPress: () => void }) {
  const initials = team.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.teamCard, pressed && styles.teamCardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`View ${team.name}`}
    >
      <View style={styles.teamAvatar}>
        <Text style={styles.teamAvatarText}>{initials}</Text>
      </View>
      <Text style={styles.teamName} numberOfLines={2}>{team.name}</Text>
    </Pressable>
  );
}

function PlayerCard({
  player,
  onPress,
}: {
  player: TournamentPlayerDetail;
  onPress?: () => void;
}) {
  const displayName = player.player.name ?? player.player.phoneNumber;
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const inner = (
    <>
      <View style={styles.playerAvatar}>
        <Text style={styles.teamAvatarText}>{initials}</Text>
      </View>
      <Text style={styles.teamName} numberOfLines={2}>{displayName}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.playerCard, pressed && styles.teamCardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${displayName}`}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.playerCard}>{inner}</View>;
}

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
  const { accessToken, user } = useAuth();
  const { width } = useWindowDimensions();
  useHideTabBarWhileFocused();

  const contentWidth = width - SCROLL_PADDING * 2;
  const numCols = Math.max(2, Math.floor((contentWidth + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)));
  const cardWidth = (contentWidth - GRID_GAP * (numCols - 1)) / numCols;

  const [sportDetailsExpanded, setSportDetailsExpanded] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteTournament(id),
    onSuccess: () => router.back(),
    onError: () => {
      setDeleteConfirmVisible(false);
      Alert.alert("Error", "Failed to delete tournament. Please try again.");
    },
  });

  const handleDelete = () => setDeleteConfirmVisible(true);

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => fetchTournament(id),
    enabled: !!accessToken && !!id,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["tournament-players", id],
    queryFn: () => fetchPlayers(id),
    enabled: !!accessToken && !!id,
  });

  const tournament = result?.tournament;
  const canUpdate = result?.canUpdate ?? false;
  const canManage =
    !!tournament &&
    !!user &&
    (tournament.organiserId === user.id ||
      tournament.contacts.some((c) => c.userId === user.id));
  const alreadyRegistered = !!user && players.some((p) => p.playerId === user.id);
  const canSelfRegister = !!tournament && !!user && !canManage && !alreadyRegistered;

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
          {canUpdate ? (
            <View style={styles.headerActions}>
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
              <Pressable
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Delete tournament"
              >
                <Ionicons name="trash-outline" size={20} color={AppColors.error} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )}
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

            {tournament.sport.name.toLowerCase() === "cricket" && !!tournament.cricketTournamentConfig && (
              <>
                <Pressable
                  onPress={() => setSportDetailsExpanded((prev) => !prev)}
                  style={styles.sectionHeader}
                  accessibilityRole="button"
                  accessibilityLabel={sportDetailsExpanded ? "Collapse sport details" : "Expand sport details"}
                >
                  <Text style={styles.sectionTitle}>Details</Text>
                  <Ionicons
                    name={sportDetailsExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={AppColors.textMuted}
                  />
                </Pressable>
                {sportDetailsExpanded && <SportConfigDisplay tournament={tournament} />}
              </>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Teams</Text>
              {canManage && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/tournaments/add-team",
                      params: { tournamentId: id },
                    })
                  }
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Add team"
                >
                  <Ionicons name="add-circle-outline" size={24} color={AppColors.primary} />
                </Pressable>
              )}
            </View>

            {tournament.teams.length === 0 ? (
              <Text style={styles.sectionEmpty}>No teams yet.</Text>
            ) : (
              <View style={styles.grid}>
                {tournament.teams.map((team) => (
                  <View key={team.id} style={{ width: cardWidth }}>
                    <TeamCard
                      team={team}
                      onPress={() =>
                        router.push({
                          pathname: "/tournaments/team-details",
                          params: { tournamentId: id, teamId: team.id, canManage: canManage ? "1" : "0" },
                        })
                      }
                    />
                  </View>
                ))}
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Players</Text>
              {canManage && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/tournaments/add-player",
                      params: { tournamentId: id, sportId: tournament.sportId },
                    })
                  }
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Add player"
                >
                  <Ionicons name="add-circle-outline" size={24} color={AppColors.primary} />
                </Pressable>
              )}
            </View>

            {players.length === 0 ? (
              <Text style={styles.sectionEmpty}>No players yet.</Text>
            ) : (
              <>
                <View style={styles.grid}>
                  {players.slice(0, 4).map((player) => {
                    const canEdit = canManage || player.playerId === user?.id;
                    return (
                      <View key={player.id} style={{ width: cardWidth }}>
                        <PlayerCard
                          player={player}
                          onPress={canEdit ? () => router.push({
                            pathname: "/tournaments/edit-player",
                            params: {
                              tournamentId: id,
                              tournamentPlayerId: player.id,
                              sportId: tournament.sportId,
                              currentRoleId: player.roleId ?? undefined,
                              currentJerseyNumber: player.jerseyNumber != null ? String(player.jerseyNumber) : undefined,
                              currentJerseySize: player.jerseySize ?? undefined,
                              playerName: player.player.name ?? player.player.phoneNumber,
                            },
                          }) : undefined}
                        />
                      </View>
                    );
                  })}
                </View>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/tournaments/players",
                      params: { tournamentId: id, canManage: canManage ? "1" : "0", sportId: tournament.sportId },
                    })
                  }
                  style={styles.showAllBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.showAllText}>
                    {players.length > 4
                      ? `Show all ${players.length} players`
                      : "See players list"}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={AppColors.primary} />
                </Pressable>
              </>
            )}
          </ScrollView>
        )}

        <ConfirmationModal
          visible={deleteConfirmVisible}
          title="Delete tournament"
          message="Are you sure you want to delete this tournament? This cannot be undone."
          confirmText="Delete"
          destructive
          isPending={deleteMutation.isPending}
          pendingText="Deleting…"
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setDeleteConfirmVisible(false)}
        />

        {canSelfRegister && (
          <View style={styles.registerFooter}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/tournaments/register-player",
                  params: { tournamentId: id, sportId: tournament!.sportId },
                })
              }
              style={({ pressed }) => [styles.registerBtn, pressed && styles.registerBtnPressed]}
              accessibilityRole="button"
            >
              <Ionicons name="person-add-outline" size={18} color={AppColors.white} />
              <Text style={styles.registerBtnText}>Register as player</Text>
            </Pressable>
          </View>
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
  headerSpacer: {
    width: 20,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.textDark,
  },
  sectionEmpty: {
    fontSize: 14,
    color: AppColors.textMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  teamCard: {
    backgroundColor: AppColors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  playerCard: {
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  teamCardPressed: {
    opacity: 0.7,
  },
  teamAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  teamAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.white,
  },
  teamName: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.textDark,
    textAlign: "center",
  },
  showAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: AppColors.surfaceMuted,
  },
  showAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
  },
  registerFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  registerBtnPressed: {
    opacity: 0.85,
  },
  registerBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.white,
  },
});
