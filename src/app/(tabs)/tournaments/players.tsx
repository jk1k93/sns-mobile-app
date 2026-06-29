import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { deletePlayer, fetchPlayers, type TournamentPlayerDetail } from "@/api/players";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { ThemedView } from "@/components/themed-view";
import { AppColors } from "@/constants/app-colors";
import { useAuth } from "@/contexts/auth-context";
import { useHideTabBarWhileFocused } from "@/hooks/use-hide-tab-bar";

function PlayerRow({
  player,
  canManage,
  canEdit,
  isCaptain,
  onPress,
  onDelete,
}: {
  player: TournamentPlayerDetail;
  canManage: boolean;
  canEdit: boolean;
  isCaptain: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const displayName = (player.player.name ?? player.player.phoneNumber) + (isCaptain ? " (c)" : "");
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const meta: string[] = [];
  if (player.role) meta.push(player.role.name);
  if (player.jerseyNumber != null) meta.push(`#${player.jerseyNumber}`);
  if (player.jerseySize) meta.push(player.jerseySize);
  if (player.team) meta.push(player.team.name);

  return (
    <Pressable
      onPress={canEdit ? onPress : undefined}
      style={({ pressed }) => [styles.row, canEdit && pressed && styles.rowPressed]}
      accessibilityRole={canEdit ? "button" : "none"}
      accessibilityLabel={canEdit ? `Edit ${displayName}` : undefined}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.rowPhone}>{player.player.phoneNumber}</Text>
        {meta.length > 0 && (
          <Text style={styles.rowMeta} numberOfLines={1}>{meta.join(" · ")}</Text>
        )}
      </View>
      {canManage && (
        <Pressable
          onPress={onDelete}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${displayName}`}
        >
          <Ionicons name="trash-outline" size={20} color={AppColors.error} />
        </Pressable>
      )}
    </Pressable>
  );
}

export default function PlayersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tournamentId, canManage: canManageParam, teamId, title, captainId, isAuction: isAuctionParam } = useLocalSearchParams<{
    tournamentId: string;
    canManage?: string;
    teamId?: string;
    title?: string;
    captainId?: string;
    isAuction?: string;
  }>();
  useHideTabBarWhileFocused();

  const canManage = canManageParam === "1";
  const canAddPlayer = canManage && (!!teamId || isAuctionParam === "1");
  const { accessToken, user } = useAuth();
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<TournamentPlayerDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: players = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["tournament-players", tournamentId, teamId ?? null],
    queryFn: () => fetchPlayers(tournamentId, teamId),
    enabled: !!accessToken && !!tournamentId,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => {
      const name = (p.player.name ?? "").toLowerCase();
      const phone = p.player.phoneNumber.toLowerCase();
      const role = (p.role?.name ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q) || role.includes(q);
    });
  }, [players, search]);

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deletePlayer(tournamentId, pendingDelete.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tournament-players", tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ["team", tournamentId] }),
      ]);
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

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
          <Text style={styles.headerTitle} numberOfLines={1}>{title ?? "Players"}</Text>
          {canAddPlayer ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/tournaments/add-player",
                  params: { tournamentId, ...(teamId ? { teamId } : {}) },
                })
              }
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Add player"
            >
              <Ionicons name="add-circle-outline" size={24} color={AppColors.primary} />
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={AppColors.placeholder} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, phone or role…"
            placeholderTextColor={AppColors.placeholder}
            style={styles.searchInput}
            autoCorrect={false}
            clearButtonMode={Platform.OS === "ios" ? "while-editing" : "never"}
            returnKeyType="search"
          />
          {Platform.OS !== "ios" && search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={AppColors.placeholder} />
            </Pressable>
          )}
        </View>

        {isLoading && (
          <ActivityIndicator size="large" color={AppColors.primary} style={styles.centered} />
        )}

        {isError && (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Failed to load players.</Text>
            <Pressable onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {!isLoading && !isError && (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PlayerRow
                player={item}
                canManage={canManage && pendingDelete?.id !== item.id}
                canEdit={canManage || item.playerId === user?.id}
                isCaptain={!!captainId && item.playerId === captainId}
                onPress={() =>
                  router.push({
                    pathname: "/tournaments/edit-player",
                    params: {
                      tournamentId,
                      tournamentPlayerId: item.id,
                      currentRoleId: item.roleId ?? undefined,
                      currentJerseyNumber: item.jerseyNumber != null ? String(item.jerseyNumber) : undefined,
                      currentJerseyName: item.jerseyName ?? undefined,
                      currentJerseySize: item.jerseySize ?? undefined,
                      playerName: item.player.name ?? item.player.phoneNumber,
                    },
                  })
                }
                onDelete={() => setPendingDelete(item)}
              />
            )}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {search.trim() ? "No players match your search." : "No players yet."}
              </Text>
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}

        <ConfirmationModal
          visible={!!pendingDelete}
          title="Remove player"
          message={`Remove ${pendingDelete?.player.name ?? pendingDelete?.player.phoneNumber} from this tournament?`}
          confirmText="Remove"
          destructive
          isPending={isDeleting}
          pendingText="Removing…"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
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
  headerSpacer: { width: 24 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#C8E6D9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    backgroundColor: AppColors.white,
    gap: 8,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: AppColors.textDark,
    padding: 0,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  rowPressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.white,
  },
  rowInfo: { flex: 1 },
  rowName: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.textDark,
  },
  rowPhone: {
    fontSize: 13,
    color: AppColors.textMuted,
    marginTop: 1,
  },
  rowMeta: {
    fontSize: 12,
    color: AppColors.placeholder,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E0E0E0",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: AppColors.textMuted,
    textAlign: "center",
    paddingTop: 24,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.white,
  },
});
