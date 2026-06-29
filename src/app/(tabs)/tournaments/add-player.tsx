import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createPlayer, JERSEY_SIZES, type CreatePlayerPayload, type JerseySize } from "@/api/players";
import { fetchCricketRoles } from "@/api/cricket-roles";
import { fetchTournament } from "@/api/tournaments";
import type { CricketPlayerProfileSummary } from "@/api/users";
import { SinglePersonField, type SelectedPerson } from "@/components/team/single-person-field";
import { OptionSelectField } from "@/components/tournament/option-select-field";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import { AppColors } from "@/constants/app-colors";
import { useHideTabBarWhileFocused } from "@/hooks/use-hide-tab-bar";
import { ApiError } from "@/lib/api";

function parseApiErrorMessage(body?: string): string | undefined {
  if (!body) return undefined;
  try {
    const parsed = JSON.parse(body);
    return typeof parsed.error === "string" ? parsed.error : undefined;
  } catch {
    return undefined;
  }
}

export default function AddPlayerScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tournamentId, teamId } = useLocalSearchParams<{ tournamentId: string; teamId?: string }>();
  useHideTabBarWhileFocused();

  const [player, setPlayer] = useState<SelectedPerson | null>(null);
  const [pendingPlayer, setPendingPlayer] = useState<SelectedPerson | null>(null);
  const [partialPhone, setPartialPhone] = useState(false);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [jerseyName, setJerseyName] = useState("");
  const [jerseySize, setJerseySize] = useState<JerseySize | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { data: tournamentResult } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => fetchTournament(tournamentId),
    enabled: !!tournamentId,
  });
  const addMutation = useMutation({
    mutationFn: (payload: CreatePlayerPayload) =>
      createPlayer(tournamentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament-players", tournamentId] });
      router.back();
    },
    onError: (e) => {
      const message =
        e instanceof ApiError
          ? (parseApiErrorMessage(e.body) ?? e.message)
          : "Something went wrong. Please try again.";
      Alert.alert("Failed to add player", message);
    },
  });

  const { data: cricketRoles = [] } = useQuery({
    queryKey: ["cricket-roles"],
    queryFn: () => fetchCricketRoles(true),
  });

  const tournament = tournamentResult?.tournament;
  const isAuction = tournament?.cricketTournamentConfig?.auctionBased ?? false;
  const showTeamPicker = isAuction && !teamId;

  const handleProfileFound = (profile: CricketPlayerProfileSummary | null) => {
    if (!profile) return;
    if (profile.roleId) setRoleId(profile.roleId);
    if (profile.jerseyNumber != null) setJerseyNumber(String(profile.jerseyNumber));
    if (profile.jerseySize) setJerseySize(profile.jerseySize);
  };

  const effectivePlayer = player ?? pendingPlayer;
  const canSubmit = !!effectivePlayer && !partialPhone && !addMutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit || !tournamentId || !effectivePlayer) return;

    const parsedJersey = jerseyNumber.trim() ? parseInt(jerseyNumber.trim(), 10) : undefined;
    if (jerseyNumber.trim() && (isNaN(parsedJersey!) || parsedJersey! < 0)) {
      Alert.alert("Invalid jersey number", "Jersey number must be a non-negative number.");
      return;
    }

    const parsedBidPrice = bidPrice.trim() ? parseInt(bidPrice.trim(), 10) : undefined;
    if (bidPrice.trim() && (isNaN(parsedBidPrice!) || parsedBidPrice! < 0)) {
      Alert.alert("Invalid bid amount", "Bid amount must be a non-negative number.");
      return;
    }

    const effectiveTeamId = teamId ?? selectedTeamId ?? undefined;

    const common = {
      ...(effectiveTeamId ? { teamId: effectiveTeamId } : {}),
      ...(parsedBidPrice !== undefined ? { bidPrice: parsedBidPrice } : {}),
      ...(roleId ? { roleId } : {}),
      ...(parsedJersey !== undefined ? { jerseyNumber: parsedJersey } : {}),
      ...(jerseyName.trim() ? { jerseyName: jerseyName.trim() } : {}),
      ...(jerseySize ? { jerseySize } : {}),
    };

    addMutation.mutate(
      effectivePlayer.userId
        ? { userId: effectivePlayer.userId, ...common }
        : { phone: effectivePlayer.phone, name: effectivePlayer.name, ...common }
    );
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
            <Text style={styles.headerTitle}>Add player</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <SinglePersonField
              label="Player *"
              value={player}
              onChange={(p) => {
                setPlayer(p);
                if (p) {
                  setJerseyName((prev) => prev || p.name);
                } else {
                  setRoleId(null);
                  setJerseyNumber("");
                  setJerseyName("");
                  setJerseySize(null);
                }
              }}
              onPendingChange={setPendingPlayer}
              onPartialPhoneChange={setPartialPhone}
              onProfileFound={handleProfileFound}
            />

            {showTeamPicker && tournament && tournament.teams.length > 0 && (
              <OptionSelectField
                label="Team"
                options={tournament.teams.map((t) => ({ value: t.id, label: t.name }))}
                value={selectedTeamId}
                onChange={setSelectedTeamId}
              />
            )}

            {cricketRoles.length > 0 && (
              <OptionSelectField
                label="Role"
                options={cricketRoles.map((r) => ({ value: r.id, label: r.name }))}
                value={roleId}
                onChange={setRoleId}
              />
            )}

            <Text style={styles.fieldLabel}>Jersey number</Text>
            <TextInput
              value={jerseyNumber}
              onChangeText={setJerseyNumber}
              placeholder="e.g. 45"
              placeholderTextColor={AppColors.placeholder}
              style={styles.input}
              keyboardType="number-pad"
              returnKeyType="done"
            />

            <Text style={styles.fieldLabel}>Jersey name</Text>
            <TextInput
              value={jerseyName}
              onChangeText={setJerseyName}
              placeholder="e.g. JK"
              placeholderTextColor={AppColors.placeholder}
              style={styles.input}
              autoCorrect={false}
              autoCapitalize="characters"
              returnKeyType="done"
            />

            <OptionSelectField
              label="Jersey size"
              options={JERSEY_SIZES.map((s) => ({ value: s, label: s }))}
              value={jerseySize}
              onChange={setJerseySize}
            />

            {isAuction && (
              <>
                <Text style={styles.fieldLabel}>Bid amount</Text>
                <TextInput
                  value={bidPrice}
                  onChangeText={setBidPrice}
                  placeholder="e.g. 50000"
                  placeholderTextColor={AppColors.placeholder}
                  style={styles.input}
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
              </>
            )}

            <PrimaryButton
              title={addMutation.isPending ? "Saving…" : "Save"}
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={styles.submitBtn}
            />
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textDark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#C8E6D9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: AppColors.textDark,
    backgroundColor: AppColors.white,
    marginBottom: 16,
  },
  submitBtn: {
    marginTop: 8,
  },
});
