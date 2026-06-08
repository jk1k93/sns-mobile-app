import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo } from "react";
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

import { fetchVenues } from "@/api/venues";
import { DatePickerField } from "@/components/tournament/date-picker-field";
import { VenueSearchField } from "@/components/tournament/venue-search-field";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import { AppColors } from "@/constants/app-colors";
import { useAuth } from "@/contexts/auth-context";
import { useTournamentDraft } from "@/contexts/tournament-draft-context";
import { useHideTabBarWhileFocused } from "@/hooks/use-hide-tab-bar";

function parseIsoDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function TournamentCreateStep1Screen() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const draft = useTournamentDraft();
  useHideTabBarWhileFocused();

  const venuesQuery = useQuery({
    queryKey: ["venues"],
    queryFn: () => fetchVenues(accessToken!),
    enabled: Boolean(accessToken),
  });

  const startAsDate = useMemo(() => {
    if (!draft.draft.startDate) return undefined;
    return parseIsoDate(draft.draft.startDate) ?? undefined;
  }, [draft.draft.startDate]);

  const canContinue =
    draft.draft.name.trim().length > 0 &&
    draft.draft.startDate !== null &&
    draft.draft.endDate !== null &&
    draft.draft.venue !== null &&
    (() => {
      const a = parseIsoDate(draft.draft.startDate!);
      const b = parseIsoDate(draft.draft.endDate!);
      if (!a || !b) return false;
      return b.getTime() >= a.getTime();
    })();

  const onContinue = () => {
    if (!canContinue) return;
    Alert.alert(
      "Next step",
      "Additional tournament steps will be available in a future update.",
      [{ text: "OK" }]
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
            <Text style={styles.headerTitle}>Create tournament</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.stepTag}>Step 1 of 1</Text>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabel}>Tournament name</Text>
            <TextInput
              value={draft.draft.name}
              onChangeText={draft.setName}
              placeholder="e.g. Summer Open 2026"
              placeholderTextColor={AppColors.placeholder}
              style={styles.input}
            />

            <DatePickerField
              label="Start date"
              value={draft.draft.startDate}
              onChange={draft.setStartDate}
            />

            <DatePickerField
              label="End date"
              value={draft.draft.endDate}
              onChange={draft.setEndDate}
              minimumDate={startAsDate}
            />

            {venuesQuery.isPending ? (
              <Text style={styles.loadingVenues}>Loading venues…</Text>
            ) : null}

            <VenueSearchField
              venues={venuesQuery.data ?? []}
              value={draft.draft.venue}
              onChange={draft.setVenue}
              onAddNewVenue={() => router.push("/tournaments/add-venue")}
            />

            {venuesQuery.isError ? (
              <Text style={styles.errorText}>
                Could not load venues. Check your connection and try again.
              </Text>
            ) : null}

            <PrimaryButton
              title="Continue"
              onPress={onContinue}
              disabled={!canContinue}
              style={styles.continueBtn}
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
  errorText: {
    color: AppColors.error,
    fontSize: 14,
    marginBottom: 12,
  },
  loadingVenues: {
    fontSize: 14,
    color: AppColors.textMuted,
    marginBottom: 8,
  },
  continueBtn: {
    marginTop: 8,
  },
});
