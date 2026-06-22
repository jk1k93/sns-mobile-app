import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

import { createPlayer, JERSEY_SIZES, type JerseySize } from "@/api/players";
import { fetchCricketRoles } from "@/api/cricket-roles";
import { OptionSelectField } from "@/components/tournament/option-select-field";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import { AppColors } from "@/constants/app-colors";
import { useAuth } from "@/contexts/auth-context";
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

export default function RegisterPlayerScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const { user } = useAuth();
  useHideTabBarWhileFocused();

  const [roleId, setRoleId] = useState<string | null>(null);
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [jerseySize, setJerseySize] = useState<JerseySize | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: cricketRoles = [] } = useQuery({
    queryKey: ["cricket-roles"],
    queryFn: () => fetchCricketRoles(true),
  });

  const handleSubmit = async () => {
    if (!tournamentId || !user?.id || isSubmitting) return;

    const parsedJersey = jerseyNumber.trim() ? parseInt(jerseyNumber.trim(), 10) : undefined;
    if (jerseyNumber.trim() && (isNaN(parsedJersey!) || parsedJersey! < 0)) {
      Alert.alert("Invalid jersey number", "Jersey number must be a non-negative number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPlayer(tournamentId, {
        playerId: user.id,
        ...(roleId ? { roleId } : {}),
        ...(parsedJersey !== undefined ? { jerseyNumber: parsedJersey } : {}),
        ...(jerseySize ? { jerseySize } : {}),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ["tournament-players", tournamentId] }),
      ]);
      router.back();
    } catch (e) {
      const message =
        e instanceof ApiError
          ? (parseApiErrorMessage(e.body) ?? e.message)
          : "Something went wrong. Please try again.";
      Alert.alert("Registration failed", message);
    } finally {
      setIsSubmitting(false);
    }
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
            <Text style={styles.headerTitle}>Register as player</Text>
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
              title={isSubmitting ? "Registering…" : "Register"}
              onPress={handleSubmit}
              disabled={isSubmitting}
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
