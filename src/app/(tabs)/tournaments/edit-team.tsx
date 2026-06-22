import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

import { fetchTeam, updateTeam, type TeamUserSummary } from "@/api/teams";
import { SinglePersonField, type SelectedPerson } from "@/components/team/single-person-field";
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

function toSelectedPerson(u: TeamUserSummary): SelectedPerson {
  return { userId: u.id, name: u.name ?? u.phoneNumber, phone: u.phoneNumber };
}

export default function EditTeamScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tournamentId, teamId } = useLocalSearchParams<{ tournamentId: string; teamId: string }>();
  useHideTabBarWhileFocused();

  const { data: team, isLoading, isError } = useQuery({
    queryKey: ["team", tournamentId, teamId],
    queryFn: () => fetchTeam(tournamentId, teamId),
    enabled: !!tournamentId && !!teamId,
  });

  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [captain, setCaptain] = useState<SelectedPerson | null>(null);
  const [viceCaptain, setViceCaptain] = useState<SelectedPerson | null>(null);
  const [owner, setOwner] = useState<SelectedPerson | null>(null);
  const [pendingCaptain, setPendingCaptain] = useState<SelectedPerson | null>(null);
  const [pendingViceCaptain, setPendingViceCaptain] = useState<SelectedPerson | null>(null);
  const [pendingOwner, setPendingOwner] = useState<SelectedPerson | null>(null);
  const [partialCaptainPhone, setPartialCaptainPhone] = useState(false);
  const [partialViceCaptainPhone, setPartialViceCaptainPhone] = useState(false);
  const [partialOwnerPhone, setPartialOwnerPhone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (team && !initialized) {
      setName(team.name);
      setShortCode(team.shortCode ?? "");
      setLogoUrl(team.logoUrl ?? "");
      setCaptain(team.captain ? toSelectedPerson(team.captain) : null);
      setViceCaptain(team.viceCaptain ? toSelectedPerson(team.viceCaptain) : null);
      setOwner(toSelectedPerson(team.owner));
      setInitialized(true);
    }
  }, [team, initialized]);

  const hasPartialPhone = partialCaptainPhone || partialViceCaptainPhone || partialOwnerPhone;
  const canSubmit = name.trim().length > 0 && !hasPartialPhone && !isSubmitting;

  const handleSave = async () => {
    if (!canSubmit || !tournamentId || !teamId) return;

    const trimmedShortCode = shortCode.trim();
    if (trimmedShortCode && (trimmedShortCode.length < 2 || trimmedShortCode.length > 5)) {
      Alert.alert("Invalid short code", "Short code must be 2–5 characters.");
      return;
    }

    const toUserRef = (p: SelectedPerson) =>
      p.userId ?? { name: p.name, phone: p.phone };

    const effectiveCaptain = captain ?? pendingCaptain;
    const effectiveViceCaptain = viceCaptain ?? pendingViceCaptain;
    const effectiveOwner = owner ?? pendingOwner;

    setIsSubmitting(true);
    try {
      await updateTeam(tournamentId, teamId, {
        name: name.trim(),
        shortCode: trimmedShortCode || undefined,
        logoUrl: logoUrl.trim() || null,
        captain: effectiveCaptain ? toUserRef(effectiveCaptain) : null,
        viceCaptain: effectiveViceCaptain ? toUserRef(effectiveViceCaptain) : null,
        ...(effectiveOwner ? { owner: toUserRef(effectiveOwner) } : {}),
      });
      await queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      await queryClient.invalidateQueries({ queryKey: ["team", tournamentId, teamId] });
      router.back();
    } catch (e) {
      const message =
        e instanceof ApiError
          ? (parseApiErrorMessage(e.body) ?? e.message)
          : "Something went wrong. Please try again.";
      Alert.alert("Failed to save team", message);
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
            <Text style={styles.headerTitle} numberOfLines={1}>
              {team?.name ?? "Edit team"}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {isLoading && (
            <ActivityIndicator size="large" color={AppColors.primary} style={styles.centered} />
          )}

          {isError && (
            <View style={styles.centered}>
              <Text style={styles.errorText}>Failed to load team.</Text>
            </View>
          )}

          {initialized && (
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.fieldLabel}>
                Team name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Mumbai Strikers"
                placeholderTextColor={AppColors.placeholder}
                style={styles.input}
                autoCorrect={false}
                returnKeyType="done"
              />

              <Text style={styles.fieldLabel}>Short code</Text>
              <TextInput
                value={shortCode}
                onChangeText={setShortCode}
                placeholder="e.g. MUM (2–5 characters)"
                placeholderTextColor={AppColors.placeholder}
                style={styles.input}
                autoCorrect={false}
                autoCapitalize="characters"
                maxLength={5}
                returnKeyType="done"
              />

              <Text style={styles.fieldLabel}>Logo URL</Text>
              <TextInput
                value={logoUrl}
                onChangeText={setLogoUrl}
                placeholder="https://example.com/logo.png"
                placeholderTextColor={AppColors.placeholder}
                style={styles.input}
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType="url"
                returnKeyType="done"
              />

              <SinglePersonField
                label="Captain"
                value={captain}
                onChange={setCaptain}
                onPendingChange={setPendingCaptain}
                onPartialPhoneChange={setPartialCaptainPhone}
              />

              <SinglePersonField
                label="Vice-captain"
                value={viceCaptain}
                onChange={setViceCaptain}
                onPendingChange={setPendingViceCaptain}
                onPartialPhoneChange={setPartialViceCaptainPhone}
              />

              <SinglePersonField
                label="Owner"
                value={owner}
                onChange={setOwner}
                onPendingChange={setPendingOwner}
                onPartialPhoneChange={setPartialOwnerPhone}
              />

              <PrimaryButton
                title={isSubmitting ? "Saving…" : "Save"}
                onPress={handleSave}
                disabled={!canSubmit}
                style={styles.submitBtn}
              />
            </ScrollView>
          )}
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
    paddingBottom: 32,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textDark,
    marginBottom: 8,
  },
  required: {
    color: AppColors.primary,
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
