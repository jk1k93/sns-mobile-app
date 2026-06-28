import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
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

import { createTournament, updateTournament, type CreateTournamentPayload } from "@/api/tournaments";
import { ContactsField } from "@/components/tournament/contacts-field";
import { DatePickerField } from "@/components/tournament/date-picker-field";
import { VenueSearchField } from "@/components/tournament/venue-search-field";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import { AppColors } from "@/constants/app-colors";
import { useSelectedSport } from "@/contexts/selected-sport-context";
import { useTournamentDraft } from "@/contexts/tournament-draft-context";
import { useHideTabBarWhileFocused } from "@/hooks/use-hide-tab-bar";
import { ApiError } from "@/lib/api";
import { parseIsoDate } from "@/lib/date";

function parseApiErrorMessage(body?: string): string | undefined {
  if (!body) return undefined;
  try {
    const parsed = JSON.parse(body);
    return typeof parsed.error === "string" ? parsed.error : undefined;
  } catch {
    return undefined;
  }
}

export default function TournamentCreateStep1Screen() {
  const router = useRouter();
  const { selectedSportId } = useSelectedSport();
  const draft = useTournamentDraft();
  useHideTabBarWhileFocused();

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateTournamentPayload) => {
      const { tournamentId } = draft.draft;
      if (tournamentId) {
        await updateTournament(tournamentId, payload);
        return { id: tournamentId, name: payload.name };
      }
      const tournament = await createTournament(payload);
      return { id: tournament.id, name: payload.name };
    },
    onSuccess: ({ id, name }) => {
      draft.markSaved(id);
      router.replace({
        pathname: "/tournaments/sport-details",
        params: { tournamentId: id, tournamentName: name },
      });
    },
    onError: (e) => {
      const message =
        e instanceof ApiError
          ? (parseApiErrorMessage(e.body) ?? e.message)
          : "Something went wrong. Please try again.";
      Alert.alert(
        draft.draft.tournamentId ? "Failed to save changes" : "Failed to create tournament",
        message
      );
    },
  });

  const startAsDate = useMemo(() => {
    if (!draft.draft.startDate) return undefined;
    return parseIsoDate(draft.draft.startDate) ?? undefined;
  }, [draft.draft.startDate]);

  const regStartAsDate = useMemo(() => {
    if (!draft.draft.registrationStartDate) return undefined;
    return parseIsoDate(draft.draft.registrationStartDate) ?? undefined;
  }, [draft.draft.registrationStartDate]);

  const canContinue = useMemo(() => {
    const { name, venue, startDate, endDate, registrationStartDate, registrationEndDate } =
      draft.draft;

    if (!name.trim() || !venue) return false;

    if (startDate && endDate) {
      const a = parseIsoDate(startDate);
      const b = parseIsoDate(endDate);
      if (a && b && b.getTime() < a.getTime()) return false;
    }

    if (registrationStartDate && registrationEndDate) {
      const rs = parseIsoDate(registrationStartDate);
      const re = parseIsoDate(registrationEndDate);
      if (rs && re && re.getTime() < rs.getTime()) return false;
    }

    return true;
  }, [draft.draft]);

  const onContinue = () => {
    if (!canContinue || saveMutation.isPending) return;

    const { name, venue, startDate, endDate, registrationStartDate, registrationEndDate, description, contacts } =
      draft.draft;

    if (!venue || !selectedSportId) return;

    const contactsPayload = contacts.map((c) =>
      c.userId ? { userId: c.userId } : { name: c.name, phone: c.phone }
    );

    saveMutation.mutate({
      name: name.trim(),
      venueId: venue.id,
      sportId: selectedSportId,
      ...(startDate ? { tournamentStartDate: startDate } : {}),
      ...(endDate ? { tournamentEndDate: endDate } : {}),
      ...(registrationStartDate ? { registrationStartDate } : {}),
      ...(registrationEndDate ? { registrationEndDate } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(contactsPayload.length > 0 ? { contacts: contactsPayload } : {}),
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
            <Text style={styles.headerTitle}>Create tournament</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.stepTag}>Step 1 of 2</Text>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabel}>
              Tournament name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              value={draft.draft.name}
              onChangeText={draft.setName}
              placeholder="e.g. Summer Open 2026"
              placeholderTextColor={AppColors.placeholder}
              style={styles.input}
            />

            <VenueSearchField
              label={<>Tournament location <Text style={styles.required}>*</Text></>}
              value={draft.draft.venue}
              onChange={draft.setVenue}
              onAddNewVenue={() => router.push("/tournaments/add-venue")}
            />

            <DatePickerField
              label="Tournament start date"
              value={draft.draft.startDate}
              onChange={draft.setStartDate}
            />

            <DatePickerField
              label="Tournament end date"
              value={draft.draft.endDate}
              onChange={draft.setEndDate}
              minimumDate={startAsDate}
            />

            <DatePickerField
              label="Registration start date"
              value={draft.draft.registrationStartDate}
              onChange={draft.setRegistrationStartDate}
              maximumDate={startAsDate}
            />

            <DatePickerField
              label="Registration end date"
              value={draft.draft.registrationEndDate}
              onChange={draft.setRegistrationEndDate}
              minimumDate={regStartAsDate}
              maximumDate={startAsDate}
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              value={draft.draft.description}
              onChangeText={draft.setDescription}
              placeholder="Describe the tournament, rules, prizes…"
              placeholderTextColor={AppColors.placeholder}
              style={[styles.input, styles.descriptionInput]}
              multiline
              textAlignVertical="top"
            />

            <ContactsField
              contacts={draft.draft.contacts}
              onAdd={draft.addContact}
              onRemove={draft.removeContact}
            />

            <PrimaryButton
              title={
                draft.draft.tournamentId
                  ? saveMutation.isPending
                    ? "Saving…"
                    : "Continue"
                  : saveMutation.isPending
                    ? "Creating…"
                    : "Create tournament"
              }
              onPress={onContinue}
              disabled={!canContinue || saveMutation.isPending}
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
  descriptionInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  continueBtn: {
    marginTop: 8,
  },
});
