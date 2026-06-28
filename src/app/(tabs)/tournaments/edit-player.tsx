import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

import { fetchCricketRoles } from "@/api/cricket-roles";
import { JERSEY_SIZES, updatePlayer, type JerseySize } from "@/api/players";
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

export default function EditPlayerScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    tournamentId,
    tournamentPlayerId,
    currentRoleId,
    currentJerseyNumber,
    currentJerseySize,
    playerName,
  } = useLocalSearchParams<{
    tournamentId: string;
    tournamentPlayerId: string;
    sportId?: string;
    currentRoleId?: string;
    currentJerseyNumber?: string;
    currentJerseySize?: string;
    playerName?: string;
  }>();
  useHideTabBarWhileFocused();

  const [roleId, setRoleId] = useState<string | null>(currentRoleId ?? null);
  const [jerseyNumber, setJerseyNumber] = useState(currentJerseyNumber ?? "");
  const [jerseySize, setJerseySize] = useState<JerseySize | null>(
    (currentJerseySize as JerseySize) ?? null
  );
  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updatePlayer>[2]) =>
      updatePlayer(tournamentId, tournamentPlayerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-players", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      router.back();
    },
    onError: (e) => {
      const message =
        e instanceof ApiError
          ? (parseApiErrorMessage(e.body) ?? e.message)
          : "Something went wrong. Please try again.";
      Alert.alert("Failed to save", message);
    },
  });

  const { data: cricketRoles = [] } = useQuery({
    queryKey: ["cricket-roles"],
    queryFn: () => fetchCricketRoles(true),
  });

  // Re-sync if params change (navigation stack reuse)
  useEffect(() => {
    setRoleId(currentRoleId ?? null);
    setJerseyNumber(currentJerseyNumber ?? "");
    setJerseySize((currentJerseySize as JerseySize) ?? null);
  }, [currentRoleId, currentJerseyNumber, currentJerseySize]);

  const handleSubmit = () => {
    if (updateMutation.isPending) return;

    const parsedJersey = jerseyNumber.trim() ? parseInt(jerseyNumber.trim(), 10) : undefined;
    if (jerseyNumber.trim() && (isNaN(parsedJersey!) || parsedJersey! < 0)) {
      Alert.alert("Invalid jersey number", "Jersey number must be a non-negative number.");
      return;
    }

    updateMutation.mutate({
      roleId: roleId ?? null,
      jerseyNumber: parsedJersey ?? null,
      jerseySize: jerseySize ?? null,
    });
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
              {playerName ? `Edit · ${playerName}` : "Edit player"}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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

            <OptionSelectField
              label="Jersey size"
              options={JERSEY_SIZES.map((s) => ({ value: s, label: s }))}
              value={jerseySize}
              onChange={setJerseySize}
            />

            <PrimaryButton
              title={updateMutation.isPending ? "Saving…" : "Save"}
              onPress={handleSubmit}
              disabled={updateMutation.isPending}
              style={styles.submitBtn}
            />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
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
  submitBtn: { marginTop: 8 },
});
